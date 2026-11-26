export enum DocumentType {
  GST = "gst",
  PAN = "pan",
  BUSINESS_REGISTRATION = "business_registration",
  ID_PROOF = "id_proof",
  ADDRESS_PROOF = "address_proof",
  CERTIFICATE = "certificate",
  OTHER = "other",
}

export enum DocumentStatus {
  PENDING = "pending",
  VERIFIED = "verified",
  REJECTED = "rejected",
}

export interface Document {
  id: string;
  name: string;
  originalName: string;
  path: string;
  url: string;
  mimeType: string;
  size: number;
  documentType: DocumentType;
  status: DocumentStatus;
  remarks?: string;
  organizationId: string;
  userId?: string;
  isActive: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
