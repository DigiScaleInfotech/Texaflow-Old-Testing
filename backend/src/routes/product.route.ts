import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { InventoryController } from "../controllers/inventory.controller";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Map product routes to inventory controller methods
// Important: Place /stats before /:id to prevent conflicts with route parameters
router.get("/stats", InventoryController.getInventoryStats);
router.get("/", InventoryController.getInventoryItems);
router.get("/:id", InventoryController.getProductById);
router.post("/", InventoryController.createProduct);
router.put("/:id", InventoryController.updateProduct);
router.delete("/:id", InventoryController.deleteProduct);
router.patch("/:id/stock", InventoryController.updateProductStock);

export default router;
