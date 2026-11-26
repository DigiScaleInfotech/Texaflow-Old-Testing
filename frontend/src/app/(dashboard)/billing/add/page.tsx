"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { billingService } from "@/services/billing.service";
import { customerService } from "@/services/customer.service";
import { inventoryService } from "@/services/inventory.service";
import { calculateDueDateString } from "@/utils/paymentTerms";
import {
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  Calendar,
  Mic,
  MicOff,
  Check,
  ChevronDown,
  X,
  Loader2,
  Globe,
  Package,
  Save,
} from "lucide-react";

interface ItemRow {
  id: string;
  productId?: string;
  category: string;
  hsnCode: string;
  item: string;
  qty: string;
  weight: string;
  kg: string;
  carton: string;
  rate: string;
  amount: number;
}

const CATEGORIES = [
  "Yarn",
  "Grey",
  "Fabric",
  "Chemical",
  "Packing Material",
  "Jobwork",
  "Accessories",
  "Other",
];

export interface GstOption {
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

export default function AddBillingPage() {
  const router = useRouter();

  const [billType, setBillType] = useState<"sales" | "purchase">("sales");
  const [documentType, setDocumentType] = useState<"invoice" | "challan">("invoice");
  const [parties, setParties] = useState<any[]>([]);
  const [filteredParties, setFilteredParties] = useState<any[]>([]);
  const [searchPartyText, setSearchPartyText] = useState("");
  const [selectedParty, setSelectedParty] = useState<any | null>(null);
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  const partyRef = useRef<HTMLDivElement>(null);

  // Specifications
  const [challanNo, setChallanNo] = useState("");
  const [billDate, setBillDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]
  );

