import { getRepository } from "../config/database";
import { Organization } from "../entities/organization.entity";
import { User } from "../entities/user.entity";
import { Repository, ObjectLiteral, EntityTarget } from "typeorm";

/**
 * IndexService provides efficient data access using database indexes
 * instead of the more complex tenant-based isolation
 */
export class IndexService {
  /**
   * Get organization by ID with efficient indexing
   */
  async getOrganization(id: string): Promise<Organization | null> {
    const repository = getRepository(Organization);
    const organization = await repository.findOne({
      where: { id },
      relations: ["user", "addresses"],
    });
    return organization as Organization | null;
  }

  /**
   * Get organizations with filtering and pagination
   */
  async getOrganizations(
    filter: Partial<Organization> = {},
    page = 1,
    pageSize = 20
  ): Promise<{ items: Organization[]; total: number }> {
    const repository = getRepository(Organization);

    const [items, total] = await repository.findAndCount({
      where: filter,
      relations: ["user"],
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: "DESC" },
    });

    return { items: items as Organization[], total };
  }

  /**
   * Get user by ID with efficient indexing
   */
  async getUser(id: string): Promise<User | null> {
    const repository = getRepository(User);
    const user = await repository.findOne({
      where: { id },
      relations: ["organization"],
    });
    return user as User | null; // Explicitly cast the result to User | null
  }

  /**
   * Generic repository method that uses proper indexing
   */
  getIndexedRepository<T extends ObjectLiteral>(
    entityType: EntityTarget<T> // Use EntityTarget<T> instead of new () => T
  ): any {
    return getRepository(entityType);
  }

  /**
   * Search organizations by various indexed fields
   */
  async searchOrganizations(
    query: string,
    page = 1,
    pageSize = 20
  ): Promise<{ items: Organization[]; total: number }> {
    const repository = getRepository(Organization);

    // Using proper indexed fields for search
    const [items, total] = await repository.findAndCount({
      where: [
        { name: query },
        { email: query },
        { businessName: query },
        { phone: query },
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: "DESC" },
    });

    return { items: items as Organization[], total };
  }

  /**
   * Get data filtered by organization ID (replaces tenant filtering)
   */
  async getOrganizationData<T>(
    entityType: EntityTarget<T>, // Use EntityTarget<T> instead of new () => T
    organizationId: string,
    filter: any = {},
    page = 1,
    pageSize = 20
  ): Promise<{ items: T[]; total: number }> {
    const repository = getRepository(entityType);

    const [items, total] = await repository.findAndCount({
      where: {
        ...filter,
        organizationId,
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { items: items as T[], total };
  }
}
