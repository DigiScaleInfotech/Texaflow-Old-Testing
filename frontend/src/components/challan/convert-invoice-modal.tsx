"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Check, Loader2, ReceiptText, ArrowRight, ChevronDown, Building2, Hash } from "lucide-react";
import { billingService } from "@/services/billing.service";
import { formatShortId } from "@/utils/format";

interface ConvertInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  challan?: {
    id: string;
    challanNo?: string;
    invoiceId?: string;
    customerName?: string;
    subtotal?: number;
    total?: number;
  } | null;
  bulkChallans?: Array<{
    id: string;
    challanNo?: string;
    invoiceId?: string;
    customerName?: string;
    subtotal?: number;
    total?: number;
  }> | null;
  onSuccess?: (invoiceId?: string) => void;
}

interface GstOption {
  id: string;
  label: string;
  rate: number;
  type: "none" | "intra" | "inter" | "custom";
}

const GST_OPTIONS: GstOption[] = [
  { id: "none_0", label: "None (0%)", rate: 0, type: "none" },
  { id: "cgst_sgst_5", label: "CGST + SGST @ 5%", rate: 5, type: "intra" },
  { id: "cgst_sgst_12", label: "CGST + SGST @ 12%", rate: 12, type: "intra" },
  { id: "cgst_sgst_18", label: "CGST + SGST @ 18%", rate: 18, type: "intra" },
  { id: "cgst_sgst_28", label: "CGST + SGST @ 28%", rate: 28, type: "intra" },
  { id: "igst_5", label: "Only GST @ 5%", rate: 5, type: "inter" },
  { id: "igst_12", label: "Only GST @ 12%", rate: 12, type: "inter" },
  { id: "igst_18", label: "Only GST @ 18%", rate: 18, type: "inter" },
  { id: "igst_28", label: "Only GST @ 28%", rate: 28, type: "inter" },
  { id: "custom", label: "Custom GST %", rate: 5, type: "custom" },
];

