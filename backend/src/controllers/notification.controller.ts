import { Request, Response } from "express";
import { getRepository } from "../config/database";
import { NotificationService } from "../services/notification.service";
import { NotificationCategory } from "../interface/notification";
import { Notification } from "../entities/notification.entity";

// Define custom request interface with user property
interface CustomRequest extends Request {
  user?: any; // Using 'any' type for compatibility
}

export class NotificationController {
  /**
   * Get notifications for the authenticated user
   */
  static async getUserNotifications(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user!.id; // From auth middleware
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      const unreadOnly = req.query.unreadOnly === "true";
      const category = req.query.category as NotificationCategory | undefined;

      const result = await NotificationService.getUserNotifications(userId, {
        limit,
        offset,
        unreadOnly,
        category,
      });

      res.status(200).json({
        data: result.notifications,
        pagination: {
          total: result.total,
          limit,
          offset,
          hasMore: offset + limit < result.total,
        },
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id; // From auth middleware
      const { notificationId } = req.params;

      // Verify the notification belongs to the user
      const notification = await NotificationService.markAsRead(notificationId);

      if (notification.userId !== userId) {
        res
          .status(403)
          .json({ message: "Not authorized to update this notification" });
        return;
      }

      res.status(200).json({
        message: "Notification marked as read",
        data: notification,
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id; // From auth middleware
      const category = req.query.category as NotificationCategory | undefined;

      await NotificationService.markAllAsRead(userId, category);

      res.status(200).json({
        message: "All notifications marked as read",
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({
        message: "Failed to mark all notifications as read",
      });
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user!.id; // From auth middleware
      const { notificationId } = req.params;

      // Get the notification to check ownership
      const notificationRepository = getRepository(Notification);
      const notification = await notificationRepository.findOne({
        where: { id: notificationId },
      });

      if (!notification) {
        res.status(404).json({ message: "Notification not found" });
        return;
      }

      if (notification.userId !== userId) {
        res
          .status(403)
          .json({ message: "Not authorized to delete this notification" });
        return;
      }

      await NotificationService.deleteNotification(notificationId);

      res.status(200).json({
        message: "Notification deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  }

  /**
   * Clear all read notifications
   */
  static async clearReadNotifications(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user!.id; // From auth middleware

      await NotificationService.clearReadNotifications(userId);

      res.status(200).json({
        message: "Read notifications cleared successfully",
      });
    } catch (error) {
      console.error("Error clearing read notifications:", error);
      res.status(500).json({ message: "Failed to clear read notifications" });
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user!.id; // From auth middleware

      const count = await NotificationService.getUnreadCount(userId);

      res.status(200).json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  }

  /**
   * Create a test notification (dev only)
   */
  static async createTestNotification(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      if (process.env.NODE_ENV === "production") {
        res.status(403).json({ message: "Not available in production" });
        return;
      }

      const userId = req.user!.id;
      const { type, category } = req.body;

      const notification = await NotificationService.createNotification(
        userId,
        "Test Notification",
        "This is a test notification created for development purposes.",
        type,
        category,
        { link: "/dashboard" }
      );

      res.status(201).json({
        message: "Test notification created",
        data: notification,
      });
    } catch (error) {
      console.error("Error creating test notification:", error);
      res.status(500).json({ message: "Failed to create test notification" });
    }
  }
}
