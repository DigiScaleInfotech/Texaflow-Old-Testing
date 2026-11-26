import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  BeforeInsert,
} from "typeorm";
import { Customer } from "./customer.entity";
import { Organization } from "./organization.entity";
import { User } from "./user.entity";
import { BillItem } from "./bill-item.entity"; // Import BillItem entity
import { Bill as IBill } from "../interface/bill"; // Import the interface
import { BillStatus, PaymentStatus } from "../interface/bill"; // Import BillStatus and PaymentStatus

export enum BillType {
  SALES = "sales",
  PURCHASE = "purchase",
}

@Entity("bills")
export class Bill implements IBill {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ nullable: true }) // Make nullable initially
  billNumber!: string;

  @Column({ nullable: false })
  @Index()
  invoiceId!: string;

  @Column({ nullable: true })
  challanNo?: string;

  @Column({ type: "varchar", length: 30, default: "invoice" })
  documentType!: "invoice" | "challan";

  @Column({ nullable: true })
  vehicleNo?: string;

  @Column({ nullable: true })
  transportName?: string;

  @Column({ nullable: true })
  convertedInvoiceId?: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  issueDate!: Date;

  @Column({ type: "timestamp", nullable: true })
  dueDate!: Date;

  @Column({ type: "enum", enum: BillType, default: BillType.SALES })
  @Index()
  billType!: BillType;

  @Column({ nullable: true }) // Make nullable initially for migration
  @Index()
  customerId!: string;

  @ManyToOne(() => Customer, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "customerId" })
  customer!: Customer;

  @Column({ nullable: true })
  customerName!: string;

  @Column({ nullable: true })
  customerEmail!: string;

  @Column({ nullable: true })
  customerPhone!: string;

  @Column({ nullable: true })
  companyName!: string;

  @Column({ nullable: true })
  vendorGstNumber!: string;

  @Column({ nullable: true })
  vendorPanNumber!: string;

  @Column({ nullable: true })
  vendorWebsite!: string;

  @Column({ type: "jsonb", nullable: true })
  billingAddress!: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };

  @Column({ type: "numeric", default: 0 })
  subtotal!: number;

  @Column({ type: "numeric", default: 0 })
  tax!: number;

  @Column({ type: "numeric", default: 0 })
  discount!: number;

  @Column({ type: "numeric", default: 0 })
  total!: number;

  @Column({ type: "numeric", default: 0 })
  amountPaid!: number;

  @Column({ type: "numeric", default: 0 })
  amountRemaining!: number;

  @Column({
    type: "enum",
    enum: PaymentStatus,
    default: PaymentStatus.UNPAID, // Change from "pending" to "UNPAID"
  })
  @Index()
  paymentStatus!: PaymentStatus;

  @Column({
    type: "enum",
    enum: BillStatus,
    default: BillStatus.ACTIVE,
  })
  status!: BillStatus;

  @Column({ nullable: true })
  paymentMethod!: string;

  @Column({ nullable: true })
  notes!: string;

  @OneToMany(() => BillItem, (billItem) => billItem.bill, {
    cascade: true,
    eager: true,
  })
  items!: BillItem[];

  @Column({ type: "uuid" })
  @Index()
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "organizationId" })
  organization!: Organization;

  @Column({ type: "uuid", nullable: true })
  createdById!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "createdById" })
  createdBy!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Generate bill number before insertion
  @BeforeInsert()
  async generateBillNumber() {
    // This will be implemented in the service layer
    // Just a placeholder for the entity definition
  }

  // Add this property to the Bill entity class
  @Column({ type: "jsonb", nullable: true, default: [] })
  payments!: {
    id: string;
    date: Date;
    amount: number;
    method: string;
    reference: string;
    recordedById: string;
  }[];
}
