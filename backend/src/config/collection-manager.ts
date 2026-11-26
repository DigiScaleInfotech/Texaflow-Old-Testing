import { getRepository } from "./database";
import { Organization } from "../entities/organization.entity";
import { User } from "../entities/user.entity";
import { DataSource } from "typeorm";

// Store collection prefixes for each organization
const collectionPrefixes: Map<string, string> = new Map();

/**
 * Get collection name with organization-specific prefix
 * @param baseCollectionName The base name of the collection
 * @param organizationId The organization ID to scope the collection
 */
export const getCollectionName = (
  baseCollectionName: string,
  organizationId: string
): string => {
  let prefix = collectionPrefixes.get(organizationId);

  if (!prefix) {
    // Generate a prefix based on organization ID (first 8 chars)
    prefix = `org_${organizationId.replace(/-/g, "").substring(0, 8)}`;
    collectionPrefixes.set(organizationId, prefix);
  }

  return `${prefix}_${baseCollectionName}`;
};

/**
 * Creates a data access helper that enforces collection isolation
 * @param dataSource TypeORM data source
 * @param organizationId Organization ID for collection isolation
 * @param entityType The entity type to use
 */
export const getIsolatedRepository = <T>(
  dataSource: DataSource,
  organizationId: string,
  entityType: new () => T
) => {
  // Get original repository
  const repository = dataSource.getRepository(entityType);

  // Extract the base collection name from the entity metadata
  const metadata = dataSource.getMetadata(entityType);
  const baseCollectionName = metadata.tableName;

  // Get the organization-specific collection name
  const collectionName = getCollectionName(baseCollectionName, organizationId);

  // Return a modified repository that uses the isolated collection
  return {
    ...repository,
    // Override methods that need collection isolation
    find: (options?: any) => {
      const modifiedOptions = { ...options };
      // Inject the isolated collection name
      return repository
        .createQueryBuilder()
        .from(collectionName, metadata.tableName)
        .setFindOptions(modifiedOptions)
        .getMany();
    },
    findOne: (options?: any) => {
      const modifiedOptions = { ...options };
      // Inject the isolated collection name
      return repository
        .createQueryBuilder()
        .from(collectionName, metadata.tableName)
        .setFindOptions(modifiedOptions)
        .getOne();
    },
    save: async (entity: any) => {
      // Ensure entity is saved to the isolated collection
      return repository
        .createQueryBuilder()
        .insert()
        .into(collectionName)
        .values(entity)
        .returning("*")
        .execute()
        .then((result) => result.raw[0]);
    },
    update: (criteria: any, partialEntity: any) => {
      // Update in the isolated collection
      return repository
        .createQueryBuilder()
        .update(collectionName)
        .set(partialEntity)
        .where(criteria)
        .execute();
    },
    delete: (criteria: any) => {
      // Delete from the isolated collection
      return repository
        .createQueryBuilder()
        .delete()
        .from(collectionName)
        .where(criteria)
        .execute();
    },
  };
};
