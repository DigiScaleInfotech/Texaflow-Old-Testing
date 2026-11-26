import WebSocket from "ws";
import http from "http";
import url from "url";
import { v4 as uuidv4 } from "uuid";
import { getRepository } from "../config/database";
import { User } from "../entities/user.entity";
import {
  NotificationType,
  NotificationCategory,
} from "../interface/notification";

interface WebSocketClient {
  userId: string;
  connection: any;
  sessionId: string;
}

export class WebSocketNotificationService {
  private static wss: any;
  private static clients: Map<string, WebSocketClient[]> = new Map();
  private static initialized: boolean = false;

  /**
   * Initialize WebSocket server
   */
  static initialize(server: http.Server): void {
    if (this.initialized) {
      console.log("WebSocket notification server already initialized");
      return;
    }

    try {
      this.wss = new WebSocket.Server({
        noServer: true,
        path: "/ws/notifications",
      });

      // Handle upgrade
      server.on("upgrade", (request, socket, head) => {
        const pathname = url.parse(request.url || "").pathname;

        if (pathname === "/ws/notifications") {
          this.wss.handleUpgrade(request, socket, head, (ws: any) => {
            this.wss.emit("connection", ws, request);
          });
        }
      });

      // Handle new connections
      this.wss.on("connection", (ws: any, request: any) => {
        // Extract token from URL parameters
        const requestUrl = url.parse(request.url || "", true);
        const token = requestUrl.query.token as string;

        if (!token) {
          ws.close(1008, "Authentication required");
          return;
        }

        // Authenticate and register client
        this.authenticateClient(token, ws);
      });

      // Set up heartbeat interval to keep connections alive
      setInterval(() => {
        this.wss.clients.forEach((ws: any) => {
          if ((ws as any).isAlive === false) {
            return ws.terminate();
          }
          (ws as any).isAlive = false;
          ws.ping();
        });
      }, 30000);

      this.initialized = true;
      console.log("WebSocket notification server initialized");
    } catch (error) {
      console.error(
        "Failed to initialize WebSocket notification server:",
        error
      );
    }
  }

  /**
   * Authenticate a client connection using token
   */
  private static async authenticateClient(
    token: string,
    ws: any
  ): Promise<void> {
    try {
      // In a real application, you'd verify the JWT token
      // For demo purposes, we'll assume token contains userId directly
      const userId = token;

      if (!userId) {
        ws.close(1008, "Invalid token");
        return;
      }

      // Verify that user exists
      const userRepository = getRepository(User);
      const user = await userRepository.findOne({ where: { id: userId } });

      if (!user) {
        ws.close(1008, "User not found");
        return;
      }

      // Generate session ID for this connection
      const sessionId = uuidv4();

      // Register the client
      if (!this.clients.has(userId)) {
        this.clients.set(userId, []);
      }

      this.clients.get(userId)?.push({
        userId,
        connection: ws,
        sessionId,
      });

      console.log(`Client connected: User ${userId}, Session ${sessionId}`);

      // Send welcome message
      ws.send(
        JSON.stringify({
          type: "connection",
          status: "connected",
          sessionId,
          timestamp: new Date().toISOString(),
        })
      );

      // Handle disconnect
      (ws as any).on("close", () => {
        this.removeClient(userId, sessionId);
        console.log(
          `Client disconnected: User ${userId}, Session ${sessionId}`
        );
      });

      // Handle pong for heartbeat
      (ws as any).on("pong", () => {
        (ws as any).isAlive = true;
      });

      // Send unread notifications count on connect
      this.sendUnreadCount(userId);
    } catch (error) {
      console.error("Authentication error:", error);
      ws.close(1008, "Authentication failed");
    }
  }

  /**
   * Remove a client connection
   */
  private static removeClient(userId: string, sessionId: string): void {
    const userClients = this.clients.get(userId);
    if (userClients) {
      const updatedClients = userClients.filter(
        (client) => client.sessionId !== sessionId
      );
      if (updatedClients.length > 0) {
        this.clients.set(userId, updatedClients);
      } else {
        this.clients.delete(userId);
      }
    }
  }

  /**
   * Send a notification to a specific user
   */
  static sendNotification(
    userId: string,
    notification: {
      id: string;
      title: string;
      message: string;
      type: NotificationType;
      category: NotificationCategory;
      link?: string;
      metadata?: any;
    }
  ): boolean {
    try {
      const userClients = this.clients.get(userId);

      if (!userClients || userClients.length === 0) {
        return false;
      }

      const payload = JSON.stringify({
        type: "notification",
        notification,
        timestamp: new Date().toISOString(),
      });

      // Send to all connected clients for this user
      userClients.forEach((client) => {
        client.connection.send(payload);
      });

      return true;
    } catch (error) {
      console.error("Error sending notification:", error);
      return false;
    }
  }

  /**
   * Send unread notification count to a user
   */
  static async sendUnreadCount(userId: string): Promise<void> {
    try {
      const userClients = this.clients.get(userId);

      if (!userClients || userClients.length === 0) {
        return;
      }

      // Get unread count from NotificationService
      const { NotificationService } = await import("./notification.service");
      const unreadCount = await NotificationService.getUnreadCount(userId);

      const payload = JSON.stringify({
        type: "unread_count",
        count: unreadCount,
        timestamp: new Date().toISOString(),
      });

      // Send to all connected clients for this user
      userClients.forEach((client) => {
        client.connection.send(payload);
      });
    } catch (error) {
      console.error("Error sending unread count:", error);
    }
  }

  /**
   * Send a subscription notification to a specific user
   */
  static sendSubscriptionNotification(
    userId: string,
    data: {
      subscriptionId: string;
      planName: string;
      status: string;
      daysRemaining?: number;
      expiryDate?: Date | string;
      action?: string;
    }
  ): boolean {
    try {
      const userClients = this.clients.get(userId);

      if (!userClients || userClients.length === 0) {
        return false;
      }

      const payload = JSON.stringify({
        type: "subscription_update",
        data,
        timestamp: new Date().toISOString(),
      });

      // Send to all connected clients for this user
      userClients.forEach((client) => {
        client.connection.send(payload);
      });

      return true;
    } catch (error) {
      console.error("Error sending subscription notification:", error);
      return false;
    }
  }

  /**
   * Broadcast a message to all connected users
   */
  static broadcast(message: any): void {
    try {
      const payload = JSON.stringify({
        type: "broadcast",
        message,
        timestamp: new Date().toISOString(),
      });

      this.wss.clients.forEach((client: any) => {
        if (client.readyState === 1 || client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      });
    } catch (error) {
      console.error("Error broadcasting message:", error);
    }
  }

  /**
   * Get connection statistics
   */
  static getStats(): {
    totalConnections: number;
    uniqueUsers: number;
    activeConnections: WebSocketClient[];
  } {
    const activeConnections: WebSocketClient[] = [];

    // Collect all active connections
    this.clients.forEach((userClients) => {
      activeConnections.push(...userClients);
    });

    return {
      totalConnections: activeConnections.length,
      uniqueUsers: this.clients.size,
      activeConnections,
    };
  }
}
