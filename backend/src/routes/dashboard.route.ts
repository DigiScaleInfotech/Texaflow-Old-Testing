import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Apply authentication middleware to all dashboard routes
router.use(authenticate);

// Dashboard overview data
router.get("/overview", DashboardController.getOverview);

// Dashboard summary metrics
router.get("/summary", DashboardController.getSummary);

// Sales statistics
router.get("/sales", DashboardController.getSalesData);

// Orders distribution data
router.get("/orders", DashboardController.getOrdersData);

// Inventory status data
router.get("/inventory", DashboardController.getInventoryData);

// Top customers
router.get("/top-customers", DashboardController.getTopCustomers);

// Product performance data
router.get("/product-performance", DashboardController.getProductPerformance);

// Yearly revenue data
router.get("/yearly-revenue", DashboardController.getYearlyRevenue);

export default router;
