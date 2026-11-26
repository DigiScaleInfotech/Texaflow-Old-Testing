import { connectDatabase } from "../config/database";

async function testConnection() {
  try {
    console.log("Testing database connection...");
    const dataSource = await connectDatabase() as any;
    console.log("✅ Database connection successful!");
    console.log("Connection details:");
    console.log(`- Host: ${dataSource.options.host}`);
    console.log(`- Database: ${dataSource.options.database}`);
    console.log(`- Username: ${dataSource.options.username}`);
    console.log(`- Port: ${dataSource.options.port}`);

    // Make sure to close the connection
    await dataSource.destroy();
    console.log("Connection closed.");
  } catch (error) {
    console.error("❌ Failed to connect to database:");
    console.error(error);
  }
}

// Run the test
testConnection();
