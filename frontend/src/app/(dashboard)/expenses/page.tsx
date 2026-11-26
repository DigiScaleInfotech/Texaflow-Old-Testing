"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { OrderCard } from "@/components/ui/order/order-card";
import {
  Wallet,
  Plus,
  Trash2,
  Download,
  Receipt,
  Calendar,
  Layers,
  TrendingDown,
  Clock,
  CheckCircle2,
  Edit2,
  Eye,
  FileText,
  X,
  FileSpreadsheet,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  financeService,
  ExpenseItem,
} from "@/services/finance.service";
import { formatShortId, formatCurrency } from "@/utils/format";

const STANDARD_CATEGORIES = [
  "Karigar Salary",
  "Electricity & Power",
  "Worker Advance / Upad",
  "Machine Maintenance & Repairs",
  "Packaging Materials",
  "Dhaga & Consumables",
  "Logistics & Courier",
  "Rent",
  "Office & Refreshment",
  "Other",
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoryBreakdown, setCategoryBreakdown] = useState<Record<string, number>>({});
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState("all");
  const [expenseSearch, setExpenseSearch] = useState("");

  // Date Range Filter
  const [dateFilter, setDateFilter] = useState("all"); // "all", "today", "this_month", "last_30_days", "custom"
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Receipt Modal
  const [viewingReceiptExpense, setViewingReceiptExpense] = useState<ExpenseItem | null>(null);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const res = await financeService.getExpenses();
      setExpenses(res.expenses || []);
      setCategoryBreakdown(res.summary?.categoryBreakdown || {});
    } catch (err: any) {
      console.error("Failed to load expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  // TopNav search listener
  useEffect(() => {
    const handleSearch = (e: any) => {
      const q = typeof e.detail === "string" ? e.detail : "";
      setExpenseSearch(q);
    };
    window.addEventListener("expense-search", handleSearch);
    window.addEventListener("finance-search", handleSearch);
    return () => {
      window.removeEventListener("expense-search", handleSearch);
      window.removeEventListener("finance-search", handleSearch);
    };
  }, []);

  // Quick Date Preset Changes
  const handleDatePresetChange = (preset: string) => {
    setDateFilter(preset);
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    if (preset === "all") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "today") {
      setStartDate(today);
      setEndDate(today);
    } else if (preset === "this_month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];
      setStartDate(firstDay);
      setEndDate(today);
    } else if (preset === "last_30_days") {
      const past30 = new Date(Date.now() - 30 * 86400000)
        .toISOString()
        .split("T")[0];
      setStartDate(past30);
      setEndDate(today);
    }
  };

  // Filtered Expenses (Category, Date Range, Search)
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (expenseCategoryFilter !== "all" && e.category !== expenseCategoryFilter) return false;

      // Date Filtering
      if (startDate || endDate) {
        if (!e.expenseDate) return false;
        const eDate = new Date(e.expenseDate).toISOString().split("T")[0];
        if (startDate && eDate < startDate) return false;
        if (endDate && eDate > endDate) return false;
      }

      // Search Filtering
      if (
        expenseSearch &&
        !e.title?.toLowerCase().includes(expenseSearch.toLowerCase()) &&
        !e.paidTo?.toLowerCase().includes(expenseSearch.toLowerCase()) &&
        !e.expenseNumber?.toLowerCase().includes(expenseSearch.toLowerCase()) &&
        !e.referenceNumber?.toLowerCase().includes(expenseSearch.toLowerCase()) &&
        !e.category?.toLowerCase().includes(expenseSearch.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [expenses, expenseCategoryFilter, expenseSearch, startDate, endDate]);

  // Stats Calculations (calculated from currently active filters)
  const totalExpensesAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [filteredExpenses]);

  const thisMonthExpensesAmount = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    return expenses.reduce((sum, e) => {
      if (!e.expenseDate) return sum;
      const d = new Date(e.expenseDate);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        return sum + (Number(e.amount) || 0);
      }
      return sum;
    }, 0);
  }, [expenses]);

  const topCategory = useMemo(() => {
    const entries = Object.entries(categoryBreakdown);
    if (entries.length === 0) return "None";
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  }, [categoryBreakdown]);

  // Handle Delete
  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense record?")) return;
    try {
      await financeService.deleteExpense(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      await loadExpenses();
    } catch (err: any) {
      alert(err?.message || "Failed to delete expense");
    }
  };

  // Excel Exporter
  const handleExportExpenses = () => {
    const rows: Record<string, any>[] = filteredExpenses.map((e) => ({
      "Expense #": e.expenseNumber || formatShortId(e.id, "EXP"),
      "Voucher Date": e.expenseDate ? new Date(e.expenseDate).toLocaleDateString("en-IN") : "—",
      "Category": e.category || "—",
      "Payee / Shop": e.paidTo || "—",
      "Payment Mode": e.paymentMode || "Cash",
      "Status": (e.paymentStatus || "Paid") as string,
      "Bill / Ref #": e.referenceNumber || "—",
      "Remarks": e.notes || "—",
      "Amount (₹)": Number(e.amount) || 0,
    }));

    // Add total row
    rows.push({
      "Expense #": "",
      "Voucher Date": "",
      "Category": "",
      "Payee / Shop": "",
      "Payment Mode": "",
      "Status": "Total Expenses",
      "Bill / Ref #": "",
      "Remarks": "",
      "Amount (₹)": totalExpensesAmount,
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = [
      { wch: 14 },
      { wch: 14 },
      { wch: 24 },
      { wch: 22 },
      { wch: 16 },
      { wch: 14 },
      { wch: 16 },
      { wch: 28 },
      { wch: 16 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");
    XLSX.writeFile(workbook, "Expenses.xlsx");
  };

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans'] pb-12">
      {/* Top Banner / Summary Stats - Exactly matching Challans & Orders page */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <OrderCard
          title={startDate || endDate ? "Period Expenses" : "Total Expenses"}
          value={`₹${formatCurrency(totalExpensesAmount)}`}
          icon={<TrendingDown className="text-blue-500" size={20} />}
          trend={{ value: 0, isPositive: true }}
        />
        <OrderCard
          title="This Month"
          value={`₹${formatCurrency(thisMonthExpensesAmount)}`}
          icon={<Calendar className="text-green-500" size={20} />}
          trend={{ value: 0, isPositive: true }}
        />
        <OrderCard
          title="Top Category"
          value={topCategory}
          icon={<Layers className="text-yellow-500" size={20} />}
          trend={{ value: 0, isPositive: true }}
        />
        <OrderCard
          title="Total Records"
          value={filteredExpenses.length}
          icon={<Receipt className="text-orange-500" size={20} />}
          trend={{ value: 0, isPositive: true }}
        />
      </div>

      {/* Control Bar: Filters & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-3">
        {/* Left Side: Category + Date Range Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
              Category:
            </span>
            <select
              value={expenseCategoryFilter}
              onChange={(e) => setExpenseCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-[#202936] border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 min-w-[200px] shadow-sm cursor-pointer"
            >
              <option value="all">All Categories</option>
              {STANDARD_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap flex items-center gap-1">
              <Calendar size={14} className="text-gray-400" />
              Period:
            </span>
            <select
              value={dateFilter}
              onChange={(e) => handleDatePresetChange(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-[#202936] border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 shadow-sm cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="this_month">This Month</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Pickers */}
          {dateFilter === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-[#202936] border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 shadow-sm cursor-pointer"
              />
              <span className="text-xs font-semibold text-gray-400 uppercase">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-[#202936] border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 shadow-sm cursor-pointer"
              />
            </div>
          )}

          {(expenseCategoryFilter !== "all" || dateFilter !== "all") && (
            <button
              onClick={() => {
                setExpenseCategoryFilter("all");
                setDateFilter("all");
                setStartDate("");
                setEndDate("");
              }}
              className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 font-medium cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-2">
          {/* Export Excel */}
          <button
            onClick={handleExportExpenses}
            className="px-3.5 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm flex items-center gap-1.5 transition-all bg-white dark:bg-gray-800/50 whitespace-nowrap shadow-sm cursor-pointer"
            title="Export Expenses to Excel (.xlsx)"
          >
            <FileSpreadsheet size={16} className="text-emerald-500" />
            Export Excel
          </button>

          {/* Add Expense Button */}
          <Link
            href="/expenses/add"
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus size={16} />
            Add Expense
          </Link>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="space-y-4">
        <div className="glass-card rounded-xl border border-gray-100 dark:border-gray-800">
          <div className="overflow-x-auto md:overflow-visible">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold bg-gray-50/50 dark:bg-gray-800/30">
                  <th className="px-6 py-3.5 whitespace-nowrap">Expense #</th>
                  <th className="px-6 py-3.5 whitespace-nowrap">Voucher Date</th>
                  <th className="px-6 py-3.5 whitespace-nowrap">Category</th>
                  <th className="px-6 py-3.5 whitespace-nowrap">Payee / Shop</th>
                  <th className="px-6 py-3.5 whitespace-nowrap">Payment Mode</th>
                  <th className="px-6 py-3.5 whitespace-nowrap">Status</th>
                  <th className="px-6 py-3.5 text-right whitespace-nowrap">Amount</th>
                  <th className="px-6 py-3.5 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                      Loading expenses...
                    </td>
                  </tr>
                ) : filteredExpenses.length > 0 ? (
                  filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-gray-700 dark:text-gray-300" title={exp.id}>
                        {exp.expenseNumber || formatShortId(exp.id, "EXP")}
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {exp.expenseDate ? new Date(exp.expenseDate).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200 font-medium">
                        {exp.category}
                      </td>
                      <td className="px-6 py-4 text-gray-800 dark:text-gray-200 font-medium">
                        <div className="flex items-center gap-2">
                          <span>{exp.paidTo || "—"}</span>
                          {exp.receiptUrl && (
                            <button
                              type="button"
                              onClick={() => setViewingReceiptExpense(exp)}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[10px] font-mono border border-blue-200 dark:border-blue-800 hover:bg-blue-100 cursor-pointer"
                              title="View Attached Receipt"
                            >
                              <FileText size={10} />
                              Bill
                            </button>
                          )}
                        </div>
                        {exp.referenceNumber && (
                          <span className="block text-xs font-mono text-gray-400 dark:text-gray-500">
                            Ref: {exp.referenceNumber}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300 text-xs font-mono">
                        {exp.paymentMode || "Cash"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {exp.paymentStatus === "Pending" ? (
                          <span className="text-amber-600 dark:text-amber-400">
                            Pending
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            Paid
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-right text-rose-600 dark:text-rose-400">
                        ₹{Number(exp.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Receipt Button */}
                          {exp.receiptUrl && (
                            <button
                              onClick={() => setViewingReceiptExpense(exp)}
                              title="View Attached Receipt"
                              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                            >
                              <Eye size={16} />
                            </button>
                          )}

                          {/* Edit Button */}
                          <Link
                            href={`/expenses/edit/${exp.id}`}
                            title="Edit Expense"
                            className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 size={16} />
                          </Link>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            title="Delete Expense"
                            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                      {expenseSearch
                        ? `No expenses matching "${expenseSearch}".`
                        : "No expenses found for the selected category and period."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ==================== VIEW RECEIPT MODAL ==================== */}
      {viewingReceiptExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl p-6 bg-white dark:bg-[#202936]">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="text-blue-500" size={20} />
                <h3 className="font-bold text-base text-gray-900 dark:text-white">
                  Attached Bill / Receipt
                </h3>
              </div>
              <button
                onClick={() => setViewingReceiptExpense(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 py-2 text-sm">
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-400">Expense Details</p>
                <p className="font-semibold text-gray-900 dark:text-white mt-0.5">
                  {viewingReceiptExpense.title || viewingReceiptExpense.category}
                </p>
                <p className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 mt-1">
                  ₹{Number(viewingReceiptExpense.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900/40">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Receipt File</p>
                <p className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1 break-all">
                  {viewingReceiptExpense.receiptUrl}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-800 mt-4">
              <button
                type="button"
                onClick={() => setViewingReceiptExpense(null)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
