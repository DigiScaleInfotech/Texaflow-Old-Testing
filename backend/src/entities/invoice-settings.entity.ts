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
import { Organization } from "./organization.entity";

@Entity("invoice_settings")
export class InvoiceSettings {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  organizationId!: string;

  @ManyToOne(() => Organization, { onDelete: "CASCADE" })
  @JoinColumn({ name: "organizationId" })
  organization!: Organization;

  @Column({ type: "varchar", nullable: true })
  invoicePrefix!: string;

  @Column({ type: "varchar", nullable: true })
  footerText?: string;

  @Column({ type: "jsonb", nullable: true })
  termsAndConditions?: string[];

  @Column({ type: "varchar", nullable: true })
  organizationName?: string;

  @Column({ type: "jsonb", nullable: true })
  organizationAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };

  @Column({ type: "varchar", nullable: true })
  logo?: string;

  @Column({ type: "varchar", nullable: true })
  signature?: string;

  @Column({ type: "boolean", default: true })
  showLogo!: boolean;

  @Column({ type: "boolean", default: true })
  showSignature!: boolean;

  @Column({ type: "boolean", default: true })
  showBankDetails!: boolean;

  @Column({ type: "varchar", nullable: true })
  colorTheme?: string;

  @Column({ type: "varchar", nullable: true })
  invoiceNotes?: string;

  // Add GST and tax-related fields
  @Column({ type: "varchar", nullable: true })
  gstNumber?: string;

  @Column({ type: "varchar", nullable: true })
  panNumber?: string;

  @Column({ type: "varchar", nullable: true })
  taxIdentificationNumber?: string;

  @Column({ type: "decimal", nullable: true, default: 18.0 })
  taxRate?: number;

  @Column({ type: "int", default: 1001 })
  nextInvoiceNumber!: number;

  @Column({ type: "timestamp", nullable: true })
  lastInvoiceDate?: Date;

  @Column({ type: "jsonb", nullable: true })
  additionalFields?: Record<string, any>;

  @Column({ type: "jsonb", nullable: true })
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    branchName?: string;
  };

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;
}
