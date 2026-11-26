import { Router } from "express";
import { OrganizationController } from "../controllers/organization.controller";
import { OrganizationSubscriptionController } from "../controllers/organization-subscription.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Apply authenticate middleware to all organization routes
router.use(authenticate);

// Get all organizations with pagination
router.get("/", OrganizationController.getAllOrganizations);

// Get current organization
router.get("/current", OrganizationController.getCurrentOrganization);

// Get organization by ID
router.get("/:id", OrganizationController.getOrganizationById);

// Create a new organization
router.post("/", OrganizationController.createOrganization);

// Update organization
router.put("/", OrganizationController.updateOrganization);

// Delete organization
router.delete("/:id", OrganizationController.deleteOrganization);

// Subscription endpoints
router.post("/subscribe", OrganizationSubscriptionController.subscribe);
router.get(
  "/subscription",
  OrganizationSubscriptionController.getCurrentSubscription
);

// New salary settings endpoints
router.get("/salary-settings", OrganizationController.getSalarySettings);
router.put("/salary-settings", OrganizationController.updateSalarySettings);

// Get organization dashboard stats
router.get("/stats/dashboard", OrganizationController.searchOrganizations); // Temporary replacement

// Get organization settings - need to implement this method
router.get("/settings", OrganizationController.getSalarySettings); // Use existing salary settings method

export default router;
