export enum NotificationType {
  INFO = "info",
  SUCCESS = "success",
  WARNING = "warning",
  ERROR = "error",
}

export enum NotificationCategory {
  SYSTEM = "system",
  ORDER = "order",
  PAYMENT = "payment",
  INVENTORY = "inventory",
  VENDOR_MANAGEMENT = "vendor_management",
  CUSTOMER = "customer",
  ORGANIZATION = "organization",
  SECURITY = "security",
  SUBSCRIPTION = "subscription", // Add subscription category
  OTHER = "other",
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  link?: string;
  isRead: boolean;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
  readAt?: Date;
  expiresAt?: Date;
}
