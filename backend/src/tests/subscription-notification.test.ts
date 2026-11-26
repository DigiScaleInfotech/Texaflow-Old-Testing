import { connectDatabase } from "../config/database";
import { SubscriptionNotificationService } from "../services/subscription-notification.service";

/**
 * Test script for subscription notifications
 * Run with: npx ts-node src/tests/subscription-notification.test.ts
 */
const testSubscriptionNotifications = async () => {
  try {
    console.log("Connecting to database...");
    await connectDatabase();

    console.log("Running subscription expiry checks...");

    // Check for subscriptions expiring in 7 days
    console.log("\nChecking subscriptions expiring in 7 days:");
    await SubscriptionNotificationService.checkExpiringSubscriptions(7);

    // Check for subscriptions expiring in 3 days
    console.log("\nChecking subscriptions expiring in 3 days:");
    await SubscriptionNotificationService.checkExpiringSubscriptions(3);

    // Check for subscriptions expiring in 1 day
    console.log("\nChecking subscriptions expiring in 1 day:");
    await SubscriptionNotificationService.checkExpiringSubscriptions(1);

    // Check for expired subscriptions
    console.log("\nChecking expired subscriptions:");
    await SubscriptionNotificationService.checkExpiredSubscriptions();

    console.log("\nTests completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
};

// Run the tests
testSubscriptionNotifications();
