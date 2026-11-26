import { Express, Request, Response } from "express";
import { Router } from "express";
import authRoutes from "./auth.route";
import customerRoutes from "./customer.route";
import vendorApplicationRoutes from "./vendor-application.route";
import vendorRoutes from "./vendor.route";
import organizationRoutes from "./organization.route";
import subscriptionRoutes from "./subscription.route";
import notificationRoutes from "./notification.route";
import userRoutes from "./user.route";
import { protectedRoute, adminRoute, indexedRoute } from "../middleware";
import { getRepository } from "../config/database";
import { Organization } from "../entities/organization.entity";
import { User } from "../entities/user.entity";
import orderRoutes from "./order.route";
import inventoryRoutes from "./inventory.route";
import billRoutes from "./bill.routes";
import employeeRoutes from "./employee.route";
import salaryRoutes from "./salary.route";
import attendanceRoutes from "./attendance.route";
import dashboardRoutes from "./dashboard.route";
import categoryRoutes from "./category.route";
import locationRoutes from "./location.route";
import shippingRoutes from "./shipping.route";
import MideaRoute from "./media.routes";
import vendorMessageRoutes from "./vendor-message.route"; // Import the vendor message routes
// Add to your routes/index.ts or app.ts
import invoiceSettingsRoutes from "./invoice-settings.route";
import financeRoutes from "./finance.route";

export const setupRoutes = (app: Express) => {
  // Public routes
  app.get("/", (req: Request, res: Response) => {
    res.send("API is running...");
  });
  
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "OK", timestamp: new Date() });
  });
  
  // Auth routes (mounted on both /api/auth and /auth for compatibility)
  app.use("/api/auth", authRoutes);
  app.use("/auth", authRoutes);

  // User routes
  app.use("/api/users", userRoutes);
  app.use("/users", userRoutes);
  
  // Organization routes
  app.use("/api/organizations", organizationRoutes);
  app.use("/organizations", organizationRoutes);
  
  // Invoice settings routes
  app.use("/api/invoice-settings", invoiceSettingsRoutes);
  
  // Subscription routes
  app.use("/api/subscription", subscriptionRoutes);

  // Media routes
  app.use("/api/media", MideaRoute);

  // Vendor message routes
  app.use("/api/vendor-messages", vendorMessageRoutes);

  // Vendor routes
  app.use("/api/vendors", vendorRoutes);

  // Fix the vendor applications route - make sure it's mounted at the correct path
  // IMPORTANT: This must come before any other routes that use /vendors/:id pattern
  app.use("/api/vendor-applications", vendorApplicationRoutes);

  // Customer routes
  app.use("/api/customers", customerRoutes);

  // Notification routes
  app.use("/api/notifications", notificationRoutes);

  app.use("/api/orders", orderRoutes);

  app.use("/api/inventory", inventoryRoutes);

  app.use("/api/bills", billRoutes);
  app.use("/api/finance", financeRoutes);

  // Employee management routes
  app.use("/api/employees", employeeRoutes);
  app.use("/api/salary", salaryRoutes);
  app.use("/api/attendance", attendanceRoutes);

  // Dashboard routes
  app.use("/api/dashboard", dashboardRoutes);

  // Add this line to register category routes
  app.use("/api/categories", categoryRoutes);

  // Register location routes
  app.use("/api/location", locationRoutes);

  // Register shipping routes
  app.use("/api/shipping", shippingRoutes);

  // Protected routes (with authentication)
  protectedRoute(
    app,
    "/api/user/profile",
    "get",
    (req: Request, res: Response) => {
      res.json({ message: "Protected profile endpoint" });
    }
  );

  // Add indexed search routes
  indexedRoute(
    app,
    "/api/search/organizations",
    async (req: Request, res: Response) => {
      try {
        const { query, page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const orgRepository = getRepository(Organization);
        const [results, total] = await orgRepository
          .createQueryBuilder("org")
          .where(
            "org.name ILIKE :query OR org.businessName ILIKE :query OR org.email ILIKE :query",
            { query: `%{query}%` }
          )
          .orderBy("org.name", "ASC")
          .skip(skip)
          .take(Number(limit))
          .getManyAndCount();

        res.json({
          results,
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        });
      } catch (error) {
        console.error("Search error:", error);
        res.status(500).json({ message: "Error performing search" });
      }
    }
  );

  indexedRoute(
    app,
    "/api/search/users",
    async (req: Request, res: Response) => {
      try {
        const { query, page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const userRepository = getRepository(User);
        const [results, total] = await userRepository
          .createQueryBuilder("user")
          .where(
            "user.firstName ILIKE :query OR user.lastName ILIKE :query OR user.email ILIKE :query",
            { query: `%{query}%` }
          )
          .orderBy("user.firstName", "ASC")
          .skip(skip)
          .take(Number(limit))
          .getManyAndCount();

        // Remove sensitive information
        const sanitizedResults = results.map((user) => {
          const { password, ...sanitized } = user;
          return sanitized;
        });

        res.json({
          results: sanitizedResults,
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        });
      } catch (error) {
        console.error("Search error:", error);
        res.status(500).json({ message: "Error performing search" });
      }
    }
  );

  // High-performance indexed routes
  indexedRoute(app, "/api/organizations", (req: Request, res: Response) => {
    res.json({ message: "Indexed organizations endpoint" });
  });

  // Admin-only routes
  adminRoute(app, "/api/admin/users", "get", (req: Request, res: Response) => {
    res.json({ message: "Admin-only users endpoint" });
  });

  app.use((err : any, req : Request, res : Response, next : any) => {
  // Set CORS headers explicitly (same as your CORS config)
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

  // Catch-all 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({ message: "Route not found" });
  });

  
};

export default Router;
