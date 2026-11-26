import { Request, Response, NextFunction } from "express";
import { getRepository } from "../config/database";

// Extend the Request interface to include the user property


/**
 * Middleware to validate and normalize search parameters
 */
export const validateSearch = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Get search parameters
  const { query, page, limit, sort, order } = req.query;

  // Validate and normalize page and limit
  req.query.page = page ? String(Math.max(1, Number(page))) : "1";
  req.query.limit = limit
    ? String(Math.min(100, Math.max(1, Number(limit))))
    : "20";

  // Validate sort and order
  if (sort && typeof sort === "string") {
    req.query.sort = sort.replace(/[^a-zA-Z0-9_]/g, ""); // Sanitize sort field
  }

  if (order && typeof order === "string") {
    req.query.order = ["asc", "desc"].includes(order.toLowerCase())
      ? order
      : "asc";
  }

  // Sanitize query string
  if (query && typeof query === "string") {
    req.query.query = query.trim();
  }

  next();
};

/**
 * Middleware to apply owner key filter for entity access control
 */
export const applyOwnerFilter = (entityName: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const customReq = req as any;

    // Skip for admin users
    if (
      customReq.user?.role === "ADMIN" ||
      customReq.user?.role === "SUPER_ADMIN"
    ) {
      next();
      return;
    }

    // For non-admin users, add ownerKey filter to query params
    if (customReq.user?.id) {
      req.query.ownerKey = customReq.user.id;
    } else {
      res.status(403).json({ message: "Access denied" });
      return; // Explicitly return after sending the response
    }

    next();
  };
};
