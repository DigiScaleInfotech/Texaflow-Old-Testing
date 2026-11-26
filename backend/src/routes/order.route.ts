import { Router } from "express";
import { OrderController } from "../controllers/order.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Order CRUD routes
router.get("/", OrderController.getOrders);
router.post("/", OrderController.createOrder);
router.get("/:id", OrderController.getOrderById);
router.put("/:id", OrderController.updateOrder);
router.delete("/:id", OrderController.deleteOrder);
router.patch("/:id/status", OrderController.updateOrderStatus);

// Order analytics routes
router.get("/analytics/dashboard", OrderController.getOrderAnalytics);
router.get("/analytics/recent", OrderController.getRecentOrders);

export default router;
