import { Request, Response } from "express";
import { getRepository } from "../config/database";
import { Employee } from "../entities/employee.entity";
import { Attendance, AttendanceStatus } from "../entities/attendance.entity";

// Define custom request interface with user property
interface CustomRequest extends Request {
  user?: any; // Using 'any' type for compatibility
}

export class AttendanceController {
  /**
   * Get attendance records with pagination and filters
   */
  static async getAttendance(req: CustomRequest, res: Response): Promise<void> {
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
      const date = req.query.date as string;
      const employeeId = req.query.employeeId as string;
      const status = req.query.status as AttendanceStatus;

      // Build query
      const attendanceRepository = getRepository(Attendance);
      let queryBuilder = attendanceRepository
        .createQueryBuilder("attendance")
        .leftJoinAndSelect("attendance.employee", "employee")
        .where("attendance.organizationId = :organizationId", {
          organizationId,
        });

      // Apply filters
      if (date) {
        queryBuilder = queryBuilder.andWhere("attendance.date = :date", {
          date: new Date(date),
        });
      }

      if (employeeId) {
        queryBuilder = queryBuilder.andWhere(
          "attendance.employeeId = :employeeId",
          { employeeId }
        );
      }

      if (status) {
        queryBuilder = queryBuilder.andWhere("attendance.status = :status", {
          status,
        });
      }

      // Get total count
      const total = await queryBuilder.getCount();

      // Apply pagination
      const attendanceRecords = await queryBuilder
        .orderBy("attendance.date", "DESC")
        .addOrderBy("employee.name", "ASC")
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

      res.json({
        records: attendanceRecords,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error("Error fetching attendance records:", error);
      res.status(500).json({ message: "Error fetching attendance records" });
    }
  }

  /**
   * Get attendance for a specific date
   */
  static async getAttendanceByDate(
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

      const date = req.params.date;
      if (!date) {
        res.status(400).json({ message: "Date is required" });
        return;
      }

      // Find all employees for this organization
      const employeeRepository = getRepository(Employee);
      const employees = await employeeRepository.find({
        where: { organizationId },
      });

      // Find attendance records for this date
      const attendanceRepository = getRepository(Attendance);
      const records = await attendanceRepository.find({
        where: {
          organizationId,
          date: new Date(date),
        },
        relations: ["employee"],
      });

      // Create attendance records for any employee without one
      const recordedEmployeeIds = records.map((record) => record.employeeId);
      const employeesWithoutRecords = employees.filter(
        (emp) => !recordedEmployeeIds.includes(emp.id)
      );

      const newRecords = [];
      for (const employee of employeesWithoutRecords) {
        const newRecord = attendanceRepository.create({
          employeeId: employee.id,
          date: new Date(date),
          status: AttendanceStatus.PRESENT,
          organizationId,
          employee, // Include employee relation
        });
        newRecords.push(await attendanceRepository.save(newRecord));
      }

      // Return all records including newly created ones
      const allRecords = [...records, ...newRecords];

      // Count by status
      const presentCount = allRecords.filter(
        (r) => r.status === AttendanceStatus.PRESENT
      ).length;
      const absentCount = allRecords.filter(
        (r) => r.status === AttendanceStatus.ABSENT
      ).length;
      const lateCount = allRecords.filter(
        (r) => r.status === AttendanceStatus.LATE
      ).length;
      const leaveCount = allRecords.filter(
        (r) => r.status === AttendanceStatus.LEAVE
      ).length;

      res.json({
        date,
        records: allRecords,
        summary: {
          total: allRecords.length,
          present: presentCount,
          absent: absentCount,
          late: lateCount,
          leave: leaveCount,
        },
      });
    } catch (error) {
      console.error("Error fetching attendance by date:", error);
      res.status(500).json({ message: "Error fetching attendance by date" });
    }
  }

  /**
   * Mark attendance
   */
  static async markAttendance(
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

      const { employeeId, date, status, notes } = req.body;

      if (!employeeId || !date || !status) {
        res
          .status(400)
          .json({ message: "Employee ID, date, and status are required" });
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

      // Check if attendance record already exists for this employee and date
      const attendanceRepository = getRepository(Attendance);
      let attendance = await attendanceRepository.findOne({
        where: {
          employeeId,
          date: new Date(date),
          organizationId,
        },
      });

      if (attendance) {
        // Update existing record
        attendance.status = status;
        if (notes) attendance.notes = notes;
        attendance.markedById = userId;
      } else {
        // Create new attendance record
        attendance = attendanceRepository.create({
          employeeId,
          date: new Date(date),
          status,
          notes,
          organizationId,
          markedById: userId,
        });
      }

      const savedAttendance = await attendanceRepository.save(attendance);

      res.json({
        message: "Attendance marked successfully",
        attendance: savedAttendance,
      });
    } catch (error) {
      console.error("Error marking attendance:", error);
      res.status(500).json({ message: "Error marking attendance" });
    }
  }

