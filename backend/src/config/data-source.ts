import "../utils/dns-resolver"; // Ensure Supabase cloud DNS resolves across all networks
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import { join } from "path";

// Load environment variables from .env file
dotenv.config();

// Get database configuration from environment variables
const {
  DB_HOST = "localhost",
  DB_PORT = 5432,
  DB_USERNAME = "postgres",
  DB_PASSWORD = "postgres",
  DB_DATABASE = process.env.DB_NAME || process.env.DB_DATABASE || "postgres",
  NODE_ENV = "development",
} = process.env;

const useSsl =
  process.env.DB_SSL === "true" ||
  NODE_ENV === "production" ||
  Boolean(DB_HOST && (DB_HOST.includes("supabase.co") || DB_HOST.includes("supabase.com")));

// Create and export the TypeORM DataSource
export const AppDataSource = new DataSource({
  type: "postgres",
  host: DB_HOST,
  port: parseInt(DB_PORT as string, 10),
  username: DB_USERNAME,
  password: DB_PASSWORD,
  database: DB_DATABASE,
  synchronize: NODE_ENV === "development",
  logging: NODE_ENV === "development",
  entities: [join(__dirname, "..", "entities", "*.entity.{js,ts}")],
  migrations: [join(__dirname, "..", "migrations", "*.{js,ts}")],
  subscribers: [join(__dirname, "..", "subscribers", "*.subscriber.{js,ts}")],
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

// For TypeORM CLI compatibility
export default AppDataSource;
