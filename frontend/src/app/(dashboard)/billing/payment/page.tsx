"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Mic,
  MicOff,
  Globe,
  CheckCircle,
  AlertCircle,
  FileText,
  Truck,
  Search,
  X,
} from "lucide-react";
import { customerService } from "@/services/customer.service";
import { vendorService } from "@/services/vendor.service";
import { billingService } from "@/services/billing.service";
import { financeService } from "@/services/finance.service";
import { formatShortId } from "@/utils/format";

export default function RecordPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mode: "in" (Payment In / Receipt) or "out" (Payment Out / Payout)
  // Default is "in"
  const [voucherType, setVoucherType] = useState<"in" | "out">("in");

  // Company Name
  const [companyName, setCompanyName] = useState("Shiv Creation");

  // Party Selection
  const [selectedParty, setSelectedParty] = useState<any>(null);
  const [partySearchQuery, setPartySearchQuery] = useState("");
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);

  // Depositor Name (Payment In only)
  const [depositorName, setDepositorName] = useState("");

  // Voucher Date
  const [voucherDate, setVoucherDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Linked Source: "on_account" | "invoice" | "challan"
  const [linkedSourceType, setLinkedSourceType] = useState<"on_account" | "invoice" | "challan">("on_account");
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);

  // Searchable Invoice State
  const [invoiceSearchText, setInvoiceSearchText] = useState("");
  const [showInvoiceDropdown, setShowInvoiceDropdown] = useState(false);
  const [selectedBillId, setSelectedBillId] = useState("");

  // Searchable Challan State
  const [challanSearchText, setChallanSearchText] = useState("");
  const [showChallanDropdown, setShowChallanDropdown] = useState(false);
  const [selectedChallanId, setSelectedChallanId] = useState("");

  // Target Outstanding Due of the selected document
  const [selectedTargetDue, setSelectedTargetDue] = useState<number>(0);

  // Amounts
  const [amount, setAmount] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");

  // Payment Mode & Bank/Ref
  const [paymentMode, setPaymentMode] = useState("Bank Transfer");
  const [refUtrNo, setRefUtrNo] = useState("");
  const [bankDetails, setBankDetails] = useState("");

  // Remarks / Notes & Speech
  const [remarks, setRemarks] = useState("");
  const [notesLanguage, setNotesLanguage] = useState<"English" | "Gujarati">("English");
  const [isListening, setIsListening] = useState(false);

  // Data lists
  const [customers, setCustomers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const partyRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLDivElement>(null);
  const invoiceBoxRef = useRef<HTMLDivElement>(null);
  const challanBoxRef = useRef<HTMLDivElement>(null);

  // Read URL query params on mount
  useEffect(() => {
    const typeParam = searchParams.get("type");
    if (typeParam === "out") {
      setVoucherType("out");
    } else {
      setVoucherType("in");
    }

    try {
      const storedOrg = localStorage.getItem("organizationName");
      if (storedOrg) setCompanyName(storedOrg);
    } catch {
      // Ignore
    }
  }, [searchParams]);

  // Fetch parties and bills
  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      customerService.getCustomers(),
      vendorService.getVendors(),
      billingService.getBills({ limit: 300 }),
    ])
      .then(([custRes, vendRes, billsRes]) => {
        if (custRes.status === "fulfilled" && custRes.value?.customers) {
          setCustomers(custRes.value.customers);
        }
        if (vendRes.status === "fulfilled" && vendRes.value?.vendors) {
          setVendors(vendRes.value.vendors);
        }
        if (billsRes.status === "fulfilled" && billsRes.value?.bills) {
          const allBills = billsRes.value.bills;
          setBills(allBills);

          // If a billId was passed in query params, pre-select it
          const billIdParam = searchParams.get("billId");
          if (billIdParam) {
            const targetBill = allBills.find(
              (b: any) => (b.rawId || b.id) === billIdParam
            );
            if (targetBill) {
              const remaining =
                targetBill.amountRemaining !== undefined && Number(targetBill.amountRemaining) > 0
                  ? Number(targetBill.amountRemaining)
                  : Number(targetBill.total || 0);
              const bNumber = targetBill.challanNo || targetBill.billNumber || formatShortId(targetBill.id, "INV");
              const actualId = targetBill.rawId || targetBill.id;
              setSelectedBillId(actualId);
              setSelectedChallanId(actualId);
              setSelectedTargetDue(remaining);
              setInvoiceSearchText(`${bNumber} • ${targetBill.party || targetBill.customerName} (₹${remaining.toFixed(2)})`);
              setLinkedSourceType("invoice");
              setPartySearchQuery(targetBill.party || targetBill.customerName || "");
              setAmount(remaining ? remaining.toFixed(2) : "");

              // Match and set party profile
              const allCustomers = custRes.status === "fulfilled" && custRes.value?.customers ? custRes.value.customers : [];
              const allVendors = vendRes.status === "fulfilled" && vendRes.value?.vendors ? vendRes.value.vendors : [];
              const matched = [...allCustomers, ...allVendors].find(
                (p: any) => p.id === targetBill.customerId || p.name === (targetBill.party || targetBill.customerName)
              );
              if (matched) {
                setSelectedParty(matched);
              }
            }
          }
        }
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  // Click outside listener for all dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (partyRef.current && !partyRef.current.contains(event.target as Node)) {
        setShowPartyDropdown(false);
      }
      if (sourceRef.current && !sourceRef.current.contains(event.target as Node)) {
        setShowSourceDropdown(false);
      }
      if (invoiceBoxRef.current && !invoiceBoxRef.current.contains(event.target as Node)) {
        setShowInvoiceDropdown(false);
      }
      if (challanBoxRef.current && !challanBoxRef.current.contains(event.target as Node)) {
        setShowChallanDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Switch voucher type (Payment In vs Payment Out)
  const handleSwitchVoucherType = (type: "in" | "out") => {
    setVoucherType(type);
    setSelectedParty(null);
    setPartySearchQuery("");
    setSelectedBillId("");
    setInvoiceSearchText("");
    setSelectedChallanId("");
    setChallanSearchText("");
    setSelectedTargetDue(0);
    setLinkedSourceType("on_account");
    setShowSourceDropdown(false);
    setAmount("");
    setDiscountAmount("");
    setErrorMessage("");
  };

  // Filtered party list
  const filteredParties = useMemo(() => {
    const query = partySearchQuery.toLowerCase().trim();
    const sourceList = voucherType === "out" ? vendors : customers;

    if (!query) return sourceList.slice(0, 30);

    return sourceList.filter((p) => {
      const name = (p.name || p.companyName || p.displayName || "").toLowerCase();
      const phone = (p.mobile || p.phone || "").toLowerCase();
      return name.includes(query) || phone.includes(query);
    });
  }, [voucherType, vendors, customers, partySearchQuery]);

  // Party Invoices (STRICTLY UNPAID & REMAINING > 0 - Paid bills never appear)
  const partyInvoices = useMemo(() => {
    const isSupplier = voucherType === "out";
    const partyName = (selectedParty?.name || partySearchQuery).toLowerCase().trim();
    const partyId = selectedParty?.id;

    return bills.filter((b) => {
      const bParty = (b.party || "").toLowerCase().trim();
      const bPartyId = b.customerId || b.vendorId;
      const matchParty = partyName
        ? bParty === partyName || bParty.includes(partyName) || (partyId && bPartyId === partyId)
        : true;

      const isInvoice = b.documentType !== "challan";
      const isTypeMatch = isSupplier ? b.billType === "purchase" : b.billType !== "purchase";

      const statusLower = (b.status || b.paymentStatus || "").toLowerCase();
      const isPaid = statusLower === "paid";
      const remaining =
        b.amountRemaining !== undefined && b.amountRemaining !== null
          ? Number(b.amountRemaining)
          : Number(b.total || 0);

      // Exclude completely paid bills or bills with 0 balance
      return matchParty && isInvoice && isTypeMatch && !isPaid && remaining > 0.01;
    });
  }, [bills, selectedParty, partySearchQuery, voucherType]);

  // Party Delivery Challans (STRICTLY UNPAID & UNINVOICED & REMAINING > 0)
  const partyChallans = useMemo(() => {
    const isSupplier = voucherType === "out";
    const partyName = (selectedParty?.name || partySearchQuery).toLowerCase().trim();
    const partyId = selectedParty?.id;

    return bills.filter((b) => {
      const bParty = (b.party || b.customerName || "").toLowerCase().trim();
      const bPartyId = b.customerId || b.vendorId;
      const matchParty = partyName
        ? bParty === partyName || bParty.includes(partyName) || (partyId && bPartyId === partyId)
        : true;

      // Must strictly be an un-invoiced delivery challan
      const isChallan = b.documentType === "challan" && !b.convertedInvoiceId;
      const isTypeMatch = isSupplier ? b.billType === "purchase" : b.billType !== "purchase";

      const statusLower = (b.status || b.paymentStatus || "").toLowerCase();
      const isPaid = statusLower === "paid";
      const remaining =
        b.amountRemaining !== undefined && b.amountRemaining !== null
          ? Number(b.amountRemaining)
          : Number(b.total || 0);

      return matchParty && isChallan && isTypeMatch && !isPaid && remaining > 0.01;
    });
  }, [bills, selectedParty, partySearchQuery, voucherType]);

  // Total outstanding due of the currently selected / typed party (Strictly from real unpaid Invoices)
  const totalPartyDue = useMemo(() => {
    return partyInvoices.reduce((sum, inv) => {
      const rem =
        inv.amountRemaining !== undefined && inv.amountRemaining !== null
          ? Number(inv.amountRemaining)
          : Number(inv.total || 0);
      return sum + rem;
    }, 0);
  }, [partyInvoices]);

  // Search filtered invoices
  const filteredInvoices = useMemo(() => {
    if (!invoiceSearchText.trim()) return partyInvoices;
    const q = invoiceSearchText.toLowerCase().trim();
    return partyInvoices.filter((inv) => {
      const billNo = (inv.challanNo || "").toLowerCase();
      const shortId = formatShortId(inv.id, "INV").toLowerCase();
      const rawId = (inv.rawId || inv.id || "").toLowerCase();
      const party = (inv.party || "").toLowerCase();
      return billNo.includes(q) || shortId.includes(q) || rawId.includes(q) || party.includes(q);
    });
  }, [partyInvoices, invoiceSearchText]);

  // Search filtered challans
  const filteredChallans = useMemo(() => {
    if (!challanSearchText.trim()) return partyChallans;
    const q = challanSearchText.toLowerCase().trim();
    return partyChallans.filter((ch) => {
      const chNo = (ch.challanNo || "").toLowerCase();
      const shortId = formatShortId(ch.id, "DC").toLowerCase();
      const rawId = (ch.rawId || ch.id || "").toLowerCase();
      const party = (ch.party || "").toLowerCase();
      return chNo.includes(q) || shortId.includes(q) || rawId.includes(q) || party.includes(q);
    });
  }, [partyChallans, challanSearchText]);

  // Handle invoice selection
  const handleSelectInvoice = (inv: any) => {
    const id = inv.rawId || inv.id;
    const rem = Number(inv.amountRemaining !== undefined && inv.amountRemaining > 0 ? inv.amountRemaining : inv.total || 0);
    const billNumber = inv.challanNo || formatShortId(inv.id, "INV");

    setSelectedBillId(id);
    setSelectedTargetDue(rem);
    setInvoiceSearchText(`${billNumber} • ${inv.party} (₹${rem.toLocaleString()})`);
    setAmount(rem ? rem.toString() : "");
    setDiscountAmount("");
    setShowInvoiceDropdown(false);

    if (!partySearchQuery) {
      setPartySearchQuery(inv.party);
    }
  };

  // Handle challan selection
  const handleSelectChallan = (ch: any) => {
    const id = ch.rawId || ch.id;
    const rem = Number(ch.amountRemaining !== undefined && ch.amountRemaining > 0 ? ch.amountRemaining : ch.total || 0);
    const chNumber = ch.challanNo || formatShortId(ch.id, "DC");

    setSelectedChallanId(id);
    setSelectedTargetDue(rem);
    setChallanSearchText(`${chNumber} • ${ch.party} (₹${rem.toLocaleString()})`);
    setAmount(rem ? rem.toString() : "");
    setDiscountAmount("");
    setShowChallanDropdown(false);

    if (!partySearchQuery) {
      setPartySearchQuery(ch.party);
    }
  };

  // Handle Discount change with smart auto-balance against bill
  const handleDiscountChange = (val: string) => {
    setDiscountAmount(val);
    const discountVal = parseFloat(val) || 0;
    if (selectedTargetDue > 0) {
      const remainingPayable = Math.max(0, selectedTargetDue - discountVal);
      setAmount(remainingPayable > 0 ? remainingPayable.toString() : "0");
    }
  };

  // Total Settled (for Out) or Total Credit (for In)
  const numericAmount = parseFloat(amount) || 0;
  const numericDiscount = linkedSourceType !== "on_account" ? (parseFloat(discountAmount) || 0) : 0;
  const totalSettled = (numericAmount + numericDiscount).toFixed(2);

  // Speech to Text handler
  const handleToggleSpeech = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = notesLanguage === "Gujarati" ? "gu-IN" : "en-IN";

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setRemarks((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  // Submit Handler
  const handleSubmitVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!partySearchQuery.trim()) {
      setErrorMessage(
        voucherType === "out"
          ? "Please select or enter Supplier / Party name."
          : "Please select or enter Customer / Party name."
      );
      return;
    }

    if (numericAmount <= 0 && numericDiscount <= 0) {
      setErrorMessage("Please enter a valid payment amount greater than ₹0.");
      return;
    }

    try {
      setSubmitting(true);

      const partyName = partySearchQuery.trim();
      const partyId = selectedParty?.id;
      const totalAmountToClear = parseFloat(totalSettled);

      // 1. If linked to a specific bill/challan, record against it
      const activeLinkedId = selectedBillId || selectedChallanId || (searchParams.get("billId") ?? "");

      if (activeLinkedId) {
        // Record total settled against the bill so the bill's outstanding becomes 0 in ledger
        await billingService.recordPayment(activeLinkedId, {
          amount: totalAmountToClear,
          paymentDate: voucherDate,
          paymentMethod: paymentMode,
          notes: numericDiscount > 0
            ? `Net Received: ₹${numericAmount.toFixed(2)} | Discount: ₹${numericDiscount.toFixed(2)}${remarks ? ` | Notes: ${remarks}` : ""}`
            : remarks,
          referenceNumber: refUtrNo,
          bankDetails: bankDetails,
        });
      } else if (voucherType === "in" && partyId) {
        // ON-ACCOUNT / GENERAL PAYMENT (Khata Pete / Lumpsum Entry)
        await billingService.recordCustomerPayment({
          customerId: partyId,
          amount: numericAmount,
          paymentDate: voucherDate,
          paymentMethod: paymentMode,
          notes: remarks ? remarks : "On-Account Lumpsum Payment",
          referenceNumber: refUtrNo,
          depositorName: depositorName,
        });
      }

      // 2. Record in Finance Ledger/Payments table
      await financeService.createPayment({
        type: voucherType === "in" ? "in" : "out",
        partyType: voucherType === "in" ? "customer" : "vendor",
        partyId: partyId,
        partyName: partyName,
        amount: totalAmountToClear,
        paymentDate: voucherDate,
        paymentMode: paymentMode,
        referenceNumber: refUtrNo,
        billId: activeLinkedId || undefined,
        notes: [
          linkedSourceType === "on_account" ? "ON-ACCOUNT / GENERAL PAYMENT" : null,
          depositorName ? `Depositor: ${depositorName}` : null,
          numericDiscount > 0 ? `Net Paid/Received: ₹${numericAmount.toFixed(2)} | Discount: ₹${numericDiscount.toFixed(2)}` : null,
          bankDetails ? `Bank: ${bankDetails}` : null,
          remarks ? `Notes: ${remarks}` : null,
        ]
          .filter(Boolean)
          .join(" | "),
      });

      setSuccessMessage(
        voucherType === "in"
          ? "Payment In recorded successfully! Redirecting..."
          : "Payment Out recorded successfully! Redirecting..."
      );
      setTimeout(() => {
        router.push("/billing");
      }, 1000);
    } catch (err: any) {
      console.error("Error recording payment voucher:", err);
      setErrorMessage(
        err.response?.data?.message || err.message || "Failed to record payment voucher. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Labels for dropdown options
  const invoiceLabel = voucherType === "in" ? "Against Sales Invoice" : "Against Purchase Invoice";
  const challanLabel = voucherType === "in" ? "Sales Delivery Challan (DN)" : "Purchase Delivery Challan (GRN)";

  return (
    <div className="w-full space-y-4 pb-12">
      {/* Notifications */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2.5 shadow-sm"
        >
          <CheckCircle size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successMessage}</span>
        </motion.div>
      )}

      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-sm flex items-center gap-2.5 shadow-sm"
        >
          <AlertCircle size={18} className="shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{errorMessage}</span>
        </motion.div>
      )}

      {/* Main Form Card - Full Width */}
      <div className="glass-card rounded-xl p-6 sm:p-9 border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-[#202936]">
        <form onSubmit={handleSubmitVoucher} className="space-y-6">
          {/* Row 1: Voucher Type* - Option 1: Payment In, Option 2: Payment Out */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-6 items-center">
            <div className="md:col-span-3">
              <label className="text-sm font-semibold text-blue-600 dark:text-blue-400 font-['Plus_Jakarta_Sans']">
                Voucher Type*
              </label>
            </div>
            <div className="md:col-span-9 flex items-center gap-3">
              {/* Option 1: Payment In */}
              <button
                type="button"
                onClick={() => handleSwitchVoucherType("in")}
                className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  voucherType === "in"
                    ? "bg-blue-50/80 dark:bg-blue-950/30 border-2 border-blue-400 text-blue-600 dark:text-blue-300 shadow-xs"
                    : "bg-white dark:bg-[#1a222c] border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50"
                }`}
              >
                <ArrowDownLeft size={16} className="text-blue-600 dark:text-blue-400" />
                <span>Payment In</span>
                {voucherType === "in" && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
              </button>

              {/* Option 2: Payment Out */}
              <button
                type="button"
                onClick={() => handleSwitchVoucherType("out")}
                className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  voucherType === "out"
                    ? "bg-rose-50/80 dark:bg-rose-950/30 border-2 border-rose-400 text-rose-600 dark:text-rose-300 shadow-xs"
                    : "bg-white dark:bg-[#1a222c] border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50"
                }`}
              >
                <ArrowUpRight size={16} className="text-rose-600 dark:text-rose-400" />
                <span>Payment Out</span>
                {voucherType === "out" && <span className="w-2 h-2 rounded-full bg-rose-500"></span>}
              </button>
            </div>
          </div>


          {/* Row 2: Receiving Company / Account* or Paying Company* */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-6 items-center">
            <div className="md:col-span-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                {voucherType === "in" ? "Receiving Company / Account*" : "Paying Company*"}
              </label>
            </div>
            <div className="md:col-span-9">
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50/80 dark:bg-[#1a222c] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Company Name"
              />
            </div>
          </div>


          {/* Row 3: Party / Customer Name* or Party / Supplier Name* */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-6 items-center" ref={partyRef}>
            <div className="md:col-span-3">
              <label className="text-sm font-semibold text-blue-600 dark:text-blue-400 font-['Plus_Jakarta_Sans']">
                {voucherType === "in" ? "Party / Customer Name*" : "Party / Supplier Name*"}
              </label>
            </div>
            <div className="md:col-span-9 relative">
              <div className="relative">
                <input
                  type="text"
                  required
                  value={partySearchQuery}
                  onFocus={() => setShowPartyDropdown(true)}
                  onChange={(e) => {
                    setPartySearchQuery(e.target.value);
                    setShowPartyDropdown(true);
                  }}
                  placeholder={
                    voucherType === "in"
                      ? "Search or select party name..."
                      : "Type party / supplier name..."
                  }
                  className="w-full px-4 py-2.5 pr-10 bg-white dark:bg-[#1a222c] border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPartyDropdown((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                >
                  <ChevronDown size={17} />
                </button>
              </div>

              {/* Autocomplete Dropdown */}
              {showPartyDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-40 max-h-60 overflow-y-auto bg-white dark:bg-[#1e2634] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-1 divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredParties.length > 0 ? (
                    filteredParties.map((p) => {
                      const name = p.name || p.companyName || p.displayName;
                      const phone = p.mobile || p.phone || "";
                      const due = Number(p.totalOutstanding) || 0;
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedParty(p);
                            setPartySearchQuery(name);
                            setShowPartyDropdown(false);
                            if (due > 0 && linkedSourceType === "on_account" && !amount) {
                              setAmount(due.toFixed(2));
                            }
                          }}
                          className="px-4 py-2.5 text-xs cursor-pointer flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                        >
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white text-sm">
                              {name}
                            </div>
                            {phone && (
                              <div className="text-[11px] text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                                {phone}
                              </div>
                            )}
                          </div>
                          {due > 0 && (
                            <div className="text-right">
                              <span className="text-[11px] text-gray-400 block">Pending Due</span>
                              <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-xs">
                                ₹{due.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-4 py-3 text-center text-xs text-gray-400">
                      No matching parties found. You can type freely.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Balance Strip (Party Account Summary) */}
          {(selectedParty || (partySearchQuery.trim().length > 1 && (partyInvoices.length > 0 || partyChallans.length > 0 || totalPartyDue > 0))) && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-6 items-center"
            >
              <div className="md:col-span-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 font-['Plus_Jakarta_Sans']">
                  Party Account Summary
                </span>
              </div>
              <div className="md:col-span-9">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50/70 via-slate-50/50 to-white dark:from-[#1e2634] dark:via-[#1e2634]/90 dark:to-[#171f2b] border border-blue-200/70 dark:border-gray-700/80 shadow-xs">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 text-xs">
                    {/* Left: Party Info */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-xs uppercase shadow-xs shrink-0">
                        {(selectedParty?.name || partySearchQuery).charAt(0) || "P"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                            {selectedParty?.name || partySearchQuery}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                            {voucherType === "in" ? "Customer" : "Supplier"}
                          </span>
                        </div>
                        {(selectedParty?.mobile || selectedParty?.phone) && (
                          <span className="text-[11px] text-gray-500 dark:text-gray-400 font-mono block">
                            {selectedParty.mobile || selectedParty.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: The 4 Metrics all in the same line */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-6 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-200/60 dark:border-gray-700/60 items-center">
                      {/* 1. Total Outstanding Due */}
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block text-[11px] leading-tight">
                          Total Outstanding Due
                        </span>
                        <span className={`font-mono font-bold text-sm ${
                          totalPartyDue > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                        }`}>
                          ₹{totalPartyDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* 2. Unpaid Bills Count */}
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block text-[11px] leading-tight">
                          Unpaid Bills
                        </span>
                        <span className="font-mono font-bold text-gray-900 dark:text-white text-sm">
                          {partyInvoices.length} {partyInvoices.length === 1 ? "Bill" : "Bills"}
                        </span>
                      </div>

                      {/* 3. Credit Limit */}
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block text-[11px] leading-tight">
                          Credit Limit
                        </span>
                        <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">
                          {Number(selectedParty?.creditLimit) > 0 ? `₹${Number(selectedParty.creditLimit).toLocaleString()}` : "Unlimited"}
                        </span>
                      </div>

                      {/* 4. Status */}
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block text-[11px] leading-tight">
                          Account Status
                        </span>
                        <span className={`inline-flex items-center gap-1 font-semibold ${
                          totalPartyDue > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                        }`}>
                          {totalPartyDue > 0 ? "⚠️ Payment Due" : "✅ All Clear"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Row 4: Payer / Depositor Name (Shown only in Payment In) */}
          {voucherType === "in" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-6 items-center">
              <div className="md:col-span-3">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                  Payer / Depositor Name
                </label>
              </div>
              <div className="md:col-span-9">
                <input
                  type="text"
                  value={depositorName}
                  onChange={(e) => setDepositorName(e.target.value)}
                  placeholder="e.g. UMESH, RAVI, SAILESH P"
                  className="w-full px-4 py-2.5 bg-white dark:bg-[#1a222c] border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-gray-400"
                />
              </div>
            </div>
          )}

          {/* Row 5: Voucher Date* */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-6 items-center">
            <div className="md:col-span-3">
              <label className="text-sm font-semibold text-rose-500 font-['Plus_Jakarta_Sans']">
                Voucher Date*
              </label>
            </div>
            <div className="md:col-span-9 relative">
              <input
                type="date"
                required
                value={voucherDate}
                onChange={(e) => setVoucherDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-[#1a222c] border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>


          {/* Row 6: Linked Source */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-6 items-start" ref={sourceRef}>
            <div className="md:col-span-3 pt-2.5">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                Linked Source
              </label>
            </div>
            <div className="md:col-span-9 space-y-3 relative">
              {/* Custom Dropdown Trigger */}
              <div
                onClick={() => setShowSourceDropdown((prev) => !prev)}
                className={`w-full px-4 py-2.5 bg-white dark:bg-[#1a222c] border rounded-xl text-sm font-semibold flex items-center justify-between cursor-pointer transition-all ${
                  showSourceDropdown
                    ? "border-blue-500 ring-2 ring-blue-500/20 text-gray-900 dark:text-white"
                    : "border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="uppercase">
                  {linkedSourceType === "on_account"
                    ? "ON-ACCOUNT / GENERAL PAYMENT"
                    : linkedSourceType === "invoice"
                    ? invoiceLabel
                    : challanLabel}
                </span>
                {showSourceDropdown ? (
                  <ChevronUp size={17} className="text-blue-500" />
                ) : (
                  <ChevronDown size={17} className="text-gray-400" />
                )}
              </div>

              {/* Dropdown Menu Options matching Image 2 */}
              {showSourceDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white dark:bg-[#1e2634] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden py-1">
                  {/* Option 1: ON-ACCOUNT / GENERAL PAYMENT (Lumpsum) */}
                  <div
                    onClick={() => {
                      setLinkedSourceType("on_account");
                      setSelectedBillId("");
                      setInvoiceSearchText("");
                      setSelectedChallanId("");
                      setChallanSearchText("");
                      setSelectedTargetDue(0);
                      setDiscountAmount("");
                      setShowSourceDropdown(false);
                    }}
                    className={`px-4 py-3 text-sm cursor-pointer flex items-center justify-between transition-colors ${
                      linkedSourceType === "on_account"
                        ? "bg-blue-50/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/60 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <span className="uppercase font-semibold">ON-ACCOUNT / GENERAL PAYMENT</span>
                    {linkedSourceType === "on_account" && <Check size={16} className="text-blue-600" />}
                  </div>

                  {/* Option 2: Against Sales Invoice */}
                  <div
                    onClick={() => {
                      setLinkedSourceType("invoice");
                      setSelectedChallanId("");
                      setChallanSearchText("");
                      setSelectedTargetDue(0);
                      setAmount("");
                      setDiscountAmount("");
                      setShowSourceDropdown(false);
                      setShowInvoiceDropdown(true);
                    }}
                    className={`px-4 py-3 text-sm cursor-pointer flex items-center justify-between transition-colors ${
                      linkedSourceType === "invoice"
                        ? "bg-blue-50/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/60 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <span>{invoiceLabel}</span>
                    {linkedSourceType === "invoice" && <Check size={16} className="text-blue-600" />}
                  </div>

                  {/* Option 3: Sales Delivery Challan (DN) */}
                  <div
                    onClick={() => {
                      setLinkedSourceType("challan");
                      setSelectedBillId("");
                      setInvoiceSearchText("");
                      setSelectedTargetDue(0);
                      setAmount("");
                      setDiscountAmount("");
                      setShowSourceDropdown(false);
                      setShowChallanDropdown(true);
                    }}
                    className={`px-4 py-3 text-sm cursor-pointer flex items-center justify-between transition-colors ${
                      linkedSourceType === "challan"
                        ? "bg-blue-50/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/60 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <span>{challanLabel}</span>
                    {linkedSourceType === "challan" && <Check size={16} className="text-blue-600" />}
                  </div>
                </div>
              )}

              {/* Searchable Combobox if "Against Sales Invoice" is chosen */}
              {linkedSourceType === "invoice" && (
                <motion.div
                  ref={invoiceBoxRef}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 space-y-2.5 relative"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-blue-800 dark:text-blue-300">
                    <span className="flex items-center gap-1.5">
                      <FileText size={14} />
                      <span>Select / Search Pending Invoice:</span>
                    </span>
                    <span className="font-mono">{partyInvoices.length} Available</span>
                  </div>

                  {/* Interactive Search Bar for Invoices */}
                  <div className="relative">
                    <div className="relative">
                      <Search
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="text"
                        value={invoiceSearchText}
                        onFocus={() => setShowInvoiceDropdown(true)}
                        onChange={(e) => {
                          setInvoiceSearchText(e.target.value);
                          setShowInvoiceDropdown(true);
                        }}
                        placeholder="Search invoice number, party, or amount..."
                        className="w-full pl-9 pr-9 py-2 bg-white dark:bg-[#1a222c] border border-blue-300 dark:border-blue-800 rounded-lg text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-gray-400"
                      />
                      {invoiceSearchText && (
                        <button
                          type="button"
                          onClick={() => {
                            setInvoiceSearchText("");
                            setSelectedBillId("");
                            setSelectedTargetDue(0);
                            setAmount("");
                            setDiscountAmount("");
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>

                    {/* Autocomplete Dropdown - STRICTLY UNPAID */}
                    {showInvoiceDropdown && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 z-40 max-h-56 overflow-y-auto bg-white dark:bg-[#1e2634] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-1 divide-y divide-gray-100 dark:divide-gray-800">
                        {filteredInvoices.length > 0 ? (
                          filteredInvoices.map((inv) => {
                            const rem = Number(inv.amountRemaining !== undefined && inv.amountRemaining > 0 ? inv.amountRemaining : inv.total || 0);
                            const billNumber = inv.challanNo || formatShortId(inv.id, "INV");
                            const isSelected = (inv.rawId || inv.id) === selectedBillId;
                            return (
                              <div
                                key={inv.rawId || inv.id}
                                onClick={() => handleSelectInvoice(inv)}
                                className={`px-4 py-2.5 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                                  isSelected
                                    ? "bg-blue-50/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold"
                                    : "hover:bg-gray-50 dark:hover:bg-gray-800/60 text-gray-700 dark:text-gray-300"
                                }`}
                              >
                                <div>
                                  <div className="font-mono font-bold text-gray-900 dark:text-white text-sm">
                                    {billNumber}
                                  </div>
                                  <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                                    {inv.party} {inv.date ? `• ${inv.date}` : ""}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-gray-400 block">Pending Due</span>
                                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-xs">
                                    ₹{rem.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="px-4 py-3 text-center text-xs text-gray-400">
                            {partyInvoices.length === 0
                              ? "No unpaid invoices found for this party."
                              : "No matching pending invoices found."}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {selectedTargetDue > 0 && (
                    <div className="flex items-center justify-between pt-1 text-xs font-semibold text-gray-700 dark:text-gray-300 border-t border-blue-200/60 dark:border-blue-900/40">
                      <span>Total Invoice Due:</span>
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                        ₹{selectedTargetDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Searchable Combobox if "Sales Delivery Challan (DN)" is chosen */}
              {linkedSourceType === "challan" && (
                <motion.div
                  ref={challanBoxRef}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-2.5 relative"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-indigo-800 dark:text-indigo-300">
                    <span className="flex items-center gap-1.5">
                      <Truck size={14} />
                      <span>Select / Search Delivery Challan (DN):</span>
                    </span>
                    <span className="font-mono">{partyChallans.length} Available</span>
                  </div>

                  {/* Interactive Search Bar for Challans */}
                  <div className="relative">
                    <div className="relative">
                      <Search
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="text"
                        value={challanSearchText}
                        onFocus={() => setShowChallanDropdown(true)}
                        onChange={(e) => {
                          setChallanSearchText(e.target.value);
                          setShowChallanDropdown(true);
                        }}
                        placeholder="Search challan number, party, or amount..."
                        className="w-full pl-9 pr-9 py-2 bg-white dark:bg-[#1a222c] border border-indigo-300 dark:border-indigo-800 rounded-lg text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-gray-400"
                      />
                      {challanSearchText && (
                        <button
                          type="button"
                          onClick={() => {
                            setChallanSearchText("");
                            setSelectedChallanId("");
                            setSelectedTargetDue(0);
                            setAmount("");
                            setDiscountAmount("");
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>

                    {/* Autocomplete Dropdown - STRICTLY UNPAID */}
                    {showChallanDropdown && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 z-40 max-h-56 overflow-y-auto bg-white dark:bg-[#1e2634] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-1 divide-y divide-gray-100 dark:divide-gray-800">
                        {filteredChallans.length > 0 ? (
                          filteredChallans.map((ch) => {
                            const rem = Number(ch.amountRemaining !== undefined && ch.amountRemaining > 0 ? ch.amountRemaining : ch.total || 0);
                            const chNumber = ch.challanNo || formatShortId(ch.id, "DC");
                            const isSelected = (ch.rawId || ch.id) === selectedChallanId;
                            return (
                              <div
                                key={ch.rawId || ch.id}
                                onClick={() => handleSelectChallan(ch)}
                                className={`px-4 py-2.5 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                                  isSelected
                                    ? "bg-indigo-50/80 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold"
                                    : "hover:bg-gray-50 dark:hover:bg-gray-800/60 text-gray-700 dark:text-gray-300"
                                }`}
                              >
                                <div>
                                  <div className="font-mono font-bold text-gray-900 dark:text-white text-sm">
                                    {chNumber}
                                  </div>
                                  <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                                    {ch.party} {ch.date ? `• ${ch.date}` : ""}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-gray-400 block">Pending Due</span>
                                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-xs">
                                    ₹{rem.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="px-4 py-3 text-center text-xs text-gray-400">
                            {partyChallans.length === 0
                              ? "No unpaid challans found for this party."
                              : "No matching delivery challans found."}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {selectedTargetDue > 0 && (
                    <div className="flex items-center justify-between pt-1 text-xs font-semibold text-gray-700 dark:text-gray-300 border-t border-indigo-200/60 dark:border-indigo-900/40">
                      <span>Total Challan Due:</span>
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                        ₹{selectedTargetDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>


          {/* Row 7: Amount Section (Received/Paid Amount & Conditional Discount) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-6 items-start">
            <div className="md:col-span-3 pt-2.5">
              <label className="text-sm font-semibold text-blue-600 dark:text-blue-400 font-['Plus_Jakarta_Sans']">
                {voucherType === "in" ? "Amount Received (₹)*" : "Amount Paid (₹)*"}
              </label>
            </div>
            <div className="md:col-span-9 space-y-3">
              {/* If Linked to Bill/Challan: Show Received Amount + Discount side by side */}
              {linkedSourceType !== "on_account" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Received / Paid Amount */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      {voucherType === "in" ? "Received Amount (₹)*" : "Paid Amount (₹)*"}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white dark:bg-[#1a222c] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  {/* Discount (Only shown when paying against a bill/challan) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                        Discount (₹)
                      </label>
                      {selectedTargetDue > 0 && numericAmount > 0 && numericAmount < selectedTargetDue && (
                        <button
                          type="button"
                          onClick={() => handleDiscountChange((selectedTargetDue - numericAmount).toFixed(2))}
                          className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium"
                        >
                          Auto-fill Difference (₹{(selectedTargetDue - numericAmount).toFixed(2)})
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={discountAmount}
                      onChange={(e) => handleDiscountChange(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white dark:bg-[#1a222c] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              ) : (
                /* Pure Lumpsum / On-Account Mode: Single Full-width Amount Input */
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    {voucherType === "in" ? "Lumpsum Received Amount (₹)*" : "Lumpsum Paid Amount (₹)*"}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-mono font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 bg-white dark:bg-[#1a222c] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              )}

              {/* Summary Strip */}
              <div
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm ${
                  voucherType === "in"
                    ? "bg-blue-50/70 dark:bg-blue-950/20 border-blue-200/70 dark:border-blue-900/40 text-blue-700 dark:text-blue-400"
                    : "bg-rose-50/70 dark:bg-rose-950/20 border-rose-200/70 dark:border-rose-900/40 text-rose-700 dark:text-rose-400"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {voucherType === "in"
                      ? linkedSourceType === "on_account"
                        ? "Total Credit to Party Account:"
                        : "Total Settled / Credited to Invoice:"
                      : linkedSourceType === "on_account"
                      ? "Total Debit to Supplier Account:"
                      : "Total Settled / Debited to Invoice:"}
                  </span>
                  {linkedSourceType !== "on_account" && numericDiscount > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                      (₹{numericAmount.toFixed(2)} + ₹{numericDiscount.toFixed(2)} discount)
                    </span>
                  )}
                </div>
                <span className="font-mono font-bold text-base">
                  ₹{Number(totalSettled).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>


          {/* Row 8: Payment Mode */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-6 items-center">
            <div className="md:col-span-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                Payment Mode
              </label>
            </div>
            <div className="md:col-span-9">
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-[#1a222c] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer uppercase"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI / QR Code">UPI / QR Code</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="Net Banking">Net Banking</option>
              </select>
            </div>
          </div>


          {/* Row 9: Ref / UTR No */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-6 items-center">
            <div className="md:col-span-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                Ref / UTR No
              </label>
            </div>
            <div className="md:col-span-9">
              <input
                type="text"
                value={refUtrNo}
                onChange={(e) => setRefUtrNo(e.target.value)}
                placeholder="e.g. UTR12345678"
                className="w-full px-4 py-2.5 bg-white dark:bg-[#1a222c] border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-gray-400"
              />
            </div>
          </div>


          {/* Row 10: Bank Details / Account */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-6 items-center">
            <div className="md:col-span-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                Bank Details / Account
              </label>
            </div>
            <div className="md:col-span-9">
              <input
                type="text"
                value={bankDetails}
                onChange={(e) => setBankDetails(e.target.value)}
                placeholder="e.g. HDFC Bank Main A/c / Cash In Hand"
                className="w-full px-4 py-2.5 bg-white dark:bg-[#1a222c] border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-gray-400"
              />
            </div>
          </div>


          {/* Row 11: Remarks / Notes */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-6 items-start">
            <div className="md:col-span-3 pt-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                Remarks / Notes
              </label>
            </div>
            <div className="md:col-span-9 space-y-2">
              {/* Language & Mic Toolbar */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 font-medium">Notes / Remarks</span>
                <div className="flex items-center gap-2">
                  {/* Language Selector */}
                  <button
                    type="button"
                    onClick={() =>
                      setNotesLanguage((prev) => (prev === "English" ? "Gujarati" : "English"))
                    }
                    className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center gap-1.5 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <Globe size={13} />
                    <span>{notesLanguage}</span>
                  </button>

                  {/* Speak Mic Button */}
                  <button
                    type="button"
                    onClick={handleToggleSpeech}
                    className={`px-3 py-1 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                      isListening
                        ? "bg-rose-50 border-rose-300 text-rose-600 animate-pulse"
                        : "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-100"
                    }`}
                  >
                    {isListening ? <MicOff size={13} /> : <Mic size={13} />}
                    <span>{isListening ? "Listening..." : "Speak (Mic)"}</span>
                  </button>
                </div>
              </div>

              {/* Textarea */}
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={
                  voucherType === "in"
                    ? "Add optional notes (e.g. payment received towards festival collection)..."
                    : "Add optional payment notes..."
                }
                className="w-full px-4 py-2.5 bg-white dark:bg-[#1a222c] border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-gray-400"
              />
            </div>
          </div>


          {/* Bottom Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
            <Link
              href="/billing"
              className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-semibold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Saving Voucher...</span>
                </>
              ) : (
                <>
                  <CreditCard size={16} />
                  <span>{voucherType === "in" ? "Save Payment In" : "Save Payment Out"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
