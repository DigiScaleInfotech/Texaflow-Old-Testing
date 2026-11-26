import { getRepository } from "../config/database";
import { Organization } from "../entities/organization.entity";
import { OrganizationStatus } from "../interface/organization";
import { User } from "../entities/user.entity";

export class VendorApplicationService {
  /**
   * Update an application status and notify the vendor
   */
  static async updateApplicationStatus(
    applicationId: string,
    status: OrganizationStatus,
    adminNotes?: string
  ): Promise<Organization> {
    const organizationRepository = getRepository(Organization);
    const userRepository = getRepository(User);

    // Get the organization and related user
    const organization = await organizationRepository.findOne({
      where: { id: applicationId },
      relations: ["user"],
    });

    if (!organization) {
      throw new Error("Organization not found");
    }

    // Update organization status
    const previousStatus = organization.status;
    organization.status = status;

    if (adminNotes) {
      organization.adminNotes = adminNotes;
    }

    // Save status change
    await organizationRepository.save(organization);

    // Notify vendor if their user account exists
    if (organization.user && organization.user.email) {
      // In a real application, you'd send an actual email
      // This is a placeholder for demonstration
      const emailTemplate = this.getStatusChangeEmailTemplate(
        previousStatus,
        status
      );

      try {
        // sendEmail(organization.user.email, emailTemplate.subject, emailTemplate.body);
        console.log(
          `Email notification would be sent to ${organization.user.email}`
        );
        console.log(`Subject: ${emailTemplate.subject}`);
        console.log(`Body: ${emailTemplate.body}`);
      } catch (error) {
        console.error("Failed to send notification email:", error);
        // Continue since email sending is non-critical
      }
    }

    return organization as Organization;
  }

  /**
   * Get email template for status change notification
   */
  private static getStatusChangeEmailTemplate(
    previousStatus: OrganizationStatus,
    newStatus: OrganizationStatus
  ): { subject: string; body: string } {
    switch (newStatus) {
      case OrganizationStatus.APPROVED:
        return {
          subject: "Your vendor application has been approved",
          body: "Congratulations! Your application to become a vendor has been approved. You can now access all vendor features.",
        };
      case OrganizationStatus.REJECTED:
        return {
          subject: "Your vendor application has been declined",
          body: "We regret to inform you that your vendor application has been declined. Please contact support for more information.",
        };
      case OrganizationStatus.BLOCKED:
        return {
          subject: "Your vendor account has been suspended",
          body: "Your vendor account has been temporarily suspended. Please contact our support team for assistance.",
        };
      default:
        return {
          subject: "Update on your vendor application",
          body: `Your application status has been updated from ${previousStatus} to ${newStatus}.`,
        };
    }
  }
}
