import { User } from "./entities/user.entity";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      session?: {
        id: string;
        userId: string;
        expiresAt: Date;
      };
    }
  }
}
