import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from "typeorm";
import { Organization } from "./organization.entity";
import { Product } from "./product.entity";

@Entity("categories")
export class Category {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  code: string;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @Column({ type: "varchar", length: 255, nullable: true })
  imageUrl: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  color: string;

  @Column({ type: "jsonb", nullable: true })
  attributes: any;

  @Column({ type: "int", default: 0 })
  displayOrder: number;

  // Category hierarchy - parent/child relationship
  @Column({ nullable: true })
  parentCategoryId: string;

  @ManyToOne(() => Category, (category) => category.children, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "parentCategoryId" })
  parentCategory: Category;

  @OneToMany(() => Category, (category) => category.parentCategory)
  children: Category[];

  // Relationship with Organization - indexed for faster queries
  @Column()
  @Index()
  organizationId: string;

  @ManyToOne(() => Organization, (organization) => organization.categories, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "organizationId" })
  organization: Organization;

  // Relationship with Product - one category can have many products
  @OneToMany(() => Product, (product) => product.category)
  products: Product[];

  // Metadata
  @Column({ type: "jsonb", nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
