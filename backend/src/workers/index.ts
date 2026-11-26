import { initializeMailWorker } from "./mail.worker";

/**
 * Initialize all background workers
 */
export function initializeWorkers(): void {
  console.log("Initializing background workers...");

  // Initialize mail worker
  initializeMailWorker();

  console.log("Background workers initialized successfully");
}
