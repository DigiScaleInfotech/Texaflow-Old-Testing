import { Router } from "express";
import { EmployeeController } from "../controllers/employee.controller";
import { authenticate } from "../middleware/auth.middleware";
import { mediaUploadMiddleware } from "../middleware/media-upload.middleware";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Employee CRUD routes
router.get("/", EmployeeController.getEmployees);
router.post("/",mediaUploadMiddleware, EmployeeController.createEmployee);
router.get("/:id", EmployeeController.getEmployeeById);
router.put("/:id",mediaUploadMiddleware, EmployeeController.updateEmployee);
router.delete("/:id", EmployeeController.deleteEmployee);

export default router;
