import { User } from "../entities/user.entity";
import { Organization } from "../entities/organization.entity";

// Global type augmentation for Express Request
declare namespace Express {
  export interface Request {
    user?: any; // Using any for simplicity and compatibility
    jwtPayload?: {
      userId: string;
      role: string;
      organizationId?: string;
      sessionKey?: string;
    };
  }
}

export {};
