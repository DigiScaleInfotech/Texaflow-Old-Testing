import { Request, Response } from "express";
import { getRepository } from "../config/database";
import { Bill } from "../entities/bill.entity";
import { Order } from "../entities/order.entity";
import { BillItem } from "../entities/bill-item.entity";
import { Customer } from "../entities/customer.entity";
import { Product } from "../entities/product.entity";
import { BillStatus, BillType, PaymentStatus } from "../interface/bill";
import { BillService } from "../services/bill.service";
import { InvoiceSettings } from "../entities/invoice-settings.entity";
import { Organization } from "../entities/organization.entity";
import { v4 as uuidv4 } from "uuid";
import * as Pdfservice from "../services/pdf.service";
import { Writable } from "stream";

// Define custom request interface with user property
interface CustomRequest extends Request {
  user?: any; // Using 'any' type for compatibility
}

export class BillController {
  /**
   * Get all bills with pagination and filtering
   */
  static async getBills(req: CustomRequest, res: Response): Promise<void> {
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
      const billType = req.query.type as string;
      const documentType = req.query.documentType as string;
      const status = req.query.status as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const customerId = req.query.customerId as string;

      // Get bill repository
      const billRepository = getRepository(Bill);

      // Build query
      let queryBuilder = billRepository
        .createQueryBuilder("bill")
        .leftJoinAndSelect("bill.items", "items")
        .leftJoinAndSelect("bill.customer", "customer")
        .leftJoinAndSelect("bill.createdBy", "createdBy")
        .where("bill.organizationId = :organizationId", { organizationId });

      // Apply filters if provided
      if (search) {
        queryBuilder = queryBuilder.andWhere(
          "(bill.billNumber ILIKE :search OR bill.customerName ILIKE :search OR bill.customerEmail ILIKE :search)",
          { search: `%${search}%` }
        );
      }

      if (billType) {
        queryBuilder = queryBuilder.andWhere("bill.billType = :billType", {
          billType,
        });
      }

      if (documentType === "challan") {
        queryBuilder = queryBuilder.andWhere("bill.documentType = :documentType", {
          documentType: "challan",
        });
      } else if (documentType === "invoice") {
        queryBuilder = queryBuilder.andWhere(
          "(bill.documentType = 'invoice' OR bill.documentType IS NULL)"
        );
      }

      if (status) {
        queryBuilder = queryBuilder.andWhere("bill.status = :status", {
          status,
        });
      }

      if (startDate) {
        queryBuilder = queryBuilder.andWhere("bill.issueDate >= :startDate", {
          startDate: new Date(startDate),
        });
      }

      if (endDate) {
        // Add one day to include the end date fully
        const endDateObj = new Date(endDate);
        endDateObj.setDate(endDateObj.getDate() + 1);
        queryBuilder = queryBuilder.andWhere("bill.issueDate < :endDate", {
          endDate: endDateObj,
        });
      }

      if (customerId) {
        queryBuilder = queryBuilder.andWhere("bill.customerId = :customerId", {
          customerId,
        });
      }

      // Get bills and total count in a single query
      const [bills, total] = await queryBuilder
        .orderBy("bill.issueDate", "DESC")
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      res.json({
        bills,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error("Error fetching bills:", error);
      res
        .status(500)
        .json({ message: "Error fetching bills", error: String(error) });
    }
  }

  /**
   * Get bill by ID
   */
  static async getBillById(req: CustomRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const organizationId = req.user?.organization?.id;

      if (!id || id === "undefined") {
        res.status(400).json({ message: "Invalid bill ID provided" });
        return;
      }

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      const billRepository = getRepository(Bill);

      // Find the bill with the organization check (supports UUID, invoiceId, billNumber, or challanNo)
      let bill;
      if (isUUID(id)) {
        bill = await billRepository.findOne({
          where: { id, organizationId },
          relations: ["items", "customer", "createdBy"],
        });
      } else {
        bill = await billRepository.findOne({
          where: [
            { invoiceId: id, organizationId },
            { billNumber: id, organizationId },
            { challanNo: id, organizationId },
          ],
          relations: ["items", "customer", "createdBy"],
        });
      }

      if (!bill) {
        res.status(404).json({ message: "Bill not found" });
        return;
      }

      res.json(bill);
    } catch (error) {
      console.error("Error fetching bill:", error);
      res
        .status(500)
        .json({ message: "Error fetching bill", error: String(error) });
    }
  }

