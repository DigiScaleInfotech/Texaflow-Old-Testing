import { connectDatabase, getDataSource } from "../config/database";

/**
 * Script to run database migrations
 */
const runMigrations = async () => {
  try {
    console.log("Initializing database connection...");
    // First initialize the connection
    await connectDatabase();

    // Now we can safely get the data source
    const dataSource = getDataSource();

    console.log("Running migrations...");
    await dataSource.runMigrations();

    console.log("Migrations completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error running migrations:", error);
    process.exit(1);
  }
};

runMigrations();
