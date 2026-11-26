import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Organization } from "./organization.entity";
import { Product } from "./product.entity";
import { User } from "./user.entity";

@Entity("stock_transactions")
export class StockTransaction {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ name: "product_id", type: "uuid" })
  productId!: string;

  @ManyToOne(() => Product, { onDelete: "CASCADE" })
  @JoinColumn({ name: "product_id" })
  product!: Product;

  @Index()
  @Column({ name: "organization_id", type: "uuid" })
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "organization_id" })
  organization!: Organization;

  @Column({ name: "previous_quantity", type: "int", default: 0 })
  previousQuantity!: number;

  @Column({ name: "new_quantity", type: "int", default: 0 })
  newQuantity!: number;

  @Column({ name: "change_amount", type: "int" })
  changeAmount!: number;

  @Column({
    name: "transaction_type",
    type: "varchar",
    length: 50,
  })
  transactionType!: string; // incoming, outgoing, adjustment

  @Column({
    name: "reference_type",
    type: "varchar",
    length: 50,
    nullable: true,
  })
  referenceType?: string; // order, purchase, manual, etc.

  @Column({ name: "reference_id", type: "uuid", nullable: true })
  referenceId?: string;

  @Column({ type: "text", nullable: true })
  notes?: string;

  @Column({ name: "created_by", type: "uuid" })
  createdBy!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "created_by" })
  createdByUser!: User;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
