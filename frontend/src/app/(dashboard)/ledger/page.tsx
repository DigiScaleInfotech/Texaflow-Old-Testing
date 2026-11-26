"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  BookOpen,
  Printer,
  Download,
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  Filter,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import * as XLSX from "xlsx";
import { OrderCard } from "@/components/ui/order/order-card";
import { generateLedgerPdf, getShortPartyName } from "@/utils/generateLedgerPdf";
import {
  financeService,
  LedgerResponse,
} from "@/services/finance.service";
import { customerService } from "@/services/customer.service";
import { vendorService } from "@/services/vendor.service";
import { formatCurrency } from "@/utils/format";

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

interface PartyOption {
  id: string;
  name: string;
  type: "customer" | "vendor";
}

export default function PartyLedgerPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Party Selection (Empty by default per user request)
  const [customers, setCustomers] = useState<PartyOption[]>([]);
  const [vendors, setVendors] = useState<PartyOption[]>([]);
  const [selectedPartyKey, setSelectedPartyKey] = useState(""); // format: "type:id" e.g. "customer:123"

  const [ledgerData, setLedgerData] = useState<LedgerResponse | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerSearch, setLedgerSearch] = useState("");

  // Date Range Filter
  const [dateRangeFilter, setDateRangeFilter] = useState("all"); // "all", "this_month", "last_30_days", "custom"
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Load Customers and Vendors
  useEffect(() => {
    const fetchParties = async () => {
      try {
        setLoading(true);
        // 1. Fetch Customers
        const custRes: any = await customerService.getCustomers({ limit: 100 });
        const rawCusts = custRes?.customers || custRes?.data?.customers || (Array.isArray(custRes) ? custRes : []);
        const mappedCusts: PartyOption[] = rawCusts.map((c: any) => ({
          id: c.id,
          name: c.name || c.displayName || c.primaryContact || "Customer",
          type: "customer",
        }));
        setCustomers(mappedCusts);

        // 2. Fetch Vendors
        try {
          const vendRes: any = await vendorService.getVendors({ limit: 100 });
          const rawVends = vendRes?.vendors || vendRes?.data?.vendors || (Array.isArray(vendRes) ? vendRes : []);
          const mappedVends: PartyOption[] = rawVends.map((v: any) => ({
            id: v.id,
            name: v.companyName || v.contactPerson || v.name || "Vendor",
            type: "vendor",
          }));
          setVendors(mappedVends);
        } catch (vErr) {
          console.warn("Could not load vendors:", vErr);
        }
        // Note: selectedPartyKey is left empty by default as requested!
      } catch (err: any) {
        console.error("Error loading party lists:", err);
        setError(err?.message || "Failed to load parties");
      } finally {
        setLoading(false);
      }
    };
    fetchParties();
  }, []);

  // Unified sorted parties list without separate optgroups
  const allParties = useMemo(() => {
    const list: PartyOption[] = [...customers, ...vendors];
    const seen = new Set<string>();
    const unique = list.filter((item) => {
      const key = `${item.type}:${item.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return unique.sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, vendors]);

  // Fetch ledger when party selection or dates change
  useEffect(() => {
    if (selectedPartyKey) {
      const [type, id] = selectedPartyKey.split(":");
      loadLedger(id, type as "customer" | "vendor", startDate, endDate);
    } else {
      setLedgerData(null);
    }
  }, [selectedPartyKey, startDate, endDate]);

  // Handle Date Range Presets
  const handleDatePresetChange = (preset: string) => {
    setDateRangeFilter(preset);
    const now = new Date();

    if (preset === "all") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "this_month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];
      const today = now.toISOString().split("T")[0];
      setStartDate(firstDay);
      setEndDate(today);
    } else if (preset === "last_30_days") {
      const past30 = new Date(Date.now() - 30 * 86400000)
        .toISOString()
        .split("T")[0];
      const today = now.toISOString().split("T")[0];
      setStartDate(past30);
      setEndDate(today);
    }
  };

  // TopNav Search Listener
  useEffect(() => {
    const handleSearch = (e: any) => {
      const q = typeof e.detail === "string" ? e.detail : "";
      setLedgerSearch(q);
    };
    window.addEventListener("finance-search", handleSearch);
    window.addEventListener("ledger-search", handleSearch);
    return () => {
      window.removeEventListener("finance-search", handleSearch);
      window.removeEventListener("ledger-search", handleSearch);
    };
  }, []);

  const loadLedger = async (
    partyId: string,
    partyType: "customer" | "vendor",
    start?: string,
    end?: string
  ) => {
    try {
      setLedgerLoading(true);
      const res = await financeService.getPartyLedger({
        partyType,
        partyId,
        startDate: start || undefined,
        endDate: end || undefined,
      });
      setLedgerData(res);
    } catch (err: any) {
      console.error("Failed to load party ledger:", err);
    } finally {
      setLedgerLoading(false);
    }
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

  const handleExportExcel = () => {
    if (!selectedPartyKey) return;
    let partyName = "Party";
    const [, id] = selectedPartyKey.split(":");
    const found = [...customers, ...vendors].find((p) => p.id === id);
    if (found) partyName = found.name;

    const rows = filteredLedgerStatement.map((entry: any) => ({
      "Date": entry.date ? new Date(entry.date).toLocaleDateString("en-IN") : "",
      "Voucher / Ref #": entry.voucherNo || "",
      "Type": entry.type || "",
      "Description / Particulars": formatLedgerDescription(entry.description),
      "Debit (Dr ₹)": Number(entry.debit) || 0,
      "Credit (Cr ₹)": Number(entry.credit) || 0,
      "Balance (₹)": `${Number(Math.abs(entry.balance)).toFixed(2)} ${entry.balance >= 0 ? "Dr" : "Cr"}`,
    }));

    // Add totals row
    rows.push({
      "Date": "",
      "Voucher / Ref #": "",
      "Type": "",
      "Description / Particulars": "Total / Closing Balance",
      "Debit (Dr ₹)": totalDebit,
      "Credit (Cr ₹)": totalCredit,
      "Balance (₹)": `${Number(Math.abs(closingBal)).toFixed(2)} ${closingBal >= 0 ? "Dr" : "Cr"}`,
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = [
      { wch: 14 },
      { wch: 18 },
      { wch: 14 },
      { wch: 35 },
      { wch: 16 },
      { wch: 16 },
      { wch: 20 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ledger Statement");
    const shortName = getShortPartyName(partyName);
    XLSX.writeFile(workbook, `Ledger_${shortName}.xlsx`);
  };

  const handleDownloadPDF = () => {
    if (!selectedPartyKey) return;
    let partyName = "Party";
    let partyPhone = "";
    const [, id] = selectedPartyKey.split(":");
    const found = [...customers, ...vendors].find((p) => p.id === id);
    if (found) {
      partyName = found.name;
      partyPhone = (found as any).phone || (found as any).mobile || "";
    }
    const periodText =
      startDate && endDate
        ? `${startDate} to ${endDate}`
        : dateRangeFilter === "this_month"
        ? "This Month"
        : dateRangeFilter === "last_30_days"
        ? "Last 30 Days"
        : "All Time";

    generateLedgerPdf(
      {
        partyName,
        partyPhone,
        periodText,
        openingBalance: openingBal,
        totalDebit,
        totalCredit,
        closingBalance: closingBal,
        entries: filteredLedgerStatement,
      },
      "save"
    );
  };

  const handlePrint = () => {
    if (!selectedPartyKey) return;
    let partyName = "Party";
    let partyPhone = "";
    const [, id] = selectedPartyKey.split(":");
    const found = [...customers, ...vendors].find((p) => p.id === id);
    if (found) {
      partyName = found.name;
      partyPhone = (found as any).phone || (found as any).mobile || "";
    }
    const periodText =
      startDate && endDate
        ? `${startDate} to ${endDate}`
        : dateRangeFilter === "this_month"
        ? "This Month"
        : dateRangeFilter === "last_30_days"
        ? "Last 30 Days"
        : "All Time";

    generateLedgerPdf(
      {
        partyName,
        partyPhone,
        periodText,
        openingBalance: openingBal,
        totalDebit,
        totalCredit,
        closingBalance: closingBal,
        entries: filteredLedgerStatement,
      },
      "print"
    );
  };

  const closingBal = ledgerData?.summary?.closingBalance ?? (ledgerData as any)?.closingBalance ?? 0;
  const totalDebit = ledgerData?.summary?.totalDebit ?? (ledgerData as any)?.totalDebit ?? 0;
  const totalCredit = ledgerData?.summary?.totalCredit ?? (ledgerData as any)?.totalCredit ?? 0;
  const openingBal = ledgerData ? (ledgerData as any)?.openingBalance ?? 0 : 0;

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans'] pb-12">
      {/* Top Banner / Party Balance Overview - Exactly matching Challans & Orders page */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <OrderCard
          title="Opening Balance"
          value={`₹${formatCurrency(openingBal)}`}
          icon={<BookOpen className="text-blue-500" size={20} />}
          trend={{ value: 0, isPositive: true }}
        />
        <OrderCard
          title="Total Debit (Dr)"
          value={`₹${formatCurrency(totalDebit)}`}
          icon={<TrendingUp className="text-green-500" size={20} />}
          trend={{ value: 0, isPositive: true }}
        />
        <OrderCard
          title="Total Credit (Cr)"
          value={`₹${formatCurrency(totalCredit)}`}
          icon={<TrendingDown className="text-yellow-500" size={20} />}
          trend={{ value: 0, isPositive: true }}
        />
        <OrderCard
          title="Net Balance"
          value={`₹${formatCurrency(Math.abs(closingBal))}`}
          icon={<Wallet className="text-orange-500" size={20} />}
          trend={{ value: 0, isPositive: true }}
        />
      </div>

      {/* Control Bar: Party Selector, Date Range Filter & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-3">
        {/* Left Side: Party Selector + Date Range */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Party Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
              Party:
            </span>
            <select
              value={selectedPartyKey}
              onChange={(e) => setSelectedPartyKey(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-[#202936] border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 min-w-[240px] shadow-sm cursor-pointer"
            >
              <option value="">-- Select Party --</option>
              {allParties.map((p) => (
                <option key={`${p.type}:${p.id}`} value={`${p.type}:${p.id}`}>
                  {p.name}
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
              value={dateRangeFilter}
              onChange={(e) => handleDatePresetChange(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-[#202936] border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 shadow-sm cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="this_month">This Month</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Inputs if Custom selected */}
          {dateRangeFilter === "custom" && (
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

          {ledgerData?.party && (
            <div className="flex items-center gap-2 px-3.5 py-2 h-[38px] bg-white dark:bg-[#202936] rounded-lg border border-gray-200 dark:border-gray-700 text-sm shadow-sm whitespace-nowrap">
              <span className="text-gray-500 dark:text-gray-400 font-medium text-xs">Party Balance:</span>
              <span
                className={`font-mono font-bold text-xs ${
                  closingBal > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                ₹{formatCurrency(closingBal)} {closingBal > 0 ? "Dr" : "Cr"}
              </span>
            </div>
          )}
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-2">
          {/* Download PDF */}
          <button
            onClick={handleDownloadPDF}
            disabled={!selectedPartyKey}
            className="px-3.5 py-2 h-[38px] border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm flex items-center gap-1.5 transition-all bg-white dark:bg-gray-800/50 whitespace-nowrap shadow-sm cursor-pointer"
            title="Download Ledger PDF"
          >
            <FileText size={16} className="text-rose-500" />
            PDF Download
          </button>

          {/* Export Excel */}
          <button
            onClick={handleExportExcel}
            disabled={!selectedPartyKey}
            className="px-3.5 py-2 h-[38px] border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm flex items-center gap-1.5 transition-all bg-white dark:bg-gray-800/50 whitespace-nowrap shadow-sm cursor-pointer"
            title="Export Ledger to Excel (.xlsx)"
          >
            <FileSpreadsheet size={16} className="text-emerald-500" />
            Export Excel
          </button>

          {/* Print Statement */}
          <button
            onClick={handlePrint}
            disabled={!selectedPartyKey}
            className="px-3.5 py-2 h-[38px] border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm flex items-center gap-1.5 transition-all bg-white dark:bg-gray-800/50 whitespace-nowrap shadow-sm cursor-pointer"
            title="Print Ledger Statement"
          >
            <Printer size={16} className="text-blue-500" />
            Print
          </button>
        </div>
      </div>

      {/* Ledger Statement Table */}
      <div className="space-y-4">
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
                {!selectedPartyKey ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <BookOpen size={28} className="text-gray-400 dark:text-gray-500" />
                        <p className="font-medium text-gray-700 dark:text-gray-300">
                          No Party Selected
                        </p>
                        <p className="text-xs text-gray-400">
                          Please select a customer or vendor from the dropdown above to view their ledger statement.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : ledgerLoading ? (
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
                        {entry.debit > 0 ? formatCurrency(entry.debit) : "—"}
                      </td>
                      <td className="px-6 py-4 font-mono text-right text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : "—"}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-right text-gray-900 dark:text-white whitespace-nowrap">
                        {formatCurrency(entry.balance)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                      {ledgerSearch
                        ? `No ledger entries matching "${ledgerSearch}".`
                        : "No transactions found for this party in the selected date range."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
