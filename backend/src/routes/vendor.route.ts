import { Router } from "express";
import { VendorController } from "../controllers/vendor.controller";
import { authenticate, isAdmin } from "../middleware/auth.middleware";

const router = Router();

// Apply authentication middleware to protected routes
router.use(authenticate);

// Get all vendors
router.get("/", VendorController.getVendors);

// Get vendor by status - use getVendors with query params
router.get("/status/:status", VendorController.getVendors);

// Get vendor by ID
router.get("/:id", VendorController.getVendorById);

// Add missing vendor settings routes
router.get("/settings/documents", VendorController.getRequiredDocuments);
router.post(
  "/settings/documents",
  isAdmin,
  VendorController.updateRequiredDocuments
);
router.get("/settings/gst", VendorController.getGSTSettings);
router.post("/settings/gst", isAdmin, VendorController.updateGSTSettings);
router.get("/settings/policies", VendorController.getVendorPolicies);
router.post(
  "/settings/policies",
  isAdmin,
  VendorController.updateVendorPolicies
);

// Update vendor
router.put("/:id", VendorController.updateVendor);

// Delete vendor
router.delete("/:id", isAdmin, VendorController.deleteVendor);

// Approve vendor - use updateVendor with status in the body
router.post("/:id/approve", isAdmin, VendorController.updateVendor);

// Reject vendor - use updateVendor with status in the body
router.post("/:id/reject", isAdmin, VendorController.updateVendor);

// Vendor reapplication route
router.post("/reapply", VendorController.reapplyVendor);

export default router;
