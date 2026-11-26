import { Response } from "express";
import { getRepository } from "../config/database";
import { Order } from "../entities/order.entity";
import { Customer } from "../entities/customer.entity";
import { Product } from "../entities/product.entity";
import { Bill } from "../entities/bill.entity";
import { OrderStatus } from "../interface/order";
import { User } from "../entities/user.entity";
import { Between, LessThan } from "typeorm";
import { PaymentStatus } from "../interface/bill";
import { Category } from "../entities/category.entity";
import { Employee } from "../entities/employee.entity";
import { CustomRequest } from "../middleware/auth.middleware";

// Define interfaces for other data types
interface PeriodData {
  label: string;
  date: Date;
}

interface OrderPeriodResult {
  period: string;
  sales: string;
}

interface OrderStatusResult {
  status: string;
  count: string;
}

interface ProductPerformanceResult {
  name: string;
  order_count: string;
  units_sold: string;
}

interface MonthlyRevenueResult {
  month: string;
  revenue: string;
}

// Define interface for order status counts
interface StatusCounts {
  [key: string]: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}

// Interface for trend calculation
interface TrendData {
  current: number;
  previous: number;
  percentChange: number;
  isPositive: boolean;
}

export class DashboardController {
  /**
   * Get dashboard overview data
   */
  static async getOverview(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const organizationId = req.user?.organization?.id;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      // Get date range from query parameter (default to 30 days)
      const range = (req.query.range as string) || "30days";

      // Calculate date range
      const today = new Date();
      let startDate = new Date();

      switch (range) {
        case "7days":
          startDate.setDate(today.getDate() - 7);
          break;
        case "90days":
          startDate.setDate(today.getDate() - 90);
          break;
        case "1year":
          startDate.setDate(today.getDate() - 365);
          break;
        case "30days":
        default:
          startDate.setDate(today.getDate() - 30);
          break;
      }

      // Repositories
      const orderRepository = getRepository(Order);
      const customerRepository = getRepository(Customer);
      const productRepository = getRepository(Product);
      const billRepository = getRepository(Bill);

      // Get sales data
      const orders = await orderRepository.find({
        where: {
          organizationId,
          orderDate: Between(startDate, today),
        },
      });

      // Calculate total sales and order count
      const totalSales = orders.reduce(
        (sum, order) => sum + (order.total || 0),
        0
      );
      const orderCount = orders.length;

      // Customer count
      const customerCount = await customerRepository.count({
        where: {
          organizationId,
          createdAt: Between(startDate, today),
        },
      });

      // Products count and inventory statistics
      const productCount = await productRepository.count({
        where: { organizationId },
      });

      // Low stock products
      const lowStockProducts = await productRepository.count({
        where: {
          organizationId,
          quantity: LessThan(10), // Assuming products with quantity < 10 are considered low stock
        },
      });

      // Calculate total inventory value
      const inventoryValue = await productRepository
        .createQueryBuilder("product")
        .select("SUM(product.price * product.quantity)", "value")
        .where("product.organizationId = :organizationId", { organizationId })
        .getRawOne()
        .then((result) => result.value || 0);

      // Bills data - Handle gracefully if table doesn't exist
      let unpaidBills = 0;
      try {
        unpaidBills = await billRepository.count({
          where: {
            organizationId,
            paymentStatus: "PENDING",
          },
        });
      } catch (error: any) {
        console.warn("Bills table may not exist yet:", error.message);
        // Continue with unpaidBills = 0
      }

      // Sales by date for chart data
      const salesByDate = await orderRepository
        .createQueryBuilder("order")
        .select("DATE(order.orderDate)", "date")
        .addSelect("SUM(order.total)", "total")
        .where("order.organizationId = :organizationId", { organizationId })
        .andWhere("order.orderDate BETWEEN :startDate AND :endDate", {
          startDate,
          endDate: today,
        })
        .groupBy("DATE(order.orderDate)")
        .orderBy("date", "ASC")
        .getRawMany();

      // Recent orders
      const recentOrders = await orderRepository.find({
        where: { organizationId },
        order: { orderDate: "DESC" },
        take: 5,
      });

      // Return the dashboard data
      res.json({
        summary: {
          totalSales,
          orderCount,
          customerCount,
          productCount,
          lowStockProducts,
          unpaidBills,
          inventoryValue, // Add inventory value to response
        },
        salesByDate,
        recentOrders,
        dateRange: {
          start: startDate,
          end: today,
        },
      });
    } catch (error) {
      console.error("Error fetching dashboard overview:", error);
      res.status(500).json({ message: "Error fetching dashboard data" });
    }
  }

  /**
   * Get yearly revenue data - Updated to fix data inconsistency issues
   */
  static async getYearlyRevenue(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const organizationId = req.user?.organization?.id;

      if (!organizationId) {
        res.status(400).json({ message: "Organization ID is required" });
        return;
      }

      // Use the current year by default
      const currentYear = new Date().getFullYear();
      const year = parseInt(req.query.year as string) || currentYear;

      console.log(
        `Getting yearly revenue for org: ${organizationId}, year: ${year}`
      );

      // Get the Order repository
      const orderRepo = getRepository(Order);

      // More simplified query that gets all orders for the year
      const allOrders = await orderRepo.find({
        where: {
          organizationId,
          orderDate: Between(
            new Date(`${year}-01-01T00:00:00.000Z`),
            new Date(`${year}-12-31T23:59:59.999Z`)
          ),
        },
        select: ["orderDate", "total"],
      });

      console.log(`Found ${allOrders.length} orders for year ${year}`);

      // Log a few orders for debugging
      if (allOrders.length > 0) {
        console.log("Sample orders:", allOrders.slice(0, 3));
      }

      // Initialize revenue array with 12 months
      const revenueData = Array(12).fill(0);

      // Process each order and add its total to the appropriate month
      allOrders.forEach((order) => {
        const orderDate = new Date(order.orderDate);
        const month = orderDate.getMonth(); // 0-based month index (0 = January)
        revenueData[month] += Number(order.total || 0);
      });

      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      console.log("Final yearly revenue data:", revenueData);

      res.json({
        labels: months,
        data: revenueData,
        year: year,
        totalRevenue: revenueData.reduce((sum, val) => sum + val, 0),
      });
    } catch (error) {
      console.error("Error fetching yearly revenue:", error);
      res.status(500).json({ message: "Failed to fetch yearly revenue data" });
    }
  }

  /**
   * Get sales data for charting - Fixed to ensure consistency
   */
  static async getSalesData(req: CustomRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user.organization.id;

      if (!organizationId) {
        res.status(400).json({ message: "Organization ID is required" });
        return;
      }

      // Fix the type issue by casting timeRange to string with a default value
      const timeRange = (req.query.timeRange as string) || "week";

      // Calculate periods based on timeRange
      const periods: PeriodData[] = [];
      const today = new Date();
      let format: string;
      let query: string;
      let intervalType: string;

      switch (timeRange) {
        case "month":
          format = "Day %d";
          intervalType = "day";
          for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - 29 + i);
            periods.push({
              label: `Day ${date.getDate()}`,
              date: date,
            });
          }
          query = `
            SELECT 
              TO_CHAR("orderDate", 'DD') as period,
              SUM(total) as sales
            FROM orders
            WHERE "organizationId" = $1
              AND "orderDate" >= $2
            GROUP BY period
            ORDER BY period
          `;
          break;
        case "year":
          format = "Month %m";
          intervalType = "month";
          for (let i = 0; i < 12; i++) {
            const month = today.getMonth() - 11 + i;
            const year = today.getFullYear() + Math.floor(month / 12);
            const adjustedMonth = ((month % 12) + 12) % 12;
            const date = new Date(year, adjustedMonth, 1);
            periods.push({
              label: date.toLocaleString("default", { month: "short" }),
              date: date,
            });
          }
          query = `
            SELECT 
              TO_CHAR("orderDate", 'MM') as period,
              SUM(total) as sales
            FROM orders
            WHERE "organizationId" = $1
              AND "orderDate" >= $2
            GROUP BY period
            ORDER BY period
          `;
          break;
        default: // week
          format = "Day %w";
          intervalType = "day";
          for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - 6 + i);
            periods.push({
              label: date.toLocaleString("default", { weekday: "short" }),
              date: date,
            });
          }
          query = `
            SELECT 
              TO_CHAR("orderDate", 'D') as period,
              SUM(total) as sales
            FROM orders
            WHERE "organizationId" = $1
              AND "orderDate" >= $2
            GROUP BY period
            ORDER BY period
          `;
          break;
      }

      const startDate = periods[0].date;

      console.log(`Getting sales data from ${startDate.toISOString()} to now`);

      // Execute query using repository
      const orderRepo = getRepository(Order);

      // Fetch current period data
      const currentOrderResults = await orderRepo.query(query, [
        organizationId,
        startDate,
      ]);

      console.log(`Raw sales data for ${timeRange}:`, currentOrderResults);

      // Process current period data as before ...
      const currentSalesData = processSalesData(
        currentOrderResults,
        periods,
        timeRange
      );

      // Return current period data
      res.json({
        labels: currentSalesData.map((d) => d.label),
        salesData: currentSalesData.map((d) => d.sales),
      });
    } catch (error) {
      console.error("Error fetching sales data:", error);
      res.status(500).json({ message: "Failed to fetch sales data" });
    }
  }

  /**
   * Get dashboard summary metrics with real trend data
   */
  static async getSummary(req: CustomRequest, res: Response): Promise<void> {
    try {
      console.log("User ID:", req.user);
      const organizationId = req.user.organization.id;

      if (!organizationId) {
        res.status(400).json({ message: "Organization ID is required" });
        return;
      }

      // Fix the type issue by casting timeRange to string with a default value
      const timeRange = (req.query.timeRange as string) || "week";

      // Calculate date ranges for current and previous periods
      const today = new Date();
      let startDate: Date;
      let previousStartDate: Date;
      let previousEndDate: Date;

      switch (timeRange) {
        case "month":
          // Current period: This month
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);

          // Previous period: Previous month
          previousStartDate = new Date(
            today.getFullYear(),
            today.getMonth() - 1,
            1
          );
          previousEndDate = new Date(today.getFullYear(), today.getMonth(), 0);
          break;

        case "year":
          // Current period: This year
          startDate = new Date(today.getFullYear(), 0, 1);

          // Previous period: Last year
          previousStartDate = new Date(today.getFullYear() - 1, 0, 1);
          previousEndDate = new Date(today.getFullYear() - 1, 11, 31);
          break;

        default: // week
          // Current period: This week (starting from Sunday)
          const day = today.getDay();
          startDate = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - day
          );

          // Previous period: Last week
          previousStartDate = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - day - 7
          );
          previousEndDate = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - day - 1
          );
          break;
      }

      // Repositories
      const orderRepo = getRepository(Order);
      const billRepo = getRepository(Bill);
      const customerRepo = getRepository(Customer);
      const productRepo = getRepository(Product);
      const userRepo = getRepository(User);
      const employeeRepo = getRepository(Employee);

      // Get current period data
      const [
        currentTotalOrders,
        currentProcessingOrders,
        currentPendingOrders,
        currentCustomers,
        currentInventoryItems,
        currentTotalEmployees,
        currentOrderRevenue,
        currentBillRevenue,
      ] = await Promise.all([
        // Total orders (current)
        orderRepo.count({
          where: {
            organizationId,
            createdAt: Between(startDate, today),
          },
        }),

        // Processing orders (current snapshot)
        orderRepo.count({
          where: {
            organizationId,
            status: OrderStatus.PROCESSING,
          },
        }),

        // Pending orders (current snapshot)
        orderRepo.count({
          where: {
            organizationId,
            status: OrderStatus.PENDING,
          },
        }),

        // Total customers (current period additions)
        customerRepo.count({
          where: {
            organizationId,
            createdAt: Between(startDate, today),
          },
        }),

        // Inventory items (current snapshot)
        productRepo.count({
          where: {
            organizationId,
          },
        }),

        // Total employees (current snapshot)
        employeeRepo.count({
          where: { organizationId },
        }),

        // Order revenue (current period)
        orderRepo
          .createQueryBuilder("order")
          .select("SUM(order.total)", "revenue")
          .where("order.organizationId = :organizationId", { organizationId })
          .andWhere("order.createdAt BETWEEN :startDate AND :endDate", {
            startDate,
            endDate: today,
          })
          .getRawOne()
          .then((result) => parseFloat(result?.revenue || "0")),

        // Bill revenue (current period)
        billRepo
          .createQueryBuilder("bill")
          .select("SUM(bill.total)", "revenue")
          .where("bill.organizationId = :organizationId", { organizationId })
          .andWhere("bill.billType = :billType", { billType: "sales" })
          .andWhere("bill.createdAt BETWEEN :startDate AND :endDate", {
            startDate,
            endDate: today,
          })
          .getRawOne()
          .then((result) => parseFloat(result?.revenue || "0"))
          .catch((err) => {
            console.warn("Error getting current bill revenue:", err.message);
            return 0;
          }),
      ]);

      // Get previous period data for trend calculation
      const [
        previousTotalOrders,
        previousProcessingOrders,
        previousPendingOrders,
        previousCustomers,
        previousInventoryItems,
        previousTotalEmployees,
        previousOrderRevenue,
        previousBillRevenue,
      ] = await Promise.all([
        // Total orders (previous period)
        orderRepo.count({
          where: {
            organizationId,
            createdAt: Between(previousStartDate, previousEndDate),
          },
        }),

        // Processing orders (previous snapshot - 7 days ago)
        orderRepo.count({
          where: {
            organizationId,
            status: OrderStatus.PROCESSING,
            updatedAt: LessThan(startDate),
          },
        }),

        // Pending orders (previous snapshot - 7 days ago)
        orderRepo.count({
          where: {
            organizationId,
            status: OrderStatus.PENDING,
            updatedAt: LessThan(startDate),
          },
        }),

        // Total customers (previous period additions)
        customerRepo.count({
          where: {
            organizationId,
            createdAt: Between(previousStartDate, previousEndDate),
          },
        }),

        // Inventory items (previous period)
        productRepo.count({
          where: {
            organizationId,
            createdAt: LessThan(startDate),
          },
        }),

        // Previous employee count (not relevant for trend, using same as current)
        currentTotalEmployees,

        // Order revenue (previous period)
        orderRepo
          .createQueryBuilder("order")
          .select("SUM(order.total)", "revenue")
          .where("order.organizationId = :organizationId", { organizationId })
          .andWhere("order.createdAt BETWEEN :startDate AND :endDate", {
            startDate: previousStartDate,
            endDate: previousEndDate,
          })
          .getRawOne()
          .then((result) => parseFloat(result?.revenue || "0")),

        // Bill revenue (previous period)
        billRepo
          .createQueryBuilder("bill")
          .select("SUM(bill.total)", "revenue")
          .where("bill.organizationId = :organizationId", { organizationId })
          .andWhere("bill.billType = :billType", { billType: "sales" })
          .andWhere("bill.createdAt BETWEEN :startDate AND :endDate", {
            startDate: previousStartDate,
            endDate: previousEndDate,
          })
          .getRawOne()
          .then((result) => parseFloat(result?.revenue || "0"))
          .catch((err) => {
            console.warn("Error getting previous bill revenue:", err.message);
            return 0;
          }),
      ]);

      // Calculate total revenue for both periods
      const currentTotalRevenue = currentOrderRevenue + currentBillRevenue;
      const previousTotalRevenue = previousOrderRevenue + previousBillRevenue;

      // Calculate trend data for each metric
      const calculateTrend = (current: number, previous: number): TrendData => {
        // Avoid division by zero
        if (previous === 0) {
          return {
            current,
            previous,
            percentChange: current > 0 ? 100 : 0,
            isPositive: current > 0,
          };
        }

        const percentChange = ((current - previous) / previous) * 100;
        return {
          current,
          previous,
          percentChange: Math.round(percentChange * 10) / 10, // Round to 1 decimal place
          isPositive: percentChange >= 0,
        };
      };

      // Calculate trends for each metric
      const ordersTrend = calculateTrend(
        currentTotalOrders,
        previousTotalOrders
      );
      const processingOrdersTrend = calculateTrend(
        currentProcessingOrders,
        previousProcessingOrders
      );
      const pendingOrdersTrend = calculateTrend(
        currentPendingOrders,
        previousPendingOrders
      );
      const customersTrend = calculateTrend(
        currentCustomers,
        previousCustomers
      );
      const inventoryTrend = calculateTrend(
        currentInventoryItems,
        previousInventoryItems
      );
      const revenueTrend = calculateTrend(
        currentTotalRevenue,
        previousTotalRevenue
      );

      // Calculate overall growth rate
      const growthRate = revenueTrend.percentChange;

      // Calculate overdue payments for sales
      let overdueAmount = 0;
      let overdueCount = 0;
      try {
        const overdueResult = await billRepo
          .createQueryBuilder("bill")
          .select("COUNT(bill.id)", "count")
          .addSelect("SUM(bill.amountRemaining)", "totalOverdue")
          .where("bill.organizationId = :organizationId", { organizationId })
          .andWhere("bill.billType = :billType", { billType: "sales" })
          .andWhere("bill.paymentStatus != :paidStatus", { paidStatus: "paid" })
          .andWhere("bill.dueDate IS NOT NULL AND bill.dueDate < :todayDate", { todayDate: today })
          .getRawOne();

        overdueAmount = parseFloat(overdueResult?.totalOverdue || "0");
        overdueCount = parseInt(overdueResult?.count || "0", 10);
      } catch (err) {
        console.warn("Error calculating overdue metrics:", err);
      }

      res.json({
        totalOrders: currentTotalOrders,
        processingOrders: currentProcessingOrders,
        pendingOrders: currentPendingOrders,
        inventoryItems: currentInventoryItems,
        totalCustomers: currentCustomers,
        totalEmployees: currentTotalEmployees,
        revenue: currentTotalRevenue,
        growthRate: growthRate,
        overdueAmount,
        overdueCount,

        // Add trend data for each metric
        trends: {
          orders: {
            percentChange: ordersTrend.percentChange,
            isPositive: ordersTrend.isPositive,
          },
          processingOrders: {
            percentChange: processingOrdersTrend.percentChange,
            isPositive: processingOrdersTrend.isPositive,
          },
          pendingOrders: {
            percentChange: pendingOrdersTrend.percentChange,
            isPositive: pendingOrdersTrend.isPositive,
          },
          customers: {
            percentChange: customersTrend.percentChange,
            isPositive: customersTrend.isPositive,
          },
          inventory: {
            percentChange: inventoryTrend.percentChange,
            isPositive: inventoryTrend.isPositive,
          },
          revenue: {
            percentChange: revenueTrend.percentChange,
            isPositive: revenueTrend.isPositive,
          },
        },

        // Include the raw revenue data for debugging
        orderRevenue: currentOrderRevenue,
        billRevenue: currentBillRevenue,
      });
    } catch (error) {
      console.error("Error fetching dashboard summary:", error);
      res.status(500).json({ message: "Failed to fetch dashboard summary" });
    }
  }

  /**
   * Get orders distribution data
   */
  static async getOrdersData(req: CustomRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user.organization.id || {};

      if (!organizationId) {
        res.status(400).json({ message: "Organization ID is required" });
        return;
      }

      const orderRepo = getRepository(Order);

      // Get counts by status
      const ordersByStatus = (await orderRepo
        .createQueryBuilder("order")
        .select("order.status", "status")
        .addSelect("COUNT(order.id)", "count")
        .where("order.organizationId = :organizationId", { organizationId })
        .groupBy("order.status")
        .getRawMany()) as OrderStatusResult[];

      // Build response object
      const statusCounts: StatusCounts = {
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
      };

      ordersByStatus.forEach((item: OrderStatusResult) => {
        const statusKey = item.status.toLowerCase();
        if (statusKey in statusCounts) {
          statusCounts[statusKey] = parseInt(item.count);
        }
      });

      res.json({
        labels: Object.keys(statusCounts).map(
          (s) => s.charAt(0).toUpperCase() + s.slice(1)
        ),
        data: Object.values(statusCounts),
      });
    } catch (error) {
      console.error("Error fetching orders data:", error);
      res.status(500).json({ message: "Failed to fetch orders data" });
    }
  }

  /**
   * Get inventory status data - enhanced for real data
   */
  static async getInventoryData(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const organizationId = req.user.organization.id || {};

      if (!organizationId) {
        res.status(400).json({ message: "Organization ID is required" });
        return;
      }

      const productRepo = getRepository(Product);
      const categoryRepo = getRepository(Category);

      // Get detailed inventory statistics
      const products = await productRepo.find({
        where: { organizationId },
        select: [
          "id",
          "name",
          "quantity",
          "lowStockAlert",
          "categoryId",
          "price",
          "sku",
        ],
        relations: ["category"],
      });

      // Calculate inventory value by category
      const inventoryValueByCategory: Record<string, number> = {};
      const productCountByCategory: Record<string, number> = {};
      let totalInventoryValue = 0;

      // Calculate stock status
      let inStock = 0;
      let lowStock = 0;
      let outOfStock = 0;

      // Enhanced product data for detailed display
      const productInventoryData = products.map((product) => {
        // Add to category counts
        const categoryId = product.categoryId || "uncategorized";
        if (!productCountByCategory[categoryId]) {
          productCountByCategory[categoryId] = 0;
        }
        productCountByCategory[categoryId]++;

        // Calculate inventory value
        const itemValue = product.price * product.quantity;
        totalInventoryValue += itemValue;

        if (!inventoryValueByCategory[categoryId]) {
          inventoryValueByCategory[categoryId] = 0;
        }
        inventoryValueByCategory[categoryId] += itemValue;

        // Determine stock status
        let stockStatus = "In Stock";
        if (product.quantity <= 0) {
          outOfStock++;
          stockStatus = "Out of Stock";
        } else if (
          product.lowStockAlert &&
          product.quantity <= product.lowStockAlert
        ) {
          lowStock++;
          stockStatus = "Low Stock";
        } else {
          inStock++;
        }

        return {
          id: product.id,
          name: product.name,
          sku: product.sku,
          quantity: product.quantity,
          lowStockAlert: product.lowStockAlert || 0,
          price: product.price,
          value: itemValue,
          categoryName: product.category?.name || "Uncategorized",
          categoryId: categoryId,
          stockStatus: stockStatus,
          isOutOfStock: product.quantity <= 0,
          isLowStock:
            product.lowStockAlert && product.quantity <= product.lowStockAlert,
        };
      });

      // Create category labels and data arrays
      const categoryLabels: string[] = [];
      const categoryData: number[] = [];

      // Get all categories for this organization
      const categories = await categoryRepo.find({
        where: { organizationId },
        select: ["id", "name"],
      });

      categories.forEach((category) => {
        const count = productCountByCategory[category.id] || 0;
        if (count > 0) {
          categoryLabels.push(category.name);
          categoryData.push(count);
        }
      });

      // Add uncategorized if any
      if (productCountByCategory["uncategorized"]) {
        categoryLabels.push("Uncategorized");
        categoryData.push(productCountByCategory["uncategorized"]);
      }

      res.json({
        stockStatus: {
          labels: ["In Stock", "Low Stock", "Out of Stock"],
          data: [inStock, lowStock, outOfStock],
        },
        categories: {
          labels: categoryLabels,
          data: categoryData,
        },
        inventoryValue: totalInventoryValue,
        totalProducts: products.length,
        lowStockProducts: lowStock,
        outOfStockProducts: outOfStock,
        // Add the detailed product inventory data for charts
        products: productInventoryData,
      });
    } catch (error) {
      console.error("Error fetching inventory data:", error);
      res.status(500).json({ message: "Failed to fetch inventory data" });
    }
  }

  /**
   * Get top customers with enhanced data
   */
  static async getTopCustomers(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const organizationId = req.user.organization.id || {};

      if (!organizationId) {
        res.status(400).json({ message: "Organization ID is required" });
        return;
      }

      const { limit = 5 } = req.query;

      const customerRepo = getRepository(Customer);
      const orderRepo = getRepository(Order);

      // Get all customers for this organization - now including image field
      const customers = await customerRepo.find({
        where: { organizationId },
        select: ["id", "name", "email", "phone", "gender", "image"], // Added image field
      });

      // Get order totals per customer
      const customerOrders = await orderRepo
        .createQueryBuilder("order")
        .select("order.customerId", "customerId")
        .addSelect("SUM(order.total)", "totalSpent")
        .addSelect("COUNT(order.id)", "orderCount")
        .addSelect("MAX(order.orderDate)", "lastOrderDate")
        .where("order.organizationId = :organizationId", { organizationId })
        .groupBy("order.customerId")
        .getRawMany();

      // Map customer data with order data
      const customersWithData = customers.map((customer) => {
        const orderData =
          customerOrders.find((o) => o.customerId === customer.id) || {};

        return {
          ...customer,
          // Use the image field directly from customer entity
          image: customer.image || null,
          profilePicture: customer.image || null, // Keep for backward compatibility
          totalSpent: orderData.totalSpent
            ? parseFloat(orderData.totalSpent)
            : 0,
          totalOrders: orderData.orderCount
            ? parseInt(orderData.orderCount)
            : 0,
          lastOrderDate: orderData.lastOrderDate || null,
        };
      });

      // Sort by total spent in descending order
      customersWithData.sort((a, b) => b.totalSpent - a.totalSpent);

      // Take requested limit
      const topCustomers = customersWithData.slice(
        0,
        parseInt(limit as string)
      );

      res.json({
        customers: topCustomers,
      });
    } catch (error) {
      console.error("Error fetching top customers:", error);
      res.status(500).json({ message: "Failed to fetch top customers" });
    }
  }

  /**
   * Get product performance data
   */
  static async getProductPerformance(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const organizationId = req.user.organization.id;

      if (!organizationId) {
        res.status(400).json({ message: "Organization ID is required" });
        return;
      }

      // Get top selling products
      const orderItemRepo = getRepository(Order);

      const topProducts = (await orderItemRepo.query(
        `
        SELECT p.name, COUNT(oi.id) as order_count, SUM(oi.quantity) as units_sold
        FROM order_items oi
        JOIN products p ON oi."productId" = p.id
        JOIN orders o ON oi."orderId" = o.id
        WHERE o."organizationId" = $1
        GROUP BY p.name
        ORDER BY units_sold DESC
        LIMIT 5
      `,
        [organizationId]
      )) as ProductPerformanceResult[];

      res.json({
        labels: topProducts.map((p: ProductPerformanceResult) => p.name),
        data: topProducts.map((p: ProductPerformanceResult) =>
          parseInt(p.units_sold)
        ),
      });
    } catch (error) {
      console.error("Error fetching product performance:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch product performance data" });
    }
  }
}

