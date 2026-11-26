import { Client } from "pg";
import dotenv from "dotenv";
import { AppDataSource } from "./database";

dotenv.config();

// Extract database name from the connection string
function extractDatabaseName(connectionString: string): string {
  try {
    // Parse the connection string to extract the database name
    const dbNameMatch = connectionString.match(/\/([^:]+)$/);
    return dbNameMatch ? dbNameMatch[1] : "textiles_db";
  } catch (error) {
    console.error("Error parsing connection string:", error);
    return "textiles_db"; // Default database name
  }
}

// Initialize database if it doesn't exist
export async function initializeDatabase(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not defined");
  }

  const dbName = extractDatabaseName(connectionString);

  // Create a connection to the default postgres database
  const pgConnectionString = connectionString.replace(
    `/${dbName}`,
    "/postgres"
  );

  const client = new Client({
    connectionString: pgConnectionString,
  });

  try {
    await client.connect();
    console.log("Connected to postgres database");

    // Check if our target database exists
    const checkDbResult = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );

    if (checkDbResult.rowCount === 0) {
      console.log(`Database '${dbName}' does not exist, creating it...`);

      // Create the database if it doesn't exist
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database '${dbName}' created successfully`);
    } else {
      console.log(`Database '${dbName}' already exists`);
    }
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  } finally {
    await client.end();
  }

  // Now initialize the TypeORM connection to the target database
  try {
    await AppDataSource.initialize();
    console.log("TypeORM connected to the database successfully");
  } catch (error) {
    console.error("TypeORM connection error:", error);
    throw error;
  }
}
