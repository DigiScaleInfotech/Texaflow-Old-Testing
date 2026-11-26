import { Customer } from "../entities/customer.entity";
import { Organization } from "../entities/organization.entity";
import { User } from "../entities/user.entity";
import { Bill } from "../entities/bill.entity";
import { Shipping } from "../entities/shipping.entity";

// Enum values should match exactly what's in the database
export enum OrderStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
  RETURNED = "returned",
  COMPLETED = "completed",
}

export enum PaymentStatus {
  PENDING = "pending",
  PAID = "paid",
  FAILED = "failed",
  REFUNDED = "refunded",
  PARTIALLY_PAID = "partially_paid",
  CANCELLED = "cancelled",
  UNPAID = "unpaid",
}

export interface Order {
  id: string;
  customerId: string;
  customer?: Customer;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  orderDate: Date;
  deliveryDate?: Date;
  shippingAddress?: string;
  shippingCity?: string;
  shippingDistrict?: string;
  shippingTown?: string;
  shippingState?: string;
  shippingZip?: string;
  shippingCountry?: string;
  paymentMethod?: string;
  shippingMethod?: string;
  notes?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  organizationId: string;
  organization?: Organization;
  createdById?: string;
  createdBy?: User;
  billId?: string;
  bill?: Bill;
  items?: OrderItem[];
  shippings?: Shipping[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName?: string;
  productImageUrl?: string;
  quantity: number;
  carton?: number; // Add carton field definition
  unitPrice: number;
  total: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderCreateDTO {
  customerId: string;
  orderDate: string;
  deliveryDate?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingDistrict?: string;
  shippingTown?: string;
  shippingState?: string;
  shippingZip?: string;
  shippingCountry?: string;
  paymentMethod?: string;
  shippingMethod?: string;
  notes?: string;
  items: OrderItemCreateDTO[];
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  subtotal?: number;
  tax?: number;
  total?: number;
}

export interface OrderItemCreateDTO {
  productId: string;
  quantity: number;
  price: number;
  name?: string;
  description?: string;
}

export interface OrderUpdateDTO extends Partial<OrderCreateDTO> {}
