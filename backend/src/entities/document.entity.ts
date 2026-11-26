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
import {
  Document as IDocument,
  DocumentType,
  DocumentStatus,
} from "../interface/document";

@Entity("documents")
export class Document implements IDocument {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  name!: string;

  @Column({ type: "varchar" })
  originalName!: string;

  @Column({ type: "varchar" })
  path!: string;

  @Column({ type: "varchar" })
  url!: string;

  @Column({ type: "varchar" })
  mimeType!: string;

  @Column({ type: "int" })
  size!: number;

  @Column({
    type: "enum",
    enum: DocumentType,
    default: DocumentType.OTHER,
  })
  documentType!: DocumentType;

  @Column({
    type: "enum",
    enum: DocumentStatus,
    default: DocumentStatus.PENDING,
  })
  status!: DocumentStatus;

  @Column({ type: "text", nullable: true })
  remarks?: string;

  @Index()
  @Column({ type: "uuid" })
  organizationId!: string;

  @ManyToOne(() => Organization, (organization) => organization.documents)
  @JoinColumn({ name: "organizationId" })
  organization!: Organization;

  @Index()
  @Column({ type: "uuid", nullable: true })
  userId?: string;

  @ManyToOne(() => User, (user) => user.documents, { nullable: true })
  @JoinColumn({ name: "userId" })
  user?: User;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @Column({ type: "timestamp", nullable: true })
  verifiedAt?: Date;

  @Column({ type: "uuid", nullable: true })
  verifiedBy?: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;
}
