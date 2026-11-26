import { getRepository } from "../config/database";
import { SubscriptionPlan } from "../entities/subscription-plan.entity";
import { OrganizationSubscription } from "../entities/organization-subscription.entity";
import { SubscriptionStatus } from "../interface/subscription"; // Import from interface instead
import { Organization } from "../entities/organization.entity";
import { User } from "../entities/user.entity";
import { MailService } from "../services/mail.service";

export class SubscriptionService {
  /**
   * Get all active subscription plans
   */
  async getAllPlans(): Promise<SubscriptionPlan[]> {
    const planRepository = getRepository(SubscriptionPlan);
    const plans = await planRepository.find({
      where: { isActive: true },
      order: { price: "ASC" },
    });
    return plans as SubscriptionPlan[]; // Type assertion to fix type issue
  }

  /**
   * Get plan by ID
   */
  async getPlanById(planId: string): Promise<SubscriptionPlan | null> {
    const planRepository = getRepository(SubscriptionPlan);
    const plan = await planRepository.findOne({
      where: { planId },
    });
    return plan as SubscriptionPlan | null; // Type assertion to fix type issue
  }

  /**
   * Subscribe an organization to a plan
   */
  async subscribeOrganization(
    organizationId: string,
    planId: string,
    paymentId?: string
  ): Promise<OrganizationSubscription> {
    const planRepository = getRepository(SubscriptionPlan);
    const organizationRepository = getRepository(Organization);
    const subscriptionRepository = getRepository(OrganizationSubscription);

    // Get the plan
    const plan = await planRepository.findOne({
      where: { planId },
    });

    if (!plan) {
      throw new Error("Subscription plan not found");
    }

    // Get the organization
    const organization = await organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new Error("Organization not found");
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + plan.durationMonths);

    // Create the subscription
    const subscription = subscriptionRepository.create({
      organizationId,
      subscriptionPlanId: plan.id,
      startDate,
      endDate,
      status: SubscriptionStatus.ACTIVE,
      paymentId,
      autoRenew: false,
    });

    await subscriptionRepository.save(subscription);

    // Update the organization with subscription details
    organization.currentSubscriptionId = subscription.id;
    organization.subscriptionStartDate = startDate;
    organization.subscriptionEndDate = endDate;
    organization.hasActiveSubscription = true;

    await organizationRepository.save(organization);

