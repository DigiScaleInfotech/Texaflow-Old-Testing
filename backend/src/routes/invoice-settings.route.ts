import { Router } from "express";
import { InvoiceSettingsController } from "../controllers/invoice-settings.controller";
import { authenticate } from "../middleware/auth.middleware";
import { mediaUploadMiddleware } from "../middleware/media-upload.middleware";

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get invoice settings
router.get("/", InvoiceSettingsController.getInvoiceSettings);

// Update invoice settings with media uploads
router.put(
  "/",
  mediaUploadMiddleware,
  InvoiceSettingsController.updateInvoiceSettings
);

// Get next invoice number
router.get("/next-number", InvoiceSettingsController.getNextInvoiceNumber);

// Increment invoice number
router.post(
  "/increment-number",
  InvoiceSettingsController.incrementInvoiceNumber
);

export default router;