export default function ConvertInvoiceModal({
  isOpen,
  onClose,
  challan,
  bulkChallans,
  onSuccess,
}: ConvertInvoiceModalProps) {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<GstOption>(GST_OPTIONS[1]); // Default: CGST + SGST @ 5%
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [customRateStr, setCustomRateStr] = useState("5");
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isBulk = Boolean(bulkChallans && bulkChallans.length > 0);
  const activeList = isBulk ? bulkChallans! : challan ? [challan] : [];

  if (!isOpen || activeList.length === 0) return null;

  const primary = activeList[0];
  const combinedRef = isBulk
    ? activeList.map((c) => c.challanNo || c.invoiceId || formatShortId(c.id, "CH")).join(", ")
    : primary.challanNo || primary.invoiceId || formatShortId(primary.id, "CH");

  const currentRate =
    selectedOption.type === "custom"
      ? Number(customRateStr) || 0
      : selectedOption.rate;

  const subtotal = activeList.reduce((sum, c) => sum + Number(c.subtotal || c.total || 0), 0);
  const taxAmount = Number(((subtotal * currentRate) / 100).toFixed(2));
  const grandTotal = Number((subtotal + taxAmount).toFixed(2));

  const handleSelectOption = (opt: GstOption) => {
    setSelectedOption(opt);
    setDropdownOpen(false);
    setError(null);
  };

  const handleConfirmConvert = async () => {
    if (currentRate < 0 || currentRate > 100) {
      setError("Please enter a valid GST percentage (0-100%).");
      return;
    }

    try {
      setConverting(true);
      setError(null);
      let res: any;
      if (isBulk) {
        res = await billingService.bulkConvertChallansToInvoice(
          activeList.map((c) => c.id),
          currentRate
        );
      } else {
        res = await billingService.convertChallanToInvoice(primary.id, currentRate);
      }

      const newInvoiceId = res?.invoice?.id;
      if (onSuccess) {
        onSuccess(newInvoiceId);
      }
      onClose();

      if (newInvoiceId) {
        router.push(`/billing/${newInvoiceId}`);
      } else {
        router.push("/billing");
      }
    } catch (err: any) {
      console.error("Conversion failed:", err);
      setError(err?.message || "Failed to convert challans to tax invoice.");
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-['Plus_Jakarta_Sans'] animate-in fade-in duration-150">
      <div className="relative w-full max-w-[480px] glass-card rounded-2xl p-6 shadow-2xl border border-gray-100 dark:border-gray-700/80 space-y-5 bg-white dark:bg-[#202936]">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <ReceiptText size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                {isBulk ? `Bulk Convert (${activeList.length} Challans)` : "Convert to Tax Invoice"}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {isBulk
                  ? `Combine into 1 single Tax Invoice for ${primary.customerName || "Party"}`
                  : "Generate GST invoice from Delivery Challan"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Challan Info Two-Column Reference Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-gray-50/90 dark:bg-gray-800/60 rounded-xl p-3 border border-gray-100 dark:border-gray-700/50">
            <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-400 text-[10px] font-bold uppercase tracking-wider">
              <Hash size={11} />
              <span>Challan Ref {isBulk ? `(${activeList.length})` : ""}</span>
            </div>
            <p className="font-mono font-bold text-xs sm:text-sm text-blue-600 dark:text-blue-400 mt-1 truncate" title={combinedRef}>
              {combinedRef}
            </p>
          </div>

          <div className="bg-gray-50/90 dark:bg-gray-800/60 rounded-xl p-3 border border-gray-100 dark:border-gray-700/50">
            <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-400 text-[10px] font-bold uppercase tracking-wider">
              <Building2 size={11} />
              <span>Party / Client</span>
            </div>
            <p
              className="font-semibold text-sm text-gray-800 dark:text-gray-200 mt-1 truncate"
              title={primary.customerName || "Customer"}
            >
              {primary.customerName || "Customer"}
            </p>
          </div>
        </div>

        {/* GST / TAX RATE Dropdown */}
        <div className="space-y-1.5" ref={dropdownRef}>
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              GST / TAX RATE:
            </label>
            <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
              Tax Slab
            </span>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`w-full flex items-center justify-between h-11 px-3.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer bg-white dark:bg-gray-800/90 ${
                dropdownOpen
                  ? "border-blue-500 ring-2 ring-blue-500/20 text-gray-900 dark:text-white"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-200"
              }`}
            >
              <span>
                {selectedOption.type === "custom"
                  ? `Custom GST @ ${customRateStr || 0}%`
                  : selectedOption.label}
              </span>
              <ChevronDown
                size={16}
                className={`text-gray-400 transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180 text-blue-500" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu Options */}
            {dropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-[#1e2736] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1.5 max-h-56 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
                {GST_OPTIONS.map((opt) => {
                  const isSelected = selectedOption.id === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(opt)}
                      className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <Check size={14} className="text-blue-600 dark:text-blue-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Custom Rate Input when custom is chosen */}
          {selectedOption.type === "custom" && (
            <div className="flex items-center gap-2 pt-2 px-1">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Enter Custom Rate:
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={customRateStr}
                  onChange={(e) => setCustomRateStr(e.target.value)}
                  className="w-20 px-2.5 py-1 text-xs font-mono font-bold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="5"
                  autoFocus
                />
                <span className="text-xs font-bold text-gray-500">%</span>
              </div>
            </div>
          )}
        </div>

        {/* BILL ACCOUNTING SUMMARY */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            BILL ACCOUNTING SUMMARY
          </p>
          <div className="rounded-xl border border-gray-200/80 dark:border-gray-700/80 bg-gray-50/80 dark:bg-gray-800/40 p-4 space-y-2 text-xs">
            {/* Subtotal */}
            <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
              <span className="font-medium">Material Subtotal:</span>
              <div className="w-28 flex items-center justify-between font-mono tabular-nums text-sm">
                <span className="text-gray-400 dark:text-gray-500 font-normal">₹</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Individual Tax Lines */}
            {selectedOption.type === "intra" && currentRate > 0 ? (
              <>
                <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                  <span>CGST ({currentRate / 2}%):</span>
                  <div className="w-28 flex items-center justify-between font-mono tabular-nums text-sm">
                    <span className="text-gray-400 dark:text-gray-500 font-normal">₹</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {(taxAmount / 2).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                  <span>SGST ({currentRate / 2}%):</span>
                  <div className="w-28 flex items-center justify-between font-mono tabular-nums text-sm">
                    <span className="text-gray-400 dark:text-gray-500 font-normal">₹</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {(taxAmount / 2).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </>
            ) : selectedOption.type === "inter" && currentRate > 0 ? (
              <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                <span>IGST ({currentRate}%):</span>
                <div className="w-28 flex items-center justify-between font-mono tabular-nums text-sm">
                  <span className="text-gray-400 dark:text-gray-500 font-normal">₹</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {taxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ) : currentRate > 0 ? (
              <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                <span>GST ({currentRate}%):</span>
                <div className="w-28 flex items-center justify-between font-mono tabular-nums text-sm">
                  <span className="text-gray-400 dark:text-gray-500 font-normal">₹</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {taxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center text-gray-500">
                <span>GST (0% - Exempt):</span>
                <div className="w-28 flex items-center justify-between font-mono tabular-nums text-sm">
                  <span className="text-gray-400 dark:text-gray-500 font-normal">₹</span>
                  <span className="font-semibold text-gray-500">0.00</span>
                </div>
              </div>
            )}

            {/* Total Bill Amount Row */}
            <div className="pt-2.5 mt-2 border-t border-gray-200 dark:border-gray-700/80 flex justify-between items-center">
              <span className="font-bold text-gray-900 dark:text-white text-sm">
                Total Bill Amount:
              </span>
              <div className="w-28 flex items-center justify-between font-mono tabular-nums text-sm">
                <span className="text-gray-800 dark:text-gray-200 font-bold">₹</span>
                <span className="font-extrabold text-gray-900 dark:text-white text-sm">
                  {grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <p className="text-xs text-red-500 font-medium bg-red-50 dark:bg-red-950/30 p-2.5 rounded-lg border border-red-200 dark:border-red-900">
            {error}
          </p>
        )}

        {/* Action Buttons Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-700/60">
          <button
            type="button"
            disabled={converting}
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={converting}
            onClick={handleConfirmConvert}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer disabled:opacity-50"
          >
            {converting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Generating Invoice...</span>
              </>
            ) : (
              <>
                <span>Generate Tax Invoice</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
