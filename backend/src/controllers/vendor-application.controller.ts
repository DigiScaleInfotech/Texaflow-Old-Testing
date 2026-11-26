import { Request, Response } from "express";
import { getRepository } from "../config/database";
import { Organization } from "../entities/organization.entity";
import { User } from "../entities/user.entity";
import { Document } from "../entities/document.entity";
import { OrganizationStatus } from "../interface/organization";
import { MailService } from "../services/mail.service";

// Define a custom request interface with the user property
interface CustomRequest extends Request {
  user?: any;
}

export class VendorApplicationController {
  /**
   * Get all vendor applications with pagination and filtering
   */
  static async getVendorApplications(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user!.id;

      // Extract query parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const status = req.query.status as OrganizationStatus | "all";

      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100) {
        res.status(400).json({
          message:
            "Invalid pagination parameters. Page must be >= 1 and limit must be between 1 and 100.",
        });
        return;
      }

      const organizationRepository = getRepository(Organization);

      // Build query for vendor applications
      let queryBuilder = organizationRepository
        .createQueryBuilder("organization")
        .leftJoinAndSelect("organization.user", "user")
        .leftJoinAndSelect(
          "organization.addresses",
          "address",
          "address.isDefault = :isDefault",
          { isDefault: true }
        )
        .leftJoinAndSelect("organization.documents", "documents"); // Include documents relation

      // Exclude applications with email admin@textiles.com
      queryBuilder = queryBuilder.where("organization.email != :adminEmail", {
        adminEmail: "admin@textiles.com",
      });

      // Filter by status - fix the syntax errors in the query
      if (!status || status === "all") {
        // No status filter needed when "all" is selected
        // Don't restrict default results like before
      } else {
        // Filter by specific status
        queryBuilder = queryBuilder.andWhere("organization.status = :status", {
          status,
        });
      }

      // Apply search filter if provided
      if (search) {
        queryBuilder = queryBuilder.andWhere(
          "(organization.name ILIKE :search OR " +
            "organization.email ILIKE :search OR " +
            "organization.phone ILIKE :search OR " +
            "organization.gstNumber ILIKE :search OR " +
            "organization.personalContactName ILIKE :search)",
          { search: `%${search}%` }
        );
      }

      // Get total count
      const total = await queryBuilder.getCount();
      console.log(`Total applications: ${total}`);

      // Apply pagination
      const applications = await queryBuilder
        .orderBy("organization.applicationDate", "DESC")
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

      console.log(`Found ${applications.length} applications`);

      // Transform data for frontend
      const formattedApplications = applications.map((app) => {
        // Get documents for this organization
        const docs = app.documents || [];

        return {
          id: app.id,
          organizationName: app.name,
          contactPerson: app.personalContactName || "Unknown",
          email: app.email || "",
          phone: app.phone || app.businessContactNumber || "",
          gstNumber: app.gstNumber || "",
          businessType: app.businessType || "vendor",
          applicationDate: app.applicationDate || app.createdAt,
          status: app.status || OrganizationStatus.PENDING,
          address:
            app.addresses && app.addresses.length > 0 ? app.addresses[0] : null,
          notes: app.adminNotes || "",
          documents: docs.map((doc: any) => ({
            id: doc.id,
            name: doc.name,
            type: doc.documentType,
            url: doc.url,
            status: doc.status,
          })),
        };
      });

      res.json({
        applications: formattedApplications,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error("Error fetching vendor applications:", error);
      res.status(500).json({ message: "Error fetching vendor applications" });
    }
  }

