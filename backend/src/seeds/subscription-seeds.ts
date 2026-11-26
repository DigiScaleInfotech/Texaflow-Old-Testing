import { getRepository } from "../config/database";
import { SubscriptionPlan } from "../entities/subscription-plan.entity";
import { BillingCycle } from "../interface/subscription";

export async function seedSubscriptionPlans() {
  try {
    const subscriptionPlanRepository = getRepository(SubscriptionPlan);

    // Check if plans already exist
    const existingPlans = await subscriptionPlanRepository.count();

    if (existingPlans > 0) {
      console.log("Subscription plans already exist, skipping seed");
      return;
    }

    console.log("Seeding subscription plans...");

    // Define the subscription plans
    const plans = [
      {
        planId: "plan-1",
        name: "Basic",
        price: 999,
        billingCycle: BillingCycle.MONTHLY,
        durationMonths: 1,
        features: [
          "1-month duration",
          "₹999 per month",
          "Ideal for new users",
          "Monthly renewal option",
        ],
        isActive: true,
      },
      {
        planId: "plan-2",
        name: "Starter",
        price: 2699,
        billingCycle: BillingCycle.THREE_MONTHS,
        durationMonths: 3,
        features: [
          "3-month duration",
          "₹899 per month (₹2,699 total)",
          "Great for short-term users",
          "10% savings vs monthly",
        ],
        isActive: true,
      },
      {
        planId: "plan-3",
        name: "Pro",
        price: 4799,
        billingCycle: BillingCycle.SIX_MONTHS,
        durationMonths: 6,
        features: [
          "6-month duration",
          "₹799 per month (₹4,799 total)",
          "Most popular choice",
          "20% savings vs monthly",
          "Best value for versatility",
        ],
        isActive: true,
      },
      {
        planId: "plan-4",
        name: "Premium",
        price: 9999,
        billingCycle: BillingCycle.YEARLY,
        durationMonths: 12,
        features: [
          "Full 1-year duration",
          "₹833 per month (₹9,999 total)",
          "Maximum value for serious users",
          "17% savings vs monthly",
          "Priority support",
        ],
        isActive: true,
      },
    ];

    // Create the plans in the database
    for (const plan of plans) {
      await subscriptionPlanRepository.save(
        subscriptionPlanRepository.create(plan)
      );
    }

    console.log("Successfully seeded subscription plans");
  } catch (error) {
    console.error("Error seeding subscription plans:", error);
  }
}
