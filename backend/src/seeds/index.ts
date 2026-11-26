import { AppDataSource, getRepository } from "../config/database";
import { Organization } from "../entities/organization.entity";
import { User } from "../entities/user.entity";
import { UserRole } from "../interface/user";
import { OrganizationRole, OrganizationStatus } from "../interface/organization";
import * as crypto from "crypto";
import * as bcrypt from "bcrypt";
import { seedSubscriptionPlans } from "./subscription-seeds";

// Generate a random password hash (in a real app, use bcrypt)
function generatePassword(): string {
  return crypto.randomBytes(8).toString("hex");
}

export async function runSeeds() {
  console.log("Running database seeds...");

  try {
    // Check if the data source is initialized
    const userRepository = getRepository(User);
    let adminUser: User;

    // Check if we already have the admin user
    const adminExists = await userRepository.findOne({
      where: { email: "admin@textiles.com" },
    });

    if (!adminExists) {
      console.log("Creating admin user...");
      const newUserData = userRepository.create({
        firstName: "Admin",
        lastName: "User",
        email: "admin@textiles.com",
        phone: "1234567890",
        username: "admin", // Set username same as organization
        password: await bcrypt.hash("admin123", 10),
        role: UserRole.ADMIN,
        organizationRole: OrganizationRole.OWNER,
        isActive: true,
      });

      adminUser = await userRepository.save(newUserData) as User;
      console.log("Admin user created successfully with ID:", adminUser.id);
    } else {
      console.log("Admin user already exists with ID:", adminExists.id);
      adminUser = adminExists as User;
    }

    // Check if we have a default organization
    const organizationRepository = AppDataSource.getRepository(Organization);
    let defaultOrg = await organizationRepository.findOne({
      where: { name: "Textiles Admin" },
      relations: ["user"],
    });

    if (!defaultOrg) {
      console.log("Creating default organization...");

      // Create default organization
      defaultOrg = organizationRepository.create({
        name: "Textiles Admin",
        email: "admin@textiles.com",
        phone: "1234567890",
        username: "admin",
        password: generatePassword(), // In production, use proper password hashing
        status: OrganizationStatus.APPROVED,
        isActive: true,
        // Add the logo URL for the organization
        logo: "https://sdmntprsouthcentralus.oaiusercontent.com/files/00000000-7ee4-51f7-b5d4-ccf2aefe1c83/raw?se=2025-04-09T07%3A01%3A25Z&sp=r&sv=2024-08-04&sr=b&scid=da00ee82-d04d-5403-895d-39c367f1d70d&skoid=b53ae837-f585-4db7-b46f-2d0322fce5a9&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-04-09T04%3A07%3A58Z&ske=2025-04-10T04%3A07%3A58Z&sks=b&skv=2024-08-04&sig=gRlZMRcG6UYSMImWU1hZJJPVdwQR6%2BVDv9X6FQ5OrkM%3D",
        user: adminUser, // Associate the admin user with the organization
      });

      await organizationRepository.save(defaultOrg);
      console.log(
        "Default organization created successfully with linked admin user"
      );
    } else if (!defaultOrg.user) {
      // If org exists but doesn't have user linked, update it
      console.log("Updating organization to link with admin user");
      defaultOrg.user = adminUser;
      await organizationRepository.save(defaultOrg);
      console.log("Organization updated with admin user link");
    } else {
      console.log(
        "Organization already has a linked user with ID:",
        defaultOrg.user.id
      );
    }

    // Now update the admin user with the organization ID if needed
    if (adminUser && defaultOrg && !adminUser.organization) {
      console.log("Updating admin user with organization reference");

      // Update the user directly using a query to avoid circular reference issues
      await userRepository
        .createQueryBuilder()
        .relation(User, "organization")
        .of(adminUser.id)
        .set(defaultOrg.id);

      console.log("Admin user updated with organization reference");
    }

    // Seed subscription plans
    await seedSubscriptionPlans();

    console.log("Seeds completed successfully.");
  } catch (error) {
    console.error("Error running seeds:", error);
    // Don't throw error to prevent application crash
    // Instead, log error and let application continue
  }
}
