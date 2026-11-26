import { Request, Response } from "express";
import { getRepository } from "../config/database";
import { Organization } from "../entities/organization.entity";
import { OrganizationStatus } from "../interface/organization";
import { User } from "../entities/user.entity";

export class AdminController {
  /**
   * Approve an organization
   */
  static async approveOrganization(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const organizationRepository = getRepository(Organization);

      const organization = await organizationRepository.findOne({
        where: { id },
      });

      if (!organization) {
        res.status(404).json({ message: "Organization not found" });
        return;
      }

      organization.status = OrganizationStatus.APPROVED;
      if (notes) {
        organization.adminNotes = notes;
      }

      await organizationRepository.save(organization);

      res.json({
        message: "Organization approved successfully",
        organization,
      });
    } catch (error) {
      console.error("Error approving organization:", error);
      res.status(500).json({ message: "Error approving organization" });
    }
  }

  /**
   * Reject an organization
   */
  static async rejectOrganization(req: Request, res: Response): Promise<void> {
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

      organization.status = OrganizationStatus.REJECTED;
      organization.adminNotes = reason || organization.adminNotes;

      await organizationRepository.save(organization);

      res.json({
        message: "Organization rejected successfully",
        organization,
      });
    } catch (error) {
      console.error("Error rejecting organization:", error);
      res.status(500).json({ message: "Error rejecting organization" });
    }
  }

  /**
   * Block an organization
   */
  static async blockOrganization(req: Request, res: Response): Promise<void> {
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

      organization.status = OrganizationStatus.BLOCKED;
      organization.isActive = false;
      organization.adminNotes = reason || organization.adminNotes;

      await organizationRepository.save(organization);

      res.json({
        message: "Organization blocked successfully",
        organization,
      });
    } catch (error) {
      console.error("Error blocking organization:", error);
      res.status(500).json({ message: "Error blocking organization" });
    }
  }

  /**
   * Get pending organizations
   */
  static async getPendingOrganizations(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const organizationRepository = getRepository(Organization);

      const organizations = await organizationRepository.find({
        where: { status: OrganizationStatus.PENDING },
        relations: ["user"],
      });

      res.json({
        organizations,
      });
    } catch (error) {
      console.error("Error getting pending organizations:", error);
      res.status(500).json({ message: "Error getting pending organizations" });
    }
  }
}
