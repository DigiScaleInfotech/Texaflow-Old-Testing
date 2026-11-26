import { OrganizationStatus } from "./organization";
import { User } from "./user";

export interface VendorApplication {
  id: string;
  organizationId: string;
  organizationName: string;
  businessType: string;
  contactPerson: string;
  email: string;
  phone: string;
  gstNumber: string;
  panNumber: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  website?: string;
  yearEstablished?: number;
  applicationDate: Date;
  applicationNotes?: string;
  status: OrganizationStatus;
  reviewedBy?: User;
  reviewedAt?: Date;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedVendorApplications {
  applications: VendorApplication[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
