import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  Index,
  Unique,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { User as IUser, UserRole } from "../interface/user";
import { Organization } from "./organization.entity";
import { OrganizationRole } from "../interface/organization";
import { Session } from "./session.entity";
import { Document } from "./document.entity";

@Entity("users")
@Unique(["email"]) // Ensure email is unique
@Unique(["phone"]) // Ensure phone is unique
@Unique(["username"]) // Ensure username is unique
@Index(["firstName", "lastName"]) // Composite index for name searches
export class User implements IUser {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index() // Index for first name searches
  @Column({ type: "varchar" })
  firstName!: string;

  @Index() // Index for last name searches
  @Column({ type: "varchar" })
  lastName!: string;

  @Index() // Index for email searches/lookups
  @Column({ type: "varchar", unique: true })
  email!: string;

  @Index() // Index for phone searches/lookups
  @Column({ type: "varchar" })
  phone!: string;

  @Index() // Index for username searches/lookups
  @Column({ type: "varchar", unique: true, nullable: true })
  username?: string;

  @Column({ type: "varchar" })
  password!: string;

  @Index() // Index for role-based queries
  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.VENDOR,
  })
  role!: UserRole;

  @Index() // Index for organization role filtering
  @Column({
    type: "enum",
    enum: OrganizationRole,
    nullable: true,
  })
  organizationRole?: OrganizationRole;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  // Add session management fields
  @Column({ type: "varchar", nullable: true })
  sessionKey?: string;

  @Column({ type: "timestamp", nullable: true })
  sessionExpiresAt?: Date;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;

  @Column({ type: "timestamp", nullable: true })
  lastLoginAt?: Date;

  @OneToOne(() => Organization, (organization) => organization.user)
  organization?: Organization;

  @OneToMany(() => Session, (session) => session.user) // Define relationship with Session
  sessions?: Session[];

  @OneToMany(() => Document, (document) => document.user)
  documents?: Document[];

  @Column({ type: "jsonb", nullable: true })
  metadata?: any; // Optional field for additional user data

  @Column({ type: "varchar", nullable: true })
  image?: string;

  // Add a column to store email verification or OTP token
  @Column({ type: "varchar", nullable: true })
  verificationToken?: string;

  // Optionally, store token expiry (recommended for security)
  @Column({ type: "timestamp", nullable: true })
  verificationTokenExpiresAt?: Date;

  @Column({ nullable: true })
  passwordResetToken?: string;

  @Column({ type: "timestamp", nullable: true })
  passwordResetExpires?: Date;
}
