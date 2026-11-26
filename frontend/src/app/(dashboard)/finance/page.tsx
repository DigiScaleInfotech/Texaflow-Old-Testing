"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Search,
  Filter,
  Trash2,
  Printer,
  Receipt,
  BookOpen,
  Calendar,
  CreditCard,
  Building2,
  Users,
  X,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  Download,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import {
  financeService,
  PaymentItem,
  ExpenseItem,
  LedgerResponse,
  FinanceSummary,
} from "@/services/finance.service";
import { customerService } from "@/services/customer.service";
import { formatShortId, formatCurrency } from "@/utils/format";

function formatLedgerDescription(desc?: string): string {
  if (!desc) return "—";
  const upper = desc.toUpperCase();
  if (upper.includes("BANK TRANSFER") || upper.includes("NEFT") || upper.includes("RTGS") || upper.includes("IMPS")) {
    return "Bank Transfer";
  }
  if (upper.includes("UPI")) {
    return "UPI";
  }
  if (upper.includes("CASH")) {
    return "Cash";
  }
  if (upper.includes("CHEQUE") || upper.includes("CHECK")) {
    return "Cheque";
  }
  if (upper.includes("STARTING") || upper.includes("OPENING")) {
    return "Opening Balance";
  }
  return desc;
}

type FinanceTab = "ledger" | "expenses";

