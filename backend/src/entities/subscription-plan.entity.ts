import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { SubscriptionPlan as ISubscriptionPlan } from "../interface/subscription";

@Entity("subscription_plans")
export class SubscriptionPlan implements ISubscriptionPlan {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ default: "monthly" })
  billingCycle: string;

  @Column("simple-array", { nullable: true })
  features: string[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  description: string;

  @Column({ name: "planId", nullable: true })
  planId?: string;

  @Column({ name: "durationMonths", default: 1 })
  durationMonths: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
