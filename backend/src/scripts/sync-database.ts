import "reflect-metadata";
import { createConnection } from "typeorm";
import { config } from "../config/database";
import { User } from "../entities/user.entity";
import { Organization } from "../entities/organization.entity";
import { Address } from "../entities/address.entity";
import { Session } from "../entities/session.entity";

// Add any other entities that need to be synced

/**
 * Sync database schema
 */
async function syncDatabase() {
  try {
    console.log("Connecting to database...");
    const connection = await createConnection(config);

    console.log("Connected to database. Synchronizing schema...");
    await connection.synchronize(true); // true will drop the tables if they exist

    console.log("Database schema synchronized successfully!");

    // Close the connection
    await connection.close();
    console.log("Connection closed.");

    process.exit(0);
  } catch (error) {
    console.error("Error synchronizing database schema:", error);
    process.exit(1);
  }
}

syncDatabase();
