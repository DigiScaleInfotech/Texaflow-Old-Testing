import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Organization } from "./organization.entity";
import { SubscriptionPlan } from "./subscription-plan.entity";
import {
  SubscriptionStatus,
  OrganizationSubscription as IOrganizationSubscription,
} from "../interface/subscription";

@Entity("organization_subscriptions")
export class OrganizationSubscription implements IOrganizationSubscription {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  organizationId: string;

  @Column()
  planId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "organizationId" })
  organization: Organization;

  @ManyToOne(() => SubscriptionPlan)
  @JoinColumn({ name: "planId" })
  plan: SubscriptionPlan;

  @Column({ type: "timestamp" })
  startDate: Date;

  @Column({ type: "timestamp" })
  endDate: Date;

  @Column({
    type: "enum",
    enum: SubscriptionStatus,
    default: SubscriptionStatus.PENDING,
  })
  status: SubscriptionStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
