import { Request, Response } from "express";
import { getRepository } from "../config/database";
import { Shipping } from "../entities/shipping.entity";
import { Order } from "../entities/order.entity";
import { OrderStatus } from "../interface/order";
import { ShippingStatus, ShippingMethod } from "../interface/shipping";

// Define custom request interface with user property
interface CustomRequest extends Request {
  user?: any; // Using 'any' type for compatibility
}

export class ShippingController {
  /**
   * Get all shippings with pagination and filtering
   */
  static async getShippings(req: CustomRequest, res: Response): Promise<void> {
    try {
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
      const status = req.query.status as string;
      const orderId = req.query.orderId as string;
      const search = req.query.search as string;

      // Get repository
      const shippingRepository = getRepository(Shipping);

      // Build query
      let queryBuilder = shippingRepository
        .createQueryBuilder("shipping")
        .leftJoinAndSelect("shipping.order", "order")
        .leftJoinAndSelect("order.customer", "customer")
        .where("shipping.organizationId = :organizationId", { organizationId });

      // Apply filters if provided
      if (status) {
        queryBuilder = queryBuilder.andWhere("shipping.status = :status", {
          status,
        });
      }

      if (orderId) {
        queryBuilder = queryBuilder.andWhere("shipping.orderId = :orderId", {
          orderId,
        });
      }

      if (search) {
        queryBuilder = queryBuilder.andWhere(
          "(shipping.trackingNumber ILIKE :search OR " +
            "shipping.carrier ILIKE :search OR " +
            "customer.name ILIKE :search)",
          { search: `%${search}%` }
        );
      }

      // Get total count
      const total = await queryBuilder.getCount();

      // Apply pagination
      const shippings = await queryBuilder
        .orderBy("shipping.createdAt", "DESC")
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

      res.json({
        shippings,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error("Error fetching shippings:", error);
      res.status(500).json({ message: "Error fetching shippings" });
    }
  }

  /**
   * Get shipping by ID
   */
  static async getShippingById(
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

      const shippingRepository = getRepository(Shipping);
      const shipping = await shippingRepository.findOne({
        where: { id, organizationId },
        relations: ["order", "order.customer"],
      });

      if (!shipping) {
        res.status(404).json({ message: "Shipping record not found" });
        return;
      }

      res.json(shipping);
    } catch (error) {
      console.error("Error fetching shipping:", error);
      res.status(500).json({ message: "Error fetching shipping" });
    }
  }

  /**
   * Create a new shipping record
   */
  static async createShipping(
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

      const shippingData = req.body;

      // Validate order ID
      if (!shippingData.orderId) {
        res.status(400).json({ message: "Order ID is required" });
        return;
      }

      // Check if order exists and belongs to the organization
      const orderRepository = getRepository(Order);
      const order = await orderRepository.findOne({
        where: { id: shippingData.orderId, organizationId },
      });

      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      // Create shipping record
      const shippingRepository = getRepository(Shipping);
      const shipping = shippingRepository.create({
        ...shippingData,
        createdById: userId,
        organizationId,
        status: shippingData.status || ShippingStatus.PROCESSING,
      });

      const savedShipping = await shippingRepository.save(shipping);

      // Update order status if shipping is created
      if (
        order.status === OrderStatus.PENDING ||
        order.status === OrderStatus.PROCESSING
      ) {
        order.status = OrderStatus.SHIPPED;
        await orderRepository.save(order);
      }

      res.status(201).json({
        message: "Shipping created successfully",
        shipping: savedShipping,
      });
    } catch (error) {
      console.error("Error creating shipping:", error);
      res.status(500).json({
        message: "Error creating shipping",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Update shipping record
   */
  static async updateShipping(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const organizationId = req.user?.organization?.id;
      const userId = req.user!.id;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      const shippingRepository = getRepository(Shipping);
      const orderRepository = getRepository(Order);

      // Find shipping record
      const shipping = await shippingRepository.findOne({
        where: { id, organizationId },
        relations: ["order"],
      });

      if (!shipping) {
        res.status(404).json({ message: "Shipping record not found" });
        return;
      }

      // Update fields
      const updatedData = req.body;

      // Handle status change
      const statusChanged =
        updatedData.status && updatedData.status !== shipping.status;

      // Update shipping
      Object.assign(shipping, updatedData);
      const updatedShipping = await shippingRepository.save(shipping);

      // If status changed to delivered, update the order status
      if (statusChanged && updatedData.status === ShippingStatus.DELIVERED) {
        const order = shipping.order;
        if (order) {
          order.status = OrderStatus.DELIVERED;
          await orderRepository.save(order);
        }
      }

      // If status changed to returned, update the order status
      if (statusChanged && updatedData.status === ShippingStatus.RETURNED) {
        const order = shipping.order;
        if (order) {
          order.status = OrderStatus.CANCELLED; // Use CANCELLED instead of RETURNED
          await orderRepository.save(order);
        }
      }

      res.json({
        message: "Shipping updated successfully",
        shipping: updatedShipping,
      });
    } catch (error) {
      console.error("Error updating shipping:", error);
      res.status(500).json({
        message: "Error updating shipping",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Delete shipping record
   */
  static async deleteShipping(
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

      const shippingRepository = getRepository(Shipping);

      // Find shipping record
      const shipping = await shippingRepository.findOne({
        where: { id, organizationId },
      });

      if (!shipping) {
        res.status(404).json({ message: "Shipping record not found" });
        return;
      }

      // Delete shipping
      await shippingRepository.remove(shipping);

      res.json({ message: "Shipping deleted successfully" });
    } catch (error) {
      console.error("Error deleting shipping:", error);
      res.status(500).json({ message: "Error deleting shipping" });
    }
  }
}