  /**
   * Create a new bill
   */
  static async createBill(req: CustomRequest, res: Response): Promise<void> {
    try {
      const billData = req.body;
      const organizationId = req.user?.organization?.id;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      // Get repositories
      const billRepository = getRepository(Bill);
      const billItemRepository = getRepository(BillItem);
      const productRepository = getRepository(Product);

      // Begin transaction to ensure data consistency
      const queryRunner = billRepository.manager.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Log incoming items for debugging
        console.log("Received items:", JSON.stringify(billData.items, null, 2));

        // Create the bill entity but DO NOT include items
        // This prevents TypeORM from automatically creating items
        const { items: itemsData, ...billWithoutItems } = billData;

        // Generate a unique invoice ID if not provided
        if (!billWithoutItems.invoiceId) {
          // Generate a random invoice ID with format INV-XXXXXX
          const generateInvoiceId = () => {
            const randomPart = Math.floor(
              100000 + Math.random() * 900000
            ).toString();
            return `INV-${randomPart}`;
          };

          // Check if the generated invoice ID already exists
          let invoiceId = generateInvoiceId();
          let idExists = true;
          let attempts = 0;
          const maxAttempts = 10; // Limit the number of attempts to avoid infinite loop

          while (idExists && attempts < maxAttempts) {
            attempts++;
            // Check if the ID exists in the database
            const existingBill = await queryRunner.manager.findOne(Bill, {
              where: { invoiceId, organizationId },
            });

            if (!existingBill) {
              idExists = false;
            } else {
              // Generate a new ID if collision occurs
              invoiceId = generateInvoiceId();
            }
          }

          console.log(
            `Generated unique invoice ID: ${invoiceId} after ${attempts} attempts`
          );
          billWithoutItems.invoiceId = invoiceId;
        }

        // If we have customer details but no customerId, don't try to look up customer
        // Just use the manually entered information directly
        if (!billWithoutItems.customerId && billWithoutItems.customerName) {
          console.log(
            "Using manually entered customer details without reference"
          );
          // Set customerId to null to ensure no linking is attempted
          billWithoutItems.customerId = null;
        }

        // Determine payment status based on amounts before creating bill
        const rawStatus = (billData.paymentStatus || "").toString().toLowerCase();
        let paymentStatus: PaymentStatus = PaymentStatus.PENDING;
        if (parseFloat(billData.amountPaid) >= parseFloat(billData.total) && parseFloat(billData.total) > 0) {
          paymentStatus = PaymentStatus.PAID;
        } else if (parseFloat(billData.amountPaid) > 0) {
          paymentStatus = PaymentStatus.PARTIALLY_PAID;
        } else if (rawStatus === "paid") {
          paymentStatus = PaymentStatus.PAID;
        } else if (rawStatus === "unpaid") {
          paymentStatus = PaymentStatus.UNPAID;
        } else if (rawStatus === "pending") {
          paymentStatus = PaymentStatus.PENDING;
        }

        console.log(
          `Setting payment status to: ${paymentStatus} based on amountPaid: ${billData.amountPaid}, total: ${billData.total}, rawStatus: ${rawStatus}`
        );

        const bill = billRepository.create({
          ...billWithoutItems,
          challanNo: billData.challanNo || billWithoutItems.invoiceId,
          documentType: billData.documentType || "invoice",
          vehicleNo: billData.vehicleNo || undefined,
          transportName: billData.transportName || undefined,
          convertedInvoiceId: billData.convertedInvoiceId || undefined,
          organizationId,
          createdById: req.user!.id,
          status: billData.status || BillStatus.DRAFT,
          paymentStatus: paymentStatus, // Use the calculated payment status
          billNumber: await BillService.generateBillNumber(
            billData.billType || BillType.SALES
          ),
        });

        // Save the bill without items
        const result = await queryRunner.manager.save(Bill, bill);
        const savedBill = Array.isArray(result) ? result[0] : result;
        console.log(`Saved bill with ID: ${savedBill.id}`);

        // Handle bill items - ONLY if items were provided in the request
        if (itemsData && Array.isArray(itemsData) && itemsData.length > 0) {
          // Create an object map for deduplication with more reliable keys
          const itemMap = new Map();

          itemsData.forEach((item, index) => {
            // Create a unique key combining all important properties
            const uniqueKey = `${item.productId || "custom"}-${item.description
              }-${item.quantity}-${item.unitPrice}`;
            console.log(`Item ${index} with key: ${uniqueKey}`);
            itemMap.set(uniqueKey, item);
          });

          const uniqueItems = Array.from(itemMap.values());
          console.log(
            `Deduplicated ${itemsData.length} items to ${uniqueItems.length} items`
          );

          // Create item entities but don't save them yet
          const itemsToSave = [];

          for (const item of uniqueItems) {
            let billItem;

            // Check if this is a custom item (no productId)
            if (!item.productId) {
              // Create a custom item entity
              billItem = billItemRepository.create({
                billId: savedBill.id,
                productId: null,
                description: item.description || "Custom Item",
                category: item.category || "",
                hsnCode: item.hsnCode || "",
                quantity: item.quantity || 1,
                carton: item.carton || 0,
                weight: item.weight || 0,
                kg: item.kg || 0,
                unitPrice: item.unitPrice || 0,
                total:
                  item.total || (item.quantity || 1) * (item.unitPrice || 0),
                notes: item.notes,
              });
            } else {
              // Look up the product to verify it exists
              const product = await queryRunner.manager.findOne(Product, {
                where: { id: item.productId },
              });

              if (!product) {
                throw new Error(`Product with ID ${item.productId} not found`);
              }

              // Create a product-linked item entity
              billItem = billItemRepository.create({
                billId: savedBill.id,
                productId: item.productId,
                description: item.description || product.name,
                category: item.category || "",
                hsnCode: item.hsnCode || "",
                quantity: item.quantity || 1,
                carton: item.carton || 0,
                weight: item.weight || 0,
                kg: item.kg || 0,
                unitPrice: item.unitPrice || product.price,
                total:
                  item.total ||
                  (item.quantity || 1) * (item.unitPrice || product.price),
                notes: item.notes,
              });
            }

            // Add to our list of items to save
            itemsToSave.push(billItem);
          }

          // Save all bill items at once, only if we have any
          if (itemsToSave.length > 0) {
            console.log(
              `About to save ${itemsToSave.length} unique items with Bill ID: ${savedBill.id}`
            );

            // Use explicit SQL INSERT to prevent any potential duplication
            for (const item of itemsToSave) {
              await queryRunner.manager.insert(BillItem, item);
              console.log(`Saved item with description: ${item.description}`);
            }
          }
        }

        // Commit the transaction
        await queryRunner.commitTransaction();
        console.log("Transaction committed successfully");

        // Fetch the complete bill with items - AFTER transaction is complete
        const completeBill = await billRepository.findOne({
          where: { id: savedBill.id },
          relations: ["items"],
        });

        if (completeBill?.items) {
          console.log(`Verified bill has ${completeBill.items.length} items`);
        }

        res.status(201).json({
          message: "Bill created successfully",
          bill: completeBill,
        });
      } catch (error) {
        // Rollback transaction on error
        await queryRunner.rollbackTransaction();
        console.error("Rolling back transaction due to error:", error);
        throw error;
      } finally {
        // Release query runner
        await queryRunner.release();
        console.log("Query runner released");
      }
    } catch (error: any) {
      console.error("Error creating bill:", error);
      res.status(500).json({
        message: "Error creating bill",
        error: error.message || String(error),
      });
    }
  }

  /**
   * Get billing summary data for dashboard
   */
  static async getBillingSummary(
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

      const billRepository = getRepository(Bill);

      // Get current date range (this month)
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Calculate total sales (from sales bills)
      const salesData = await billRepository
        .createQueryBuilder("bill")
        .select("SUM(bill.total)", "totalAmount")
        .addSelect("SUM(bill.amountPaid)", "totalPaid")
        .addSelect("SUM(bill.amountRemaining)", "totalRemaining")
        .addSelect("COUNT(bill.id)", "count")
        .where("bill.organizationId = :organizationId", { organizationId })
        .andWhere("bill.billType = :billType", { billType: BillType.SALES })
        .andWhere("(bill.documentType = 'invoice' OR bill.documentType IS NULL)")
        .andWhere("bill.issueDate BETWEEN :startDate AND :endDate", {
          startDate: firstDayOfMonth,
          endDate: lastDayOfMonth,
        })
        .getRawOne();

      // Calculate total purchases (from purchase bills)
      const purchaseData = await billRepository
        .createQueryBuilder("bill")
        .select("SUM(bill.total)", "totalAmount")
        .addSelect("SUM(bill.amountPaid)", "totalPaid")
        .addSelect("SUM(bill.amountRemaining)", "totalRemaining")
        .addSelect("COUNT(bill.id)", "count")
        .where("bill.organizationId = :organizationId", { organizationId })
        .andWhere("bill.billType = :billType", { billType: BillType.PURCHASE })
        .andWhere("(bill.documentType = 'invoice' OR bill.documentType IS NULL)")
        .andWhere("bill.issueDate BETWEEN :startDate AND :endDate", {
          startDate: firstDayOfMonth,
          endDate: lastDayOfMonth,
        })
        .getRawOne();

      // Calculate total expenses (from expense bills)
      const expenseData = await billRepository
        .createQueryBuilder("bill")
        .select("SUM(bill.total)", "totalAmount")
        .addSelect("COUNT(bill.id)", "count")
        .where("bill.organizationId = :organizationId", { organizationId })
        .andWhere("bill.billType = :billType", { billType: BillType.EXPENSE })
        .andWhere("(bill.documentType = 'invoice' OR bill.documentType IS NULL)")
        .andWhere("bill.issueDate BETWEEN :startDate AND :endDate", {
          startDate: firstDayOfMonth,
          endDate: lastDayOfMonth,
        })
        .getRawOne();

      // Format the response
      const summary = {
        currentMonth: {
          name: now.toLocaleString("default", { month: "long" }),
          year: now.getFullYear(),
        },
        sales: {
          total: Number(salesData?.totalAmount || 0),
          count: Number(salesData?.count || 0),
          paid: Number(salesData?.totalPaid || 0),
          pending: Number(salesData?.totalRemaining || 0),
        },
        purchases: {
          total: Number(purchaseData?.totalAmount || 0),
          count: Number(purchaseData?.count || 0),
          paid: Number(purchaseData?.totalPaid || 0),
          pending: Number(purchaseData?.totalRemaining || 0),
        },
        expenses: {
          total: Number(expenseData?.totalAmount || 0),
          count: Number(expenseData?.count || 0),
        },
        profit:
          Number(salesData?.totalAmount || 0) -
          Number(purchaseData?.totalAmount || 0) -
          Number(expenseData?.totalAmount || 0),
      };

      res.json(summary);
    } catch (error) {
      console.error("Error getting billing summary:", error);
      res.status(500).json({
        message: "Error getting billing summary",
        error: String(error),
      });
    }
  }

  /**
   * Get accounts receivable data
   */
  static async getReceivables(
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

      const billRepository = getRepository(Bill);

      // Get sales bills with outstanding amounts
      const receivables = await billRepository
        .createQueryBuilder("bill")
        .where("bill.organizationId = :organizationId", { organizationId })
        .andWhere("bill.billType = :billType", { billType: BillType.SALES })
        .andWhere("bill.amountRemaining > 0")
        .orderBy("bill.dueDate", "ASC")
        .getMany();

      // Group receivables by status
      const current = receivables.filter(
        (bill) => new Date(bill.dueDate) >= new Date()
      );
      const overdue = receivables.filter(
        (bill) => new Date(bill.dueDate) < new Date()
      );

      const result = {
        total: {
          count: receivables.length,
          amount: receivables.reduce(
            (sum, bill) => sum + Number(bill.amountRemaining),
            0
          ),
        },
        current: {
          count: current.length,
          amount: current.reduce(
            (sum, bill) => sum + Number(bill.amountRemaining),
            0
          ),
        },
        overdue: {
          count: overdue.length,
          amount: overdue.reduce(
            (sum, bill) => sum + Number(bill.amountRemaining),
            0
          ),
        },
        items: receivables.map((bill) => ({
          id: bill.id,
          billNumber: bill.billNumber,
          customerName: bill.customerName,
          issueDate: bill.issueDate,
          dueDate: bill.dueDate,
          total: bill.total,
          amountPaid: bill.amountPaid,
          amountRemaining: bill.amountRemaining,
          isOverdue: new Date(bill.dueDate) < new Date(),
        })),
      };

      res.json(result);
    } catch (error) {
      console.error("Error getting receivables:", error);
      res.status(500).json({
        message: "Error getting accounts receivable data",
        error: String(error),
      });
    }
  }

  /**
   * Get accounts payable data
   */
  static async getPayables(req: CustomRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organization?.id;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      const billRepository = getRepository(Bill);

      // Get purchase bills with outstanding amounts
      const payables = await billRepository
        .createQueryBuilder("bill")
        .where("bill.organizationId = :organizationId", { organizationId })
        .andWhere("bill.billType = :billType", { billType: BillType.PURCHASE })
        .andWhere("bill.amountRemaining > 0")
        .orderBy("bill.dueDate", "ASC")
        .getMany();

      // Group payables by status
      const current = payables.filter(
        (bill) => new Date(bill.dueDate) >= new Date()
      );
      const overdue = payables.filter(
        (bill) => new Date(bill.dueDate) < new Date()
      );

      const result = {
        total: {
          count: payables.length,
          amount: payables.reduce(
            (sum, bill) => sum + Number(bill.amountRemaining),
            0
          ),
        },
        current: {
          count: current.length,
          amount: current.reduce(
            (sum, bill) => sum + Number(bill.amountRemaining),
            0
          ),
        },
        overdue: {
          count: overdue.length,
          amount: overdue.reduce(
            (sum, bill) => sum + Number(bill.amountRemaining),
            0
          ),
        },
        items: payables.map((bill) => ({
          id: bill.id,
          billNumber: bill.billNumber,
          vendorName: bill.customerName, // In purchase bills, the "customer" is actually the vendor
          issueDate: bill.issueDate,
          dueDate: bill.dueDate,
          total: bill.total,
          amountPaid: bill.amountPaid,
          amountRemaining: bill.amountRemaining,
          isOverdue: new Date(bill.dueDate) < new Date(),
        })),
      };

      res.json(result);
    } catch (error) {
      console.error("Error getting payables:", error);
      res.status(500).json({
        message: "Error getting accounts payable data",
        error: String(error),
      });
    }
  }

  /**
   * Bulk import bills
   */
  static async bulkImportBills(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const organizationId = req.user?.organization?.id;
      const userId = req.user!.id;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      const billsData = req.body;
      if (!Array.isArray(billsData)) {
        res.status(400).json({ message: "Expected array of bills" });
        return;
      }

      const billRepository = getRepository(Bill);
      const billItemRepository = getRepository(BillItem);

      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[],
      };

      // Process each bill in the import
      for (const billData of billsData) {
        try {
          // Generate bill number
          const billNumber = await BillService.generateBillNumber(
            billData.billType || BillType.SALES
          );

          // Generate a unique invoice ID if not provided
          if (!billData.invoiceId) {
            // Generate a random invoice ID with format INV-XXXXXX
            const randomPart = Math.floor(
              100000 + Math.random() * 900000
            ).toString();
            billData.invoiceId = `INV-${randomPart}`;
          }

          // Create bill
          const bill = billRepository.create({
            ...billData,
            organizationId,
            createdById: userId,
            billNumber,
            status: billData.status || BillStatus.DRAFT,
            paymentStatus: billData.paymentStatus || PaymentStatus.UNPAID,
          });

          const savedBill = (await billRepository.save(bill)) as any;

          // Create bill items
          if (billData.items && Array.isArray(billData.items)) {
            for (const item of billData.items) {
              const billItem = billItemRepository.create({
                billId: savedBill.id,
                productId: item.productId || null,
                description: item.description,
                quantity: item.quantity || 1,
                carton: item.carton || 0,
                weight: item.weight || 0,
                unitPrice: item.unitPrice || 0,
                total:
                  item.total || (item.quantity || 1) * (item.unitPrice || 0),
                notes: item.notes,
              });

              await billItemRepository.save(billItem);
            }
          }

          results.success++;
        } catch (error: any) {
          results.failed++;
          results.errors.push(`Failed to import bill: ${error.message}`);
        }
      }

      res.status(200).json({
        message: `Imported ${results.success} bills successfully, ${results.failed} failed`,
        results,
      });
    } catch (error: any) {
      console.error("Error bulk importing bills:", error);
      res.status(500).json({
        message: "Error bulk importing bills",
        error: error.message || String(error),
      });
    }
  }

  /**
   * Record a payment for a bill
   */
  static async recordPayment(req: CustomRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const organizationId = req.user?.organization?.id;
      const { amount, paymentDate, paymentMethod, notes } = req.body;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        res.status(400).json({ message: "Valid payment amount is required" });
        return;
      }

      const billRepository = getRepository(Bill);
      const bill = await billRepository.findOne({
        where: { id, organizationId },
      });

      if (!bill) {
        res.status(404).json({ message: "Bill not found" });
        return;
      }

      const paymentAmount = parseFloat(amount);

      // Update bill payment details
      const previousAmountPaid = parseFloat(bill.amountPaid?.toString() || "0") || 0;
      const billTotal = parseFloat(bill.total?.toString() || "0") || 0;
      const newAmountPaid = previousAmountPaid + paymentAmount;
      const rawRemaining = billTotal - newAmountPaid;
      // Precision tolerance of 0.05 to eliminate JS float precision bugs e.g. 20730.239999999998
      const isFullySettled = rawRemaining <= 0.05;
      const newAmountRemaining = isFullySettled ? 0 : Math.max(0, Number(rawRemaining.toFixed(2)));

      bill.amountPaid = isFullySettled ? billTotal : Number(newAmountPaid.toFixed(2));
      bill.amountRemaining = newAmountRemaining;

      // Update payment status
      if (isFullySettled || newAmountRemaining <= 0) {
        bill.paymentStatus = PaymentStatus.PAID;
      } else if (newAmountPaid > 0) {
        bill.paymentStatus = PaymentStatus.PARTIALLY_PAID;
      }

      // Save payment transaction record (in a real app, this would be saved to a payments table)
      const paymentRecord = {
        billId: id,
        organizationId,
        amount: paymentAmount,
        paymentDate: paymentDate || new Date(),
        paymentMethod: paymentMethod || "cash",
        notes: notes || "Payment recorded",
        recordedBy: req.user!.id,
      };

      // Here you would typically save the payment record to a Payments table
      // For now, we'll just update the bill itself

      await billRepository.save(bill);

      res.status(200).json({
        message: "Payment recorded successfully",
        bill,
        payment: paymentRecord,
      });
    } catch (error: any) {
      console.error("Error recording payment:", error);
      res.status(500).json({
        message: "Error recording payment",
        error: error.message || String(error),
      });
    }
  }

  /**
   * Record Customer Lumpsum / On-Account Payment (FIFO knock-off)
   */
  static async recordCustomerPayment(req: CustomRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organization?.id;
      const { customerId, amount, paymentDate, paymentMethod, notes } = req.body;

      if (!organizationId) {
        res.status(403).json({ message: "Organization not found for this user" });
        return;
      }

      if (!customerId) {
        res.status(400).json({ message: "Customer is required" });
        return;
      }

      const paymentAmount = parseFloat(amount);
      if (isNaN(paymentAmount) || paymentAmount <= 0) {
        res.status(400).json({ message: "Valid payment amount is required" });
        return;
      }

      const billRepository = getRepository(Bill);

      // Fetch pending / partially paid bills for this customer ordered by date ASC (FIFO)
      const pendingBills = await billRepository
        .createQueryBuilder("bill")
        .where("bill.organizationId = :organizationId", { organizationId })
        .andWhere("bill.customerId = :customerId", { customerId })
        .andWhere("bill.billType = :billType", { billType: "sales" })
        .andWhere("bill.paymentStatus != :paidStatus", { paidStatus: PaymentStatus.PAID })
        .orderBy("bill.issueDate", "ASC")
        .addOrderBy("bill.createdAt", "ASC")
        .getMany();

      let remainingToApply = paymentAmount;
      const updatedBills = [];

      for (const bill of pendingBills) {
        if (remainingToApply <= 0) break;

        const currentRemaining =
          bill.amountRemaining !== undefined && bill.amountRemaining !== null
            ? parseFloat(bill.amountRemaining.toString())
            : parseFloat(bill.total.toString()) || 0;

        if (currentRemaining <= 0) continue;

        const amountToPayThisBill = Math.min(remainingToApply, currentRemaining);
        const previousPaid = parseFloat(bill.amountPaid?.toString() || "0") || 0;
        const newPaid = previousPaid + amountToPayThisBill;
        const newRemaining = Math.max(0, currentRemaining - amountToPayThisBill);

        bill.amountPaid = newPaid;
        bill.amountRemaining = newRemaining;
        bill.paymentStatus =
          newRemaining <= 0 ? PaymentStatus.PAID : PaymentStatus.PARTIALLY_PAID;

        await billRepository.save(bill);
        remainingToApply -= amountToPayThisBill;
        updatedBills.push({
          billId: bill.id,
          invoiceId: bill.invoiceId,
          paidAmount: amountToPayThisBill,
          remaining: newRemaining,
          status: bill.paymentStatus,
        });
      }

      res.status(200).json({
        message: "Customer payment recorded successfully",
        totalReceived: paymentAmount,
        appliedAmount: paymentAmount - remainingToApply,
        unallocatedAmount: remainingToApply,
        updatedBillsCount: updatedBills.length,
        bills: updatedBills,
      });
    } catch (error: any) {
      console.error("Error recording customer payment:", error);
      res.status(500).json({
        message: "Error recording customer payment",
        error: error.message || String(error),
      });
    }
  }

  /**
   * Convert Delivery Challan to Tax Invoice
   */
  static async convertChallanToInvoice(req: CustomRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const organizationId = req.user?.organization?.id;
      const { taxRate = 5 } = req.body;

      if (!organizationId) {
        res.status(403).json({ message: "Organization not found for this user" });
        return;
      }

      const billRepository = getRepository(Bill);
      const billItemRepository = getRepository(BillItem);

      const challan = await billRepository.findOne({
        where: { id, organizationId },
        relations: ["items"],
      });

      if (!challan) {
        res.status(404).json({ message: "Challan not found" });
        return;
      }

      // Calculate tax and total for invoice (strictly rounded to 2 decimal places)
      const subtotal = Number(Number(challan.subtotal || 0).toFixed(2));
      const tax = Number(((subtotal * Number(taxRate)) / 100).toFixed(2));
      const total = Number((subtotal + tax).toFixed(2));

      // Calculate next sequential invoice ID starting from INV-0001
      const existingInvoices = await billRepository.find({
        where: { organizationId, documentType: "invoice" },
        select: ["invoiceId", "billNumber"],
      });
      let maxInvSeq = 0;
      existingInvoices.forEach((b) => {
        const no = b.invoiceId || b.billNumber || "";
        const m = no.match(/^INV-(\d+)$/i);
        if (m) {
          const num = parseInt(m[1], 10);
          if (num < 10000 && num > maxInvSeq) maxInvSeq = num;
        }
      });
      const invoiceId = `INV-${String(maxInvSeq + 1).padStart(4, "0")}`;

      let creditDays = 30;
      if (challan.customerId) {
        const customer = await getRepository(Customer).findOne({ where: { id: challan.customerId } });
        if (customer && customer.paymentTerms) {
          const match = customer.paymentTerms.match(/\d+/);
          if (match) creditDays = parseInt(match[0], 10);
          else if (customer.paymentTerms.toLowerCase().includes("receipt") || customer.paymentTerms.toLowerCase().includes("cash")) creditDays = 0;
        }
      }
      const invoiceDueDate = new Date(Date.now() + creditDays * 86400000);

      const newInvoice = billRepository.create({
        billNumber: await BillService.generateBillNumber(),
        invoiceId,
        challanNo: challan.challanNo || challan.invoiceId,
        documentType: "invoice",
        billType: challan.billType || BillType.SALES,
        customerId: challan.customerId,
        customerName: challan.customerName,
        customerEmail: challan.customerEmail,
        customerPhone: challan.customerPhone,
        companyName: challan.companyName,
        billingAddress: challan.billingAddress,
        vehicleNo: challan.vehicleNo,
        transportName: challan.transportName,
        issueDate: new Date(),
        dueDate: invoiceDueDate,
        subtotal,
        tax,
        total,
        amountPaid: 0,
        amountRemaining: total,
        paymentStatus: PaymentStatus.UNPAID,
        status: BillStatus.ACTIVE,
        notes: `Converted from Delivery Challan: ${challan.challanNo || challan.invoiceId}. ${challan.notes || ""}`,
        organizationId,
        createdById: req.user!.id,
      });

      const savedInvoice = await billRepository.save(newInvoice);

      // Copy items to new invoice
      if (challan.items && challan.items.length > 0) {
        const newItems = challan.items.map((item: any) =>
          billItemRepository.create({
            billId: savedInvoice.id,
            productId: item.productId,
            description: item.description,
            category: item.category,
            hsnCode: item.hsnCode,
            carton: item.carton,
            weight: item.weight,
            kg: item.kg,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          })
        );
        await billItemRepository.save(newItems);
      }

      // Mark challan as converted
      challan.convertedInvoiceId = savedInvoice.id;
      await billRepository.save(challan);

      res.status(201).json({
        message: "Challan converted to Tax Invoice successfully",
        invoice: savedInvoice,
      });
    } catch (error: any) {
      console.error("Error converting challan to invoice:", error);
      res.status(500).json({
        message: "Failed to convert challan to invoice",
        error: error.message || String(error),
      });
    }
  }

  /**
   * Bulk convert multiple delivery challans (same customer) into a single consolidated Tax Invoice
   */
  static async bulkConvertChallansToInvoice(req: CustomRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organization?.id;
      const { challanIds, taxRate = 5 } = req.body;

      if (!organizationId) {
        res.status(403).json({ message: "Organization not found for this user" });
        return;
      }

      if (!Array.isArray(challanIds) || challanIds.length === 0) {
        res.status(400).json({ message: "Please provide an array of challan IDs to convert." });
        return;
      }

      const billRepository = getRepository(Bill);
      const billItemRepository = getRepository(BillItem);

      // Fetch all selected challans with their items
      const challans = await billRepository.find({
        where: challanIds.map((id: string) => ({ id, organizationId })),
        relations: ["items"],
      });

      if (challans.length === 0) {
        res.status(404).json({ message: "No valid challans found for conversion." });
        return;
      }

      const primary = challans[0];
      const combinedChallanNumbers = challans
        .map((c) => c.challanNo || c.invoiceId || c.id.slice(0, 8))
        .filter(Boolean)
        .join(", ");

      // Aggregate subtotal from all challans (strictly rounded to 2 decimal places)
      const subtotal = Number(challans.reduce((sum, c) => sum + Number(c.subtotal || c.total || 0), 0).toFixed(2));
      const tax = Number(((subtotal * Number(taxRate)) / 100).toFixed(2));
      const total = Number((subtotal + tax).toFixed(2));

      // Calculate next sequential invoice ID starting from INV-0001
      const existingInvoices = await billRepository.find({
        where: { organizationId, documentType: "invoice" },
        select: ["invoiceId", "billNumber"],
      });
      let maxInvSeq = 0;
      existingInvoices.forEach((b) => {
        const no = b.invoiceId || b.billNumber || "";
        const m = no.match(/^INV-(\d+)$/i);
        if (m) {
          const num = parseInt(m[1], 10);
          if (num < 10000 && num > maxInvSeq) maxInvSeq = num;
        }
      });
      const invoiceId = `INV-${String(maxInvSeq + 1).padStart(4, "0")}`;

      let creditDays = 30;
      if (primary.customerId) {
        const customer = await getRepository(Customer).findOne({ where: { id: primary.customerId } });
        if (customer && customer.paymentTerms) {
          const match = customer.paymentTerms.match(/\d+/);
          if (match) creditDays = parseInt(match[0], 10);
          else if (
            customer.paymentTerms.toLowerCase().includes("receipt") ||
            customer.paymentTerms.toLowerCase().includes("cash")
          )
            creditDays = 0;
        }
      }
      const invoiceDueDate = new Date(Date.now() + creditDays * 86400000);

      // Create Consolidated Tax Invoice
      const newInvoice = billRepository.create({
        billNumber: await BillService.generateBillNumber(),
        invoiceId,
        challanNo: combinedChallanNumbers,
        documentType: "invoice",
        billType: primary.billType || BillType.SALES,
        customerId: primary.customerId,
        customerName: primary.customerName,
        customerEmail: primary.customerEmail,
        customerPhone: primary.customerPhone,
        companyName: primary.companyName,
        billingAddress: primary.billingAddress,
        vehicleNo: primary.vehicleNo,
        transportName: primary.transportName,
        issueDate: new Date(),
        dueDate: invoiceDueDate,
        subtotal,
        tax,
        total,
        amountPaid: 0,
        amountRemaining: total,
        paymentStatus: PaymentStatus.UNPAID,
        status: BillStatus.ACTIVE,
        notes: `Bulk converted from Delivery Challans: ${combinedChallanNumbers}.`,
        organizationId,
        createdById: req.user!.id,
      });

      const savedInvoice = await billRepository.save(newInvoice);

      // Copy all items from all challans to the new invoice
      const allItemsToSave: any[] = [];
      for (const ch of challans) {
        if (ch.items && ch.items.length > 0) {
          for (const item of ch.items) {
            allItemsToSave.push(
              billItemRepository.create({
                billId: savedInvoice.id,
                productId: item.productId,
                description: item.description
                  ? `${item.description} (Ref: ${ch.challanNo || 'Challan'})`
                  : `Item (${ch.challanNo || 'Challan'})`,
                category: item.category,
                hsnCode: item.hsnCode,
                carton: item.carton,
                weight: item.weight,
                kg: item.kg,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.total,
              })
            );
          }
        }
      }

      if (allItemsToSave.length > 0) {
        await billItemRepository.save(allItemsToSave);
      }

      // Mark all source challans as converted
      for (const ch of challans) {
        ch.convertedInvoiceId = savedInvoice.id;
      }
      await billRepository.save(challans);

      res.status(201).json({
        message: `${challans.length} Delivery Challans bulk converted to Tax Invoice successfully!`,
        invoice: savedInvoice,
        convertedCount: challans.length,
      });
    } catch (error: any) {
      console.error("Error bulk converting challans to invoice:", error);
      res.status(500).json({
        message: "Failed to bulk convert challans to invoice",
        error: error.message || String(error),
      });
    }
  }

  /**
   * Update bill
   */
  static async updateBill(req: CustomRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const organizationId = req.user?.organization?.id;
      const updateData = req.body;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      const billRepository = getRepository(Bill);
      const billItemRepository = getRepository(BillItem);

      // Find the bill (supports UUID, invoiceId, billNumber, or challanNo)
      let bill;
      if (isUUID(id)) {
        bill = await billRepository.findOne({
          where: { id, organizationId },
        });
      } else {
        bill = await billRepository.findOne({
          where: [
            { invoiceId: id, organizationId },
            { billNumber: id, organizationId },
            { challanNo: id, organizationId },
          ],
        });
      }

      if (!bill) {
        res.status(404).json({ message: "Bill not found" });
        return;
      }

      // Update bill fields (allow all fields except id, organizationId, createdById)
      const allowedFields = [
        "invoiceId",
        "billNumber",
        "customerId",
        "customerName",
        "customerEmail",
        "customerPhone",
        "companyName",
        "vendorGstNumber",
        "vendorPanNumber",
        "vendorWebsite",
        "billingAddress",
        "issueDate",
        "dueDate",
        "paymentMethod",
        "subtotal",
        "tax",
        "discount",
        "total",
        "amountPaid",
        "notes",
        "status",
        "billType",
        "invoiceReference",
        "applyGst",
        "gstRate",
        "vehicleNo",
        "transportName",
        "challanNo",
        "documentType",
      ];

      allowedFields.forEach((field) => {
        if (updateData[field] !== undefined) {
          (bill as any)[field] = updateData[field];
        }
      });

      // Recalculate amountRemaining and paymentStatus
      const amountPaid = parseFloat(bill.amountPaid?.toString() || "0");
      const total = parseFloat(bill.total?.toString() || "0");
      bill.amountRemaining = Math.max(0, total - amountPaid);

      if (amountPaid >= total) {
        bill.paymentStatus = PaymentStatus.PAID;
      } else if (amountPaid > 0) {
        bill.paymentStatus = PaymentStatus.PARTIALLY_PAID;
      } else {
        bill.paymentStatus = PaymentStatus.UNPAID;
      }

      // Delete items property from bill entity so TypeORM's persistence doesn't attempt to cascade/nullify items
      delete (bill as any).items;

      // Save bill header first
      await billRepository.save(bill);

      // Update bill items
      if (Array.isArray(updateData.items)) {
        await billItemRepository.delete({ billId: bill.id });
        const newItems = updateData.items.map((item: any) =>
          billItemRepository.create({
            billId: bill.id,
            bill: bill,
            productId: item.productId ?? null,
            description: item.description || item.item || "",
            hsnCode: item.hsnCode || "5402",
            category: item.category || null,
            carton: item.carton ?? 0,
            weight: item.weight ?? 0,
            kg: item.kg ?? 0,
            quantity: item.quantity ?? 1,
            unitPrice: item.unitPrice ?? 0,
            total: item.total ?? ((item.quantity ?? 1) * (item.unitPrice ?? 0)),
            notes: item.notes ?? null,
          })
        );
        await billItemRepository.save(newItems);
      }

      // Get the updated bill with items
      const updatedBill = await billRepository.findOne({
        where: { id: bill.id },
        relations: ["items"],
      });

      res.status(200).json({
        message: "Bill updated successfully",
        bill: updatedBill,
      });
    } catch (error: any) {
      console.error("Error updating bill:", error);
      res.status(500).json({
        message: "Error updating bill",
        error: error.message || String(error),
      });
    }
  }

  /**
   * Update bill status
   */
  static async updateBillStatus(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const organizationId = req.user?.organization?.id;
      const { status } = req.body;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      if (!Object.values(BillStatus).includes(status)) {
        res.status(400).json({ message: "Invalid bill status" });
        return;
      }

      const billRepository = getRepository(Bill);
      const bill = await billRepository.findOne({
        where: { id, organizationId },
      });

      if (!bill) {
        res.status(404).json({ message: "Bill not found" });
        return;
      }

      bill.status = status;
      await billRepository.save(bill);

      res.status(200).json({
        message: "Bill status updated successfully",
        bill,
      });
    } catch (error: any) {
      console.error("Error updating bill status:", error);
      res.status(500).json({
        message: "Error updating bill status",
        error: error.message || String(error),
      });
    }
  }

  /**
   * Delete bill
   */
  static async deleteBill(req: CustomRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const organizationId = req.user?.organization?.id;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      // Use a transaction for the delete operation to ensure consistency
      const queryRunner =
        getRepository(Bill).manager.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // First, find the bill to verify it exists (supports UUID, invoiceId, billNumber, or challanNo)
        let bill;
        if (isUUID(id)) {
          bill = await queryRunner.manager.findOne(Bill, {
            where: { id, organizationId },
          });
        } else {
          bill = await queryRunner.manager.findOne(Bill, {
            where: [
              { invoiceId: id, organizationId },
              { billNumber: id, organizationId },
              { challanNo: id, organizationId },
            ],
          });
        }

        if (!bill) {
          await queryRunner.rollbackTransaction();
          res.status(404).json({ message: "Bill not found" });
          return;
        }

        const actualBillId = bill.id;

        // Find any orders that reference this bill
        const orderRepository = queryRunner.manager.getRepository(Order);
        const referencingOrders = await orderRepository.find({
          where: { billId: actualBillId },
        });

        // Update any orders that reference this bill to remove the reference
        if (referencingOrders.length > 0) {
          console.log(
            `Updating ${referencingOrders.length} orders to remove bill reference`
          );

          // Use a direct query to update orders and set billId to null
          await queryRunner.query(
            `UPDATE "orders" SET "billId" = NULL WHERE "billId" = $1`,
            [actualBillId]
          );
          console.log("Orders updated successfully");
        }

        // Now delete bill items
        await queryRunner.manager.delete(BillItem, { billId: actualBillId });

        // Finally delete the bill
        await queryRunner.manager.delete(Bill, { id: actualBillId });

        await queryRunner.commitTransaction();

        res.status(200).json({ message: "Bill deleted successfully" });
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error: any) {
      console.error("Error deleting bill:", error);
      res.status(500).json({
        message: "Error deleting bill",
        error: error.message || String(error),
      });
    }
  }

  /**
   * Download bill as PDF
   */
  static async downloadBillPDF(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const organizationId = req.user?.organization?.id;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      console.log("Downloading bill PDF for ID:", id);

      // Get the bill
      const billRepository = getRepository(Bill);
      const bill = (await billRepository.findOne({
        where: { id, organizationId },
        relations: ["items"],
      })) as any;

      if (!bill) {
        res.status(404).json({ message: "Bill not found" });
        return;
      }

      // Get organization invoice settings
      const invoiceSettingsRepository = getRepository(InvoiceSettings);
      const invoiceSettings = (await invoiceSettingsRepository.findOne({
        where: { organizationId },
      })) as InvoiceSettings | undefined;

      // Get organization details
      const organizationRepository = getRepository(Organization);
      const organization = await organizationRepository.findOne({
        where: { id: organizationId },
        relations: ["addresses"],
      });

      if (!organization) {
        res.status(404).json({ message: "Organization not found" });
        return;
      }

      // Find billing address (default address)
      const billingAddress =
        organization.addresses?.find((addr: any) => addr.isDefault) ||
        (organization.addresses?.length > 0 ? organization.addresses[0] : null);

      // city": "Junagadh",
      // "state": "Gujarat",
      // "street": "jhdbsjbvsdbv",
      // "country": "India",
      // "postalCode": "202020"

      // Prepare organization data for PDF
      const orgData = {
        name: invoiceSettings?.organizationName || organization.name,
        gstNumber: invoiceSettings?.gstNumber || "",
        panNumber: invoiceSettings?.panNumber || "",
        email: organization.email || "",
        phone: organization.phone || "",
        website: organization.website || "",
        address: invoiceSettings,
        // Include invoice settings if available
        invoicePrefix: invoiceSettings?.invoicePrefix || "INV",
        termsAndConditions: invoiceSettings?.termsAndConditions || [],
        footerText: invoiceSettings?.footerText || "",
        logo: invoiceSettings?.logo || "",
        signature: invoiceSettings?.signature || "",
        showBankDetails: false,
        bankDetails: {},
      };
      // Create a buffer to capture the PDF data
      const buffers: Buffer[] = [];
      const mockStream = new Writable({
        write(chunk: Buffer, encoding: string, callback: Function) {
          buffers.push(
            typeof chunk === "string"
              ? Buffer.from(chunk, encoding as BufferEncoding)
              : chunk
          );
          callback();
        },
      });

      // Add necessary response-like methods
      (mockStream as any).setHeader = () => mockStream;

      // Extract customer GST information if available
      const customerGstDetails = {
        gstNumber: bill.customerGst || "",
        gstState: bill.customerGstState || "",
        gstType: bill.customerGstType || "",
      };

      // If there's a customerId, try to get additional GST details from Customer
      if (bill.customerId) {
        try {
          const customerRepository = getRepository(Customer);
          const customer = await customerRepository.findOne({
            where: { id: bill.customerId },
          });

          if (customer) {
            customerGstDetails.gstNumber =
              customer.gstNumber || customerGstDetails.gstNumber;
            customerGstDetails.gstState =
              customer.gstState || customerGstDetails.gstState;
            customerGstDetails.gstType =
              customer.gstType || customerGstDetails.gstType;
          }
        } catch (err) {
          console.warn("Could not fetch customer GST details", err);
        }
      }

      // Set appropriate headers for PDF download
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="bill-${bill.billNumber}.pdf"`
      );

      // Generate PDF using the bill service
      await Pdfservice.PDFService.generateBillPDF(
        bill,
        res,
        orgData,
        customerGstDetails
      );
    } catch (error) {
      console.error("Error downloading bill PDF:", error);
      res
        .status(500)
        .json({ message: "Error downloading bill PDF", error: String(error) });
    }
  }

  static async getBillByOrderId(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const { orderId } = req.params;
      const organizationId = req.user?.organization?.id;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      if (!orderId) {
        res.status(400).json({ message: "Order ID is required" });
        return;
      }

      const billRepository = getRepository(Bill);

      const bill = await billRepository.findOne({
        where: { invoiceId: orderId, organizationId },
        relations: ["items"],
      });

      if (!bill) {
        res.status(404).json({ message: "Bill not found" });
        return;
      }

      res.json(bill);
    } catch (error) {
      console.error("Error getting bill by order ID:", error);
      res.status(500).json({
        message: "Error getting bill by order ID",
        error: String(error),
      });
    }
  }

  static async downloadBillPDFByOrderId(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      // GET bill id by orderId
      const { orderId } = req.params;
      const organizationId = req.user?.organization?.id;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      if (!orderId) {
        res.status(400).json({ message: "Order ID is required" });
        return;
      }

      const billRepository = getRepository(Bill);

      const bill = await billRepository.findOne({
        where: { invoiceId: orderId, organizationId },
        relations: ["items"],
      });

      if (!bill) {
        res.status(404).json({ message: "Bill not found" });
        return;
      }
      // Create a new request object by modifying the original request
      const modifiedReq: CustomRequest = Object.assign({}, req, {
        params: { id: bill?.id },
      });

      BillController.downloadBillPDF(modifiedReq, res);
    } catch (error) {
      console.error("Error downloading bill PDF by order ID:", error);
      res.status(500).json({
        message: "Error downloading bill PDF",
        error: String(error),
      });
    }
  }

  /**
   * Generate a bill number for preview
   */
  static async generateBillNumber(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const { billType } = req.query;

      if (!billType) {
        res.status(400).json({ message: "Bill type is required" });
        return;
      }

      // Use billType directly as it appears generateBillNumber accepts this parameter type too
      const billTypeValue = billType as string;
      const billNumber = await BillService.generateBillNumber(
        billTypeValue as any
      );

      res.json({
        billNumber,
      });
    } catch (error: any) {
      console.error("Error generating bill number:", error);
      res.status(500).json({
        message: "Error generating bill number",
        error: error.message || String(error),
      });
    }
  }

  /**
   * Update or create invoice settings
   */
  static async updateInvoiceSettings(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const organizationId = req.user?.organization?.id;
      const settingsData = req.body;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      const settingsRepository = getRepository(InvoiceSettings);

      // Check if settings already exist
      let existingSettings = await settingsRepository.findOne({
        where: { organizationId },
      });

      if (existingSettings) {
        // Update existing settings
        Object.assign(existingSettings, settingsData);
        await settingsRepository.save(existingSettings);
      } else {
        // Create new settings - remove any id property entirely
        const { id, ...settingsWithoutId } = settingsData; // Destructure to remove id property

        const newSettings = settingsRepository.create({
          ...settingsWithoutId,
          organizationId, // Use the organization ID from the user
        });

        existingSettings = await settingsRepository.save(newSettings);
      }

      res.json({
        message: "Invoice settings updated successfully",
        settings: existingSettings,
      });
    } catch (error) {
      console.error("Error updating invoice settings:", error);
      res.status(500).json({ message: "Error updating invoice settings" });
    }
  }

  /**
   * Get invoice settings
   */
  static async getInvoiceSettings(
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

      const settingsRepository = getRepository(InvoiceSettings);
      const settings = await settingsRepository.findOne({
        where: { organizationId },
      });

      if (!settings) {
        // Return default settings if none exist
        res.json({
          organizationId,
          invoicePrefix: "INV",
          nextInvoiceNumber: 1001,
          showLogo: true,
          showSignature: true,
          showBankDetails: true,
          taxRate: 18.0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        return;
      }

      res.json(settings);
    } catch (error) {
      console.error("Error fetching invoice settings:", error);
      res.status(500).json({ message: "Error fetching invoice settings" });
    }
  }
}

// Helper function to check if a string is a valid UUID
function isUUID(str: string): boolean {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidPattern.test(str);
}
