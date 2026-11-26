import { Request, Response, NextFunction } from "express";
import express from "express";

// Default limits
const DEFAULT_BODY_LIMIT = "50mb";
const DEFAULT_MEDIA_LIMIT = "50mb";

// Get media routes from environment variables or use defaults
const getMediaRoutes = (): string[] => {
  const routes = process.env.MEDIA_ROUTES?.split(",") || [
    "/api/upload",
    "/api/media",
    "/api/files",
  ];
  return routes.map((route) => route.trim());
};

// Standard body parser with size limit
export const standardBodyParser = express.json({
  limit: process.env.BODY_LIMIT || DEFAULT_BODY_LIMIT,
});

export const standardUrlEncoded = express.urlencoded({
  extended: true,
  limit: process.env.BODY_LIMIT || DEFAULT_BODY_LIMIT,
});

// Media body parser with larger size limit
export const mediaBodyParser = express.json({
  limit: process.env.MEDIA_BODY_LIMIT || DEFAULT_MEDIA_LIMIT,
});

export const mediaUrlEncoded = express.urlencoded({
  extended: true,
  limit: process.env.MEDIA_BODY_LIMIT || DEFAULT_MEDIA_LIMIT,
});

// Conditional body parser middleware
export const conditionalBodyParser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const mediaRoutes = getMediaRoutes();

  // Check if the current route should allow larger payloads
  const isMediaRoute = mediaRoutes.some((route) => req.path.startsWith(route));

  if (isMediaRoute) {
    // Use larger limits for media routes
    return mediaBodyParser(req, res, next);
  } else {
    // Use standard limits for all other routes
    return standardBodyParser(req, res, next);
  }
};

// Conditional URL encoded middleware
export const conditionalUrlEncoded = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const mediaRoutes = getMediaRoutes();

  // Check if the current route should allow larger payloads
  const isMediaRoute = mediaRoutes.some((route) => req.path.startsWith(route));

  if (isMediaRoute) {
    // Use larger limits for media routes
    return mediaUrlEncoded(req, res, next);
  } else {
    // Use standard limits for all other routes
    return standardUrlEncoded(req, res, next);
  }
};
