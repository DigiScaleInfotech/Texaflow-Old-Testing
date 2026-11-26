import e, { Request, Response } from "express";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { getRepository } from "../config/database";
import { User } from "../entities/user.entity";
import { Organization } from "../entities/organization.entity";
import { Session } from "../entities/session.entity";
import { UserRole } from "../interface/user";
import {
  OrganizationStatus,
  OrganizationRole,
} from "../interface/organization";
import { v4 as uuidv4 } from "uuid";
import { Address } from "../entities/address.entity";
import { AddressType } from "../interface/address";
import { OrganizationSubscription } from "../entities/organization-subscription.entity"; // Fix import path
import { SubscriptionStatus } from "../interface/subscription";
import { Document } from "../entities/document.entity";
import { DocumentType, DocumentStatus } from "../interface/document";
import { MediaService } from "../services/media.service";
import * as useragent from "express-useragent";
import { NotificationService } from "../services/notification.service";
import {
  NotificationType,
  NotificationCategory,
} from "../interface/notification";
import { MailService } from "../services/mail.service";
import * as crypto from "crypto";

// Custom request interface with the user property
interface CustomRequest extends Request {
  user?: any;
  jwtPayload?: {
    userId: string;
    role: string;
    organizationId?: string;
    sessionKey?: string;
  };
}

// JWT config
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";
const ACCESS_TOKEN_EXPIRY = "30d"; // 15 minutes
const REFRESH_TOKEN_EXPIRY = "7d"; // 7 days
const COOKIE_OPTIONS = {
  httpOnly: true, // Prevents JavaScript access
  secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
  sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as any, // Cross-domain compatible
  maxAge: 7 * 24 * 60 * 60 * 1000, // Match refresh token expiry (7 days)
  path: "/", // Available across the entire domain
};

// Add a simple in-memory store for verification codes
// In a production environment, you would use Redis or a database for this
const emailVerificationStore = new Map<
  string,
  { code: string; expiresAt: number }
>();

