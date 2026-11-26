import { Request } from "express";
import { DataSource } from "typeorm";
import {
  getIsolatedRepository,
  getCollectionName,
} from "../config/collection-manager";

// Custom interface extending Request with our additional properties
interface CustomRequest extends Request {
  user?: any;
  organizationId?: string;
  tenantDataSource?: DataSource;
}

/**
 * Generic data service that enforces collection isolation based on user context
 */
export class DataService<T> {
  constructor(
    private entityType: new () => T,
    private baseCollectionName: string
  ) {}

  /**
   * Get repository with collection isolation based on the current request context
   */
  getRepository(req: Request): any {
    const customReq = req as CustomRequest;

    if (!customReq.user || !customReq.organizationId) {
      throw new Error("User or organization not available in request");
    }

    // Use tenant-specific data source if available, or fallback to the global one
    const dataSource = customReq.tenantDataSource || (global as any).AppDataSource;

    // Get isolated repository for this organization
    return getIsolatedRepository(
      dataSource,
      customReq.organizationId,
      this.entityType
    );
  }

  /**
   * Perform a find operation with collection isolation
   */
  async find(req: Request, options?: any): Promise<T[]> {
    const repository = this.getRepository(req);
    return repository.find(options);
  }

  /**
   * Perform a findOne operation with collection isolation
   */
  async findOne(req: Request, options: any): Promise<T | null> {
    const repository = this.getRepository(req);
    return repository.findOne(options);
  }

  /**
   * Perform a save operation with collection isolation
   */
  async save(req: Request, entity: any): Promise<T> {
    const repository = this.getRepository(req);
    return repository.save(entity);
  }

  /**
   * Perform an update operation with collection isolation
   */
  async update(req: Request, criteria: any, partialEntity: any): Promise<any> {
    const repository = this.getRepository(req);
    return repository.update(criteria, partialEntity);
  }

  /**
   * Perform a delete operation with collection isolation
   */
  async delete(req: Request, criteria: any): Promise<any> {
    const repository = this.getRepository(req);
    return repository.delete(criteria);
  }

  /**
   * Get the organization-specific collection name
   */
  getCollectionName(req: Request): string {
    const customReq = req as CustomRequest;

    if (!customReq.organizationId) {
      throw new Error("Organization not available in request");
    }

    return getCollectionName(this.baseCollectionName, customReq.organizationId);
  }
}