// Helper function to process sales data
function processSalesData(
  orderResults: any[],
  periods: PeriodData[],
  timeRange: string
): any[] {
  const salesByPeriod: Record<string, number> = {};

  // Initialize all periods with 0
  periods.forEach((period) => {
    let periodKey;
    if (timeRange === "month") {
      periodKey = period.date.getDate().toString().padStart(2, "0");
    } else if (timeRange === "year") {
      periodKey = (period.date.getMonth() + 1).toString().padStart(2, "0");
    } else {
      // week
      const dayOfWeek = period.date.getDay() + 1;
      periodKey = dayOfWeek.toString();
    }
    salesByPeriod[periodKey] = 0;
  });

  // Fill in actual sales data
  (orderResults || []).forEach((result: any) => {
    const period = result.period || "0";
    salesByPeriod[period] = parseFloat(result.sales) || 0;
  });

  // Map results to periods for response
  return periods.map((period) => {
    let periodKey;
    if (timeRange === "month") {
      periodKey = period.date.getDate().toString().padStart(2, "0");
    } else if (timeRange === "year") {
      periodKey = (period.date.getMonth() + 1).toString().padStart(2, "0");
    } else {
      // week
      const dayOfWeek = period.date.getDay() + 1;
      periodKey = dayOfWeek.toString();
    }

    return {
      label: period.label,
      sales: salesByPeriod[periodKey] || 0,
    };
  });
}
