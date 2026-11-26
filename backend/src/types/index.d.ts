import { User } from "../entities/user.entity";
import { UserRole } from "../interface/user";

declare namespace Express {
  export interface Request {
    user?: any;
    jwtPayload?: {
      userId: string;
      role: UserRole;
      organizationId?: string;
      sessionKey?: string;
    };
    session?: {
      id: string;
      userId: string;
      expiresAt: Date;
    };
  }
}
