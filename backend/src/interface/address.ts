export interface Address {
  id: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  addressType: AddressType;
  organizationId?: string;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum AddressType {
  BILLING = "billing",
  SHIPPING = "shipping",
  BOTH = "both",
}
