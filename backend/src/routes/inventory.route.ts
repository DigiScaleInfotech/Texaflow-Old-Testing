import { Router } from "express";
import { InventoryController } from "../controllers/inventory.controller";
import { authenticate } from "../middleware/auth.middleware";
import { mediaUploadMiddleware } from "../middleware/media-upload.middleware";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Map inventory routes to product controller methods
router.get("/", InventoryController.getInventoryItems);
router.get("/stats", InventoryController.getInventoryStats);
router.get("/:id", InventoryController.getProductById);
// Add new endpoint to fetch stock transaction history
router.get("/:id/transactions", InventoryController.getProductTransactions);
router.post("/", mediaUploadMiddleware, InventoryController.createProduct);
router.put("/:id", mediaUploadMiddleware, InventoryController.updateProduct);
router.delete("/:id", InventoryController.deleteProduct);
router.patch("/:id/stock", InventoryController.updateProductStock);

export default router;
