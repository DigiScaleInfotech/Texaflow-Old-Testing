import { Request, Response } from "express";
import { getRepository } from "../config/database";
import { SubscriptionPlan } from "../entities/subscription-plan.entity";
import { OrganizationSubscription } from "../entities/organization-subscription.entity";
import { Organization } from "../entities/organization.entity";
import { SubscriptionStatus } from "../interface/subscription";
import * as crypto from "crypto";

interface CustomRequest extends Request {
  user?: any;
}

export class SubscriptionController {
  /**
   * Get all subscription plans
   */
  static async getSubscriptionPlans(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const planRepository = getRepository(SubscriptionPlan);
      const plans = await planRepository.find({
        where: { isActive: true },
        order: { price: "ASC" },
      });

      res.json({
        plans,
      });
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ message: "Error fetching subscription plans" });
    }
  }

  /**
   * Get current subscription with usage statistics
   */
  static async getCurrentSubscription(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const organizationId =
        req.user?.organization?.id || req.user?.organizationId;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      const subscriptionRepository = getRepository(OrganizationSubscription);
      const subscription = await subscriptionRepository.findOne({
        where: {
          organizationId,
          status: SubscriptionStatus.ACTIVE,
        },
        relations: ["plan"],
      });

      if (!subscription) {
        res.status(200).json({
          subscription: null,
          message: "No active subscription found",
        });
        return;
      }

      // Calculate subscription usage statistics
      const usageStats = SubscriptionController.calculateSubscriptionUsage(
        subscription.startDate,
        subscription.endDate,
        subscription.plan.price
      );

      // Add usage statistics to the response
      const subscriptionWithStats = {
        ...subscription,
        usageStats,
      };

      res.json({
        subscription: subscriptionWithStats,
      });
    } catch (error) {
      console.error("Error fetching current subscription:", error);
      res.status(500).json({ message: "Error fetching subscription" });
    }
  }

  /**
   * Calculate subscription usage statistics
   * @param startDate Subscription start date
   * @param endDate Subscription end date
   * @param price Subscription price
   */
  static calculateSubscriptionUsage(
    startDate: Date,
    endDate: Date,
    price: number
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    // Total duration in milliseconds
    const totalDuration = end.getTime() - start.getTime();

    // Elapsed time in milliseconds (capped at total duration)
    const elapsedTime = Math.min(
      now.getTime() - start.getTime(),
      totalDuration
    );

    // Calculate percentage used (0-100%)
    const usedPercentage = Math.min(
      Math.max((elapsedTime / totalDuration) * 100, 0),
      100
    );

    // Calculate consumed monetary value
    const consumedValue = Math.round((usedPercentage / 100) * price);
    const remainingValue = price - consumedValue;

    return {
      usedPercentage,
      consumedValue,
      remainingValue,
      elapsedDays: Math.floor(elapsedTime / (1000 * 60 * 60 * 24)),
      totalDays: Math.floor(totalDuration / (1000 * 60 * 60 * 24)),
      remainingDays: Math.floor(
        (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      ),
    };
  }

  /**
   * Subscribe to a plan (with Razorpay payment verification)
   */
  static async subscribeToPlan(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const {
        planId,
        razorpayPaymentId,
        razorpayOrderId,
        razorpaySignature,
        upgradeCredit = 0,
      } = req.body;
      const organizationId = req.user?.organization?.id;

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

      // If Razorpay payment fields are present, verify payment
      if (razorpayPaymentId && razorpayOrderId && razorpaySignature) {
        const razorpaySecret = process.env.RAZORPAY_KEY_SECRET || "";
        const generatedSignature = crypto
          .createHmac("sha256", razorpaySecret)
          .update(razorpayOrderId + "|" + razorpayPaymentId)
          .digest("hex");

        if (generatedSignature !== razorpaySignature) {
          res.status(400).json({ message: "Invalid payment signature" });
          return;
        }
        // Optionally: fetch payment from Razorpay API and check status
      }

      // Get the plan details
      const planRepository = getRepository(SubscriptionPlan);
      const plan = await planRepository.findOne({ where: { id: planId } });

      if (!plan) {
        res.status(404).json({ message: "Subscription plan not found" });
        return;
      }

      // Check if organization already has an active subscription
      const subscriptionRepository = getRepository(OrganizationSubscription);
      const existingSubscription = await subscriptionRepository.findOne({
        where: {
          organizationId,
          status: SubscriptionStatus.ACTIVE,
        },
      });

      // If there's an existing subscription, cancel it
      if (existingSubscription) {
        existingSubscription.status = SubscriptionStatus.CANCELLED;
        await subscriptionRepository.save(existingSubscription);
      }

      // Calculate subscription period based on billing cycle
      let durationInDays = 30; // Default to monthly
      if (plan.billingCycle === "3 months") durationInDays = 90;
      if (plan.billingCycle === "6 months") durationInDays = 180;
      if (plan.billingCycle === "1 year") durationInDays = 365;

      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + durationInDays);

      // Create new subscription
      const subscription = subscriptionRepository.create({
        organizationId,
        planId,
        startDate,
        endDate,
        status: SubscriptionStatus.ACTIVE,
      });

      await subscriptionRepository.save(subscription);

      // Get organization and update subscription status
      const organizationRepository = getRepository(Organization);
      const organization = await organizationRepository.findOne({
        where: { id: organizationId },
      });

      if (organization) {
        organization.subscriptionStatus = "active";
        organization.subscriptionEndDate = endDate;
        await organizationRepository.save(organization);
      }

      // Return the created subscription with plan details
      const fullSubscription = await subscriptionRepository.findOne({
        where: { id: subscription.id },
        relations: ["plan"],
      });

      res.status(201).json({
        message: "Successfully subscribed to plan",
        subscription: fullSubscription,
      });
    } catch (error) {
      console.error("Error subscribing to plan:", error);
      res.status(500).json({ message: "Error subscribing to plan" });
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const organizationId = req.user?.organization?.id;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      // Find the subscription
      const subscriptionRepository = getRepository(OrganizationSubscription);
      const subscription = await subscriptionRepository.findOne({
        where: {
          id,
          organizationId,
        },
      });

      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }

      // Update subscription status to cancelled
      subscription.status = SubscriptionStatus.CANCELLED;
      await subscriptionRepository.save(subscription);

      // Update organization subscription status
      const organizationRepository = getRepository(Organization);
      const organization = await organizationRepository.findOne({
        where: { id: organizationId },
      });

      if (organization) {
        organization.subscriptionStatus = "inactive";
        await organizationRepository.save(organization);
      }

      res.json({
        message: "Subscription cancelled successfully",
        subscription,
      });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ message: "Error cancelling subscription" });
    }
  }

  /**
   * Create a Razorpay order for subscription payment
   */
  static async createRazorpayOrder(req: any, res: any): Promise<void> {
    try {
      const { planId, upgradeCredit = 0 } = req.body;
      const organizationId = req.user?.organization?.id;

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

      // Get plan details
      const planRepository = require("../config/database").getRepository(
        require("../entities/subscription-plan.entity").SubscriptionPlan
      );
      const plan = await planRepository.findOne({ where: { id: planId } });
      if (!plan) {
        res.status(404).json({ message: "Subscription plan not found" });
        return;
      }

      // Calculate final amount (apply upgrade credit if any)
      const baseAmount = Math.max(plan.price - (upgradeCredit || 0), 0);
      const gst = Math.round(baseAmount * 0.18);
      const totalAmount = baseAmount + gst;

      // Razorpay expects amount in paise
      const amountPaise = totalAmount * 100;

      // Generate a receipt string <= 40 chars
      const shortOrgId = String(organizationId).replace(/-/g, "").slice(0, 12);
      const shortPlanId = String(planId).replace(/-/g, "").slice(0, 8);
      const timestamp = Date.now().toString().slice(-8);
      const receipt = `sub_${shortOrgId}_${shortPlanId}_${timestamp}`.slice(
        0,
        40
      );

      // Create Razorpay order
      const Razorpay = require("razorpay");
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      const order = await razorpay.orders.create({
        amount: amountPaise,
        currency: "INR",
        receipt,
        payment_capture: 1,
        notes: {
          organizationId,
          planId,
        },
      });

      res.json({
        order,
        key: process.env.RAZORPAY_KEY_ID,
      });
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      res.status(500).json({ message: "Failed to create Razorpay order" });
    }
  }
}
