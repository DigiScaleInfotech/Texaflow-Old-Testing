import { MailService } from "../services/mail.service";
import { QueueService } from "../services/queue.service";

interface MailTask {
  type: string;
  data: any;
  attempts?: number;
  status?: string;
  addedAt?: Date;
  processingStartedAt?: Date;
  completedAt?: Date;
  error?: string;
}

/**
 * Worker function to process email tasks in the background
 */
export const mailWorker = async (task: MailTask): Promise<void> => {
  console.log(`Processing mail task of type: ${task.type}`);

  switch (task.type) {
    case "vendor-message":
      await processVendorMessage(task.data);
      break;

    case "admin-response":
      await processAdminResponse(task.data);
      break;

    case "subscription-expiry-reminder":
      await processSubscriptionExpiryReminder(task.data);
      break;

    case "subscription-expired":
      await processSubscriptionExpired(task.data);
      break;

    // Update the case handler for customer email to fix the type issue
    case "customer-email":
      try {
        const { customer, subject, message, sentBy, senderName } = task.data;

        await MailService.sendCustomerEmail(customer, subject, message, {
          sentBy,
          senderName,
        });

        // Don't return a value since the function expects void
        console.log(`Email sent successfully to customer: ${customer.email}`);
      } catch (error) {
        console.error("Error processing customer email task:", error);
        throw error;
      }
      break; // Add a break statement instead of returning

    default:
      throw new Error(`Unknown mail task type: ${task.type}`);
  }
};

/**
 * Process vendor message email
 */
async function processVendorMessage(data: any): Promise<void> {
  const { vendor, subject, message, reason } = data;

  if (!vendor || !subject || !message) {
    throw new Error("Missing required data for vendor message");
  }

  const result = await MailService.sendVendorMessageToAdmin(
    vendor,
    subject,
    message,
    reason
  );

  if (!result) {
    throw new Error("Failed to send vendor message email");
  }
}

/**
 * Process admin response email
 */
async function processAdminResponse(data: any): Promise<void> {
  const { vendor, originalSubject, adminResponse, originalMessage } = data;

  if (!vendor || !adminResponse || !originalSubject) {
    throw new Error("Missing required data for admin response");
  }

  const result = await MailService.sendAdminResponseToVendor(
    vendor,
    originalSubject,
    adminResponse,
    originalMessage
  );

  if (!result) {
    throw new Error("Failed to send admin response email");
  }
}

/**
 * Process subscription expiry reminder email
 */
async function processSubscriptionExpiryReminder(data: any): Promise<void> {
  const { user, subscription, daysRemaining } = data;

  if (!user || !subscription || !daysRemaining) {
    throw new Error("Missing required data for subscription expiry reminder");
  }

  const result = await MailService.sendSubscriptionExpiryReminder(
    user,
    subscription,
    daysRemaining
  );

  if (!result) {
    throw new Error("Failed to send subscription expiry reminder email");
  }
}

/**
 * Process subscription expired email
 */
async function processSubscriptionExpired(data: any): Promise<void> {
  const { user, subscription } = data;

  if (!user || !subscription) {
    throw new Error(
      "Missing required data for subscription expired notification"
    );
  }

  const result = await MailService.sendSubscriptionExpiredNotice(
    user,
    subscription
  );

  if (!result) {
    throw new Error("Failed to send subscription expired email");
  }
}

/**
 * Initialize mail worker
 */
export function initializeMailWorker(): void {
  // Register the mail worker with the queue service
  QueueService.registerWorker("mail", mailWorker);
  console.log("Mail worker initialized");
}
