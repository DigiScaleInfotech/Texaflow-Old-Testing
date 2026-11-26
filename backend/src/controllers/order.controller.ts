import { Request, Response } from "express";
import { getRepository } from "../config/database";
import { Order } from "../entities/order.entity";
import { OrderItem } from "../entities/order-item.entity";
import { Customer } from "../entities/customer.entity";
import { Product } from "../entities/product.entity";
import { Bill } from "../entities/bill.entity";
import { BillItem } from "../entities/bill-item.entity";
import { InvoiceSettings } from "../entities/invoice-settings.entity";
import { OrderStatus, PaymentStatus } from "../interface/order";
import { BillType, BillStatus } from "../interface/bill";
import { v4 as uuidv4 } from "uuid";
import { BillService } from "../services/bill.service";
import { CustomerController } from "./customer.controller";

// Define custom request interface with user property
interface CustomRequest extends Request {
  user?: any;
}

// Add interface for trend calculations
interface TrendData {
  current: number;
  previous: number;
  percentChange: number;
  isPositive: boolean;
}

export class OrderController {
  /**
   * Get all orders with pagination and filtering
   */
  static async getOrders(req: CustomRequest, res: Response): Promise<void> {
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
      const statusParam = req.query.status as string;
      const paymentStatus = req.query.paymentStatus as PaymentStatus;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const minAmount = req.query.minAmount
        ? parseFloat(req.query.minAmount as string)
        : undefined;
      const maxAmount = req.query.maxAmount
        ? parseFloat(req.query.maxAmount as string)
        : undefined;
      const customerId = req.query.customerId as string;

      // Log the parsed parameters for debugging
      console.log("Filter parameters:", {
        status: req.query.status,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        minAmount,
        maxAmount,
        search: req.query.search,
        customerId: req.query.customerId,
      });

      // Get repository
      const orderRepository = getRepository(Order);
      const productRepository = getRepository(Product);

      // Build query for organization's orders
      let queryBuilder = orderRepository
        .createQueryBuilder("order")
        .leftJoinAndSelect("order.customer", "customer")
        .leftJoinAndSelect("order.items", "items")
        .leftJoinAndSelect("items.product", "product") // Add join to product to get images
        .where("order.organizationId = :organizationId", { organizationId });

      // Apply filters if provided
      if (search) {
        queryBuilder = queryBuilder.andWhere(
          "(customer.name ILIKE :search OR " +
            "customer.email ILIKE :search OR " +
            "customer.phone ILIKE :search)",
          { search: `%${search}%` }
        );
      }

      if (customerId) {
        queryBuilder = queryBuilder.andWhere("order.customerId = :customerId", {
          customerId,
        });
      }

      // Fix for status filter - Handle multiple status values properly
      if (statusParam) {
        const statuses = statusParam.split(",");

        if (statuses.length === 1) {
          // Single status - use equals
          queryBuilder = queryBuilder.andWhere("order.status = :status", {
            status: statuses[0],
          });
        } else if (statuses.length > 1) {
          // Multiple statuses - use IN operator
          queryBuilder = queryBuilder.andWhere(
            "order.status IN (:...statuses)",
            {
              statuses: statuses,
            }
          );
        }
      }

      if (paymentStatus) {
        queryBuilder = queryBuilder.andWhere(
          "order.paymentStatus = :paymentStatus",
          {
            paymentStatus,
          }
        );
      }

      if (startDate) {
        queryBuilder = queryBuilder.andWhere("order.orderDate >= :startDate", {
          startDate: new Date(startDate),
        });
      }

      if (endDate) {
        // Add one day to include the end date fully
        const endDatePlusOne = new Date(endDate);
        endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);

        queryBuilder = queryBuilder.andWhere("order.orderDate < :endDate", {
          endDate: endDatePlusOne,
        });
      }

      // Add amount range filters - handle NaN cases
      if (minAmount !== undefined && !isNaN(minAmount)) {
        console.log(`Adding minAmount filter: ${minAmount}`);
        queryBuilder = queryBuilder.andWhere("order.total >= :minAmount", {
          minAmount,
        });
      }

