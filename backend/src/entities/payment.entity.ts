import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

export enum PaymentType {
  PAYMENT_IN = "Payment In",   // Money received from Customer (Receipt)
  PAYMENT_OUT = "Payment Out", // Money paid to Vendor/Supplier (Payout)
}

@Entity("payments")
export class Payment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 50, unique: true })
  @Index({ unique: true })
  paymentNumber: string; // Sequential ID e.g. PAY-001, PAY-002

  @Column({
    type: "varchar",
    length: 30,
    default: PaymentType.PAYMENT_IN,
  })
  @Index()
  type: string; // "Payment In" or "Payment Out"

  @Column({ type: "varchar", length: 30, default: "Customer" })
  partyType: string; // "Customer" or "Vendor"

  @Column({ type: "uuid", nullable: true })
  @Index()
  partyId: string; // Customer ID or Vendor ID

  @Column({ type: "varchar", length: 150 })
  partyName: string;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  amount: number;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  paymentDate: Date;

  @Column({ type: "varchar", length: 50, default: "Cash" })
  paymentMode: string; // "Cash", "Bank Transfer", "UPI", "Cheque", "Card"

  @Column({ type: "varchar", length: 100, nullable: true })
  referenceNumber: string; // Cheque No, UTR No, UPI Ref

  @Column({ type: "uuid", nullable: true })
  @Index()
  billId: string; // Linked Bill / Invoice ID (optional)

  @Column({ type: "varchar", length: 100, nullable: true })
  billNumber: string; // e.g. INV-001

  @Column({ type: "text", nullable: true })
  notes: string;

  @Column({ type: "uuid" })
  @Index()
  organizationId: string;

  @Column({ type: "uuid", nullable: true })
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
