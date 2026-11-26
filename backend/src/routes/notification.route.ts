import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Apply authentication middleware to all notification routes
router.use(authenticate);

// Get user notifications
router.get("/", NotificationController.getUserNotifications);

// Get unread notification count
router.get("/unread-count", NotificationController.getUnreadCount);

// Mark a notification as read
router.put("/:notificationId/read", NotificationController.markAsRead);

// Mark all notifications as read
router.put("/mark-all-read", NotificationController.markAllAsRead);

// Delete a notification
router.delete("/:notificationId", NotificationController.deleteNotification);

// Clear all read notifications
router.delete("/clear-read", NotificationController.clearReadNotifications);

// Create a test notification (dev only)
router.post("/test", NotificationController.createTestNotification);

export default router;
