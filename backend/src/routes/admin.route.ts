import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { UserRole } from "../interface/user";

const router = Router();

// All routes require authentication and admin access
router.use(authenticate);
router.use(authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN])); // Use the middleware factory correctly

// Organization management routes
router.get("/organizations/pending", AdminController.getPendingOrganizations);
router.post("/organizations/:id/approve", AdminController.approveOrganization);
router.post("/organizations/:id/reject", AdminController.rejectOrganization);
router.post("/organizations/:id/block", AdminController.blockOrganization);

export default router;
