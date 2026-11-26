import "./utils/dns-resolver"; // Ensure Supabase cloud DNS resolves across all networks
import "reflect-metadata"; // Important: this should be the first import
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import fileUpload from "express-fileupload"; // <-- Add this import
import { connectDatabase } from "./config/database";
import { runSeeds } from "./seeds/index";
import { setupGlobalMiddleware } from "./middleware";
import { setupRoutes } from "./routes";
import { initializeScheduler } from "./scheduler";
import { LocationController } from "./controllers/location.controller";
import { initializeWorkers } from "./workers";
import { WebSocketNotificationService } from "./services/websocket-notification.service";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 9000;

// Middleware
app.use(
  express.json({
    limit: "50mb", // Increase JSON payload limit to 50MB
  }),

  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Log the request method and URL
    // console.log(`pass 1`);
    next();
  }
);
app.use(
  express.urlencoded({
    limit: "50mb",
    extended: true,
  }),
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Log the request method and URL
    // console.log(`pass 2`);
    next();
  }
); // Also increase URL-encoded payload limit
app.use(cookieParser());
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",")
  : ["http://localhost:3000"];

console.log("allowedOrigins", allowedOrigins);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Update file upload middleware config for larger files and better error handling
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
    limits: {
      fileSize: 50 * 1024 * 1024, // 20MB limit
    },
    abortOnLimit: true,
    createParentPath: true,
    debug: process.env.NODE_ENV === "development", // Enable debug in development mode
    safeFileNames: true, // Replace special characters in filenames
    preserveExtension: true, // Preserve file extension
  }),
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Log the request method and URL
    // console.log(`pass 4`);
    next();
  }
);

// Apply global middleware
// setupGlobalMiddleware(app );

// Routes
setupRoutes(app);

// Database connection and server start
async function startServer() {
  try {
    // Connect to the database
    const connection = await connectDatabase();

    // Ensure bills foreign key has ON DELETE SET NULL so customer deletion never fails
    try {
      await connection.query(`
        ALTER TABLE bills DROP CONSTRAINT IF EXISTS "FK_fdc2d860a6ec4f356168a4317dd";
        ALTER TABLE bills ADD CONSTRAINT "FK_fdc2d860a6ec4f356168a4317dd" FOREIGN KEY ("customerId") REFERENCES customers(id) ON DELETE SET NULL;
      `);
      console.log("Foreign key constraint FK_fdc2d860a6ec4f356168a4317dd updated to ON DELETE SET NULL");
    } catch (constraintErr) {
      console.warn("Could not alter bills foreign key constraint:", constraintErr);
    }

    // Run seeds (with error handling inside runSeeds)
    await runSeeds();

    // Initialize background workers
    initializeWorkers();

    // Initialize scheduler for cron jobs
    initializeScheduler();

    // Load location data
    LocationController.initializeLocationData();
    console.log("Location data initialized for API use");

    // Create server instead of starting app directly
    const server = require("http").createServer(app);

    // Initialize WebSocket notification server
    WebSocketNotificationService.initialize(server);

    // Start the server
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
