import { Address } from "../entities/address.entity";
import { User } from "../entities/user.entity";
import { OrganizationSubscription } from "./subscription";

export interface Organization {
  id: string;
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  logo?: string;
  website?: string;
  gstNumber?: string;
  panNumber?: string;
  businessType?: string;
  yearEstablished?: number;
  applicationDate?: Date;
  adminNotes?: string;
  status: OrganizationStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  addresses?: Address[];
  businessName?: string;
  personalContactName?: string;
  businessContactNumber?: string;
  username?: string; // Changed to optional
  password: string;
  user?: User; // Changed from users? array to a single user
  currentSubscriptionId?: string;
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  hasActiveSubscription?: boolean;
  subscriptions?: OrganizationSubscription[];
}

// You can also define related interfaces
export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  joinedAt: Date;
}

export enum OrganizationRole {
  OWNER = "owner",
  ADMIN = "admin",
  VENDOR = "vendor",
  STAFF = "staff",
}

export enum OrganizationStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  BLOCKED = "blocked",
}
