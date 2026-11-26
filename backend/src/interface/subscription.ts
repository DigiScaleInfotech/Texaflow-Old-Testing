import { Organization } from "./organization";

export enum BillingCycle {
  MONTHLY = "monthly",
  THREE_MONTHS = "3 months",
  SIX_MONTHS = "6 months",
  YEARLY = "1 year",
}

export enum SubscriptionStatus {
  ACTIVE = "active",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
  PENDING = "pending",
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: string;
  features: string[];
  isActive: boolean;
  planId?: string;
  durationMonths: number;
}

export interface OrganizationSubscription {
  id: string;
  organizationId: string;
  planId: string;
  plan: SubscriptionPlan;
  startDate: Date;
  endDate: Date;
  status: SubscriptionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type SubscriptionRequest = {
  planId: string;
  paymentId?: string;
  autoRenew?: boolean;
};

export type SubscriptionResponse = {
  subscription: OrganizationSubscription;
  plan: SubscriptionPlan;
  organization: {
    id: string;
    name: string;
  };
};

export type SubscriptionPlanWithStats = SubscriptionPlan & {
  activeSubscriptions: number;
  revenue: number;
};
