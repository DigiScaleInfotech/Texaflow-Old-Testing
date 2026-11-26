/**
 * Queue service for handling background tasks
 */
export class QueueService {
  private static queues: Record<string, any[]> = {
    mail: [],
    notification: [],
  };

  private static processing: Record<string, boolean> = {
    mail: false,
    notification: false,
  };

  private static workers: Record<string, (task: any) => Promise<void>> = {};

  /**
   * Register a worker function for a specific queue
   */
  static registerWorker(
    queueName: string,
    workerFn: (task: any) => Promise<void>
  ): void {
    this.workers[queueName] = workerFn;
    console.log(`Worker registered for queue: ${queueName}`);

    // Start processing if there are pending tasks
    if (this.queues[queueName]?.length > 0 && !this.processing[queueName]) {
      this.processQueue(queueName);
    }
  }

  /**
   * Add a task to a specific queue
   */
  static async addTask(queueName: string, task: any): Promise<void> {
    // Ensure queue exists
    if (!this.queues[queueName]) {
      this.queues[queueName] = [];
    }

    // Add task to queue
    this.queues[queueName].push({
      ...task,
      addedAt: new Date(),
      status: "pending",
      attempts: 0,
    });

    console.log(
      `Task added to ${queueName} queue. Queue length: ${this.queues[queueName].length}`
    );

    // Start processing if not already processing
    if (!this.processing[queueName]) {
      this.processQueue(queueName);
    }
  }

  /**
   * Process tasks in a specific queue
   */
  private static async processQueue(queueName: string): Promise<void> {
    // Check if worker exists for this queue
    if (!this.workers[queueName]) {
      console.warn(`No worker registered for queue: ${queueName}`);
      return;
    }

    // Set processing flag
    this.processing[queueName] = true;

    try {
      // Process tasks until queue is empty
      while (this.queues[queueName].length > 0) {
        const task = this.queues[queueName][0];
        task.attempts += 1;
        task.status = "processing";
        task.processingStartedAt = new Date();

        try {
          // Process task with worker function
          await this.workers[queueName](task);

          // Task completed successfully
          task.status = "completed";
          task.completedAt = new Date();
          console.log(`Task completed in ${queueName} queue`);
        } catch (error: unknown) {
          // Handle task failure - fix for TS18046 error
          task.status = "failed";
          // Safely extract error message from unknown type
          task.error =
            error instanceof Error
              ? error.message
              : typeof error === "string"
              ? error
              : "Unknown error";

          console.error(`Error processing task in ${queueName} queue:`, error);

          // Retry task up to 3 times with exponential backoff
          if (task.attempts < 3) {
            // Move to the end of the queue for retry
            this.queues[queueName].shift();
            task.status = "pending";
            this.queues[queueName].push(task);
            continue;
          }
        }

        // Remove completed or permanently failed task from queue
        this.queues[queueName].shift();
      }
    } finally {
      // Reset processing flag
      this.processing[queueName] = false;
    }
  }

  /**
   * Get current queue status
   */
  static getQueueStatus(): Record<string, any> {
    const status: Record<string, any> = {};

    Object.keys(this.queues).forEach((queueName) => {
      status[queueName] = {
        length: this.queues[queueName].length,
        processing: this.processing[queueName],
        hasWorker: !!this.workers[queueName],
      };
    });

    return status;
  }
}
