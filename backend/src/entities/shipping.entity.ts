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
  ShippingStatus,
  ShippingMethod,
  Shipping as IShipping,
} from "../interface/shipping";
import { Order } from "./order.entity";
import { User } from "./user.entity";
import { Organization } from "./organization.entity";

@Entity("shippings")
export class Shipping implements IShipping {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  @Index()
  orderId!: string;

  @Column({ type: "varchar", nullable: true })
  trackingNumber?: string;

  @Column({ type: "varchar", nullable: true })
  carrier?: string;

  @Column({
    type: "enum",
    enum: ShippingMethod,
    default: ShippingMethod.STANDARD,
    nullable: true,
  })
  shippingMethod?: ShippingMethod;

  @Column({
    type: "enum",
    enum: ShippingStatus,
    default: ShippingStatus.PROCESSING,
  })
  status!: ShippingStatus;

  @Column({ type: "timestamp", nullable: true })
  estimatedDeliveryDate?: Date;

  @Column({ type: "timestamp", nullable: true })
  actualDeliveryDate?: Date;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  cost?: number;

  @Column({ type: "text", nullable: true })
  notes?: string;

  @Column({ type: "uuid" })
  createdById!: string;

  @Column({ type: "uuid" })
  @Index()
  organizationId!: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;

  @ManyToOne(() => Order, (order) => order.shippings)
  @JoinColumn({ name: "orderId" })
  order?: Order;

  @ManyToOne(() => User)
  @JoinColumn({ name: "createdById" })
  createdBy?: User;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "organizationId" })
  organization?: Organization;
}
