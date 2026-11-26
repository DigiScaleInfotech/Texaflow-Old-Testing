import { Request, Response } from "express";
import { getRepository } from "../config/database";
import { User } from "../entities/user.entity";
import { UserRole } from "../interface/user";
import { MailService, VendorInfo } from "../services/mail.service";
import { VendorMessage } from "../entities/vendor-message.entity";
import { NotificationService } from "../services/notification.service";
import {
  NotificationType,
  NotificationCategory,
} from "../interface/notification";
import { QueueService } from "../services/queue.service";
import { Customer } from "../entities/customer.entity";
import { Organization } from "../entities/organization.entity";
import { OrganizationSubscription } from "../entities/organization-subscription.entity";
import { SubscriptionStatus } from "../interface/subscription"; // Fix the import path

// Add interface for custom request with user
interface CustomRequest extends Request {
  user?: any;
}

export class VendorMessageController {
  /**
   * Send message from vendor to admin
   */
  static async sendMessageToAdmin(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      // Check if user is a vendor
      if (!req.user || req.user.role !== UserRole.VENDOR) {
        res
          .status(403)
          .json({ message: "Only vendors can send messages to admin" });
        return;
      }

      const { subject, message, reason } = req.body;

      // Validate request
      if (!subject || !message || !reason) {
        res
          .status(400)
          .json({ message: "Subject, message, and reason are required" });
        return;
      }

      // Get full user data with organization
      const userRepository = getRepository(User);
      const vendor = await userRepository.findOne({
        where: { id: req.user.id },
        relations: ["organization"],
      });

      if (!vendor) {
        res.status(404).json({ message: "Vendor not found" });
        return;
      }

      // Check if vendor has a premium plan (plan-4)
      const subscriptionRepository = getRepository(OrganizationSubscription);
      const activeSubscription = await subscriptionRepository.findOne({
        where: {
          organizationId: vendor.organization?.id,
          status: SubscriptionStatus.ACTIVE,
        },
        relations: ["plan"],
      });

      // Determine if this is a premium plan based on plan properties instead of ID
      const isPremiumPlan =
        activeSubscription?.plan?.name?.toLowerCase().includes("premium") ||
        activeSubscription?.plan?.price >= 2000; // Assuming premium plans cost at least 2000

      // Store message in database
      const vendorMessageRepository = getRepository(VendorMessage);
      const vendorMessage = vendorMessageRepository.create({
        vendorId: vendor.id,
        subject,
        message,
        reason,
        organizationId: vendor.organization?.id,
        isPriority: isPremiumPlan || false, // Mark as priority if vendor has premium plan
      });

      await vendorMessageRepository.save(vendorMessage);

      // Create vendor info object for email
      const vendorInfo: VendorInfo = {
        id: vendor.id,
        firstName: vendor.firstName,
        lastName: vendor.lastName,
        email: vendor.email,
        organization: vendor.organization
          ? {
              id: vendor.organization.id,
              name: vendor.organization.name,
            }
          : undefined,
      };

      // Queue email task for background processing instead of sending directly
      await QueueService.addTask("mail", {
        type: "vendor-message",
        data: {
          vendor: vendorInfo,
          subject,
          message,
          reason,
        },
      });

      // Create notification for admin users
      try {
        await NotificationService.notifyUsersByRole(
          UserRole.ADMIN,
          "New Vendor Message",
          `${vendor.firstName} ${vendor.lastName} from ${
            vendor.organization?.name || "Unknown"
          } has sent a new message: ${subject}`,
          NotificationType.INFO,
          NotificationCategory.VENDOR_MANAGEMENT,
          {
            link: "/admin/vendor-messages",
            metadata: {
              messageId: vendorMessage.id,
              vendorId: vendor.id,
              subject,
              reason,
            },
          }
        );
      } catch (notifError) {
        console.error("Error creating admin notification:", notifError);
        // Continue despite notification error
      }

      // Return success response immediately
      res.status(200).json({
        message: "Message sent to admin successfully",
        success: true,
        data: vendorMessage,
      });
    } catch (error) {
      console.error("Error sending message to admin:", error);
      res.status(500).json({ message: "Error sending message to admin" });
    }
  }

  /**
   * Get vendor messages for admin
   */
  static async getVendorMessagesForAdmin(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      // Check if user is an admin
      if (
        !req.user ||
        (req.user.role !== UserRole.ADMIN &&
          req.user.role !== UserRole.SUPER_ADMIN)
      ) {
        res
          .status(403)
          .json({ message: "Only administrators can access vendor messages" });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;
      const isRead =
        req.query.isRead === "true"
          ? true
          : req.query.isRead === "false"
          ? false
          : undefined;
      const search = req.query.search as string;

      // Build query
      const vendorMessageRepository = getRepository(VendorMessage);
      const queryBuilder = vendorMessageRepository
        .createQueryBuilder("message")
        .leftJoinAndSelect("message.vendor", "vendor")
        .leftJoinAndSelect("vendor.organization", "organization");

      // Apply filters
      if (isRead !== undefined) {
        queryBuilder.andWhere("message.isRead = :isRead", { isRead });
      }

      if (search) {
        queryBuilder.andWhere(
          "(message.subject ILIKE :search OR message.message ILIKE :search OR vendor.firstName ILIKE :search OR vendor.lastName ILIKE :search OR organization.name ILIKE :search)",
          { search: `%${search}%` }
        );
      }

      // Get total count
      const total = await queryBuilder.getCount();

      // Add pagination and ordering - put priority messages first, then by date
      queryBuilder
        .orderBy("message.isPriority", "DESC") // Priority messages first
        .addOrderBy("message.createdAt", "DESC") // Then by date
        .skip(offset)
        .take(limit);

      const messages = await queryBuilder.getMany();

      res.status(200).json({
        results: messages,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error("Error fetching vendor messages:", error);
      res.status(500).json({ message: "Error fetching vendor messages" });
    }
  }

  /**
   * Mark vendor message as read
   */
  static async markMessageAsRead(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      // Check if user is an admin
      if (
        !req.user ||
        (req.user.role !== UserRole.ADMIN &&
          req.user.role !== UserRole.SUPER_ADMIN)
      ) {
        res
          .status(403)
          .json({ message: "Only administrators can mark messages as read" });
        return;
      }

      const { messageId } = req.params;

      const vendorMessageRepository = getRepository(VendorMessage);
      const message = await vendorMessageRepository.findOne({
        where: { id: messageId },
      });

      if (!message) {
        res.status(404).json({ message: "Message not found" });
        return;
      }

      // Update message status
      message.isRead = true;
      await vendorMessageRepository.save(message);

      res.status(200).json({
        message: "Message marked as read",
        data: message,
      });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Error marking message as read" });
    }
  }

  /**
   * Admin reply to vendor message
   */
  static async replyToVendorMessage(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      // Check if user is an admin
      if (
        !req.user ||
        (req.user.role !== UserRole.ADMIN &&
          req.user.role !== UserRole.SUPER_ADMIN)
      ) {
        res.status(403).json({
          message: "Only administrators can reply to vendor messages",
        });
        return;
      }

      const { messageId } = req.params;
      const { response } = req.body;

      if (!response || response.trim() === "") {
        res.status(400).json({ message: "Response message is required" });
        return;
      }

      // Get the message with vendor information
      const vendorMessageRepository = getRepository(VendorMessage);
      const message = await vendorMessageRepository.findOne({
        where: { id: messageId },
        relations: ["vendor", "vendor.organization"],
      });

      if (!message) {
        res.status(404).json({ message: "Message not found" });
        return;
      }

      // Update message with admin response
      message.adminResponse = response;
      message.adminResponseDate = new Date();
      message.isRead = true;
      await vendorMessageRepository.save(message);

      // Queue email task for background processing
      try {
        await QueueService.addTask("mail", {
          type: "admin-response",
          data: {
            vendor: message.vendor,
            originalSubject: message.subject,
            adminResponse: response,
            originalMessage: message.message,
          },
        });
      } catch (emailError) {
        console.error("Error queueing admin response email:", emailError);
        // Continue despite email error
      }

      // Create notification for vendor
      try {
        await NotificationService.createNotification(
          message.vendorId,
          "Admin Response",
          `Admin has responded to your message: ${message.subject}`,
          NotificationType.INFO,
          NotificationCategory.VENDOR_MANAGEMENT,
          {
            link: "/support",
            metadata: {
              messageId: message.id,
              subject: message.subject,
            },
          }
        );
      } catch (notifError) {
        console.error("Error creating vendor notification:", notifError);
        // Continue despite notification error
      }

      res.status(200).json({
        message: "Response sent to vendor successfully",
        data: message,
      });
    } catch (error) {
      console.error("Error replying to vendor message:", error);
      res.status(500).json({ message: "Error replying to vendor message" });
    }
  }

  /**
   * Get message history for a vendor
   */
  static async getVendorMessageHistory(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      // Check if user is a vendor
      if (!req.user || req.user.role !== UserRole.VENDOR) {
        res
          .status(403)
          .json({ message: "Only vendors can access their message history" });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;
      const filter = (req.query.filter as string) || "all"; // 'all', 'answered', 'pending'

      // Build the query
      const vendorMessageRepository = getRepository(VendorMessage);
      const queryBuilder = vendorMessageRepository
        .createQueryBuilder("message")
        .where("message.vendorId = :vendorId", { vendorId: req.user.id })
        .orderBy("message.createdAt", "DESC");

      // Apply filter
      if (filter === "answered") {
        queryBuilder.andWhere("message.adminResponse IS NOT NULL");
      } else if (filter === "pending") {
        queryBuilder.andWhere("message.adminResponse IS NULL");
      }

      // Get total count for pagination
      const total = await queryBuilder.getCount();

      // Apply pagination
      const messages = await queryBuilder.skip(offset).take(limit).getMany();

      res.status(200).json({
        data: messages,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error("Error fetching vendor message history:", error);
      res.status(500).json({ message: "Error fetching message history" });
    }
  }

  /**
   * Send email to customer (from admin or vendor)
   */
  static async sendEmailToCustomer(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const { customerId, subject, message } = req.body;

      if (!customerId || !subject || !message) {
        res
          .status(400)
          .json({ message: "customerId, subject, and message are required" });
        return;
      }

      // Fetch customer with organization details, similar to how OrganizationController does it
      const customerRepo = getRepository(Customer);
      const customer = await customerRepo.findOne({
        where: { id: customerId },
        relations: ["organization", "organization.addresses"],
      });

      if (!customer) {
        res.status(404).json({ message: "Customer not found" });
        return;
      }

      // Get organization details from user if available (for sender context)
      const organizationId = req.user?.organization?.id;
      let senderOrganization = null;

      if (organizationId) {
        const organizationRepo = getRepository(Organization);
        senderOrganization = await organizationRepo.findOne({
          where: { id: organizationId },
        });
      }

      // Queue email task for background processing
      try {
        await QueueService.addTask("mail", {
          type: "customer-email",
          data: {
            customer: {
              id: customer.id,
              name: customer.name,
              email: customer.email,
              organization: customer.organization
                ? {
                    id: customer.organization.id,
                    name: customer.organization.name,
                    address: customer.organization.addresses
                      ? customer.organization.addresses[0]?.formattedAddress
                      : customer.organization.address,
                  }
                : undefined,
            },
            subject,
            message,
            sentBy: req.user?.id || "system",
            senderName: req.user
              ? `${req.user.firstName} ${req.user.lastName}`
              : "System",
            senderOrganization: senderOrganization
              ? {
                  name: senderOrganization.name,
                  businessName: senderOrganization.businessName,
                  logo: senderOrganization.logo,
                }
              : null,
          },
        });

        res.status(200).json({
          message: "Email queued for delivery to customer",
          success: true,
        });
      } catch (queueError) {
        console.error("Error queueing customer email:", queueError);
        res.status(500).json({ message: "Error queueing email for delivery" });
      }
    } catch (error) {
      console.error("Error processing email to customer:", error);
      res.status(500).json({ message: "Error processing email to customer" });
    }
  }
}
