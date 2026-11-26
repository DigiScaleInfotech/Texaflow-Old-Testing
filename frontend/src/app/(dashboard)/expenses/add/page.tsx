"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Receipt,
  Package,
  Users,
  Zap,
  UserCheck,
  Wrench,
  Truck,
  Building,
  Coffee,
  CheckCircle2,
  Clock,
  Upload,
  FileText,
  Plus,
  X,
  Layers,
  Save,
  Check,
  ArrowLeft,
  Calendar,
  CreditCard,
  Banknote,
  QrCode,
  Building2,
  Sparkles,
  MoreHorizontal,
} from "lucide-react";
import { financeService } from "@/services/finance.service";
import { employeeService } from "@/services/employee.service";

const STANDARD_CATEGORIES = [
  { id: "Karigar Salary", label: "Karigar Salary", icon: Users, color: "text-blue-500 bg-blue-500/10" },
  { id: "Electricity & Power", label: "Electricity & Power", icon: Zap, color: "text-amber-500 bg-amber-500/10" },
  { id: "Worker Advance / Upad", label: "Worker Advance / Upad", icon: UserCheck, color: "text-purple-500 bg-purple-500/10" },
  { id: "Machine Maintenance & Repairs", label: "Machine Maintenance & Repairs", icon: Wrench, color: "text-orange-500 bg-orange-500/10" },
  { id: "Packaging Materials", label: "Packaging Materials", icon: Package, color: "text-emerald-500 bg-emerald-500/10" },
  { id: "Dhaga & Consumables", label: "Dhaga & Consumables", icon: Layers, color: "text-cyan-500 bg-cyan-500/10" },
  { id: "Logistics & Courier", label: "Logistics & Courier", icon: Truck, color: "text-indigo-500 bg-indigo-500/10" },
  { id: "Rent", label: "Rent", icon: Building, color: "text-rose-500 bg-rose-500/10" },
  { id: "Office & Refreshment", label: "Office & Refreshment", icon: Coffee, color: "text-yellow-600 bg-yellow-500/10" },
  { id: "Other", label: "Other", icon: MoreHorizontal, color: "text-slate-500 bg-slate-500/10" },
];

const PAYMENT_MODES = [
  { id: "BANK TRANSFER (NEFT/RTGS/IMPS)", label: "Bank Transfer", icon: Building2 },
  { id: "CASH", label: "Cash", icon: Banknote },
  { id: "UPI / ONLINE", label: "UPI / QR", icon: QrCode },
  { id: "CHEQUE", label: "Cheque", icon: CreditCard },
];

