import { User } from "../entities/user.entity";
import { UserRole } from "../interface/user";

declare global {
  namespace Express {
    interface Request {
      user?: any;
      jwtPayload?: {
        userId: string;
        role: any;
        organizationId?: string;
        sessionKey?: string;
      };
      session?: {
        id: string;
        userId: string;
        expiresAt: Date;
      };
      files?: any;
      file?: any;
    }
  }
}

export {};
