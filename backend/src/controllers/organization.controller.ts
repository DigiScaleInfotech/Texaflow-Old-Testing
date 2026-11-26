import { Request, Response } from "express";
import { getRepository } from "../config/database";
import { Organization } from "../entities/organization.entity";
import { OrganizationSettings } from "../entities/organization-settings.entity";
import { OrganizationStatus } from "../interface/organization";
import { Address } from "../entities/address.entity";
import { User } from "../entities/user.entity";

// Define custom request interface with user property
interface CustomRequest extends Request {
  user?: any;
}

export class OrganizationController {
  /**
   * Get all organizations with pagination
   */
  static async getAllOrganizations(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const organizationRepository = getRepository(Organization);

      const [organizations, total] = await organizationRepository.findAndCount({
        skip,
        take: limit,
        relations: ["user", "addresses"],
        order: { createdAt: "DESC" },
      });

      res.json({
        data: organizations,
        meta: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ message: "Error fetching organizations" });
    }
  }

  /**
   * Get organization by ID
   */
  static async getOrganizationById(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;

      // Check if this is a settings request instead of an organization ID
      if (id.includes("-settings") || !isUUID(id)) {
        return OrganizationController.getOrganizationSettings(req, res);
      }

      console.log("Getting organization with ID:", id);

      const organizationRepository = getRepository(Organization);
      const organization = await organizationRepository.findOne({
        where: { id },
        relations: ["user", "addresses"],
      });

      if (!organization) {
        res.status(404).json({ message: "Organization not found" });
        return;
      }

      res.json(organization);
    } catch (error) {
      console.error("Error fetching organization:", error);
      res.status(500).json({ message: "Error fetching organization" });
    }
  }

  /**
   * Get current organization for logged in user
   */
  static async getCurrentOrganization(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const organizationId = req.user?.organization?.id;

      if (!organizationId) {
        res
          .status(404)
          .json({ message: "No organization found for this user" });
        return;
      }

      const organizationRepository = getRepository(Organization);
      const organization = await organizationRepository.findOne({
        where: { id: organizationId },
        relations: ["user", "addresses"],
      });

      if (organization) {
        // Remove sensitive fields before sending response
        if (organization.password) {
          delete organization.password;
        }
        if (organization.user && organization.user.password) {
          delete organization.user.password;
        }
      }
      if (organization && Array.isArray(organization.addresses)) {
        organization.addresses = organization.addresses.map(addr => {
          // Remove any sensitive fields from address if needed
          return addr;
        });
      }

      if (!organization) {
        res.status(404).json({ message: "Organization not found" });
        return;
      }

      res.json(organization);
    } catch (error) {
      console.error("Error fetching current organization:", error);
      res.status(500).json({ message: "Error fetching current organization" });
    }
  }

  /**
   * Create a new organization
   */
  static async createOrganization(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const organizationData = req.body;
      const organizationRepository = getRepository(Organization);

      const organization = organizationRepository.create(organizationData);
      await organizationRepository.save(organization);

      res.status(201).json({
        message: "Organization created successfully",
        organization,
      });
    } catch (error) {
      console.error("Error creating organization:", error);
      res.status(500).json({ message: "Error creating organization" });
    }
  }

  /**
   * Update an organization
   */
  static async updateOrganization(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      const organizationRepository = getRepository(Organization);

      // Check if the organization exists
      const organization = await organizationRepository.findOne({
        where: { id },
      });

      if (!organization) {
        res.status(404).json({ message: "Organization not found" });
        return;
      }

      // Check if user has permission (admin or owner of the organization)
      if (
        req.user &&
        (req.user.role === "admin" ||
          req.user.role === "super_admin" ||
          req.user.organization?.id === id)
      ) {
        // Update the organization
        Object.assign(organization, updates);
        await organizationRepository.save(organization);

        res.json({
          message: "Organization updated successfully",
          organization,
        });
      } else {
        res.status(403).json({
          message: "You don't have permission to update this organization",
        });
      }
    } catch (error) {
      console.error("Error updating organization:", error);
      res.status(500).json({ message: "Error updating organization" });
    }
  }

  /**
   * Delete an organization
   */
  static async deleteOrganization(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const organizationRepository = getRepository(Organization);

      const organization = await organizationRepository.findOne({
        where: { id },
      });

      if (!organization) {
        res.status(404).json({ message: "Organization not found" });
        return;
      }

      await organizationRepository.remove(organization);

      res.json({ message: "Organization deleted successfully" });
    } catch (error) {
      console.error("Error deleting organization:", error);
      res.status(500).json({ message: "Error deleting organization" });
    }
  }

  /**
   * Approve an organization
   */
  static async approveOrganization(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const organizationRepository = getRepository(Organization);

      const organization = await organizationRepository.findOne({
        where: { id },
      });

      if (!organization) {
        res.status(404).json({ message: "Organization not found" });
        return;
      }

      organization.isActive = true;
      await organizationRepository.save(organization);

      res.json({ message: "Organization approved successfully", organization });
    } catch (error) {
      console.error("Error approving organization:", error);
      res.status(500).json({ message: "Error approving organization" });
    }
  }

  /**
   * Reject an organization
   */
  static async rejectOrganization(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const organizationRepository = getRepository(Organization);

      const organization = await organizationRepository.findOne({
        where: { id },
      });

      if (!organization) {
        res.status(404).json({ message: "Organization not found" });
        return;
      }

      organization.isActive = false;
      organization.adminNotes = reason || organization.adminNotes;
      await organizationRepository.save(organization);

      res.json({ message: "Organization rejected", organization });
    } catch (error) {
      console.error("Error rejecting organization:", error);
      res.status(500).json({ message: "Error rejecting organization" });
    }
  }

  /**
   * Search organizations
   */
  static async searchOrganizations(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const { query } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const organizationRepository = getRepository(Organization);

      const [organizations, total] = await organizationRepository
        .createQueryBuilder("org")
        .where(
          "org.name LIKE :query OR org.businessName LIKE :query OR org.email LIKE :query",
          { query: `%${query}%` }
        )
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      res.json({
        data: organizations,
        meta: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error searching organizations:", error);
      res.status(500).json({ message: "Error searching organizations" });
    }
  }

  /**
   * Update organization salary settings
   */
  static async updateSalarySettings(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const organizationId = req.user?.organization?.id;
      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      const { salaryPayDay, salaryAutoPayEnabled } = req.body;
      console.log("Received salary settings update:", req.body);

      // Validate pay day (1-28)
      if (
        salaryPayDay !== undefined &&
        (salaryPayDay < 1 || salaryPayDay > 28)
      ) {
        res.status(400).json({ message: "Pay day must be between 1 and 28" });
        return;
      }

      const organizationRepository = getRepository(Organization);
      const organization = await organizationRepository.findOne({
        where: { id: organizationId },
      });

      if (!organization) {
        res.status(404).json({ message: "Organization not found" });
        return;
      }

      // Update salary settings
      if (salaryPayDay !== undefined) {
        organization.salaryPayDay = salaryPayDay;
      }

      if (salaryAutoPayEnabled !== undefined) {
        organization.salaryAutoPayEnabled = salaryAutoPayEnabled;
      }

      await organizationRepository.save(organization);

      // Save to organization settings as well for consistency
      const settingsRepository = getRepository(OrganizationSettings);
      let existingSettings = await settingsRepository.findOne({
        where: {
          organizationId,
          settingsType: "salary",
        },
      });

      if (existingSettings) {
        existingSettings.settings = {
          ...existingSettings.settings,
          payDay: organization.salaryPayDay,
          autoPayEnabled: organization.salaryAutoPayEnabled,
          reminderDays: existingSettings.settings.reminderDays || 3,
        };
        existingSettings.updatedAt = new Date();
        await settingsRepository.save(existingSettings);
      } else {
        // Create new settings
        const newSettings = settingsRepository.create({
          organizationId,
          settingsType: "salary",
          settings: {
            payDay: organization.salaryPayDay,
            autoPayEnabled: organization.salaryAutoPayEnabled,
            reminderDays: 3,
          },
        });
        existingSettings = await settingsRepository.save(newSettings);
      }

      // Return settings directly (not nested) for better compatibility
      res.json({
        message: "Salary settings updated successfully",
        payDay: organization.salaryPayDay,
        autoPayEnabled: organization.salaryAutoPayEnabled,
        reminderDays: 3,
      });
    } catch (error) {
      console.error("Error updating salary settings:", error);
      res.status(500).json({ message: "Error updating salary settings" });
    }
  }

  /**
   * Get organization salary settings
   */
  static async getSalarySettings(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const organizationId = req.user?.organization?.id;
      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      // Try to get from organization settings first
      const settingsRepository = getRepository(OrganizationSettings);
      const existingSettings = await settingsRepository.findOne({
        where: {
          organizationId,
          settingsType: "salary",
        },
      });

      if (existingSettings) {
        console.log(
          "Found salary settings in organization_settings:",
          existingSettings
        );
        // Return the whole object so frontend can get the same structure when fetching or updating
        res.json(existingSettings);
        return; // Add this return statement to fix the TypeScript error
      }

      // Fallback to organization table settings
      const organizationRepository = getRepository(Organization);
      const organization = await organizationRepository.findOne({
        where: { id: organizationId },
      });

      if (!organization) {
        res.status(404).json({ message: "Organization not found" });
        return;
      }

      console.log("Falling back to organization table for salary settings");

      // Create settings entry for future use
      const settings = {
        payDay: organization.salaryPayDay || 25,
        autoPayEnabled:
          organization.salaryAutoPayEnabled !== undefined
            ? organization.salaryAutoPayEnabled
            : true,
        reminderDays: 3, // Default value
      };

      // Save to organization settings
      const newSettings = settingsRepository.create({
        organizationId,
        settingsType: "salary",
        settings,
      });
      await settingsRepository.save(newSettings);

      // Return the same structure as would be returned from the settings table
      res.json({
        organizationId,
        settingsType: "salary",
        settings,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("Error fetching salary settings:", error);
      res.status(500).json({ message: "Error fetching salary settings" });
    }
  }

  /**
   * Get organization dashboard stats
   */
  static async getOrganizationStats(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const organizationId = req.user?.organization?.id;

      if (!organizationId) {
        res.status(403).json({ message: "Organization not found" });
        return;
      }

      const organizationRepository = getRepository(Organization);
      const organization = await organizationRepository.findOne({
        where: { id: organizationId },
      });

      if (!organization) {
        res.status(404).json({ message: "Organization not found" });
        return;
      }

      // Return basic organization stats
      res.json({
        id: organization.id,
        name: organization.name,
        businessName: organization.businessName,
        status: organization.status,
        createdAt: organization.createdAt,
        hasActiveSubscription: organization.hasActiveSubscription || false,
        // Add more statistics as needed
      });
    } catch (error) {
      console.error("Error fetching organization stats:", error);
      res
        .status(500)
        .json({ message: "Error fetching organization statistics" });
    }
  }

  /**
   * Get organization settings by type
   */
  static async getOrganizationSettings(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const { id: settingsType } = req.params; // Use the ID param as settings type
      const organizationId = req.user?.organization?.id;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      console.log(
        `Getting ${settingsType} settings for organization: ${organizationId}`
      );

      // Remove '-settings' suffix if present
      const settingsKey = settingsType.replace(/-settings$/, "");

      const settingsRepository = getRepository(OrganizationSettings);
      const settings = await settingsRepository.findOne({
        where: {
          organizationId,
          settingsType: settingsKey,
        },
      });

      if (!settings) {
        // Return default settings if none exist - fixing return type issue
        res.json({
          organizationId,
          settingsType: settingsKey,
          settings: getDefaultSettings(settingsKey),
          updatedAt: new Date(),
        });
        return; // Return void, not Response
      }

      res.json(settings);
    } catch (error) {
      console.error("Error fetching organization settings:", error);
      res.status(500).json({ message: "Error fetching organization settings" });
    }
  }

  /**
   * Update organization settings
   */
  static async updateOrganizationSettings(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const { id: settingsType } = req.params;
      const { settings } = req.body;
      const organizationId = req.user?.organization?.id;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      // Remove '-settings' suffix if present
      const settingsKey = settingsType.replace(/-settings$/, "");

      const settingsRepository = getRepository(OrganizationSettings);
      let existingSettings = await settingsRepository.findOne({
        where: {
          organizationId,
          settingsType: settingsKey,
        },
      });

      if (existingSettings) {
        // Update existing settings
        existingSettings.settings = settings;
        existingSettings.updatedAt = new Date();
        await settingsRepository.save(existingSettings);
      } else {
        // Create new settings
        const newSettings = settingsRepository.create({
          organizationId,
          settingsType: settingsKey,
          settings,
        });
        existingSettings = await settingsRepository.save(newSettings);
      }

      res.json(existingSettings);
    } catch (error) {
      console.error("Error updating organization settings:", error);
      res.status(500).json({ message: "Error updating organization settings" });
    }
  }
}

// Helper function to check if string is UUID
function isUUID(str: string): boolean {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidPattern.test(str);
}

// Helper function to provide default settings based on type
function getDefaultSettings(settingsType: string): any {
  switch (settingsType) {
    case "salary":
      return {
        payDay: 1, // Default to 1st of the month
        autoPayEnabled: false,
        reminderDays: 3,
      };
    // Add other settings types as needed
    default:
      return {};
  }
}
