import { Router } from "express";
import { VendorApplicationController } from "../controllers/vendor-application.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Get all vendor applications
router.get("/", VendorApplicationController.getVendorApplications);

// Get vendor application by ID
router.get("/:id", VendorApplicationController.getVendorApplicationById);

// Update vendor application status
router.put(
  "/:id/status",
  VendorApplicationController.updateVendorApplicationStatus
);

export default router;
