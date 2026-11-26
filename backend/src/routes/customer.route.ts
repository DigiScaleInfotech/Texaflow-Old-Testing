import { Router } from "express";
import { CustomerController } from "../controllers/customer.controller";
import { authenticate } from "../middleware/auth.middleware";
import { mediaUploadMiddleware } from "../middleware/media-upload.middleware";
import { Request, Response } from "express";
import { Order } from "../entities/order.entity";
import { AppDataSource } from "../config/database"; // Import AppDataSource instead of getRepository


const router = Router();

// Apply authenticate middleware to all customer routes
router.use(authenticate);

// Get all customers with pagination and filtering
router.get("/", CustomerController.getCustomers);

// Get customer by ID
router.get("/:id", CustomerController.getCustomerById);

// Create a new customer with media upload
router.post("/", mediaUploadMiddleware, CustomerController.createCustomer);

// Update customer with media upload
router.put("/:id", mediaUploadMiddleware, CustomerController.updateCustomer);

// Delete customer
router.delete("/:id", CustomerController.deleteCustomer);

// Get customer statistics
router.get("/stats/overview", CustomerController.getCustomerStats);

// force delete customer with orders
router.delete(
  "/:id/force-delete", CustomerController.forceDeleteCustomerWithOrders);

// Get recent activity for a customer
router.get(
  "/:id/recent-activity",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const customerId = id;
      const organizationId = (req as any).user?.organization?.id;

      // Ensure database connection is initialized
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
      }

      // Get recent orders with more details
      const orderRepository = AppDataSource.getRepository(Order);

      // Get recent orders with relations
      const recentOrders = await orderRepository.find({
        where: { customerId, organizationId },
        relations: ["items", "items.product"], // Include order items and products
        order: { orderDate: "DESC" },
        take: 5,
      });

      // Calculate summary statistics
      let totalSpent = 0;
      let totalItems = 0;
      let averageOrderValue = 0;

      if (recentOrders.length > 0) {
        totalSpent = recentOrders.reduce(
          (sum, order) => sum + (order.total || 0),
          0
        );
        totalItems = recentOrders.reduce(
          (sum, order) => sum + (order.items?.length || 0),
          0
        );
        averageOrderValue = totalSpent / recentOrders.length;
      }

      res.json({
        recentOrders,
        orderStats: {
          totalOrders: recentOrders.length,
          totalSpent,
          totalItems,
          averageOrderValue,
        },
      });
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ message: "Error fetching recent activity" });
    }
  }
);

export default router;
