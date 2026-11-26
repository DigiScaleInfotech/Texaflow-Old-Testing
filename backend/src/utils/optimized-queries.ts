import { getRepository } from "../config/database";
import { Organization } from "../entities/organization.entity";
import { User } from "../entities/user.entity";
import { Address } from "../entities/address.entity";

import { UserRole } from "../interface/user";

/**
 * Utility class with optimized indexed queries for common operations
 */
export class IndexedQueries {
  /**
   * Find organizations by name or business name (uses index)
   */
  static async findOrganizationsByName(
    searchTerm: string,
    limit = 10
  ): Promise<Organization[]> {
    const repository = getRepository(Organization);

    return repository
      .createQueryBuilder("org")
      .select("org")
      .where("org.name ILIKE :term OR org.businessName ILIKE :term", {
        term: `%${searchTerm}%`,
      })
      .orderBy("org.name", "ASC")
      .take(limit)
      .getMany() as Promise<Organization[]>;
  }

  /**
   * Find users by email (uses unique index)
   */
  static async findUserByEmail(email: string): Promise<User | null> {
    const repository = getRepository(User);
    return repository.findOne({ where: { email } }) as Promise<User | null>;
  }

  /**
   * Find addresses by country and city (uses composite index)
   */
  static async findAddressesByLocation(
    country: string,
    city?: string
  ): Promise<Address[]> {
    const repository = getRepository(Address);

    const query = repository
      .createQueryBuilder("address")
      .where("address.country = :country", { country });

    if (city) {
      query.andWhere("address.city = :city", { city });
    }

    return query.getMany() as Promise<Address[]>;
  }



  /**
   * Find admin users (uses role index)
   */
  static async findAdminUsers(): Promise<User[]> {
    const repository = getRepository(User);

    return repository
      .createQueryBuilder("user")
      .where("user.role IN (:...roles)", {
        roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
      })
      .orderBy("user.firstName", "ASC")
      .addOrderBy("user.lastName", "ASC")
      .getMany() as Promise<User[]>;
  }
}
