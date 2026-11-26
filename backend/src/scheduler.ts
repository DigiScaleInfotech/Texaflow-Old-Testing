import cron from "node-cron";
import { AutoPaymentService } from "./services/autoPaymentService";

/**
 * Initialize all scheduled tasks
 */
export function initializeScheduler() {
  // Run salary auto payment check daily at midnight
  cron.schedule("0 0 * * *", async () => {
    console.log("Running automatic salary payments check");
    await AutoPaymentService.processDuePayments();
  });

  console.log("Scheduler initialized with auto payment task");
}
