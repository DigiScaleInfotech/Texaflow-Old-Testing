import { getRepository } from "../config/database";
import { Session } from "../entities/session.entity";
import { User } from "../entities/user.entity";
import { UserRole } from "../interface/user";
import * as crypto from "crypto";

export class SessionService {
  private sessionRepository = getRepository(Session);

  /**
   * Create a new session for a user with role-based expiration
   */
  async createSession(
    user: User,
    userAgent?: string,
    ipAddress?: string
  ): Promise<Session> {
    // Generate a secure random token
    const token = crypto.randomBytes(64).toString("hex");

    // Set expiration based on user role
    const expiresAt = this.getExpirationDate(user.role);

    const session = new Session();
    session.userId = user.id;
    session.sessionKey = token; // Changed from token to sessionKey
    session.expiresAt = expiresAt;
    // Store device info in the deviceInfo JSON field
    session.deviceInfo = userAgent ? { userAgent } : {}; // Use deviceInfo instead of userAgent
    session.ipAddress = ipAddress || ""; // Provide empty string as fallback
    session.isActive = true;
    session.lastActivityAt = new Date(); // Changed from lastUsedAt to lastActivityAt

    return this.sessionRepository.save(session);
  }

  /**
   * Get role-based expiration date
   */
  private getExpirationDate(role: UserRole): Date {
    const now = new Date();

    switch (role) {
      case UserRole.VENDOR:
        // 60 days for vendors
        return new Date(now.setDate(now.getDate() + 60));

      case UserRole.ADMIN:
      case UserRole.SUPER_ADMIN:
        // 15 days for admins
        return new Date(now.setDate(now.getDate() + 15));

      default:
        // 30 days for other users
        return new Date(now.setDate(now.getDate() + 30));
    }
  }

  /**
   * Invalidate a session by its token
   */
  async invalidateSession(token: string): Promise<void> {
    // Update to use sessionKey instead of token
    await this.sessionRepository.update(
      { sessionKey: token },
      { isActive: false }
    );
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.sessionRepository
      .createQueryBuilder()
      .update(Session)
      .set({ isActive: false })
      .where("expiresAt < :now", { now: new Date() })
      .andWhere("isActive = :active", { active: true })
      .execute();

    return result.affected || 0;
  }
}
