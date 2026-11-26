import { Request, Response } from "express";
import { getRepository } from "../config/database";
import { User } from "../entities/user.entity";
import { Organization } from "../entities/organization.entity";
import { Document } from "../entities/document.entity";
import { UserRole } from "../interface/user";
import {
  OrganizationStatus,
  OrganizationRole,
} from "../interface/organization";
import { DocumentStatus, DocumentType } from "../interface/document";
import { Address } from "../entities/address.entity";
import { AddressType } from "../interface/address";

// Default GST rate if none is set
const DEFAULT_GST_RATE = 18;

// In-memory storage for GST settings (replace with DB in production)
let gstSettings = {
  rate: DEFAULT_GST_RATE,
  isCompulsory: true,
  exemptionCategories: ["Export", "Special Economic Zone"],
  verificationRequired: true,
  lastUpdated: new Date(),
};

let vendorPolicies = [
  {
    id: "policy-1",
    title: "Vendor Code of Conduct",
    description:
      "Guidelines for ethical business practices, labor standards, and environmental responsibilities.",
    status: "active",
    updatedAt: "2024-01-15",
  },
  {
    id: "policy-2",
    title: "Payment Terms",
    description:
      "Standard payment schedule, accepted payment methods, and late payment consequences.",
    status: "active",
    updatedAt: "2024-02-20",
  },
];

let requiredDocuments = [
  "GST Registration Certificate",
  "PAN Card",
  "Business Registration/Certificate of Incorporation",
  "Bank Account Details",
];

// Define a custom request interface with the user property
interface CustomRequest extends Request {
  user?: any; // Using 'any' type for compatibility
}

