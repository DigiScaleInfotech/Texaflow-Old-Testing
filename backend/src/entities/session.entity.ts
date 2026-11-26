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
import { User } from "./user.entity";

@Entity("sessions")
export class Session {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ type: "uuid" })
  userId: string;

  @Column({ type: "varchar" })
  sessionKey: string;

  @Column({ type: "timestamp" })
  expiresAt: Date;

  @Column({ type: "timestamp", nullable: true })
  lastActivityAt: Date;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @Column({ type: "varchar", nullable: true })
  ipAddress: string;

  @Column({ type: "jsonb", nullable: true })
  deviceInfo: {
    browser?: string;
    version?: string;
    os?: string;
    platform?: string;
    isMobile?: boolean;
    isTablet?: boolean;
    isDesktop?: boolean;
    ip?: string;
    userAgent?: string;
    [key: string]: any;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.sessions)
  @JoinColumn({ name: "userId" })
  user: User;
}