  /**
   * Get vendor application by ID
   */
  static async getVendorApplicationById(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      console.log(`Getting vendor application by ID: ${req.params.id}`);
      const { id } = req.params;

      const organizationRepository = getRepository(Organization);
      const documentRepository = getRepository(Document);

      // Find application by ID with documents
      const application = await organizationRepository.findOne({
        where: {
          id,
          // status: OrganizationStatus.PENDING || OrganizationStatus.REJECTED,
        },
        relations: ["user", "addresses", "documents"],
      });

      console.log("Found application:", application ? "yes" : "no");

      if (!application) {
        console.log(`Application with ID ${id} not found`);
        res.status(404).json({ message: "Vendor application not found" });
        return;
      }

      // Get documents for this organization (in case the relation didn't work)
      const documents =
        application.documents ||
        (await documentRepository.find({
          where: { organizationId: id },
        }));

      // Format the application for frontend
      const formattedApplication = {
        id: application.id,
        organizationName: application.name,
        contactPerson: application.personalContactName,
        email: application.email,
        phone: application.phone || application.businessContactNumber,
        gstNumber: application.gstNumber,
        businessType: application.businessType,
        applicationDate: application.applicationDate,
        status: application.status,
        address:
          application.addresses && application.addresses.length > 0
            ? application.addresses[0]
            : null,
        notes: application.adminNotes,
        documents: documents.map((doc: any) => ({
          id: doc.id,
          name: doc.name,
          type: doc.documentType,
          url: doc.url,
          status: doc.status,
          mimeType: doc.mimeType,
        })),
      };

      console.log("Sending formatted application data to client");
      res.json({ application: formattedApplication });
    } catch (error) {
      console.error("Error fetching vendor application:", error);
      res.status(500).json({ message: "Error fetching vendor application" });
    }
  }

  /**
   * Update vendor application status
   */
  static async updateVendorApplicationStatus(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const status = req.body.status;
      const notes = req.body.notes || req.body.adminNotes;

      console.log(
        `Updating vendor application ${id} to status: ${status}, notes: ${notes}`
      );

      if (
        !Object.values(OrganizationStatus).includes(
          status as OrganizationStatus
        )
      ) {
        res.status(400).json({ message: "Invalid status value" });
        return;
      }

      const organizationRepository = getRepository(Organization);
      const documentRepository = getRepository(Document);
      const userRepository = getRepository(User);

      // Find application by ID with associated user
      const application = await organizationRepository.findOne({
        where: { id },
        relations: ["user"],
      });

      if (!application) {
        res.status(404).json({ message: "Vendor application not found" });
        return;
      }

      // Get previous status to check if status is changing
      const previousStatus = application.status;

      // Update status
      application.status = status as OrganizationStatus;
      if (notes) {
        application.adminNotes = notes;
      }

      // Save with try-catch to handle specific database errors
      try {
        await organizationRepository.save(application);
      } catch (err: any) {
        console.error("Database error saving organization:", err);
        res.status(500).json({
          message: "Error updating vendor application status in database",
          details: err.message,
        });
        return;
      }

      // If application is approved, also activate user
      if (status === OrganizationStatus.APPROVED && application.user) {
        try {
          application.user.isActive = true;
          await userRepository.save(application.user);
        } catch (uErr) {
          console.warn("Could not activate user:", uErr);
        }
      }

      // Also update document statuses if application is approved or rejected
      if (
        status === OrganizationStatus.APPROVED ||
        status === OrganizationStatus.REJECTED
      ) {
        try {
          const documents = await documentRepository.find({
            where: { organizationId: id },
          });

          if (documents.length > 0) {
            for (const doc of documents) {
              doc.status =
                status === OrganizationStatus.APPROVED
                  ? "approved"
                  : "rejected";
            }
            await documentRepository.save(documents);
          }
        } catch (err) {
          console.error("Error updating document statuses:", err);
          // Don't fail the whole request if document update fails
          // Just log it and continue
        }
      }

      // Send email notification if application status changed to approved or rejected
      if (previousStatus !== status && application.user) {
        try {
          const user = application.user;

          if (status === OrganizationStatus.APPROVED) {
            await MailService.sendApplicationStatusEmail(
              user,
              "approved",
              application.name,
              notes ||
                "Your application has been approved. You can now access the vendor portal."
            );
            console.log(`Sent application approval email to ${user.email}`);
          } else if (status === OrganizationStatus.REJECTED) {
            await MailService.sendApplicationStatusEmail(
              user,
              "rejected",
              application.name,
              notes ||
                "Your application has been rejected. Please review the admin notes for details."
            );
            console.log(`Sent application rejection email to ${user.email}`);
          }
        } catch (emailError) {
          console.error("Failed to send notification email:", emailError);
          // Don't fail the main request if email sending fails
        }
      }

      // Get updated documents
      const updatedDocuments = await documentRepository.find({
        where: { organizationId: id },
      });

      res.json({
        message: "Vendor application status updated successfully",
        application,
        documents: updatedDocuments.map((doc) => ({
          id: doc.id,
          name: doc.name,
          type: doc.documentType,
          url: doc.url,
          status: doc.status,
        })),
      });
    } catch (error: any) {
      console.error("Error updating vendor application:", error);
      // Provide more detailed error message
      res.status(500).json({
        message: "Error updating vendor application",
        details: error.message || "Unknown error occurred",
      });
    }
  }
}
