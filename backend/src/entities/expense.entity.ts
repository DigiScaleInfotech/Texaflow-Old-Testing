import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity("expenses")
export class Expense {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 50, unique: true })
  @Index({ unique: true })
  expenseNumber: string; // e.g. EXP-001, EXP-002

  @Column({ type: "varchar", length: 200 })
  title: string; // e.g. "Tempo / Freight to Ring Road", "Office Tea & Snacks"

  @Column({ type: "varchar", length: 100, default: "Misc" })
  @Index()
  category: string; // "Freight / Transport", "Electricity", "Rent", "Labor / Hamali", "Packing Material", "Office & Refreshment", "Maintenance", "Misc"

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  amount: number;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  expenseDate: Date;

  @Column({ type: "varchar", length: 50, default: "Cash" })
  paymentMode: string; // "Cash", "Bank Transfer", "UPI", "Cheque"

  @Column({ type: "varchar", length: 150, nullable: true })
  paidTo: string; // Payee Name or Shop Name

  @Column({ type: "varchar", length: 100, nullable: true })
  referenceNumber: string;

  @Column({ type: "text", nullable: true })
  notes: string;

  @Column({ type: "varchar", length: 50, default: "Paid" })
  paymentStatus: string; // "Paid", "Pending"

  @Column({ type: "varchar", length: 500, nullable: true })
  receiptUrl: string;

  @Column({ type: "uuid", nullable: true })
  @Index()
  employeeId?: string;

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
