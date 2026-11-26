"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { billingService } from "@/services/billing.service";
import { formatShortId, formatCurrency } from "@/utils/format";
import { generateInvoicePdf } from "@/utils/generateInvoicePdf";
import ConvertInvoiceModal from "@/components/challan/convert-invoice-modal";
import { OrderCard } from "@/components/ui/order/order-card";
import { getDueStatus } from "@/utils/paymentTerms";
import {
  Search,
  Filter,
  Plus,
  Truck,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  MoreVertical,
  Printer,
  Trash2,
  Calendar,
  Layers,
  Loader2,
  Activity,
  X,
  Eye,
  Download,
  Edit,
  Trash,
  ReceiptText,
  CheckSquare,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

export default function ChallansPage() {
  const [challans, setChallans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "invoiced">("all");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [tempStatus, setTempStatus] = useState<"all" | "pending" | "invoiced">("all");
  const [tempDateRange, setTempDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [challanToConvert, setChallanToConvert] = useState<any | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Bulk Convert State
  const [selectedChallanIds, setSelectedChallanIds] = useState<string[]>([]);
  const [bulkChallansToConvert, setBulkChallansToConvert] = useState<any[] | null>(null);

  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
  const [menuVerticalPosition, setMenuVerticalPosition] = useState<"top" | "bottom">("top");

  // Close action menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeActionMenu && !(event.target as Element).closest(".action-menu-container")) {
        setActiveActionMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeActionMenu]);

  const toggleActionMenu = (id: string, e: React.MouseEvent, index?: number) => {
    e.stopPropagation();
    if (activeActionMenu === id) {
      setActiveActionMenu(null);
      return;
    }
    const button = e.currentTarget as HTMLElement;
    const buttonRect = button.getBoundingClientRect();
    const spaceBelow = window.innerHeight - buttonRect.bottom;
    const isNearBottomOrLast =
      spaceBelow < 260 || (index !== undefined && index >= filteredChallans.length - 1);
    setMenuVerticalPosition(isNearBottomOrLast ? "bottom" : "top");
    setActiveActionMenu(id);
  };

  const handleDeleteChallan = async (id: string) => {
    if (!confirm("Are you sure you want to delete this delivery challan?")) return;
    try {
      await billingService.deleteBill(id);
      fetchChallans();
    } catch (err: any) {
      alert(err?.message || "Failed to delete challan");
    }
  };

  const handleDirectDownload = async (challan: any) => {
    try {
      setDownloadingId(challan.id);
      let fullChallan = challan;
      if (!challan.items || challan.items.length === 0) {
        const fetched = await billingService.getBillById(challan.id);
        if (fetched) {
          fullChallan = fetched;
        }
      }

      const items = fullChallan.items && fullChallan.items.length > 0 ? fullChallan.items : [
        {
          description: "124 - LL",
          hsnCode: "5605",
          quantity: 1,
          unitPrice: Number(fullChallan.total) || 0,
          total: Number(fullChallan.total) || 0,
          weight: 0,
          kg: 0,
          carton: null,
        }
      ];

      const buyerName = fullChallan.customer?.name || fullChallan.customerName || fullChallan.companyName || "Cash Customer";
      const buyerPhone = fullChallan.customerPhone || fullChallan.customer?.phone || fullChallan.customer?.mobile || fullChallan.phone || "";
      const buyerGst = fullChallan.customerGst || fullChallan.customer?.gst || "";
      
      const parseAddress = (addr: any) => {
        if (!addr) return "196 Shyamdham Socayti, Nana Varachha Road Surat";
        if (typeof addr === "string") return addr;
        if (typeof addr === "object") {
          return [addr.street, addr.city, addr.state, addr.zip].filter(Boolean).join(", ");
        }
        return String(addr);
      };
      const buyerAddress = parseAddress(fullChallan.billingAddress || fullChallan.customer?.address);

      const challanNo = fullChallan.challanNo || fullChallan.billNumber || fullChallan.invoiceId || "CH-0001";

      const payload = {
        id: fullChallan.id,
        invoiceNo: fullChallan.invoiceId,
        challanNo: challanNo,
        docType: 'challan' as const,
        paperSize: 'a5' as const,
        date: fullChallan.issueDate,
        customerName: buyerName,
        companyName: fullChallan.companyName,
        customerGst: buyerGst,
        customerPhone: buyerPhone,
        billingAddress: buyerAddress,
        items: items.map((it: any) => ({
          id: it.id,
          description: it.description || it.item || '124 - LL',
          hsnCode: it.hsnCode || '5605',
          quantity: Number(it.quantity || it.qty) || 1,
          weight: it.weight,
          kg: it.kg,
          carton: it.carton || it.cartoon,
          unitPrice: Number(it.unitPrice || it.rate) || 0,
          total: Number(it.total || it.amount) || 0,
        })),
        subtotal: Number(fullChallan.subtotal) || Number(fullChallan.total) || 0,
        discount: Number(fullChallan.discount) || 0,
        tax: Number(fullChallan.tax) || 0,
        total: Number(fullChallan.total) || 0,
        notes: fullChallan.notes,
        vehicleNo: fullChallan.vehicleNo,
        transportName: fullChallan.transportName,
      };

      generateInvoicePdf(payload, 'save');
    } catch (err) {
      console.error("Direct download error:", err);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleOpenWhatsApp = (challan: any) => {
    const rawPhone = challan.customerPhone || challan.customer?.phone || challan.customer?.mobile || challan.phone || "";
    const cleanPhone = rawPhone.replace(/\D/g, "");
    let formattedPhone = cleanPhone;
    if (formattedPhone.length === 10) {
      formattedPhone = `91${formattedPhone}`;
    }

    const challanNo = challan.challanNo || challan.billNumber || challan.invoiceId || "CH-0001";
    const customerName = challan.customerName || challan.customer?.name || challan.companyName || "Customer";
    const amount = Number(challan.total || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });
    const challanDate = challan.issueDate
      ? new Date(challan.issueDate).toLocaleDateString("en-GB")
      : new Date().toLocaleDateString("en-GB");

    const message = encodeURIComponent(
      `Hello ${customerName},\n\nYour Delivery Challan details from OM SAI ENTERPRISE:\nChallan No: ${challanNo}\nDate: ${challanDate}\nTotal Amount: ₹${amount}\n\nThank you for your business!`
    );

    if (formattedPhone) {
      window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${message}`, "_blank");
    } else {
      window.open(`https://api.whatsapp.com/send?text=${message}`, "_blank");
    }
  };

  const fetchChallans = async () => {
    try {
      setLoading(true);
      // Fetch bills where documentType is challan or challanNo exists
      const res = await billingService.getBills({ documentType: "challan" });
      if (res && res.bills) {
        setChallans(res.bills);
      } else {
        // Fallback: fetch all and filter client side
        const allRes = await billingService.getBills();
        if (allRes && allRes.bills) {
          setChallans(
            allRes.bills.filter(
              (b: any) =>
                b.documentType === "challan" ||
                (b.challanNo && b.challanNo.startsWith("CH-"))
            )
          );
        }
      }
    } catch (err) {
      console.error("Error fetching challans:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, []);

  // Filtered list
  const filteredChallans = useMemo(() => {
    return challans.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        c.challanNo?.toLowerCase().includes(q) ||
        c.invoiceId?.toLowerCase().includes(q) ||
        c.customerName?.toLowerCase().includes(q) ||
        c.vehicleNo?.toLowerCase().includes(q) ||
        c.transportName?.toLowerCase().includes(q);

      const isInvoiced = Boolean(c.convertedInvoiceId);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "invoiced" && isInvoiced) ||
        (statusFilter === "pending" && !isInvoiced);

      const matchesDate = (() => {
        if (!dateRange.start && !dateRange.end) return true;
        const itemDateStr = c.billDate || c.createdAt || c.invoiceDate;
        if (!itemDateStr) return true;
        const itemDate = new Date(itemDateStr);
        if (isNaN(itemDate.getTime())) return true;
        if (dateRange.start) {
          const startDate = new Date(dateRange.start);
          startDate.setHours(0, 0, 0, 0);
          if (itemDate < startDate) return false;
        }
        if (dateRange.end) {
          const endDate = new Date(dateRange.end);
          endDate.setHours(23, 59, 59, 999);
          if (itemDate > endDate) return false;
        }
        return true;
      })();

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [challans, searchQuery, statusFilter, dateRange]);

  // Statistics
  const totalCount = challans.length;
  const invoicedCount = challans.filter((c) => Boolean(c.convertedInvoiceId)).length;
  const pendingCount = totalCount - invoicedCount;
  const totalAmount = challans.reduce((sum, c) => sum + (Number(c.total) || 0), 0);

  // Bulk Convert Helpers
  const pendingFilteredChallans = useMemo(() => {
    return filteredChallans.filter((c) => !c.convertedInvoiceId);
  }, [filteredChallans]);

  const selectedChallansList = useMemo(() => {
    return challans.filter((c) => selectedChallanIds.includes(c.id));
  }, [challans, selectedChallanIds]);

  const selectedTotalAmount = useMemo(() => {
    return selectedChallansList.reduce((sum, c) => sum + (Number(c.subtotal || c.total) || 0), 0);
  }, [selectedChallansList]);

  const isFiltered = statusFilter !== "all" || Boolean(dateRange.start) || Boolean(dateRange.end);
  const activeFilterCount = (statusFilter !== "all" ? 1 : 0) + (dateRange.start || dateRange.end ? 1 : 0);

  return (
    <div className="space-y-6 pb-12 font-['Plus_Jakarta_Sans']">
      {/* Convert to Tax Invoice Modal with GST selection (Single or Bulk) */}
      <ConvertInvoiceModal
        isOpen={Boolean(challanToConvert || bulkChallansToConvert)}
        onClose={() => {
          setChallanToConvert(null);
          setBulkChallansToConvert(null);
        }}
        challan={challanToConvert}
        bulkChallans={bulkChallansToConvert}
        onSuccess={() => {
          fetchChallans();
          setSelectedChallanIds([]);
        }}
      />

      {/* 1. Statistics Cards - Exactly matching Orders page */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <OrderCard
          title="Total Challans"
          value={totalCount}
          icon={<Truck className="text-blue-500" size={20} />}
          trend={{ value: 0, isPositive: true }}
        />
        <OrderCard
          title="Completed / Invoiced"
          value={invoicedCount}
          icon={<CheckCircle2 className="text-green-500" size={20} />}
          trend={{ value: 0, isPositive: true }}
        />
        <OrderCard
          title="Pending Invoice"
          value={pendingCount}
          icon={<Clock className="text-yellow-500" size={20} />}
          trend={{ value: 0, isPositive: true }}
        />
        <OrderCard
          title="Total Value"
          value={`₹${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
          icon={<FileText className="text-orange-500" size={20} />}
          trend={{ value: 0, isPositive: true }}
        />
      </div>

      {/* 2. Search & Action Row - Styled exactly matching Orders page */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search challans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          onClick={() => {
            setTempStatus(statusFilter);
            setTempDateRange(dateRange);
            setShowFilters(true);
          }}
          className={`px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 ${isFiltered
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
            : 'bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-white'
            }`}
        >
          <Filter size={20} />
          Filter
          {isFiltered && (
            <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
        <Link
          href="/challans/add"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap text-sm font-medium transition-colors"
        >
          <Plus size={18} />
          New Challan
        </Link>
      </div>

      {/* Filter modal */}
      {showFilters && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowFilters(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#202936]"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filter Challans</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full cursor-pointer"
                >
                  <X size={18} className="text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Status Filter */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Activity size={16} />
                    Challan Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: "all", label: "All" },
                      { key: "pending", label: "Pending Invoice" },
                      { key: "invoiced", label: "Invoiced" },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setTempStatus(key as any)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${tempStatus === key
                          ? "bg-blue-500 text-white shadow-xs"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                          }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar size={16} />
                    Date Range
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="block text-[11px] text-gray-500 dark:text-gray-400 mb-1">From Date</span>
                      <input
                        type="date"
                        value={tempDateRange.start}
                        onChange={(e) => setTempDateRange((prev) => ({ ...prev, start: e.target.value }))}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] text-gray-500 dark:text-gray-400 mb-1">To Date</span>
                      <input
                        type="date"
                        value={tempDateRange.end}
                        onChange={(e) => setTempDateRange((prev) => ({ ...prev, end: e.target.value }))}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setTempStatus("all");
                      setTempDateRange({ start: "", end: "" });
                      setStatusFilter("all");
                      setDateRange({ start: "", end: "" });
                      setShowFilters(false);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm cursor-pointer"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter(tempStatus);
                      setDateRange(tempDateRange);
                      setShowFilters(false);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium cursor-pointer"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* 3. Challans Data Table */}
      <div className="glass-card rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#202936] shadow-sm">
        <div className="overflow-x-auto md:overflow-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 dark:bg-[#1a222c]/50 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    title="Select All Pending Challans"
                    checked={
                      pendingFilteredChallans.length > 0 &&
                      selectedChallanIds.length === pendingFilteredChallans.length
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedChallanIds(pendingFilteredChallans.map((c) => c.id));
                      } else {
                        setSelectedChallanIds([]);
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4 w-28 whitespace-nowrap">CHALLAN NO</th>
                <th className="py-3 px-4 w-28 whitespace-nowrap">DATE</th>
                <th className="py-3 px-4 min-w-[170px]">PARTY / MILL</th>
                <th className="py-3 px-4 w-36 whitespace-nowrap">TRANSPORT</th>
                <th className="py-3 px-4 w-32 whitespace-nowrap">VEHICLE NO</th>
                <th className="py-3 px-4 w-24 text-center whitespace-nowrap">ITEMS</th>
                <th className="py-3 px-4 w-36 text-right whitespace-nowrap">AMOUNT (₹)</th>
                <th className="py-3 px-4 w-40 text-center whitespace-nowrap">STATUS</th>
                <th className="py-3 px-4 w-52 text-right whitespace-nowrap">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Loading delivery challans...</span>
                  </td>
                </tr>
              ) : filteredChallans.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-400 dark:text-gray-500 text-xs sm:text-sm">
                    No delivery challans found. Click "+ New Delivery Challan" to create one.
                  </td>
                </tr>
              ) : (
                filteredChallans.map((challan, index) => {
                  const isInvoiced = Boolean(challan.convertedInvoiceId);
                  const displayDate = challan.issueDate
                    ? new Date(challan.issueDate).toLocaleDateString("en-GB")
                    : "-";
                  const itemsCount = challan.items?.length || 1;

                  return (
                    <tr
                      key={challan.id}
                      className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors ${
                        selectedChallanIds.includes(challan.id) ? "bg-blue-50/40 dark:bg-blue-900/10" : ""
                      }`}
                    >
                      {/* Checkbox for Bulk Convert */}
                      <td className="py-3.5 px-3 w-10 text-center">
                        {!isInvoiced ? (
                          <input
                            type="checkbox"
                            checked={selectedChallanIds.includes(challan.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              if (e.target.checked) {
                                const alreadySelected = challans.filter((c) => selectedChallanIds.includes(c.id));
                                if (
                                  alreadySelected.length > 0 &&
                                  (alreadySelected[0].customerName || "").toLowerCase().trim() !==
                                    (challan.customerName || "").toLowerCase().trim()
                                ) {
                                  alert(
                                    `Please select delivery challans for the same party (${alreadySelected[0].customerName}). Bulk convert combines multiple challans of one customer into a single Tax Invoice.`
                                  );
                                  return;
                                }
                                setSelectedChallanIds((prev) => [...prev, challan.id]);
                              } else {
                                setSelectedChallanIds((prev) => prev.filter((id) => id !== challan.id));
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        ) : (
                          <span className="text-[10px] text-gray-400 font-mono" title="Already Invoiced">
                            ✓
                          </span>
                        )}
                      </td>
                      {/* Challan No */}
                      <td className="py-3.5 px-4 w-28 text-sm text-gray-700 dark:text-gray-300 font-mono font-medium">
                        {challan.challanNo || challan.invoiceId || formatShortId(challan.id, "CH")}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 w-28 text-xs text-gray-600 dark:text-gray-400 font-mono">
                        {displayDate}
                      </td>

                      {/* Party */}
                      <td className="py-3.5 px-4 min-w-[170px]">
                        <div className="font-medium text-gray-900 dark:text-gray-100 text-xs sm:text-sm">
                          {challan.customerName || challan.companyName || "Cash Customer"}
                        </div>
                        {challan.billingAddress && (
                          <div className="text-[11px] text-gray-400 truncate max-w-[200px]">
                            {challan.billingAddress}
                          </div>
                        )}
                      </td>

                      {/* Transport */}
                      <td className="py-3.5 px-4 w-36 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {challan.transportName ? (
                          <span>{challan.transportName}</span>
                        ) : (
                          <span className="text-gray-400">Direct Handover</span>
                        )}
                      </td>

                      {/* Vehicle No */}
                      <td className="py-3.5 px-4 w-32 text-xs font-mono font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {challan.vehicleNo ? (
                          <span className="uppercase">{challan.vehicleNo}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-4 w-24 text-center text-xs font-mono">
                        {itemsCount} {itemsCount === 1 ? "item" : "items"}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 w-36 text-right font-mono font-bold text-gray-900 dark:text-gray-100 text-xs sm:text-sm">
                        ₹{formatCurrency(challan.total)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 w-40 text-center whitespace-nowrap">
                        {(() => {
                          const dueStatus = getDueStatus(challan.dueDate, isInvoiced);
                          if (isInvoiced) {
                            return (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 size={12} />
                                Invoiced
                              </span>
                            );
                          }
                          if (dueStatus.isOverdue) {
                            return (
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800 shadow-2xs">
                                  <AlertCircle size={11} />
                                  {dueStatus.label}
                                </span>
                                <span className="text-[10px] text-gray-400 font-medium">Pending Invoice</span>
                              </div>
                            );
                          }
                          return (
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                <Clock size={12} />
                                Pending Invoice
                              </span>
                              {dueStatus.daysDiff < 0 && (
                                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                                  {dueStatus.label}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 w-52 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {!isInvoiced && (
                            <button
                              type="button"
                              onClick={() => setChallanToConvert(challan)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300 text-xs font-semibold rounded-lg border border-blue-200 dark:border-blue-800 transition-colors shadow-xs cursor-pointer"
                              title="Convert this delivery challan into a Tax Invoice"
                            >
                              <ArrowRight size={12} />
                              <span>Convert to Invoice</span>
                            </button>
                          )}

                          {/* 3-Dot Action Menu */}
                          <div className="relative inline-block text-left action-menu-container">
                            <button
                              type="button"
                              onClick={(e) => toggleActionMenu(challan.id, e, index)}
                              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400 cursor-pointer"
                              title="Actions"
                            >
                              <MoreVertical size={16} />
                            </button>

                            {activeActionMenu === challan.id && (
                              <div
                                className={`absolute right-0 ${menuVerticalPosition === "bottom"
                                  ? "bottom-full mb-1"
                                  : "top-full mt-1"
                                  } bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 py-1.5 z-[100] min-w-36 text-left whitespace-nowrap animate-in fade-in zoom-in-95 duration-100`}
                              >
                                <Link
                                  href={`/challans/${challan.id}`}
                                  className="flex items-center w-full px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                  <Eye size={15} className="mr-2.5 text-blue-500" />
                                  <span>View</span>
                                </Link>

                                <button
                                  type="button"
                                  disabled={downloadingId === challan.id}
                                  onClick={() => {
                                    setActiveActionMenu(null);
                                    handleDirectDownload(challan);
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors disabled:opacity-50"
                                >
                                  {downloadingId === challan.id ? (
                                    <Loader2 size={15} className="mr-2.5 text-emerald-500 animate-spin" />
                                  ) : (
                                    <Download size={15} className="mr-2.5 text-emerald-500" />
                                  )}
                                  <span>{downloadingId === challan.id ? "Downloading..." : "Download"}</span>
                                </button>

                                <Link
                                  href={`/challans/edit/${challan.id}`}
                                  className="flex items-center w-full px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                  <Edit size={15} className="mr-2.5 text-amber-500" />
                                  <span>Edit</span>
                                </Link>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteChallan(challan.id)}
                                  className="flex items-center w-full px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                                >
                                  <Trash size={15} className="mr-2.5 text-red-500" />
                                  <span>Delete</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveActionMenu(null);
                                    handleOpenWhatsApp(challan);
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                                >
                                  <FaWhatsapp size={15} className="mr-2.5 text-emerald-500" />
                                  <span>WhatsApp</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Bottom Action Bar for Bulk Convert */}
      {selectedChallanIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-auto max-w-[95vw] bg-white/95 dark:bg-[#1e2634]/95 backdrop-blur-md border border-blue-200/80 dark:border-blue-700/60 shadow-2xl rounded-2xl px-5 py-3 flex items-center justify-between gap-5 sm:gap-8 animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-3.5 whitespace-nowrap">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center font-bold text-sm shadow-2xs shrink-0 font-mono">
              {selectedChallanIds.length}
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm whitespace-nowrap">
              <span className="font-bold text-gray-900 dark:text-white">
                {selectedChallanIds.length} Challans Selected
              </span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-800/50">
                (₹{formatCurrency(selectedTotalAmount)})
              </span>
              <span className="text-gray-300 dark:text-gray-600 mx-0.5">•</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Party: <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedChallansList[0]?.customerName || "Customer"}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 whitespace-nowrap">
            <button
              type="button"
              onClick={() => setSelectedChallanIds([])}
              className="px-3.5 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/70 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setBulkChallansToConvert(selectedChallansList)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap active:scale-[0.98]"
            >
              <ReceiptText size={15} />
              <span>Bulk Convert to Tax Invoice</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
