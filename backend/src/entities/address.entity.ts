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
import { Address as IAddress, AddressType } from "../interface/address";
import { Organization } from "./organization.entity";

@Entity("addresses")
@Index(["city", "country"]) // Composite index for location searches
export class Address implements IAddress {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  addressLine1!: string;

  @Column({ type: "varchar", nullable: true })
  addressLine2?: string;

  @Index() // Index for city searches
  @Column({ type: "varchar" })
  city!: string;

  @Index() // Index for state searches
  @Column({ type: "varchar", nullable: true })
  state?: string;

  @Index() // Index for postal code searches
  @Column({ type: "varchar" })
  postalCode!: string;

  @Index() // Index for country searches
  @Column({ type: "varchar" })
  country!: string;

  @Index() // Index for default address filter
  @Column({ type: "boolean", default: false })
  isDefault!: boolean;

  @Index() // Index for address type filtering
  @Column({
    type: "enum",
    enum: AddressType,
    default: AddressType.BOTH,
  })
  addressType!: AddressType;

  @Index() // Index for organization filtering
  @Column({ type: "uuid", nullable: true })
  organizationId?: string;

  @Index() // Index for user filtering
  @Column({ type: "uuid", nullable: true })
  userId?: string;

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: "organizationId" })
  organization?: Organization;

  // When you create a User entity, you can uncomment this
  // @ManyToOne(() => User, { nullable: true })
  // @JoinColumn({ name: "userId" })
  // user?: User;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;
}
