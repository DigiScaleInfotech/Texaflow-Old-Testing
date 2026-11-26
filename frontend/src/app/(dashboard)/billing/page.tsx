"use client";

import React from "react";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation"; // Corrected import for app router
import {
  Search,
  Filter,
  Printer,
  Download,
  Mail,
  Phone,
  Trash2,
  Plus,
  SlidersHorizontal,
  MoreVertical,
  Eye,
  Edit,
  Trash,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  CreditCard,
  X,
  CheckCircle,
  User,
  FileText,
  Info,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { OrderCard } from "@/components/ui/order/order-card";
import { generateInvoicePdf } from "@/utils/generateInvoicePdf";
import {
  BillingFilter,
  type BillingFilters,
} from "@/components/ui/billing/billing-filter";
import { FaWhatsapp } from "react-icons/fa";
import { billingService } from "@/services/billing.service";
import { customerService } from "@/services/customer.service";
import { formatShortId, formatCurrency } from "@/utils/format";
import { getDueStatus } from "@/utils/paymentTerms";

export default function BillingPage() {
  const router = useRouter(); // This will now use the correct router
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);

  // Bill Type Filter: "sales" | "purchase"
  const [activeTypeTab, setActiveTypeTab] = useState<"sales" | "purchase">("sales");

  const fetchCustomers = async () => {
    try {
      const res = await customerService.getCustomers({ limit: 100 });
      if (res && res.customers) {
        setCustomers(res.customers);
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
    }
  };

  const fetchBills = async () => {
    try {
      setLoading(true);
      // Strictly fetch Tax Invoices, excluding Delivery Challans
      const res = await billingService.getBills({ documentType: "invoice" });
      if (res && res.bills) {
        const onlyInvoices = res.bills.filter((b: any) => b.documentType !== "challan");
        const mapped = onlyInvoices.map((b: any) => ({
          id: b.id,
          invoiceNo: b.invoiceId || b.billNumber || b.id,
          rawId: b.id,
          date: new Date(b.issueDate || b.createdAt || Date.now()).toISOString().split("T")[0],
          dueDate: b.dueDate ? new Date(b.dueDate).toISOString().split("T")[0] : "",
          party: b.customerName || b.partyName || b.customer?.name || "Customer",
          customerId: b.customerId || "",
          email: b.customerEmail || b.customer?.email || "",
          phone: b.customerPhone || b.customer?.phone || b.customer?.mobile || "",
          amount: Number(Number(b.subtotal || 0).toFixed(2)),
          gst: Number(Number(b.tax || 0).toFixed(2)),
          total: Number(Number(b.total || 0).toFixed(2)),
          amountPaid: Number(Number(b.amountPaid || 0).toFixed(2)),
          amountRemaining:
            b.amountRemaining !== undefined && b.amountRemaining !== null
              ? Number(Number(b.amountRemaining).toFixed(2))
              : Math.max(0, Number((Number(b.total || 0) - Number(b.amountPaid || 0)).toFixed(2))),
          status: (b.paymentStatus || "pending").toLowerCase(),
          type: b.billType || "sales",
          items: b.items || [],
          billingAddress: b.billingAddress || "",
          paymentMethod: b.paymentMethod || "Cash",
          challanNo: b.challanNo || "",
          customerGst: b.customerGst || b.customer?.gst || "",
          companyName: b.companyName || "",
          notes: b.notes || "",
        }));
        setBills(mapped);
      }
    } catch (err) {
      console.error("Error fetching bills:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
    fetchCustomers();
  }, []);

  const handleDelete = async (billId: string) => {
    if (!confirm("Are you sure you want to delete this bill?")) return;
    try {
      await billingService.deleteBill(billId);
      setBills((prev) => prev.filter((b) => b.rawId !== billId && b.id !== billId));
      setActiveActionMenu(null);
    } catch (err: any) {
      alert(err?.message || "Failed to delete bill");
    }
  };

  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<BillingFilters>({
    status: [],
    dateRange: { start: "", end: "" },
    amountRange: { min: "", max: "" },
    type: [],
  });

  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);

  // Add state to track position of dropdown menu
  const [menuPosition, setMenuPosition] = useState<"left" | "right">("right");

  // Add state to track vertical position of dropdown menu
  const [menuVerticalPosition, setMenuVerticalPosition] = useState<
    "top" | "bottom"
  >("top");

  // Payment Recording State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"bill" | "customer">("bill");
  const [selectedBillForPayment, setSelectedBillForPayment] = useState<any>(null);
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<any>(null);
  const [selectedPartyFilter, setSelectedPartyFilter] = useState<string>("");
  const [showPaidBillsInModal, setShowPaidBillsInModal] = useState<boolean>(false);
  const [invoiceSearchText, setInvoiceSearchText] = useState("");
  const [showInvoiceDropdown, setShowInvoiceDropdown] = useState(false);
  const [customerSearchText, setCustomerSearchText] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    billId: "",
    customerId: "",
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "Bank Transfer",
    notes: "",
  });
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState("");
  const [paymentErrorMsg, setPaymentErrorMsg] = useState("");

  const currentDueAmount = useMemo(() => {
    if (paymentMode === "customer") {
      return Number(selectedCustomerForPayment?.totalOutstanding) || 0;
    }
    if (selectedBillForPayment) {
      return selectedBillForPayment.amountRemaining !== undefined &&
        selectedBillForPayment.amountRemaining > 0
        ? selectedBillForPayment.amountRemaining
        : selectedBillForPayment.total || 0;
    }
    return 0;
  }, [paymentMode, selectedCustomerForPayment, selectedBillForPayment]);

  // Aggregated customers with pending bill counts and total dues
  const customersWithPending = useMemo(() => {
    const partyMap = new Map<
      string,
      {
        id: string;
        name: string;
        pendingCount: number;
        totalDue: number;
        phone?: string;
        mobile?: string;
        totalOutstanding?: number;
        creditLimit?: number;
        availableCredit?: number;
      }
    >();

    customers.forEach((c) => {
      partyMap.set((c.name || c.id).toLowerCase(), {
        id: c.id,
        name: c.name || "Customer",
        pendingCount: 0,
        totalDue: Number(c.totalOutstanding) || 0,
        phone: c.mobile || c.phone || "",
        mobile: c.mobile || c.phone || "",
        totalOutstanding: Number(c.totalOutstanding) || 0,
        creditLimit: Number(c.creditLimit) || 0,
        availableCredit: Number(c.availableCredit) || 0,
      });
    });

    bills.forEach((b) => {
      const partyKey = (b.party || "").toLowerCase();
      if (!partyKey) return;
      if (!partyMap.has(partyKey)) {
        partyMap.set(partyKey, {
          id: b.customerId || partyKey,
          name: b.party,
          pendingCount: 0,
          totalDue: 0,
          phone: b.phone || "",
          mobile: b.phone || "",
          totalOutstanding: 0,
          creditLimit: 0,
          availableCredit: 0,
        });
      }
      const remaining =
        b.amountRemaining !== undefined ? b.amountRemaining : b.total;
      if (b.status !== "paid" && remaining > 0) {
        const item = partyMap.get(partyKey)!;
        item.pendingCount += 1;
        item.totalDue += remaining;
        item.totalOutstanding = item.totalDue;
      }
    });

    const list = Array.from(partyMap.values());
    return list.sort((a, b) => {
      if (b.pendingCount !== a.pendingCount) return b.pendingCount - a.pendingCount;
      if (b.totalDue !== a.totalDue) return b.totalDue - a.totalDue;
      return a.name.localeCompare(b.name);
    });
  }, [customers, bills]);

  // Pending bills for selected party
  const partyPendingBills = useMemo(() => {
    if (!selectedPartyFilter) return [];
    return bills.filter(
      (b) =>
        (b.party?.toLowerCase() === selectedPartyFilter.toLowerCase() ||
          b.customerId === selectedPartyFilter) &&
        (showPaidBillsInModal ||
          (b.status !== "paid" &&
            (b.amountRemaining === undefined || b.amountRemaining > 0)))
    );
  }, [bills, selectedPartyFilter, showPaidBillsInModal]);

  // All bills eligible for payment (unpaid by default)
  const eligibleBills = useMemo(() => {
    return bills.filter((b) => {
      if (showPaidBillsInModal) return true;
      const remaining =
        b.amountRemaining !== undefined ? b.amountRemaining : b.total;
      return b.status !== "paid" && remaining > 0;
    });
  }, [bills, showPaidBillsInModal]);

  // Filtered bills for searchable dropdown
  const filteredSearchBills = useMemo(() => {
    let list = eligibleBills;
    if (selectedPartyFilter) {
      list = list.filter(
        (b) =>
          b.customerId === selectedPartyFilter ||
          b.party?.toLowerCase() === selectedPartyFilter.toLowerCase()
      );
    }
    if (!invoiceSearchText.trim()) return list;
    const q = invoiceSearchText.toLowerCase();
    return list.filter(
      (b) =>
        b.id.toLowerCase().includes(q) ||
        b.party?.toLowerCase().includes(q) ||
        (b.challanNo && b.challanNo.toLowerCase().includes(q))
    );
  }, [eligibleBills, selectedPartyFilter, invoiceSearchText]);

  // Filtered customers for searchable dropdown
  const filteredSearchCustomers = useMemo(() => {
    if (!customerSearchText.trim()) return customersWithPending;
    const q = customerSearchText.toLowerCase();
    return customersWithPending.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        (c.phone && c.phone.toLowerCase().includes(q))
    );
  }, [customersWithPending, customerSearchText]);

  const handleSelectInvoiceFromSearch = (bill: any) => {
    setSelectedBillForPayment(bill);
    setSelectedPartyFilter(bill.party || "");
    setInvoiceSearchText(`${formatShortId(bill.id, "INV-")} - ${bill.party}`);
    setShowInvoiceDropdown(false);
    const remaining =
      bill.amountRemaining !== undefined && bill.amountRemaining > 0
        ? bill.amountRemaining
        : bill.total;
    setPaymentForm((prev) => ({
      ...prev,
      billId: bill.rawId || bill.id,
      customerId: bill.customerId || prev.customerId,
      amount: remaining > 0 ? remaining.toFixed(2) : bill.total.toFixed(2),
    }));
  };

  const handleSelectCustomerFromSearch = (customer: any) => {
    setSelectedCustomerForPayment(customer);
    setCustomerSearchText(customer.name || "");
    setShowCustomerDropdown(false);
    const due = Number(customer.totalDue || customer.totalOutstanding) || 0;
    setPaymentForm((prev) => ({
      ...prev,
      customerId: customer.id,
      amount: due > 0 ? due.toFixed(2) : "",
    }));
  };

  const handleOpenPaymentModal = (bill?: any) => {
    setActiveActionMenu(null);
    setPaymentSuccessMsg("");
    setPaymentErrorMsg("");
    setShowInvoiceDropdown(false);
    setShowCustomerDropdown(false);

    fetchCustomers();

    if (bill) {
      setPaymentMode("bill");
      setSelectedPartyFilter(bill.party || "");
      setSelectedBillForPayment(bill);
      setInvoiceSearchText(`${formatShortId(bill.id, "INV-")} - ${bill.party}`);
      const remaining =
        bill.amountRemaining !== undefined && bill.amountRemaining > 0
          ? bill.amountRemaining
          : bill.total;
      setPaymentForm({
        billId: bill.rawId || bill.id,
        customerId: bill.customerId || "",
        amount: remaining > 0 ? remaining.toFixed(2) : bill.total.toFixed(2),
        paymentDate: new Date().toISOString().split("T")[0],
        paymentMethod: "Bank Transfer",
        notes: "",
      });
    } else {
      const unpaid = bills.filter(
        (b) =>
          b.status !== "paid" &&
          (b.amountRemaining === undefined || b.amountRemaining > 0)
      );
      const defaultBill = unpaid.length > 0 ? unpaid[0] : bills[0];
      setSelectedPartyFilter(defaultBill ? defaultBill.party : "");
      setSelectedBillForPayment(defaultBill || null);
      if (defaultBill) {
        setInvoiceSearchText(
          `${formatShortId(defaultBill.id, "INV-")} - ${defaultBill.party}`
        );
      } else {
        setInvoiceSearchText("");
      }
      const remaining = defaultBill
        ? defaultBill.amountRemaining !== undefined &&
          defaultBill.amountRemaining > 0
          ? defaultBill.amountRemaining
          : defaultBill.total
        : 0;

      const custWithDue =
        customers.find((c) => Number(c.totalOutstanding) > 0) || customers[0];
      setSelectedCustomerForPayment(custWithDue || null);
      if (custWithDue) {
        setCustomerSearchText(custWithDue.name || "");
      } else {
        setCustomerSearchText("");
      }

      setPaymentForm({
        billId: defaultBill ? defaultBill.rawId || defaultBill.id : "",
        customerId: custWithDue ? custWithDue.id : "",
        amount:
          paymentMode === "customer" && custWithDue
            ? (Number(custWithDue.totalOutstanding) || 0).toFixed(2)
            : remaining > 0
            ? remaining.toFixed(2)
            : "",
        paymentDate: new Date().toISOString().split("T")[0],
        paymentMethod: "Bank Transfer",
        notes: "",
      });
    }
    setShowPaymentModal(true);
  };

  const handleSwitchPaymentMode = (mode: "bill" | "customer") => {
    setPaymentMode(mode);
    setPaymentErrorMsg("");
    setPaymentSuccessMsg("");
    setShowInvoiceDropdown(false);
    setShowCustomerDropdown(false);
    if (mode === "customer") {
      const cust =
        selectedCustomerForPayment ||
        customers.find((c) => Number(c.totalOutstanding) > 0) ||
        customers[0];
      setSelectedCustomerForPayment(cust || null);
      setCustomerSearchText(cust?.name || "");
      const due = Number(cust?.totalOutstanding) || 0;
      setPaymentForm((prev) => ({
        ...prev,
        customerId: cust ? cust.id : "",
        amount: due > 0 ? due.toFixed(2) : "",
      }));
    } else {
      if (selectedBillForPayment) {
        setInvoiceSearchText(
          `${formatShortId(selectedBillForPayment.id, "INV-")} - ${selectedBillForPayment.party}`
        );
      }
      const remaining = selectedBillForPayment
        ? selectedBillForPayment.amountRemaining !== undefined &&
          selectedBillForPayment.amountRemaining > 0
          ? selectedBillForPayment.amountRemaining
          : selectedBillForPayment.total
        : 0;
      setPaymentForm((prev) => ({
        ...prev,
        amount: remaining > 0 ? remaining.toFixed(2) : "",
      }));
    }
  };

  const handleBillSelectChange = (billId: string) => {
    const found = bills.find((b) => (b.rawId || b.id) === billId);
    setSelectedBillForPayment(found || null);
    if (found) {
      const remaining =
        found.amountRemaining !== undefined && found.amountRemaining > 0
          ? found.amountRemaining
          : found.total;
      setPaymentForm((prev) => ({
        ...prev,
        billId,
        amount: remaining > 0 ? remaining.toFixed(2) : found.total.toFixed(2),
      }));
    } else {
      setPaymentForm((prev) => ({ ...prev, billId }));
    }
  };

  const handleCustomerSelectChange = (customerId: string) => {
    const found = customers.find((c) => c.id === customerId);
    setSelectedCustomerForPayment(found || null);
    if (found) {
      const due = Number(found.totalOutstanding) || 0;
      setPaymentForm((prev) => ({
        ...prev,
        customerId,
        amount: due > 0 ? due.toFixed(2) : "",
      }));
    } else {
      setPaymentForm((prev) => ({ ...prev, customerId }));
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(paymentForm.amount);
    if (isNaN(amt) || amt <= 0) {
      setPaymentErrorMsg("Please enter a valid payment amount.");
      return;
    }

    try {
      setRecordingPayment(true);
      setPaymentErrorMsg("");

      if (paymentMode === "customer") {
        if (!paymentForm.customerId) {
          setPaymentErrorMsg("Please select a customer for Khata Pete payment.");
          setRecordingPayment(false);
          return;
        }
        const res: any = await billingService.recordCustomerPayment({
          customerId: paymentForm.customerId,
          amount: amt,
          paymentDate: paymentForm.paymentDate,
          paymentMethod: paymentForm.paymentMethod,
          notes: paymentForm.notes,
        });
        const updatedCount = res?.updatedBillsCount || 0;
        setPaymentSuccessMsg(
          `ખાતા પેટે ₹${amt.toLocaleString()} જમા થયા! (${updatedCount} બિલોમાં રકમ જમા થઈ)`
        );
      } else {
        if (!paymentForm.billId) {
          setPaymentErrorMsg("Please select an invoice to record payment.");
          setRecordingPayment(false);
          return;
        }
        await billingService.recordPayment(paymentForm.billId, {
          amount: amt,
          paymentDate: paymentForm.paymentDate,
          paymentMethod: paymentForm.paymentMethod,
          notes: paymentForm.notes,
        });
        setPaymentSuccessMsg("Payment recorded successfully!");
      }

      await fetchBills();
      await fetchCustomers();
      setTimeout(() => {
        setShowPaymentModal(false);
        setPaymentSuccessMsg("");
      }, 1500);
    } catch (err: any) {
      console.error("Failed to record payment:", err);
      setPaymentErrorMsg(
        err?.response?.data?.message || err?.message || "Failed to record payment"
      );
    } finally {
      setRecordingPayment(false);
    }
  };

  const handleExportStatements = () => {
    try {
      const dataToExport = filteredBills.length > 0 ? filteredBills : bills;
      if (dataToExport.length === 0) {
        alert("No bills available to export.");
        return;
      }
      const headers = [
        "Invoice No",
        "Date",
        "Due Date",
        "Customer Name",
        "Phone",
        "Subtotal (₹)",
        "GST (₹)",
        "Total (₹)",
        "Amount Paid (₹)",
        "Remaining (₹)",
        "Status",
      ];
      const rows = dataToExport.map((b) => [
        `"${b.id}"`,
        `"${b.date}"`,
        `"${b.dueDate || ""}"`,
        `"${(b.party || "").replace(/"/g, '""')}"`,
        `"${b.phone || ""}"`,
        (b.amount || 0).toFixed(2),
        (b.gst || 0).toFixed(2),
        (b.total || 0).toFixed(2),
        (b.amountPaid || 0).toFixed(2),
        (b.amountRemaining !== undefined ? b.amountRemaining : b.total).toFixed(2),
        `"${b.status}"`,
      ]);

      const csvContent =
        "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `Texa_Invoices_Statement_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error exporting statements:", err);
      alert("Failed to export statements");
    }
  };

  // Calculate payment statistics dynamically from real bills
  const paymentStats = useMemo(() => {
    const isPending = (status: string) => {
      const s = (status || "").toLowerCase();
      return s === "pending" || s === "unpaid" || s === "due";
    };

    const isSales = (type: string) => {
      const t = (type || "").toLowerCase();
      return t === "sales" || t === "sale";
    };

    const isPurchase = (type: string) => {
      const t = (type || "").toLowerCase();
      return t === "purchase" || t === "purchases";
    };

    const totalReceivable = bills
      .filter((bill) => isPending(bill.status) && isSales(bill.type))
      .reduce((sum, bill) => sum + (Number(bill.total) || 0), 0);

    const totalPayable = bills
      .filter((bill) => isPending(bill.status) && isPurchase(bill.type))
      .reduce((sum, bill) => sum + (Number(bill.total) || 0), 0);

    const totalSales = bills
      .filter((bill) => isSales(bill.type))
      .reduce((sum, bill) => sum + (Number(bill.total) || 0), 0);

    const totalPurchases = bills
      .filter((bill) => isPurchase(bill.type))
      .reduce((sum, bill) => sum + (Number(bill.total) || 0), 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueBillsList = bills.filter((bill) => {
      if (bill.status === "paid") return false;
      if (!bill.dueDate) return false;
      const due = new Date(bill.dueDate);
      due.setHours(0, 0, 0, 0);
      return due < today;
    });

    const totalOverdue = overdueBillsList.reduce(
      (sum, bill) => sum + (Number(bill.total) || 0),
      0
    );

    return {
      totalReceivable,
      totalPayable,
      totalSales,
      totalPurchases,
      pendingBills: bills.filter((bill) => isPending(bill.status)).length,
      overdueCount: overdueBillsList.length,
      totalOverdue,
    };
  }, [bills]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (activeActionMenu && !target.closest(".action-menu-container")) {
        setActiveActionMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeActionMenu]);

  const toggleActionMenu = (billId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (activeActionMenu === billId) {
      setActiveActionMenu(null);
      return;
    }

    const button = e.currentTarget as HTMLElement;
    const buttonRect = button.getBoundingClientRect();
    const spaceBelow = window.innerHeight - buttonRect.bottom;

    setMenuVerticalPosition(spaceBelow < 200 ? "bottom" : "top");
    setActiveActionMenu(billId);
  };

  // Filter and search functionality
  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      // Search filter
      if (
        searchQuery &&
        !bill.party.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !bill.id.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(bill.status)) {
        return false;
      }

      // Type filter
      if (
        (filters as any).type &&
        (filters as any).type.length > 0 &&
        !(filters as any).type.includes(bill.type)
      ) {
        return false;
      }

      // Date range filter
      if (
        filters.dateRange.start &&
        new Date(bill.date) < new Date(filters.dateRange.start)
      ) {
        return false;
      }
      if (
        filters.dateRange.end &&
        new Date(bill.date) > new Date(filters.dateRange.end)
      ) {
        return false;
      }

      // Amount range filter
      if (
        filters.amountRange.min &&
        bill.total < Number(filters.amountRange.min)
      ) {
        return false;
      }
      if (
        filters.amountRange.max &&
        bill.total > Number(filters.amountRange.max)
      ) {
        return false;
      }

      // Bill Type filter (Sales or Purchase)
      const isSales = (bill.type || "").toLowerCase().includes("sale");
      if (activeTypeTab === "sales" && !isSales) return false;
      if (activeTypeTab === "purchase" && isSales) return false;

      return true;
    });
  }, [bills, searchQuery, filters, activeTypeTab]);

  const handleApplyFilters = (newFilters: BillingFilters) => {
    setFilters(newFilters);
    setShowFilters(false);
  };

  const handleDownloadInvoice = (bill: any) => {
    const items = bill.items && bill.items.length > 0
      ? bill.items.map((it: any, index: number) => ({
          id: it.id || `ITEM-${index + 1}`,
          description: it.description || it.product?.name || "Textile Fabric",
          quantity: it.quantity || 1,
          unitPrice: parseFloat(it.unitPrice) || (bill.amount / (it.quantity || 1)),
          total: parseFloat(it.total) || bill.amount
        }))
      : [
          {
            id: "ITEM001",
            description: "Textile Fabric",
            quantity: 1,
            unitPrice: bill.amount,
            total: bill.amount,
          },
        ];

    const invoiceData = {
      id: bill.id,
      invoiceNo: bill.invoiceNo || bill.billNumber || "INV-0001",
      challanNo: bill.challanNo,
      docType: 'invoice' as const,
      paperSize: 'a5' as const,
      date: bill.date,
      dueDate: bill.dueDate || new Date(
        new Date(bill.date).setDate(new Date(bill.date).getDate() + 30)
      )
        .toISOString()
        .split("T")[0],
      customerName: bill.party,
      customerEmail: bill.email,
      customerPhone: bill.phone,
      customerAddress: {
        street: bill.billingAddress || "Textile Market",
        city: "Surat",
        state: "Gujarat",
        zip: "395002",
        country: "India",
      },
      items,
      subtotal: bill.amount,
      tax: bill.gst,
      total: bill.total,
      paymentMethod: bill.paymentMethod || "Bank Transfer",
      status: bill.status,
    };

    generateInvoicePdf(invoiceData);
  };

  const handleOpenWhatsApp = (bill: any) => {
    const rawPhone = bill.phone || "";
    const cleanPhone = rawPhone.replace(/\D/g, "");
    let formattedPhone = cleanPhone;
    if (formattedPhone.length === 10) {
      formattedPhone = `91${formattedPhone}`;
    }

    const invoiceNo = bill.invoiceNo || bill.id;
    const customerName = bill.party || "Customer";
    const amount = Number(bill.total || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });
    const billDate = bill.date
      ? new Date(bill.date).toLocaleDateString("en-GB")
      : new Date().toLocaleDateString("en-GB");

    const message = encodeURIComponent(
      `Hello ${customerName},\n\nYour Tax Invoice details from OM SAI ENTERPRISE:\nInvoice No: ${invoiceNo}\nDate: ${billDate}\nTotal Amount: ₹${amount}\nPayment Status: ${(bill.status || 'Pending').toUpperCase()}\n\nThank you for doing business with us!`
    );

    if (formattedPhone) {
      window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${message}`, "_blank");
    } else {
      window.open(`https://api.whatsapp.com/send?text=${message}`, "_blank");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Payment Statistics Cards - Exactly matching Challans & Orders page */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <OrderCard
          title="To Receive"
          value={`₹${paymentStats.totalReceivable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
          icon={<TrendingUp className="text-blue-500" size={20} />}
          trend={{ value: 0, isPositive: true }}
        />
        <OrderCard
          title="To Pay"
          value={`₹${paymentStats.totalPayable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
          icon={<TrendingDown className="text-green-500" size={20} />}
          trend={{ value: 0, isPositive: true }}
        />
        <OrderCard
          title="Pending Bills"
          value={paymentStats.pendingBills}
          icon={<Clock className="text-yellow-500" size={20} />}
          trend={{ value: 0, isPositive: true }}
        />
        <OrderCard
          title="Overdue Invoices"
          value={`₹${paymentStats.totalOverdue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
          icon={<AlertCircle className="text-orange-500" size={20} />}
          trend={{ value: 0, isPositive: true }}
        />
      </div>

      <div className="glass-card p-4 rounded-xl">
        {/* Mobile Type Filter & Search Bar */}
        <div className="md:hidden mb-4 space-y-3">
          <div className="flex items-center gap-2 w-full">
            <button
              type="button"
              onClick={() => setActiveTypeTab("sales")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium text-center transition-colors shadow-xs cursor-pointer ${
                activeTypeTab === "sales"
                  ? "bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-blue-500/20"
                  : "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              Sales
            </button>
            <button
              type="button"
              onClick={() => setActiveTypeTab("purchase")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium text-center transition-colors shadow-xs cursor-pointer ${
                activeTypeTab === "purchase"
                  ? "bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-blue-500/20"
                  : "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              Purchase
            </button>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search bills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg flex items-center gap-1 transition-colors"
            >
              <SlidersHorizontal size={18} />
            </button>
          </div>
        </div>

        {/* Desktop Filters / Mobile Expandable Filters */}
        <div
          className={`${
            showMobileFilters ? "block" : "hidden"
          } md:flex items-center mb-6 space-y-3 md:space-y-0 md:gap-3`}
        >
          {/* Sales & Purchase Buttons (Matching action button styles) */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTypeTab("sales")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-xs cursor-pointer whitespace-nowrap ${
                activeTypeTab === "sales"
                  ? "bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-blue-500/20"
                  : "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              Sales
            </button>
            <button
              type="button"
              onClick={() => setActiveTypeTab("purchase")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-xs cursor-pointer whitespace-nowrap ${
                activeTypeTab === "purchase"
                  ? "bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-blue-500/20"
                  : "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              Purchase
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative hidden md:block md:flex-1">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search bills by invoice #, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(true)}
            className={`w-full md:w-auto px-3.5 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium ${
              Object.values(filters).some((val) =>
                Array.isArray(val)
                  ? val.length > 0
                  : typeof val === "object"
                  ? Object.values(val).some((v) => v !== "")
                  : val !== ""
              )
                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
            }`}
          >
            <Filter size={16} />
            <span>Filter</span>
            {Object.values(filters).some((val) =>
              Array.isArray(val)
                ? val.length > 0
                : typeof val === "object"
                ? Object.values(val).some((v) => v !== "")
                : val !== ""
            ) && (
              <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center font-mono">
                {filters.status.length +
                  (filters.dateRange.start || filters.dateRange.end ? 1 : 0) +
                  (filters.amountRange.min || filters.amountRange.max ? 1 : 0) +
                  ((filters as any).type.length ? 1 : 0)}
              </span>
            )}
          </button>

          {/* Record Payment Button */}
          <Link
            href="/billing/payment"
            className="w-full md:w-auto px-3.5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
          >
            <CreditCard size={16} />
            <span>Record Payment</span>
          </Link>

          {/* New Bill Button */}
          <Link
            href="/billing/add"
            className="w-full md:w-auto px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
          >
            <Plus size={16} />
            <span>New Bill</span>
          </Link>

          {/* Export Icon Button */}
          <button
            type="button"
            onClick={handleExportStatements}
            className="w-full md:w-auto p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors flex items-center justify-center cursor-pointer shadow-xs"
            title="Export Statements CSV"
          >
            <Download size={18} />
          </button>
        </div>

        {/* Filter modal */}
        {showFilters && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowFilters(false)}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <BillingFilter
                onApplyFilters={handleApplyFilters}
                onClose={() => setShowFilters(false)}
                initialFilters={filters}
              />
            </div>
          </div>
        )}

        <div className="overflow-x-auto md:overflow-visible">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="px-4 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                  Bill No
                </th>
                <th className="px-4 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                  Date
                </th>
                <th className="px-4 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                  Party Name
                </th>
                <th className="px-4 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                  Type
                </th>
                <th className="px-4 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                  Amount
                </th>
                <th className="hidden sm:table-cell px-4 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                  GST
                </th>
                <th className="px-4 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                  Total
                </th>
                <th className="px-4 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-4 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading && filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Loading bills...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredBills.length > 0 ? (
                filteredBills.map((bill) => (
                  <motion.tr
                    key={bill.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-4 md:px-6 py-3 md:py-4 text-sm text-gray-700 dark:text-gray-300 font-mono" title={bill.invoiceNo || bill.id}>
                      {bill.invoiceNo || bill.billNumber || formatShortId(bill.id, 'INV')}
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-gray-700 dark:text-gray-300 text-sm">
                      {bill.date}
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <div className="space-y-1">
                        <div className="text-gray-900 dark:text-gray-300 text-sm">
                          {bill.party}
                        </div>
                        <div className="text-xs text-gray-500 hidden sm:block">
                          {bill.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <span
                        className={`px-2 md:px-3 py-1 rounded-full text-xs ${
                          bill.type === "sales"
                            ? "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                            : "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                        }`}
                      >
                        {bill.type === "sales" ? "Sale" : "Purchase"}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-gray-700 dark:text-gray-300 text-sm font-mono">
                      ₹{formatCurrency(bill.amount)}
                    </td>
                    <td className="hidden sm:table-cell px-4 md:px-6 py-3 md:py-4 text-gray-700 dark:text-gray-300 text-sm font-mono">
                      ₹{formatCurrency(bill.gst)}
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-gray-900 dark:text-white text-sm font-mono font-bold">
                      ₹{formatCurrency(bill.total)}
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      {(() => {
                        const dueStatus = getDueStatus(bill.dueDate, bill.status === "paid");
                        if (bill.status === "paid") {
                          return (
                            <span className="px-2 md:px-3 py-1 rounded-full text-xs bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 font-medium capitalize">
                              Paid
                            </span>
                          );
                        }
                        if (dueStatus.isOverdue) {
                          return (
                            <div className="flex flex-col gap-0.5">
                              <span className="px-2 md:px-3 py-1 rounded-full text-xs bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 font-semibold border border-rose-200 dark:border-rose-800">
                                {dueStatus.label}
                              </span>
                              <span className="text-[10px] text-gray-500 dark:text-gray-400 capitalize">
                                {bill.status}
                              </span>
                            </div>
                          );
                        }
                        return (
                          <div className="flex flex-col gap-0.5">
                            <span className="px-2 md:px-3 py-1 rounded-full text-xs bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 font-medium capitalize">
                              {bill.status}
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
                    <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                      <div className="flex items-center justify-end">
                        <div className="relative inline-block text-left action-menu-container">
                        <button
                          onClick={(e) => toggleActionMenu(bill.id, e)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {activeActionMenu === bill.id && (
                          <div
                            className={`absolute right-0 ${
                              menuVerticalPosition === "bottom"
                                ? "bottom-full mb-1"
                                : "top-full mt-1"
                            } bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 py-1.5 z-[100] min-w-36 whitespace-nowrap`}
                          >
                            <Link
                              href={`/billing/${bill.id}`}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Eye size={16} className="mr-2 text-blue-500" />
                              View
                            </Link>
                            {bill.status !== "paid" && (
                              <Link
                                href={`/billing/payment?billId=${bill.id}`}
                                className="flex items-center w-full px-4 py-2 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <CreditCard size={16} className="mr-2" />
                                Record Payment
                              </Link>
                            )}
                            <button
                              onClick={() => {
                                setActiveActionMenu(null);
                                handleDownloadInvoice(bill);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                            >
                              <Download
                                size={16}
                                className="mr-2 text-green-500"
                              />
                              Download
                            </button>
                            <Link
                              href={`/billing/edit/${bill.id}`}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Edit size={16} className="mr-2 text-amber-500" />
                              Edit
                            </Link>
                            <button 
                              className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                              onClick={() => handleDelete(bill.id)}
                            >
                              <Trash size={16} className="mr-2" />
                              Delete
                            </button>
                            <button
                              className="flex items-center w-full px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                              onClick={() => {
                                setActiveActionMenu(null);
                                handleOpenWhatsApp(bill);
                              }}
                            >
                              <FaWhatsapp size={16} className="mr-2" />
                              WhatsApp
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    No bills found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center text-gray-600 dark:text-gray-400 text-sm gap-3">
        <div>
          Showing {filteredBills.length} of {bills.length} entries
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 md:px-4 md:py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">
            Previous
          </button>
          <button className="px-3 py-1.5 md:px-4 md:py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">
            Next
          </button>
        </div>
      </div>

    </motion.div>
  );
}