export class VendorController {
  /**
   * Get all vendors with pagination
   */
  static async getVendors(req: Request, res: Response): Promise<void> {
    try {
      // Extract pagination parameters from query
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const locations = req.query.locations as string | undefined;

      const organizationRepository = getRepository(Organization);

      // Build query with filters
      let queryBuilder = organizationRepository
        .createQueryBuilder("organization")
        .leftJoinAndSelect("organization.user", "user")
        .leftJoinAndSelect(
          "organization.addresses",
          "address",
          "address.isDefault = :isDefault",
          { isDefault: true }
        )
        .orderBy("organization.createdAt", "DESC");

      // Handle status filter(s)
      if (status) {
        // If status contains commas, it's a multi-status filter
        if (status.includes(",")) {
          const statusArray = status
            .split(",")
            .map((s) => s.trim()) as OrganizationStatus[];
          // Use proper IN clause for enum values
          queryBuilder.andWhere("organization.status IN (:...statusArray)", {
            statusArray: statusArray,
          });
        } else {
          // Single status filter
          queryBuilder.andWhere("organization.status = :status", {
            status: status as OrganizationStatus,
          });
        }
      } else {
        // By default, only show approved vendors
        queryBuilder.andWhere("organization.status = :status", {
          status: OrganizationStatus.APPROVED,
        });
      }

      // Add search filter if provided
      if (search) {
        queryBuilder.andWhere(
          "(organization.name ILIKE :search OR " +
            "organization.gstNumber ILIKE :search OR " +
            "organization.email ILIKE :search OR " +
            "organization.phone ILIKE :search OR " +
            "user.firstName ILIKE :search OR " +
            "user.lastName ILIKE :search)",
          { search: `%${search}%` }
        );
      }

      // Add location filter if provided
      if (locations) {
        const locationArray = locations.split(",").map((loc) => loc.trim());
        queryBuilder.andWhere(
          "address.city ILIKE ANY(ARRAY[:...locationArray])",
          { locationArray: locationArray.map((loc) => `%${loc}%`) }
        );
      }

      // Add date range filters if provided
      if (startDate) {
        queryBuilder.andWhere("organization.createdAt >= :startDate", {
          startDate: new Date(startDate),
        });
      }

      if (endDate) {
        // Add one day to include the end date fully
        const endDatePlusOne = new Date(endDate);
        endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);

        queryBuilder.andWhere("organization.createdAt < :endDate", {
          endDate: endDatePlusOne,
        });
      }

      // Get organizations and total count in a single query
      const [organizations, total] = await queryBuilder
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      // Transform the data for the response
      const vendors = organizations.map((org) => {
        // Safe function to format date or return a fallback string
        const formatDate = (date: Date | string | null | undefined): string => {
          if (!date) return "";
          try {
            if (date instanceof Date) {
              return date.toISOString().split("T")[0];
            } else if (typeof date === "string") {
              return date;
            }
            return "";
          } catch (e) {
            console.log("Invalid date format:", date);
            return "";
          }
        };

        const address =
          org.addresses && org.addresses.length > 0 ? org.addresses[0] : null;

        return {
          id: org.id,
          name: org.name,
          businessName: org.businessName,
          email: org.email || "",
          phone: org.phone || "",
          gstNumber: org.gstNumber || "",
          panNumber: org.panNumber || "",
          businessType: org.businessType || "",
          yearEstablished: org.yearEstablished,
          website: org.website || "",
          status: org.status,
          createdAt: formatDate(org.createdAt),
          updatedAt: formatDate(org.updatedAt),
          address: address
            ? {
                city: address.city,
                state: address.state,
                country: address.country,
              }
            : null,
          contactPerson: org.user
            ? `${org.user.firstName} ${org.user.lastName}`
            : "",
          hasActiveSubscription: org.hasActiveSubscription || false,
        };
      });

      // Return paginated response
      res.json({
        vendors,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error("Error fetching vendors:", error);
      res.status(500).json({ message: "Error fetching vendors" });
    }
  }

  /**
   * Get vendor by ID
   */
  static async getVendorById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const organizationRepository = getRepository(Organization);

      const organization = await organizationRepository.findOne({
        where: { id },
        relations: ["user", "addresses"],
      });

      if (!organization) {
        res.status(404).json({ message: "Vendor not found" });
        return;
      }

      // Format the vendor data
      const formatDate = (date: Date | null): string => {
        return date ? date.toISOString().split("T")[0] : "";
      };

      const defaultAddress =
        organization.addresses?.find((addr: any) => addr.isDefault) || null;

      const vendorData = {
        id: organization.id,
        name: organization.name,
        businessName: organization.businessName,
        email: organization.email,
        phone: organization.phone,
        gstNumber: organization.gstNumber,
        panNumber: organization.panNumber,
        website: organization.website,
        businessType: organization.businessType,
        yearEstablished: organization.yearEstablished,
        status: organization.status,
        createdAt: formatDate(organization.createdAt),
        updatedAt: formatDate(organization.updatedAt),
        contactPerson: organization.user
          ? `${organization.user.firstName} ${organization.user.lastName}`
          : "",
        contactEmail: organization.user?.email || organization.email,
        contactPhone: organization.user?.phone || organization.phone,
        address: defaultAddress
          ? {
              addressLine1: defaultAddress.addressLine1,
              addressLine2: defaultAddress.addressLine2,
              city: defaultAddress.city,
              state: defaultAddress.state,
              postalCode: defaultAddress.postalCode,
              country: defaultAddress.country,
            }
          : null,
        hasActiveSubscription: organization.hasActiveSubscription || false,
        subscriptionDetails: organization.currentSubscriptionId
          ? {
              id: organization.currentSubscriptionId,
              startDate: formatDate(organization.subscriptionStartDate),
              endDate: formatDate(organization.subscriptionEndDate),
              isActive: organization.hasActiveSubscription,
            }
          : null,
      };

      res.json(vendorData);
    } catch (error) {
      console.error("Error fetching vendor:", error);
      res.status(500).json({ message: "Error fetching vendor details" });
    }
  }

  /**
   * Update vendor
   */
  static async updateVendor(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      // const adminUser = req.user!; // User is set by authentication middleware

      const organizationRepository = getRepository(Organization);
      const addressRepository = getRepository(Address);

      const organization = await organizationRepository.findOne({
        where: { id },
        relations: ["addresses"],
      });

      if (!organization) {
        res.status(404).json({ message: "Vendor not found" });
        return;
      }

      // Update organization fields
      const allowedFields = [
        "name",
        "businessName",
        "email",
        "phone",
        "gstNumber",
        "panNumber",
        "website",
        "businessType",
        "yearEstablished",
        "status",
        "adminNotes",
        "isActive",
      ];

      allowedFields.forEach((field) => {
        if (updateData[field] !== undefined) {
          (organization as any)[field] = updateData[field];
        }
      });

      // Save organization updates
      await organizationRepository.save(organization);

      // Update address if provided
      if (updateData.address) {
        let defaultAddress = organization.addresses?.find(
          (addr: any) => addr.isDefault
        );

        if (defaultAddress) {
          // Update existing address
          const addressFields = [
            "addressLine1",
            "addressLine2",
            "city",
            "state",
            "postalCode",
            "country",
          ];

          addressFields.forEach((field) => {
            if (updateData.address[field] !== undefined) {
              (defaultAddress as any)[field] = updateData.address[field];
            }
          });

          await addressRepository.save(defaultAddress);
        } else {
          // Create new address
          const newAddress = addressRepository.create({
            addressLine1: updateData.address.addressLine1,
            addressLine2: updateData.address.addressLine2,
            city: updateData.address.city,
            state: updateData.address.state,
            postalCode: updateData.address.postalCode,
            country: updateData.address.country,
            isDefault: true,
            organizationId: organization.id,
          });

          await addressRepository.save(newAddress);
        }
      }

      res.json({
        success: true,
        message: "Vendor updated successfully",
        id,
      });
    } catch (error) {
      console.error("Error updating vendor:", error);
      res.status(500).json({ message: "Error updating vendor" });
    }
  }

  /**
   * Delete vendor
   */
  static async deleteVendor(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const organizationRepository = getRepository(Organization);

      const organization = await organizationRepository.findOne({
        where: { id },
      });

      if (!organization) {
        res.status(404).json({ message: "Vendor not found" });
        return;
      }

      // Soft delete by setting isActive to false
      organization.isActive = false;
      await organizationRepository.save(organization);

      res.json({
        success: true,
        message: "Vendor deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting vendor:", error);
      res.status(500).json({ message: "Error deleting vendor" });
    }
  }

  /**
   * Handle vendor reapplication
   */
  static async reapplyVendor(req: CustomRequest, res: Response): Promise<void> {
    try {
      // Get the authenticated user
      const user = req.user!;
      const userId = user.id;

      // Get the organization associated with the user
      const organizationRepository = getRepository(Organization);
      const addressRepository = getRepository(Address);

      const organization = await organizationRepository.findOne({
        where: { id: user.organization?.id },
      });

      if (!organization) {
        res.status(404).json({ message: "Organization not found" });
        return;
      }

      // Check if the organization is in REJECTED status
      if (organization.status !== OrganizationStatus.REJECTED) {
        res.status(400).json({
          message: "Only rejected vendors can reapply",
          currentStatus: organization.status,
        });
        return;
      }

      // Extract reapplication data from request body
      const {
        businessName,
        gstNumber,
        panNumber,
        businessType,
        address,
        reason,
      } = req.body; // Fix: Added initializer

      // Update organization details
      organization.businessName = businessName || organization.businessName;
      organization.gstNumber = gstNumber || organization.gstNumber;
      organization.panNumber = panNumber || organization.panNumber;
      organization.businessType = businessType || organization.businessType;

      // Add the reapplication reason to admin notes
      organization.adminNotes = `Reapplication reason: ${reason}\n\nPrevious notes: ${
        organization.adminNotes || ""
      }`;

      // Important: Set status back to PENDING
      organization.status = OrganizationStatus.PENDING;
      organization.applicationDate = new Date();

      // Save updated organization
      await organizationRepository.save(organization);

      // Update address if provided
      if (address) {
        // Find existing address or create new one
        let existingAddress = await addressRepository.findOne({
          where: {
            organizationId: organization.id,
            isDefault: true,
          },
        });

        if (existingAddress) {
          // Update existing address
          existingAddress.addressLine1 =
            address.street || existingAddress.addressLine1;
          existingAddress.city = address.city || existingAddress.city;
          existingAddress.state = address.state || existingAddress.state;
          existingAddress.postalCode =
            address.zipCode || existingAddress.postalCode;
          existingAddress.country = address.country || existingAddress.country;

          await addressRepository.save(existingAddress);
        } else {
          // Create new address
          const newAddress = addressRepository.create({
            addressLine1: address.street,
            city: address.city,
            state: address.state,
            postalCode: address.zipCode,
            country: address.country,
            isDefault: true,
            addressType: AddressType.BOTH,
            organizationId: organization.id,
          });

          await addressRepository.save(newAddress);
        }
      }

      res.status(200).json({
        message: "Vendor reapplication submitted successfully",
        organizationId: organization.id,
        status: organization.status,
      });
    } catch (error) {
      console.error("Error processing vendor reapplication:", error);
      res
        .status(500)
        .json({ message: "Error processing vendor reapplication" });
    }
  }

  /**
   * Get GST settings
   */
  static async getGSTSettings(req: Request, res: Response): Promise<void> {
    try {
      // In a real application, this would be fetched from a database
      res.json({
        success: true,
        ...gstSettings,
      });
    } catch (error) {
      console.error("Error fetching GST settings:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch GST settings",
      });
    }
  }

  /**
   * Update GST settings
   */
  static async updateGSTSettings(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const { rate, isCompulsory, exemptionCategories, verificationRequired } =
        req.body;

      // Validate rate
      if (rate !== undefined && (isNaN(rate) || rate < 0 || rate > 100)) {
        res.status(400).json({
          success: false,
          message: "Invalid GST rate. Rate must be between 0 and 100.",
        });
        return;
      }

      // Update settings (in a real app, this would update a database)
      gstSettings = {
        rate: rate !== undefined ? Number(rate) : gstSettings.rate,
        isCompulsory:
          isCompulsory !== undefined ? isCompulsory : gstSettings.isCompulsory,
        exemptionCategories:
          exemptionCategories || gstSettings.exemptionCategories,
        verificationRequired:
          verificationRequired !== undefined
            ? verificationRequired
            : gstSettings.verificationRequired,
        lastUpdated: new Date(),
      };

      res.json({
        success: true,
        message: "GST settings updated successfully",
        ...gstSettings,
      });
    } catch (error) {
      console.error("Error updating GST settings:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update GST settings",
      });
    }
  }

  /**
   * Get vendor policies
   */
  static async getVendorPolicies(req: Request, res: Response): Promise<void> {
    try {
      res.json({
        success: true,
        policies: vendorPolicies,
      });
    } catch (error) {
      console.error("Error fetching vendor policies:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch vendor policies",
      });
    }
  }

  /**
   * Update vendor policies
   */
  static async updateVendorPolicies(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const { policies } = req.body;

      if (!Array.isArray(policies)) {
        res.status(400).json({
          success: false,
          message: "Policies must be an array",
        });
        return;
      }

      vendorPolicies = policies;

      res.json({
        success: true,
        message: "Vendor policies updated successfully",
        policies: vendorPolicies,
      });
    } catch (error) {
      console.error("Error updating vendor policies:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update vendor policies",
      });
    }
  }

  /**
   * Get required documents
   */
  static async getRequiredDocuments(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      res.json({
        success: true,
        documents: requiredDocuments,
      });
    } catch (error) {
      console.error("Error fetching required documents:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch required documents",
      });
    }
  }

  /**
   * Update required documents
   */
  static async updateRequiredDocuments(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const { documents } = req.body;

      if (!Array.isArray(documents)) {
        res.status(400).json({
          success: false,
          message: "Documents must be an array",
        });
        return;
      }

      requiredDocuments = documents;

      res.json({
        success: true,
        message: "Required documents updated successfully",
        documents: requiredDocuments,
      });
    } catch (error) {
      console.error("Error updating required documents:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update required documents",
      });
    }
  }

  /**
   * Get vendors by status
   */
  static async getVendorsByStatus(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      // Check if user has admin privileges
      if (
        !req.user ||
        (req.user.role !== UserRole.ADMIN &&
          req.user.role !== UserRole.SUPER_ADMIN)
      ) {
        res.status(403).json({
          message: "Only administrators can access vendor status information",
        });
        return;
      }

      const status = req.params.status || "active";
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      // Get organization repository
      const organizationRepository = getRepository(Organization);

      // Build the query with relations
      const queryBuilder = organizationRepository
        .createQueryBuilder("org")
        .leftJoinAndSelect(
          "org.users",
          "user",
          "user.organizationRole = :ownerRole",
          { ownerRole: OrganizationRole.OWNER }
        )
        .leftJoinAndSelect("org.addresses", "address")
        .leftJoinAndSelect("org.documents", "document")
        .where("org.status = :status", { status: status.toUpperCase() });

      // Get total count
      const totalCount = await queryBuilder.getCount();

      // Get paginated results
      const organizations = await queryBuilder
        .orderBy("org.createdAt", "DESC")
        .skip(offset)
        .take(limit)
        .getMany();

      // Map to response format
      const vendors = organizations.map((org) => {
        const owner = org.users.find(
          (u: User) => u.organizationRole === OrganizationRole.OWNER
        );

        return {
          id: org.id,
          name: org.name,
          status: org.status,
          email: org.email,
          phone: org.phone,
          website: org.website,
          businessType: org.businessType,
          gstNumber: org.gstNumber,
          panNumber: org.panNumber,
          yearEstablished: org.yearEstablished,
          applicationDate: org.applicationDate,
          approvalDate: org.approvalDate,
          adminNotes: org.adminNotes,
          createdAt: org.createdAt,
          owner: owner
            ? {
                id: owner.id,
                firstName: owner.firstName,
                lastName: owner.lastName,
                email: owner.email,
                phone: owner.phone,
              }
            : null,
          address:
            org.addresses.length > 0
              ? {
                  addressLine1: org.addresses[0].addressLine1,
                  addressLine2: org.addresses[0].addressLine2,
                  city: org.addresses[0].city,
                  state: org.addresses[0].state,
                  postalCode: org.addresses[0].postalCode,
                  country: org.addresses[0].country,
                }
              : null,
          documents: org.documents.map((doc: Document) => ({
            id: doc.id,
            name: doc.name,
            type: doc.documentType,
            status: doc.status,
            url: doc.url,
          })),
        };
      });

      res.status(200).json({
        results: vendors,
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      });
    } catch (error) {
      console.error("Error getting vendors by status:", error);
      res.status(500).json({ message: "Error getting vendors by status" });
    }
  }

  /**
   * Get vendor settings (aggregated settings)
   */
  static async getVendorSettings(req: Request, res: Response): Promise<void> {
    try {
      // Aggregate settings into a single response object
      const settings = {
        gst: {
          rate: gstSettings.rate || 18,
          isCompulsory:
            gstSettings.isCompulsory !== undefined
              ? gstSettings.isCompulsory
              : true,
          exemptionCategories: gstSettings.exemptionCategories || [],
          verificationRequired:
            gstSettings.verificationRequired !== undefined
              ? gstSettings.verificationRequired
              : true,
        },
        documents: requiredDocuments || [],
        policies: vendorPolicies || [],
      };

      res.json({
        success: true,
        settings,
      });
    } catch (error) {
      console.error("Error fetching vendor settings:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch vendor settings",
      });
    }
  }
}
