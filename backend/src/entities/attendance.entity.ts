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

export enum AttendanceStatus {
  PRESENT = "present",
  ABSENT = "absent",
  LATE = "late",
  LEAVE = "leave",
}

@Entity("attendance")
export class Attendance {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  employeeId!: string;

  @ManyToOne(() => Employee, (employee) => employee.attendanceRecords, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "employeeId" })
  employee!: Employee;

  @Column({ type: "date" })
  date!: Date;

  @Column({
    type: "enum",
    enum: AttendanceStatus,
    default: AttendanceStatus.PRESENT,
  })
  status!: AttendanceStatus;

  @Column({ type: "text", nullable: true })
  notes?: string;

  @Index()
  @Column({ type: "uuid" })
  organizationId!: string;

  @ManyToOne(() => Organization, { onDelete: "CASCADE" })
  @JoinColumn({ name: "organizationId" })
  organization!: Organization;

  @Column({ type: "uuid", nullable: true })
  markedById?: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;
}