  /**
   * Get attendance statistics
   */
  static async getAttendanceStats(
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

      const startDate =
        (req.query.startDate as string) ||
        new Date(new Date().setDate(new Date().getDate() - 30))
          .toISOString()
          .split("T")[0];
      const endDate =
        (req.query.endDate as string) || new Date().toISOString().split("T")[0];

      // Get attendance within date range
      const attendanceRepository = getRepository(Attendance);
      const records = await attendanceRepository
        .createQueryBuilder("attendance")
        .leftJoinAndSelect("attendance.employee", "employee")
        .where("attendance.organizationId = :organizationId", {
          organizationId,
        })
        .andWhere("attendance.date BETWEEN :startDate AND :endDate", {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        })
        .getMany();

      // Best performers (employees with most present days)
      interface EmployeeAttendance {
        employeeId: string;
        name: string;
        presentDays: number;
        totalDays: number;
        rate: number;
      }

      const employeeMap = new Map<string, EmployeeAttendance>();

      records.forEach((record) => {
        const id = record.employeeId;
        const name = record.employee.name;

        if (!employeeMap.has(id)) {
          employeeMap.set(id, {
            employeeId: id,
            name,
            presentDays: 0,
            totalDays: 0,
            rate: 0,
          });
        }

        const employee = employeeMap.get(id)!;
        employee.totalDays++;

        if (record.status === AttendanceStatus.PRESENT) {
          employee.presentDays++;
        }

        employee.rate = employee.presentDays / employee.totalDays;
      });

      const bestPerformers = Array.from(employeeMap.values())
        .sort((a, b) => b.rate - a.rate || b.presentDays - a.presentDays)
        .slice(0, 5);

      // Get attendance by date - Fix for the date handling issue
      const attendanceByDate = records.reduce((acc, record) => {
        // Safely format the date to YYYY-MM-DD string
        let dateString;

        if (record.date instanceof Date) {
          dateString = record.date.toISOString().split("T")[0];
        } else if (typeof record.date === "string") {
          // If it's already a string, try to parse it
          try {
            dateString = new Date(record.date).toISOString().split("T")[0];
          } catch (e) {
            // Fallback - use as is if parseable as ISO format, or today's date
            dateString = record.date || new Date().toISOString().split("T")[0];
          }
        } else {
          // Extreme fallback
          dateString = new Date().toISOString().split("T")[0];
          console.warn(
            `Invalid date format for record ID ${record.id}, using current date`
          );
        }

        if (!acc[dateString]) {
          acc[dateString] = {
            date: dateString,
            present: 0,
            absent: 0,
            late: 0,
            leave: 0,
            total: 0,
          };
        }

        acc[dateString].total++;

        switch (record.status) {
          case AttendanceStatus.PRESENT:
            acc[dateString].present++;
            break;
          case AttendanceStatus.ABSENT:
            acc[dateString].absent++;
            break;
          case AttendanceStatus.LATE:
            acc[dateString].late++;
            break;
          case AttendanceStatus.LEAVE:
            acc[dateString].leave++;
            break;
        }

        return acc;
      }, {} as Record<string, any>);

      // Convert to array and sort by date
      const attendanceTimeline = Object.values(attendanceByDate).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      res.json({
        dateRange: { startDate, endDate },
        bestPerformers,
        attendanceTimeline,
        summary: {
          present: records.filter((r) => r.status === AttendanceStatus.PRESENT)
            .length,
          absent: records.filter((r) => r.status === AttendanceStatus.ABSENT)
            .length,
          late: records.filter((r) => r.status === AttendanceStatus.LATE)
            .length,
          leave: records.filter((r) => r.status === AttendanceStatus.LEAVE)
            .length,
          total: records.length,
        },
      });
    } catch (error) {
      console.error("Error fetching attendance statistics:", error);
      res.status(500).json({ message: "Error fetching attendance statistics" });
    }
  }
}
