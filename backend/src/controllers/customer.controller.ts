import type { Request } from "express";
import { Response } from "express";
import { getRepository } from "../config/database";
import { Customer } from "../entities/customer.entity";
import { Organization } from "../entities/organization.entity";
import { CustomerStatus } from "../interface/customer";
import { Not } from "typeorm";
import { MediaService } from "../services/media.service";
import { Order } from "../entities/order.entity";
import { OrderItem } from "../entities/order-item.entity";
import { Bill } from "../entities/bill.entity";
import { BillItem } from "../entities/bill-item.entity";
import type { CustomRequest } from "../middleware/auth.middleware";
import { v4 as uuidv4 } from "uuid";

// Define a custom request interface with the user property
// interface CustomRequest extends Request {
//   user?: any; // Using 'any' type to match the auth middleware
// }

export class CustomerController {
  /**
   * Helper to generate next sequential customer ID like CUST-001, CUST-002...
   */
  static async generateNextCustomerId(organizationId?: string): Promise<string> {
    const customerRepository = getRepository(Customer);

    const qb = customerRepository.createQueryBuilder("customer").select(["customer.cus_id"]);
    if (organizationId) {
      qb.where("customer.organizationId = :organizationId", { organizationId });
    }
    const allCustomers = await qb.getMany();

    const usedNumbers = new Set<number>();
    for (const c of allCustomers) {
      if (c.cus_id) {
        const match = c.cus_id.match(/CUST-(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num)) usedNumbers.add(num);
        }
      }
    }

    let nextNum = 1;
    while (usedNumbers.has(nextNum)) {
      nextNum++;
    }

