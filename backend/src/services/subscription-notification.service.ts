import { getRepository } from "../config/database";
import { NotificationService } from "./notification.service";
import { MailService } from "./mail.service";
import { OrganizationSubscription } from "../entities/organization-subscription.entity";
import { Organization } from "../entities/organization.entity";
import { User } from "../entities/user.entity";
import {
  NotificationType,
  NotificationCategory,
} from "../interface/notification";
import { OrganizationRole } from "../interface/organization";
import { SubscriptionStatus } from "../interface/subscription";
import { QueueService } from "./queue.service";
import { WebSocketNotificationService } from "./websocket-notification.service";

export class SubscriptionNotificationService {
  /**
   * Check for expiring subscriptions and send notifications
   * @param daysThreshold Number of days before expiration to send notifications
   */
  static async checkExpiringSubscriptions(
    daysThreshold: number = 7
  ): Promise<void> {
    try {
      console.log(
        `Checking for subscriptions expiring in ${daysThreshold} days...`
      );

      // Calculate the target date range
      const now = new Date();
      const targetDate = new Date();
      targetDate.setDate(now.getDate() + daysThreshold);

      // Format dates for SQL comparison (YYYY-MM-DD)
      const formattedTargetDate = targetDate.toISOString().split("T")[0];

      // Get subscriptions expiring soon
      const subscriptionRepository = getRepository(OrganizationSubscription);
      const expiringSubscriptions = await subscriptionRepository
        .createQueryBuilder("subscription")
        .leftJoinAndSelect("subscription.organization", "organization")
        .leftJoinAndSelect("subscription.plan", "plan")
        .where("subscription.status = :status", {
          status: SubscriptionStatus.ACTIVE,
        })
        .andWhere("DATE(subscription.endDate) = :targetDate", {
          targetDate: formattedTargetDate,
        })
        .getMany();

      console.log(
        `Found ${expiringSubscriptions.length} subscriptions expiring soon`
      );

      // Process each expiring subscription
      for (const subscription of expiringSubscriptions) {
        await this.notifySubscriptionExpiringSoon(
          subscription as OrganizationSubscription,
          daysThreshold
        );
      }

      // Also check for expired subscriptions that haven't been marked as expired
      await this.checkExpiredSubscriptions();
    } catch (error) {
      console.error("Error checking expiring subscriptions:", error);
    }
  }

  /**
   * Check for already expired subscriptions and update their status
   */
  static async checkExpiredSubscriptions(): Promise<void> {
    try {
      console.log("Checking for expired subscriptions...");

      const now = new Date();
      const formattedNow = now.toISOString().split("T")[0];

      // Get expired but still active subscriptions
      const subscriptionRepository = getRepository(OrganizationSubscription);
      const expiredSubscriptions = await subscriptionRepository
        .createQueryBuilder("subscription")
        .leftJoinAndSelect("subscription.organization", "organization")
        .leftJoinAndSelect("subscription.plan", "plan")
        .where("subscription.status = :status", {
          status: SubscriptionStatus.ACTIVE,
        })
        .andWhere("DATE(subscription.endDate) < :today", {
          today: formattedNow,
        })
        .getMany();

      console.log(`Found ${expiredSubscriptions.length} expired subscriptions`);

      // Process each expired subscription
      for (const subscription of expiredSubscriptions) {
        await this.handleExpiredSubscription(
          subscription as OrganizationSubscription
        );
      }
    } catch (error) {
      console.error("Error checking expired subscriptions:", error);
    }
  }

