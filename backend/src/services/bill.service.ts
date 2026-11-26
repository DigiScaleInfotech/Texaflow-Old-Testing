import { Between, getRepository } from "typeorm";
import { Bill } from "../entities/bill.entity";
import { BillItem } from "../entities/bill-item.entity";
import { BillType, BillStatus } from "../interface/bill";
import { PaymentStatus } from "../interface/order";
import { AppDataSource } from "../config/database";
import { InvoiceSettings } from "../entities/invoice-settings.entity"; // Add this import

export class BillService {
  /**
   * Generate unique bill number with prefix
   */
  static async generateBillNumber(
    invoiceSettings?: InvoiceSettings
  ): Promise<string> {
    try {
      // Ensure the connection is initialized
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
      }

      // Use provided invoice prefix from settings if available
      const prefix = invoiceSettings?.invoicePrefix || "INV";
      let baseNumber = invoiceSettings?.nextInvoiceNumber || 1001;

      const billRepository = AppDataSource.getRepository(Bill);

      // Query database to find highest existing number for this prefix
      const existingBills = await billRepository
        .createQueryBuilder("b")
        .select(["b.billNumber", "b.invoiceId"])
        .where("b.billNumber LIKE :pattern OR b.invoiceId LIKE :pattern", {
          pattern: `${prefix}-%`,
        })
        .getMany();

      let maxNumber = baseNumber - 1;
      for (const b of existingBills) {
        const checkStr = b.billNumber || b.invoiceId || "";
        const match = checkStr.match(new RegExp(`^${prefix}-(\\d+)`, "i"));
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num;
          }
        }
      }

      const nextNumber = maxNumber + 1;
      const billNumber = `${prefix}-${nextNumber}`;

      // If we have invoice settings, update nextInvoiceNumber
      if (invoiceSettings && invoiceSettings.id) {
        try {
          const invoiceSettingsRepository =
            AppDataSource.getRepository(InvoiceSettings);
          invoiceSettings.nextInvoiceNumber = nextNumber + 1;
          await invoiceSettingsRepository.save(invoiceSettings);
        } catch (error) {
          console.error("Error updating next invoice number:", error);
        }
      }

      return billNumber;
    } catch (error) {
      console.error("Error generating bill number:", error);
      const timestamp = Date.now().toString().slice(-6);
      return `INV-${timestamp}`;
    }
  }

  /**
   * Generate a sequential bill number with a prefix based on bill type
   */
  static async generateBillNumberByType(billType: BillType): Promise<string> {
    const billRepository = getRepository(Bill);
    const currentYear = new Date().getFullYear().toString();

    let prefix;
    switch (billType) {
      case BillType.SALES:
        prefix = "INV";
        break;
      case BillType.PURCHASE:
        prefix = "PUR";
        break;
      case BillType.EXPENSE:
        prefix = "EXP";
        break;
      default:
        prefix = "BIL";
    }

    // Find the highest bill number for the current type and year
    const latestBill = await billRepository
      .createQueryBuilder("bill")
      .where("bill.billNumber LIKE :pattern", {
        pattern: `${prefix}-${currentYear}%`,
      })
      .orderBy("bill.billNumber", "DESC")
      .getOne();

    let sequenceNumber = 1;
    if (latestBill) {
      // Extract the sequence number from the latest bill
      const parts = latestBill.billNumber.split("-");
      const lastSequence = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSequence)) {
        sequenceNumber = lastSequence + 1;
      }
    }

    // Format the sequence number with leading zeros
    const formattedSequence = sequenceNumber.toString().padStart(4, "0");
    return `${prefix}-${currentYear}-${formattedSequence}`;
  }

  /**
   * Create a new bill with items
   */
  static async createBill(billData: any): Promise<Bill> {
    try {
      // Ensure the connection is initialized
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
      }

      const billRepository = AppDataSource.getRepository(Bill);
      const billItemRepository = AppDataSource.getRepository(BillItem);
      const invoiceSettingsRepository =
        AppDataSource.getRepository(InvoiceSettings);

      // Extract items from bill data
      const { items, ...billProperties } = billData;

      // Fetch invoice settings for the organization if available
      let invoiceSettings = null;
      if (billProperties.organizationId) {
        invoiceSettings = (await invoiceSettingsRepository.findOne({
          where: { organizationId: billProperties.organizationId },
        })) as any; // Cast to any to avoid type issues
      }

      // Generate bill number using invoice settings if available
      const billNumber = await BillService.generateBillNumber(invoiceSettings);

      // Start a transaction
      const queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Prepare additional data from invoice settings if available
        const additionalData = invoiceSettings
          ? {
              // Prioritize organization info from invoice settings over bill data
              organizationName:
                invoiceSettings.organizationName ||
                billProperties.organizationName,
              organizationAddress:
                invoiceSettings.organizationAddress ||
                billProperties.organizationAddress,
              footerText:
                invoiceSettings.footerText || billProperties.footerText,
              termsAndConditions:
                invoiceSettings.termsAndConditions ||
                billProperties.termsAndConditions,
              invoiceNotes:
                invoiceSettings.invoiceNotes || billProperties.notes,

              // Prioritize GST details from invoice settings
              vendorGstNumber:
                invoiceSettings.gstNumber || billProperties.vendorGstNumber,
              vendorPanNumber:
                invoiceSettings.panNumber || billProperties.vendorPanNumber,

              // Prioritize tax-related fields from invoice settings
              taxIdentificationNumber:
                invoiceSettings.taxIdentificationNumber ||
                billProperties.taxIdentificationNumber,
              taxRate: invoiceSettings.taxRate || billProperties.taxRate || 18, // Default to 18% GST if not specified
            }
          : {};

        // Create the bill with organization data from invoice settings
        const bill = billRepository.create({
          ...billProperties,
          ...additionalData,
          billNumber,
          issueDate: billProperties.issueDate || new Date(),
          dueDate:
            billProperties.dueDate ||
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: billProperties.status || BillStatus.ACTIVE,
          paymentStatus: billProperties.paymentStatus || "unpaid", // Use string that matches enum
        });

        // Save the bill using direct query to avoid array return type issues
        const result = await queryRunner.manager.save(bill);

        // Ensure we have a single Bill entity
        const savedBill = Array.isArray(result) ? result[0] : result;

        // Create and save bill items if they exist
        if (items && Array.isArray(items) && items.length > 0) {
          const billItems = items.map((item: any) => {
            return billItemRepository.create({
              billId: savedBill.id,
              productId: item.productId,
              description: item.description,
              category: item.category || "",
              hsnCode: item.hsnCode || "",
              quantity: item.quantity || 1,
              carton: item.carton || 0,
              weight: item.weight || 0,
              kg: item.kg || 0,
              unitPrice: item.unitPrice || 0,
              total: item.total || item.unitPrice * (item.quantity || 1),
            });
          });

          await queryRunner.manager.save(billItems);
        }

        // Commit the transaction
        await queryRunner.commitTransaction();

        // Fetch the bill with items before returning to ensure we have the complete object
        const completeBill = await billRepository.findOne({
          where: { id: savedBill.id },
          relations: ["items"],
        });

        // Return the complete bill or the saved bill if fetch fails
        return completeBill || savedBill;
      } catch (error) {
        // Rollback in case of error
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        // Release the query runner
        await queryRunner.release();
      }
    } catch (error) {
      console.error("Error creating bill:", error);
      throw error;
    }
  }

  /**
   * Get bill by ID
   */
  static async getBillById(id: string): Promise<Bill | null> {
    try {
      // Ensure the connection is initialized
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
      }

      const billRepository = AppDataSource.getRepository(Bill);
      return await billRepository.findOne({
        where: { id },
        relations: ["items", "items.product"],
      });
    } catch (error) {
      console.error("Error getting bill:", error);
      throw error;
    }
  }

  /**
   * Generate PDF for a bill
   */
  static async generateBillPDF(billId: string): Promise<Buffer> {
    try {
      // Get the bill with all related data
      const bill = await BillService.getBillById(billId);

      if (!bill) {
        throw new Error("Bill not found");
      }

      // Here you would typically use a PDF library like PDFKit or html-pdf
      // For now, let's assume we're using an imported PDF service
      const pdfService = require("../services/pdf.service");

      // Generate the PDF
      const pdfBuffer = await pdfService.generateInvoicePDF(bill);

      return pdfBuffer;
    } catch (error) {
      console.error("Error generating bill PDF:", error);
      throw error;
    }
  }
}
