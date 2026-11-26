import { Repository, SelectQueryBuilder, ObjectLiteral } from "typeorm";

/**
 * Helper function to create an optimized search query
 * @param repository The TypeORM repository
 * @param searchFields Fields to search in
 * @param searchTerm Search term
 * @param ownerKey Optional owner key to filter by
 */
export function createSearchQuery<T extends ObjectLiteral>(
  repository: Repository<T>,
  alias: string,
  searchFields: string[],
  searchTerm: string,
  ownerKey?: { field: string; value: string }
): SelectQueryBuilder<T> {
  // Create base query
  const query = repository.createQueryBuilder(alias);

  // Add search conditions
  if (searchFields.length > 0 && searchTerm) {
    const whereConditions = searchFields.map(
      (field) => `${alias}.${field} ILIKE :term`
    );
    query.where(`(${whereConditions.join(" OR ")})`, {
      term: `%${searchTerm}%`,
    });
  }

  // Add owner key filter if provided
  if (ownerKey) {
    query.andWhere(`${alias}.${ownerKey.field} = :ownerValue`, {
      ownerValue: ownerKey.value,
    });
  }

  return query;
}

/**
 * Paginate a query
 */
export function paginateQuery<T extends ObjectLiteral>(
  query: SelectQueryBuilder<T>,
  page: number = 1,
  limit: number = 20,
  orderBy?: { field: string; direction: "ASC" | "DESC" },
  alias: string = ""
): SelectQueryBuilder<T> {
  // Add pagination
  query.skip((page - 1) * limit).take(limit);

  // Add ordering if provided
  if (orderBy) {
    const field = alias ? `${alias}.${orderBy.field}` : orderBy.field;
    query.orderBy(field, orderBy.direction);
  }

  return query;
}

/**
 * Create standard pagination response
 */
export function createPaginationResponse<T>(
  results: T[],
  total: number,
  page: number,
  limit: number
) {
  return {
    results,
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  };
}
