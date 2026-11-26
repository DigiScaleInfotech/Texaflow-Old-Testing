import { connectDatabase, getDataSource } from "../config/database";

/**
 * Script to clean up failed migrations from the migrations table
 * Usage: ts-node src/utils/fix-migrations.ts MigrationName
 */
const fixMigrations = async () => {
  try {
    console.log("Initializing database connection...");
    await connectDatabase();
    const dataSource = getDataSource();

    const migrationName = process.argv[2];
    if (!migrationName) {
      console.error("Please provide a migration name to remove");
      console.log("Usage: ts-node src/utils/fix-migrations.ts MigrationName");
      process.exit(1);
    }

    console.log(
      `Removing migration "${migrationName}" from migrations table...`
    );

    // Delete the failed migration from the migrations table
    await dataSource.query(`DELETE FROM migrations WHERE name = $1`, [
      migrationName,
    ]);

    console.log("Migration removed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error fixing migrations:", error);
    process.exit(1);
  }
};

fixMigrations();
