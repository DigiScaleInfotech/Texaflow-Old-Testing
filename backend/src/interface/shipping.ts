export enum ShippingStatus {
  PROCESSING = "processing",
  SHIPPED = "shipped",
  IN_TRANSIT = "in_transit",
  DELIVERED = "delivered",
  RETURNED = "returned",
  FAILED = "failed",
}

export enum ShippingMethod {
  STANDARD = "standard",
  EXPRESS = "express",
  OVERNIGHT = "overnight",
  INTERNATIONAL = "international",
  LOCAL = "local",
}

export interface Shipping {
  id: string;
  orderId: string;
  trackingNumber?: string;
  carrier?: string;
  shippingMethod?: ShippingMethod;
  status: ShippingStatus;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  cost?: number;
  notes?: string;
  createdById: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}
