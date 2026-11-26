import { getRepository } from "../config/database";
import { Notification } from "../entities/notification.entity";
import {
  NotificationType,
  NotificationCategory,
} from "../interface/notification";
import { User } from "../entities/user.entity";

export class NotificationService {
  /**
   * Create a notification for a user
   */
  static async createNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType = NotificationType.INFO,
    category: NotificationCategory = NotificationCategory.SYSTEM,
    options: {
      link?: string;
      metadata?: any;
      expiresAt?: Date;
    } = {}
  ): Promise<Notification> {
    try {
      const notificationRepository = getRepository(Notification);

      const notification = notificationRepository.create({
        userId,
        title,
        message,
        type,
        category,
        link: options.link,
        metadata: options.metadata,
        expiresAt: options.expiresAt,
        isRead: false,
      });

      // Cast the result to Notification type
      return (await notificationRepository.save(notification)) as Notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw new Error("Failed to create notification");
    }
  }

  /**
   * Create a notification for multiple users
   */
  static async createBulkNotifications(
    userIds: string[],
    title: string,
    message: string,
    type: NotificationType = NotificationType.INFO,
    category: NotificationCategory = NotificationCategory.SYSTEM,
    options: {
      link?: string;
      metadata?: any;
      expiresAt?: Date;
    } = {}
  ): Promise<Notification[]> {
    try {
      const notificationRepository = getRepository(Notification);

      const notifications = userIds.map((userId) =>
        notificationRepository.create({
          userId,
          title,
          message,
          type,
          category,
          link: options.link,
          metadata: options.metadata,
          expiresAt: options.expiresAt,
          isRead: false,
        })
      );

      // Cast the result to Notification[] type
      return (await notificationRepository.save(
        notifications
      )) as Notification[];
    } catch (error) {
      console.error("Error creating bulk notifications:", error);
      throw new Error("Failed to create bulk notifications");
    }
  }

  /**
   * Create a notification for all users with a specific role
   */
  static async notifyUsersByRole(
    role: string,
    title: string,
    message: string,
    type: NotificationType = NotificationType.INFO,
    category: NotificationCategory = NotificationCategory.SYSTEM,
    options: {
      link?: string;
      metadata?: any;
      expiresAt?: Date;
    } = {}
  ): Promise<Notification[]> {
    try {
      const userRepository = getRepository(User);
      const users = await userRepository.find({
        where: { role },
        select: ["id"], // Only retrieve IDs for efficiency
      });

      if (!users.length) {
        return [];
      }

      const userIds = users.map((user) => user.id);
      return this.createBulkNotifications(
        userIds,
        title,
        message,
        type,
        category,
        options
      );
    } catch (error) {
      console.error("Error notifying users by role:", error);
      throw new Error("Failed to notify users by role");
    }
  }

  /**
   * Get user notifications with pagination
   */
  static async getUserNotifications(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      category?: NotificationCategory;
    } = {}
  ): Promise<{ notifications: Notification[]; total: number }> {
    try {
      const notificationRepository = getRepository(Notification);
      const { limit = 10, offset = 0, unreadOnly = false, category } = options;

      // Build the where condition
      const whereCondition: any = { userId };
      if (unreadOnly) {
        whereCondition.isRead = false;
      }
      if (category) {
        whereCondition.category = category;
      }

      // Count total before pagination
      const total = await notificationRepository.count({
        where: whereCondition,
      });

      // Get notifications with pagination
      const notifications = await notificationRepository.find({
        where: whereCondition,
        order: { createdAt: "DESC" },
        take: limit,
        skip: offset,
      });

      // Explicitly cast the notifications to ensure TypeScript recognizes them correctly
      return {
        notifications: notifications as Notification[],
        total,
      };
    } catch (error) {
      console.error("Error fetching user notifications:", error);
      throw new Error("Failed to fetch user notifications");
    }
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(notificationId: string): Promise<Notification> {
    try {
      const notificationRepository = getRepository(Notification);
      const notification = await notificationRepository.findOne({
        where: { id: notificationId },
      });

      if (!notification) {
        throw new Error("Notification not found");
      }

      notification.isRead = true;
      notification.readAt = new Date();

      // Cast the result to Notification type
      return (await notificationRepository.save(notification)) as Notification;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw new Error("Failed to mark notification as read");
    }
  }

  /**
   * Mark all user notifications as read
   */
  static async markAllAsRead(
    userId: string,
    category?: NotificationCategory
  ): Promise<void> {
    try {
      const notificationRepository = getRepository(Notification);

      // Build where condition
      const whereCondition: any = { userId, isRead: false };
      if (category) {
        whereCondition.category = category;
      }

      await notificationRepository.update(whereCondition, {
        isRead: true,
        readAt: new Date(),
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw new Error("Failed to mark all notifications as read");
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(notificationId: string): Promise<void> {
    try {
      const notificationRepository = getRepository(Notification);
      await notificationRepository.delete(notificationId);
    } catch (error) {
      console.error("Error deleting notification:", error);
      throw new Error("Failed to delete notification");
    }
  }

  /**
   * Delete all read notifications for a user
   */
  static async clearReadNotifications(userId: string): Promise<void> {
    try {
      const notificationRepository = getRepository(Notification);
      await notificationRepository.delete({ userId, isRead: true });
    } catch (error) {
      console.error("Error clearing read notifications:", error);
      throw new Error("Failed to clear read notifications");
    }
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const notificationRepository = getRepository(Notification);
      return await notificationRepository.count({
        where: { userId, isRead: false },
      });
    } catch (error) {
      console.error("Error getting unread notification count:", error);
      throw new Error("Failed to get unread notification count");
    }
  }
}
