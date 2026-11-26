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
import {
  Notification as INotification,
  NotificationType,
  NotificationCategory,
} from "../interface/notification";
import { User } from "./user.entity";

@Entity("notifications")
@Index(["userId", "isRead"]) // Common filter combination
export class Notification implements INotification {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  userId!: string;

  @Column({ type: "varchar" })
  title!: string;

  @Column({ type: "text" })
  message!: string;

  @Index()
  @Column({
    type: "enum",
    enum: NotificationType,
    default: NotificationType.INFO,
  })
  type!: NotificationType;

  @Index()
  @Column({
    type: "enum",
    enum: NotificationCategory,
    default: NotificationCategory.SYSTEM,
  })
  category!: NotificationCategory;

  @Column({ type: "varchar", nullable: true })
  link?: string;

  @Index()
  @Column({ type: "boolean", default: false })
  isRead!: boolean;

  @Column({ type: "jsonb", nullable: true })
  metadata?: any;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;

  @Column({ type: "timestamp", nullable: true })
  readAt?: Date;

  @Column({ type: "timestamp", nullable: true })
  expiresAt?: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user?: User;
}
