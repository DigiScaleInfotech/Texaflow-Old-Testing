import { DataSource } from "typeorm";

declare global {
  // Add missing properties to the NodeJS.Global interface
  namespace NodeJS {
    interface Global {
      AppDataSource: DataSource;
    }
  }

  // Also add to the Window interface for completeness
  interface Window {
    AppDataSource: DataSource;
  }
}

// Make this file a module
export {};
