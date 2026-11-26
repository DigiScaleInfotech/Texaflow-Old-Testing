"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
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

export default function EditBillingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [billType, setBillType] = useState<"sales" | "purchase">("sales");
  const [documentType, setDocumentType] = useState<"invoice" | "challan">("invoice");
  const [parties, setParties] = useState<any[]>([]);
  const [filteredParties, setFilteredParties] = useState<any[]>([]);
  const [searchPartyText, setSearchPartyText] = useState("");
  const [selectedParty, setSelectedParty] = useState<any | null>(null);
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  const partyRef = useRef<HTMLDivElement>(null);

  // Specifications
  const [invoiceId, setInvoiceId] = useState("");
  const [billDate, setBillDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [challanRef, setChallanRef] = useState("");

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
  const [selectedGstOption, setSelectedGstOption] = useState<GstOption>(GST_OPTIONS[1]);
  const [customGstRateStr, setCustomGstRateStr] = useState<string>("5");
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mic speech recognition
  const [isListening, setIsListening] = useState(false);

  // Load parties and inventory
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

  // Fetch existing Invoice Data
  useEffect(() => {
    const fetchBill = async () => {
      try {
        setLoading(true);
        setLoadError(null);

        let data = await billingService.getBillById(id);
        if (!data) {
          const allRes = await billingService.getBills();
          if (allRes && allRes.bills) {
            data = allRes.bills.find(
              (b: any) =>
                b.id === id ||
                b.invoiceId === id ||
                b.billNumber === id ||
                b.challanNo === id
            );
          }
        }

        if (data) {
          setBillType(data.billType === "purchase" ? "purchase" : "sales");
          setDocumentType(data.documentType || "invoice");
          setInvoiceId(data.invoiceId || data.billNumber || "");
          setChallanRef(data.challanNo || "");

          if (data.issueDate) {
            setBillDate(new Date(data.issueDate).toISOString().split("T")[0]);
          } else {
            setBillDate(new Date().toISOString().split("T")[0]);
          }

          if (data.dueDate) {
            setDueDate(new Date(data.dueDate).toISOString().split("T")[0]);
          } else {
            setDueDate(new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]);
          }

          const partyName = data.customerName || data.companyName || "";
          setSearchPartyText(partyName);
          setSelectedParty({
            id: data.customerId,
            name: partyName,
            companyName: data.companyName || partyName,
            phone: data.customerPhone || "",
            email: data.customerEmail || "",
            address: data.billingAddress || "",
            gst: data.customerGst || "",
          });

          if (data.customerId) {
            customerService
              .getCustomerById(data.customerId)
              .then((fresh) => {
                if (fresh) {
                  setSelectedParty((prev: any) => ({ ...prev, ...fresh }));
                }
              })
              .catch(console.warn);
          }

          setRemarks(data.notes || "");

          // Items
          if (data.items && data.items.length > 0) {
            setItems(
              data.items.map((it: any, idx: number) => ({
                id: it.id || String(idx + 1),
                productId: it.productId,
                category: it.category || "Fabric",
                hsnCode: it.hsnCode || "",
                item: it.description || it.item || "",
                qty: String(it.quantity || "1"),
                weight: String(it.weight || ""),
                kg: String(it.kg || ""),
                carton: String(it.carton || ""),
                rate: String(it.unitPrice || "0"),
                amount: Number(it.total || 0),
              }))
            );
          }

          // GST Option
          const subtotalNum = Number(data.subtotal) || 0;
          const taxNum = Number(data.tax) || 0;
          let calculatedRate = 5;
          if (data.gstRate !== undefined && data.gstRate !== null) {
            calculatedRate = Number(data.gstRate);
          } else if (subtotalNum > 0 && taxNum > 0) {
            calculatedRate = Math.round((taxNum / subtotalNum) * 100);
          }

          const matched = GST_OPTIONS.find((opt) => opt.rate === calculatedRate);
          if (matched) {
            setSelectedGstOption(matched);
          } else {
            setSelectedGstOption(GST_OPTIONS[GST_OPTIONS.length - 1]); // Custom
            setCustomGstRateStr(String(calculatedRate));
          }
        } else {
          setLoadError("Invoice not found.");
        }
      } catch (err: any) {
        console.error("Error fetching invoice for edit:", err);
        setLoadError(err?.message || "Failed to load invoice.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBill();
    }
  }, [id]);

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
    if (party.paymentTerms && billDate) {
      setDueDate(calculateDueDateString(billDate, party.paymentTerms));
    }
    setShowPartyDropdown(false);
    try {
      const fresh = await customerService.getCustomerById(party.id);
      if (fresh) {
        setSelectedParty((prev: any) => ({ ...prev, ...fresh }));
        if (fresh.paymentTerms && billDate) {
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

  // Close party dropdown on outside click
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

  // Select item from suggestions
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

  // Totals
  const itemsGrossTotal = Number(
    items.reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2)
  );
  const gstAmount = Number(((itemsGrossTotal * effectiveGstRate) / 100).toFixed(2));
  const totalBillAmount = Number((itemsGrossTotal + gstAmount).toFixed(2));

  // Speech to text toggle for remarks
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

  // Submit update
  const handleUpdateBill = async () => {
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
        invoiceId: invoiceId || undefined,
        challanNo: challanRef || undefined,
        subtotal: itemsGrossTotal,
        tax: gstAmount,
        total: totalBillAmount,
        gstRate: effectiveGstRate,
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

      await billingService.updateBill(id, payload);
      router.push(`/billing/${id}`);
    } catch (err: any) {
      console.error("Failed to update bill:", err);
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading invoice for editing...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 glass-card rounded-xl text-center space-y-4">
        <p className="text-sm text-red-500 font-medium">{loadError}</p>
        <Link
          href="/billing"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Invoices</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 font-sans">
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
                ? "bg-blue-600 text-white shadow-blue-500/20"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            Sales Bill
          </button>
          <button
            type="button"
            onClick={() => {
              setBillType("purchase");
              setDocumentType("invoice");
            }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs ${
              billType === "purchase"
                ? "bg-emerald-600 text-white shadow-emerald-500/20"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            Purchase Bill
          </button>
        </div>

      {/* 1. Header Information Card */}
      <div className="glass-card rounded-xl p-5 border border-gray-200/60 dark:border-gray-700/60">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
          {/* Party Selection Field */}
          <div className="relative" ref={partyRef}>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {isPurchase ? "Supplier / Vendor *" : "Customer / Party *"}
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={
                  isPurchase
                    ? "Search or enter supplier name..."
                    : "Search or enter customer name..."
                }
                value={searchPartyText}
                onChange={(e) => handlePartySearch(e.target.value)}
                onFocus={() => setShowPartyDropdown(true)}
                className="w-full px-3 py-2 pl-9 pr-8 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              {searchPartyText && (
                <button
                  type="button"
                  onClick={handleClearParty}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Dropdown for party list */}
            <AnimatePresence>
              {showPartyDropdown && filteredParties.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 max-h-56 overflow-y-auto"
                >
                  {filteredParties.map((p) => {
                    const isSelected = selectedParty?.id === p.id;
                    const pName = p.name || p.companyName || p.displayName;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectParty(p)}
                        className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border-b border-gray-50 dark:border-gray-800/60 last:border-0 ${
                          isSelected ? "bg-blue-50/60 dark:bg-blue-900/30" : ""
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-gray-100">
                            {pName}
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400">
                            {p.phone || p.mobile || "No phone"} {p.gst ? `• GST: ${p.gst}` : ""}
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Invoice Number */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Invoice No. *
            </label>
            <input
              type="text"
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Bill Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Bill Date *
            </label>
            <div className="relative">
              <input
                type="date"
                value={billDate}
                onChange={(e) => {
                  setBillDate(e.target.value);
                  if (selectedParty?.paymentTerms) {
                    setDueDate(calculateDueDateString(e.target.value, selectedParty.paymentTerms));
                  }
                }}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Due Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Selected Party Quick Info strip */}
        {selectedParty && (
          <div className="mt-4 pt-3.5 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-600 dark:text-gray-400">
            {selectedParty.phone && (
              <div>
                <span className="text-gray-400 dark:text-gray-500">Phone: </span>
                <span className="font-mono text-gray-900 dark:text-gray-200 font-medium">
                  {selectedParty.phone}
                </span>
              </div>
            )}
            {selectedParty.gst && (
              <div>
                <span className="text-gray-400 dark:text-gray-500">GST: </span>
                <span className="font-mono text-gray-900 dark:text-gray-200 font-medium">
                  {selectedParty.gst}
                </span>
              </div>
            )}
            {selectedParty.address && (
              <div>
                <span className="text-gray-400 dark:text-gray-500">Address: </span>
                <span className="text-gray-900 dark:text-gray-200">
                  {typeof selectedParty.address === "object"
                    ? [selectedParty.address.street, selectedParty.address.city, selectedParty.address.state]
                        .filter(Boolean)
                        .join(", ")
                    : selectedParty.address}
                </span>
              </div>
            )}
            {challanRef && (
              <div>
                <span className="text-gray-400 dark:text-gray-500">Ref Challan: </span>
                <span className="font-mono text-blue-600 dark:text-blue-400 font-medium">
                  {challanRef}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Items Table Card */}
      <div className="glass-card rounded-xl border border-gray-200/60 dark:border-gray-700/60 overflow-hidden">
        {/* Table Top Actions */}
        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50 dark:bg-gray-800/40">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              Bill Items ({items.length})
            </h2>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Enter description, quantities, weight & rate
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowInventoryModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors cursor-pointer"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Pick from Inventory</span>
            </button>

            <button
              type="button"
              onClick={handleAddItemRow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item Row</span>
            </button>
          </div>
        </div>

        {/* The Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3 min-w-[130px]">Category</th>
                <th className="py-2.5 px-3 min-w-[100px]">HSN Code</th>
                <th className="py-2.5 px-3 min-w-[220px]">Item Description *</th>
                <th className="py-2.5 px-3 w-20 text-right">Qty</th>
                <th className="py-2.5 px-3 w-24 text-right">Weight</th>
                <th className="py-2.5 px-3 w-20 text-right">KG</th>
                <th className="py-2.5 px-3 w-20 text-right">Carton</th>
                <th className="py-2.5 px-3 w-24 text-right">Rate (₹)</th>
                <th className="py-2.5 px-3 w-28 text-right">Amount (₹)</th>
                <th className="py-2.5 px-3 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {items.map((row, index) => {
                const suggestMatches =
                  activeItemSuggestIndex === index && row.item.trim().length > 0
                    ? inventoryProducts.filter((p) =>
                        p.name?.toLowerCase().includes(row.item.toLowerCase())
                      )
                    : [];

                return (
                  <tr
                    key={row.id}
                    className="hover:bg-blue-50/20 dark:hover:bg-blue-900/10 transition-colors"
                  >
                    {/* Index */}
                    <td className="py-2 px-3 text-center text-gray-400 font-mono text-[11px]">
                      {index + 1}
                    </td>

                    {/* Category */}
                    <td className="py-2 px-2">
                      <select
                        value={row.category}
                        onChange={(e) =>
                          handleItemFieldChange(index, "category", e.target.value)
                        }
                        className="w-full py-1.5 px-2 text-xs rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Select</option>
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* HSN Code */}
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        placeholder="e.g. 5402"
                        value={row.hsnCode}
                        onChange={(e) =>
                          handleItemFieldChange(index, "hsnCode", e.target.value)
                        }
                        className="w-full py-1.5 px-2 text-xs rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>

                    {/* Item Description with suggestion popup */}
                    <td className="py-2 px-2 relative">
                      <input
                        type="text"
                        placeholder="Type item name..."
                        value={row.item}
                        onChange={(e) => {
                          handleItemFieldChange(index, "item", e.target.value);
                          setActiveItemSuggestIndex(index);
                        }}
                        onFocus={() => setActiveItemSuggestIndex(index)}
                        className="w-full py-1.5 px-2 text-xs rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />

                      {/* Autocomplete popup */}
                      {suggestMatches.length > 0 && (
                        <div className="absolute left-2 right-2 top-full mt-1 z-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-40 overflow-y-auto">
                          {suggestMatches.map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() =>
                                handleSelectInventoryProduct(index, product)
                              }
                              className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center justify-between transition-colors border-b border-gray-100 dark:border-gray-700/60 last:border-0"
                            >
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {product.name}
                              </span>
                              <span className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                                ₹{product.price || product.costPrice || 0}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Qty */}
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        placeholder="1"
                        value={row.qty}
                        onChange={(e) =>
                          handleItemFieldChange(index, "qty", e.target.value)
                        }
                        className="w-full py-1.5 px-2 text-xs text-right rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>

                    {/* Weight */}
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        step="0.001"
                        placeholder="0.000"
                        value={row.weight}
                        onChange={(e) =>
                          handleItemFieldChange(index, "weight", e.target.value)
                        }
                        className="w-full py-1.5 px-2 text-xs text-right rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>

                    {/* KG */}
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={row.kg}
                        onChange={(e) =>
                          handleItemFieldChange(index, "kg", e.target.value)
                        }
                        className="w-full py-1.5 px-2 text-xs text-right rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>

                    {/* Carton */}
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        placeholder="0"
                        value={row.carton}
                        onChange={(e) =>
                          handleItemFieldChange(index, "carton", e.target.value)
                        }
                        className="w-full py-1.5 px-2 text-xs text-right rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>

                    {/* Rate */}
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={row.rate}
                        onChange={(e) =>
                          handleItemFieldChange(index, "rate", e.target.value)
                        }
                        className="w-full py-1.5 px-2 text-xs text-right rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>

                    {/* Amount */}
                    <td className="py-2 px-3 text-right font-mono font-semibold text-gray-900 dark:text-gray-100">
                      ₹{row.amount.toFixed(2)}
                    </td>

                    {/* Delete Row */}
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(index)}
                        className="p-1 rounded text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        title="Remove Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Bottom Summary & Calculation Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Remarks & Speech */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-card rounded-xl p-4 border border-gray-200/60 dark:border-gray-700/60">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Remarks / Payment Terms / Delivery Notes
              </label>
              <button
                type="button"
                onClick={handleToggleSpeech}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-colors cursor-pointer ${
                  isListening
                    ? "bg-red-500 text-white border-red-600 animate-pulse"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-200"
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-3 h-3" />
                    <span>Listening...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3 h-3" />
                    <span>Voice Note</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={3}
              placeholder="e.g. Goods delivered in good condition. Subject to Surat jurisdiction."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Right Side: GST Selection & Final Calculation Totals */}
        <div className="lg:col-span-5 glass-card rounded-xl p-5 border border-gray-200/60 dark:border-gray-700/60 space-y-3.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Tax & Final Calculations
          </h3>

          {/* Subtotal */}
          <div className="flex items-center justify-between text-xs py-1 border-b border-gray-100 dark:border-gray-800">
            <span className="text-gray-600 dark:text-gray-400">Items Gross Total:</span>
            <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
              ₹{itemsGrossTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* GST Options Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Select GST Rate / Mode
            </label>
            <select
              value={selectedGstOption.id}
              onChange={(e) => {
                const opt = GST_OPTIONS.find((o) => o.id === e.target.value);
                if (opt) setSelectedGstOption(opt);
              }}
              className="w-full py-2 px-3 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {GST_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>

            {selectedGstOption.type === "custom" && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Enter %"
                  value={customGstRateStr}
                  onChange={(e) => setCustomGstRateStr(e.target.value)}
                  className="w-24 py-1.5 px-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-500">% custom rate</span>
              </div>
            )}
          </div>

          {/* Calculated GST Amount */}
          <div className="flex items-center justify-between text-xs py-1 border-b border-gray-100 dark:border-gray-800">
            <span className="text-gray-600 dark:text-gray-400">
              GST ({effectiveGstRate}%):
            </span>
            <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
              ₹{gstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Grand Total */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              Grand Total:
            </span>
            <span className="text-base font-extrabold font-mono text-blue-600 dark:text-blue-400">
              ₹{totalBillAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
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
          onClick={handleUpdateBill}
          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Updating Invoice...</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>Update Invoice</span>
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

              {/* Search Box */}
              <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search product name, category, or SKU..."
                    value={inventorySearchQuery}
                    onChange={(e) => setInventorySearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Products List */}
              <div className="flex-1 overflow-y-auto p-4 divide-y divide-gray-100 dark:divide-gray-800/60">
                {modalFilteredInventory.length === 0 ? (
                  <div className="py-12 text-center text-xs text-gray-500 dark:text-gray-400">
                    No products found in inventory.
                  </div>
                ) : (
                  modalFilteredInventory.map((prod) => {
                    const isSelected = selectedInventoryIds.includes(prod.id);
                    const price = isPurchase
                      ? prod.costPrice || prod.price || 0
                      : prod.price || 0;

                    return (
                      <div
                        key={prod.id}
                        onClick={() => {
                          setSelectedInventoryIds((prev) =>
                            isSelected
                              ? prev.filter((id) => id !== prod.id)
                              : [...prev, prod.id]
                          );
                        }}
                        className={`p-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-indigo-50/70 dark:bg-indigo-900/30"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <div>
                            <div className="text-xs font-bold text-gray-900 dark:text-gray-100">
                              {prod.name}
                            </div>
                            <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-2">
                              {prod.category && <span>{prod.category}</span>}
                              {prod.sku && <span>• SKU: {prod.sku}</span>}
                              <span>• Stock: {prod.quantity ?? prod.stock ?? 0}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-mono font-bold text-gray-900 dark:text-gray-100">
                            ₹{price}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {isPurchase ? "Cost" : "Selling"} Price
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/40">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedInventoryIds.length} item(s) selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowInventoryModal(false)}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddSelectedFromInventoryModal}
                    disabled={selectedInventoryIds.length === 0}
                    className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-xs"
                  >
                    Add Selected to Bill
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
