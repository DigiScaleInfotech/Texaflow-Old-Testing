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
import { Category } from "./category.entity";

@Entity("products")
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  name!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "varchar", nullable: true })
  sku?: string;

  @Column({ type: "varchar", nullable: true })
  barcode?: string;

  @Column({ nullable: true })
  categoryId: string;

  @ManyToOne(() => Category, (category) => category.products, {
    nullable: true,
  })
  @JoinColumn({ name: "categoryId" })
  category: Category;

  @Column({ type: "varchar", length: 255, nullable: true })
  categoryName: string;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  price!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  costPrice!: number;

  @Column({ type: "int", default: 0 })
  quantity!: number;

  @Column({ type: "int", nullable: true })
  lowStockAlert?: number;

  @Column({ type: "int", nullable: true })
  reorderPoint?: number;

  @Column({ type: "varchar", nullable: true })
  unitOfMeasure?: string;

  @Column({ type: "varchar", nullable: true })
  location?: string;

  @Column({ type: "jsonb", nullable: true })
  dimensions?: {
    width?: number | string;
    height?: number | string;
    depth?: number | string;
    length?: number | string;
    unit?: string;
  };

  @Column({ type: "jsonb", nullable: true })
  weight?: {
    value?: number | string;
    unit?: string;
  };

  @Column({ type: "varchar", nullable: true })
  color?: string;

  @Column({ type: "varchar", nullable: true })
  material?: string;

  @Column({ type: "jsonb", nullable: true })
  tags?: string[];

  @Column({ type: "varchar", nullable: true })
  imageUrl?: string;

  @Column({ type: "varchar", nullable: true })
  supplier?: string;

  @Column({ type: "uuid", nullable: true })
  supplierId?: string;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @Index() // Add index for owner tracking
  @Column({ type: "uuid", nullable: true })
  ownerKey?: string;

  @Index()
  @Column({ type: "uuid" })
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "organizationId" })
  organization!: Organization;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;
}
