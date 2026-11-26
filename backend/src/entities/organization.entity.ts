import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
  Index,
} from "typeorm";
import {
  Organization as IOrganization,
  OrganizationStatus,
} from "../interface/organization";
import { Address } from "./address.entity";
import { User } from "./user.entity";
import { OrganizationSubscription } from "./organization-subscription.entity";
import { OrganizationSubscription as IOrganizationSubscription } from "../interface/subscription";
import { Category } from "./category.entity";
import { Document } from "./document.entity";

@Entity("organizations")
@Index(["name", "businessName"]) // Composite index for common search fields
export class Organization implements IOrganization {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index() // Single-column index for frequent lookups
  @Column({ type: "varchar" })
  name!: string;

  @Index() // Index for business name searches
  @Column({ type: "varchar", nullable: true })
  businessName?: string;

  @Column({ type: "varchar", nullable: true })
  personalContactName?: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Index() // Index for email searches
  @Column({ type: "varchar", nullable: true })
  email?: string;

  @Index() // Index for phone searches
  @Column({ type: "varchar", nullable: true })
  phone?: string;

  @Index() // Index for business contact searches
  @Column({ type: "varchar", nullable: true })
  businessContactNumber?: string;

  @Index() // Username will be used for login/lookup
  @Column({ type: "varchar", nullable: true }) // Making it nullable
  username?: string;

  @Column({ type: "varchar", nullable: true })
  password!: string; // Added the password property

  @Column({ type: "varchar", nullable: true })
  logo?: string;

  @Column({
    type: "enum",
    enum: OrganizationStatus,
    default: OrganizationStatus.PENDING,
  })
  status: OrganizationStatus = OrganizationStatus.PENDING;

  @Column({ type: "boolean", default: true })
  isActive: boolean = true;

  @Column({ type: "varchar", nullable: true })
  website?: string;

  @Column({ type: "varchar", nullable: true })
  gstNumber?: string;

  @Column({ type: "varchar", nullable: true })
  panNumber?: string;

  @Column({ type: "varchar", nullable: true })
  businessType?: string;

  @Column({ type: "int", nullable: true })
  yearEstablished?: number;

  @Column({ type: "date", nullable: true })
  applicationDate?: Date;

  @Column({ type: "text", nullable: true })
  adminNotes?: string;

  @Column({ type: "uuid", nullable: true })
  currentSubscriptionId?: string;

  @Column({ type: "timestamp", nullable: true })
  subscriptionStartDate?: Date;

  @Column({ type: "timestamp", nullable: true })
  subscriptionEndDate?: Date;

  @Column({ type: "boolean", default: false })
  hasActiveSubscription?: boolean;

  @Column({ type: "int", default: 25 }) // Default pay day is 25th of month
  salaryPayDay!: number;

  @Column({ type: "boolean", default: true }) // Auto Pay enabled by default
  salaryAutoPayEnabled!: boolean;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;

  @OneToMany(() => Address, (address) => address.organization)
  addresses?: Address[];

  @OneToOne(() => User, (user) => user.organization)
  @JoinColumn()
  user?: User;

  @OneToMany(
    () => OrganizationSubscription,
    (subscription) => subscription.organization
  )
  subscriptions?: IOrganizationSubscription[];

  @OneToMany(() => Category, (category) => category.organization)
  categories: Category[];

  @OneToMany(() => Document, (document) => document.organization)
  documents?: Document[];
}
