import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from "typeorm";
import { Organization } from "./organization.entity";
import { SalaryPayment } from "./salary-payment.entity";
import { Attendance } from "./attendance.entity";

export enum Gender {
  MALE = "male",
  FEMALE = "female",
}

export enum EmployeeRole {
  MANAGER = "Manager",
  SUPERVISOR = "Supervisor",
  WORKER = "Worker",
  ACCOUNTANT = "Accountant",
  HR_SPECIALIST = "HR Specialist",
  QUALITY_CONTROL = "Quality Control",
  SALESPERSON = "Salesperson",
  DRIVER = "Driver",
  CLEANER = "Cleaner",
  SECURITY = "Security",
  OTHER = "Other",
}

@Entity("employees")
export class Employee {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  name!: string;

  @Column({ type: "varchar", nullable: true })
  employeeId?: string;

  @Column({ type: "varchar", nullable: true })
  mobile?: string;

  @Column({ type: "varchar", nullable: true })
  email?: string;

  @Column({
    type: "varchar",
    nullable: false,
    default: EmployeeRole.WORKER,
    // We keep it as varchar to allow custom roles while suggesting standard ones
  })
  role!: string;

  @Column({ type: "varchar", nullable: true })
  image?: string;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  salary!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  paidSalary!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  totalSalary!: number;

  @Column({
    type: "enum",
    enum: Gender,
    default: Gender.MALE,
  })
  gender!: Gender;

  @Column({ type: "date", nullable: true })
  joiningDate?: Date;

  @Column({ type: "varchar", nullable: true })
  department?: string;

  @Column({ type: "text", nullable: true })
  address?: string;

  @Column({ type: "varchar", nullable: true })
  state?: string;

  @Column({ type: "varchar", nullable: true })
  district?: string;

  @Column({ type: "decimal", precision: 5, scale: 2, nullable: true })
  performanceRating?: number;

  @Column({ type: "varchar", nullable: true })
  emergencyContact?: string;

  @Column({ type: "date", nullable: true })
  birthDate?: Date;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  advanceBalance!: number;

  @Column({ type: "varchar", nullable: true })
  education?: string;

  @Column("text", { array: true, nullable: true })
  skills?: string[];

  @Column({ type: "text", nullable: true })
  notes?: string;

  @Index()
  @Column({ type: "uuid" })
  organizationId!: string;

  @ManyToOne(() => Organization, { onDelete: "CASCADE" })
  @JoinColumn({ name: "organizationId" })
  organization!: Organization;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;

  // Relationships
  @OneToMany(() => SalaryPayment, (payment) => payment.employee)
  salaryPayments?: SalaryPayment[];

  @OneToMany(() => Attendance, (attendance) => attendance.employee)
  attendanceRecords?: Attendance[];
}
