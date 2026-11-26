import { Router } from "express";
import { CategoryController } from "../controllers/category.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Apply authenticate middleware to all category routes
router.use(authenticate);

// Get all categories with pagination and filtering
router.get("/", CategoryController.getCategories);

// Get category hierarchy
router.get("/hierarchy", CategoryController.getCategoryHierarchy);

// Get category by ID
router.get("/:id", CategoryController.getCategoryById);

// Create a new category
router.post("/", CategoryController.createCategory);

// Update category order
router.post("/order", CategoryController.updateCategoryOrder);

// Update category
router.put("/:id", CategoryController.updateCategory);

// Delete category
router.delete("/:id", CategoryController.deleteCategory);

export default router;