export default function AddExpensePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Core Form states
  const [amount, setAmount] = useState("");
  const [voucherDate, setVoucherDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedCategory, setSelectedCategory] = useState("Karigar Salary");

  // Payee & Bill
  const [payeeName, setPayeeName] = useState("");
  const [billNumber, setBillNumber] = useState("");

  // Karigar / Worker Automation states
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [isCustomPayee, setIsCustomPayee] = useState<boolean>(false);

  useEffect(() => {
    employeeService
      .getEmployees()
      .then((res: any) => {
        const list = res?.employees || [];
        setEmployees(list);
      })
      .catch((err) => {
        console.warn("Could not load employees for expense payee:", err);
      });
  }, []);

  const isWorkerCategory =
    selectedCategory === "Karigar Salary" ||
    selectedCategory === "Worker Advance / Upad";

  // Payment Mode & Status
  const [paymentMode, setPaymentMode] = useState("BANK TRANSFER (NEFT/RTGS/IMPS)");
  const [paymentStatus, setPaymentStatus] = useState<"Paid" | "Pending">("Paid");

  // Remarks / Notes & Bill Attachment
  const [notes, setNotes] = useState("");
  const [receiptFileName, setReceiptFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick Date Selectors
  const setDateToday = () => {
    setVoucherDate(new Date().toISOString().split("T")[0]);
  };

  const setDateYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setVoucherDate(d.toISOString().split("T")[0]);
  };

  // Quick Amount Addition helpers
  const handleAddAmount = (extra: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + extra).toString());
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Please enter a valid expense amount");
      return;
    }

    try {
      setIsSubmitting(true);
      await financeService.createExpense({
        title: selectedCategory,
        category: selectedCategory,
        amount: parsedAmount,
        expenseDate: voucherDate,
        paymentMode: paymentMode,
        paymentStatus: paymentStatus,
        paidTo: payeeName.trim() || undefined,
        referenceNumber: billNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        receiptUrl: receiptFileName || undefined,
        employeeId:
          isWorkerCategory && !isCustomPayee && selectedEmployeeId
            ? selectedEmployeeId
            : undefined,
      });

      router.push("/expenses");
    } catch (err: any) {
      console.error("Error creating expense:", err);
      alert(err?.response?.data?.message || err?.message || "Failed to record expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans'] w-full pb-24">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Card */}
        <div className="glass-card rounded-xl p-6 md:p-8 space-y-6 border border-gray-100 dark:border-gray-800 shadow-sm">
          {/* 1. AMOUNT (₹)* & VOUCHER DATE* */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Amount Field */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                Amount (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-gray-500 dark:text-gray-400 text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  autoFocus
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full h-10 pl-8 pr-4 font-mono text-base font-bold bg-white dark:bg-[#202936] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
                />
              </div>
            </div>

            {/* Voucher Date Field */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                Voucher Date <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="date"
                    required
                    value={voucherDate}
                    onChange={(e) => setVoucherDate(e.target.value)}
                    className="w-full h-10 px-3 font-mono text-sm bg-white dark:bg-[#202936] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 shadow-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={setDateToday}
                  className={`h-10 px-3.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-sm ${
                    voucherDate === new Date().toISOString().split("T")[0]
                      ? "bg-blue-500 text-white"
                      : "bg-white dark:bg-[#202936] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={setDateYesterday}
                  className="h-10 px-3.5 text-xs font-semibold rounded-lg bg-white dark:bg-[#202936] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer whitespace-nowrap shadow-sm"
                >
                  Yesterday
                </button>
              </div>
            </div>
          </div>

          {/* 2. CATEGORY* (10 Categories) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                Category <span className="text-red-500">*</span>
              </label>
            </div>

            {/* 10 Category Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {STANDARD_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.id);
                    }}
                    className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer relative ${
                      isSelected
                        ? "border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 shadow-sm ring-2 ring-blue-500/20"
                        : "border-gray-200 dark:border-gray-700/80 bg-white dark:bg-[#202936] text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-800/40"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected
                            ? "bg-blue-500 text-white shadow-sm"
                            : cat.color
                        }`}
                      >
                        <Icon size={17} />
                      </div>
                      <span className="text-sm font-semibold truncate leading-tight">
                        {cat.label}
                      </span>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. PAYEE & BILL (WITH KARIGAR SALARY & UPAD AUTOMATION) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                  {isWorkerCategory && !isCustomPayee ? (
                    <>
                      <UserCheck size={14} className="text-blue-500" />
                      <span>Select Karigar / Worker</span>
                    </>
                  ) : (
                    <span>Paid To / Shop Name</span>
                  )}
                </label>
                {isWorkerCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!isCustomPayee) {
                        setIsCustomPayee(true);
                        setSelectedEmployeeId("");
                      } else {
                        setIsCustomPayee(false);
                      }
                    }}
                    className="text-xs text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium cursor-pointer"
                  >
                    {!isCustomPayee ? "+ Type Custom Name" : "← Select from Karigar List"}
                  </button>
                )}
              </div>

              {isWorkerCategory && !isCustomPayee ? (
                <div className="space-y-2">
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => {
                      const empId = e.target.value;
                      setSelectedEmployeeId(empId);
                      const emp = employees.find((x) => x.id === empId);
                      if (emp) {
                        setPayeeName(
                          emp.name ||
                            `${emp.firstName || ""} ${emp.lastName || ""}`.trim()
                        );
                      } else {
                        setPayeeName("");
                      }
                    }}
                    className="w-full h-10 px-3.5 bg-white dark:bg-[#202936] border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 shadow-sm cursor-pointer"
                  >
                    <option value="">-- Select Karigar / Worker --</option>
                    {employees.map((emp) => {
                      const empName =
                        emp.name ||
                        `${emp.firstName || ""} ${emp.lastName || ""}`.trim() ||
                        "Worker";
                      const upad = Number(emp.advanceBalance || 0);
                      return (
                        <option key={emp.id} value={emp.id}>
                          {empName} ({emp.designation || emp.role || "Worker"})
                          {upad > 0 ? ` • Active Upad: ₹${upad.toLocaleString("en-IN")}` : ""}
                        </option>
                      );
                    })}
                  </select>

                  {/* Auto-sync indicator badge */}
                  {selectedEmployeeId && (
                    <div
                      className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                        selectedCategory === "Worker Advance / Upad"
                          ? "bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-300"
                          : "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300"
                      }`}
                    >
                      <Sparkles
                        size={14}
                        className={
                          selectedCategory === "Worker Advance / Upad"
                            ? "text-purple-500 shrink-0"
                            : "text-blue-500 shrink-0"
                        }
                      />
                      <span>
                        {selectedCategory === "Worker Advance / Upad" ? (
                          <>
                            <strong>Upad Auto-Sync:</strong> ₹
                            {amount ? Number(amount).toLocaleString("en-IN") : "0"}{" "}
                            will be added to <strong>{payeeName}</strong>&apos;s Upad balance and automatically deducted in monthly salary.
                          </>
                        ) : (
                          <>
                            <strong>Salary Auto-Sync:</strong> This ₹
                            {amount ? Number(amount).toLocaleString("en-IN") : "0"}{" "}
                            payment will be automatically recorded in <strong>{payeeName}</strong>&apos;s official salary records.
                          </>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="Enter payee / shop name"
                  value={payeeName}
                  onChange={(e) => setPayeeName(e.target.value)}
                  className="w-full h-10 px-3.5 bg-white dark:bg-[#202936] border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 shadow-sm"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Bill / Ref Number
              </label>
              <input
                type="text"
                placeholder="Enter bill / ref number"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                className="w-full h-10 px-3.5 font-mono bg-white dark:bg-[#202936] border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 shadow-sm"
              />
            </div>
          </div>

          {/* 4. PAYMENT MODE & STATUS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Payment Mode */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Payment Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_MODES.map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = paymentMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setPaymentMode(mode.id)}
                      className={`h-10 px-3 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500 shadow-sm"
                          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-[#202936] text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <Icon size={14} className={isSelected ? "text-blue-500" : "text-gray-400"} />
                      <span className="truncate">{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment Status */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                Payment Status <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentStatus("Paid")}
                  className={`h-10 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                    paymentStatus === "Paid"
                      ? "bg-emerald-600 text-white ring-2 ring-emerald-500/20"
                      : "bg-white dark:bg-[#202936] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <CheckCircle2 size={15} />
                  <span>Paid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentStatus("Pending")}
                  className={`h-10 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                    paymentStatus === "Pending"
                      ? "bg-amber-500 text-white ring-2 ring-amber-500/20"
                      : "bg-white dark:bg-[#202936] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <Clock size={15} />
                  <span>Pending / Unpaid</span>
                </button>
              </div>
            </div>
          </div>

          {/* 5. REMARKS & RECEIPT ATTACHMENT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Remarks / Notes */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Remarks / Notes
              </label>
              <textarea
                rows={3}
                placeholder="Add optional description, items purchased, machine number or payment remarks..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-[#202936] border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 shadow-sm resize-none"
              />
            </div>

            {/* Attach Bill Receipt */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Attach Bill Receipt
              </label>
              <div className="h-[88px] flex flex-col justify-center items-center p-3 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 rounded-lg bg-gray-50/50 dark:bg-gray-800/40 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setReceiptFileName(file.name);
                  }}
                />
                {!receiptFileName ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-300 cursor-pointer"
                  >
                    <Upload size={18} className="text-blue-500" />
                    <span className="text-xs font-semibold">Upload Bill (PDF, PNG, JPG)</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-mono w-full justify-between">
                    <div className="flex items-center gap-1.5 truncate">
                      <FileText size={14} />
                      <span className="truncate">{receiptFileName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReceiptFileName("")}
                      className="text-gray-400 hover:text-red-500 p-1"
                      title="Remove file"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Perfectly Fixed Bottom Actions Bar */}
        <div className="fixed bottom-0 right-0 left-0 md:left-[var(--sidebar-width,16rem)] h-16 px-6 md:px-8 bg-white/95 dark:bg-[#202936]/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-700/80 flex items-center justify-end gap-3 z-40 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] transition-all duration-300">
          <Link
            href="/expenses"
            className="px-5 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium transition-colors cursor-pointer"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving Expense...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Expense
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