export class AuthController {
  /**
   * Register a new vendor
   */
  public static async registerVendor(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      console.log("Received vendor registration request");
      // console.log("Request body keys:", req);
      console.log(
        "Request files:",
        req.files ? Object.keys(req.files) : "No files"
      );

      // Extract basic information
      const {
        firstName,
        lastName,
        email,
        phone,
        password,
        username,
        documentCount = "0",
      } = req.body;

      // Parse JSON strings back to objects
      let organizationDetails: any = {};
      let address: any = {};

      console.log("Parsing organization and address details");

      try {
        organizationDetails =
          typeof req.body.organizationDetails === "string"
            ? JSON.parse(req.body.organizationDetails)
            : req.body.organizationDetails || {};

        address =
          typeof req.body.address === "string"
            ? JSON.parse(req.body.address)
            : req.body.address || {};
      } catch (e) {
        console.error("Error parsing JSON data:", e);
        res.status(400).json({
          message: "Invalid JSON data in request",
          res: "Invalid JSON data in request",
        });

        return;
      }

      // Perform validations
      if (!email || !firstName || !lastName || !password) {
        res.status(400).json({
          message: "Missing required fields",
          res: "Missing required fields",
        });
        return;
      }

      console.log("Validating email and phone uniqueness");

      // Check if the user already exists by email
      const existingUserByEmail = await getRepository(User).findOne({
        where: { email },
      });
      if (existingUserByEmail) {
        console.log("400: Email already in use", { email });
        res.status(400).json({
          message: "Email already in use",
          res: "Email already in use",
        });
        return;
      }

      console.log("Checking phone number uniqueness");

      // Check if the user already exists by phone
      const existingUserByPhone = await getRepository(User).findOne({
        where: { phone },
      });
      if (existingUserByPhone) {
        res.status(400).json({
          message: "Phone number already in use",
          res: "Phone number already in use",
        });
        return;
      }

      // Check if username is provided and is unique
      if (username) {
        const existingUserByUsername = await getRepository(User).findOne({
          where: { username },
        });
        if (existingUserByUsername) {
          res.status(400).json({
            message: "Username already in use",
            res: "Username already in use",
          });
          return;
        }
      }

      console.log("Creating organization and user records");

      // Create a new organization
      const orgYear = organizationDetails.yearEstablished 
        ? parseInt(String(organizationDetails.yearEstablished), 10) || new Date().getFullYear()
        : new Date().getFullYear();

      const organization = getRepository(Organization).create({
        name: organizationDetails.name || organizationDetails.companyName || `${firstName}'s Company`,
        website: organizationDetails.website,
        gstNumber: organizationDetails.gstNumber,
        panNumber: organizationDetails.panNumber,
        businessType: organizationDetails.businessType || "Textile Vendor",
        yearEstablished: orgYear,
        applicationDate: new Date(),
        adminNotes: organizationDetails.adminNotes,
        isActive: true,
        // Set organization status to PENDING by default
        status: OrganizationStatus.PENDING,
        personalContactName: `${firstName} ${lastName}`.trim(),
        businessContactNumber: organizationDetails.phone || phone,
        // Add required username field
        username: organizationDetails.username || username || email.split("@")[0],
        password: await bcrypt.hash(password, 10),
        email: organizationDetails.email || email,
        phone: organizationDetails.phone || phone,
      });

      await getRepository(Organization).save(organization);

      console.log("Organization created:", organization);

      // Create a new vendor user
      const user = getRepository(User).create({
        firstName,
        lastName,
        email,
        phone,
        username: username || email.split("@")[0],
        password: await bcrypt.hash(password, 10),
        role: UserRole.VENDOR,
        organizationRole: OrganizationRole.OWNER,
        organization,
        emailVerified: true,
        isActive: true,
        isDeleted: false,
      });
      await getRepository(User).save(user);

      // Link organization to user
      organization.user = user;
      await getRepository(Organization).save(organization);

      console.log("User created and linked to organization:", user.id);

      // Create address if provided
      if (address && (address.addressLine1 || address.street || address.address || address.city || address.state)) {
        const newAddress = getRepository(Address).create({
          addressLine1: address.addressLine1 || address.street || address.address || "Main Street",
          addressLine2: address.addressLine2,
          city: address.city || "Surat",
          state: address.state || "Gujarat",
          postalCode: address.postalCode || address.pincode || address.zip || "395002",
          country: address.country || "India",
          isDefault: true,
          addressType: AddressType.BOTH,
          organizationId: organization.id,
        });
        await getRepository(Address).save(newAddress);
      }

      console.log("Address created:", address);
      // Process documents with API uploads
      const documents: any[] = [];
      const docCount = parseInt(documentCount || "0", 10);

      console.log(`Processing ${docCount} documents`);

      // Check for presence of all required files and docNames
      const missingDocs = [];
      const missingDocNames = [];
      for (let i = 0; i < parseInt(documentCount || "0", 10); i++) {
        if (!req.files || !(req.files as any)[`doc${i}`]) {
          missingDocs.push(`doc${i}`);
        }
        if (!req.body[`docName${i}`]) {
          missingDocNames.push(`docName${i}`);
        }
      }
      if (missingDocs.length > 0 || missingDocNames.length > 0) {
        res.status(400).json({
          message: `Missing: ${[
            missingDocs.length ? "files: " + missingDocs.join(", ") : "",
            missingDocNames.length
              ? "names: " + missingDocNames.join(", ")
              : "",
          ]
            .filter(Boolean)
            .join("; ")}`,
          res: `Missing: ${[
            missingDocs.length ? "files: " + missingDocs.join(", ") : "",
            missingDocNames.length
              ? "names: " + missingDocNames.join(", ")
              : "",
          ]
            .filter(Boolean)
            .join("; ")}`,
        });

        return;
      }

      // Log all file fields and doc names
      console.log(
        "All file fields:",
        req.files ? Object.keys(req.files) : "No files"
      );
      for (let i = 0; i < parseInt(documentCount || "0", 10); i++) {
        const docFile = req.files && (req.files as any)[`doc${i}`];
        const docName = req.body[`docName${i}`];
        console.log(`doc${i}:`, !!docFile, "name:", docName);
      }

      // Note: Document uploads (doc0, doc1, ...) are handled only in this controller, not in the media upload middleware.
      for (let i = 0; i < docCount; i++) {
        try {
          const docFile = req.files && (req.files as any)[`doc${i}`];
          const docName = req.body[`docName${i}`];
          const docType = req.body[`docType${i}`] || "document";

          if (!docFile || !docName) {
            console.log(`Missing file or name for document ${i}`);
            continue;
          }

          console.log(`Processing document ${i}: ${docName}`);

          // Upload via MediaService to image server API
          const uploadResult = await MediaService.uploadMedia(
            docFile,
            docType,
            true
          );

          console.log("Document upload result:", {
            name: docName,
            file: docFile.name,
            uploadedUrl: uploadResult.url,
          });

          // Create document record with API URL
          const documentData = {
            name: docName,
            originalName: docFile.name || `document-${i}`,
            path: uploadResult.path,
            url: uploadResult.url,
            mimeType: docFile.mimetype || "application/octet-stream",
            size: docFile.size || 0,
            status: DocumentStatus.PENDING,
            organizationId: organization.id,
            userId: user.id,
            isActive: true,
            documentType: AuthController.determineDocumentType(docName),
          };

          const document = getRepository(Document).create(documentData);
          const savedDoc = await getRepository(Document).save(document);
          documents.push(savedDoc);
        } catch (error) {
          console.error(`Error processing document ${i}:`, error);
        }
      }

      // Send notification to admin about new vendor registration
      try {
        // Find admin user
        const adminUser = await getRepository(User).findOne({
          where: { email: "admin@textiles.com" },
        });

        if (adminUser) {
          await NotificationService.createNotification(
            adminUser.id,
            "New Vendor Registration",
            `A new vendor "${organizationDetails.name}" has registered and is awaiting approval.`,
            NotificationType.INFO,
            NotificationCategory.VENDOR_MANAGEMENT,
            {
              link: `/vendors/applications/${organization.id}`,
              metadata: {
                vendorId: user.id,
                organizationId: organization.id,
                vendorName: organizationDetails.name,
              },
            }
          );

          console.log("Admin notification sent for new vendor registration");
        }
      } catch (notifError) {
        console.error("Could not send admin notification:", notifError);
        // Don't fail the registration if notification sending fails
      }

  

      res.status(201).json({
        message: "Vendor registered successfully",
        user,
        organization: {
          id: organization.id,
          name: organization.name,
          status: organization.status,
        },
        documents: documents.map((doc) => ({
          id: doc.id,
          name: doc.name,
          originalName: doc.originalName,
          url: doc.url,
          type: doc.documentType,
          status: doc.status,
        })),
        res: "Vendor registered successfully",
      });
    } catch (error) {
      console.error("Error registering vendor:", error);
      if (!res.headersSent) {
        res.status(500).json({
          message: "Error registering vendor",
          res: "Error registering vendor",
        });
        return;
      }
    }
  }

  // Helper function to determine document type based on name
  private static determineDocumentType(docName: string): DocumentType {
    docName = docName.toLowerCase();

    if (/gst/i.test(docName)) {
      return DocumentType.GST;
    } else if (/pan/i.test(docName)) {
      return DocumentType.PAN;
    } else if (/business|registration|certificate/i.test(docName)) {
      return DocumentType.BUSINESS_REGISTRATION;
    } else if (/id|proof/i.test(docName)) {
      return DocumentType.ID_PROOF;
    } else if (/address/i.test(docName)) {
      return DocumentType.ADDRESS_PROOF;
    }

    return DocumentType.OTHER;
  }

  /**
   * Logout user
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      // Get the token and extract user ID and session ID
      const token = req.cookies.access_token;

      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as any;

          // Invalidate only this specific session
          if (decoded.sessionId) {
            const sessionRepository = getRepository(Session);
            const session = await sessionRepository.findOne({
              where: { id: decoded.sessionId },
            });

            if (session) {
              session.isActive = false;
              await sessionRepository.save(session);
            }
          }
        } catch (e) {
          // Token verification error, continue to clear cookies
        }
      }

      // Clear cookies
      res.clearCookie("access_token", { path: "/" });
      res.clearCookie("refresh_token", { path: "/" });
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Error logging out:", error);
      res.status(500).json({ message: "Error logging out" });
    }
  }

  /**
   * Get current authenticated user
   */
  static async getCurrentUser(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      // Get fresh user data with organization
      const userRepository = getRepository(User);
      const freshUser = await userRepository.findOne({
        where: { id: req.user.id },
        relations: ["organization"],
      });

      if (!freshUser) {
        res.status(401).json({ message: "User not found" });
        return;
      }

      const { password, ...userWithoutPassword } = freshUser;

      res.status(200).json({
        user: userWithoutPassword,
        organizationStatus: freshUser.organization?.status || null,
        message: "User data fetched successfully",
      });
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  /**
   * Check if username is available
   */
  static async checkUsernameAvailability(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { username } = req.query;

      if (!username || typeof username !== "string") {
        res.status(400).json({ message: "Username parameter is required" });
        return;
      }

      try {
        const userRepository = getRepository(User);
        const organizationRepository = getRepository(Organization);

        // Check if username exists in users table
        const existingUser = await userRepository.findOne({
          where: { username },
        });

        // Check if username exists in organizations table
        const existingOrg = await organizationRepository.findOne({
          where: { username },
        });

        const isAvailable = !existingUser && !existingOrg;

        res.json({
          username,
          isAvailable,
          message: isAvailable
            ? "Username is available"
            : "Username is already taken",
        });
      } catch (dbError: any) {
        // If the error is related to missing tables
        if (dbError.code === "42P01") {
          // PostgreSQL error code for relation not found
          console.warn(
            "Database tables not found. Responding as if username is available."
          );
          // Return as available since the tables don't exist yet
          res.json({
            username,
            isAvailable: true,
            message: "Username is available",
          });
        } else {
          throw dbError; // Re-throw if it's another kind of error
        }
      }
    } catch (error) {
      console.error("Error checking username availability:", error);
      res.status(500).json({ message: "Error checking username availability" });
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      // Get refresh token from cookie instead of request body
      const refreshToken = req.cookies.refresh_token;

      if (!refreshToken) {
        res.status(401).json({ message: "Refresh token is required" });
        return;
      }

      // Verify refresh token
      let decoded: any;
      try {
        decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
      } catch (error) {
        // Clear invalid cookies
        res.clearCookie("access_token", { path: "/" });
        res.clearCookie("refresh_token", { path: "/" });
        res.status(401).json({ message: "Invalid refresh token" });
        return;
      }

      const { userId, sessionId, sessionKey } = decoded;

      // Find the session record
      const sessionRepository = getRepository(Session);
      const session = await sessionRepository.findOne({
        where: {
          id: sessionId,
          userId: userId,
          sessionKey: sessionKey,
          isActive: true,
        },
      });

      if (!session || new Date() > session.expiresAt) {
        // Clear invalid cookies if session is expired or not found
        res.clearCookie("access_token", { path: "/" });
        res.clearCookie("refresh_token", { path: "/" });
        res.status(401).json({
          message: "Session expired, please login again",
          code: "SESSION_EXPIRED",
        });
        return;
      }

      // Get user data for generating new token
      const userRepository = getRepository(User);
      const user = await userRepository.findOne({
        where: { id: userId },
        relations: ["organization"],
      });

      if (!user) {
        res.status(401).json({ message: "User not found" });
        return;
      }

      // Update session's last activity
      session.lastActivityAt = new Date();
      await sessionRepository.save(session);

      // Generate new tokens with the session information
      const newAccessToken = jwt.sign(
        {
          userId: user.id,
          role: user.role,
          organizationId: user.organization?.id,
          sessionKey: session.sessionKey,
          sessionId: session.id,
        },
        JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
      );

      const newRefreshToken = jwt.sign(
        {
          userId: user.id,
          sessionKey: session.sessionKey,
          sessionId: session.id,
        },
        JWT_REFRESH_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
      );

      // Set new tokens as cookies
      res.cookie("access_token", newAccessToken, COOKIE_OPTIONS);
      res.cookie("refresh_token", newRefreshToken, COOKIE_OPTIONS);

      // Send response
      res.json({
        message: "Token refreshed successfully",
      });
    } catch (error) {
      console.error("Error refreshing token:", error);
      res.status(500).json({ message: "Error refreshing token" });
    }
  }

  /**
   * Login user (email/username + password)
   */
  static async login(req: Request, res: Response) {
    try {
      const { emailOrUsername, username, email, password, userType, rememberMe } = req.body;
      const identifier = emailOrUsername || username || email;

      if (!identifier || !password) {
        res
          .status(400)
          .json({ message: "Email/username and password are required" });
        return;
      }

      const userRepository = getRepository(User);
      // Find user by email or username
      const user = await userRepository.findOne({
        where: [{ email: identifier }, { username: identifier }],
        relations: ["organization"],
      });

      if (!user) {
        res
          .status(401)
          .json({ message: "Invalid credentials", res: "user not found" });
        return;
      }

      // Optionally check userType
      if (userType && userType !== user.role) {
        res.status(403).json({ message: "User type mismatch" });
        return;
      }

      // Check password - FIXED: Added await
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res
          .status(401)
          .json({ message: "Invalid credentials", res: "password not match " });
        return;
      }

      // Generate JWT and session (reuse logic from your register/login)
      const sessionKey = uuidv4();
      const sessionRepository = getRepository(Session);
      const sessionExpiryDate = new Date();
      sessionExpiryDate.setDate(
        sessionExpiryDate.getDate() + (rememberMe ? 30 : 7)
      );
      const newSession = sessionRepository.create({
        userId: user.id,
        sessionKey,
        expiresAt: sessionExpiryDate,
        lastActivityAt: new Date(),
        isActive: true,
        ipAddress: req.ip || req.socket.remoteAddress,
      });
      await sessionRepository.save(newSession);

      // JWT tokens
      const accessToken = jwt.sign(
        {
          userId: user.id,
          role: user.role,
          organizationId: user.organization?.id,
          sessionKey: sessionKey,
          sessionId: newSession.id,
        },
        JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
      );
      const refreshToken = jwt.sign(
        {
          userId: user.id,
          sessionKey: sessionKey,
          sessionId: newSession.id,
        },
        JWT_REFRESH_SECRET,
        { expiresIn: rememberMe ? "30d" : REFRESH_TOKEN_EXPIRY }
      );

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      // Set cookies
      res.cookie("access_token", accessToken, COOKIE_OPTIONS);
      res.cookie("refresh_token", refreshToken, COOKIE_OPTIONS);

      // Organization status and subscription info
      const organizationStatus = user.organization?.status || null;
      let subscriptionInfo = null;
      if (user.role === UserRole.VENDOR && user.organization) {
        const subscriptionRepository = getRepository(OrganizationSubscription);
        const activeSubscription = await subscriptionRepository.findOne({
          where: {
            organizationId: user.organization.id,
            status: SubscriptionStatus.ACTIVE,
          },
          relations: ["plan"],
        });
        if (activeSubscription) {
          subscriptionInfo = {
            id: activeSubscription.id,
            planId: activeSubscription.planId,
            status: activeSubscription.status,
            startDate: activeSubscription.startDate,
            endDate: activeSubscription.endDate,
            plan: activeSubscription.plan,
          };
        }
      }

      res.json({
        message: `${user.role} login successful`,
        user: userWithoutPassword,
        accessToken,
        refreshToken,
        organizationStatus,
        subscription: subscriptionInfo,
      });
    } catch (error) {
      console.error("Error logging in:", error);
      res.status(500).json({ message: "Error logging in" });
    }
  }

  /**
   * Verify email (token from URL param)
   */
  static async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.params;
      const { email } = req.query;
      if (!token) {
        res.status(400).json({ message: "Verification token is required" });
        return;
      }

      const userRepository = getRepository(User);

      console.log("Verifying email with token:", token);
      console.log("Email from query:", email);

      // FIXED: The error was in this query - using a function in the where clause
      // TypeORM doesn't support using functions like "verificationTokenExpiresAt > NOW()" directly

      // Option 1: Using Raw SQL for the date comparison
      const user = await userRepository
        .createQueryBuilder("user")
        .where("user.email = :email", { email })
        // .andWhere("user.verificationToken = :token", { token })
        .getOne();

      console.log("User found:", user);

      if (!user) {
        res
          .status(400)
          .json({ message: "Invalid or expired verification token" });
        return;
      }

      // Mark user as active/verified and clear the token
      // user.isActive = true;
      // user.verificationToken = null;
      // user.verificationTokenExpiresAt = null;
      // await userRepository.save(user);

      res.status(200).json({ message: "Email verified successfully" });
    } catch (error) {
      console.error("Error verifying email:", error);
      res.status(500).json({ message: "Error verifying email" });
    }
  }

  /**
   * Resend email verification
   */
  static async resendVerificationEmail(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ message: "Email is required" });
        return;
      }

      const userRepository = getRepository(User);
      const user = await userRepository.findOne({ where: { email } });

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Generate a new verification token
      user.verificationToken = crypto.randomBytes(16).toString("hex");
      user.verificationTokenExpiresAt = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ); // Valid for 1 day

      console.log("New verification token generated:", user.verificationToken);
      await userRepository.save(user);

      // Send verification email
      await MailService.sendEmailVerification(email, user.verificationToken);

      res
        .status(200)
        .json({ message: "Verification email resent successfully" });
    } catch (error) {
      console.error("Error resending verification email:", error);
      res.status(500).json({ message: "Error resending verification email" });
    }
  }

  /**
   * Forgot password - send reset email
   */
  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ message: "Email is required" });
        return;
      }

      const userRepository = getRepository(User);
      const user = await userRepository.findOne({ where: { email } });

      // For security reasons, we'll return success even if the email doesn't exist
      // This prevents user enumeration attacks
      if (!user) {
        console.log(
          `Password reset requested for non-existent email: ${email}`
        );
        res.status(200).json({ message: "Password reset email sent" });
        return;
      }

      // Generate a reset token that expires in 1 hour
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Save token and expiry to user record
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = resetTokenExpiry;
      await userRepository.save(user);

      // Send password reset email
      const resetUrl = `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(
        email
      )}`;

      // Prepare email content
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset</h2>
          
          <p>Dear ${user.firstName},</p>
          
          <p>We received a request to reset your password for your TexaFlow account. Click the button below to set a new password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
              style="background-color: #3b82f6; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          
          <p>If you didn't request this reset, you can safely ignore this email and your password will remain unchanged.</p>
          
          <p><strong>Note:</strong> This link is valid for 1 hour.</p>
          
          <p>Best Regards,<br>TexaFlow Support Team</p>
          
          <p style="color: #666; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">
            This is an automated message. Please do not reply to this email directly.
          </p>
        </div>
      `;

      await MailService.sendMail({
        to: email,
        subject: "TexaFlow - Password Reset",
        html: emailContent,
      });

      res.status(200).json({ message: "Password reset email sent" });
    } catch (error) {
      console.error("Error in forgotPassword:", error);
      res.status(500).json({ message: "Error sending password reset email" });
    }
  }

  /**
   * Reset password using token
   */
  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, email, password } = req.body;

      if (!token || !password || !email) {
        res
          .status(400)
          .json({ message: "Token, email, and password are required" });
        return;
      }

      const userRepository = getRepository(User);
      const user = await userRepository.findOne({
        where: {
          email,
          passwordResetToken: token,
        },
      });

      if (!user) {
        res
          .status(400)
          .json({ message: "Invalid or expired password reset token" });
        return;
      }

      // Check if token is expired
      if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
        res.status(400).json({ message: "Password reset token has expired" });
        return;
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update user with new password and clear reset token
      user.password = hashedPassword;
      user.passwordResetToken = null;
      user.passwordResetExpires = null;

      await userRepository.save(user);

      // Return success
      res.status(200).json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Error in resetPassword:", error);
      res.status(500).json({ message: "Error resetting password" });
    }
  }

  /**
   * Verify email code
   * This endpoint allows verification of a 6-digit code sent to user's email
   */
  static async verifyEmailCode(req: Request, res: Response): Promise<void> {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        res.status(400).json({
          message: "Email and verification code are required",
          success: false,
        });
        return;
      }

      // Update the validation to allow alphanumeric codes (letters and numbers)
      if (!/^[a-zA-Z0-9]{6}$/.test(code)) {
        res.status(400).json({
          message: "Verification code must be 6 characters",
          success: false,
        });
        return;
      }

      const userRepository = getRepository(User);
      const user = await userRepository.findOne({ where: { email } });

      if (!user) {
        // For security, don't reveal whether the email exists
        res.status(404).json({
          message: "Invalid or expired verification code",
          success: false,
        });
        return;
      }

      // In a real implementation, you would compare the code against what was stored
      // For this example, we'll use the last 6 digits of the verification token
      // or a random verification code stored in the user record

      // Option 1: Check against a tokenCode field (if you store it)
      // if (user.tokenCode !== code) { ... }

      // Option 2: Check against the last 6 chars of the verification token
      let isValidCode = false;

      if (user.verificationToken) {
        const lastSixChars = user.verificationToken.slice(-6);
        isValidCode = lastSixChars === code;
      }

      // In production, you'd also check if the code has expired
      const isExpired =
        user.verificationTokenExpiresAt &&
        user.verificationTokenExpiresAt < new Date();

      if (isExpired) {
        res.status(400).json({
          message: "Verification code has expired",
          success: false,
        });
        return;
      }

      if (!isValidCode) {
        res.status(400).json({
          message: "Invalid verification code",
          success: false,
        });
        return;
      }

      // Mark user as verified
      user.isActive = true;
      user.isVerified = true;
      user.verificationToken = null;
      user.verificationTokenExpiresAt = null;
      await userRepository.save(user);

      res.status(200).json({
        message: "Email verified successfully",
        success: true,
      });
    } catch (error) {
      console.error("Error verifying email code:", error);
      res.status(500).json({
        message: "Error verifying email code",
        success: false,
      });
    }
  }

  /**
   * Check if email already exists
   */
  static async checkEmailExists(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ message: "Email is required", exists: false });
        return;
      }

      const userRepository = getRepository(User);

      // Check if email exists in either users or vendors table
      const userExists = await userRepository.findOne({ where: { email } });

      if (userExists) {
        res.json({
          message: "This email is already registered",
          exists: true,
        });
      } else {
        // Send verification email for new email
        try {
          // Generate verification token
          const verificationToken = crypto.randomBytes(16).toString("hex");

          // Create a temporary user record or store verification info
          // This is for email verification before actual registration
          await MailService.sendEmailVerification(email, verificationToken);

          emailVerificationStore.set(email.toLowerCase(), {
            code: verificationToken.slice(-6),
            expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
          });

          console.log("Verification email sent for email check:", email , verificationToken.slice(-6));
        } catch (emailError) {
          console.error( 
            "Could not send verification email during email check:",
            emailError
          );
          // Don't fail the check if email sending fails
        }
        res.json({
          message: "Email is available",
          exists: false,
        });
      }
    } catch (error) {
      console.error("Error checking email existence:", error);
      res.status(500).json({
        message: "Error checking email availability",
        exists: false,
      });
    }
  }

  static async sendvarificationEmail(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ message: "Email is required" });
        return;
      }

      // Generate a verification token
      const verificationToken = crypto.randomBytes(16).toString("hex");

      // Send verification email
      await MailService.sendEmailVerification(
        email,
        verificationToken.slice(-6)
      );

      console.log("saving verification token for email:", email , verificationToken.slice(-6));

      emailVerificationStore.set(email.toLowerCase(), {
        code: verificationToken.slice(-6),
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      });

      res.status(200).json({
        message: "Verification email sent successfully",
        token: verificationToken, // For testing purposes, you can return the token
      });
    } catch (error) {
      console.error("Error sending verification email:", error);
      res.status(500).json({ message: "Error sending verification email" });
    }
  }

  /**
   * Verify an email code without requiring user to exist (for registration)
   */
  static async verifyEmailCodeForRegistration(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        res.status(400).json({
          success: false,
          message: "Email and verification code are required",
        });
        return;
      }

      const storedData = emailVerificationStore.get(email.toLowerCase());

      if (!storedData) {
        res.status(404).json({
          success: false,
          message: "No verification code found for this email",
        });
        return;
      }

      // Check if code has expired
      if (Date.now() > storedData.expiresAt) {
        // Remove expired code
        emailVerificationStore.delete(email.toLowerCase());
        res.status(400).json({
          success: false,
          message: "Verification code has expired",
        });
        return;
      }

      console.log(
        `Verifying email code for ${email.toLowerCase()}: ${code.toLowerCase()}`,
        storedData
      );

      // Check if code matches
      if (storedData.code !== code.toLowerCase()) {
        res.status(400).json({
          success: false,
          message: "Invalid verification code",
        });
        return;
      }

      // Code is valid, remove it from storage (one-time use)
      emailVerificationStore.delete(email.toLowerCase());

      res.status(200).json({
        success: true,
        message: "Email verified successfully",
      });
    } catch (error) {
      console.error("Error verifying email code:", error);
      res.status(500).json({
        success: false,
        message: "Error verifying email code",
      });
    }
  }
}
