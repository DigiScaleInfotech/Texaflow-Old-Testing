export interface Customer {
  id: string;
  organizationId?: string;
  name: string;
  email?: string;
  phone: string;
  alternatePhone?: string;
  gender?: "male" | "female" | "other";
  address?: string;
  city?: string; // Optional
  district?: string; // Optional
  town?: string; // Added new field
  state?: string;
  postalCode?: string;
  country?: string;
  gstNumber?: string;
  pan?: string;
  notes?: string;
  totalOrders?: number;
  totalSpent?: number;
  status: CustomerStatus;
  creditLimit?: number;
  paymentTerms?: string;
  preferences?: string;
  image?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum CustomerStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  NEW = "new",
  BLOCKED = "blocked",
}
