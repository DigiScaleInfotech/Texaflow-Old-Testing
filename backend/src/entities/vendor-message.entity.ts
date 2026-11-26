import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Organization } from "./organization.entity";

@Entity("vendor_messages")
export class VendorMessage {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  vendorId: string;

  @Column({ type: "uuid", nullable: true })
  organizationId?: string;

  @Column()
  subject: string;

  @Column({ type: "text" })
  message: string;

  @Column()
  reason: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ default: false })
  isPriority: boolean;

  @Column({ nullable: true })
  adminResponse?: string;

  @Column({ nullable: true, type: "timestamp" })
  adminResponseDate?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: "vendorId" })
  vendor: User;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "organizationId" })
  organization: Organization;
}
