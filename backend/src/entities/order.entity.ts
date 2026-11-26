import {
  Entity,
  PrimaryGeneratedColumn,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import {
  Order as IOrder,
  OrderStatus,
  PaymentStatus,
} from "../interface/order";
import { Customer } from "./customer.entity";
import { OrderItem } from "./order-item.entity";
import { Organization } from "./organization.entity";
import { User } from "./user.entity";
import { Bill } from "./bill.entity";
import { Shipping } from "./shipping.entity";

@Entity("orders")
@Index(["status", "customerId"])
export class Order implements IOrder {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100, unique: true })
  or_id!: string; // Secondary unique identifier

  @Index() // Index for customer filtering
  @Column({ name: "customerId", nullable: false })
  customerId!: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: "customerId" })
  customer!: Customer;

  @Column({ type: "varchar", length: 255, nullable: true }) // Make nullable
  customerName!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  customerEmail!: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  customerPhone!: string;

  @Index() // Index for date filtering
  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  orderDate!: Date;

  @Column({ type: "timestamp", nullable: true })
  deliveryDate?: Date;

  @Column({ nullable: true })
  shippingAddress?: string;

  @Column({ nullable: true })
  shippingCity?: string;

  @Column({ nullable: true })
  shippingDistrict?: string;

  @Column({ nullable: true })
  shippingTown?: string;

  @Column({ nullable: true })
  shippingState?: string;

  @Column({ nullable: true })
  shippingZip?: string;

  @Column({ nullable: true, default: "India" })
  shippingCountry?: string;

  @Column({ nullable: true })
  paymentMethod?: string;

  @Column({ default: "Standard Shipping" })
  shippingMethod?: string;

  @Column({ nullable: true })
  notes?: string;

  @Index() // Index for status filtering
  @Column({
    type: "enum",
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status!: OrderStatus;

  @Index() // Index for payment status filtering
  @Column({
    type: "enum",
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus!: PaymentStatus;

  @Column({ type: "numeric", default: 0 })
  subtotal!: number;

  @Column({ type: "numeric", default: 0 })
  tax!: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0,
    nullable: true,
  }) // Make nullable
  discount!: number;

  @Column({ type: "numeric", default: 0 })
  total!: number;

  @Index() // Index for organization filtering
  @Column({ type: "uuid" })
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "organizationId" })
  organization?: Organization;

  @Column({ type: "uuid", nullable: true })
  createdById?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "createdById" })
  createdBy?: User;

  @Column({ type: "uuid", nullable: true })
  billId?: string;

  // Modify this relationship to not create a foreign key constraint
  @ManyToOne(() => Bill, { nullable: true })
  @JoinColumn({
    name: "billId",
    foreignKeyConstraintName: "FK_order_bill_no_constraint",
  })
  bill?: Bill;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, {
    cascade: true,
    eager: true,
  })
  items!: OrderItem[];

  @OneToMany(() => Shipping, (shipping) => shipping.order)
  shippings?: Shipping[];

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;
}
