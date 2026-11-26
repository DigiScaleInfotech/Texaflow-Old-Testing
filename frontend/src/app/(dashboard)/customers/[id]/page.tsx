"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  UserCircle,
  Edit,
  Trash2,
  FileText,
  ChevronDown,
  CheckCircle,
  XCircle,
  Clock,
  Building,
  Package,
  UserCheck,
  Users,
  CreditCard,
  Truck,
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Customer } from "@/types";
import Image from "next/image";
import { customerService } from "@/services/customer.service";
import { formatShortId } from "@/utils/format";

// Component for customer status badge
const CustomerStatusBadge = ({ status }: { status: string }) => {
  const getStatusDetails = (status: string) => {
    switch (status) {
      case "active":
        return {
          bgColor: "bg-green-100 dark:bg-green-500/10",
          textColor: "text-green-600 dark:text-green-400",
          icon: <CheckCircle size={14} />,
        };
      case "inactive":
        return {
          bgColor: "bg-red-100 dark:bg-red-500/10",
          textColor: "text-red-600 dark:text-red-400",
          icon: <XCircle size={14} />,
        };
      case "new":
        return {
          bgColor: "bg-blue-100 dark:bg-blue-500/10",
          textColor: "text-blue-600 dark:text-blue-400",
          icon: <Clock size={14} />,
        };
      default:
        return {
          bgColor: "bg-gray-100 dark:bg-gray-700/50",
          textColor: "text-gray-600 dark:text-gray-400",
          icon: null,
        };
    }
  };

  const { bgColor, textColor, icon } = getStatusDetails(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}
    >
      {icon}
      <span className="capitalize">{status}</span>
    </span>
  );
};

