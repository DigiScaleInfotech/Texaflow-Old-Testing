import { Request, Response } from "express";
import { getRepository } from "../config/database";
import { Employee } from "../entities/employee.entity";
import { SalaryPayment } from "../entities/salary-payment.entity";

// Define custom request interface with user property
interface CustomRequest extends Request {
  user?: any; // Using 'any' type for compatibility
}

export class SalaryController {
  /**
   * Get all salary payments with pagination and filtering
   */
  static async getSalaryPayments(
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

      // Extract query parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const month = req.query.month as string;
      const employeeId = req.query.employeeId as string;

      // Build query
      const salaryRepository = getRepository(SalaryPayment);
      let queryBuilder = salaryRepository
        .createQueryBuilder("salary")
        .leftJoinAndSelect("salary.employee", "employee")
        .where("salary.organizationId = :organizationId", { organizationId });

      // Apply filters
      if (search) {
        queryBuilder = queryBuilder.andWhere(
          "employee.name ILIKE :search OR salary.message ILIKE :search",
          { search: `%${search}%` }
        );
      }

      if (month) {
        // Month should be in YYYY-MM format
        queryBuilder = queryBuilder.andWhere(
          "TO_CHAR(salary.date, 'YYYY-MM') = :month",
          { month }
        );
      }

      if (employeeId) {
        queryBuilder = queryBuilder.andWhere(
          "salary.employeeId = :employeeId",
          { employeeId }
        );
      }

      // Get total count
      const total = await queryBuilder.getCount();

      // Apply pagination
      const salaryPayments = await queryBuilder
        .orderBy("salary.date", "DESC")
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

      res.json({
        payments: salaryPayments,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error("Error fetching salary payments:", error);
      res.status(500).json({ message: "Error fetching salary payments" });
    }
  }

  /**
   * Create a salary payment
   */
  static async createSalaryPayment(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const organizationId = req.user?.organization?.id;
      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      let {
        employeeId,
        date,
        amount,
        bonus = 0,
        deduction = 0,
        message,
      } = req.body;

      // Convert to numbers to ensure they're numeric
      amount = Number(amount) || 0;
      bonus = Number(bonus) || 0;
      deduction = Number(deduction) || 0;

      if (!employeeId || !date || amount === 0) {
        res
          .status(400)
          .json({ message: "Employee ID, date, and amount are required" });
        return;
      }

      // Verify the employee exists and belongs to this organization
      const employeeRepository = getRepository(Employee);
      const employee = await employeeRepository.findOne({
        where: { id: employeeId, organizationId },
      });

      if (!employee) {
        res.status(404).json({ message: "Employee not found" });
        return;
      }

      // Check if employee has already received payment for this month
      const paymentDate = new Date(date);
      const paymentMonth = paymentDate.getMonth();
      const paymentYear = paymentDate.getFullYear();

      const salaryRepository = getRepository(SalaryPayment);
      const existingPayment = await salaryRepository
        .createQueryBuilder("payment")
        .where("payment.employeeId = :employeeId", { employeeId })
        .andWhere("payment.organizationId = :organizationId", {
          organizationId,
        })
        .andWhere("EXTRACT(MONTH FROM payment.date) = :month", {
          month: paymentMonth + 1,
        }) // SQL EXTRACT is 1-12
        .andWhere("EXTRACT(YEAR FROM payment.date) = :year", {
          year: paymentYear,
        })
        .getOne();

      if (existingPayment) {
        const monthName = new Date(paymentYear, paymentMonth, 1).toLocaleString(
          "en-US",
          { month: "long" }
        );
        res.status(400).json({
          message: `Employee has already received payment for ${monthName} ${paymentYear}`,
        });
        return;
      }

      // Create salary payment
      const salaryPayment = salaryRepository.create({
        employeeId,
        date: new Date(date),
        amount,
        bonus,
        deduction,
        message,
        organizationId,
        createdById: userId,
      });

      const savedPayment = await salaryRepository.save(salaryPayment);

      // Update employee's paid salary
      const finalAmount = amount + bonus - deduction;
      employee.paidSalary = finalAmount;
      employee.lastPaymentDate = new Date(date);
      if (deduction > 0) {
        employee.advanceBalance = Math.max(0, Number(employee.advanceBalance || 0) - deduction);
      }
      await employeeRepository.save(employee);

      res.status(201).json({
        message: "Salary payment created successfully",
        payment: savedPayment,
      });
    } catch (error) {
      console.error("Error creating salary payment:", error);
      res.status(500).json({ message: "Error creating salary payment" });
    }
  }

  /**
   * Get salary summary for dashboard
   */
  static async getSalarySummary(
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

      const month =
        (req.query.month as string) || new Date().toISOString().slice(0, 7);

      // Get all employees
      const employeeRepository = getRepository(Employee);
      const employees = await employeeRepository.find({
        where: { organizationId },
      });

      // Get salary payments for the month
      const salaryRepository = getRepository(SalaryPayment);
      const payments = await salaryRepository
        .createQueryBuilder("salary")
        .where("salary.organizationId = :organizationId", { organizationId })
        .andWhere("TO_CHAR(salary.date, 'YYYY-MM') = :month", { month })
        .getMany();

      // Calculate statistics
      const totalSalaryBudget = employees.reduce(
        (sum, emp) => sum + Number(emp.salary),
        0
      );
      const totalPaid = payments.reduce(
        (sum, payment) =>
          sum +
          Number(payment.amount) +
          Number(payment.bonus) -
          Number(payment.deduction),
        0
      );
      const totalPending = totalSalaryBudget - totalPaid;

      // Get employees due for payment (those who haven't been paid this month)
      const paidEmployeeIds = payments.map((payment) => payment.employeeId);
      const employeesDue = employees.filter(
        (emp) => !paidEmployeeIds.includes(emp.id)
      );

      res.json({
        month,
        totalSalaryBudget,
        totalPaid,
        totalPending,
        employeeCount: employees.length,
        paidEmployeesCount: paidEmployeeIds.length,
        pendingEmployeesCount: employeesDue.length,
        employeesDue,
      });
    } catch (error) {
      console.error("Error fetching salary summary:", error);
      res.status(500).json({ message: "Error fetching salary summary" });
    }
  }
}
