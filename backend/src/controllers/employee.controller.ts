import { Request, Response } from "express";
import { getRepository } from "../config/database";
import { Employee } from "../entities/employee.entity";
import { SalaryPayment } from "../entities/salary-payment.entity";
import { Attendance } from "../entities/attendance.entity";

// Define custom request interface with user property
interface CustomRequest extends Request {
  user?: any; // Using 'any' type for compatibility
}

export class EmployeeController {
  /**
   * Get all employees with pagination and filtering
   */
  static async getEmployees(req: CustomRequest, res: Response): Promise<void> {
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
      const role = req.query.role as string;
      const gender = req.query.gender as string;
      const state = req.query.state as string; // Add state parameter
      const minSalary = req.query.minSalary
        ? parseFloat(req.query.minSalary as string)
        : undefined;
      const maxSalary = req.query.maxSalary
        ? parseFloat(req.query.maxSalary as string)
        : undefined;

      // Build query
      const employeeRepository = getRepository(Employee);
      let queryBuilder = employeeRepository
        .createQueryBuilder("employee")
        .where("employee.organizationId = :organizationId", { organizationId });

      // Apply filters
      if (search) {
        queryBuilder = queryBuilder.andWhere(
          "(employee.name ILIKE :search OR employee.employeeId ILIKE :search OR employee.mobile ILIKE :search OR employee.email ILIKE :search)",
          { search: `%${search}%` }
        );
      }

      if (role) {
        queryBuilder = queryBuilder.andWhere("employee.role = :role", { role });
      }

      if (gender) {
        queryBuilder = queryBuilder.andWhere("employee.gender = :gender", {
          gender,
        });
      }

      if (state) {
        queryBuilder = queryBuilder.andWhere("employee.state = :state", {
          state,
        });
      }

      if (minSalary !== undefined) {
        queryBuilder = queryBuilder.andWhere("employee.salary >= :minSalary", {
          minSalary,
        });
      }

      if (maxSalary !== undefined) {
        queryBuilder = queryBuilder.andWhere("employee.salary <= :maxSalary", {
          maxSalary,
        });
      }

      // Get employees and total count in a single query
      const [employees, total] = await queryBuilder
        .orderBy("employee.name", "ASC")
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      res.json({
        employees,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Error fetching employees" });
    }
  }

  /**
   * Create a new employee
   */
  static async createEmployee(
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

      const employeeData = req.body;

      console.log("Creating employee with data:", employeeData); // Updated to log the actual data, not the req object

      // Handle image upload from media middleware
      if ((req as any).mediaUrl) {
        employeeData.image = (req as any).mediaUrl;
      }

      // Create employee
      const employeeRepository = getRepository(Employee);
      // Get current employee count for this organization
      const employeeCount = await employeeRepository.count({
        where: { organizationId },
      });

      // Create employee with generated ID
      const employee = employeeRepository.create({
        ...employeeData,
        organizationId,
        employeeId: `EMP-${organizationId.slice(0, 4)}-${employeeCount + 1}`,
      });

      const savedEmployee = await employeeRepository.save(employee);

      res.status(201).json({
        message: "Employee created successfully",
        employee: savedEmployee,
      });
    } catch (error) {
      console.error("Error creating employee:", error);
      res.status(500).json({ message: "Error creating employee" });
    }
  }

  /**
   * Get employee by ID
   */
  static async getEmployeeById(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const organizationId = req.user?.organization?.id;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      const employeeRepository = getRepository(Employee);
      const employee = await employeeRepository.findOne({
        where: { id, organizationId },
      });

      if (!employee) {
        res.status(404).json({ message: "Employee not found" });
        return;
      }

      // Get salary payments for this employee with proper order
      const salaryRepository = getRepository(SalaryPayment);
      const salaryPayments = await salaryRepository.find({
        where: { employeeId: id },
        order: { date: "DESC" },
      });

      // Get attendance records
      const attendanceRepository = getRepository(Attendance);
      const attendanceRecords = await attendanceRepository.find({
        where: { employeeId: id },
        order: { date: "DESC" },
      });

      // Include both in response for backward compatibility
      res.json({
        ...employee,
        salaryHistory: salaryPayments,
        salaryPayments: salaryPayments, // Add this for explicit access
        attendanceHistory: attendanceRecords,
      });
    } catch (error) {
      console.error("Error fetching employee:", error);
      res.status(500).json({ message: "Error fetching employee" });
    }
  }

  /**
   * Update employee
   */
  static async updateEmployee(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const organizationId = req.user?.organization?.id;
      const employeeData = req.body;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      // Handle image upload from media middleware
      if ((req as any).mediaUrl) {
        employeeData.image = (req as any).mediaUrl;
      }

      // Log the employee data for debugging
      console.log("Updating employee with data:", employeeData);

      const employeeRepository = getRepository(Employee);
      const employee = await employeeRepository.findOne({
        where: { id, organizationId },
      });

      if (!employee) {
        res.status(404).json({ message: "Employee not found" });
        return;
      }

      // Ensure state and district fields are explicitly handled
      if (employeeData.state !== undefined) {
        employee.state = employeeData.state;
      }

      if (employeeData.district !== undefined) {
        employee.district = employeeData.district;
      }

      if (employeeData.notes !== undefined) {
        employee.notes = employeeData.notes;
      }

      // Update the remaining employee data
      employeeRepository.merge(employee, employeeData);
      const updatedEmployee = await employeeRepository.save(employee);

      // Log the updated employee for verification
      console.log("Employee saved successfully:", updatedEmployee);

      res.json({
        message: "Employee updated successfully",
        employee: updatedEmployee,
      });
    } catch (error) {
      console.error("Error updating employee:", error);
      res.status(500).json({ message: "Error updating employee" });
    }
  }

  /**
   * Delete employee
   */
  static async deleteEmployee(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const organizationId = req.user?.organization?.id;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      const employeeRepository = getRepository(Employee);
      const employee = await employeeRepository.findOne({
        where: { id, organizationId },
      });

      if (!employee) {
        res.status(404).json({ message: "Employee not found" });
        return;
      }

      await employeeRepository.remove(employee);
      res.json({ message: "Employee deleted successfully" });
    } catch (error) {
      console.error("Error deleting employee:", error);
      res.status(500).json({ message: "Error deleting employee" });
    }
  }
}
