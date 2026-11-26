/**
 * This file is just a helper to install all necessary TypeScript type definitions.
 * Run with: npx ts-node install-types.ts
 */

import { execSync } from "child_process";

console.log("Installing TypeScript type definitions...");

const typePackages = [
  "@types/jsonwebtoken",
  "@types/bcrypt",
  "@types/cookie-parser",
  "@types/cors",
  "@types/express",
  "@types/node",
  "@types/uuid",
];

try {
  execSync(`npm install --save-dev ${typePackages.join(" ")}`, {
    stdio: "inherit",
  });
  console.log("All type definitions installed successfully!");
} catch (error) {
  console.error("Error installing type definitions:", error);
  process.exit(1);
}
