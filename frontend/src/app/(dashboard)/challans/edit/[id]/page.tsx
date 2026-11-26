"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { billingService } from "@/services/billing.service";
import { customerService } from "@/services/customer.service";
import { inventoryService } from "@/services/inventory.service";
import { calculateDueDate, parsePaymentTermsDays } from "@/utils/paymentTerms";
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
  Truck,
  Save,
} from "lucide-react";

interface ItemRow {
  id: string;
  productId?: string;
  hsnCode: string;
  item: string;
  qty: string;
  weight: string;
  kg: string;
  carton: string;
  rate: string;
  amount: number;
}

export default function EditChallanPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [parties, setParties] = useState<any[]>([]);
  const [filteredParties, setFilteredParties] = useState<any[]>([]);
  const [searchPartyText, setSearchPartyText] = useState("");
  const [selectedParty, setSelectedParty] = useState<any | null>(null);
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  const partyRef = useRef<HTMLDivElement>(null);

  // Specifications
  const [challanNo, setChallanNo] = useState("");
  const [dispatchDate, setDispatchDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [vehicleNo, setVehicleNo] = useState("");
  const [transportName, setTransportName] = useState("");

  // Inventory products & modal state
  const [inventoryProducts, setInventoryProducts] = useState<any[]>([]);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventorySearchQuery, setInventorySearchQuery] = useState("");
  const [selectedInventoryIds, setSelectedInventoryIds] = useState<string[]>([]);
  const [activeItemSuggestIndex, setActiveItemSuggestIndex] = useState<number | null>(null);

  // Table items
  const [items, setItems] = useState<ItemRow[]>([
    {
      id: "1",
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

  // Payment status & remarks
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // Fetch existing Challan Data
  useEffect(() => {
    const fetchChallan = async () => {
      try {
        setLoading(true);
        const data = await billingService.getBillById(id);
        if (data) {
          setChallanNo(data.challanNo || data.invoiceId || "");
          if (data.issueDate) {
            setDispatchDate(new Date(data.issueDate).toISOString().split("T")[0]);
          }
          setVehicleNo(data.vehicleNo || "");
          setTransportName(data.transportName || "");
          setSearchPartyText(data.customerName || "");
          setSelectedParty({
            id: data.customerId,
            name: data.customerName,
            phone: data.customerPhone,
            email: data.customerEmail,
            address: data.billingAddress,
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

          if (data.items && data.items.length > 0) {
            setItems(
              data.items.map((it: any, idx: number) => ({
                id: it.id || String(idx + 1),
                productId: it.productId,
                hsnCode: it.hsnCode || "",
                item: it.description || it.item || "",
                qty: String(it.quantity || ""),
                weight: String(it.weight || ""),
                kg: String(it.kg || ""),
                carton: String(it.carton || ""),
                rate: String(it.unitPrice || ""),
                amount: Number(it.total || 0),
              }))
            );
          }
        }
      } catch (err) {
        console.error("Error loading challan:", err);
        alert("Failed to load delivery challan.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchChallan();
    }
  }, [id]);

  // Click outside to close party dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (partyRef.current && !partyRef.current.contains(event.target as Node)) {
        setShowPartyDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePartySearch = (text: string) => {
    setSearchPartyText(text);
    if (!text.trim()) {
      setFilteredParties(parties);
      setSelectedParty(null);
    } else {
      const q = text.toLowerCase();
      setFilteredParties(
        parties.filter(
          (p) =>
            p.name?.toLowerCase().includes(q) ||
            p.companyName?.toLowerCase().includes(q) ||
            p.phone?.includes(q)
        )
      );
    }
    setShowPartyDropdown(true);
  };

  const handleSelectParty = async (party: any) => {
    setSelectedParty(party);
    setSearchPartyText(party.name || party.companyName || "");
    setShowPartyDropdown(false);
    try {
      const fresh = await customerService.getCustomerById(party.id);
      if (fresh) {
        setSelectedParty((prev: any) => ({ ...prev, ...fresh }));
      }
    } catch (err) {
      console.warn("Could not fetch fresh customer details:", err);
    }
  };

  const handleClearParty = () => {
    setSelectedParty(null);
    setSearchPartyText("");
    setFilteredParties(parties);
  };

  const handleItemFieldChange = (
    index: number,
    field: keyof ItemRow,
    value: string
  ) => {
    const updated = [...items];
    const row = { ...updated[index], [field]: value };

    // Auto calculate KG if Weight and Qty present
    const q = parseFloat(field === "qty" ? value : row.qty) || 0;
    const w = parseFloat(field === "weight" ? value : row.weight) || 0;
    const r = parseFloat(field === "rate" ? value : row.rate) || 0;

    if (field === "weight" || field === "qty") {
      if (w > 0 && q > 0) {
        row.kg = (w * q).toFixed(2);
      }
    }

    // Auto calculate amount: KG * Rate if KG exists, else Qty * Rate
    const totalKg = parseFloat(row.kg) || 0;
    if (totalKg > 0 && r > 0) {
      row.amount = Number((totalKg * r).toFixed(2));
    } else if (q > 0 && r > 0) {
      row.amount = Number((q * r).toFixed(2));
    } else {
      row.amount = 0;
    }

    updated[index] = row;
    setItems(updated);
  };

  const handleAddItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
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

  const handleRemoveItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectInventoryProduct = (index: number, product: any) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      productId: product.id,
      item: product.name || "",
      hsnCode: product.sku || product.barcode || updated[index].hsnCode || "",
      rate: product.price?.toString() || product.costPrice?.toString() || "",
    };

    const q = parseFloat(updated[index].qty) || 0;
    const r = parseFloat(updated[index].rate) || 0;
    const k = parseFloat(updated[index].kg) || 0;
    if (k > 0 && r > 0) {
      updated[index].amount = Number((k * r).toFixed(2));
    } else if (q > 0 && r > 0) {
      updated[index].amount = Number((q * r).toFixed(2));
    }

    setItems(updated);
    setActiveItemSuggestIndex(null);
  };

  const handleAddSelectedInventory = () => {
    const selectedProducts = inventoryProducts.filter((p) =>
      selectedInventoryIds.includes(p.id)
    );

    const newRows: ItemRow[] = selectedProducts.map((p) => ({
      id: Math.random().toString(36).substring(7),
      productId: p.id,
      item: p.name || "",
      hsnCode: p.sku || p.barcode || "",
      qty: "1",
      weight: "",
      kg: "",
      carton: "",
      rate: p.price?.toString() || p.costPrice?.toString() || "",
      amount: Number(p.price || p.costPrice || 0),
    }));

    setItems((prev) => {
      const filteredPrev = prev.filter((r) => r.item.trim() !== "");
      return [...filteredPrev, ...newRows];
    });

    setSelectedInventoryIds([]);
    setShowInventoryModal(false);
  };

  const itemsGrossTotal = items.reduce((acc, it) => acc + (it.amount || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const partyName = searchPartyText.trim();
    if (!partyName) {
      alert("Please select or enter a Consignee / Party name.");
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
        issueDate: dispatchDate ? new Date(dispatchDate) : new Date(),
        dueDate: calculateDueDate(
          dispatchDate ? new Date(dispatchDate) : new Date(),
          selectedParty?.paymentTerms
        ),
        billType: "sales",
        documentType: "challan",
        invoiceId: challanNo || undefined,
        challanNo: challanNo || undefined,
        vehicleNo: vehicleNo || undefined,
        transportName: transportName || undefined,
        subtotal: itemsGrossTotal,
        tax: 0,
        total: itemsGrossTotal,
        notes: remarks,
        items: items
          .filter((it) => it.item || it.amount > 0)
          .map((it) => ({
            productId: it.productId || undefined,
            description: it.item || "Item",
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
      alert("Delivery challan updated successfully!");
      router.push("/challans");
    } catch (err: any) {
      console.error("Failed to update challan:", err);
      alert(err?.message || "Failed to update delivery challan.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 font-['Plus_Jakarta_Sans']">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading delivery challan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 font-['Plus_Jakarta_Sans']">
      {/* 1. Top Grid: Party Details + Challan Specifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Card: Customer / Mill */}
        <div className="glass-card rounded-xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-[#202936]">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200 mb-2">
            CONSIGNEE / PARTY / MILL
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
                  className="absolute left-0 right-0 top-full mt-1 z-50 bg-white dark:bg-[#1e2634] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto"
                >
                  {filteredParties.map((party) => (
                    <div
                      key={party.id}
                      onClick={() => handleSelectParty(party)}
                      className="px-4 py-2.5 hover:bg-blue-50/70 dark:hover:bg-blue-900/20 cursor-pointer flex items-center justify-between border-b border-gray-50 dark:border-gray-800/50 last:border-none transition-colors"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {party.name || party.companyName}
                        </p>
                        {party.companyName && party.name !== party.companyName && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {party.companyName}
                          </p>
                        )}
                      </div>
                      {party.phone && (
                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                          {party.phone}
                        </span>
                      )}
                    </div>
                  ))}
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
                  {selectedParty.address && <span>Addr: {selectedParty.address}</span>}
                </div>

                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <span className="font-sans text-gray-500 dark:text-gray-400 font-medium">Due Date:</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">
                    {(() => {
                      if (!selectedParty?.paymentTerms) return "Due on Receipt";
                      const d = calculateDueDate(dispatchDate ? new Date(dispatchDate) : new Date(), selectedParty.paymentTerms);
                      const day = String(d.getDate()).padStart(2, "0");
                      const month = String(d.getMonth() + 1).padStart(2, "0");
                      const year = d.getFullYear();
                      const days = parsePaymentTermsDays(selectedParty.paymentTerms);
                      return `${day}-${month}-${year} (${days}d)`;
                    })()}
                  </span>
                </div>
              </div>

              {/* Credit Limit & Live Balance - Shows Opening Balance only if > 0 */}
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
            </div>
          )}
        </div>

        {/* Right Card: Challan & Transport Specifications */}
        <div className="glass-card rounded-xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-[#202936]">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200 mb-2">
            CHALLAN & VEHICLE SPECIFICATIONS*
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                CHALLAN NO
              </span>
              <input
                type="text"
                value={challanNo}
                onChange={(e) => setChallanNo(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono font-bold bg-gray-50 dark:bg-[#1a222c] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <span className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                DISPATCH DATE*
              </span>
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={dispatchDate}
                  onChange={(e) => setDispatchDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-[#1a222c] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <span className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                VEHICLE NO (OPTIONAL)
              </span>
              <input
                type="text"
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value)}
                placeholder="e.g. GJ-05-BX-1234"
                className="w-full px-3 py-2 text-sm uppercase bg-white dark:bg-[#1a222c] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <span className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                TRANSPORT / ANGAADIA
              </span>
              <input
                type="text"
                value={transportName}
                onChange={(e) => setTransportName(e.target.value)}
                placeholder="e.g. Surat Roadways"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-[#1a222c] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Dispatch Items Breakdown Table */}
      <div className="glass-card rounded-xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-[#202936] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
            DISPATCH ITEMS / MATERIALS BREAKDOWN
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowInventoryModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <Package size={14} className="text-blue-500" />
              <span>Add From Inventory</span>
            </button>
            <button
              type="button"
              onClick={handleAddItemRow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Item Row</span>
            </button>
          </div>
        </div>

        {/* Scrollable Items Table */}
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

                    {/* ITEM */}
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

                      {/* Autocomplete dropdown */}
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
                        <span className="absolute left-2.5 text-xs text-gray-400 pointer-events-none">
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
                          className="w-full h-9 pl-6 pr-2 text-xs font-mono bg-white dark:bg-[#1a222c] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </td>

                    {/* AMOUNT (₹) */}
                    <td className="py-2.5 px-2">
                      <div className="w-full h-9 px-3 flex items-center justify-start text-xs font-mono font-bold text-gray-800 dark:text-gray-200 bg-gray-50/70 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-lg">
                        ₹{row.amount.toFixed(2)}
                      </div>
                    </td>

                    {/* DELETE */}
                    <td className="py-2.5 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(index)}
                        disabled={items.length === 1}
                        className="text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 font-medium">
          <span>
            {items.length} {items.length === 1 ? "Item" : "Items"}
          </span>
        </div>
      </div>

      {/* 3. Bottom Grid: Remarks + Challan Dispatch Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Remarks Card */}
        <div className="glass-card rounded-xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-[#202936] space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
              DISPATCH REMARKS / NOTES:
            </label>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
                <Globe size={11} /> English
              </span>
            </div>
          </div>
          <textarea
            rows={4}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add driver contact, gate pass details, delivery instructions..."
            className="w-full p-3 text-xs bg-white dark:bg-[#1a222c] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
          />
        </div>

        {/* Challan Dispatch Summary */}
        <div className="glass-card rounded-xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-[#202936] flex flex-col justify-between space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200 mb-3">
              CHALLAN DISPATCH SUMMARY
            </label>
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                <span className="font-medium uppercase tracking-wider">ITEMS GROSS TOTAL:</span>
                <span className="font-mono font-bold text-gray-900 dark:text-gray-100">
                  ₹{itemsGrossTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                <span className="font-medium uppercase tracking-wider">TOTAL ITEMS:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {items.filter((it) => it.item || (it.amount && it.amount > 0)).length}{" "}
                  {items.filter((it) => it.item || (it.amount && it.amount > 0)).length === 1 ? "Item" : "Items"}
                </span>
              </div>
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <span className="font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
                  TOTAL VALUE (₹)*
                </span>
                <span className="font-mono font-extrabold text-base text-gray-900 dark:text-white">
                  ₹{itemsGrossTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Fixed Bottom Actions Bar */}
      <div className="fixed bottom-0 right-0 left-0 md:left-[var(--sidebar-width,16rem)] h-16 px-6 md:px-8 bg-white/95 dark:bg-[#202936]/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-700/80 flex items-center justify-end gap-3 z-40 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] transition-all duration-300">
        <Link
          href="/challans"
          className="px-5 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium transition-colors cursor-pointer"
        >
          Cancel
        </Link>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleSubmit}
          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>Update Delivery Challan</span>
            </>
          )}
        </button>
      </div>

      {/* Inventory Product Picker Modal */}
      <AnimatePresence>
        {showInventoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl glass-card rounded-2xl p-6 bg-white dark:bg-[#202936] border border-gray-200 dark:border-gray-700 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <Package className="text-blue-500" size={18} />
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                    Select Items from Inventory
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInventoryModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={inventorySearchQuery}
                  onChange={(e) => setInventorySearchQuery(e.target.value)}
                  placeholder="Search products by name, SKU or category..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Items List */}
              <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 border border-gray-100 dark:border-gray-800 rounded-lg">
                {modalFilteredInventory.length === 0 ? (
                  <p className="p-4 text-center text-xs text-gray-400">
                    No products found in inventory.
                  </p>
                ) : (
                  modalFilteredInventory.map((product) => {
                    const isSelected = selectedInventoryIds.includes(product.id);
                    return (
                      <div
                        key={product.id}
                        onClick={() => {
                          setSelectedInventoryIds((prev) =>
                            isSelected
                              ? prev.filter((id) => id !== product.id)
                              : [...prev, product.id]
                          );
                        }}
                        className={`p-3 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-blue-50/70 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800/60 text-gray-800 dark:text-gray-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <p className="font-semibold">{product.name}</p>
                            <p className="text-[11px] text-gray-400">
                              {product.category || "General"} • Stock: {product.quantity || 0}
                            </p>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          ₹{product.price || product.costPrice || 0}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-gray-500">
                  {selectedInventoryIds.length} item(s) selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowInventoryModal(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={selectedInventoryIds.length === 0}
                    onClick={handleAddSelectedInventory}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    Add to Challan
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
