import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Order } from "./order.entity";
import { Bill } from "./bill.entity";
import { Organization } from "./organization.entity";
import { getMetadataArgsStorage } from "typeorm";

@Entity("customers")
export class Customer {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({type : "varchar", length: 100, unique: true})
  @Index({ unique: true })
  cus_id: string; // Unique identifier for the customer

  @Column({ type: "varchar", length: 100, nullable: true }) // Changed to nullable: true temporarily
  name: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  email: string;

  @Column({ type: "varchar", length: 30, nullable: true })
  phone: string;

  @Column({ type: "varchar", length: 30, nullable: true })
  mobile: string;

  @Column({ type: "varchar", length: 30, nullable: true })
  alternatePhone: string;

  @Column({ type: "text", nullable: true })
  address: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  city: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  district: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  town: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  state: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  postalCode: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  country: string;

  @Column({ type: "varchar", length: 10, nullable: true })
  gender: string;

  @Column({ type: "text", nullable: true })
  notes: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  companyName: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  gstNumber: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  gstState: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  gstType: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  pan: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  image: string;

  @Column({ type: "varchar", length: 20, default: "NEW" })
  status: string;

  @Column({ type: "varchar", length: 50, nullable: true, default: "Customer" })
  accountType: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  salutation: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  firstName: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  lastName: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  displayName: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  workPhone: string;

  @Column({ type: "varchar", length: 50, nullable: true, default: "ENGLISH" })
  partyLanguage: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  accountsPayable: string;

  @Column({ type: "varchar", length: 50, nullable: true, default: "INR - INDIAN RUPEE" })
  currency: string;

  @Column({ type: "varchar", length: 50, nullable: true, default: "Due on Receipt" })
  paymentTerms: string;

  @Column({ type: "decimal", precision: 12, scale: 2, nullable: true, default: 0 })
  openingBalance: number;

  @Column({ type: "decimal", precision: 12, scale: 2, nullable: true, default: 0 })
  creditLimit: number;

  @Column({ type: "boolean", nullable: true, default: false })
  isMsmeRegistered: boolean;

  @Column({ type: "varchar", length: 100, nullable: true })
  msmeType: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  msmeRegNumber: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  tds: string;

  @Column({ type: "boolean", nullable: true, default: false })
  allowPortalAccess: boolean;

  @Column({ type: "jsonb", nullable: true })
  billingAddress: Record<string, any>;

  @Column({ type: "jsonb", nullable: true })
  shippingAddress: Record<string, any>;

  @Column({ type: "jsonb", nullable: true })
  brokerage: Record<string, any>;

  @Column({ type: "jsonb", nullable: true })
  contactPersons: Array<{
    name: string;
    designation: string;
    phone: string;
  }>;

  @Column({ type: "jsonb", nullable: true })
  bankDetails: Record<string, any>;

  @Column({ type: "text", nullable: true })
  remarks: string;

  @Column({ type: "uuid", nullable: true })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "organizationId" })
  organization: Organization;

  @OneToMany(() => Order, (order) => order.customer)
  orders: Order[];

  @OneToMany(() => Bill, (bill) => bill.customer)
  bills: Bill[];

  @Column({ type: "boolean", default: false })
  isTemporary: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


function Index(options: { unique: boolean }): PropertyDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    getMetadataArgsStorage().indices.push({
      target: target.constructor,
      columns: [propertyKey as string],
      unique: options.unique,
      name: undefined,
      synchronize: true,
    });
  };
}

