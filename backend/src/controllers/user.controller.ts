import { Request, Response } from "express";
import { getRepository } from "../config/database";
import { User } from "../entities/user.entity";
import { Organization } from "../entities/organization.entity";
import * as bcrypt from "bcrypt";

// Use the same CustomRequest interface as in auth.middleware.ts
interface CustomRequest extends Request {
  user?: any; // Keep as 'any' for compatibility
  jwtPayload?: {
    userId: string;
    role: string;
    organizationId?: string;
    sessionKey?: string;
  };
}

export class UserController {
  /**
   * Get user profile
   */
  static async getProfile(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const userRepository = getRepository(User);
      const user = await userRepository.findOne({
        where: { id: userId },
        relations: ["organization"],
      });

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Remove sensitive information
      const { password, ...userProfile } = user;

      res.status(200).json({
        user: userProfile,
        message: "Profile fetched successfully",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      // Check if we're dealing with a FormData request with only a file
      const isFileOnlyUpdate = req.file || (req as any).mediaUrl;

      // Initialize update data object
      let updateData: any = {};

      if (isFileOnlyUpdate) {
        // If it's just a file upload, only update the image
        updateData = {
          image: (req as any).mediaUrl, // Use the mediaUrl set by the middleware
        };
      } else if (req.body) {
        // Only destructure from req.body if it exists
        const { firstName, lastName, username, email, phone, organization } =
          req.body;

        // Build update data from form fields
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (username) updateData.username = username;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;

        // Handle image upload from media middleware even in JSON requests
        if ((req as any).mediaUrl) {
          updateData.image = (req as any).mediaUrl;
        }
      }

      // Get user and update with prepared data
      const userRepository = getRepository(User);
      const user = await userRepository.findOne({
        where: { id: userId },
        relations: ["organization"],
      });

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Apply updates to user object
      Object.assign(user, updateData);

      // Save user changes
      await userRepository.save(user);

      // Update organization data if provided and user is associated with an organization
      if (req.body?.organization && user.organization) {
        const orgRepository = getRepository(Organization);
        const org = await orgRepository.findOne({
          where: { id: user.organization.id },
        });

        if (org) {
          const orgData = req.body.organization;
          if (orgData.name) org.name = orgData.name;
          if (orgData.businessName) org.businessName = orgData.businessName;
          if (orgData.email) org.email = orgData.email;
          if (orgData.phone) org.phone = orgData.phone;

          // Save organization changes
          await orgRepository.save(org);
        }
      }

      // Return updated user without sensitive info
      const { password: _, ...updatedUser } = (await userRepository.findOne({
        where: { id: userId },
        relations: ["organization"],
      })) as User;

      res.status(200).json({
        user: updatedUser,
        message: "Profile updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);

      // Handle unique constraint violations
      if (error.code === "23505") {
        // PostgreSQL unique constraint violation
        res.status(400).json({
          message: "Email or username already in use",
        });
        return;
      }

      res.status(500).json({ message: "Internal server error" });
    }
  }

  /**
   * Change user password
   */
  static async changePassword(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id;

      console.log("Changing password for user ID:", req.user);
      if (!userId) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }

      console.log("Request body:", req.body);

      const { currentPassword, newPassword } = req.body;

      // Validate inputs
      if (!currentPassword || !newPassword) {
        res
          .status(400)
          .json({ message: "Current password and new password are required" });
        return;
      }

      if (newPassword.length < 8) {
        res
          .status(400)
          .json({ message: "New password must be at least 8 characters long" });
        return;
      }

      const userRepository = getRepository(User);
      const user = await userRepository.findOne({ where: { id: userId } });

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      console.log(`Found user: ${user.firstName} ${user.lastName}`);
      console.log(`Stored password hash: ${user.password.substring(0, 10)}...`);
      console.log(`Attempting to verify password: "${currentPassword}"`);

      try {
        // Verify current password with enhanced error handling
        const isPasswordValid = await bcrypt.compare(
          currentPassword,
          user.password
        );

        console.log(`Password comparison result: ${isPasswordValid}`);

        if (!isPasswordValid) {
          console.log("Password validation failed - incorrect password");
          res.status(401).json({
            message: "Current password is incorrect",
            debug: {
              passwordLength: currentPassword.length,
              hashPrefix: user.password.substring(0, 7), // Show only prefix for security
            },
          });
          return;
        }

        console.log("Password validation successful");

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;

        // Save the updated user
        await userRepository.save(user);
        console.log("User password updated successfully");

        res.status(200).json({ message: "Password changed successfully" });
      } catch (bcryptError) {
        console.error("Bcrypt comparison error:", bcryptError);
        res.status(500).json({
          message: "Error validating password",
          error: bcryptError instanceof Error ? bcryptError.message : String(bcryptError),
        });
      }
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Error changing password" });
    }
  }

  /**
   * Update user preferences
   */
  static async updatePreferences(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const { preferences } = req.body;

      if (!preferences) {
        res.status(400).json({ message: "Preferences are required" });
        return;
      }

      const userRepository = getRepository(User);
      const user = await userRepository.findOne({ where: { id: userId } });

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Initialize metadata if it doesn't exist
      if (!user.metadata) {
        user.metadata = {};
      }

      // Update preferences
      user.metadata.preferences = {
        ...user.metadata.preferences,
        ...preferences,
      };

      await userRepository.save(user);

      res.status(200).json({
        message: "Preferences updated successfully",
        preferences: user.metadata.preferences,
      });
    } catch (error) {
      console.error("Error updating preferences:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}
