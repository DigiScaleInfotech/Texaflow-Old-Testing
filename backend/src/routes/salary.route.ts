import { Router } from "express";
import { SalaryController } from "../controllers/salary.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Salary payment routes
router.get("/", SalaryController.getSalaryPayments);
router.post("/", SalaryController.createSalaryPayment);
router.get("/summary", SalaryController.getSalarySummary);

export default router;
