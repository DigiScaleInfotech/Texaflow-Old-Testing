import { Router } from "express";
import { SubscriptionController } from "../controllers/subscription.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Public route to get all subscription plans
router.get("/plans", SubscriptionController.getSubscriptionPlans);

// Debug test route
router.get("/test", (req, res) => {
  res.json({ message: "Subscription test route works" });
});

// Protected routes
router.use(authenticate);

// Get current subscription with usage statistics
router.get("/current", SubscriptionController.getCurrentSubscription);

// Razorpay order creation endpoint for subscription payment
router.post("/razorpay-order", SubscriptionController.createRazorpayOrder);

// Subscribe to a plan
router.post("/subscribe", SubscriptionController.subscribeToPlan);

// Cancel subscription
router.post("/cancel/:id", SubscriptionController.cancelSubscription);

export default router;
