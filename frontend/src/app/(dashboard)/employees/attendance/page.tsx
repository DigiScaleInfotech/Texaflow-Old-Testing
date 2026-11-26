"use client";

import React, { useState, useEffect } from "react";
import { employeeService } from "@/services/employee.service";
import {
  CalendarCheck,
  Clock,
  UserCheck,
  UserX,
  Award,
  History,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface AttendanceRecord {
  employeeId: number;
  employeeName: string;
  date: string;
  status: "Present" | "Absent" | "Late";
}

interface Employee {
  id: number;
  name: string;
}

// Updated AttendanceHistory component with pagination
const AttendanceHistory = ({
  records,
  isOpen,
  onClose,
  currentPage = 1,
  itemsPerPage = 3,
  onPageChange,
}: {
  records: AttendanceRecord[];
  isOpen: boolean;
  onClose: () => void;
  currentPage?: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
}) => {
  // Group records by date
  const recordsByDate = records.reduce((acc, record) => {
    if (!acc[record.date]) {
      acc[record.date] = [];
    }
    acc[record.date].push(record);
    return acc;
  }, {} as Record<string, AttendanceRecord[]>);

  // Sort dates in descending order
  const sortedDates = Object.keys(recordsByDate).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  // Pagination
  const totalPages = Math.ceil(sortedDates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDates = sortedDates.slice(startIndex, endIndex);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white dark:bg-gray-800 py-2 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Attendance History
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {paginatedDates.map((date) => (
            <div key={date} className="overflow-x-auto">
              <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2 bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                {new Date(date).toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h3>
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50">
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recordsByDate[date].map((record) => (
                    <tr
                      key={`${record.employeeId}-${record.date}`}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="py-4 px-6 text-sm text-gray-800 dark:text-gray-200">
                        {record.employeeId}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-800 dark:text-gray-200 font-medium">
                        {record.employeeName}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${
                            record.status === "Present"
                              ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                              : record.status === "Absent"
                              ? "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
                          }`}
                        >
                          {record.status === "Present" ? (
                            <UserCheck className="h-3 w-3 mr-1" />
                          ) : record.status === "Absent" ? (
                            <UserX className="h-3 w-3 mr-1" />
                          ) : (
                            <Clock className="h-3 w-3 mr-1" />
                          )}
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-md ${
                currentPage === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              }`}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => onPageChange(i + 1)}
                  className={`w-8 h-8 rounded-md ${
                    currentPage === i + 1
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() =>
                onPageChange(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className={`p-2 rounded-md ${
                currentPage === totalPages
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              }`}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const AttendancePage = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [currentDate, setCurrentDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [presentEmployees, setPresentEmployees] = useState<AttendanceRecord[]>(
    []
  );
  const [absentEmployees, setAbsentEmployees] = useState<AttendanceRecord[]>(
    []
  );
  const [bestPerformers, setBestPerformers] = useState<
    { employeeName: string; presentDays: number }[]
  >([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>(
    []
  );

  // New state variables for dialog and pagination
  const [historyDialogOpen, setHistoryDialogOpen] = useState<boolean>(false);
  const [currentHistoryPage, setCurrentHistoryPage] = useState<number>(1);
  const itemsPerPage = 3; // Number of dates to show per page

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empRes, attRes] = await Promise.allSettled([
          employeeService.getEmployees(),
          employeeService.getAttendance()
        ]);

        if (empRes.status === "fulfilled" && empRes.value) {
          const emps: Employee[] = (empRes.value.employees || []).map((e: any) => ({
            id: e.id,
            name: e.name || `${e.firstName || ''} ${e.lastName || ''}`.trim() || 'Employee'
          }));
          setAllEmployees(emps);
        }

        if (attRes.status === "fulfilled" && attRes.value) {
          const recs: AttendanceRecord[] = (attRes.value.records || []).map((r: any) => ({
            employeeId: r.employeeId || r.employee?.id,
            employeeName: r.employeeName || r.employee?.name || 'Employee',
            date: r.date ? new Date(r.date).toISOString().slice(0, 10) : currentDate,
            status: r.status || 'Present',
          }));
          setAttendanceRecords(recs);
        }
      } catch (err) {
        console.error("Error loading real attendance data:", err);
      }
    };

    fetchData();
  }, [currentDate]);

  useEffect(() => {
    // Check if current date has attendance records
    const existingRecords = attendanceRecords.filter(
      (record) => record.date === currentDate
    );

    // If no records for current date, create default records (all present)
    if (existingRecords.length === 0 && allEmployees.length > 0) {
      const defaultRecords = allEmployees.map((employee) => ({
        employeeId: employee.id,
        employeeName: employee.name,
        date: currentDate,
        status: "Present" as const,
      }));

      setAttendanceRecords([...attendanceRecords, ...defaultRecords]);
    } else {
      setTodayAttendance(existingRecords);
    }
  }, [currentDate, allEmployees, attendanceRecords]);

  useEffect(() => {
    // Filter present and absent employees for the current date
    const todayRecords = attendanceRecords.filter(
      (record) => record.date === currentDate
    );
    setTodayAttendance(todayRecords);
    setPresentEmployees(
      todayRecords.filter((record) => record.status === "Present")
    );
    setAbsentEmployees(
      todayRecords.filter((record) => record.status === "Absent")
    );

    // Calculate best performers (employees with most present days)
    const employeeAttendanceCount: { [employeeName: string]: number } = {};
    attendanceRecords.forEach((record) => {
      if (record.status === "Present") {
        employeeAttendanceCount[record.employeeName] =
          (employeeAttendanceCount[record.employeeName] || 0) + 1;
      }
    });

    const sortedBestPerformers = Object.entries(employeeAttendanceCount)
      .sort(([, a], [, b]) => b - a)
      .map(([employeeName, presentDays]) => ({ employeeName, presentDays }));

    setBestPerformers(sortedBestPerformers);
  }, [attendanceRecords, currentDate]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentDate(e.target.value);
  };

  const updateAttendanceStatus = (
    employeeId: number,
    newStatus: "Present" | "Absent" | "Late"
  ) => {
    setAttendanceRecords(
      attendanceRecords.map((record) =>
        record.employeeId === employeeId && record.date === currentDate
          ? { ...record, status: newStatus }
          : record
      )
    );
  };

  return (
    <div className="p-4 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center">
            <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-lg">
              <CalendarCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                Selected Date
              </p>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {new Date(currentDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center">
            <div className="bg-green-100 dark:bg-green-800 p-2 rounded-lg">
              <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                Present Today
              </p>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {presentEmployees.length} employees
              </p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center">
            <div className="bg-red-100 dark:bg-red-800 p-2 rounded-lg">
              <UserX className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                Absent Today
              </p>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {absentEmployees.length} employees
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center">
            <div className="bg-yellow-100 dark:bg-yellow-800 p-2 rounded-lg">
              <Award className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                Top Performer
              </p>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {bestPerformers.length > 0
                  ? bestPerformers[0].employeeName
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Date Picker with History Button */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
              Attendance Date
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Select a date to view attendance records
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <label
                htmlFor="attendanceDate"
                className="mr-2 font-medium text-gray-700 dark:text-gray-300"
              >
                Date:
              </label>
              <input
                type="date"
                id="attendanceDate"
                value={currentDate}
                onChange={handleDateChange}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              />
            </div>
            <button
              onClick={() => setHistoryDialogOpen(true)}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
            >
              <History className="h-4 w-4 mr-2" />
              View History
            </button>
          </div>
        </div>
      </div>

      {/* Today's Attendance with Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Today's Attendance
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50">
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  ID
                </th>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Employee
                </th>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {todayAttendance.length > 0 ? (
                todayAttendance.map((record) => (
                <tr
                  key={`${record.employeeId}-${record.date}`}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="py-4 px-6 text-sm text-gray-800 dark:text-gray-200">
                    {record.employeeId}
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-800 dark:text-gray-200 font-medium">
                    {record.employeeName}
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${
                        record.status === "Present"
                          ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                          : record.status === "Absent"
                          ? "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
                      }`}
                    >
                      {record.status === "Present" ? (
                        <UserCheck className="h-3 w-3 mr-1" />
                      ) : record.status === "Absent" ? (
                        <UserX className="h-3 w-3 mr-1" />
                      ) : (
                        <Clock className="h-3 w-3 mr-1" />
                      )}
                      {record.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          updateAttendanceStatus(record.employeeId, "Present")
                        }
                        className={`px-3 py-1 text-xs rounded-md ${
                          record.status === "Present"
                            ? "bg-green-500 text-white"
                            : "bg-green-100 text-green-800 hover:bg-green-200"
                        }`}
                      >
                        Present
                      </button>
                      <button
                        onClick={() =>
                          updateAttendanceStatus(record.employeeId, "Late")
                        }
                        className={`px-3 py-1 text-xs rounded-md ${
                          record.status === "Late"
                            ? "bg-yellow-500 text-white"
                            : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                        }`}
                      >
                        Late
                      </button>
                      <button
                        onClick={() =>
                          updateAttendanceStatus(record.employeeId, "Absent")
                        }
                        className={`px-3 py-1 text-xs rounded-md ${
                          record.status === "Absent"
                            ? "bg-red-500 text-white"
                            : "bg-red-100 text-red-800 hover:bg-red-200"
                        }`}
                      >
                        Absent
                      </button>
                    </div>
                  </td>
                </tr>
              ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No employees found. Please add an employee first.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Present Employees */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center mb-4">
            <UserCheck className="h-5 w-5 text-green-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Present Employees
            </h2>
          </div>
          {presentEmployees.length > 0 ? (
            <ul className="space-y-2">
              {presentEmployees.map((employee) => (
                <li
                  key={employee.employeeId}
                  className="py-2 px-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded flex items-center"
                >
                  <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                  <span className="text-gray-800 dark:text-gray-200">
                    {employee.employeeName}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">
              No employees present on this date.
            </p>
          )}
        </div>

        {/* Absent Employees */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center mb-4">
            <UserX className="h-5 w-5 text-red-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Absent Employees
            </h2>
          </div>
          {absentEmployees.length > 0 ? (
            <ul className="space-y-2">
              {absentEmployees.map((employee) => (
                <li
                  key={employee.employeeId}
                  className="py-2 px-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded flex items-center"
                >
                  <span className="h-2 w-2 bg-red-500 rounded-full mr-2"></span>
                  <span className="text-gray-800 dark:text-gray-200">
                    {employee.employeeName}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">
              No employees absent on this date.
            </p>
          )}
        </div>

        {/* Best Performers */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center mb-4">
            <Award className="h-5 w-5 text-yellow-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Top Performers
            </h2>
          </div>
          {bestPerformers.length > 0 ? (
            <ul className="space-y-2">
              {bestPerformers.slice(0, 5).map((performer, index) => (
                <li
                  key={index}
                  className="py-2 px-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 rounded flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <span
                      className={`h-5 w-5 flex items-center justify-center rounded-full mr-2 ${
                        index === 0
                          ? "bg-yellow-500 text-white"
                          : "bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="text-gray-800 dark:text-gray-200">
                      {performer.employeeName}
                    </span>
                  </div>
                  <span className="bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 py-1 px-2 rounded text-xs font-medium">
                    {performer.presentDays} days
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">
              No attendance data available.
            </p>
          )}
        </div>
      </div>

      {/* Attendance History Dialog */}
      <AttendanceHistory
        records={attendanceRecords}
        isOpen={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        currentPage={currentHistoryPage}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentHistoryPage}
      />
    </div>
  );
};

export default AttendancePage;
