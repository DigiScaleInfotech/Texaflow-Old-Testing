import { getRepository } from "../config/database";
import { OrganizationSubscription } from "../entities/organization-subscription.entity";
import { User } from "../entities/user.entity";
import { Organization } from "../entities/organization.entity";
import { SubscriptionStatus } from "../interface/subscription";
import { MailService } from "../services/mail.service";
import { MoreThan, LessThanOrEqual } from "typeorm";

/**
 * Check for subscriptions that are about to expire and send notification emails
 */
export async function checkExpiringSubscriptions(): Promise<void> {
  console.log("Checking for expiring subscriptions...");

  try {
    const now = new Date();
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(now.getDate() + 2);

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    // Get subscriptions repository
    const subscriptionRepository = getRepository(OrganizationSubscription);

    // Find active subscriptions expiring in the next 7 days
    const expiringSubscriptions = await subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: LessThanOrEqual(sevenDaysFromNow),
      },
      relations: ["plan"],
    }) as OrganizationSubscription[];

    console.log(
      `Found ${expiringSubscriptions.length} subscriptions expiring soon`
    );

    // Process each expiring subscription
    for (const subscription of expiringSubscriptions) {
      const endDate = new Date(subscription.endDate);
      const daysRemaining = Math.ceil(
        (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Get the organization and owner
      const organizationRepository = getRepository(Organization);
      const organization = await organizationRepository.findOne({
        where: { id: subscription.organizationId },
      }) as Organization;

      if (!organization) {
        console.log(
          `Organization not found for subscription ${subscription.id}`
        );
        continue;
      }

      // Find the organization owner/admin
      const userRepository = getRepository(User);
      const owner = await userRepository.findOne({
        where: {
          organizationId: organization.id,
          organizationRole: "OWNER",
        },
      }) as User;

      if (!owner) {
        console.log(`Owner not found for organization ${organization.id}`);
        continue;
      }

      // Send different emails based on days remaining
      if (daysRemaining <= 0) {
        // Subscription has expired
        await handleExpiredSubscription(subscription, owner, organization);
      } else if (daysRemaining <= 2) {
        // About to expire in next 2 days
        console.log(
          `Sending 2-day expiry notice for subscription ${subscription.id} to ${owner.email}`
        );
        await MailService.sendSubscriptionExpiryReminder(
          owner,
          subscription,
          daysRemaining
        );
      } else if (daysRemaining === 7) {
        // About to expire in 7 days
        console.log(
          `Sending 7-day expiry notice for subscription ${subscription.id} to ${owner.email}`
        );
        await MailService.sendSubscriptionExpiryReminder(
          owner,
          subscription,
          daysRemaining
        );
      }
    }

    console.log("Subscription check completed");
  } catch (error) {
    console.error("Error checking subscriptions:", error);
  }
}

/**
 * Handle expired subscriptions
 */
async function handleExpiredSubscription(
  subscription: OrganizationSubscription,
  owner: User,
  organization: Organization
): Promise<void> {
  // If the subscription is still active but has passed its end date, mark as expired
  if (subscription.status === SubscriptionStatus.ACTIVE) {
    console.log(`Marking subscription ${subscription.id} as expired`);

    // Update the subscription status
    const subscriptionRepository = getRepository(OrganizationSubscription);
    subscription.status = SubscriptionStatus.EXPIRED;
    await subscriptionRepository.save(subscription);

    // Update organization subscription status
    const organizationRepository = getRepository(Organization);
    organization.hasActiveSubscription = false;
    await organizationRepository.save(organization);

    // Send an email notification
    await MailService.sendSubscriptionExpiredNotice(owner, subscription);

    console.log(
      `Subscription ${subscription.id} marked as expired and notification sent`
    );
  }
}
