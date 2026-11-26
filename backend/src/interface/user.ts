import { OrganizationRole } from "./organization";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username?: string; // Add username field
  phone: string;
  password: string;
  role: UserRole;
  organizationRole?: OrganizationRole; // Added organization-specific role
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  organization?: any; // To avoid circular dependency in interface
  sessionKey?: string;
  sessionExpiresAt?: Date;
}

export enum UserRole {
  ADMIN = "admin",
  USER = "user",
  VENDOR = "vendor",
  CUSTOMER = "customer",
  SUPER_ADMIN = "super_admin",
}
