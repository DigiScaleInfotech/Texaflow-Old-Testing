import { Request, Response, NextFunction } from "express";
import { UserRole } from "../interface/user";

interface CustomRequest extends Request {
  user?: any;
}

/**
 * Middleware to restrict access to admin users only
 */
export const adminOnly = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (
      req.user.role !== UserRole.ADMIN &&
      req.user.role !== UserRole.SUPER_ADMIN
    ) {
      return res.status(403).json({ message: "Admin access required" });
    }

    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
