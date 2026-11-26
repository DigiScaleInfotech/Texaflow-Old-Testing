import { getRepository } from "../config/database";
import { Organization } from "../entities/organization.entity";
import { Employee } from "../entities/employee.entity";
import { SalaryPayment } from "../entities/salary-payment.entity";
import { User } from "../entities/user.entity";

/**
 * Service for handling automatic salary payments
 */
export class AutoPaymentService {
  /**
   * Check and process due payments for all organizations
   */
  static async processDuePayments(): Promise<void> {
    try {
      const today = new Date();
      const currentDay = today.getDate();

      // Get all organizations with auto pay enabled and matching pay day
      const organizationRepository = getRepository(Organization);
      const organizations = await organizationRepository.find({
        where: {
          salaryAutoPayEnabled: true,
          salaryPayDay: currentDay, // Only process orgs with today's pay day
          isActive: true,
        },
      }) as Organization[];

      console.log(
        `Processing auto payments for ${organizations.length} organizations`
      );

      // Process each organization
      for (const organization of organizations) {
        await this.processOrganizationPayments(organization, today);
      }
    } catch (error) {
      console.error("Error processing auto payments:", error);
    }
  }

  /**
   * Process payments for a single organization
   */
  private static async processOrganizationPayments(
    organization: Organization,
    today: Date
  ): Promise<void> {
    try {
      // Get admin user for this organization to set as creator of payments
      const userRepository = getRepository(User);
      const adminUser = await userRepository.findOne({
        where: { organizationId: organization.id, role: "admin" },
      });

      if (!adminUser) {
        console.error(
          `No admin user found for organization ${organization.id}`
        );
        return;
      }

      // Get all employees for this organization
      const employeeRepository = getRepository(Employee);
      const employees = await employeeRepository.find({
        where: { organizationId: organization.id },
      });

      console.log(
        `Processing ${employees.length} employees for organization ${organization.id}`
      );

      // Check which employees are due for payment (not paid this month)
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const salaryRepository = getRepository(SalaryPayment);

      for (const employee of employees) {
        // Check if employee already has payment for this month
        const existingPayment = await salaryRepository
          .createQueryBuilder("payment")
          .where("payment.employeeId = :employeeId", {
            employeeId: employee.id,
          })
          .andWhere("EXTRACT(MONTH FROM payment.date) = :month", {
            month: currentMonth + 1,
          })
          .andWhere("EXTRACT(YEAR FROM payment.date) = :year", {
            year: currentYear,
          })
          .getOne();

        // If no payment exists, create one
        if (!existingPayment) {
          const message = `Automatic salary payment for ${new Date(
            currentYear,
            currentMonth
          ).toLocaleString("default", { month: "long", year: "numeric" })}`;

          const payment = salaryRepository.create({
            employeeId: employee.id,
            date: today,
            amount: employee.salary || 0,
            bonus: 0,
            deduction: 0,
            message,
            organizationId: organization.id,
            createdById: adminUser.id,
          });

          const savedPayment = await salaryRepository.save(payment);

          // Update employee record
          employee.paidSalary = employee.salary;
          employee.lastPaymentDate = today;
          await employeeRepository.save(employee);

          console.log(
            `Created auto-payment for employee ${employee.id}: ${employee.name}`
          );
        }
      }
    } catch (error) {
      console.error(
        `Error processing payments for organization ${organization.id}:`,
        error
      );
    }
  }
}
