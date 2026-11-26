import { Request, Response } from "express";
import { getRepository } from "../config/database";
import { Category } from "../entities/category.entity";
import { Product } from "../entities/product.entity";
import { Not } from "typeorm";

// Define custom request interface with user property
interface CustomRequest extends Request {
  user?: any; // Using 'any' type for compatibility
}

export class CategoryController {
  /**
   * Get all categories with pagination and filtering
   */
  static async getCategories(req: CustomRequest, res: Response): Promise<void> {
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
      const limit = parseInt(req.query.limit as string) || 50; // Higher limit for categories
      const search = req.query.search as string;
      const isActive = req.query.isActive as string;
      const parentId = req.query.parentId as string;
      const sort = (req.query.sort as string) || "name";
      const order = (req.query.order as string) || "ASC";

      const categoryRepository = getRepository(Category);

      // Build query for organization's categories
      let queryBuilder = categoryRepository
        .createQueryBuilder("category")
        .where("category.organizationId = :organizationId", { organizationId })
        .leftJoinAndSelect("category.parentCategory", "parentCategory");

      // Apply filters if provided
      if (search) {
        queryBuilder = queryBuilder.andWhere(
          "(category.name ILIKE :search OR category.description ILIKE :search OR category.code ILIKE :search)",
          { search: `%${search}%` }
        );
      }

      if (isActive !== undefined) {
        queryBuilder = queryBuilder.andWhere("category.isActive = :isActive", {
          isActive: isActive === "true",
        });
      }

      if (parentId) {
        if (parentId === "null") {
          queryBuilder = queryBuilder.andWhere(
            "category.parentCategoryId IS NULL"
          );
        } else {
          queryBuilder = queryBuilder.andWhere(
            "category.parentCategoryId = :parentId",
            { parentId }
          );
        }
      }

      // Get total count
      const total = await queryBuilder.getCount();

      // Apply sorting - allow sorting by any field
      if (sort) {
        queryBuilder = queryBuilder.orderBy(
          `category.${sort}`,
          order as "ASC" | "DESC"
        );
      } else {
        queryBuilder = queryBuilder
          .orderBy("category.displayOrder", "ASC")
          .addOrderBy("category.name", "ASC");
      }

      // Apply pagination
      queryBuilder = queryBuilder.skip((page - 1) * limit).take(limit);

      const categories = await queryBuilder.getMany();

      // Get product counts for each category - FIX THE EMPTY LIST ISSUE
      let productCounts = [];
      if (categories.length > 0) {
        const categoryIds = categories.map((cat) => cat.id);
        productCounts = await getRepository(Product)
          .createQueryBuilder("product")
          .select("product.categoryId", "categoryId")
          .addSelect("COUNT(*)", "count")
          .where("product.categoryId IN (:...categoryIds)", { categoryIds })
          .groupBy("product.categoryId")
          .getRawMany();
      }

      // Map product counts to categories
      const categoriesWithProductCount = categories.map((category) => {
        const countRecord = productCounts.find(
          (pc) => pc.categoryId === category.id
        );
        return {
          ...category,
          productCount: countRecord ? parseInt(countRecord.count) : 0,
        };
      });

      res.json({
        categories: categoriesWithProductCount,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Error fetching categories" });
    }
  }

  /**
   * Get category by ID
   */
  static async getCategoryById(
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

      const categoryRepository = getRepository(Category);

      // Find category by ID and ensure it belongs to the user's organization
      const category = await categoryRepository.findOne({
        where: { id, organizationId },
        relations: ["parentCategory", "children"],
      });

      if (!category) {
        res.status(404).json({ message: "Category not found" });
        return;
      }

      // Get product count for this category
      const productCount = await getRepository(Product)
        .createQueryBuilder("product")
        .where("product.categoryId = :categoryId", { categoryId: id })
        .getCount();

      // Get child categories and their product counts
      const childCategories = await categoryRepository.find({
        where: { parentCategoryId: id },
        order: { displayOrder: "ASC", name: "ASC" },
      });

      // Define an explicit type for childCategoriesWithCounts to fix TypeScript errors
      let childCategoriesWithCounts: Array<
        Category & { productCount: number }
      > = [];

      if (childCategories.length > 0) {
        const childCategoryIds = childCategories.map((c) => c.id);
        const childProductCounts = await getRepository(Product)
          .createQueryBuilder("product")
          .select("product.categoryId", "categoryId")
          .addSelect("COUNT(*)", "count")
          .where("product.categoryId IN (:...childCategoryIds)", {
            childCategoryIds,
          })
          .groupBy("product.categoryId")
          .getRawMany();

        let childCategoriesWithCounts = childCategories.map((child) => {
          const countRecord = childProductCounts.find(
            (pc) => pc.categoryId === child.id
          );
          return {
            ...child,
            productCount: countRecord ? parseInt(countRecord.count) : 0,
          };
        });
      }

      res.json({
        ...category,
        productCount,
        childCategories: childCategoriesWithCounts,
      });
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ message: "Error fetching category" });
    }
  }

  /**
   * Create a new category
   */
  static async createCategory(
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

      const categoryData = req.body;

      // Validate required fields
      if (!categoryData.name) {
        res.status(400).json({ message: "Category name is required" });
        return;
      }

      // Check if category with the same name already exists in this organization
      const categoryRepository = getRepository(Category);
      const existingCategory = await categoryRepository.findOne({
        where: { name: categoryData.name, organizationId },
      });

      if (existingCategory) {
        res.status(400).json({
          message:
            "A category with this name already exists in your organization",
        });
        return;
      }

      // Fix: Convert empty string parentCategoryId to null
      if (categoryData.parentCategoryId === "") {
        categoryData.parentCategoryId = null;
      }

      // If parent category is provided, verify it exists
      if (categoryData.parentCategoryId) {
        const parentCategory = await categoryRepository.findOne({
          where: { id: categoryData.parentCategoryId, organizationId },
        });

        if (!parentCategory) {
          res.status(404).json({ message: "Parent category not found" });
          return;
        }
      }

      // Set display order to be the highest value + 1
      let displayOrder = 0;

      if (categoryData.parentCategoryId) {
        // Get highest display order among siblings
        const highestOrderCategory = await categoryRepository.findOne({
          where: {
            parentCategoryId: categoryData.parentCategoryId,
            organizationId,
          },
          order: { displayOrder: "DESC" },
        });

        if (highestOrderCategory) {
          displayOrder = highestOrderCategory.displayOrder + 1;
        }
      } else {
        // Get highest display order among root categories
        const highestOrderCategory = await categoryRepository.findOne({
          where: { parentCategoryId: null, organizationId },
          order: { displayOrder: "DESC" },
        });

        if (highestOrderCategory) {
          displayOrder = highestOrderCategory.displayOrder + 1;
        }
      }

      // Create new category
      const category = categoryRepository.create({
        ...categoryData,
        organizationId,
        displayOrder,
      });

      await categoryRepository.save(category);

      res.status(201).json({
        message: "Category created successfully",
        category,
      });
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Error creating category" });
    }
  }

  /**
   * Update category display order
   */
  static async updateCategoryOrder(
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

      const { categoryIds } = req.body;

      if (
        !categoryIds ||
        !Array.isArray(categoryIds) ||
        categoryIds.length === 0
      ) {
        res.status(400).json({ message: "Category IDs array is required" });
        return;
      }

      const categoryRepository = getRepository(Category);

      // Update display order for each category
      for (let i = 0; i < categoryIds.length; i++) {
        const categoryId = categoryIds[i];

        // Verify category exists and belongs to this organization
        const category = await categoryRepository.findOne({
          where: { id: categoryId, organizationId },
        });

        if (category) {
          category.displayOrder = i;
          await categoryRepository.save(category);
        }
      }

      res.json({ message: "Category order updated successfully" });
    } catch (error) {
      console.error("Error updating category order:", error);
      res.status(500).json({ message: "Error updating category order" });
    }
  }

  /**
   * Update category
   */
  static async updateCategory(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const categoryData = req.body;
      const organizationId = req.user?.organization?.id;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      // Fix for empty parentCategoryId - convert empty string to null
      if (categoryData.parentCategoryId === "") {
        categoryData.parentCategoryId = null;
      }

      // Check if category exists
      const categoryRepository = getRepository(Category);
      const existingCategory = await categoryRepository.findOne({
        where: { id, organizationId },
      });

      if (!existingCategory) {
        res.status(404).json({ message: "Category not found" });
        return;
      }

      // Update category
      await categoryRepository.update(id, {
        ...categoryData,
        organizationId, // Ensure organizationId is preserved
      });

      // Get updated category
      const updatedCategory = await categoryRepository.findOne({
        where: { id },
        relations: ["parentCategory"],
      });

      res.json({
        message: "Category updated successfully",
        category: updatedCategory,
      });
    } catch (error: any) {
      console.error("Error updating category:", error);
      res.status(500).json({
        message: "Error updating category",
        error: error.message || String(error),
      });
    }
  }

  /**
   * Delete category
   */
  static async deleteCategory(
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

      // Find category by ID and ensure it belongs to the user's organization
      const categoryRepository = getRepository(Category);
      const category = await categoryRepository.findOne({
        where: { id, organizationId },
      });

      if (!category) {
        res.status(404).json({ message: "Category not found" });
        return;
      }

      // Check if category has children
      const childrenCount = await categoryRepository.count({
        where: { parentCategoryId: id },
      });

      if (childrenCount > 0) {
        res.status(400).json({
          message:
            "Cannot delete category with sub-categories. Delete or reassign sub-categories first.",
        });
        return;
      }

      // Check if category has products
      const productCount = await getRepository(Product).count({
        where: { categoryId: id },
      });

      if (productCount > 0) {
        res.status(400).json({
          message:
            "Cannot delete category with associated products. Reassign products first.",
        });
        return;
      }

      // Delete category
      await categoryRepository.remove(category);

      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Error deleting category" });
    }
  }

  /**
   * Get category hierarchy
   */
  static async getCategoryHierarchy(
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

      const categoryRepository = getRepository(Category);

      // Get all categories for this organization
      const allCategories = await categoryRepository.find({
        where: { organizationId },
        order: { displayOrder: "ASC", name: "ASC" },
      });

      // Get product counts for categories if there are any categories
      let productCounts: Array<{ categoryId: string; count: string }> = [];
      if (allCategories.length > 0) {
        const categoryIds = allCategories.map((cat) => cat.id);
        productCounts = await getRepository(Product)
          .createQueryBuilder("product")
          .select("product.categoryId", "categoryId")
          .addSelect("COUNT(*)", "count")
          .where("product.categoryId IN (:...categoryIds)", { categoryIds })
          .groupBy("product.categoryId")
          .getRawMany();
      }

      // Remove the explicit type annotation and let TypeScript infer the type
      // or use a type assertion to tell TypeScript what the result will be
      const categoriesWithCounts = allCategories.map((category) => {
        const countRecord = productCounts.find(
          (pc) => pc.categoryId === category.id
        );
        return {
          ...category,
          productCount: countRecord ? parseInt(countRecord.count) : 0,
        };
      });

      // Function to build category tree
      const buildCategoryTree = (parentId: string | null = null): any[] => {
        return categoriesWithCounts
          .filter((cat: any) => cat.parentCategoryId === parentId)
          .map((cat: any) => ({
            ...cat,
            children: buildCategoryTree(cat.id),
          }));
      };

      // Build the tree starting from root categories (without parent)
      const categoryTree = buildCategoryTree(null);

      res.json({
        categoryTree,
        flatCategories: categoriesWithCounts,
      });
    } catch (error) {
      console.error("Error fetching category hierarchy:", error);
      res.status(500).json({ message: "Error fetching category hierarchy" });
    }
  }
}
