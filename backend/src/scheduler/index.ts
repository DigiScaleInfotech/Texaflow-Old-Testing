import { CronJob } from "cron";
import { checkExpiringSubscriptions } from "./subscription-scheduler";
import { initializeSubscriptionTasks } from "./subscription.tasks";

/**
 * Initialize all scheduled jobs
 */
export function initializeScheduler(): void {
  console.log("Initializing scheduler...");

  // Run subscription check daily at 1:00 AM
  const subscriptionCronJob = new CronJob("0 1 * * *", async () => {
    try {
      console.log("Running subscription expiry checker...");
      await checkExpiringSubscriptions();
    } catch (error) {
      console.error("Error in subscription expiry check:", error);
    }
  });

  // Start the jobs
  subscriptionCronJob.start();

  // Initialize all scheduled tasks
  initializeSubscriptionTasks();
  // ...other task initializers...

  console.log("Scheduler initialized successfully");
}
