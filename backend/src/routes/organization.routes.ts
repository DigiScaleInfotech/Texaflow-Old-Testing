import { Router } from "express";
import { OrganizationController } from "../controllers/organization.controller";
import { authenticate } from "../middleware/auth.middleware";
import { mediaUploadMiddleware } from "../middleware/media-upload.middleware";

const router = Router();

// Apply auth middleware to all routes
router.use(authenticate);

// Get current organization for logged in user
router.get("/current", OrganizationController.getCurrentOrganization);

// Settings routes - add explicit routes for specific settings types
router.get("/salary-settings", OrganizationController.getSalarySettings);
router.put("/salary-settings", OrganizationController.updateSalarySettings);

// Settings routes with the generic pattern (must be after specific routes)
router.get("/:id/settings", OrganizationController.getOrganizationSettings);
router.put("/:id/settings", OrganizationController.updateOrganizationSettings);

// Get organization by ID (this should be after specific routes to avoid conflicts)
router.get("/:id", OrganizationController.getOrganizationById);

// Other organization routes
router.post("/", OrganizationController.createOrganization);
router.put("/:id", OrganizationController.updateOrganization);
router.delete("/:id", OrganizationController.deleteOrganization);
router.post("/:id/approve", OrganizationController.approveOrganization);
router.post("/:id/reject", OrganizationController.rejectOrganization);
router.get("/stats", OrganizationController.getOrganizationStats);

export default router;
