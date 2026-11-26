import { Request, Response, NextFunction } from "express";
import { User } from "../entities/user.entity";
import { UserRole } from "../interface/user";

// Custom request interface with organization ID
interface CustomRequest extends Request {
  user?: User;
  organizationId?: string;
}

/**
 * Middleware to set organization context for data access
 */
export const resolveOrganizationContext = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const customReq = req as CustomRequest;

    if (!customReq.user) {
      next();
      return;
    }

    // Set organization ID on the request
    customReq.organizationId = customReq.user.organization?.id;

    next();
  } catch (error) {
    console.error("Error resolving organization context:", error);
    res.status(500).json({ message: "Error resolving organization context" });
  }
};

/**
 * Middleware to enforce organization-based data access
 */
export const enforceOrganizationAccess = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const customReq = req as CustomRequest;

  if (!customReq.user) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  // Check if request is for a specific organization
  const requestedOrgId =
    req.params.organizationId || (req.query.organizationId as string);

  if (requestedOrgId) {
    // Super admins can access any organization
    if (customReq.user.role === UserRole.SUPER_ADMIN) {
      next();
      return;
    }

    // User can only access their own organization
    if (customReq.user.organization?.id === requestedOrgId) {
      next();
      return;
    }

    res.status(403).json({ message: "Access denied for this organization" });
    return;
  }

  // No specific organization requested, proceed
  next();
};