    return subscription as OrganizationSubscription; // Type assertion to fix type issue
  }

  /**
   * Get active subscription for an organization
   */
  async getActiveSubscription(
    organizationId: string
  ): Promise<OrganizationSubscription | null> {
    const subscriptionRepository = getRepository(OrganizationSubscription);
    const subscription = await subscriptionRepository.findOne({
      where: {
        organizationId,
        status: SubscriptionStatus.ACTIVE,
      },
      relations: ["plan"],
    });
    return subscription as OrganizationSubscription | null; // Type assertion to fix type issue
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(
    subscriptionId: string
  ): Promise<OrganizationSubscription> {
    const subscriptionRepository = getRepository(OrganizationSubscription);
    const subscription = await subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ["organization"],
    });

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    subscription.status = SubscriptionStatus.CANCELLED;
    await subscriptionRepository.save(subscription);

    // Update the organization
    if (subscription.organization) {
      const organizationRepository = getRepository(Organization);
      const organization = subscription.organization;
      organization.hasActiveSubscription = false;
      await organizationRepository.save(organization);
    }

    return subscription as OrganizationSubscription; // Type assertion to fix type issue
  }

  /**
   * Find subscriptions expiring within a certain number of days
   */
  async findExpiringSubscriptions(
    days: number
  ): Promise<OrganizationSubscription[]> {
    const subscriptionRepository = getRepository(OrganizationSubscription);

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    const expiringSubscriptions = await subscriptionRepository
      .createQueryBuilder("subscription")
      .leftJoinAndSelect("subscription.plan", "plan")
      .where("subscription.status = :status", {
        status: SubscriptionStatus.ACTIVE,
      })
      .andWhere("subscription.endDate <= :futureDate", { futureDate })
      .andWhere("subscription.endDate >= :now", { now })
      .getMany();

    return expiringSubscriptions as OrganizationSubscription[];
  }

  /**
   * Find recommended upgrade plan for a user based on usage
   */
  async findRecommendedUpgradePlan(
    currentPlanId: string
  ): Promise<SubscriptionPlan | null> {
    const planRepository = getRepository(SubscriptionPlan);

    // Find current plan
    const currentPlan = await planRepository.findOne({
      where: { id: currentPlanId },
    });

    if (!currentPlan) {
      return null;
    }

    // Find plans with higher price (upgrades)
    const upgradePlans = (await planRepository.find({
      where: { isActive: true },
      order: { price: "ASC" },
    })) as SubscriptionPlan[];

    // Find the next tier plan
    const upgradePlan = upgradePlans.find(
      (plan) => plan.price > currentPlan.price
    );

    return upgradePlan || null;
  }

  /**
   * Send upgrade recommendation email
   */
  async sendUpgradeRecommendationEmail(
    subscriptionId: string
  ): Promise<boolean> {
    const subscriptionRepository = getRepository(OrganizationSubscription);
    const userRepository = getRepository(User);

    // Get the subscription with plan
    const subscription = (await subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ["plan"],
    })) as OrganizationSubscription | null;

    if (!subscription || !subscription.plan) {
      return false;
    }

    // Find the organization owner
    const owner = (await userRepository.findOne({
      where: {
        organizationId: subscription.organizationId,
        organizationRole: "OWNER",
      },
      relations: ["organization"],
    })) as User;

    if (!owner) {
      return false;
    }

    // Find recommended upgrade plan
    const recommendedPlan = await this.findRecommendedUpgradePlan(
      subscription.plan.id
    );

    if (!recommendedPlan) {
      return false;
    }

    // Send upgrade email
    return await MailService.sendSubscriptionUpgradeEmail(
      owner,
      subscription,
      recommendedPlan
    );
  }

  /**
   * Find expired subscriptions and cancel them
   */
  async cancelExpiredSubscriptions(): Promise<number> {
    const subscriptionRepository = getRepository(OrganizationSubscription);
    const organizationRepository = getRepository(Organization);
    const now = new Date();

    // Find expired active subscriptions
    const expiredSubscriptions = (await subscriptionRepository
      .createQueryBuilder("subscription")
      .leftJoinAndSelect("subscription.organization", "organization")
      .where("subscription.status = :status", {
        status: SubscriptionStatus.ACTIVE,
      })
      .andWhere("subscription.endDate < :now", { now })
      .getMany()) as OrganizationSubscription[];

    console.log(`Found ${expiredSubscriptions.length} expired subscriptions`);

    // Process each expired subscription
    let canceledCount = 0;
    for (const subscription of expiredSubscriptions) {
      try {
        // Update subscription status
        subscription.status = SubscriptionStatus.EXPIRED;
        await subscriptionRepository.save(subscription);

        // Update organization subscription status
        if (subscription.organization) {
          const organization = subscription.organization;
          organization.hasActiveSubscription = false;
          organization.currentSubscriptionId = undefined;
          await organizationRepository.save(organization);

          // Notify organization owner
          await this.sendSubscriptionExpiredEmail(subscription);
        }

        canceledCount++;
      } catch (error) {
        console.error(
          `Error canceling subscription ${subscription.id}:`,
          error
        );
      }
    }

    return canceledCount;
  }

  /**
   * Send subscription expired email notification
   */
  async sendSubscriptionExpiredEmail(
    subscription: OrganizationSubscription
  ): Promise<boolean> {
    const userRepository = getRepository(User);

    // Find the organization owner
    const owner = (await userRepository.findOne({
      where: {
        organizationId: subscription.organizationId,
        organizationRole: "OWNER",
      },
      relations: ["organization"],
    })) as User | null;

    if (!owner || !owner.email) {
      return false;
    }

    // Send expiration email
    return await MailService.sendSubscriptionExpiredEmail(owner, subscription);
  }
}
