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
import { BillItem as IBillItem } from "../interface/bill";
import { Bill } from "./bill.entity";
import { Product } from "./product.entity";

@Entity("bill_items")
export class BillItem implements IBillItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "varchar" })
  billId!: string;

  @ManyToOne(() => Bill, (bill) => bill.items, { onDelete: "CASCADE" })
  @JoinColumn({ name: "billId" })
  bill!: Bill;

  @Index()
  @Column({ type: "uuid", nullable: true }) // Make nullable to allow custom items
  productId?: string;

  @ManyToOne(() => Product, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "productId" })
  product?: Product;

  @Column({ type: "varchar", length: 255, nullable: true })
  description!: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  category?: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  hsnCode?: string;

  @Column({ type: "int", nullable: true }) // Changed from "number" to "int"
  carton!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  weight!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  kg?: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  quantity!: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  unitPrice!: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  total!: number;

  @Column({ type: "text", nullable: true })
  notes?: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;
}
