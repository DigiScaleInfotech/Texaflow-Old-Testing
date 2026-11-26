import "../utils/dns-resolver"; // Ensure Supabase cloud DNS resolves across all networks
import { DataSource, LoggerOptions } from "typeorm";
import path from "path";
import dotenv from "dotenv";
import { User } from "../entities/user.entity";
import { Organization } from "../entities/organization.entity";
import { Address } from "../entities/address.entity";
import { SubscriptionPlan } from "../entities/subscription-plan.entity";
import { OrganizationSubscription } from "../entities/organization-subscription.entity";
import { Session } from "../entities/session.entity";
import { Notification } from "../entities/notification.entity";
import { Customer } from "../entities/customer.entity";
import { Product } from "../entities/product.entity";
import { Payment } from "../entities/payment.entity";
import { Expense } from "../entities/expense.entity";

// Load environment variables
dotenv.config();

// Configuration for the connection
const useSsl =
  process.env.DB_SSL === "true" ||
  process.env.NODE_ENV === "production" ||
  Boolean(process.env.DB_HOST && (process.env.DB_HOST.includes("supabase.co") || process.env.DB_HOST.includes("supabase.com")));

export const config = {
  type: "postgres" as const,
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "988716", // Updated default password
  database: process.env.DB_NAME || "textiles_db", // Updated default database name
  entities: [
    User,
    Organization,
    Address,
    Session,
    OrganizationSubscription,
    Notification,
    Customer,
    SubscriptionPlan,
    Product, // Add Product entity here
    Payment,
    Expense,
  ],
  synchronize: process.env.NODE_ENV !== "production",
  logging:
    process.env.TYPEORM_LOGGING === "true"
      ? true
      : (["error"] as LoggerOptions),
  ssl: useSsl ? { rejectUnauthorized: false } : false,
};

// Create and configure the DataSource
export const AppDataSource = new DataSource({
  ...config,
  entities: [
    ...config.entities,
    path.join(__dirname, "../entities/**/*.entity{.ts,.js}"),
  ],
  migrations: [path.join(__dirname, "../migrations/**/*{.ts,.js}")],
  subscribers: [path.join(__dirname, "../subscribers/**/*{.ts,.js}")],
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  cache:
    process.env.NODE_ENV === "production"
      ? {
          duration: 30000, // 30 seconds cache in production
        }
      : false,
});

// Initialize connection
let initialized = false;

export async function connectDatabase() {
  if (!initialized) {
    await AppDataSource.initialize();
    initialized = true;
    console.log("Database connection established");
  }
  return AppDataSource;
}

export function getDataSource() {
  if (!initialized) {
    throw new Error("DataSource not initialized. Call connectDatabase first.");
  }
  return AppDataSource;
}

export function getRepository<T>(entity: any) {
  return getDataSource().getRepository(entity);
}
