import { Router } from "express";
import { ShippingController } from "../controllers/shipping.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// All shipping routes require authentication
router.use(authenticate);

// Create shipping for an order
router.post("/orders/:orderId", ShippingController.createShipping);

// Get all shippings for organization
router.get("/", ShippingController.getShippings);

// Get shipping by ID
router.get("/:id", ShippingController.getShippingById);

// Update shipping
router.put("/:id", ShippingController.updateShipping);

export default router;
