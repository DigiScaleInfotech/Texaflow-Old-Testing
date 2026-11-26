import { Request, Response } from "express";
import { getRepository } from "../config/database";
import { Organization } from "../entities/organization.entity";
import { SubscriptionPlan } from "../entities/subscription-plan.entity";
import { OrganizationSubscription } from "../entities/organization-subscription.entity";
import { SubscriptionStatus } from "../interface/subscription";

// Define custom request interface with user property
interface CustomRequest extends Request {
  user?: any;
}

export class OrganizationSubscriptionController {
  /**
   * Subscribe to a new plan
   */
  static async subscribe(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const organizationId = req.user?.organization?.id;
      const { planId } = req.body;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      if (!planId) {
        res.status(400).json({ message: "Plan ID is required" });
        return;
      }

      const organizationRepository = getRepository(Organization);
      const planRepository = getRepository(SubscriptionPlan);
      const subscriptionRepository = getRepository(OrganizationSubscription);

      // Find organization
      const organization = await organizationRepository.findOne({
        where: { id: organizationId },
      });

      if (!organization) {
        res.status(404).json({ message: "Organization not found" });
        return;
      }

      // Find plan
      const plan = await planRepository.findOne({
        where: { planId, isActive: true },
      });

      if (!plan) {
        res
          .status(404)
          .json({ message: "Subscription plan not found or inactive" });
        return;
      }

      // Check if there's an existing active subscription
      const existingSubscription = await subscriptionRepository.findOne({
        where: { organizationId, status: SubscriptionStatus.ACTIVE },
      });

      // If there's an existing subscription, mark it as cancelled
      if (existingSubscription) {
        existingSubscription.status = SubscriptionStatus.CANCELLED;
        existingSubscription.endDate = new Date();
        await subscriptionRepository.save(existingSubscription);
      }

      // Calculate end date based on billing cycle
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + plan.durationMonths);

      // Create new subscription
      const newSubscription = subscriptionRepository.create({
        organizationId,
        planId: plan.id,
        startDate,
        endDate,
        status: SubscriptionStatus.ACTIVE,
        amount: plan.price,
        isAutoRenew: true,
        metadata: {
          planName: plan.name,
          features: plan.features,
          billingCycle: plan.billingCycle,
        },
      });

      await subscriptionRepository.save(newSubscription);

      // Update organization with subscription info
      organization.hasActiveSubscription = true;
      organization.currentSubscriptionId = newSubscription.id;
      await organizationRepository.save(organization);

      // Return success response
      res.status(200).json({
        message: "Subscription completed successfully",
        organization,
        subscription: newSubscription,
      });
    } catch (error) {
      console.error("Error subscribing to plan:", error);
      res.status(500).json({ message: "Error subscribing to plan" });
    }
  }

  /**
   * Get current subscription
   */
  static async getCurrentSubscription(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const organizationId = req.user?.organization?.id;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      const subscriptionRepository = getRepository(OrganizationSubscription);
      const planRepository = getRepository(SubscriptionPlan);

      const subscription = await subscriptionRepository.findOne({
        where: { organizationId, status: SubscriptionStatus.ACTIVE },
      });

      if (!subscription) {
        res.status(404).json({ message: "No active subscription found" });
        return;
      }

      const plan = await planRepository.findOne({
        where: { id: subscription.planId },
      });

      res.json({
        subscription,
        plan,
      });
    } catch (error) {
      console.error("Error fetching current subscription:", error);
      res.status(500).json({ message: "Error fetching current subscription" });
    }
  }
}
