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
import { OrderItem as IOrderItem } from "../interface/order";
import { Order } from "./order.entity";
import { Product } from "./product.entity";

@Entity("order_items")
export class OrderItem implements IOrderItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" }) // <-- Change from "varchar" to "uuid"
  orderId!: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: "CASCADE" })
  @JoinColumn({ name: "orderId", referencedColumnName: "id" }) // Explicitly reference "id"
  order!: Order;

  @Index()
  @Column({ type: "uuid" })
  productId!: string;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: "productId" })
  product!: Product;

  @Column({ type: "varchar", length: 255, nullable: true })
  productName!: string;

  @Column({ type: "int" })
  quantity!: number;

  @Column({ type: "int", nullable: true }) // Changed from "number" to "int"
  carton!: number;

  @Column({ type: "int", nullable: true })
  weight!: number;

  @Column({
    name: "unitPrice",
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0,
  })
  unitPrice!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  total!: number;

  @Column({ type: "text", nullable: true })
  notes?: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;

  // Add a getter for price to ensure compatibility with frontend code
  get price(): number {
    return this.unitPrice;
  }
}
