import { Router } from "express";
import { InventoryController } from "../controllers/inventory.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Apply authentication middleware to all inventory routes
router.use(authenticate);

// Existing routes
router.get("/", InventoryController.getInventoryItems);
router.get("/:id", InventoryController.getProductById);
router.post("/", InventoryController.createProduct);
router.put("/:id", InventoryController.updateProduct);
router.delete("/:id", InventoryController.deleteProduct);
router.patch("/:id/stock", InventoryController.updateProductStock);
router.get("/:id/transactions", InventoryController.getProductTransactions);

// Add the stats endpoint if it doesn't exist
router.get("/stats", InventoryController.getInventoryStats);

export default router;
