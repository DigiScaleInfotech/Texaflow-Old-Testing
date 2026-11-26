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
import { User } from "./user.entity";

export enum MediaType {
  IMAGE = "image",
  VIDEO = "video",
  DOCUMENT = "document",
  AUDIO = "audio",
}

@Entity("media")
export class Media {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ length: 255, nullable: true })
  originalName!: string;

  @Column({ length: 1000 })
  url!: string;

  @Column({ length: 1000 })
  path!: string;

  @Column({
    type: "enum",
    enum: MediaType,
    default: MediaType.IMAGE,
  })
  @Index()
  type!: MediaType;

  @Column({ length: 100, nullable: true })
  mimeType!: string;

  @Column({ type: "int", default: 0 })
  size!: number;

  @Column({ type: "uuid" })
  @Index()
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "organizationId" })
  organization!: Organization;

  @Column({ type: "uuid", nullable: true })
  uploadedById!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "uploadedById" })
  uploadedBy!: User;

  @Column({ type: "jsonb", nullable: true })
  metadata?: any;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ default: true })
  isActive!: boolean;
}
