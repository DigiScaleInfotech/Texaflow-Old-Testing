import { Router } from "express";
import { FinanceController } from "../controllers/finance.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Apply auth to all finance routes
router.use(authenticate);

// Finance Summary & Overview
router.get("/summary", FinanceController.getFinanceSummary);

// Payments (Payment In / Payment Out)
router.get("/payments", FinanceController.getPayments);
router.post("/payments", FinanceController.createPayment);
router.delete("/payments/:id", FinanceController.deletePayment);

// Expenses
router.get("/expenses", FinanceController.getExpenses);
router.get("/expenses/:id", FinanceController.getExpenseById);
router.post("/expenses", FinanceController.createExpense);
router.put("/expenses/:id", FinanceController.updateExpense);
router.delete("/expenses/:id", FinanceController.deleteExpense);

// Party Ledger (ખાતાવહી)
router.get("/ledger", FinanceController.getPartyLedger);

// Outstanding Report (ઉઘરાણી)
router.get("/outstanding", FinanceController.getOutstandingReport);

export default router;
