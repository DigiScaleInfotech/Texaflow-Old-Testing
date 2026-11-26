import { OrganizationStatus } from "./organization";
import { DocumentStatus, DocumentType } from "./document";

// Vendor rejection data
export interface VendorRejectionData {
  businessName?: string;
  gstNumber?: string;
  panNumber?: string;
  businessType?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  reason: string; // Rejection reason
}

// Vendor document data
export interface VendorDocumentData {
  id: string;
  name: string;
  originalName: string;
  url: string;
  documentType: DocumentType;
  status: DocumentStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

// Vendor data structure
export interface VendorData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  organization?: {
    id: string;
    name: string;
    businessType?: string;
    gstNumber?: string;
    panNumber?: string;
    status: OrganizationStatus;
  };
  documents?: VendorDocumentData[];
  status?: OrganizationStatus;
  createdAt?: Date;
  updatedAt?: Date;
}
