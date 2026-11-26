import { Router } from "express";
import { VendorMessageController } from "../controllers/vendor-message.controller";
import { authenticate, isAdmin } from "../middleware/auth.middleware";

const router = Router();

// Vendor sends message to admin
router.post("/admin", authenticate, VendorMessageController.sendMessageToAdmin);

// Vendor gets their message history
router.get(
  "/history",
  authenticate,
  VendorMessageController.getVendorMessageHistory
);

// Admin routes - protected by admin middleware
router.get(
  "/admin",
  authenticate,
  isAdmin,
  VendorMessageController.getVendorMessagesForAdmin
);
router.put(
  "/admin/:messageId/read",
  authenticate,
  isAdmin,
  VendorMessageController.markMessageAsRead
);
router.post(
  "/admin/:messageId/reply",
  authenticate,
  isAdmin,
  VendorMessageController.replyToVendorMessage
);

// Send email to customer (admin or vendor)
router.post(
  "/send-customer-email",
  // authenticate, // Re-enable authentication
  VendorMessageController.sendEmailToCustomer
);

export default router;