  /**
   * Notify vendor about subscription expiring soon
   */
  private static async notifySubscriptionExpiringSoon(
    subscription: OrganizationSubscription,
    daysThreshold: number
  ): Promise<void> {
    try {
      if (!subscription.organization) {
        console.error(
          "Organization not found for subscription",
          subscription.id
        );
        return;
      }

      const organizationId = subscription.organization.id;

      // Find organization owner(s)
      const userRepository = getRepository(User);
      const owners = await userRepository.find({
        where: {
          organizationId,
          organizationRole: OrganizationRole.OWNER,
        },
      });

      if (owners.length === 0) {
        console.error("No owners found for organization", organizationId);
        return;
      }

      // Prepare notification details
      const planName = subscription.plan?.name || "Subscription";
      const expiryDate = subscription.endDate
        ? new Date(subscription.endDate).toLocaleDateString()
        : "soon";

      // Create in-app notification for each owner
      for (const owner of owners) {
        // Create database notification
        const notification = await NotificationService.createNotification(
          owner.id,
          "Subscription Expiring Soon",
          `Your ${planName} subscription will expire in ${daysThreshold} days (${expiryDate}). Renew now to avoid service interruption.`,
          NotificationType.WARNING,
          NotificationCategory.SUBSCRIPTION,
          {
            link: "/vendor-subscription-details",
            metadata: {
              subscriptionId: subscription.id,
              daysRemaining: daysThreshold,
              expiryDate: subscription.endDate,
            },
          }
        );

        // Send real-time notification via WebSocket if available
        WebSocketNotificationService.sendNotification(owner.id, {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          category: notification.category,
          link: notification.link || undefined,
          metadata: notification.metadata,
        });

        // Also send subscription-specific notification for UI updates
        WebSocketNotificationService.sendSubscriptionNotification(owner.id, {
          subscriptionId: subscription.id,
          planName: planName,
          status: "expiring_soon",
          daysRemaining: daysThreshold,
          expiryDate: subscription.endDate,
          action: "renew",
        });

        // Queue email instead of sending directly
        try {
          await QueueService.addTask("mail", {
            type: "subscription-expiry-reminder",
            data: {
              user: owner,
              subscription,
              daysRemaining: daysThreshold,
            },
          });
        } catch (emailError) {
          console.error(
            "Error queueing subscription expiry email:",
            emailError
          );
        }
      }

      console.log(
        `Sent expiry notifications for subscription ${subscription.id} to ${owners.length} owners`
      );
    } catch (error) {
      console.error("Error sending subscription expiry notification:", error);
    }
  }

  /**
   * Handle expired subscription
   */
  private static async handleExpiredSubscription(
    subscription: OrganizationSubscription
  ): Promise<void> {
    try {
      if (!subscription.organization) {
        console.error(
          "Organization not found for subscription",
          subscription.id
        );
        return;
      }

      const organizationId = subscription.organization.id;

      // Update subscription status
      const subscriptionRepository = getRepository(OrganizationSubscription);
      subscription.status = SubscriptionStatus.EXPIRED;
      await subscriptionRepository.save(subscription);

      // Update organization subscription status
      const organizationRepository = getRepository(Organization);
      const organization = await organizationRepository.findOne({
        where: { id: organizationId },
      });

      if (organization) {
        organization.hasActiveSubscription = false;
        await organizationRepository.save(organization);
      }

      // Find organization owner(s)
      const userRepository = getRepository(User);
      const owners = await userRepository.find({
        where: {
          organizationId,
          organizationRole: OrganizationRole.OWNER,
        },
      });

      if (owners.length === 0) {
        console.error("No owners found for organization", organizationId);
        return;
      }

      // Prepare notification details
      const planName = subscription.plan?.name || "Subscription";

      // Create in-app notification for each owner
      for (const owner of owners) {
        // Create database notification
        const notification = await NotificationService.createNotification(
          owner.id,
          "Subscription Expired",
          `Your ${planName} subscription has expired. Renew now to restore full access to services.`,
          NotificationType.ERROR,
          NotificationCategory.SUBSCRIPTION,
          {
            link: "/vendor-subscription-details",
            metadata: {
              subscriptionId: subscription.id,
              expiryDate: subscription.endDate,
            },
          }
        );

        // Send real-time notification via WebSocket if available
        WebSocketNotificationService.sendNotification(owner.id, {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          category: notification.category,
          link: notification.link || undefined,
          metadata: notification.metadata,
        });

        // Also send subscription-specific notification for UI updates
        WebSocketNotificationService.sendSubscriptionNotification(owner.id, {
          subscriptionId: subscription.id,
          planName: planName,
          status: "expired",
          expiryDate: subscription.endDate,
          action: "renew",
        });

        // Queue email instead of sending directly
        try {
          await QueueService.addTask("mail", {
            type: "subscription-expired",
            data: {
              user: owner,
              subscription,
            },
          });
        } catch (emailError) {
          console.error(
            "Error queueing subscription expired email:",
            emailError
          );
        }
      }

      console.log(
        `Updated status and sent notifications for expired subscription ${subscription.id}`
      );
    } catch (error) {
      console.error("Error handling expired subscription:", error);
    }
  }
}
