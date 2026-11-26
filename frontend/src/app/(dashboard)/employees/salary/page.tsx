"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { employeeService } from "@/services/employee.service";
import {
  CreditCard,
  DollarSign,
  Calendar,
  ArrowDown,
  ArrowUp,
  Search,
  Filter,
  User,
  Plus,
} from "lucide-react";
import Image from "next/image";

// Define type for salary payment history
type SalaryPayment = {
  id: string;
  date: string;
  amount: number;
  bonus: number;
  deduction: number;
  message: string;
};

// Enhanced employee type with payment history
type Employee = {
  id: string;
  name: string;
  mobile: string;
  role: string;
  salary: number;
  paidSalary: number;
  totalSalary: number;
  gender: string;
  advanceBalance?: number;
  paymentHistory: SalaryPayment[];
  lastPaymentDate?: string;
};

// Enhanced payment display type that includes employee info
type PaymentWithEmployeeInfo = SalaryPayment & {
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  employeeGender: string;
};

const SalaryManagementPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedEmployeeId = searchParams.get("employee");

  // State for filter and search
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // Current year-month
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);

  // Auto pay day settings
  const [autoPayDay, setAutoPayDay] = useState<number>(25); // Default to 25th of each month
  const [autoPayEnabled, setAutoPayEnabled] = useState<boolean>(true);
  const [showDueOnly, setShowDueOnly] = useState<boolean>(false);

  // Current date for checking payment dues
  const currentDate = new Date();
  const currentDay = currentDate.getDate();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // State for payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [paymentBonus, setPaymentBonus] = useState(0);
  const [paymentDeduction, setPaymentDeduction] = useState(0);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [paymentError, setPaymentError] = useState("");

  // Real dynamic employee data from Supabase backend
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch real employee and salary data
  useEffect(() => {
    const fetchEmployeesAndSalary = async () => {
      try {
        setLoading(true);
        const [empRes, sumRes] = await Promise.allSettled([
          employeeService.getEmployees(),
          employeeService.getSalarySummary({ month: selectedMonth })
        ]);

        if (empRes.status === "fulfilled" && empRes.value) {
          const emps: Employee[] = (empRes.value.employees || []).map((e: any) => ({
            id: e.id,
            name: e.name || (e.firstName ? `${e.firstName} ${e.lastName || ''}`.trim() : 'Employee'),
            mobile: e.phone || '',
            role: e.designation || e.role || 'Staff',
            salary: Number(e.salary || 0),
            paidSalary: Number(e.paidSalary || 0),
            totalSalary: Number(e.salary || 0),
            advanceBalance: Number(e.advanceBalance || 0),
            gender: e.gender || 'male',
            paymentHistory: e.paymentHistory || [],
            lastPaymentDate: e.lastPaymentDate || '',
          }));
          setEmployees(emps);
        } else {
          setEmployees([]);
        }

        if (sumRes.status === "fulfilled" && sumRes.value) {
          setTotalSalaryBudget(Number(sumRes.value.totalSalaryBudget || 0));
          setTotalPaid(Number(sumRes.value.totalPaid || 0));
          setTotalPending(Number(sumRes.value.totalPending || 0));
        }
      } catch (err) {
        console.error("Error fetching salary data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeesAndSalary();
  }, [selectedMonth]);

  // Get all payments from all employees
  const allPayments = useMemo<PaymentWithEmployeeInfo[]>(() => {
    return employees
      .flatMap((employee) =>
        employee.paymentHistory.map((payment) => ({
          ...payment,
          employeeId: employee.id,
          employeeName: employee.name,
          employeeRole: employee.role,
          employeeGender: employee.gender,
        }))
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [employees]);

  // Calculate statistics
  const [totalSalaryBudget, setTotalSalaryBudget] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalPending, setTotalPending] = useState(0);

  // Check for query parameters on component mount
  useEffect(() => {
    if (selectedEmployeeId) {
      const employee = employees.find((emp) => emp.id === selectedEmployeeId);
      if (employee) {
        openPaymentModal(employee);
      }
    }
  }, [selectedEmployeeId, employees]);

  // Calculate totals when data changes
  useEffect(() => {
    // Get payments for selected month
    const selectedMonthPayments = allPayments.filter((payment) =>
      payment.date.startsWith(selectedMonth)
    );

    // Calculate total budget (sum of all base salaries)
    const budget = employees.reduce((sum, emp) => sum + emp.salary, 0);
    setTotalSalaryBudget(budget);

    // Calculate total paid for the month
    const paid = selectedMonthPayments.reduce(
      (sum, payment) =>
        sum + payment.amount + payment.bonus - payment.deduction,
      0
    );
    setTotalPaid(paid);

    // Calculate total pending
    setTotalPending(budget - paid);
  }, [employees, allPayments, selectedMonth]);

  // Function to get profile image - defaults to clean neutral avatar
  const getProfileImage = (name?: string, gender?: string) => {
    return '/default-avatar.svg';
  };

  // Filter payments based on search and filters
  const filteredPayments = useMemo(() => {
    return allPayments.filter((payment) => {
      // Filter by month if selected
      if (selectedMonth && !payment.date.startsWith(selectedMonth)) {
        return false;
      }

      // Filter by search term
      if (
        searchQuery &&
        !payment.employeeName
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) &&
        !payment.message.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }, [allPayments, selectedMonth, searchQuery]);

  // Add function to calculate next payment date
  const calculateNextPaymentDate = (employee: Employee) => {
    // Get current date information
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    // Start with current month's pay day
    let nextPaymentMonth = currentMonth;
    let nextPaymentYear = currentYear;

    // If we've already passed this month's pay day, move to next month
    if (
      currentDay > autoPayDay ||
      (employee.lastPaymentDate &&
        new Date(employee.lastPaymentDate).getMonth() === currentMonth &&
        new Date(employee.lastPaymentDate).getFullYear() === currentYear)
    ) {
      nextPaymentMonth = currentMonth + 1;
      // Handle year rollover
      if (nextPaymentMonth > 11) {
        nextPaymentMonth = 0;
        nextPaymentYear++;
      }
    }

    // Create the next payment date
    const nextPaymentDate = new Date(
      nextPaymentYear,
      nextPaymentMonth,
      autoPayDay
    );

    // Format as YYYY-MM-DD for input field
    return nextPaymentDate.toISOString().split("T")[0];
  };

  // Updated openPaymentModal function to use next payment date
  const openPaymentModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setPaymentAmount(employee.salary);

    // Calculate and use next payment date based on auto pay settings
    if (autoPayEnabled) {
      const nextPayDate = calculateNextPaymentDate(employee);
      setPaymentDate(nextPayDate);

      // Set month name for the payment message based on next payment date
      const nextPayMonth = new Date(nextPayDate).toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
      setPaymentMessage(`Salary for ${nextPayMonth}`);
    } else {
      // If auto pay disabled, default to today
      setPaymentDate(new Date().toISOString().split("T")[0]);
      setPaymentMessage(
        `Salary for ${new Date().toLocaleString("default", {
          month: "long",
          year: "numeric",
        })}`
      );
    }

    setPaymentBonus(0);
    // Auto-detect Upad / Advance from Expenses
    const advance = Number(employee.advanceBalance || 0);
    setPaymentDeduction(advance);
    setPaymentError("");
    setShowPaymentModal(true);
  };

  // Function to get the display text for next payment date
  const getNextPaymentText = (employee: Employee) => {
    const nextDate = calculateNextPaymentDate(employee);
    return new Date(nextDate).toLocaleDateString("default", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Function to check if an employee payment is due soon (within next 7 days)
  const isPaymentDueSoon = (employee: Employee) => {
    if (!autoPayEnabled) return false;

    const nextPaymentDate = new Date(calculateNextPaymentDate(employee));
    const today = new Date();
    const diffTime = nextPaymentDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays >= 0 && diffDays <= 7; // Due within next 7 days
  };

  // Function to check if employee already received salary this month
  const hasSalaryForCurrentMonth = (employee: Employee, payDate: string) => {
    const paymentMonth = new Date(payDate).getMonth();
    const paymentYear = new Date(payDate).getFullYear();

    return employee.paymentHistory.some((payment) => {
      const paymentDate = new Date(payment.date);
      return (
        paymentDate.getMonth() === paymentMonth &&
        paymentDate.getFullYear() === paymentYear
      );
    });
  };

  // Function to process salary payment
  const processSalaryPayment = async () => {
    if (!selectedEmployee) return;

    // Validate payment date
    if (!paymentDate) {
      setPaymentError("Payment date is required");
      return;
    }

    // Check if employee already received salary this month
    if (hasSalaryForCurrentMonth(selectedEmployee, paymentDate)) {
      setPaymentError("Employee has already received salary for this month");
      return;
    }

    // Calculate final amount
    const finalAmount = paymentAmount + paymentBonus - paymentDeduction;

    if (finalAmount < 0) {
      setPaymentError("Final payment amount cannot be negative");
      return;
    }

    try {
      await employeeService.createSalaryPayment({
        employeeId: selectedEmployee.id,
        date: paymentDate,
        amount: paymentAmount,
        bonus: paymentBonus,
        deduction: paymentDeduction,
        message: paymentMessage,
      });

      // Create new payment record
      const newPayment: SalaryPayment = {
        id: `P${Math.floor(Math.random() * 10000)}`,
        date: paymentDate,
        amount: paymentAmount,
        bonus: paymentBonus,
        deduction: paymentDeduction,
        message: paymentMessage,
      };

      // Update employee data with deducted advance
      const remainingAdvance = Math.max(0, Number(selectedEmployee.advanceBalance || 0) - paymentDeduction);
      const updatedEmployees = employees.map((emp) => {
        if (emp.id === selectedEmployee.id) {
          return {
            ...emp,
            paidSalary: finalAmount,
            advanceBalance: remainingAdvance,
            lastPaymentDate: paymentDate,
            paymentHistory: [...emp.paymentHistory, newPayment],
          };
        }
        return emp;
      });

      setEmployees(updatedEmployees);
      setShowPaymentModal(false);

      // Clear the URL parameter after processing
      if (selectedEmployeeId) {
        router.push("/employees/salary");
      }
    } catch (err: any) {
      console.error("Error creating salary payment:", err);
      setPaymentError(err?.response?.data?.message || err?.message || "Failed to process salary payment");
    }
  };

  // Get status color for payment status indicators
  const getPaymentStatusColor = (payment: any) => {
    if (payment.bonus > 0 && payment.deduction === 0) {
      return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100";
    } else if (payment.deduction > 0 && payment.bonus === 0) {
      return "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100";
    } else if (payment.bonus > 0 && payment.deduction > 0) {
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100";
    } else {
      return "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100";
    }
  };

  // Get payment status label
  const getPaymentStatus = (payment: any) => {
    if (payment.bonus > 0 && payment.deduction === 0) {
      return "With Bonus";
    } else if (payment.deduction > 0 && payment.bonus === 0) {
      return "With Deduction";
    } else if (payment.bonus > 0 && payment.deduction > 0) {
      return "Mixed";
    } else {
      return "Regular";
    }
  };

  // Function to determine if an employee is due for payment
  const isEmployeeDueForPayment = (employee: Employee) => {
    if (!autoPayEnabled) return false;

    // Check if employee has been paid this month already
    const hasBeenPaidThisMonth = employee.paymentHistory.some((payment) => {
      const paymentDate = new Date(payment.date);
      return (
        paymentDate.getMonth() === currentMonth &&
        paymentDate.getFullYear() === currentYear
      );
    });

    // Employee is due if today is >= auto pay day and they haven't been paid this month
    return !hasBeenPaidThisMonth && currentDay >= autoPayDay;
  };

  // Filter employees based on payment due status
  const employeesDueForPayment = useMemo(() => {
    return employees.filter((emp) => isEmployeeDueForPayment(emp));
  }, [
    employees,
    autoPayDay,
    autoPayEnabled,
    currentDay,
    currentMonth,
    currentYear,
  ]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center">
            <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                Total Salary Budget
              </p>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-200">
                ₹{totalSalaryBudget.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center">
            <div className="bg-green-100 dark:bg-green-800 p-2 rounded-lg">
              <ArrowUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                Total Paid ({selectedMonth})
              </p>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-200">
                ₹{totalPaid.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center">
            <div className="bg-red-100 dark:bg-red-800 p-2 rounded-lg">
              <ArrowDown className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                Total Pending ({selectedMonth})
              </p>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-200">
                ₹{totalPending.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Auto Pay Settings */}
      <div className="glass-card p-4 rounded-xl mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">
              Auto Pay Settings
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configure automatic payment schedule for all employees
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoPayEnabled"
                checked={autoPayEnabled}
                onChange={(e) => setAutoPayEnabled(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="autoPayEnabled"
                className="text-gray-700 dark:text-gray-300"
              >
                Auto Pay Enabled
              </label>
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="autoPayDay"
                className="text-gray-700 dark:text-gray-300 whitespace-nowrap"
              >
                Pay Day:
              </label>
              <select
                id="autoPayDay"
                value={autoPayDay}
                onChange={(e) => setAutoPayDay(Number(e.target.value))}
                disabled={!autoPayEnabled}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg w-16 disabled:opacity-60"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
              <span className="text-gray-700 dark:text-gray-300">
                of each month
              </span>
            </div>

            {employeesDueForPayment.length > 0 && (
              <button
                onClick={() => setShowDueOnly(!showDueOnly)}
                className={`px-3 py-1 rounded-full text-sm ${
                  showDueOnly
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                {showDueOnly
                  ? "Show All"
                  : `${employeesDueForPayment.length} Due for Payment`}
              </button>
            )}

            {employeesDueForPayment.length > 0 && (
              <button
                onClick={() => {
                  // Open bulk payment modal or start bulk payment process
                  // For now, we'll just process the first employee as an example
                  if (employeesDueForPayment.length > 0) {
                    openPaymentModal(employeesDueForPayment[0]);
                  }
                }}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm flex items-center gap-1"
              >
                <DollarSign size={16} />
                Pay All Due ({employeesDueForPayment.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Actions */}
      <div className="glass-card p-4 rounded-xl mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:flex-initial">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search payments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg w-full"
              />
            </div>

            <div className="flex items-center">
              <label
                htmlFor="month"
                className="mr-2 text-gray-700 dark:text-gray-300 whitespace-nowrap"
              >
                Month:
              </label>
              <input
                type="month"
                id="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
              />
            </div>
          </div>

          <button
            onClick={() => setShowPaymentModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={18} />
            New Payment
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="glass-card p-4 rounded-xl">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
          Salary Payment History
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                  Base Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                  Bonus
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                  Deduction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => {
                  const total =
                    payment.amount + payment.bonus - payment.deduction;

                  return (
                    <tr
                      key={payment.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
                            <Image
                              src={getProfileImage(
                                payment.employeeName,
                                payment.employeeGender
                              )}
                              alt={payment.employeeName}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <span className="text-gray-900 dark:text-gray-300">
                            {payment.employeeName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {payment.employeeRole}
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {new Date(payment.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        ₹{payment.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-green-600 dark:text-green-400">
                        {payment.bonus > 0
                          ? `+₹${payment.bonus.toLocaleString()}`
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-red-600 dark:text-red-400">
                        {payment.deduction > 0
                          ? `-₹${payment.deduction.toLocaleString()}`
                          : "—"}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                        ₹{total.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
                            payment
                          )}`}
                        >
                          {getPaymentStatus(payment)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    No payments found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee List */}
      <div className="glass-card p-4 rounded-xl">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
          Employee Salary Details
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                  Base Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-600 dark:text-purple-400 uppercase">
                  Upad / Advance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                  Last Paid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                  Last Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                  Next Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {employees.filter((emp) => !showDueOnly || isEmployeeDueForPayment(emp)).length > 0 ? (
                employees
                .filter((emp) => !showDueOnly || isEmployeeDueForPayment(emp))
                .map((employee) => {
                  const isDue = isEmployeeDueForPayment(employee);
                  const isDueSoon = isPaymentDueSoon(employee);
                  const nextPaymentText = getNextPaymentText(employee);

                  return (
                    <tr
                      key={employee.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                        isDue
                          ? "bg-yellow-50 dark:bg-yellow-900/10"
                          : isDueSoon
                          ? "bg-blue-50 dark:bg-blue-900/10"
                          : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
                            <Image
                              src={getProfileImage(
                                employee.name,
                                employee.gender
                              )}
                              alt={employee.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <span className="text-gray-900 dark:text-gray-300">
                            {employee.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {employee.role}
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        ₹{employee.salary.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        {Number(employee.advanceBalance || 0) > 0 ? (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 font-mono">
                            ₹{Number(employee.advanceBalance).toLocaleString("en-IN")}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs font-mono">₹0.00</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        ₹{employee.paidSalary.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {employee.lastPaymentDate
                          ? new Date(
                              employee.lastPaymentDate
                            ).toLocaleDateString()
                          : "Not paid yet"}
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {autoPayEnabled ? (
                          <span
                            className={
                              isDue
                                ? "text-yellow-600 dark:text-yellow-400 font-medium"
                                : isDueSoon
                                ? "text-blue-600 dark:text-blue-400 font-medium"
                                : ""
                            }
                          >
                            {nextPaymentText}
                          </span>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-500 italic text-sm">
                            Auto pay disabled
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isDue ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 rounded-full text-xs font-medium">
                            Payment Due
                          </span>
                        ) : isDueSoon ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 rounded-full text-xs font-medium">
                            Due Soon
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 rounded-full text-xs font-medium">
                            Paid
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openPaymentModal(employee)}
                          className={`px-3 py-1 text-white rounded hover:bg-opacity-90 text-xs flex items-center gap-1 ${
                            isDue
                              ? "bg-yellow-500 hover:bg-yellow-600"
                              : isDueSoon
                              ? "bg-blue-500 hover:bg-blue-600"
                              : "bg-green-500 hover:bg-green-600"
                          }`}
                        >
                          <DollarSign size={12} />
                          {isDue || isDueSoon ? "Pay Now" : "Pay Salary"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No employees found. Please add an employee first.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salary Payment Modal */}
      {showPaymentModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowPaymentModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl p-5 w-full max-w-3xl shadow-xl overflow-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Process Salary Payment
              </h2>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  if (selectedEmployeeId) {
                    router.push("/employees/salary");
                  }
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="bg-gray-50 dark:bg-gray-800/60 p-3 rounded-lg mb-4">
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Employee:</span>{" "}
                    <span className="font-semibold">
                      {selectedEmployee
                        ? selectedEmployee.name
                        : "Select an employee"}
                    </span>
                  </p>
                  {selectedEmployee && (
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Standard Salary:</span>{" "}
                      <span className="font-semibold">
                        ₹{selectedEmployee.salary.toLocaleString()}
                      </span>
                    </p>
                  )}
                </div>

                {paymentError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm">
                    {paymentError}
                  </div>
                )}

                <div className="space-y-3">
                  {!selectedEmployee && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Select Employee
                      </label>
                      <select
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                        onChange={(e) => {
                          const selected = employees.find(
                            (emp) => emp.id === e.target.value
                          );
                          if (selected) {
                            setSelectedEmployee(selected);
                            setPaymentAmount(selected.salary);
                          }
                        }}
                      >
                        <option value="">Select an employee</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} - {emp.role}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Payment Date
                    </label>
                    <div className="relative">
                      <Calendar
                        size={16}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => {
                          setPaymentDate(e.target.value);
                          // Update the payment message when date changes
                          const selectedDate = new Date(e.target.value);
                          const monthYear = selectedDate.toLocaleString(
                            "default",
                            {
                              month: "long",
                              year: "numeric",
                            }
                          );
                          setPaymentMessage(`Salary for ${monthYear}`);
                        }}
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                      />
                    </div>
                    {autoPayEnabled && selectedEmployee && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Auto-selected next payment date based on your pay day
                        settings
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Salary Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Bonus (₹)
                      </label>
                      <input
                        type="number"
                        value={paymentBonus}
                        onChange={(e) =>
                          setPaymentBonus(Number(e.target.value))
                        }
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Deduction / Upad (₹)
                        </label>
                        {Number(selectedEmployee?.advanceBalance || 0) > 0 && (
                          <button
                            type="button"
                            onClick={() => setPaymentDeduction(Number(selectedEmployee?.advanceBalance || 0))}
                            className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium cursor-pointer"
                          >
                            Apply Full Upad
                          </button>
                        )}
                      </div>
                      <input
                        type="number"
                        value={paymentDeduction}
                        onChange={(e) =>
                          setPaymentDeduction(Number(e.target.value))
                        }
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                      />
                      {Number(selectedEmployee?.advanceBalance || 0) > 0 && (
                        <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                          Auto-detected Upad: ₹{Number(selectedEmployee?.advanceBalance || 0).toLocaleString("en-IN")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Message/Note
                  </label>
                  <textarea
                    value={paymentMessage}
                    onChange={(e) => setPaymentMessage(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                    rows={3}
                    placeholder="e.g., Salary for June 2023"
                  />
                </div>

                <div className="mt-4 bg-gray-50 dark:bg-gray-800/60 rounded-lg p-3">
                  <h3 className="font-medium mb-2 text-gray-800 dark:text-gray-200">
                    Payment Summary
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600 dark:text-gray-400">
                        Base Salary:
                      </span>
                      <span className="font-medium">
                        ₹{paymentAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600 dark:text-gray-400">
                        Bonus:
                      </span>
                      <span className="font-medium text-green-600">
                        +₹{paymentBonus.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600 dark:text-gray-400">
                        Deduction:
                      </span>
                      <span className="font-medium text-red-600">
                        -₹{paymentDeduction.toLocaleString()}
                      </span>
                    </div>
                    <div className="col-span-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between font-bold">
                        <span className="text-gray-900 dark:text-white">
                          Total Payment:
                        </span>
                        <span className="text-lg">
                          ₹
                          {(
                            paymentAmount +
                            paymentBonus -
                            paymentDeduction
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowPaymentModal(false);
                      if (selectedEmployeeId) {
                        router.push("/employees/salary");
                      }
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={processSalaryPayment}
                    disabled={!selectedEmployee}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Process Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryManagementPage;
