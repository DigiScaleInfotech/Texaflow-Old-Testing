import {
  Express,
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import {
  conditionalBodyParser,
  conditionalUrlEncoded,
} from "./body-parser.middleware";
import { authenticate, isAdmin } from "./auth.middleware";
import { validateSearch, applyOwnerFilter } from "./search.middleware";

/**
 * Apply global middleware to the Express application
 */
export function setupGlobalMiddleware(app: Express): void {
  // CORS configuration
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"],
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true, // Important for cookies
    }) ,
    (req: Request, res: Response, next: NextFunction) => {
      // Log the request method and URL
      console.log(
        `pass 5`
      );
      next();
    }
  );

  // Body parser middleware with conditional limits
  app.use(conditionalBodyParser  ,
      (req: Request, res: Response, next: NextFunction) => {
      // Log the request method and URL
      console.log(
        `pass 6`
      );
      next();
    }
  );
  app.use(conditionalUrlEncoded ,
      (req: Request, res: Response, next: NextFunction) => {
      // Log the request method and URL
      console.log(
        `pass 7`
      );
      next();
    }
  );

  // Cookie parser for auth tokens
  app.use(cookieParser() , 
  (req: Request, res: Response, next: NextFunction) => {
      // Log the request method and URL
      console.log(
        `pass 8`
      );
      next();
    });

  // Request logger
  app.use(requestLogger ,   (req: Request, res: Response, next: NextFunction) => {
      // Log the request method and URL
      console.log(
        `pass 9`
      );
      next();
    });
}

// Type definition for route handlers to ensure compatibility
type RouteHandler = (req: Request, res: Response) => any;

/**
 * Apply authentication middleware to protected routes
 */
export function protectedRoute(
  app: Express,
  path: string,
  method: string,
  handler: RouteHandler
): void {
  // Convert authenticate to RequestHandler to satisfy TypeScript
  const authMiddleware: RequestHandler = (req, res, next) => {
    authenticate(req as any, res, next);
  };

  switch (method.toLowerCase()) {
    case "get":
      app.get(path, authMiddleware, handler as RequestHandler);
      break;
    case "post":
      app.post(path, authMiddleware, handler as RequestHandler);
      break;
    case "put":
      app.put(path, authMiddleware, handler as RequestHandler);
      break;
    case "delete":
      app.delete(path, authMiddleware, handler as RequestHandler);
      break;
    default:
      throw new Error(`Unsupported HTTP method: ${method}`);
  }
}

/**
 * Apply admin-only middleware to routes that require admin access
 */
export function adminRoute(
  app: Express,
  path: string,
  method: string,
  handler: RouteHandler
): void {
  // Convert middleware to RequestHandler to satisfy TypeScript
  const authMiddleware: RequestHandler = (req, res, next) => {
    authenticate(req as any, res, next);
  };

  const adminMiddleware: RequestHandler = (req, res, next) => {
    isAdmin(req as any, res, next);
  };

  switch (method.toLowerCase()) {
    case "get":
      app.get(path, authMiddleware, adminMiddleware, handler as RequestHandler);
      break;
    case "post":
      app.post(
        path,
        authMiddleware,
        adminMiddleware,
        handler as RequestHandler
      );
      break;
    case "put":
      app.put(path, authMiddleware, adminMiddleware, handler as RequestHandler);
      break;
    case "delete":
      app.delete(
        path,
        authMiddleware,
        adminMiddleware,
        handler as RequestHandler
      );
      break;
    default:
      throw new Error(`Unsupported HTTP method: ${method}`);
  }
}

/**
 * Special index-optimized route for high-performance read operations
 */
export function indexedRoute(
  app: Express,
  path: string,
  handler: RouteHandler
): void {
  const authMiddleware: RequestHandler = (req, res, next) => {
    authenticate(req as any, res, next);
  };

  // Set performance headers and query optimization
  const optimizationMiddleware: RequestHandler = (req, res, next) => {
    // Add cache headers for better client-side caching
    res.setHeader("Cache-Control", "private, max-age=300");
    // Set a custom header to indicate this is an indexed route
    res.setHeader("X-Index-Optimized", "true");
    next();
  };

  app.get(
    path,
    authMiddleware,
    optimizationMiddleware,
    handler as RequestHandler
  );
}

/**
 * Apply indexed search route with authentication and search validation
 */
export function indexedSearchRoute(
  app: Express,
  path: string,
  entityName: string,
  handler: RouteHandler
): void {
  const authMiddleware: RequestHandler = (req, res, next) => {
    authenticate(req as any, res, next);
  };

  const searchValidationMiddleware: RequestHandler = (req, res, next) => {
    validateSearch(req as any, res, next);
  };

  const ownerFilterMiddleware: RequestHandler = (req, res, next) => {
    applyOwnerFilter(entityName)(req as any, res, next);
  };

  app.get(
    path,
    authMiddleware,
    searchValidationMiddleware,
    ownerFilterMiddleware,
    handler as RequestHandler
  );
}

/**
 * Request logger middleware
 */
function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = new Date().getTime();

  res.on("finish", () => {
    const duration = new Date().getTime() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${
        res.statusCode
      } ${duration}ms`
    );
  });

  next();
}
