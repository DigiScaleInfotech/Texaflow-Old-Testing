import { Request, Response, NextFunction, RequestHandler } from "express";
import * as jwt from "jsonwebtoken";
import { UserRole } from "../interface/user";
import { getRepository } from "../config/database";
import { User } from "../entities/user.entity";
import { Organization } from "../entities/organization.entity";
import { Session } from "../entities/session.entity";

// JWT secret key - should match the one in auth controller
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Define the JWT payload structure
interface JwtPayload {
  userId: string;
  role: UserRole;
  organizationId?: string;
  sessionKey?: string;
}

// Define custom request interface with proper types
// Made it exported so other files can use it
export interface CustomRequest extends Request {
  user?: any; // Keep it as 'any' to solve compatibility issues
  jwtPayload?: JwtPayload; // Add jwtPayload property
  session?: {
    id: string;
    userId: string;
    expiresAt: Date;
  };
  sessionId?: string; // Add sessionId property to fix the error
}

// Fast in-memory cache for authenticated sessions to eliminate remote DB round-trips
interface CachedAuth {
  user: any;
  expiresAt: Date;
  cachedAt: number;
}
const authCache = new Map<string, CachedAuth>();
const AUTH_CACHE_TTL = 60 * 1000; // 60 seconds

// Authentication middleware
export const authenticate = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = req.cookies.access_token; // Get token from cookie

    // Also check for token in Authorization header for API clients
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      res.status(401).json({ message: "Unauthorized: No token provided" });
      return;
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      // Check if token is expired
      if ((error as any).name === "TokenExpiredError") {
        res
          .status(401)
          .json({ message: "Token expired", code: "TOKEN_EXPIRED" });
      } else {
        res.status(401).json({ message: "Invalid token" });
      }
      return;
    }

    const { userId, sessionKey, sessionId } = decoded as {
      userId: string;
      sessionKey: string;
      sessionId: string;
    };

    const cacheKey = `${userId}:${sessionId}:${sessionKey}`;
    const cached = authCache.get(cacheKey);
    const now = Date.now();

    if (cached && (now - cached.cachedAt < AUTH_CACHE_TTL) && (new Date() < cached.expiresAt)) {
      req.user = cached.user;
      req.jwtPayload = decoded as any;
      req.sessionId = sessionId;
      return next();
    }

    // Verify the session is valid
    const sessionRepository = getRepository(Session);
    const session = await sessionRepository.findOne({
      where: { id: sessionId, userId, sessionKey, isActive: true },
    });

    if (!session || new Date() > session.expiresAt) {
      authCache.delete(cacheKey);
      res.status(401).json({
        message: "Session is invalid or expired",
        code: "SESSION_EXPIRED",
      });
      return;
    }

    // Update session activity asynchronously without blocking the request
    session.lastActivityAt = new Date();
    sessionRepository.save(session).catch(() => {});

    // Get user data
    const userRepository = getRepository(User);
    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ["organization"],
    });

    if (!user) {
      authCache.delete(cacheKey);
      res.status(401).json({ message: "User not found" });
      return;
    }

    // Cache the authenticated user and session
    authCache.set(cacheKey, {
      user,
      expiresAt: session.expiresAt,
      cachedAt: now,
    });

    // Set user data in request
    req.user = user;
    req.jwtPayload = decoded as any;
    req.sessionId = sessionId;

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Role-based authorization middleware
export const authorize = (roles: UserRole | UserRole[]): RequestHandler => {
  return (req: CustomRequest, res: Response, next: NextFunction): void => {
    if (!req.jwtPayload) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const authorizedRoles = Array.isArray(roles) ? roles : [roles];

    if (!authorizedRoles.includes(req.jwtPayload.role)) {
      res
        .status(403)
        .json({ message: "Access denied: Insufficient permissions" });
      return;
    }

    next();
  };
};

/**
 * Middleware to check if the user is an admin or super admin
 */
export const isAdmin = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized access - No user found" });
    return;
  }

  const { role } = req.user;

  if (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN) {
    next();
    return;
  }

  res.status(403).json({ message: "Forbidden - Admin access required" });
};
