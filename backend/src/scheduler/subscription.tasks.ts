import { CronJob } from "cron";
import { SubscriptionService } from "../services/subscription.service";

export const initializeSubscriptionTasks = (): void => {
  // Create subscription service instance
  const subscriptionService = new SubscriptionService();

  // Check and cancel expired subscriptions - run every hour
  const checkExpiredSubscriptionsCron = new CronJob(
    "0 * * * *", // Cron expression: At minute 0 of every hour
    async () => {
      console.log("[Subscription Task] Checking for expired subscriptions...");
      try {
        const canceledCount =
          await subscriptionService.cancelExpiredSubscriptions();
        console.log(
          `[Subscription Task] Canceled ${canceledCount} expired subscriptions`
        );
      } catch (error) {
        console.error(
          "[Subscription Task] Error canceling expired subscriptions:",
          error
        );
      }
    },
    null, // onComplete
    true, // start
    "UTC" // timezone
  );

  // Also check for subscriptions that will expire soon (send reminders)
  const checkExpiringSubscriptionsCron = new CronJob(
    "0 9 * * *", // Cron expression: At 9:00 AM every day
    async () => {
      console.log(
        "[Subscription Task] Checking for soon-to-expire subscriptions..."
      );
      try {
        const expiringSubscriptions =
          await subscriptionService.findExpiringSubscriptions(7); // 7 days warning
        console.log(
          `[Subscription Task] Found ${expiringSubscriptions.length} subscriptions expiring soon`
        );

        // Process each expiring subscription to send emails
        for (const subscription of expiringSubscriptions) {
          await subscriptionService.sendUpgradeRecommendationEmail(
            subscription.id
          );
        }
      } catch (error) {
        console.error(
          "[Subscription Task] Error processing expiring subscriptions:",
          error
        );
      }
    },
    null, // onComplete
    true, // start
    "UTC" // timezone
  );

  console.log("Subscription scheduled tasks initialized");
};
