import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Employee } from "./employee.entity";
import { Organization } from "./organization.entity";

@Entity("salary_payments")
export class SalaryPayment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  employeeId!: string;

  @ManyToOne(() => Employee, (employee) => employee.salaryPayments, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "employeeId" })
  employee!: Employee;

  @Column({ type: "date" })
  date!: Date;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  bonus!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  deduction!: number;

  @Column({ type: "text", nullable: true })
  message?: string;

  @Index()
  @Column({ type: "uuid" })
  organizationId!: string;

  @ManyToOne(() => Organization, { onDelete: "CASCADE" })
  @JoinColumn({ name: "organizationId" })
  organization!: Organization;

  @Column({ type: "uuid", nullable: true })
  createdById?: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;
}
