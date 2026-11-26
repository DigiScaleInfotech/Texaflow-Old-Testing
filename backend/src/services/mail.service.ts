import * as nodemailer from "nodemailer";
import { User } from "../entities/user.entity";
import { OrganizationSubscription } from "../entities/organization-subscription.entity";

// Define interface for minimum vendor info needed for email
interface VendorInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  organization?: {
    id?: string;
    name?: string;
  };
}

export class MailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465, // true for port 465, false for other ports
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  /**
   * Generic method to send emails
   */
  static async sendMail(options: {
    to: string;
    subject: string;
    html: string;
    from?: string;
  }): Promise<boolean> {
    try {
      const mailOptions = {
        from: options.from || `"TexaFlow Support" <${process.env.SMTP_EMAIL}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("Email sent successfully:", info.messageId);
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  }

  /**
   * Send email from vendor to admin
   */
  static async sendVendorMessageToAdmin(
    vendor: User | VendorInfo,
    subject: string,
    message: string,
    reason: string
  ): Promise<boolean> {
    try {
      const adminEmail = "kanishk21soni@gmail.com";

      if (!adminEmail) {
        console.error("Admin email not configured in environment variables");
        return false;
      }

      // Ensure we have the required vendor properties
      if (!vendor.email || !vendor.firstName) {
        console.error("Vendor object is missing required fields");
        return false;
      }

      const mailOptions = {
        from: `"TexaFlow Support" <${process.env.SMTP_EMAIL}>`,
        to: adminEmail,
        subject: `Vendor Query: ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Vendor Message</h2>
            <div style="border-left: 4px solid #0066cc; padding-left: 15px; margin: 20px 0;">
              <p><strong>From:</strong> ${vendor.firstName} ${
          vendor.lastName || ""
        } (${vendor.email})</p>
              <p><strong>Organization:</strong> ${
                vendor.organization?.name || "N/A"
              }</p>
              <p><strong>Reason:</strong> ${reason}</p>
            </div>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
              <p><strong>Message:</strong></p>
              <p>${message.replace(/\n/g, "<br>")}</p>
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              This message was sent from the TexaFlow Vendor Portal.
            </p>
          </div>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("Vendor message sent:", info.messageId);
      return true;
    } catch (error) {
      console.error("Error sending vendor message to admin:", error);
      return false;
    }
  }

  /**
   * Send admin response to vendor
   */
  static async sendAdminResponseToVendor(
    vendor: User | VendorInfo,
    originalSubject: string,
    adminResponse: string,
    originalMessage: string
  ): Promise<boolean> {
    try {
      // Ensure we have the required vendor properties
      if (!vendor.email || !vendor.firstName) {
        console.error("Vendor object is missing required fields");
        return false;
      }

      const mailOptions = {
        from: `"TexaFlow Support" <${process.env.SMTP_EMAIL}>`,
        to: vendor.email,
        subject: `Re: ${originalSubject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Response to Your Inquiry</h2>
            <p>Dear ${vendor.firstName} ${vendor.lastName || ""},</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Our Response:</strong></p>
              <p>${adminResponse.replace(/\n/g, "<br>")}</p>
            </div>
            
            <div style="border-left: 4px solid #0066cc; padding-left: 15px; margin: 20px 0;">
              <p><strong>Your Original Message:</strong></p>
              <p><strong>Subject:</strong> ${originalSubject}</p>
              <p>${originalMessage.replace(/\n/g, "<br>")}</p>
            </div>
            
            <p>Thank you for reaching out to us. If you have any further questions, please don't hesitate to contact us.</p>
            
            <p>Best Regards,<br>TexaFlow Support Team</p>
            
            <p style="color: #666; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">
              This is an automated response. Please do not reply to this email directly.
              For further assistance, please log in to your TexaFlow account and use the support feature.
            </p>
          </div>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("Admin response sent:", info.messageId);
      return true;
    } catch (error) {
      console.error("Error sending admin response to vendor:", error);
      return false;
    }
  }

  /**
   * Send subscription expiry reminder email
   */
  static async sendSubscriptionExpiryReminder(
    user: User,
    subscription: OrganizationSubscription,
    daysRemaining: number
  ): Promise<boolean> {
    try {
      if (!user.email) {
        console.error("User email is missing");
        return false;
      }

      const orgName = user.organization?.name || "your organization";
      const planName = subscription.plan?.name || "your subscription plan";
      const expiryDate = subscription.endDate
        ? new Date(subscription.endDate).toLocaleDateString()
        : "soon";

      const mailOptions = {
        from: `"TexaFlow Support" <${process.env.SMTP_EMAIL}>`,
        to: user.email,
        subject: `Your TexaFlow Subscription Expires in ${daysRemaining} Days`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Subscription Expiry Reminder</h2>
            
            <p>Dear ${user.firstName} ${user.lastName},</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p>Your <strong>${planName}</strong> subscription for <strong>${orgName}</strong> will expire in <strong>${daysRemaining} days</strong> (on ${expiryDate}).</p>
              
              <p>To ensure uninterrupted access to all features and services, please renew your subscription before the expiry date.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${
                process.env.FRONTEND_URL || "http://localhost:3000"
              }/vendor-subscription-details" 
                style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                Renew Subscription
              </a>
            </div>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            
            <p>Best Regards,<br>TexaFlow Support Team</p>
            
            <p style="color: #666; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">
              This is an automated message. Please do not reply to this email directly.
            </p>
          </div>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("Subscription expiry reminder sent:", info.messageId);
      return true;
    } catch (error) {
      console.error("Error sending subscription expiry reminder:", error);
      return false;
    }
  }

  /**
   * Send subscription expired notice
   */
  static async sendSubscriptionExpiredNotice(
    user: User,
    subscription: OrganizationSubscription
  ): Promise<boolean> {
    try {
      if (!user.email) {
        console.error("User email is missing");
        return false;
      }

      const orgName = user.organization?.name || "your organization";
      const planName = subscription.plan?.name || "your subscription plan";
      const expiryDate = subscription.endDate
        ? new Date(subscription.endDate).toLocaleDateString()
        : "recently";

      const mailOptions = {
        from: `"TexaFlow Support" <${process.env.SMTP_EMAIL}>`,
        to: user.email,
        subject: `Your TexaFlow Subscription Has Expired`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Subscription Expired</h2>
            
            <p>Dear ${user.firstName} ${user.lastName},</p>
            
            <div style="background-color: #fff8e1; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0;">
              <p>Your <strong>${planName}</strong> subscription for <strong>${orgName}</strong> expired on <strong>${expiryDate}</strong>.</p>
              
              <p>As a result, access to premium features has been restricted. To restore full access to all services, please renew your subscription as soon as possible.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${
                process.env.FRONTEND_URL || "http://localhost:3000"
              }/vendor-subscription-details" 
                style="background-color: #ff9800; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                Renew Now
              </a>
            </div>
            
            <p>If you have any questions or need assistance with renewing your subscription, our support team is ready to help.</p>
            
            <p>Best Regards,<br>TexaFlow Support Team</p>
            
            <p style="color: #666; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">
              This is an automated message. Please do not reply to this email directly.
            </p>
          </div>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("Subscription expired notice sent:", info.messageId);
      return true;
    } catch (error) {
      console.error("Error sending subscription expired notice:", error);
      return false;
    }
  }

  /**
   * Send subscription upgrade opportunity email
   */
  static async sendSubscriptionUpgradeEmail(
    user: User,
    currentSubscription: OrganizationSubscription,
    recommendedPlan: any
  ): Promise<boolean> {
    try {
      if (!user.email) {
        console.error("User email is missing");
        return false;
      }

      const orgName = user.organization?.name || "your organization";
      const currentPlanName =
        currentSubscription.plan?.name || "your current plan";
      const upgradePlanName = recommendedPlan?.name || "our premium plan";
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

      const mailOptions = {
        from: `"TexaFlow Support" <${process.env.SMTP_EMAIL}>`,
        to: user.email,
        subject: `Upgrade Your TexaFlow Subscription for Better Features`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Subscription Upgrade Opportunity</h2>
            
            <p>Dear ${user.firstName} ${user.lastName},</p>
            
            <div style="background-color: #f0f8ff; padding: 15px; border-left: 4px solid #0066cc; margin: 20px 0;">
              <p>We noticed you've been making great use of your <strong>${currentPlanName}</strong> subscription for <strong>${orgName}</strong>.</p>
              
              <p>Based on your usage, we think you might benefit from upgrading to our <strong>${upgradePlanName}</strong>, which includes:</p>
              
              <ul style="margin-left: 20px; padding-left: 0;">
                ${
                  recommendedPlan?.features
                    ?.map(
                      (feature: string) =>
                        `<li style="margin-bottom: 8px;">${feature}</li>`
                    )
                    .join("") ||
                  `
                <li>Additional premium features</li>
                <li>Higher usage limits</li>
                <li>Priority customer support</li>
                `
                }
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${frontendUrl}/vendor-subscription-details" 
                style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                View Upgrade Options
              </a>
            </div>
            
            <p>If you have any questions about our plans or need assistance choosing the right option, our support team is ready to help.</p>
            
            <p>Best Regards,<br>TexaFlow Support Team</p>
            
            <p style="color: #666; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">
              This is an automated message. Please do not reply to this email directly.
            </p>
          </div>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("Subscription upgrade email sent:", info.messageId);
      return true;
    } catch (error) {
      console.error("Error sending subscription upgrade email:", error);
      return false;
    }
  }

  /**
   * Send email to customer with professional template
   */
  static async sendCustomerEmail(
    customerData: {
      id: string;
      name: string;
      email: string;
      organization?: {
        id?: string;
        name?: string;
        address?: string;
      };
    },
    subject: string,
    message: string,
    senderInfo: {
      sentBy: string;
      senderName: string;
      senderOrganization?: {
        name?: string;
        businessName?: string;
        logo?: string;
      };
    }
  ): Promise<boolean> {
    try {
      if (!customerData.email) {
        console.error("Customer email is missing");
        return false;
      }

      // Determine which organization name to use
      const orgName =
        senderInfo.senderOrganization?.name ||
        senderInfo.senderOrganization?.businessName ||
        customerData.organization?.name ||
        "TEXAFLOW";

      const orgAddress = customerData.organization?.address || "";
      const currentDate = new Date().toLocaleDateString();
      const currentYear = new Date().getFullYear();

      // Use logo if available
      const logoHtml = senderInfo.senderOrganization?.logo
        ? `<img src="${senderInfo.senderOrganization.logo}" alt="${orgName}" style="max-height: 50px; max-width: 200px; margin-bottom: 10px;">`
        : "";

      // Create professional HTML email template
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; color: #333333; background-color: #f7f7f7; line-height: 1.6;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <!-- Header -->
            <tr>
              <td style="background-color: #0066cc; padding: 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">TEXAFLOW CRM</h1>
                <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 14px;">Textile Management Solutions</p>
              </td>
            </tr>
            
            <!-- Date -->
            <tr>
              <td style="padding: 20px 20px 0 20px; text-align: right; font-size: 14px; color: #666666;">
                <p style="margin: 0;">Date: ${currentDate}</p>
              </td>
            </tr>
            
            <!-- Greeting -->
            <tr>
              <td style="padding: 20px 20px 10px 20px;">
                <p style="margin: 0; font-weight: bold; font-size: 16px;">Dear ${
                  customerData.name
                },</p>
              </td>
            </tr>
            
            <!-- Content -->
            <tr>
              <td style="padding: 0 20px;">
                <div style="background-color: #f9f9f9; border-radius: 5px; padding: 20px; margin: 10px 0; border-left: 4px solid #0066cc;">
                  ${message.replace(/\n/g, "<br>")}
                </div>
                
                <p style="margin: 20px 0 30px 0;">If you have any questions or need further assistance, please don't hesitate to contact us.</p>
              </td>
            </tr>
            
            <!-- Signature -->
            <tr>
              <td style="padding: 0 20px 20px 20px;">
                <p style="margin: 0;">Best Regards,</p>
                <p style="margin: 5px 0 0 0; font-weight: bold;">${
                  senderInfo.senderName
                }</p>
                <p style="margin: 5px 0 0 0; font-size: 14px;">TEXAFLOW Support Team</p>
              </td>
            </tr>
            
            <!-- Organization Details -->
            <tr>
              <td style="padding: 20px; border-top: 1px solid #eeeeee; background-color: #f9f9f9;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td width="50%" style="vertical-align: top;">
                      <p style="margin: 0; font-weight: bold; font-size: 14px;">${orgName}</p>
                      ${
                        orgAddress
                          ? `<p style="margin: 5px 0 0 0; font-size: 12px; color: #666666;">${orgAddress}</p>`
                          : ""
                      }
                      <p style="margin: 5px 0 0 0; font-size: 12px; color: #666666;">Email: support@texaflow.com</p>
                    </td>
                    <td width="50%" style="vertical-align: top; text-align: right;">
                      <p style="margin: 0; font-size: 12px; color: #666666;">Customer ID: ${customerData.id.substring(
                        0,
                        8
                      )}</p>
                      <p style="margin: 5px 0 0 0; font-size: 12px; color: #666666;">Ref: ${subject.substring(
                        0,
                        20
                      )}${subject.length > 20 ? "..." : ""}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td style="padding: 15px; background-color: #333333; text-align: center; color: #ffffff; font-size: 12px;">
                <p style="margin: 0;">© ${currentYear} TexaFlow CRM. All rights reserved.</p>
                <p style="margin: 5px 0 0 0;">This is an automated email. Please do not reply directly to this message.</p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      // Send email using the generic sendMail method
      return await this.sendMail({
        to: customerData.email,
        subject,
        html,
      });
    } catch (error) {
      console.error("Error sending customer email:", error);
      return false;
    }
  }

  /**
   * Send application status email to vendors
   */
  static async sendApplicationStatusEmail(
    user: User | VendorInfo,
    status: "approved" | "rejected" | "pending",
    organizationName: string,
    message: string
  ): Promise<boolean> {
    try {
      // Ensure we have the required user properties
      if (!user.email || !user.firstName) {
        console.error("User object is missing required fields");
        return false;
      }

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

      // Customize the email based on status
      const subject =
        status === "approved"
          ? "Your Vendor Application Has Been Approved"
          : status === "rejected"
          ? "Your Vendor Application Requires Attention"
          : "Your Vendor Application Status";

      // Button text and color based on status
      const buttonText =
        status === "approved"
          ? "Access Vendor Portal"
          : "View Application Details";

      const buttonColor =
        status === "approved"
          ? "#10b981" // Green for approved
          : status === "rejected"
          ? "#ef4444" // Red for rejected
          : "#3b82f6"; // Blue for other statuses

      const statusTitleText =
        status === "approved"
          ? "Application Approved"
          : status === "rejected"
          ? "Application Requires Updates"
          : "Application Status Update";

      const mailOptions = {
        from: `"TexaFlow Support" <${process.env.SMTP_EMAIL}>`,
        to: user.email,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">${statusTitleText}</h2>
            <p>Dear ${user.firstName} ${user.lastName || ""},</p>
            
            <div style="background-color: ${
              status === "approved" ? "#f0fdf4" : "#fef2f2"
            }; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${
          status === "approved" ? "#10b981" : "#ef4444"
        };">
              <p>Your vendor application for <strong>${organizationName}</strong> has been <strong>${status}</strong>.</p>
              
              <p><strong>Message from Admin:</strong></p>
              <p>${message.replace(/\n/g, "<br>")}</p>

              ${
                status === "rejected"
                  ? `
              <p style="margin-top: 15px;"><strong>Next Steps:</strong></p>
              <p>Please login to your account to review the feedback and resubmit any required documentation.</p>
              `
                  : ""
              }
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${frontendUrl}/${
          status === "approved"
            ? "vendor/dashboard"
            : "vendor/application-status"
        }" 
                style="background-color: ${buttonColor}; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                ${buttonText}
              </a>
            </div>
            
            <p>If you have any questions or need assistance, please contact our support team at <a href="mailto:support@texaflow.com">support@texaflow.com</a>.</p>
            
            <p>Best Regards,<br>TexaFlow Support Team</p>
            
            <p style="color: #666; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">
              This is an automated message. Please do not reply to this email directly.
            </p>
          </div>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Application ${status} email sent:`, info.messageId);
      return true;
    } catch (error) {
      console.error(`Error sending application ${status} email:`, error);
      return false;
    }
  }

  /**
   * Send email verification
   */
  static async sendEmailVerification(
    email: string,
    verificationToken: string
  ): Promise<boolean> {
    try {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}&email=${encodeURIComponent(
        email
      )}`;

      // Extract the last 6 characters of the token to use as verification code
      // In production, consider generating a separate numeric code
      const verificationCode = verificationToken.slice(-6);

      const mailOptions = {
        from: `"TexaFlow Support" <${process.env.SMTP_EMAIL}>`,
        to: email,
        subject: "Verify Your Email Address",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Email Verification</h2>
            
            <p>Thank you for signing up with TexaFlow!</p>
            
            <p>Your verification code is:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; font-size: 32px; font-weight: bold; letter-spacing: 5px;">
                ${verificationCode}
              </div>
            </div>
            
           
          
            <p>This verification code and link will expire in 24 hours. If you did not sign up for a TexaFlow account, please ignore this email.</p>
            
            <p>Best Regards,<br>TexaFlow Support Team</p>
            
            <p style="color: #666; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">
              This is an automated message. Please do not reply to this email directly.
            </p>
          </div>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("Email verification sent:", info.messageId);
      return true;
    } catch (error) {
      console.error("Error sending email verification:", error);
      return false;
    }
  }

  /**
   * Send subscription expired email
   */
  static async sendSubscriptionExpiredEmail(
    user: User,
    subscription: OrganizationSubscription
  ): Promise<boolean> {
    const organizationName = user.organization?.name || "your organization";
    const renewUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/dashboard/subscriptions`;

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Subscription Expired</h2>
        
        <p>Dear ${user.firstName},</p>
        
        <p>Your subscription for ${organizationName} has expired.</p>
        
        <p>To continue using all features of our platform, please renew your subscription.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${renewUrl}" 
            style="background-color: #3b82f6; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Renew Subscription
          </a>
        </div>
        
        <p>If you have any questions or need assistance, please contact our support team.</p>
        
        <p>Best Regards,<br>TexaFlow Support Team</p>
      </div>
    `;

    try {
      await MailService.sendMail({
        to: user.email,
        subject: "Your Subscription Has Expired",
        html: emailContent,
      });
      return true;
    } catch (error) {
      console.error("Failed to send subscription expired email:", error);
      return false;
    }
  }
}

// Export the VendorInfo interface
export type { VendorInfo };
