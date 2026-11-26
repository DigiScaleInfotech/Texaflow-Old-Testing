import { Request, Response } from "express";
import { getRepository } from "../config/database";
import { Product } from "../entities/product.entity";
import { StockTransaction } from "../entities/stock-transaction.entity";
import { Not, IsNull, Between, LessThan } from "typeorm";
// Add a UUID validation utility
import { validate as validateUuid } from "uuid";

// Define custom request interface with user property
interface CustomRequest extends Request {
  user?: any; // Using 'any' type for compatibility
}

// Add interface for trend calculations
interface TrendData {
  current: number;
  previous: number;
  percentChange: number;
  isPositive: boolean;
}

export class InventoryController {
  /**
   * Get all inventory items with pagination and filtering
   */
  static async getInventoryItems(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const organizationId = req.user?.organization?.id;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      // Extract query parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const category = req.query.category as string;
      const lowStock = req.query.lowStock === "true";
      const sortBy = (req.query.sortBy as string) || "createdAt";
      const order = ((req.query.order as string) || "DESC").toUpperCase();

      const productRepository = getRepository(Product);

      // Build query for organization's products - join with Category table
      let queryBuilder = productRepository
        .createQueryBuilder("product")
        .leftJoinAndSelect("product.category", "category") // Join with Category entity
        .where("product.organizationId = :organizationId", { organizationId });

      // Apply filters if provided
      if (search) {
        queryBuilder = queryBuilder.andWhere(
          "(product.name ILIKE :search OR " +
            "product.sku ILIKE :search OR " +
            "product.description ILIKE :search OR " +
            "product.category ILIKE :search OR " +
            "category.name ILIKE :search)", // Added category name search
          { search: `%${search}%` }
        );
      }

      // Updated category filter to handle both UUID and string
      if (category) {
        // Check if category is a valid UUID
        if (validateUuid(category)) {
          // If it's a UUID, filter by categoryId
          queryBuilder = queryBuilder.andWhere(
            "product.categoryId = :categoryId",
            {
              categoryId: category,
            }
          );
        } else {
          // If it's not a UUID, filter by category name
          queryBuilder = queryBuilder.andWhere(
            "(product.categoryName ILIKE :categoryName OR category.name ILIKE :categoryName)",
            { categoryName: `%${category}%` }
          );
        }
      }

      if (lowStock) {
        queryBuilder = queryBuilder.andWhere(
          "(product.quantity <= product.lowStockAlert OR " +
            "(product.quantity <= product.reorderPoint AND product.reorderPoint IS NOT NULL))"
        );
      }

      // Apply sorting, pagination and get products and total count in a single query
      const [products, total] = await queryBuilder
        .orderBy(`product.${sortBy}`, order === "ASC" ? "ASC" : "DESC")
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      // Add categoryName to products that don't have it
      const productsWithCategoryName = products.map((product) => {
        if (!product.categoryName && product.category?.name) {
          return {
            ...product,
            categoryName: product.category.name,
          };
        }
        return product;
      });

      res.json({
        products: productsWithCategoryName,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error("Error fetching inventory items:", error);
      res.status(500).json({ message: "Error fetching inventory items" });
    }
  }

  /**
   * Get product by ID
   */
  static async getProductById(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const organizationId = req.user?.organization?.id;
      const { id } = req.params;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      const productRepository = getRepository(Product);

      // Find product by ID and ensure it belongs to the user's organization
      const product = await productRepository.findOne({
        where: { id, organizationId },
        relations: ["organization"],
      });

      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }

      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Error fetching product" });
    }
  }

  /**
   * Create a new product
   */
  static async createProduct(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const organizationId = req.user?.organization?.id;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      const productData = req.body;

      // Validate required fields
      if (!productData.name || !productData.category) {
        res.status(400).json({ message: "Name and category are required" });
        return;
      }

      // Check if product with the same SKU already exists (if SKU provided)
      if (productData.sku) {
        const productRepository = getRepository(Product);
        const existingProduct = await productRepository.findOne({
          where: { sku: productData.sku, organizationId },
        });

        if (existingProduct) {
          res
            .status(400)
            .json({ message: "A product with this SKU already exists" });
          return;
        }
      }

      // Generate SKU if not provided
      if (!productData.sku) {
        // Extract first 3 chars from product name (uppercase)
        const namePrefix = productData.name
          .replace(/[^a-zA-Z0-9]/g, "") // Remove special characters
          .substring(0, 3)
          .toUpperCase();

        // Get current date and time in compact format
        const now = new Date();
        const timestamp = `${now.getFullYear()}${String(
          now.getMonth() + 1
        ).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}${String(
          now.getHours()
        ).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;

        // Create SKU: NAME-TIMESTAMP
        productData.sku = `${namePrefix}-${timestamp}`;
      }

      // Fix for UUID fields - Convert empty strings to null for UUID fields
      if (productData.supplierId === "") {
        productData.supplierId = null;
      }

      // Handle other potential UUID fields
      const uuidFields = ["vendorId", "manufacturerId", "warehouseId"];
      uuidFields.forEach((field) => {
        if (productData[field] === "") {
          productData[field] = null;
        }
      });

      // Handle image upload from media middleware
      if ((req as any).mediaUrl) {
        productData.imageUrl = (req as any).mediaUrl;
      }

      // Create new product
      const productRepository = getRepository(Product);
      const product = productRepository.create({
        ...productData,
        organizationId,
        ownerKey: userId, // Track who created this product
      });

      await productRepository.save(product);

      res.status(201).json({
        message: "Product created successfully",
        product,
      });
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Error creating product" });
    }
  }

  /**
   * Update product by ID
   */
  static async updateProduct(req: CustomRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const organizationId = req.user?.organization?.id;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      const productRepository = getRepository(Product);

      // Find the product and ensure it belongs to the user's organization
      const product = await productRepository.findOne({
        where: { id, organizationId },
      });

      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }

      // Prepare update data
      const updateData = { ...req.body };

      // Always set organizationId to ensure it is not null
      updateData.organizationId = organizationId;

      // If dimensions or weight are objects, stringify them for storage
      if (
        typeof updateData.dimensions === "object" &&
        updateData.dimensions !== null
      ) {
        updateData.dimensions = JSON.stringify(updateData.dimensions);
      }
      if (typeof updateData.weight === "object" && updateData.weight !== null) {
        updateData.weight = JSON.stringify(updateData.weight);
      }

      // Update the product
      await productRepository.update(id, updateData);

      // Return the updated product
      const updatedProduct = await productRepository.findOne({
        where: { id, organizationId },
      });
      res.json({
        message: "Product updated successfully",
        product: updatedProduct,
      });
    } catch (error: any) {
      console.error("Error updating product:", error);
      res.status(500).json({
        message: "Error updating product",
        error: error.message || String(error),
      });
    }
  }

  /**
   * Delete product
   */
  static async deleteProduct(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const organizationId = req.user?.organization?.id;
      const { id } = req.params;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      // Find product by ID and ensure it belongs to the user's organization
      const productRepository = getRepository(Product);
      const product = await productRepository.findOne({
        where: { id, organizationId },
      });

      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }

      // Delete product
      await productRepository.remove(product);

      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Error deleting product" });
    }
  }

  /**
   * Update product stock quantity
   */
  static async updateProductStock(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const organizationId = req.user?.organization?.id;
      const { id } = req.params;
      const { quantity, operation, notes } = req.body;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      // Validate operation type
      if (!["add", "subtract", "set"].includes(operation)) {
        res.status(400).json({
          message: "Operation must be 'add', 'subtract', or 'set'",
        });
        return;
      }

      // Parse quantity to integer
      const quantityValue = parseInt(quantity.toString());

      if (isNaN(quantityValue) || quantityValue < 0) {
        res.status(400).json({
          message: "Quantity must be a positive number",
        });
        return;
      }

      // Find product by ID and ensure it belongs to the user's organization
      const productRepository = getRepository(Product);
      const product = await productRepository.findOne({
        where: { id, organizationId },
      });

      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }

      const previousQuantity = product.quantity;

      // Update stock quantity based on operation
      if (operation === "set") {
        product.quantity = quantityValue;
      } else if (operation === "add") {
        product.quantity += quantityValue;
      } else if (operation === "subtract") {
        product.quantity = Math.max(0, product.quantity - quantityValue);
      }

      // Save updated product
      await productRepository.save(product);

      // Calculate change amount based on operation
      let changeAmount: number;
      let transactionType: string;

      if (operation === "add") {
        changeAmount = quantityValue;
        transactionType = "incoming";
      } else if (operation === "subtract") {
        changeAmount = -quantityValue;
        transactionType = "outgoing";
      } else {
        // set
        changeAmount = product.quantity - previousQuantity;
        transactionType = changeAmount >= 0 ? "incoming" : "outgoing";
      }

      try {
        // Create and save the stock transaction directly
        const connection = productRepository.manager.connection;
        await connection.query(
          `INSERT INTO stock_transactions 
          (id, product_id, organization_id, previous_quantity, new_quantity, change_amount, 
          transaction_type, reference_type, notes, created_by, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
          [
            require("uuid").v4(), // Generate a UUID for the transaction
            id,
            organizationId,
            previousQuantity,
            product.quantity,
            changeAmount,
            transactionType,
            "manual",
            notes || "Manual stock update",
            userId,
          ]
        );

        const operationDisplay =
          operation === "add"
            ? "added"
            : operation === "subtract"
            ? "removed"
            : "updated";

        const successMessage = `Stock successfully ${operationDisplay}: ${Math.abs(
          changeAmount
        )} units`;

        res.json({
          message: successMessage,
          product,
        });
      } catch (transactionError) {
        console.error("Error creating stock transaction:", transactionError);
        // Even if transaction recording fails, we still return success since product was updated
        res.json({
          message:
            "Product stock updated successfully, but transaction log failed",
          product,
        });
      }
    } catch (error) {
      console.error("Error updating product stock:", error);
      res.status(500).json({
        message: "Error updating product stock",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get product transaction history
   */
  static async getProductTransactions(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const organizationId = req.user?.organization?.id;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      // Use the StockTransaction entity instead of raw SQL query
      const stockTransactionRepository = getRepository(StockTransaction);
      const transactions = await stockTransactionRepository.find({
        where: {
          productId: id,
          organizationId,
        },
        relations: ["createdByUser"],
        order: {
          createdAt: "DESC",
        },
        take: 50,
      });

      // Return formatted transactions
      res.json({
        transactions: transactions.map((t) => ({
          id: t.id,
          type: t.transactionType,
          quantity: Math.abs(t.changeAmount),
          previousQuantity: t.previousQuantity,
          newQuantity: t.newQuantity,
          date: t.createdAt,
          referenceType: t.referenceType,
          referenceId: t.referenceId,
          notes: t.notes,
          createdBy: t.createdByUser
            ? `${t.createdByUser.firstName} ${t.createdByUser.lastName}`
            : "System",
        })),
      });
    } catch (error) {
      console.error("Error fetching product transactions:", error);
      res.status(500).json({ message: "Error fetching product transactions" });
    }
  }

  /**
   * Get inventory statistics with trend data
   */
  static async getInventoryStats(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const organizationId = req.user?.organization?.id;
      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      console.log("Fetching inventory stats for organization:", organizationId);

      // Calculate date ranges for current and previous periods
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);

      // Get current period products
      const productRepository = getRepository(Product);
      const products = await productRepository.find({
        where: { organizationId },
      });

      console.log(`Found ${products.length} products for organization`);

      // Get products that existed in previous period (30-60 days ago)
      const previousPeriodProducts = await productRepository.find({
        where: { 
          organizationId,
          createdAt: LessThan(thirtyDaysAgo)
        }
      });

      console.log(`Found ${previousPeriodProducts.length} products from previous period`);

      // Stock status counts for current period
      let inStock = 0,
        lowStock = 0,
        outOfStock = 0;
      let inventoryValue = 0;
      let lowStockProducts = 0;
      let outOfStockProducts = 0;

      // Per-product stock for chart
      products.forEach((product: any) => {
        const stock = Number(product.quantity || 0);
        const lowStockAlert = Number(product.lowStockAlert || 0);
        const value = Number(product.price || 0) * stock;
        inventoryValue += value;

        if (stock === 0) {
          outOfStock++;
          outOfStockProducts++;
        } else if (lowStockAlert > 0 && stock <= lowStockAlert) {
          lowStock++;
          lowStockProducts++;
        } else {
          inStock++;
        }
      });

      // Calculate previous period stats
      let previousInventoryValue = 0;
      let previousLowStockProducts = 0;
      let previousOutOfStockProducts = 0;

      previousPeriodProducts.forEach((product: any) => {
        const stock = Number(product.quantity || 0);
        const lowStockAlert = Number(product.lowStockAlert || 0);
        const value = Number(product.price || 0) * stock;
        previousInventoryValue += value;

        if (stock === 0) {
          previousOutOfStockProducts++;
        } else if (lowStockAlert > 0 && stock <= lowStockAlert) {
          previousLowStockProducts++;
        }
      });

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

      // Get transaction counts for trend data
      const stockTransactionRepo = getRepository(StockTransaction);

      const [currentPeriodTransactions, previousPeriodTransactions] = await Promise.all([
        stockTransactionRepo.count({
          where: { 
            organizationId,
            createdAt: Between(thirtyDaysAgo, today)
          }
        }),
        stockTransactionRepo.count({
          where: { 
            organizationId,
            createdAt: Between(sixtyDaysAgo, thirtyDaysAgo)
          }
        })
      ]);

      // Calculate trends
      const totalProductsTrend = calculateTrend(products.length, previousPeriodProducts.length);
      const lowStockTrend = calculateTrend(lowStockProducts, previousLowStockProducts);
      const outOfStockTrend = calculateTrend(outOfStockProducts, previousOutOfStockProducts);
      const inventoryValueTrend = calculateTrend(inventoryValue, previousInventoryValue);
      const activityTrend = calculateTrend(currentPeriodTransactions, previousPeriodTransactions);

      // Log the calculated stats for debugging
      console.log("Calculated inventory stats:", {
        totalProducts: products.length,
        lowStockProducts,
        outOfStockProducts,
        inventoryValue,
        trends: {
          totalProducts: totalProductsTrend,
          lowStock: lowStockTrend,
          outOfStock: outOfStockTrend,
          inventoryValue: inventoryValueTrend,
        }
      });

      // Build response data
      const responseData = {
        stockStatus: {
          labels: ["In Stock", "Low Stock", "Out of Stock"],
          data: [inStock, lowStock, outOfStock],
        },
        inventoryValue,
        totalProducts: products.length,
        lowStockProducts,
        outOfStockProducts,

        // Add trend data
        trends: {
          totalProducts: {
            value: totalProductsTrend.percentChange,
            isPositive: totalProductsTrend.isPositive
          },
          lowStock: {
            value: lowStockTrend.percentChange,
            isPositive: !lowStockTrend.isPositive // Inverted - fewer low stock items is positive
          },
          outOfStock: {
            value: outOfStockTrend.percentChange,
            isPositive: !outOfStockTrend.isPositive // Inverted - fewer out of stock items is positive
          },
          inventoryValue: {
            value: inventoryValueTrend.percentChange,
            isPositive: inventoryValueTrend.isPositive
          },
          activity: {
            value: activityTrend.percentChange,
            isPositive: activityTrend.isPositive
          }
        }
      };

      // Send the response
      res.json(responseData);
    } catch (error) {
      console.error("Error fetching inventory stats:", error);
      res.status(500).json({ message: "Error fetching inventory stats" });
    }
  }
}
 