export default function CustomerDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeActionMenu, setActiveActionMenu] = useState(false);

  // Function to get profile image - defaults to clean neutral avatar
  const getProfileImage = (customerData: any) => {
    return customerData?.image || customerData?.avatar || "/default-avatar.svg";
  };

  const getFormattedBillingAddress = () => {
    if (customer?.billingAddress && typeof customer.billingAddress === "object") {
      const b = customer.billingAddress;
      const parts = [b.attention, b.street1, b.street2, b.city, b.state, b.pinCode, b.country]
        .map((x: any) => (x ? String(x).trim() : ""))
        .filter(Boolean);
      if (parts.length > 0) return parts.join(", ");
    }
    if (typeof customer?.address === "object" && customer?.address) {
      const a = customer.address;
      const parts = [a.street, a.city, a.state, a.zip, a.country]
        .map((x: any) => (x ? String(x).trim() : ""))
        .filter(Boolean);
      if (parts.length > 0) return parts.join(", ");
    }
    if (typeof customer?.address === "string" && customer.address.trim()) {
      return customer.address.trim();
    }
    return null;
  };

  const getFormattedShippingAddress = () => {
    if (customer?.shippingAddress && typeof customer.shippingAddress === "object") {
      const s = customer.shippingAddress;
      const parts = [s.attention, s.street1, s.street2, s.city, s.state, s.pinCode, s.country]
        .map((x: any) => (x ? String(x).trim() : ""))
        .filter(Boolean);
      if (parts.length > 0) return parts.join(", ");
    }
    return null;
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    try {
      await customerService.deleteCustomer(params.id);
      router.push("/customers");
    } catch (err: any) {
      alert(err?.message || "Failed to delete customer");
    }
  };

  // Add click outside handler to close the menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (activeActionMenu && !target.closest(".action-menu-container")) {
        setActiveActionMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeActionMenu]);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setIsLoading(true);
        const data = await customerService.getCustomerById(params.id);
        if (data) {
          setCustomer(data);
        }
      } catch (err) {
        console.error("Error fetching customer:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchCustomer();
    }
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading customer profile...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-center">
        <p className="text-base text-gray-700 dark:text-gray-300">Customer not found.</p>
        <Link
          href="/customers"
          className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600"
        >
          Back to Customers
        </Link>
      </div>
    );
  }

  const recentOrders = customer.recentOrders || [];
  const purchasedProducts = customer.recentProducts || [];

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/customers"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {customer.name || customer.displayName || "Customer Profile"}
            </h1>
            <p className="text-sm text-gray-500 font-mono" title={customer.cus_id || customer.id}>
              ID: {formatShortId(customer.cus_id || customer.id, "CUST")} • Joined:{" "}
              {customer.createdAt || customer.joiningDate
                ? new Date(customer.createdAt || customer.joiningDate).toLocaleDateString()
                : "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative group action-menu-container">
            <button
              onClick={() => setActiveActionMenu(!activeActionMenu)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronDown size={16} />
              Actions
            </button>
            {activeActionMenu && (
              <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <button
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    role="menuitem"
                  >
                    <FileText size={14} className="mr-3" />
                    Create Order
                  </button>
                  <button
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    role="menuitem"
                    onClick={() =>
                      router.push(`/customers/edit/${customer.id}`)
                    }
                  >
                    <Edit size={14} className="mr-3" />
                    Edit Customer
                  </button>
                  <button
                    className="flex w-full items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    role="menuitem"
                    onClick={handleDelete}
                  >
                    <Trash2 size={14} className="mr-3" />
                    Delete Customer
                  </button>
                </div>
              </div>
            )}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Mail size={16} />
            Contact
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
            <FileText size={16} />
            Create Order
          </button>
        </div>
      </div>

      {/* Credit Limit & Financial Balance Widget */}
      <div className="glass-card rounded-xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-[#202936]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-500" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              Credit Limit & Live Balance
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold">
              Terms: {customer.paymentTerms || "Due on Receipt"}
            </span>
          </div>
          {(Number(customer.creditLimit) || 0) > 0 && (
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {Math.min(
                100,
                Math.round(
                  ((Number(customer.totalOutstanding ?? customer.usedCredit ?? 0)) /
                    (Number(customer.creditLimit) || 1)) *
                    100
                )
              )}
              % Credit Utilized
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-lg bg-gray-50 dark:bg-[#1a222c] border border-gray-100 dark:border-gray-800">
            <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Credit Limit
            </span>
            <span className="text-lg font-bold font-mono text-gray-900 dark:text-white">
              {(Number(customer.creditLimit) || 0) > 0
                ? `₹${(Number(customer.creditLimit) || 0).toLocaleString()}`
                : "Unlimited"}
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-gray-50 dark:bg-[#1a222c] border border-gray-100 dark:border-gray-800">
            <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Opening Balance
            </span>
            <span className="text-lg font-bold font-mono text-gray-900 dark:text-white">
              ₹{(Number(customer.openingBalance) || 0).toLocaleString()}
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
            <span className="block text-xs font-medium text-rose-600 dark:text-rose-400 mb-1">
              Used / Outstanding
            </span>
            <span className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400">
              ₹{(Number(customer.totalOutstanding ?? customer.usedCredit ?? 0)).toLocaleString()}
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
            <span className="block text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">
              Available Credit
            </span>
            <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {(Number(customer.creditLimit) || 0) > 0
                ? `₹${(
                    Number(
                      customer.availableCredit ??
                        Math.max(
                          0,
                          (Number(customer.creditLimit) || 0) -
                            (Number(customer.totalOutstanding) || 0)
                        )
                    )
                  ).toLocaleString()}`
                : "Unlimited"}
            </span>
          </div>
        </div>

        {/* Progress Bar if credit limit is set */}
        {(Number(customer.creditLimit) || 0) > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  (Number(customer.totalOutstanding ?? 0)) /
                    (Number(customer.creditLimit) || 1) >
                  0.9
                    ? "bg-rose-500"
                    : (Number(customer.totalOutstanding ?? 0)) /
                        (Number(customer.creditLimit) || 1) >
                      0.75
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      ((Number(customer.totalOutstanding ?? 0)) /
                        (Number(customer.creditLimit) || 1)) *
                        100
                    )
                  )}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Customer Info Card */}
      <div className="glass-card rounded-xl p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Basic Info */}
          <div className="lg:col-span-1">
            <div className="flex flex-col items-center sm:items-start gap-4">
              <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="relative h-full w-full">
                  <Image
                    src={getProfileImage(customer)}
                    alt={customer.name}
                    fill
                    className="object-cover bg-white dark:bg-gray-800"
                  />
                </div>
              </div>

              <div className="space-y-4 w-full">
                <div className="flex justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">
                      Status
                    </div>
                    <CustomerStatusBadge status={customer.status || "active"} />
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-500 mb-1">
                      Credit Limit
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white font-mono">
                      ₹{(Number(customer.creditLimit) || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t dark:border-gray-700 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">
                      Total Orders
                    </div>
                    <div className="text-lg font-medium text-gray-900 dark:text-white font-mono">
                      {customer.totalOrders || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">
                      Total Spent
                    </div>
                    <div className="text-lg font-medium text-gray-900 dark:text-white font-mono">
                      ₹{(Number(customer.totalSpent) || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle - Contact Info */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-500 mb-2">
                  Contact Information
                </div>
                <div className="space-y-3">
                  {customer.email ? (
                    <div className="flex items-center gap-3">
                      <Mail size={16} className="text-gray-500 flex-shrink-0" />
                      <a
                        href={`mailto:${customer.email}`}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                      >
                        {customer.email}
                      </a>
                    </div>
                  ) : null}
                  {(customer.workPhone || (customer.phone && customer.phone !== customer.mobile)) && (
                    <div className="flex items-center gap-3">
                      <Phone size={16} className="text-gray-500 flex-shrink-0" />
                      <a
                        href={`tel:${customer.workPhone || customer.phone}`}
                        className="text-sm text-gray-700 dark:text-gray-300 font-mono"
                      >
                        {customer.workPhone || customer.phone} (Work)
                      </a>
                    </div>
                  )}
                  {customer.mobile && (
                    <div className="flex items-center gap-3">
                      <Phone size={16} className="text-gray-500 flex-shrink-0" />
                      <a
                        href={`tel:${customer.mobile}`}
                        className="text-sm text-gray-700 dark:text-gray-300 font-mono"
                      >
                        {customer.mobile} (Mobile)
                      </a>
                    </div>
                  )}
                  {customer.gstNumber && (
                    <div className="flex items-center gap-3">
                      <FileText size={16} className="text-gray-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                        {customer.gstNumber} (GSTIN)
                      </span>
                    </div>
                  )}
                  {customer.pan && (
                    <div className="flex items-center gap-3">
                      <FileText size={16} className="text-gray-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                        {customer.pan} (PAN)
                      </span>
                    </div>
                  )}
                  {getFormattedBillingAddress() && (
                    <div className="flex items-start gap-3">
                      <MapPin size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
                      <address className="not-italic text-sm text-gray-700 dark:text-gray-300">
                        {getFormattedBillingAddress()}
                      </address>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t dark:border-gray-700">
                <div className="text-sm font-medium text-gray-500 mb-2">
                  Account Details
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Account Type</div>
                    <div className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                      {customer.accountType || "Customer"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Language</div>
                    <div className="text-sm text-gray-800 dark:text-gray-200">
                      {customer.partyLanguage || "ENGLISH"}
                    </div>
                  </div>
                  {customer.companyName && (
                    <div className="col-span-2">
                      <div className="text-xs text-gray-500 mb-1">Company Name</div>
                      <div className="text-sm text-gray-800 dark:text-gray-200">
                        {customer.companyName}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Financial & Notes */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-500 mb-2">
                  Payment Information
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">
                      Payment Terms (Credit)
                    </div>
                    <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {customer.paymentTerms || "Due on Receipt"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">
                      Opening Balance
                    </div>
                    <div className="text-sm text-gray-800 dark:text-gray-200 font-mono">
                      ₹{(Number(customer.openingBalance) || 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">
                      Currency
                    </div>
                    <div className="text-sm text-gray-800 dark:text-gray-200">
                      {customer.currency || "INR"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">
                      MSME
                    </div>
                    <div className="text-sm text-gray-800 dark:text-gray-200">
                      {customer.isMsmeRegistered
                        ? customer.msmeType || "Registered"
                        : "No"}
                    </div>
                  </div>
                  {customer.isMsmeRegistered && customer.msmeRegNumber && (
                    <div className="col-span-2">
                      <div className="text-xs text-gray-500 mb-1">
                        MSME Reg Number
                      </div>
                      <div className="text-sm text-gray-800 dark:text-gray-200 font-mono">
                        {customer.msmeRegNumber}
                      </div>
                    </div>
                  )}
                  {customer.tds && (
                    <div className="col-span-2">
                      <div className="text-xs text-gray-500 mb-1">
                        TDS
                      </div>
                      <div className="text-sm text-gray-800 dark:text-gray-200">
                        {customer.tds}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {(customer.remarks || customer.notes) && (
                <div className="pt-4 border-t dark:border-gray-700">
                  <div className="text-sm font-medium text-gray-500 mb-2">
                    Remarks / Notes
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {customer.remarks || customer.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Tab Details Sections (Shipping, Brokerage, Bank, Contact Persons) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Shipping Address Card */}
        {getFormattedShippingAddress() && (
          <div className="glass-card rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white border-b dark:border-gray-700 pb-2">
              <Truck size={16} className="text-blue-500" />
              Shipping Address
            </div>
            <div className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
              {customer.shippingAddress?.attention && (
                <p className="font-medium text-gray-900 dark:text-white">
                  Attn: {customer.shippingAddress.attention}
                </p>
              )}
              <p>{getFormattedShippingAddress()}</p>
              {customer.shippingAddress?.phone && (
                <p className="font-mono text-xs text-gray-500">
                  Phone: {customer.shippingAddress.phone}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Brokerage Card */}
        {customer.brokerage &&
          (customer.brokerage.brokerName ||
            customer.brokerage.percentage ||
            customer.brokerage.mobile ||
            customer.brokerage.workPhone ||
            customer.brokerage.email) && (
            <div className="glass-card rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white border-b dark:border-gray-700 pb-2">
                <UserCheck size={16} className="text-blue-500" />
                Brokerage Information
              </div>
              <div className="space-y-2 text-sm">
                {customer.brokerage.brokerName && (
                  <div>
                    <span className="text-xs text-gray-500 block">Broker Name</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {customer.brokerage.brokerName}
                    </span>
                  </div>
                )}
                {customer.brokerage.percentage && (
                  <div>
                    <span className="text-xs text-gray-500 block">Brokerage (%)</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                      {customer.brokerage.percentage}%
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs text-gray-700 dark:text-gray-300">
                  {customer.brokerage.mobile && (
                    <div>
                      <span className="text-gray-400 block text-[10px]">Mobile</span>
                      {customer.brokerage.mobile}
                    </div>
                  )}
                  {customer.brokerage.workPhone && (
                    <div>
                      <span className="text-gray-400 block text-[10px]">Work Phone</span>
                      {customer.brokerage.workPhone}
                    </div>
                  )}
                </div>
                {customer.brokerage.email && (
                  <div className="pt-1 text-xs">
                    <span className="text-gray-400 block text-[10px]">Email</span>
                    <span className="text-blue-600 dark:text-blue-400">
                      {customer.brokerage.email}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Bank Details Card */}
        {customer.bankDetails &&
          (customer.bankDetails.bankName ||
            customer.bankDetails.accountNumber ||
            customer.bankDetails.accountHolderName ||
            customer.bankDetails.ifsc ||
            customer.bankDetails.upiId) && (
            <div className="glass-card rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white border-b dark:border-gray-700 pb-2">
                <CreditCard size={16} className="text-blue-500" />
                Bank Details
              </div>
              <div className="space-y-2 text-sm">
                {customer.bankDetails.bankName && (
                  <div>
                    <span className="text-xs text-gray-500 block">Bank Name</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {customer.bankDetails.bankName}
                    </span>
                  </div>
                )}
                {customer.bankDetails.accountHolderName && (
                  <div>
                    <span className="text-xs text-gray-500 block">Account Holder</span>
                    <span className="text-gray-800 dark:text-gray-200">
                      {customer.bankDetails.accountHolderName}
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                  {customer.bankDetails.accountNumber && (
                    <div>
                      <span className="text-gray-400 block text-[10px]">Account No</span>
                      <span className="text-gray-900 dark:text-white font-semibold">
                        {customer.bankDetails.accountNumber}
                      </span>
                    </div>
                  )}
                  {customer.bankDetails.ifsc && (
                    <div>
                      <span className="text-gray-400 block text-[10px]">IFSC Code</span>
                      <span className="text-gray-900 dark:text-white">
                        {customer.bankDetails.ifsc}
                      </span>
                    </div>
                  )}
                </div>
                {customer.bankDetails.upiId && (
                  <div className="pt-1 text-xs font-mono">
                    <span className="text-gray-400 block text-[10px]">UPI ID</span>
                    <span className="text-blue-600 dark:text-blue-400">
                      {customer.bankDetails.upiId}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
      </div>

      {/* Contact Persons Table (if added) */}
      {Array.isArray(customer.contactPersons) && customer.contactPersons.length > 0 && (
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-blue-500" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Contact Persons
            </h2>
          </div>
          <div className="overflow-x-auto -mx-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Contact Person Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Designation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Phone / Mobile
                  </th>
                </tr>
              </thead>
              <tbody>
                {customer.contactPersons.map((contact: any, idx: number) => (
                  <tr
                    key={contact.id || idx}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {contact.name || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {contact.designation || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 font-mono">
                      {contact.phone || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Products Section */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Purchased Products
          </h2>
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            View All
          </button>
        </div>
        <div className="overflow-x-auto -mx-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Product ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Last Purchased
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Price
                </th>
              </tr>
            </thead>
            <tbody>
              {purchasedProducts.length > 0 ? (
                purchasedProducts.map((product: any) => (
                  <tr
                    key={product.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 font-mono">
                      {product.id}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <Package size={14} className="text-blue-500" />
                        {product.name || product.productName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 font-mono">
                      {product.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {product.lastPurchased
                        ? new Date(product.lastPurchased).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-700 dark:text-gray-300 font-mono">
                      ₹{(Number(product.price || product.unitPrice) || 0).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No purchased products recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Recent Orders
          </h2>
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            View All
          </button>
        </div>
        <div className="overflow-x-auto -mx-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length > 0 ? (
                recentOrders.map((order: any) => (
                  <tr
                    key={order.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-6 py-4 text-sm font-medium font-mono text-blue-600 dark:text-blue-400 hover:underline">
                      <Link href={`/orders/${order.id}`}>
                        {formatShortId(order.id, "ORD")}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {order.date || order.orderDate
                        ? new Date(order.date || order.orderDate).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-gray-700 dark:text-gray-300 font-mono">
                      {order.itemCount ?? order.items ?? (Array.isArray(order.items) ? order.items.length : 1)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs capitalize ${
                          order.status === "delivered" || order.status === "completed"
                            ? "bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400"
                            : order.status === "processing"
                            ? "bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                            : "bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        }`}
                      >
                        {order.status || "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-gray-900 dark:text-white font-mono">
                      ₹{(Number(order.total || order.amount) || 0).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No orders placed yet by this customer.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
