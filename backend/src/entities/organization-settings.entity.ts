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

@Entity("organization_settings")
export class OrganizationSettings {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  @Index()
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "organizationId" })
  organization?: Organization;

  @Column()
  @Index()
  settingsType!: string;

  @Column({ type: "jsonb", default: {} })
  settings!: any;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
