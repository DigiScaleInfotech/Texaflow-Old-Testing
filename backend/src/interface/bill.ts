export enum BillType {
  // Update enum values to match the database - using lowercase values
  SALES = "sales",
  PURCHASE = "purchase",
  EXPENSE = "expense",
}

export enum BillStatus {
  ACTIVE = "active",
  CANCELLED = "cancelled",
  DRAFT = "draft",
}

export enum PaymentStatus {
  PAID = "paid",
  PENDING = "pending",
  PARTIALLY_PAID = "partially_paid",
  OVERDUE = "overdue",
  REFUNDED = "refunded",
  CANCELLED = "cancelled",
  PARTIAL = "partial",
  UNPAID = "unpaid",
}

export interface Bill {
  id: string;
  billNumber: string;
  invoiceId?: string;
  challanNo?: string;
  documentType?: "invoice" | "challan";
  vehicleNo?: string;
  transportName?: string;
  convertedInvoiceId?: string;
  issueDate: Date;
  dueDate: Date;
  billType: BillType;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  billingAddress?: any;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amountPaid: number;
  amountRemaining: number;
  paymentStatus: string;
  status: BillStatus;
  notes?: string;
  organizationId: string;
  createdById?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillItem {
  id: string;
  billId: string;
  productId?: string;
  description: string;
  category?: string;
  hsnCode?: string;
  carton?: number;
  weight?: number;
  kg?: number;
  quantity: number;
  unitPrice: number;
  total: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