  // Inventory products & modal state
  const [inventoryProducts, setInventoryProducts] = useState<any[]>([]);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventorySearchQuery, setInventorySearchQuery] = useState("");
  const [selectedInventoryIds, setSelectedInventoryIds] = useState<string[]>([]);

  // Active item autocomplete index
  const [activeItemSuggestIndex, setActiveItemSuggestIndex] = useState<number | null>(null);

  // Table items
  const [items, setItems] = useState<ItemRow[]>([
    {
      id: "1",
      category: "",
      hsnCode: "",
      item: "",
      qty: "",
      weight: "",
      kg: "",
      carton: "",
      rate: "",
      amount: 0,
    },
  ]);

  // Selected GST Option
  const [selectedGstOption, setSelectedGstOption] = useState<GstOption>(GST_OPTIONS[1]); // Default: CGST + SGST @ 5%
  const [customGstRateStr, setCustomGstRateStr] = useState<string>("5");
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mic speech recognition
  const [isListening, setIsListening] = useState(false);

  // Read URL query param to set bill type (defaulting to sales)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const type = params.get("type");
      if (type === "purchase") {
        setBillType("purchase");
      } else {
        setBillType("sales");
      }
    }
  }, []);

  // Auto generate sequential Invoice No starting from INV-0001
  useEffect(() => {
    const fetchNextInvoiceNo = async () => {
      try {
        const res = await billingService.getBills({ documentType: "invoice" });
        const list = res?.bills || [];

        let maxSeq = 0;
        list.forEach((b: any) => {
          const no = b.invoiceId || b.billNumber || "";
          const match = no.match(/^INV-(\d+)$/i);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num < 10000 && num > maxSeq) {
              maxSeq = num;
            }
          }
        });

        const nextNum = maxSeq + 1;
        if (billType === "sales") {
          setChallanNo(`INV-${String(nextNum).padStart(4, "0")}`);
        } else {
          setChallanNo(`PB-${String(nextNum).padStart(4, "0")}`);
        }
      } catch (err) {
        console.error("Error calculating next invoice number:", err);
        setChallanNo(billType === "sales" ? "INV-0001" : "PB-0001");
      }
    };

    fetchNextInvoiceNo();
  }, [billType]);

  // Fetch parties and inventory products from database
  useEffect(() => {
    customerService
      .getCustomers()
      .then((res) => {
        if (res && res.customers) {
          setParties(res.customers);
          setFilteredParties(res.customers);
        }
      })
      .catch(console.error);

    inventoryService
      .getInventory()
      .then((res) => {
        if (res && res.products) {
          setInventoryProducts(res.products);
        }
      })
      .catch(console.error);
  }, []);

  // Handle party search
  const handlePartySearch = (text: string) => {
    setSearchPartyText(text);
    if (!text.trim()) {
      setFilteredParties(parties);
    } else {
      const q = text.toLowerCase();
      setFilteredParties(
        parties.filter(
          (p) =>
            p.name?.toLowerCase().includes(q) ||
            p.companyName?.toLowerCase().includes(q) ||
            p.displayName?.toLowerCase().includes(q) ||
            p.phone?.toLowerCase().includes(q)
        )
      );
    }
    setShowPartyDropdown(true);
  };

  const handleSelectParty = async (party: any) => {
    setSelectedParty(party);
    setSearchPartyText(party.name || party.companyName || party.displayName || "");
    if (party.paymentTerms) {
      setDueDate(calculateDueDateString(billDate, party.paymentTerms));
    }
    setShowPartyDropdown(false);
    try {
      const fresh = await customerService.getCustomerById(party.id);
      if (fresh) {
        setSelectedParty((prev: any) => ({ ...prev, ...fresh }));
        if (fresh.paymentTerms) {
          setDueDate(calculateDueDateString(billDate, fresh.paymentTerms));
        }
      }
    } catch (err) {
      console.warn("Could not fetch fresh customer data:", err);
    }
  };

  const handleClearParty = () => {
    setSelectedParty(null);
    setSearchPartyText("");
    setFilteredParties(parties);
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (partyRef.current && !partyRef.current.contains(event.target as Node)) {
        setShowPartyDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calculate item amount
  const computeAmount = (item: ItemRow): number => {
    const rate = parseFloat(item.rate) || 0;
    const kg = parseFloat(item.kg) || 0;
    const weight = parseFloat(item.weight) || 0;
    const qty = parseFloat(item.qty) || 0;

    let multiplier = 0;
    if (kg > 0) {
      multiplier = kg;
    } else if (weight > 0) {
      multiplier = weight;
    } else if (qty > 0) {
      multiplier = qty;
    } else {
      multiplier = 1;
    }

    return rate * multiplier;
  };

  const handleItemFieldChange = (
    index: number,
    field: keyof ItemRow,
    value: string
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      const targetItem = { ...updated[index], [field]: value };
      targetItem.amount = computeAmount(targetItem);
      updated[index] = targetItem;
      return updated;
    });
  };

  // Add a blank manual row
  const handleAddItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        category: "",
        hsnCode: "",
        item: "",
        qty: "",
        weight: "",
        kg: "",
        carton: "",
        rate: "",
        amount: 0,
      },
    ]);
  };

  // Add an item directly from inventory selection
  const handleSelectInventoryProduct = (index: number, product: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const price =
        billType === "purchase"
          ? product.costPrice || product.price || 0
          : product.price || 0;

      const updatedRow: ItemRow = {
        ...updated[index],
        productId: product.id,
        item: product.name,
        category: product.category || updated[index].category || "Fabric",
        hsnCode: product.sku || product.barcode || updated[index].hsnCode || "",
        rate: price > 0 ? String(price) : updated[index].rate,
        qty: updated[index].qty || "1",
      };
      updatedRow.amount = computeAmount(updatedRow);
      updated[index] = updatedRow;
      return updated;
    });
    setActiveItemSuggestIndex(null);
  };

  // Bulk add selected items from Inventory Modal
  const handleAddSelectedFromInventoryModal = () => {
    const selected = inventoryProducts.filter((p) =>
      selectedInventoryIds.includes(p.id)
    );

    if (selected.length === 0) {
      setShowInventoryModal(false);
      return;
    }

    const newRows: ItemRow[] = selected.map((product) => {
      const price =
        billType === "purchase"
          ? product.costPrice || product.price || 0
          : product.price || 0;

      const row: ItemRow = {
        id: `${product.id}-${Date.now()}-${Math.random()}`,
        productId: product.id,
        category: product.category || "Fabric",
        hsnCode: product.sku || product.barcode || "",
        item: product.name,
        qty: "1",
        weight: "",
        kg: "",
        carton: "",
        rate: String(price || 0),
        amount: price || 0,
      };
      return row;
    });

    setItems((prev) => {
      // If first row is completely empty, replace it
      if (
        prev.length === 1 &&
        !prev[0].item &&
        !prev[0].rate &&
        prev[0].amount === 0
      ) {
        return newRows;
      }
      return [...prev, ...newRows];
    });

    setSelectedInventoryIds([]);
    setShowInventoryModal(false);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length <= 1) {
      setItems([
        {
          id: Date.now().toString(),
          category: "",
          hsnCode: "",
          item: "",
          qty: "",
          weight: "",
          kg: "",
          carton: "",
          rate: "",
          amount: 0,
        },
      ]);
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Effective GST Rate
  const effectiveGstRate =
    selectedGstOption.type === "custom"
      ? Number(customGstRateStr) || 0
      : selectedGstOption.rate;

  // Totals (strictly rounded to 2 decimal places)
  const itemsGrossTotal = Number(items.reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2));
  const gstAmount = Number(((itemsGrossTotal * effectiveGstRate) / 100).toFixed(2));
  const totalBillAmount = Number((itemsGrossTotal + gstAmount).toFixed(2));

  // Speech to text toggle for notes/remarks
  const handleToggleSpeech = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

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
      recognition.lang = "en-IN";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setRemarks((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  // Submit bill
  const handleSubmitBill = async () => {
    const partyName = selectedParty
      ? selectedParty.name || selectedParty.companyName || selectedParty.displayName
      : searchPartyText.trim();

    if (!partyName) {
      alert(`Please select or enter a ${billType === "purchase" ? "supplier" : "customer"} name.`);
      return;
    }

    if (items.length === 0 || (items.length === 1 && !items[0].item && items[0].amount === 0)) {
      alert("Please add at least one item with details.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customerId: selectedParty?.id || undefined,
        customerName: partyName,
        companyName: selectedParty?.companyName || selectedParty?.name || partyName,
        customerPhone: selectedParty?.phone || selectedParty?.mobile || "",
        customerEmail: selectedParty?.email || "",
        billingAddress: selectedParty?.address || "",
        issueDate: billDate ? new Date(billDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 86400000),
        billType: billType,
        documentType: documentType,
        invoiceId: challanNo || undefined,
        challanNo: challanNo || undefined,
        paymentStatus: "pending",
        amountPaid: 0,
        amountRemaining: totalBillAmount,
        subtotal: itemsGrossTotal,
        tax: gstAmount,
        total: totalBillAmount,
        notes: remarks,
        items: items
          .filter((it) => it.item || it.category || it.amount > 0)
          .map((it) => ({
            productId: it.productId || undefined,
            description: it.item || it.category || "Item",
            category: it.category || "",
            hsnCode: it.hsnCode || "",
            quantity: parseFloat(it.qty) || 1,
            weight: parseFloat(it.weight) || 0,
            kg: parseFloat(it.kg) || 0,
            carton: parseInt(it.carton, 10) || 0,
            unitPrice: parseFloat(it.rate) || 0,
            total: it.amount || 0,
          })),
      };

      await billingService.createBill(payload);
      router.push(`/billing?type=${billType}`);
    } catch (err: any) {
      console.error("Failed to create bill:", err);
      alert(err?.message || "Failed to save bill. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPurchase = billType === "purchase";

  // Filtered inventory items for modal
  const modalFilteredInventory = inventoryProducts.filter((p) => {
    if (!inventorySearchQuery.trim()) return true;
    const q = inventorySearchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4 pb-24">
      {/* Bill Type Toggle: Sales Bill vs Purchase Bill */}
      <div className="flex items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={() => {
            setBillType("sales");
            setDocumentType("invoice");
          }}
          className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs ${
            billType === "sales"
              ? "bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20"
              : "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          }`}
        >
          <span>🧾</span>
          <span>Sales Bill</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setBillType("purchase");
            setDocumentType("invoice");
          }}
          className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs ${
            billType === "purchase"
              ? "bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20"
              : "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          }`}
        >
          <span>📦</span>
          <span>Purchase Bill</span>
        </button>
      </div>

      {/* 1. Top Grid: Party Details + Invoice Specifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Card: Supplier / Mill or Customer / Party */}
        <div className="glass-card rounded-xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-[#202936]">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200 mb-2">
            {isPurchase ? "SUPPLIER / MILL" : "CUSTOMER / PARTY"}
          </label>

          <div ref={partyRef} className="relative">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchPartyText}
                onChange={(e) => handlePartySearch(e.target.value)}
                onFocus={() => setShowPartyDropdown(true)}
                placeholder="Search or enter party name..."
                className="w-full pl-9 pr-14 py-2.5 text-sm bg-white dark:bg-[#1a222c] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <div className="absolute right-3 flex items-center gap-1.5">
                {searchPartyText && (
                  <button
                    type="button"
                    onClick={handleClearParty}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <ChevronDown className="w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Dropdown party selector */}
            <AnimatePresence>
              {showPartyDropdown && filteredParties.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute left-0 right-0 top-full mt-1.5 z-30 max-h-56 overflow-y-auto bg-white dark:bg-[#1e2634] border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl"
                >
                  {filteredParties.map((p) => {
                    const displayName = p.name || p.companyName || p.displayName;
                    const isSelected = selectedParty?.id === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleSelectParty(p)}
                        className={`px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between transition-colors border-b border-gray-50 dark:border-gray-800 last:border-b-0 ${
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200"
                        }`}
                      >
                        <div>
                          <div className="font-medium">{displayName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {p.city ? `${p.city} • ` : ""}
                            {p.phone || p.mobile || "No phone"}
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {selectedParty && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2.5 text-xs">
              <div className="text-gray-500 dark:text-gray-400 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <div className="flex items-center gap-3">
                  {selectedParty.phone && (
                    <span>
                      Phone: <span className="font-mono text-gray-700 dark:text-gray-300">{selectedParty.phone}</span>
                    </span>
                  )}
                  {selectedParty.gstNumber && (
                    <span>
                      GSTIN: <span className="font-mono text-gray-700 dark:text-gray-300">{selectedParty.gstNumber}</span>
                    </span>
                  )}
                </div>

                {dueDate && (
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    <span className="font-sans text-gray-500 dark:text-gray-400 font-medium">Due Date:</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      {new Date(dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      {selectedParty?.paymentTerms ? ` (${selectedParty.paymentTerms})` : ""}
                    </span>
                  </div>
                )}
              </div>

              {/* Credit & Live Balance Tracking - Shows Opening Balance only if > 0 */}
              {billType === "sales" && (
                <div
                  className={`grid gap-2.5 pt-2 border-t border-dashed border-gray-100 dark:border-gray-800 ${
                    (Number(selectedParty.openingBalance) || 0) > 0
                      ? "grid-cols-2 sm:grid-cols-4"
                      : "grid-cols-3"
                  }`}
                >
                  {(Number(selectedParty.openingBalance) || 0) > 0 && (
                    <div>
                      <span className="block text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">
                        Opening Balance
                      </span>
                      <span className="font-mono font-bold text-gray-800 dark:text-gray-200 text-xs sm:text-sm">
                        ₹{(Number(selectedParty.openingBalance) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="block text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">
                      Credit Limit
                    </span>
                    <span className="font-mono font-bold text-gray-800 dark:text-gray-200 text-xs sm:text-sm">
                      {(Number(selectedParty.creditLimit) || 0) > 0
                        ? `₹${(Number(selectedParty.creditLimit) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "Unlimited"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">
                      Used (Outstanding)
                    </span>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-xs sm:text-sm">
                      ₹{(Number(selectedParty.totalOutstanding ?? selectedParty.usedCredit ?? 0)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">
                      Available Credit
                    </span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
                      {(Number(selectedParty.creditLimit) || 0) > 0
                        ? `₹${(Number(selectedParty.availableCredit ?? Math.max(0, (selectedParty.creditLimit || 0) - (selectedParty.totalOutstanding || 0)))).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "Unlimited"}
                    </span>
                  </div>
                </div>
              )}

              {/* Gentle warning if bill exceeds available credit */}
              {billType === "sales" &&
                (Number(selectedParty.creditLimit) || 0) > 0 &&
                totalBillAmount > (Number(selectedParty.availableCredit) || 0) && (
                  <p className="pt-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    ⚠️ Total invoice value exceeds customer&apos;s available credit limit (₹{(Number(selectedParty.availableCredit) || 0).toLocaleString()}).
                  </p>
                )}
            </div>
          )}
        </div>

        {/* Right Card: Invoice Specifications* */}
        <div className="glass-card rounded-xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-[#202936] flex flex-col justify-between">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200 mb-2">
              INVOICE SPECIFICATIONS*
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Challan No */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                  CHALLAN NO
                </label>
                <input
                  type="text"
                  value={challanNo}
                  onChange={(e) => setChallanNo(e.target.value)}
                  placeholder="e.g. PB-001"
                  className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-[#1a222c] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Bill Date */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                  BILL / INWARD DATE*
                </label>
                <input
                  type="date"
                  value={billDate}
                  onChange={(e) => {
                    setBillDate(e.target.value);
                    if (selectedParty?.paymentTerms) {
                      setDueDate(calculateDueDateString(e.target.value, selectedParty.paymentTerms));
                    }
                  }}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-[#1a222c] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Items Breakdown Table Card */}
      <div className="glass-card rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-[#202936] overflow-visible">
        {/* Table Header Row with Actions */}
        <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
            {isPurchase ? "PURCHASE ITEMS / MATERIALS BREAKDOWN" : "SALES ITEMS / FABRICS BREAKDOWN"}
          </h2>

          <div className="flex items-center gap-2.5">
            {/* Add from Inventory Button */}
            <button
              type="button"
              onClick={() => setShowInventoryModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-300 text-xs sm:text-sm font-semibold rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
            >
              <Package className="w-4 h-4" />
              <span>Add From Inventory</span>
            </button>

            {/* Manual Add Item Row Button */}
            <button
              type="button"
              onClick={handleAddItemRow}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item Row</span>
            </button>
          </div>
        </div>

        {/* Scrollable Table with Standard Texa Fields */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 dark:bg-[#1a222c]/50 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                <th className="py-3 px-3 w-12 text-center">SR</th>
                <th className="py-3 px-2 min-w-[240px]">ITEM</th>
                <th className="py-3 px-2 min-w-[110px]">HSN CODE</th>
                <th className="py-3 px-2 min-w-[110px]">QTY</th>
                <th className="py-3 px-2 min-w-[100px]">WEIGHT</th>
                <th className="py-3 px-2 min-w-[100px]">KG</th>
                <th className="py-3 px-2 min-w-[90px]">CARTOON</th>
                <th className="py-3 px-2 min-w-[120px]">RATE (₹)</th>
                <th className="py-3 px-2 min-w-[130px]">AMOUNT (₹)</th>
                <th className="py-3 px-2 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
              {items.map((row, index) => {
                const sr = (index + 1).toString().padStart(2, "0");

                // Suggestions for item input
                const matchingInventory = inventoryProducts.filter((p) => {
                  if (!row.item) return false;
                  return p.name?.toLowerCase().includes(row.item.toLowerCase());
                });

                return (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    {/* SR */}
                    <td className="py-2.5 px-3 text-center text-xs font-mono font-medium text-gray-500 dark:text-gray-400">
                      {sr}
                    </td>

                    {/* ITEM (with Inventory autocomplete) */}
                    <td className="py-2.5 px-2 relative">
                      <input
                        type="text"
                        value={row.item}
                        onChange={(e) => {
                          handleItemFieldChange(index, "item", e.target.value);
                          setActiveItemSuggestIndex(index);
                        }}
                        onFocus={() => setActiveItemSuggestIndex(index)}
                        placeholder="Enter item name..."
                        className="w-full h-9 px-3 text-xs bg-white dark:bg-[#1a222c] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />

                      {/* Autocomplete dropdown for existing inventory items */}
                      {activeItemSuggestIndex === index && matchingInventory.length > 0 && (
                        <div className="absolute left-2 right-2 top-full mt-1 z-40 max-h-48 overflow-y-auto bg-white dark:bg-[#1e2634] border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1">
                          <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Matching Inventory Items
                          </div>
                          {matchingInventory.slice(0, 5).map((p) => (
                            <div
                              key={p.id}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelectInventoryProduct(index, p);
                              }}
                              className="px-3 py-2 text-xs cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center justify-between"
                            >
                              <div>
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {p.name}
                                </span>
                                <span className="text-[11px] text-gray-500 dark:text-gray-400 ml-2">
                                  ({p.category || "General"})
                                </span>
                              </div>
                              <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                                ₹{p.price || p.costPrice || 0}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* HSN CODE */}
                    <td className="py-2.5 px-2">
                      <input
                        type="text"
                        value={row.hsnCode}
                        onChange={(e) =>
                          handleItemFieldChange(index, "hsnCode", e.target.value)
                        }
                        placeholder="HSN Code"
                        className="w-full h-9 px-3 text-xs font-mono bg-white dark:bg-[#1a222c] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </td>

                    {/* QTY */}
                    <td className="py-2.5 px-2">
                      <input
                        type="text"
                        value={row.qty}
                        onChange={(e) =>
                          handleItemFieldChange(index, "qty", e.target.value)
                        }
                        placeholder="0"
                        className="w-full h-9 px-3 text-xs font-mono bg-white dark:bg-[#1a222c] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </td>

                    {/* WEIGHT */}
                    <td className="py-2.5 px-2">
                      <input
                        type="number"
                        step="any"
                        value={row.weight}
                        onChange={(e) =>
                          handleItemFieldChange(index, "weight", e.target.value)
                        }
                        placeholder="0.00"
                        className="w-full h-9 px-3 text-xs font-mono bg-white dark:bg-[#1a222c] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </td>

                    {/* KG */}
                    <td className="py-2.5 px-2">
                      <input
                        type="number"
                        step="any"
                        value={row.kg}
                        onChange={(e) =>
                          handleItemFieldChange(index, "kg", e.target.value)
                        }
                        placeholder="0.00"
                        className="w-full h-9 px-3 text-xs font-mono bg-white dark:bg-[#1a222c] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </td>

                    {/* CARTOON */}
                    <td className="py-2.5 px-2">
                      <input
                        type="number"
                        value={row.carton}
                        onChange={(e) =>
                          handleItemFieldChange(index, "carton", e.target.value)
                        }
                        placeholder="0"
                        className="w-full h-9 px-3 text-xs font-mono bg-white dark:bg-[#1a222c] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </td>

                    {/* RATE (₹) */}
                    <td className="py-2.5 px-2">
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-xs text-gray-400 pointer-events-none">
                          ₹
                        </span>
                        <input
                          type="number"
                          step="any"
                          value={row.rate}
                          onChange={(e) =>
                            handleItemFieldChange(index, "rate", e.target.value)
                          }
                          placeholder="0.00"
                          className="w-full h-9 pl-6 pr-3 text-xs font-mono bg-white dark:bg-[#1a222c] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </td>

                    {/* AMOUNT (₹) */}
                    <td className="py-2.5 px-2">
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-xs text-gray-400 pointer-events-none">
                          ₹
                        </span>
                        <input
                          type="text"
                          readOnly
                          value={row.amount.toFixed(2)}
                          className="w-full h-9 pl-6 pr-3 text-xs font-mono font-semibold bg-gray-50/70 dark:bg-[#1a222c] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none cursor-default"
                        />
                      </div>
                    </td>

                    {/* Delete action */}
                    <td className="py-2.5 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(index)}
                        className="text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-colors p-1.5"
                        title="Remove row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer: Items Count */}
        <div className="px-5 py-3.5 bg-gray-50/50 dark:bg-[#1a222c]/40 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs sm:text-sm">
          <div className="text-gray-500 dark:text-gray-400 font-medium">
            {items.length} {items.length === 1 ? "Item" : "Items"}
          </div>
        </div>
      </div>

      {/* 3. Bottom Grid: Remarks & Notes + Bill Accounting Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Card: Remarks & Notes */}
        <div className="glass-card rounded-xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-[#202936] space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
              REMARKS / NOTES:
            </span>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                <Globe className="w-3 h-3" />
                English
              </span>

              <button
                type="button"
                onClick={handleToggleSpeech}
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                  isListening
                    ? "bg-red-50 text-red-600 border-red-200 animate-pulse"
                    : "bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300"
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-3 h-3 text-red-600" />
                    Listening...
                  </>
                ) : (
                  <>
                    <Mic className="w-3 h-3" />
                    Speak (Mic)
                  </>
                )}
              </button>
            </div>
          </div>

          <textarea
            rows={4}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add optional notes (Press Enter to Save Bill)..."
            className="w-full p-3 text-xs sm:text-sm bg-white dark:bg-[#1a222c] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-all"
          />
        </div>

        {/* Right Card: Bill Accounting Summary */}
        <div className="glass-card rounded-xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-[#202936] flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200 mb-4">
              BILL ACCOUNTING SUMMARY
            </h3>

            <div className="space-y-3.5">
              {/* Gross Total */}
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-gray-600 dark:text-gray-400 font-medium">
                  Items Gross Total:
                </span>
                <span className="font-mono font-bold text-gray-900 dark:text-gray-100">
                  ₹{itemsGrossTotal.toFixed(2)}
                </span>
              </div>

              {/* GST / Tax Dropdown & Custom Rate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm gap-3">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    GST / Tax:
                  </span>
                  <div className="relative">
                    <select
                      value={selectedGstOption.id}
                      onChange={(e) => {
                        const opt = GST_OPTIONS.find((o) => o.id === e.target.value);
                        if (opt) setSelectedGstOption(opt);
                      }}
                      className="appearance-none pl-3 pr-8 py-1.5 text-xs sm:text-sm bg-white dark:bg-[#1a222c] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer font-medium"
                    >
                      {GST_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                  </div>
                </div>

                {/* Custom GST % Input */}
                {selectedGstOption.type === "custom" && (
                  <div className="flex items-center justify-end gap-2 text-xs">
                    <span className="text-gray-500">Custom Rate (%):</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={customGstRateStr}
                      onChange={(e) => setCustomGstRateStr(e.target.value)}
                      placeholder="e.g. 7.5"
                      className="w-24 px-2 py-1 text-right bg-white dark:bg-[#1a222c] border border-blue-400 rounded-md font-mono text-xs text-gray-900 dark:text-gray-100 focus:outline-none"
                    />
                    <span className="text-gray-500">%</span>
                  </div>
                )}

                {/* Individual Tax Lines Breakdown */}
                {selectedGstOption.type === "intra" && effectiveGstRate > 0 ? (
                  <div className="pt-1.5 space-y-1 text-xs border-t border-dashed border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400">
                    <div className="flex justify-between items-center">
                      <span>CGST ({effectiveGstRate / 2}%):</span>
                      <span className="font-mono text-gray-800 dark:text-gray-200">
                        ₹{(gstAmount / 2).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>SGST ({effectiveGstRate / 2}%):</span>
                      <span className="font-mono text-gray-800 dark:text-gray-200">
                        ₹{(gstAmount / 2).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : selectedGstOption.type === "inter" && effectiveGstRate > 0 ? (
                  <div className="pt-1.5 flex justify-between items-center text-xs border-t border-dashed border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400">
                    <span>IGST ({effectiveGstRate}%):</span>
                    <span className="font-mono text-gray-800 dark:text-gray-200">
                      ₹{gstAmount.toFixed(2)}
                    </span>
                  </div>
                ) : selectedGstOption.type === "custom" && effectiveGstRate > 0 ? (
                  <div className="pt-1.5 flex justify-between items-center text-xs border-t border-dashed border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400">
                    <span>Tax ({effectiveGstRate}%):</span>
                    <span className="font-mono text-gray-800 dark:text-gray-200">
                      ₹{gstAmount.toFixed(2)}
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Total Bill Amount */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
                  TOTAL BILL AMOUNT (₹)*
                </span>
                <div className="flex items-center gap-1 text-base sm:text-lg font-mono font-bold text-gray-900 dark:text-gray-100">
                  <span className="text-gray-400">₹</span>
                  <span>{totalBillAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Actions Bar */}
      <div className="fixed bottom-0 right-0 left-0 md:left-[var(--sidebar-width,16rem)] h-16 px-6 md:px-8 bg-white/95 dark:bg-[#202936]/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-700/80 flex items-center justify-end gap-3 z-40 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] transition-all duration-300">
        <Link
          href="/billing"
          className="px-5 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium transition-colors cursor-pointer"
        >
          Cancel
        </Link>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleSubmitBill}
          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Bill...</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>Save & Generate Bill</span>
            </>
          )}
        </button>
      </div>

      {/* 4. Modal: Add Items From Inventory */}
      <AnimatePresence>
        {showInventoryModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
            onClick={() => setShowInventoryModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#202936] rounded-xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                      Select Items from Inventory
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Choose products to instantly add to this bill
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInventoryModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Search Bar */}
              <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1a222c]/50">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={inventorySearchQuery}
                    onChange={(e) => setInventorySearchQuery(e.target.value)}
                    placeholder="Search inventory items by name, SKU, category..."
                    className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-[#202936] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Inventory Items List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {modalFilteredInventory.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 dark:text-gray-500 text-sm">
                    No matching inventory items found.
                  </div>
                ) : (
                  modalFilteredInventory.map((item) => {
                    const isSelected = selectedInventoryIds.includes(item.id);
                    const price =
                      billType === "purchase"
                        ? item.costPrice || item.price || 0
                        : item.price || 0;

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedInventoryIds((prev) =>
                            isSelected
                              ? prev.filter((id) => id !== item.id)
                              : [...prev, item.id]
                          );
                        }}
                        className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-blue-50/70 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600"
                            : "bg-white dark:bg-[#1a222c] border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 pointer-events-none"
                          />
                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {item.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                              {item.category && (
                                <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[11px]">
                                  {item.category}
                                </span>
                              )}
                              {item.sku && (
                                <span className="font-mono text-[11px]">
                                  SKU: {item.sku}
                                </span>
                              )}
                              {item.quantity !== undefined && (
                                <span>Stock: {item.quantity}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100">
                            ₹{parseFloat(price).toFixed(2)}
                          </div>
                          <div className="text-[11px] text-gray-400">
                            per {item.unit || "unit"}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-[#1a222c]/50">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {selectedInventoryIds.length} item{selectedInventoryIds.length !== 1 ? "s" : ""} selected
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedInventoryIds([]);
                      setShowInventoryModal(false);
                    }}
                    className="px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={selectedInventoryIds.length === 0}
                    onClick={handleAddSelectedFromInventoryModal}
                    className="px-4 py-2 text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    Add to Bill
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