    return `CUST-${String(nextNum).padStart(3, "0")}`;
  }

  /**
   * Helper to ensure all existing customers have clean sequential CUST-001 IDs
   */
  static async ensureSequentialCustomerIds(organizationId?: string): Promise<void> {
    try {
      const customerRepository = getRepository(Customer);
      const findOpts: any = { order: { createdAt: "ASC" } };
      if (organizationId) {
        findOpts.where = { organizationId };
      }
      const allCustomers = await customerRepository.find(findOpts);

      const usedNumbers = new Set<number>();
      for (const cust of allCustomers) {
        if (cust.cus_id && /^CUST-\d+$/i.test(cust.cus_id)) {
          const match = cust.cus_id.match(/CUST-(\d+)/i);
          if (match) {
            usedNumbers.add(parseInt(match[1], 10));
          }
        }
      }

      let counter = 1;
      for (const cust of allCustomers) {
        if (!cust.cus_id || !/^CUST-\d+$/i.test(cust.cus_id)) {
          while (usedNumbers.has(counter)) {
            counter++;
          }
          const newId = `CUST-${String(counter).padStart(3, "0")}`;
          cust.cus_id = newId;
          usedNumbers.add(counter);
          await customerRepository.save(cust);
          counter++;
        }
      }
    } catch (err) {
      console.warn("Could not ensure sequential customer IDs:", err);
    }
  }

  /**
   * Get all customers with pagination and filtering
   */
  static async getCustomers(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const organizationId = req.user?.organization?.id;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      // Extract query parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const gender = req.query.gender as string;
      const state = req.query.state as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const status = req.query.status as CustomerStatus;

      const customerRepository = getRepository(Customer);

      // Build query for organization's customers
      let queryBuilder = customerRepository
        .createQueryBuilder("customer")
        .where("customer.organizationId = :organizationId", { organizationId })
        .leftJoinAndSelect("customer.organization", "organization");

      // Apply filters if provided
      if (search) {
        queryBuilder = queryBuilder.andWhere(
          "(customer.name ILIKE :search OR " +
            "customer.phone ILIKE :search OR " +
            "customer.email ILIKE :search OR " +
            "customer.gstNumber ILIKE :search)",
          { search: `%${search}%` }
        );
      }

      if (gender) {
        queryBuilder = queryBuilder.andWhere("customer.gender = :gender", {
          gender,
        });
      }

      if (state) {
        queryBuilder = queryBuilder.andWhere("customer.state ILIKE :state", {
          state: `%${state}%`,
        });
      }

      if (status) {
        queryBuilder = queryBuilder.andWhere("customer.status = :status", {
          status,
        });
      }

      if (startDate) {
        queryBuilder = queryBuilder.andWhere(
          "customer.createdAt >= :startDate",
          {
            startDate: new Date(startDate),
          }
        );
      }

      if (endDate) {
        // Add one day to include the end date fully
        const endDatePlusOne = new Date(endDate);
        endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);

        queryBuilder = queryBuilder.andWhere("customer.createdAt < :endDate", {
          endDate: endDatePlusOne,
        });
      }

      // Get customers and total count in a single query
      let [customers, total] = await queryBuilder
        .orderBy("customer.createdAt", "DESC")
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      // Ensure any customer without sequential CUST-001 ID is updated
      const hasLegacyId = customers.some(
        (c) => !c.cus_id || !/^CUST-\d+$/i.test(c.cus_id)
      );
      if (hasLegacyId) {
        await CustomerController.ensureSequentialCustomerIds(organizationId);
        [customers, total] = await queryBuilder
          .orderBy("customer.createdAt", "DESC")
          .skip((page - 1) * limit)
          .take(limit)
          .getManyAndCount();
      }

      // Fetch outstanding balances for these customers from Bill entity
      const customerIds = customers.map((c) => c.id);
      let customerOutstandingMap: Record<string, number> = {};

      if (customerIds.length > 0) {
        try {
          const billRepository = getRepository(Bill);
          const outstandingRows = await billRepository
            .createQueryBuilder("bill")
            .select("bill.customerId", "customerId")
            .addSelect("SUM(bill.amountRemaining)", "outstanding")
            .where("bill.organizationId = :organizationId", { organizationId })
            .andWhere("bill.customerId IN (:...customerIds)", { customerIds })
            .andWhere("bill.billType = :billType", { billType: "sales" })
            .andWhere("bill.paymentStatus != :paidStatus", { paidStatus: "paid" })
            .groupBy("bill.customerId")
            .getRawMany();

          outstandingRows.forEach((row) => {
            if (row.customerId) {
              customerOutstandingMap[row.customerId] = parseFloat(row.outstanding || "0");
            }
          });
        } catch (err) {
          console.warn("Could not calculate customer outstanding map:", err);
        }
      }

      const enhancedCustomers = customers.map((c) => {
        const creditLimit = Number(c.creditLimit) || 0;
        const usedCredit = customerOutstandingMap[c.id] || 0;
        const availableCredit = creditLimit > 0 ? Math.max(0, creditLimit - usedCredit) : 0;
        return {
          ...c,
          usedCredit,
          totalOutstanding: usedCredit,
          availableCredit,
        };
      });

      res.json({
        customers: enhancedCustomers,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Error fetching customers" });
    }
  }

  /**
   * Get customer by ID
   */
  static async getCustomerById(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const organizationId = req.user?.organization?.id;
      const { id } = req.params;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      const customerRepository = getRepository(Customer);
      const orderRepository = getRepository(Order);

      // Find customer by ID and ensure it belongs to the user's organization
      let customer = await customerRepository.findOne({
        where: { id, organizationId },
        relations: ["organization"],
      });

      if (!customer) {
        res.status(404).json({ message: "Customer not found" });
        return;
      }

      if (!customer.cus_id || !/^CUST-\d+$/i.test(customer.cus_id)) {
        await CustomerController.ensureSequentialCustomerIds(organizationId);
        customer =
          (await customerRepository.findOne({
            where: { id, organizationId },
            relations: ["organization"],
          })) || customer;
      }

      // Get customer's orders with product details
      const orders = await orderRepository.find({
        where: { customerId: id, organizationId },
        relations: ["items", "items.product"], // Include product details
        order: { orderDate: "DESC" },
        take: 10, // Limit to recent 10 orders
      });

      // Calculate order statistics
      const totalOrders = await orderRepository.count({
        where: { customerId: id, organizationId },
      });

      const totalSpent = await orderRepository
        .createQueryBuilder("order")
        .select("SUM(order.total)", "sum")
        .where("order.customerId = :customerId", { customerId: id })
        .andWhere("order.organizationId = :organizationId", { organizationId })
        .getRawOne()
        .then((result) => parseFloat(result?.sum || "0"));

      // Last order date
      const lastOrder = await orderRepository.findOne({
        where: { customerId: id, organizationId },
        order: { orderDate: "DESC" },
      });

      // Get recent products purchased
      const allOrderItems = orders.flatMap((order) => order.items || []);

      // Create a map to track unique products and their purchase frequency
      const productMap = new Map();

      allOrderItems.forEach((item) => {
        if (item.productId) {
          if (!productMap.has(item.productId)) {
            productMap.set(item.productId, {
              productId: item.productId,
              productName:
                item.productName || item.product?.name || "Unknown Product",
              count: parseInt(item.quantity.toString()),
              totalSpent: parseFloat(
                (item.quantity * item.unitPrice).toString()
              ),
              lastPurchased: item.order?.orderDate || new Date(),
              image: item.product?.imageUrl || item.productImageUrl || null,
            });
          } else {
            const existingProduct = productMap.get(item.productId);
            existingProduct.count += parseInt(item.quantity.toString());
            existingProduct.totalSpent += parseFloat(
              (item.quantity * item.unitPrice).toString()
            );

            // Update last purchased date if this order is more recent
            if (
              item.order?.orderDate &&
              existingProduct.lastPurchased < item.order.orderDate
            ) {
              existingProduct.lastPurchased = item.order.orderDate;
            }
          }
        }
      });

      // Convert map to array and sort by count (most purchased first)
      const recentProducts = Array.from(productMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Limit to top 5 products

      // Calculate customer outstanding and available credit from Bill entity
      let totalOutstanding = 0;
      try {
        const billRepository = getRepository(Bill);
        const outstandingResult = await billRepository
          .createQueryBuilder("bill")
          .select("SUM(bill.amountRemaining)", "sum")
          .where("bill.customerId = :customerId", { customerId: id })
          .andWhere("bill.organizationId = :organizationId", { organizationId })
          .andWhere("bill.billType = :billType", { billType: "sales" })
          .andWhere("bill.paymentStatus != :paidStatus", { paidStatus: "paid" })
          .getRawOne();
        totalOutstanding = parseFloat(outstandingResult?.sum || "0");
      } catch (err) {
        console.warn("Could not calculate customer outstanding:", err);
      }

      const creditLimit = Number(customer.creditLimit) || 0;
      const openingBalance = Number(customer.openingBalance) || 0;
      const availableCredit = creditLimit > 0 ? Math.max(0, creditLimit - totalOutstanding) : 0;

      // Add some computed values for the frontend
      const enhancedCustomer = {
        ...customer,
        totalOrders: totalOrders || 0,
        totalSpent: totalSpent || 0,
        lastOrderDate: lastOrder?.orderDate || null,
        // Add default values for fields that might be null
        status: customer.status || CustomerStatus.ACTIVE,
        creditLimit,
        openingBalance,
        totalOutstanding,
        usedCredit: totalOutstanding,
        availableCredit,
        paymentTerms: customer.paymentTerms || "Net 30",
        // Include detailed recent orders data with item details
        recentOrders: orders.map((order) => ({
          id: order.id,
          orderDate: order.orderDate,
          status: order.status,
          paymentStatus: order.paymentStatus,
          total: order.total,
          items:
            order.items?.map((item: any) => ({
              id: item.id,
              productId: item.productId,
              productName:
                item.productName || item.product?.name || "Unknown Product",
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
              productImage: item.product?.imageUrl || null,
            })) || [],
          itemCount: order.items?.length || 0,
        })),
        // Add recently purchased products summary
        recentProducts,
      };

      res.json(enhancedCustomer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ message: "Error fetching customer" });
    }
  }

  /**
   * Create a new customer with optional image upload
   */
  static async createCustomer(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const organizationId = req.user?.organization?.id;

      const customerData = req.body;

      // Normalize name and phone from the extensive form fields
      const name =
        customerData.name ||
        customerData.displayName ||
        customerData.companyName ||
        `${customerData.firstName || ""} ${customerData.lastName || ""}`.trim();
      const phone =
        customerData.phone ||
        customerData.mobile ||
        customerData.workPhone;

      // Validate required fields
      if (!name || !phone) {
        res
          .status(400)
          .json({ message: "Name/Display Name and Phone/Mobile are required" });
        return;
      }

      customerData.name = name;
      customerData.phone = phone;

      // Use mediaUrl from middleware if present
      if ((req as any).mediaUrl) {
        customerData.image = (req as any).mediaUrl;
      }

      // Generate sequential cus_id like CUST-001, CUST-002...
      const cus_id = await CustomerController.generateNextCustomerId(organizationId);

      // Initialize customer repository
      const customerRepository = getRepository(Customer);

      // Create new customer
      const customer = customerRepository.create({
        ...customerData,
        cus_id, // set the prefixed cus_id
        organizationId,
        status: customerData.status || CustomerStatus.NEW,
        totalOrders: 0,
        totalSpent: 0,
      });

      await customerRepository.save(customer);

      res.status(201).json({
        message: "Customer created successfully",
        customer,
      });
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(500).json({ message: "Error creating customer" });
    }
  }

  /**
   * Update customer with optional image upload
   */
  static async updateCustomer(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const customerRepository = getRepository(Customer);
      const { id } = req.params;
      const updates = req.body;

      // Find the customer
      const customer = await customerRepository.findOne({ where: { id } });
      if (!customer) {
        res.status(404).json({ message: "Customer not found" });
        return;
      }

      // Use mediaUrl from middleware if present
      if ((req as any).mediaUrl) {
        updates.image = (req as any).mediaUrl;
      }

      // Sync name & phone if extensive form fields are provided
      if (updates.displayName || updates.companyName || updates.firstName) {
        updates.name =
          updates.displayName ||
          updates.companyName ||
          `${updates.firstName || ""} ${updates.lastName || ""}`.trim() ||
          updates.name ||
          customer.name;
      }
      if (updates.mobile || updates.workPhone) {
        updates.phone = updates.mobile || updates.workPhone || updates.phone || customer.phone;
      }

      // Update customer fields
      Object.assign(customer, updates);

      if (updates.creditLimit !== undefined) {
        customer.creditLimit = parseFloat(updates.creditLimit) || 0;
      }
      if (updates.openingBalance !== undefined) {
        customer.openingBalance = parseFloat(updates.openingBalance) || 0;
      }

      await customerRepository.save(customer);

      res.json({ customer });
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(500).json({ message: "Error updating customer" });
    }
  }

  /**
   * Delete customer
   */
  static async deleteCustomer(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const organizationId = req.user?.organization?.id;
      const { id } = req.params;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      // Find customer by ID and ensure it belongs to the user's organization
      const customerRepository = getRepository(Customer);
      const customer = await customerRepository.findOne({
        where: { id, organizationId },
      });

      if (!customer) {
        res.status(404).json({ message: "Customer not found" });
        return;
      }

      // Check for existing orders referencing this customer
      const orderRepository = getRepository(
        require("../entities/order.entity").Order
      );
      const orderCount = await orderRepository.count({
        where: { customerId: id },
      });
      if (orderCount > 0) {
        res.status(409).json({
          message:
            "Cannot delete customer: There are existing orders linked to this customer.",
        });
        return;
      }

      // Unlink customer from bills so foreign key constraint is not violated
      try {
        const billRepository = getRepository(
          require("../entities/bill.entity").Bill
        );
        await billRepository.update({ customerId: id }, { customerId: null as any });
      } catch (unlinkErr) {
        console.warn("Could not unlink bills for customer:", unlinkErr);
      }

      // Delete customer
      await customerRepository.remove(customer);

      res.json({ message: "Customer deleted successfully" });
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ message: "Error deleting customer" });
    }
  }

  /**
   * Delete customer and all their orders (and order items) in a transaction
   */
  static async forceDeleteCustomerWithOrders(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const organizationId = req.user?.organization?.id;
      const { id } = req.params;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      const customerRepository = getRepository(Customer);
      const orderRepository = getRepository(Order);
      const orderItemRepository = getRepository(OrderItem);
      const billRepository = getRepository(Bill);
      const billItemRepository = getRepository(BillItem);

      // Find customer
      const customer = await customerRepository.findOne({
        where: { id, organizationId },
      });

      if (!customer) {
        res.status(404).json({ message: "Customer not found" });
        return;
      }

      // Get all orders for this customer
      const orders = await orderRepository.find({
        where: { customerId: id, organizationId },
      });

      // Get all bills for this customer
      const bills = await billRepository.find({
        where: { customerId: id, organizationId },
      });

      // Start transaction
      const connection = orderRepository.manager.connection;
      const queryRunner = connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Delete all order items for each order
        for (const order of orders) {
          await queryRunner.manager.delete(OrderItem, { orderId: order.id });
        }
        // Delete all orders for this customer
        await queryRunner.manager.delete(Order, {
          customerId: id,
          organizationId,
        });

        // Delete all bill items for each bill
        for (const bill of bills) {
          await queryRunner.manager.delete(BillItem, { billId: bill.id });
        }
        // Delete all bills for this customer
        await queryRunner.manager.delete(Bill, {
          customerId: id,
          organizationId,
        });

        // Delete the customer
        await queryRunner.manager.delete(Customer, { id, organizationId });

        await queryRunner.commitTransaction();
        res.json({
          message: "Customer, their orders, and bills deleted successfully",
        });
      } catch (err) {
        await queryRunner.rollbackTransaction();
        res
          .status(500)
          .json({
            message: "Error deleting customer and related data",
            error: err instanceof Error ? err.message : String(err),
          });
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      console.error("Error force deleting customer and related data:", error);
      res
        .status(500)
        .json({ message: "Error force deleting customer and related data" });
    }
  }

  /**
   * Get customer statistics
   */
  static async getCustomerStats(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const organizationId = req.user?.organization?.id;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      const customerRepository = getRepository(Customer);

      // Get total count
      const totalCustomers = await customerRepository.count({
        where: { organizationId },
      });

      // Get counts by status
      const activeCustomers = await customerRepository.count({
        where: { organizationId, status: CustomerStatus.ACTIVE },
      });

      const newCustomers = await customerRepository.count({
        where: { organizationId, status: CustomerStatus.NEW },
      });

      const inactiveCustomers = await customerRepository.count({
        where: { organizationId, status: CustomerStatus.INACTIVE },
      });

      // Get customers by state
      const customersByState = await customerRepository
        .createQueryBuilder("customer")
        .select("customer.state", "state")
        .addSelect("COUNT(customer.id)", "count")
        .where("customer.organizationId = :organizationId", { organizationId })
        .andWhere("customer.state IS NOT NULL")
        .groupBy("customer.state")
        .getRawMany();

      // Get top customers by spend
      const topCustomers = await customerRepository.find({
        where: { organizationId },
        order: { totalSpent: "DESC" },
        take: 5,
      });

      res.json({
        totalCustomers,
        activeCustomers,
        newCustomers,
        inactiveCustomers,
        customersByState,
        topCustomers,
      });
    } catch (error) {
      console.error("Error fetching customer stats:", error);
      res.status(500).json({ message: "Error fetching customer statistics" });
    }
  }
}