export default function FinancePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/ledger");
  }, [router]);

  const [activeTab, setActiveTab] = useState<FinanceTab>("ledger");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Summary State
  const [summary, setSummary] = useState<FinanceSummary | null>(null);

  // Payments Tab State
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>("all");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [showPaymentFilterMenu, setShowPaymentFilterMenu] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    type: "in" as "in" | "out",
    partyType: "customer" as "customer" | "vendor",
    partyId: "",
    partyName: "",
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMode: "Bank Transfer",
    referenceNumber: "",
    notes: "",
  });

  // Expenses Tab State
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState("all");
  const [expenseSearch, setExpenseSearch] = useState("");
  const [showExpenseFilterMenu, setShowExpenseFilterMenu] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    category: "Office Supplies",
    amount: "",
    expenseDate: new Date().toISOString().split("T")[0],
    paymentMode: "Cash",
    paidTo: "",
    referenceNumber: "",
    notes: "",
  });

  // Ledger Tab State
  const [selectedPartyId, setSelectedPartyId] = useState("");
  const [ledgerData, setLedgerData] = useState<LedgerResponse | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerSearch, setLedgerSearch] = useState("");

  // Customer List (for dropdowns)
  const [customers, setCustomers] = useState<{ id: string; name: string; phone?: string }[]>([]);

  // Close filter dropdowns on outside click
  const paymentFilterRef = useRef<HTMLDivElement>(null);
  const expenseFilterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (paymentFilterRef.current && !paymentFilterRef.current.contains(target)) {
        setShowPaymentFilterMenu(false);
      }
      if (expenseFilterRef.current && !expenseFilterRef.current.contains(target)) {
        setShowExpenseFilterMenu(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Load initial data
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load overall summary
      const sum = await financeService.getSummary();
      setSummary(sum);

      // Load customers for selection
      const custRes: any = await customerService.getCustomers({ limit: 100 });
      const rawCusts = custRes?.customers || custRes?.data?.customers || (Array.isArray(custRes) ? custRes : []);
      const mappedCusts = rawCusts.map((c: any) => ({
        id: c.id,
        name: c.name || c.displayName || c.primaryContact || "Customer",
        phone: c.mobile || c.phone || "",
      }));
      setCustomers(mappedCusts);
      if (mappedCusts.length > 0 && !selectedPartyId) {
        setSelectedPartyId(mappedCusts[0].id);
      }

      // Load payments
      const payData = await financeService.getPayments();
      setPayments(payData?.payments || []);

      // Load expenses
      const expData = await financeService.getExpenses();
      setExpenses(expData?.expenses || []);
    } catch (err: any) {
      console.error("Error loading finance data:", err);
      setError(err?.message || "Failed to load finance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
    window.dispatchEvent(new CustomEvent("finance-tab-changed", { detail: "ledger" }));
  }, []);

  const handleTabSelect = (tab: FinanceTab) => {
    setActiveTab(tab);
    window.dispatchEvent(new CustomEvent("finance-tab-changed", { detail: tab }));
  };

  // Listen to search from TopNav
  useEffect(() => {
    const handleSearch = (e: any) => {
      const q = typeof e.detail === "string" ? e.detail : "";
      setPaymentSearch(q);
      setLedgerSearch(q);
      setExpenseSearch(q);
    };
    window.addEventListener("finance-search", handleSearch);
    return () => window.removeEventListener("finance-search", handleSearch);
  }, []);

  // Fetch ledger when party selection changes
  useEffect(() => {
    if (activeTab === "ledger" && selectedPartyId) {
      loadLedger(selectedPartyId);
    }
  }, [activeTab, selectedPartyId]);

  const loadLedger = async (partyId: string) => {
    try {
      setLedgerLoading(true);
      const res = await financeService.getPartyLedger({ partyType: "customer", partyId });
      setLedgerData(res);
    } catch (err: any) {
      console.error("Error fetching ledger:", err);
    } finally {
      setLedgerLoading(false);
    }
  };

  // Submit Payment
  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    try {
      setLoading(true);
      let pName = paymentForm.partyName;
      if (paymentForm.partyId) {
        const found = customers.find((c) => c.id === paymentForm.partyId);
        if (found) pName = found.name;
      }

      await financeService.createPayment({
        type: paymentForm.type,
        partyType: paymentForm.partyType,
        partyId: paymentForm.partyId || undefined,
        partyName: pName || "Cash Party",
        amount: parseFloat(paymentForm.amount),
        paymentDate: paymentForm.paymentDate,
        paymentMode: paymentForm.paymentMode,
        referenceNumber: paymentForm.referenceNumber || undefined,
        notes: paymentForm.notes || undefined,
      });

      setShowPaymentModal(false);
      setPaymentForm({
        type: "in",
        partyType: "customer",
        partyId: "",
        partyName: "",
        amount: "",
        paymentDate: new Date().toISOString().split("T")[0],
        paymentMode: "Bank Transfer",
        referenceNumber: "",
        notes: "",
      });

      // Reload data
      await loadInitialData();
    } catch (err: any) {
      alert(err?.message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  // Delete Payment
  const handleDeletePayment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payment record?")) return;
    try {
      await financeService.deletePayment(id);
      setPayments((prev) => prev.filter((p) => p.id !== id));
      // Refresh summary
      const sum = await financeService.getSummary();
      setSummary(sum);
    } catch (err: any) {
      alert(err?.message || "Failed to delete payment");
    }
  };

  // Submit Expense
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.title || !expenseForm.amount || parseFloat(expenseForm.amount) <= 0) {
      alert("Please fill all required fields with valid amount");
      return;
    }
    try {
      setLoading(true);
      await financeService.createExpense({
        title: expenseForm.title,
        category: expenseForm.category,
        amount: parseFloat(expenseForm.amount),
        expenseDate: expenseForm.expenseDate,
        paymentMode: expenseForm.paymentMode,
        paidTo: expenseForm.paidTo || undefined,
        referenceNumber: expenseForm.referenceNumber || undefined,
        notes: expenseForm.notes || undefined,
      });

      setShowExpenseModal(false);
      setExpenseForm({
        title: "",
        category: "Office Supplies",
        amount: "",
        expenseDate: new Date().toISOString().split("T")[0],
        paymentMode: "Cash",
        paidTo: "",
        referenceNumber: "",
        notes: "",
      });

      // Reload
      await loadInitialData();
    } catch (err: any) {
      alert(err?.message || "Failed to record expense");
    } finally {
      setLoading(false);
    }
  };

  // Delete Expense
  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense record?")) return;
    try {
      await financeService.deleteExpense(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      const sum = await financeService.getSummary();
      setSummary(sum);
    } catch (err: any) {
      alert(err?.message || "Failed to delete expense");
    }
  };

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (paymentTypeFilter !== "all" && p.type !== paymentTypeFilter) return false;
      if (
        paymentSearch &&
        !p.partyName?.toLowerCase().includes(paymentSearch.toLowerCase()) &&
        !p.paymentNumber?.toLowerCase().includes(paymentSearch.toLowerCase()) &&
        !p.referenceNumber?.toLowerCase().includes(paymentSearch.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [payments, paymentTypeFilter, paymentSearch]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (expenseCategoryFilter !== "all" && e.category !== expenseCategoryFilter) return false;
      if (
        expenseSearch &&
        !e.title?.toLowerCase().includes(expenseSearch.toLowerCase()) &&
        !e.paidTo?.toLowerCase().includes(expenseSearch.toLowerCase()) &&
        !e.expenseNumber?.toLowerCase().includes(expenseSearch.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [expenses, expenseCategoryFilter, expenseSearch]);

  // CSV Exporter Helper
  const exportToCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [
        headers.join(","),
        ...rows.map((row) =>
          row
            .map((val) => {
              const str = String(val ?? "").replace(/"/g, '""');
              return `"${str}"`;
            })
            .join(",")
        ),
      ].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPayments = () => {
    const headers = ["Payment #", "Date", "Type", "Party Name", "Payment Mode", "Reference #", "Amount (INR)"];
    const rows = filteredPayments.map((p) => [
      p.paymentNumber || p.id,
      p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("en-IN") : "",
      p.type === "in" ? "Payment In" : "Payment Out",
      p.partyName || "Cash Party",
      p.paymentMode || "",
      p.referenceNumber || "",
      p.amount,
    ]);
    exportToCSV("Texa_Payments", headers, rows);
  };

  const handleExportExpenses = () => {
    const headers = ["Expense #", "Date", "Category", "Title", "Paid To", "Payment Mode", "Reference #", "Amount (INR)"];
    const rows = filteredExpenses.map((e) => [
      e.expenseNumber || e.id,
      e.expenseDate ? new Date(e.expenseDate).toLocaleDateString("en-IN") : "",
      e.category,
      e.title,
      e.paidTo || "",
      e.paymentMode || "",
      e.referenceNumber || "",
      e.amount,
    ]);
    exportToCSV("Texa_Expenses", headers, rows);
  };

  // Filtered Ledger Statement (TopNav Search)
  const filteredLedgerStatement = useMemo(() => {
    const list: any[] = ledgerData?.statement || (ledgerData as any)?.entries || [];
    if (!list || list.length === 0) return [];
    if (!ledgerSearch) return list;
    const q = ledgerSearch.toLowerCase();
    return list.filter(
      (entry: any) =>
        (entry.voucherNo && entry.voucherNo.toLowerCase().includes(q)) ||
        (entry.referenceNumber && entry.referenceNumber.toLowerCase().includes(q)) ||
        (entry.description && entry.description.toLowerCase().includes(q)) ||
        (entry.type && entry.type.toLowerCase().includes(q))
    );
  }, [ledgerData, ledgerSearch]);

  const handleExportLedger = () => {
    const headers = ["Date", "Voucher/Ref #", "Type", "Description", "Debit (INR)", "Credit (INR)", "Balance (INR)"];
    const rows = filteredLedgerStatement.map((entry: any) => [
      entry.date ? new Date(entry.date).toLocaleDateString("en-IN") : "",
      entry.voucherNo || "",
      entry.type,
      entry.description || "",
      entry.debit,
      entry.credit,
      entry.balance,
    ]);
    const partyName = customers.find((c) => c.id === selectedPartyId)?.name || "Party";
    exportToCSV(`Texa_Ledger_${partyName.replace(/\s+/g, "_")}`, headers, rows);
  };

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans'] pb-12">
      {/* Top Banner / Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* To Receive */}
        <div className="glass-card p-4 rounded-xl flex justify-between items-center min-h-[128px]">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              To Receive
            </p>
            <h3 className="text-xl font-bold mt-1 text-green-600 dark:text-green-400">
              ₹{(summary?.totalReceivables || 0).toLocaleString()}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              From Sales
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
            <TrendingUp
              className="text-green-600 dark:text-green-400"
              size={20}
            />
          </div>
        </div>

        {/* To Pay */}
        <div className="glass-card p-4 rounded-xl flex justify-between items-center min-h-[128px]">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">To Pay</p>
            <h3 className="text-xl font-bold mt-1 text-red-600 dark:text-red-400">
              ₹{((summary?.totalExpenses || 0) + (summary?.totalPayouts || 0)).toLocaleString()}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              For Purchases
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <TrendingDown
              className="text-red-600 dark:text-red-400"
              size={20}
            />
          </div>
        </div>

        {/* Total Expenses */}
        <div className="glass-card p-4 rounded-xl flex justify-between items-center min-h-[128px]">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Expenses
            </p>
            <h3 className="text-xl font-bold mt-1 text-rose-600 dark:text-rose-400">
              ₹{(summary?.totalExpenses || 0).toLocaleString()}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Operational Costs
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center">
            <Receipt className="text-rose-600 dark:text-rose-400" size={20} />
          </div>
        </div>

        {/* Net Cash Flow */}
        <div className="glass-card p-4 rounded-xl flex justify-between items-center min-h-[128px]">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Net Cash Flow
            </p>
            <h3
              className={`text-xl font-bold mt-1 ${
                (summary?.netCashFlow || 0) >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              ₹{(summary?.netCashFlow || 0).toLocaleString()}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {(summary?.netCashFlow || 0) >= 0 ? "Positive Balance" : "Deficit Balance"}
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
            <Wallet className="text-blue-600 dark:text-blue-400" size={20} />
          </div>
        </div>
      </div>

      {/* Tabs Navigation & Action Buttons Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-3">
        {/* Navigation Tabs on Left */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => handleTabSelect("ledger")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === "ledger"
                ? "bg-blue-500 text-white shadow-sm shadow-blue-500/20"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <BookOpen size={16} />
            Party Ledger
          </button>

          <button
            onClick={() => handleTabSelect("expenses")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === "expenses"
                ? "bg-blue-500 text-white shadow-sm shadow-blue-500/20"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <Receipt size={16} />
            Expenses
          </button>
        </div>

        {/* Buttons in this row on Right (Filter + Action Button) */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">

          {activeTab === "expenses" && (
            <>
              {/* Category Filter Button */}
              <div className="relative" ref={expenseFilterRef}>
                <button
                  onClick={() => setShowExpenseFilterMenu(!showExpenseFilterMenu)}
                  className={`px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm font-medium ${
                    expenseCategoryFilter !== "all"
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                      : "bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-white"
                  }`}
                >
                  <Filter size={18} />
                  Filter
                  {expenseCategoryFilter !== "all" && (
                    <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-mono">
                      1
                    </span>
                  )}
                </button>

                {showExpenseFilterMenu && (
                  <div className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-[#202936] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-3 z-30 space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Category
                      </span>
                      {expenseCategoryFilter !== "all" && (
                        <button
                          onClick={() => {
                            setExpenseCategoryFilter("all");
                            setShowExpenseFilterMenu(false);
                          }}
                          className="text-xs text-blue-500 hover:underline"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {[
                        { key: "all", label: "All Categories" },
                        { key: "Rent", label: "Rent" },
                        { key: "Electricity", label: "Electricity" },
                        { key: "Fuel & Transportation", label: "Fuel & Transport" },
                        { key: "Tea & Refreshment", label: "Tea & Refreshment" },
                        { key: "Office Supplies", label: "Office Supplies" },
                        { key: "Maintenance", label: "Maintenance" },
                        { key: "Salary & Wages", label: "Salary & Wages" },
                        { key: "Miscellaneous", label: "Miscellaneous" },
                      ].map((cat) => (
                        <button
                          key={cat.key}
                          onClick={() => {
                            setExpenseCategoryFilter(cat.key);
                            setShowExpenseFilterMenu(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            expenseCategoryFilter === cat.key
                              ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Export CSV */}
              <button
                onClick={handleExportExpenses}
                className="px-3.5 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm flex items-center gap-1.5 transition-all bg-white dark:bg-gray-800/50 shadow-sm"
                title="Export Expenses to CSV"
              >
                <Download size={16} />
                Export CSV
              </button>

              {/* Add Expense Button */}
              <button
                onClick={() => setShowExpenseModal(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap text-sm font-medium transition-colors shadow-sm"
              >
                <Plus size={18} />
                Add Expense
              </button>
            </>
          )}

          {activeTab === "ledger" && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Party:
                </span>
                <select
                  value={selectedPartyId}
                  onChange={(e) => setSelectedPartyId(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-[#202936] border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 min-w-[200px]"
                >
                  <option value="">-- Choose Party --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {ledgerData && (
                <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800/60 rounded-lg border border-gray-200 dark:border-gray-700 text-xs">
                  <span className="text-gray-500 font-medium">Bal:</span>
                  <span
                    className={`font-mono font-bold ${
                      (ledgerData.summary?.closingBalance ?? (ledgerData as any)?.closingBalance ?? 0) > 0
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {formatCurrency(ledgerData.summary?.closingBalance ?? (ledgerData as any)?.closingBalance ?? 0)}
                    <span className="text-[10px] ml-1 font-normal text-gray-400">
                      {(ledgerData.summary?.closingBalance ?? (ledgerData as any)?.closingBalance ?? 0) > 0 ? "Dr" : "Cr"}
                    </span>
                  </span>
                </div>
              )}

              {/* Export CSV */}
              <button
                onClick={handleExportLedger}
                className="px-3.5 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm flex items-center gap-1.5 transition-all bg-white dark:bg-gray-800/50 whitespace-nowrap shadow-sm"
                title="Export Ledger to CSV"
              >
                <Download size={16} />
                Export CSV
              </button>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm flex items-center gap-2 transition-all bg-white dark:bg-gray-800/50 whitespace-nowrap shadow-sm"
              >
                <Printer size={16} />
                Print Statement
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ==================== TAB 2: PARTY LEDGER ==================== */}
      {activeTab === "ledger" && (
        <div className="space-y-4">
          {/* Ledger Statement Table */}
          <div className="glass-card rounded-xl border border-gray-100 dark:border-gray-800">
            <div className="overflow-x-auto md:overflow-visible">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold bg-gray-50/50 dark:bg-gray-800/30">
                    <th className="px-6 py-3.5 whitespace-nowrap">Date</th>
                    <th className="px-6 py-3.5 whitespace-nowrap">Voucher / Ref #</th>
                    <th className="px-6 py-3.5 whitespace-nowrap">Type</th>
                    <th className="px-6 py-3.5 whitespace-nowrap">Description</th>
                    <th className="px-6 py-3.5 text-right whitespace-nowrap">Debit (Dr ₹)</th>
                    <th className="px-6 py-3.5 text-right whitespace-nowrap">Credit (Cr ₹)</th>
                    <th className="px-6 py-3.5 text-right whitespace-nowrap">Running Balance (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 text-sm">
                  {ledgerLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                        Loading ledger statement...
                      </td>
                    </tr>
                  ) : ledgerData && filteredLedgerStatement.length > 0 ? (
                    filteredLedgerStatement.map((entry: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors">
                        <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {entry.date ? new Date(entry.date).toLocaleDateString("en-IN") : "—"}
                        </td>
                        <td className="px-6 py-4 font-mono font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {entry.voucherNo || (entry as any).referenceNumber || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {entry.type === "invoice" || entry.type?.toLowerCase().includes("invoice") || entry.type?.toLowerCase().includes("bill") ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              Invoice
                            </span>
                          ) : entry.type === "payment" || entry.type?.toLowerCase().includes("payment") ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              Payment
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                              Opening
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-800 dark:text-gray-200 whitespace-nowrap font-medium">
                          {formatLedgerDescription(entry.description)}
                        </td>
                        <td className="px-6 py-4 font-mono text-right text-amber-600 dark:text-amber-400 whitespace-nowrap">
                          {entry.debit > 0
                            ? formatCurrency(entry.debit)
                            : "—"}
                        </td>
                        <td className="px-6 py-4 font-mono text-right text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {entry.credit > 0
                            ? formatCurrency(entry.credit)
                            : "—"}
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-right text-gray-900 dark:text-white whitespace-nowrap">
                          {formatCurrency(entry.balance)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                        {selectedPartyId
                          ? ledgerSearch
                            ? `No ledger entries matching "${ledgerSearch}".`
                            : "No transactions found for this party."
                          : "Please select a party from the dropdown above to view their ledger."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: EXPENSES ==================== */}
      {activeTab === "expenses" && (
        <div className="space-y-4">
          {/* Expenses Table */}
          <div className="glass-card rounded-xl border border-gray-100 dark:border-gray-800">
            <div className="overflow-x-auto md:overflow-visible">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold bg-gray-50/50 dark:bg-gray-800/30">
                    <th className="px-6 py-3.5 whitespace-nowrap">Expense #</th>
                    <th className="px-6 py-3.5 whitespace-nowrap">Date</th>
                    <th className="px-6 py-3.5 whitespace-nowrap">Category</th>
                    <th className="px-6 py-3.5 whitespace-nowrap">Title</th>
                    <th className="px-6 py-3.5 whitespace-nowrap">Paid To</th>
                    <th className="px-6 py-3.5 whitespace-nowrap">Mode</th>
                    <th className="px-6 py-3.5 text-right whitespace-nowrap">Amount</th>
                    <th className="px-6 py-3.5 text-right whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 text-sm">
                  {filteredExpenses.length > 0 ? (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors">
                        <td className="px-6 py-4 font-mono font-medium text-gray-700 dark:text-gray-300" title={exp.id}>
                          {exp.expenseNumber || formatShortId(exp.id, "EXP")}
                        </td>
                        <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {exp.expenseDate ? new Date(exp.expenseDate).toLocaleDateString("en-IN") : "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                            {exp.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                          {exp.title}
                        </td>
                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                          {exp.paidTo || "—"}
                        </td>
                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                          {exp.paymentMode || "Cash"}
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-right text-rose-600 dark:text-rose-400">
                          ₹{Number(exp.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            title="Delete Expense"
                            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                        No expenses recorded yet. Click &quot;Add Expense&quot; to log daily office or operational costs.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ADD EXPENSE MODAL ==================== */}
      <AnimatePresence>
        {showExpenseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-lg rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl p-6 bg-white dark:bg-[#202936]"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                  Add Expense
                </h3>
                <button
                  onClick={() => setShowExpenseModal(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateExpense} className="space-y-4">
                {/* Title & Category */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Expense Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Office electricity bill, Factory tea/snacks"
                    value={expenseForm.title}
                    onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <select
                      value={expenseForm.category}
                      onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="Rent">Rent</option>
                      <option value="Electricity">Electricity</option>
                      <option value="Fuel & Transportation">Fuel & Transport</option>
                      <option value="Tea & Refreshment">Tea & Refreshment</option>
                      <option value="Office Supplies">Office Supplies</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Salary & Wages">Salary & Wages</option>
                      <option value="Miscellaneous">Miscellaneous</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Amount (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="1500"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      className="w-full px-3 py-2 font-mono bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Paid To & Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Paid To (Person / Vendor)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Torrent Power / Ramesh"
                      value={expenseForm.paidTo}
                      onChange={(e) => setExpenseForm({ ...expenseForm, paidTo: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Expense Date
                    </label>
                    <input
                      type="date"
                      value={expenseForm.expenseDate}
                      onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
                      className="w-full px-3 py-2 font-mono bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Payment Mode & Ref */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={expenseForm.paymentMode}
                      onChange={(e) => setExpenseForm({ ...expenseForm, paymentMode: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI / Online</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Ref / Bill #
                    </label>
                    <input
                      type="text"
                      placeholder="Optional receipt no"
                      value={expenseForm.referenceNumber}
                      onChange={(e) => setExpenseForm({ ...expenseForm, referenceNumber: e.target.value })}
                      className="w-full px-3 py-2 font-mono bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <input
                    type="text"
                    placeholder="Optional remarks"
                    value={expenseForm.notes}
                    onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setShowExpenseModal(false)}
                    className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium shadow-sm transition-all"
                  >
                    Save Expense
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
