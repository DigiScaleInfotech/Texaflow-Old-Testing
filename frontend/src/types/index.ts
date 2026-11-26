export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee' | 'vendor';
  image?: string;
}

export interface Customer {
  id: string;
  cus_id?: string;
  name: string;
  mobile: string;
  joiningDate: Date;
  state: string;
  image?: string; // Make this optional as we're now using gender-based images
  gender: 'male' | 'female'; // Add the gender property
  email?: string;
  address?: string;
  totalOrders?: number;
  totalSpent?: number;
  // Party registration fields
  accountType?: string;
  primaryContact?: string;
  salutation?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  gstNumber?: string;
  pan?: string;
  paymentTerms?: string;
  openingBalance?: number;
  creditLimit?: number;
  usedCredit?: number;
  totalOutstanding?: number;
  availableCredit?: number;
  isMsmeRegistered?: boolean;
  msmeType?: string;
  msmeRegNumber?: string;
  contactPersons?: Array<{ name: string; designation?: string; phone?: string }>;
}

export interface Order {
  id: string;
  customerId: string;
  customerName?: string; // Added
  customerImage?: string; // Added
  orderDate: Date;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'processing' | 'delivered';
  items?: OrderItem[]; // Added
  shippingAddress?: string; // Added
  paymentMethod?: string; // Added
  deliveryDate?: Date; // Added
}

// Add new interface for order items
export interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Bill {
  id: string;
  billDate: Date;
  partyName: string;
  amount: number;
  gst: number;
  totalPrice: number;
  status: 'paid' | 'pending';
}

export interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  supplier: string;
  lowStockAlert: number;
  description?: string;
  sku?: string;
  reorderPoint?: number;
  lastRestocked?: Date;
  location?: string;
  transactions?: ProductTransaction[];
}

export interface ProductTransaction {
  id: number;
  type: 'Incoming' | 'Outgoing';
  quantity: number;
  date: string;
  reference: string;
}

export interface Employee {
  id: string;
  name: string;
  mobile: string;
  role: string;
  salary: number;
  paidSalary: number;
  totalSalary: number;
  email?: string;
  joiningDate?: Date;
  department?: string;
  address?: string;
  attendance?: number;
  performanceRating?: number;
  salaryHistory?: SalaryRecord[];
  gender?: 'male' | 'female';
  employeeId?: string;
  emergencyContact?: string;
  birthDate?: string;
  education?: string;
  skills?: string[];
  attendanceHistory?: Array<{
    date: string;
    status: 'present' | 'absent' | 'late' | 'leave';
  }>;
  performanceHistory?: Array<{
    period: string;
    rating: number;
    feedback: string;
  }>;
}

export interface SalaryRecord {
  month: string;
  amount: number;
  status: 'paid' | 'pending';
  date: string;
}

export interface Vendor {
  id: string;
  name: string;
  company: string;
  email: string;
  mobile: string;
  status: 'pending' | 'approved' | 'rejected';
}