      if (maxAmount !== undefined && !isNaN(maxAmount)) {
        console.log(`Adding maxAmount filter: ${maxAmount}`);
        queryBuilder = queryBuilder.andWhere("order.total <= :maxAmount", {
          maxAmount,
        });
      }

      // Get orders and total count in a single query
      const [orders, total] = await queryBuilder
        .orderBy("order.orderDate", "DESC")
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      // Enhance orders with product image data from joined relation
      const enhancedOrders = orders.map((order) => {
        if (order.items && order.items.length > 0) {
          for (const item of order.items) {
            if (!item.productImageUrl && item.product) {
              item.productImageUrl =
                item.product.imageUrl || item.product.image || null;
            }
          }
        }
        return order;
      });

      res.json({
        orders: enhancedOrders,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Error fetching orders" });
    }
  }

  /**
   * Create a new order
   */
  static async createOrder(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const organizationId = req.user?.organization?.id;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      const orderData = req.body;
      // Extract GST application flag and rate
      const applyGst =
        orderData.applyGst !== undefined ? orderData.applyGst : true;
      // If GST is not applied, force tax to zero regardless of what was sent
      if (!applyGst && orderData.tax > 0) {
        orderData.tax = 0;
      }
      const gstRateFromClient = orderData.gstRate || 18; // Default to 18% if not provided

      // Handle manually entered customer details case
      if (!orderData.customerId && orderData.customerName) {
        console.log("Creating temporary customer for manually entered details");

        try {
          // Create a temporary customer record
          const customerRepository = getRepository(Customer);

          // Generate customer_id with sequential CUST-001 format
          const cus_id = await CustomerController.generateNextCustomerId(organizationId);

          const tempCustomer = customerRepository.create({
            name: orderData.customerName,
            email: orderData.customerEmail || "",
            phone: orderData.customerPhone || "",
            address: orderData.shippingAddress || "",
            city: orderData.shippingCity || "",
            district: orderData.shippingDistrict || "",
            town: orderData.shippingTown || "",
            state: orderData.shippingState || "",
            postalCode: orderData.shippingZip || "",
            country: orderData.shippingCountry || "India",
            status: "NEW", // Default status
            organizationId: organizationId,
            isTemporary: true, // Flag this as a temporary customer
            notes: "Auto-created from order form",
            cus_id: cus_id, // Add the prefixed customer_id
          });

          // Save the temporary customer
          const savedCustomer = await customerRepository.save(tempCustomer);
          console.log(
            `Created temporary customer with ID: ${savedCustomer.id}`
          );

          // Use the newly created customer ID
          orderData.customerId = savedCustomer.id;
        } catch (customerError) {
          console.error("Error creating temporary customer:", customerError);
          res.status(500).json({
            message: "Failed to create temporary customer record",
            error:
              customerError instanceof Error
                ? customerError.message
                : String(customerError),
          });
          return;
        }
      }

      // Validate customer ID - now required for all orders
      if (!orderData.customerId || typeof orderData.customerId !== "string") {
        res.status(400).json({ message: "Customer ID is required" });
        return;
      }

      // Clean the customer ID to ensure it's a valid UUID format
      const customerId = orderData.customerId.replace(/[{}'"]/g, "");

      // Create the order
      const orderRepository = getRepository(Order);
      const orderItemRepository = getRepository(OrderItem);

      // Generate clean short order_id
      const order_id = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

      // Extract order properties without items to prevent automatic creation
      const {
        items: itemsFromData,
        applyGst: gstFlag,
        ...orderDataWithoutItems
      } = orderData;

      // Create the order with cleaned customerId but without items
      const order = orderRepository.create({
        ...orderDataWithoutItems,
        or_id: order_id, // set the prefixed order_id
        customerId: customerId,
        organizationId,
        createdById: userId,
        // Set default values for enum fields if not provided
        status: orderData.status || "pending",
        paymentStatus: orderData.paymentStatus || "pending",
      });

      const savedOrder = (await orderRepository.save(order)) as any;

      // Create order items and track total amount
      let orderTotal = 0;
      let processedItems = [];

      // Process items only once, directly from request body
      if (itemsFromData && itemsFromData.length > 0) {
        // Create a set to track items we've already processed
        const processedProductIds = new Set();

        processedItems = await Promise.all(
          itemsFromData.map(async (item: any) => {
            // Clean the product ID to ensure it's a valid UUID
            const productId = item.productId
              ? item.productId.replace(/[{}'"]/g, "")
              : null;

            // Skip if we've already processed this product or if productId is missing
            if (!productId || processedProductIds.has(productId)) {
              console.log(
                `Skipping duplicate or invalid product: ${
                  productId || "unknown"
                }`
              );
              return null;
            }

            // Mark as processed
            processedProductIds.add(productId);

            // Validate product exists
            const productRepository = getRepository(Product);
            const product = (await productRepository.findOne({
              where: { id: productId },
            })) as any;

            if (!product) {
              throw new Error(`Product not found with ID: ${productId}`);
            }

            // Calculate item price and add to total
            const quantity = item.quantity || 1;
            const unitPrice = parseFloat(item.unitPrice) || product.price || 0;
            const itemTotal = unitPrice * quantity;
            orderTotal += itemTotal;

            // Extract weight value properly - handle both object format and simple number
            let weightValue = 0;
            if (item.weight) {
              if (
                typeof item.weight === "object" &&
                item.weight.value !== undefined
              ) {
                weightValue = Number(item.weight.value) || 0;
              } else {
                weightValue = Number(item.weight) || 0;
              }
            } else if (product.weight) {
              if (
                typeof product.weight === "object" &&
                product.weight.value !== undefined
              ) {
                weightValue = Number(product.weight.value) || 0;
              } else {
                weightValue = Number(product.weight) || 0;
              }
            }

            // Create the order item with carton and weight fields
            const orderItem = orderItemRepository.create({
              orderId: savedOrder.id,
              productId: productId,
              productName: product.name || item.name || "Unknown Product", // Use product name from DB or request
              quantity: quantity,
              carton: item.carton || 0,
              weight: weightValue, // Use the extracted weight value
              unitPrice: unitPrice,
              total: itemTotal,
              notes: item.notes,
            });

            return orderItem;
          })
        );

        // Filter out any null items (duplicates we skipped)
        const validItems = processedItems.filter((item: any) => item !== null);

        // Save order items if there are any valid ones
        if (validItems.length > 0) {
          await orderItemRepository.save(validItems);
        }
      }

      // Update order with total
      savedOrder.total = orderTotal;
      await orderRepository.save(savedOrder);

      // Get the organization's invoice settings to apply correct GST rate
      const invoiceSettingsRepo = getRepository(InvoiceSettings);
      const orgInvoiceSettings = await invoiceSettingsRepo.findOne({
        where: { organizationId },
      });

      // Use settings from database if available, otherwise use rate from client
      const gstRate = orgInvoiceSettings?.gstRate || gstRateFromClient;

      // Create a sales bill for this order
      try {
        // Get customer details for the bill
        const customerRepository = getRepository(Customer);
        const customer = await customerRepository.findOne({
          where: { id: customerId },
        });

        if (customer) {
          // Convert order items to bill items
          const billItems = processedItems
            .filter((item: any) => item !== null)
            .map((item: any) => {
              // Extract weight value properly for bill items
              let weightValue = 0;
              if (item.weight) {
                if (
                  typeof item.weight === "object" &&
                  item.weight.value !== undefined
                ) {
                  weightValue = Number(item.weight.value) || 0;
                } else {
                  weightValue = Number(item.weight) || 0;
                }
              }

              return {
                productId: item.productId,
                description: item.productName,
                quantity: item.quantity,
                carton: item.carton || 0,
                weight: weightValue, // Use the extracted weight value
                unitPrice: item.unitPrice || item.price || 0,
                total: item.total,
              };
            });

          // Prepare billing address from order's shipping address with all components
          let billingAddress = null;
          if (orderData.shippingAddress) {
            billingAddress = {
              street: orderData.shippingAddress || "",
              city: orderData.shippingCity || "",
              district: orderData.shippingDistrict || "",
              town: orderData.shippingTown || "",
              state: orderData.shippingState || "",
              zip: orderData.shippingZip || "",
              country: orderData.shippingCountry || "India",
            };
          } else if (customer.address) {
            // Fall back to customer address only if shipping address is not provided
            billingAddress = {
              street: customer.address || "",
              city: customer.city || "",
              district: customer.district || "",
              town: customer.town || "",
              state: customer.state || "",
              zip: customer.postalCode || "",
              country: customer.country || "India",
            };
          }

          // Create bill data with dynamic GST rate (ensuring tax is 0 when GST is not applied)
          const billData = {
            customerId: customerId,
            customerName: customer.name,
            customerEmail: customer.email || "", // Make email optional by ensuring it's never null
            customerPhone: customer.phone,
            companyName: customer.companyName || "",
            invoiceId: savedOrder.id, // Link to order ID
            billType: BillType.SALES, // Use enum instead of string literal "SALES"
            billingAddress,
            subtotal: orderTotal,
            tax: applyGst ? orderTotal * (gstRate / 100) : 0,
            discount: 0,
            total: applyGst ? orderTotal * (1 + gstRate / 100) : orderTotal,
            amountPaid: 0, // Initially unpaid
            amountRemaining: applyGst
              ? orderTotal * (1 + gstRate / 100)
              : orderTotal,
            paymentStatus: "unpaid", // Match the PaymentStatus enum in OrderStatus
            paymentMethod: orderData.paymentMethod,
            notes: orderData.notes || "Auto-generated from order",
            items: billItems,
            organizationId,
            createdById: userId,
          };

          // Create the bill
          const bill = await BillService.createBill(billData);
          console.log(
            `Created sales bill ${bill.billNumber} for order ${savedOrder.id}`
          );

          // Link the bill to the order
          savedOrder.billId = bill.id;
          await orderRepository.save(savedOrder);
        }
      } catch (billError) {
        // Log error but don't fail the order creation if bill creation fails
        console.error("Error creating sales bill for order:", billError);
      }

      // Return the created order
      res.status(201).json({
        message: "Order created successfully",
        order: {
          ...savedOrder,
          items: processedItems.filter((item: any) => item !== null),
        },
      });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({
        message: "Error creating order",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get order by ID
   */
  static async getOrderById(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const organizationId = req.user?.organization?.id;
      const { id } = req.params;

      const orderRepository = getRepository(Order);
      const productRepository = getRepository(Product);

      // Try to find by id (UUID) or order_id (string with prefix)
      let order = await orderRepository.findOne({
        where: [
          { id, organizationId },
          { or_id: id, organizationId },
        ],
        relations: ["customer", "items", "createdBy"],
      });

      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      // Enhance order with product image data
      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          if (item.productId && !item.productImageUrl) {
            // Get product for image if not already included
            const product = await productRepository.findOne({
              where: { id: item.productId },
            });

            if (product) {
              // Add image URL from product
              item.productImageUrl = product.imageUrl || product.image || null;
              item.productName =
                product.name || item.productName || "Unknown Product"; // Use product name from DB or request
            }
          }
        }
      }

      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Error fetching order" });
    }
  }

  /**
   * Update order
   */
  static async updateOrder(req: CustomRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        applyGst,
        orderDate,
        deliveryDate,
        shippingAddress,
        paymentMethod,
        notes,
        status,
        paymentStatus,
        items,
      } = req.body;

      // If GST is not applied, ensure tax is zero
      if (applyGst === false && req.body.tax > 0) {
        req.body.tax = 0;
      }

      console.log("Starting order update process for ID:", id);
      console.log(
        "Incoming shipping address data:",
        shippingAddress,
        req.body.shippingAddress
      );

      // Get a database connection to use for transaction
      const connection = getRepository(Order).manager.connection;
      const queryRunner = connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const orderRepository = queryRunner.manager.getRepository(Order);
        const organizationId = req.user?.organization?.id;

        // Find the order
        const order = await orderRepository.findOne({
          where: { id, organizationId },
        });

        if (!order) {
          res.status(404).json({ message: "Order not found" });
          await queryRunner.rollbackTransaction();
          await queryRunner.release();
          return;
        }

        console.log("Found order:", order.id);

        // Update order fields
        if (orderDate) order.orderDate = new Date(orderDate);
        if (deliveryDate) order.deliveryDate = new Date(deliveryDate);

        // Explicitly handle shippingAddress separately from other address fields
        // Access shippingAddress directly from req.body to ensure it's captured
        if (req.body.shippingAddress !== undefined) {
          order.shippingAddress = req.body.shippingAddress;
        }

        // Update all other shipping address fields individually
        if (shippingAddress) {
          // Only update these if coming from an address object
          if (typeof shippingAddress === "object") {
            order.shippingCity =
              shippingAddress.city ||
              req.body.shippingCity ||
              order.shippingCity;
            order.shippingDistrict =
              shippingAddress.district ||
              req.body.shippingDistrict ||
              order.shippingDistrict;
            order.shippingTown =
              shippingAddress.town ||
              req.body.shippingTown ||
              order.shippingTown;
            order.shippingState =
              shippingAddress.state ||
              req.body.shippingState ||
              order.shippingState;
            order.shippingZip =
              shippingAddress.postalCode ||
              shippingAddress.zip ||
              req.body.shippingZip ||
              order.shippingZip;
            order.shippingCountry =
              shippingAddress.country ||
              req.body.shippingCountry ||
              order.shippingCountry ||
              "India";
          }
        }

        if (paymentMethod) order.paymentMethod = paymentMethod;
        if (notes !== undefined) order.notes = notes;
        if (status) order.status = status;
        if (paymentStatus) order.paymentStatus = paymentStatus;

        // Save the order with basic details first
        await queryRunner.manager.save(order);

        // Skip order items update if no items provided
        if (items && items.length > 0) {
          // Delete existing items using direct SQL
          await queryRunner.query(
            `DELETE FROM "order_items" WHERE "orderId" = $1`,
            [id]
          );
          console.log("Deleted existing order items");

          let totalAmount = 0;

          // Insert new items one by one using direct SQL
          for (const item of items) {
            const { productId, quantity, price, carton } = item;

            if (!productId) {
              console.warn("Skipping item without productId:", item);
              continue;
            }

            const qty = Number(quantity) || 1;
            const unitPrice = Number(price) || 0;
            const total = unitPrice * qty;

            // Extract weight value properly - handle both object format and simple number
            let weightValue = 0;
            if (item.weight) {
              if (
                typeof item.weight === "object" &&
                item.weight.value !== undefined
              ) {
                weightValue = Number(item.weight.value) || 0;
              } else {
                weightValue = Number(item.weight) || 0;
              }
            }

            // Process carton value - ensure it's a number
            const cartonValue = Number(carton) || 0;

            // Generate a proper UUID
            const itemId = uuidv4();

            // Insert without relying on entity management - now including carton and weight
            await queryRunner.query(
              `INSERT INTO "order_items" 
               ("id", "orderId", "productId", "productName", "quantity", "carton", "weight", "unitPrice", "total", "notes", "createdAt", "updatedAt") 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
              [
                itemId,
                id, // Explicitly use the order ID from params
                productId,
                item.productName || "Unknown Product", // Include product name
                qty,
                cartonValue,
                weightValue,
                unitPrice,
                total,
                item.notes || null,
              ]
            );

            totalAmount += total;
            console.log(`Inserted item with id=${itemId}, orderId=${id}`);
          }

          // Update the order total directly
          await queryRunner.query(
            `UPDATE "orders" SET "total" = $1 WHERE "id" = $2`,
            [totalAmount, id]
          );

          console.log("Updated order total:", totalAmount);
        }

        // Commit the transaction
        await queryRunner.commitTransaction();

        // Get the updated order with items
        const updatedOrder = await getRepository(Order).findOne({
          where: { id },
          relations: ["items", "items.product"],
        });

        res.json({
          message: "Order updated successfully",
          order: updatedOrder,
        });
      } catch (error) {
        // Rollback transaction on error
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        // Always release the query runner
        await queryRunner.release();
      }
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({
        message: "Error updating order",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Delete order
   */
  static async deleteOrder(req: CustomRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const orderRepository = getRepository(Order);
      const orderItemRepository = getRepository(OrderItem);
      const organizationId = req.user?.organization?.id;

      // Try to find by id (UUID) or order_id (string with prefix)
      const order = await orderRepository.findOne({
        where: [
          { id, organizationId },
          { or_id: id, organizationId },
        ],
      });

      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      // Delete order items first (respecting foreign key constraints)
      await orderItemRepository.delete({ orderId: id });

      // Delete the order
      await orderRepository.delete(id);

      res.json({ message: "Order deleted successfully" });
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ message: "Error deleting order" });
    }
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
        res.status(400).json({ message: "Invalid order status" });
        return;
      }

      const orderRepository = getRepository(Order);
      const organizationId = req.user?.organization?.id;

      // Try to find by id (UUID) or order_id (string with prefix)
      const order = await orderRepository.findOne({
        where: [
          { id, organizationId },
          { or_id: id, organizationId },
        ],
      });

      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      // Update status
      order.status = status as OrderStatus;
      const updatedOrder = await orderRepository.save(order);

      res.json({
        message: "Order status updated successfully",
        order: updatedOrder,
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Error updating order status" });
    }
  }

  /**
   * Get order analytics data sliced by different dimensions
   */
  static async getOrderAnalytics(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const organizationId = req.user?.organization?.id;
      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      // Extract query parameters
      const period = (req.query.period as string) || "month"; // day, week, month, year
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : new Date(new Date().setMonth(new Date().getMonth() - 1));
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : new Date();

      // Calculate previous period dates for trend comparison
      const currentPeriodDays = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const previousPeriodStartDate = new Date(
        startDate.getTime() - currentPeriodDays * 24 * 60 * 60 * 1000
      );
      const previousPeriodEndDate = new Date(
        endDate.getTime() - currentPeriodDays * 24 * 60 * 60 * 1000
      );

      const orderRepository = getRepository(Order);

      // 1. Get total orders and revenue in period
      const totalOrdersQuery = orderRepository
        .createQueryBuilder("order")
        .where("order.organizationId = :organizationId", { organizationId })
        .andWhere("order.orderDate BETWEEN :startDate AND :endDate", {
          startDate,
          endDate,
        });

      const totalOrders = await totalOrdersQuery.getCount();
      const totalRevenue = await totalOrdersQuery
        .select("SUM(order.total)", "total")
        .getRawOne();

      // Get previous period data for trend calculation
      const previousPeriodOrdersQuery = orderRepository
        .createQueryBuilder("order")
        .where("order.organizationId = :organizationId", { organizationId })
        .andWhere("order.orderDate BETWEEN :startDate AND :endDate", {
          startDate: previousPeriodStartDate,
          endDate: previousPeriodEndDate,
        });

      const previousPeriodOrders = await previousPeriodOrdersQuery.getCount();
      const previousPeriodRevenue = await previousPeriodOrdersQuery
        .select("SUM(order.total)", "total")
        .getRawOne();

      // Calculate trends
      const calculateTrend = (current: number, previous: number): TrendData => {
        if (previous === 0) {
          return {
            current,
            previous,
            percentChange: current > 0 ? 100 : 0,
            isPositive: current > 0,
          };
        }

        const percentChange = ((current - previous) / previous) * 100;
        return {
          current,
          previous,
          percentChange: Math.round(percentChange * 10) / 10,
          isPositive: percentChange >= 0,
        };
      };

      const ordersTrend = calculateTrend(totalOrders, previousPeriodOrders);
      const revenueTrend = calculateTrend(
        parseFloat(totalRevenue?.total || "0"),
        parseFloat(previousPeriodRevenue?.total || "0")
      );

      // 2. Get orders by status with trend data
      const ordersByStatus = await orderRepository
        .createQueryBuilder("order")
        .select("order.status", "status")
        .addSelect("COUNT(order.id)", "count")
        .addSelect("SUM(order.total)", "total")
        .where("order.organizationId = :organizationId", { organizationId })
        .andWhere("order.orderDate BETWEEN :startDate AND :endDate", {
          startDate,
          endDate,
        })
        .groupBy("order.status")
        .getRawMany();

      // Calculate trends for each status
      const statusTrends: Record<string, TrendData> = {};

      // Get previous period status counts
      const previousPeriodStatusCounts = await orderRepository
        .createQueryBuilder("order")
        .select("order.status", "status")
        .addSelect("COUNT(order.id)", "count")
        .where("order.organizationId = :organizationId", { organizationId })
        .andWhere("order.orderDate BETWEEN :startDate AND :endDate", {
          startDate: previousPeriodStartDate,
          endDate: previousPeriodEndDate,
        })
        .groupBy("order.status")
        .getRawMany();

      // Create a map of previous period status counts for easier lookup
      const previousStatusCountMap: Record<string, number> = {};
      previousPeriodStatusCounts.forEach((status) => {
        previousStatusCountMap[status.status] = parseInt(status.count);
      });

      // Calculate trend for each status
      ordersByStatus.forEach((statusData) => {
        const currentCount = parseInt(statusData.count);
        const previousCount = previousStatusCountMap[statusData.status] || 0;

        statusTrends[statusData.status] = calculateTrend(
          currentCount,
          previousCount
        );
      });

      // 3. Get orders by date (timeline)
      const timeFormat =
        period === "day"
          ? "YYYY-MM-DD"
          : period === "week"
          ? 'YYYY-"W"IW'
          : period === "month"
          ? "YYYY-MM"
          : "YYYY";

      const ordersByDate = await orderRepository
        .createQueryBuilder("order")
        .select(`TO_CHAR(order.orderDate, '${timeFormat}')`, "date")
        .addSelect("COUNT(order.id)", "count")
        .addSelect("SUM(order.total)", "total")
        .where("order.organizationId = :organizationId", { organizationId })
        .andWhere("order.orderDate BETWEEN :startDate AND :endDate", {
          startDate,
          endDate,
        })
        .groupBy(`TO_CHAR(order.orderDate, '${timeFormat}')`)
        .orderBy(`TO_CHAR(order.orderDate, '${timeFormat}')`, "ASC")
        .getRawMany();

      // 4. Get top customers - Fix the column name case sensitivity issue
      const topCustomers = await orderRepository
        .createQueryBuilder("order")
        .select("customer.id", "customerId")
        .addSelect("customer.name", "customerName")
        .addSelect("COUNT(order.id)", "orderCount")
        .addSelect("SUM(order.total)", "totalspent") // Changed to lowercase to match in ORDER BY
        .leftJoin("order.customer", "customer")
        .where("order.organizationId = :organizationId", { organizationId })
        .andWhere("order.orderDate BETWEEN :startDate AND :endDate", {
          startDate,
          endDate,
        })
        .groupBy("customer.id, customer.name")
        .orderBy("totalspent", "DESC") // Use lowercase to match the alias
        .limit(5)
        .getRawMany();

      // 5. Get payment status breakdown
      const paymentStatusBreakdown = await orderRepository
        .createQueryBuilder("order")
        .select("order.paymentStatus", "status")
        .addSelect("COUNT(order.id)", "count")
        .addSelect("SUM(order.total)", "total")
        .where("order.organizationId = :organizationId", { organizationId })
        .andWhere("order.orderDate BETWEEN :startDate AND :endDate", {
          startDate,
          endDate,
        })
        .groupBy("order.paymentStatus")
        .getRawMany();

      res.json({
        period,
        dateRange: { startDate, endDate },
        summary: {
          totalOrders,
          totalRevenue: totalRevenue?.total || 0,
          trends: {
            orders: ordersTrend,
            revenue: revenueTrend,
          },
        },
        ordersByStatus,
        statusTrends, // Add trends by status
        ordersByDate,
        topCustomers,
        paymentStatusBreakdown,
      });
    } catch (error) {
      console.error("Error fetching order analytics:", error);
      res.status(500).json({ message: "Error fetching order analytics" });
    }
  }

  /**
   * Get recent orders for dashboard with trend data
   */
  static async getRecentOrders(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const organizationId = req.user?.organization?.id;
      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 5;
      const orderRepository = getRepository(Order);

      // Get current period stats (last 30 days)
      const currentDate = new Date();
      const thirtyDaysAgo = new Date(
        currentDate.getTime() - 30 * 24 * 60 * 60 * 1000
      );

      // Get order stats for different order statuses in the current period
      const currentPeriodStats = await orderRepository
        .createQueryBuilder("order")
        .select("order.status", "status")
        .addSelect("COUNT(order.id)", "count")
        .where("order.organizationId = :organizationId", { organizationId })
        .andWhere("order.orderDate >= :startDate", { startDate: thirtyDaysAgo })
        .groupBy("order.status")
        .getRawMany();

      // Get order stats for previous 30 days for trend calculation
      const previousPeriodStartDate = new Date(
        thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000
      );
      const previousPeriodStats = await orderRepository
        .createQueryBuilder("order")
        .select("order.status", "status")
        .addSelect("COUNT(order.id)", "count")
        .where("order.organizationId = :organizationId", { organizationId })
        .andWhere("order.orderDate BETWEEN :startDate AND :endDate", {
          startDate: previousPeriodStartDate,
          endDate: thirtyDaysAgo,
        })
        .groupBy("order.status")
        .getRawMany();

      // Convert to maps for easier processing
      const currentStats: Record<string, number> = {};
      currentPeriodStats.forEach((stat) => {
        currentStats[stat.status] = parseInt(stat.count);
      });

      const previousStats: Record<string, number> = {};
      previousPeriodStats.forEach((stat) => {
        previousStats[stat.status] = parseInt(stat.count);
      });

      // Calculate trend for each status
      const calculateTrend = (current: number, previous: number) => {
        if (previous === 0) {
          return {
            value: current > 0 ? 100 : 0,
            isPositive: current > 0,
          };
        }

        const percentChange = ((current - previous) / previous) * 100;
        return {
          value: Math.round(percentChange * 10) / 10,
          isPositive: percentChange >= 0,
        };
      };

      // Calculate trends for primary status types
      const trends = {
        pending: calculateTrend(
          currentStats["pending"] || 0,
          previousStats["pending"] || 0
        ),
        processing: calculateTrend(
          currentStats["processing"] || 0,
          previousStats["processing"] || 0
        ),
        delivered: calculateTrend(
          currentStats["delivered"] || 0,
          previousStats["delivered"] || 0
        ),
        total: calculateTrend(
          Object.values(currentStats).reduce((sum, val) => sum + val, 0),
          Object.values(previousStats).reduce((sum, val) => sum + val, 0)
        ),
      };

      const recentOrders = await orderRepository.find({
        where: { organizationId },
        relations: ["customer", "items"],
        order: { orderDate: "DESC" },
        take: limit,
      });

      res.json({
        orders: recentOrders,
        trends,
        stats: {
          pending: currentStats["pending"] || 0,
          processing: currentStats["processing"] || 0,
          delivered: currentStats["delivered"] || 0,
          total: Object.values(currentStats).reduce((sum, val) => sum + val, 0),
        },
      });
    } catch (error) {
      console.error("Error fetching recent orders:", error);
      res.status(500).json({ message: "Error fetching recent orders" });
    }
  }
}
