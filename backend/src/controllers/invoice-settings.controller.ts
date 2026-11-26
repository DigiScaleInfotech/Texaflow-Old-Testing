import { Request, Response } from "express";
import { getRepository } from "../config/database";
import { InvoiceSettings } from "../entities/invoice-settings.entity";

// Define custom request interface with user property
interface CustomRequest extends Request {
  user?: any; // Using 'any' type for compatibility
}

export class InvoiceSettingsController {
  /**
   * Get invoice settings for organization
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

      const invoiceSettingsRepository = getRepository(InvoiceSettings);
      let settings = await invoiceSettingsRepository.findOne({
        where: { organizationId },
      });

      if (!settings) {
        // Create default settings if none exist
        settings = invoiceSettingsRepository.create({
          organizationId,
          invoicePrefix: "INV",
          termsAndConditions: [
            "1. Goods once sold will not be taken back.",
            "2. Interest @18% p.a. will be charged if payment is not made within due date.",
            "3. All disputes are subject to local jurisdiction only.",
          ],
          footerText: "Thank you for your business!",
          showLogo: true,
          showSignature: true,
          showBankDetails: true,
          nextInvoiceNumber: 1001,
          bankDetails: {
            bankName: "",
            accountNumber: "",
            ifscCode: "",
            branchName: "",
          },
        });
        await invoiceSettingsRepository.save(settings);
      }

      res.json(settings);
    } catch (error) {
      console.error("Error fetching invoice settings:", error);
      res.status(500).json({ message: "Error fetching invoice settings" });
    }
  }

  /**
   * Update invoice settings
   */
  static async updateInvoiceSettings(
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

      const settingsData = req.body;
      const invoiceSettingsRepository = getRepository(InvoiceSettings);

      let settings = await invoiceSettingsRepository.findOne({
        where: { organizationId },
      });

      // Handle file uploads if any
      if ((req as any).mediaUrls) {
        const mediaUrls = (req as any).mediaUrls;
        if (mediaUrls.logo) settingsData.logo = mediaUrls.logo;
        if (mediaUrls.signature) settingsData.signature = mediaUrls.signature;
      }

      // Handle organization address correctly
      if (settingsData.organizationAddress) {
        // Make sure it's stored as a proper object
        settingsData.organizationAddress = {
          street: settingsData.organizationAddress.street || "",
          city: settingsData.organizationAddress.city || "",
          state: settingsData.organizationAddress.state || "",
          postalCode: settingsData.organizationAddress.postalCode || "",
          country: settingsData.organizationAddress.country || "India",
        };
      }

      // Handle bank details
      if (settingsData.bankDetails) {
        settingsData.bankDetails = {
          bankName: settingsData.bankDetails.bankName || "",
          accountNumber: settingsData.bankDetails.accountNumber || "",
          ifscCode: settingsData.bankDetails.ifscCode || "",
          branchName: settingsData.bankDetails.branchName || "",
        };
      }

      if (settings) {
        // Update existing settings
        invoiceSettingsRepository.merge(settings, settingsData);
      } else {
        // Create new settings
        settings = invoiceSettingsRepository.create({
          organizationId,
          ...settingsData,
        });
      }

      await invoiceSettingsRepository.save(settings);

      res.json({
        message: "Invoice settings updated successfully",
        settings,
      });
    } catch (error) {
      console.error("Error updating invoice settings:", error);
      res.status(500).json({ message: "Error updating invoice settings" });
    }
  }

  /**
   * Get next invoice number
   */
  static async getNextInvoiceNumber(
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

      const invoiceSettingsRepository = getRepository(InvoiceSettings);
      const settings = await invoiceSettingsRepository.findOne({
        where: { organizationId },
      });

      if (!settings) {
        res.status(404).json({ message: "Invoice settings not found" });
        return;
      }

      const prefix = settings.invoicePrefix || "INV";
      const number = settings.nextInvoiceNumber || 1001;
      const invoiceNumber = `${prefix}-${number}`;

      res.json({
        nextInvoiceNumber: invoiceNumber,
        numericPart: number,
        prefix: prefix,
      });
    } catch (error) {
      console.error("Error getting next invoice number:", error);
      res.status(500).json({ message: "Error getting next invoice number" });
    }
  }

  /**
   * Increment invoice number
   */
  static async incrementInvoiceNumber(
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

      const invoiceSettingsRepository = getRepository(InvoiceSettings);
      const settings = await invoiceSettingsRepository.findOne({
        where: { organizationId },
      });

      if (!settings) {
        res.status(404).json({ message: "Invoice settings not found" });
        return;
      }

      // Increment invoice number
      settings.nextInvoiceNumber += 1;
      settings.lastInvoiceDate = new Date();
      await invoiceSettingsRepository.save(settings);

      res.json({
        message: "Invoice number incremented successfully",
        newNumber: settings.nextInvoiceNumber,
      });
    } catch (error) {
      console.error("Error incrementing invoice number:", error);
      res.status(500).json({ message: "Error incrementing invoice number" });
    }
  }
}
