"use client";

import { Menu, Moon, Sun, Plus, ArrowLeft, Search, X } from "lucide-react";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface TopNavProps {
  isMinimized: boolean;
  isDark: boolean;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  isMobile?: boolean;
  isMobileOpen?: boolean;
  userType?: string | null;
}

const getPageTitle = (path: string): string => {
  if (path === "/dashboard") return "Dashboard Overview";
  if (path === "/customers") return "Customer Management";
  if (path === "/customers/add") return "Add Customer";
  if (path.startsWith("/customers/edit")) return "Edit Customer";
  if (path.startsWith("/customers/")) return "Customer Details";

  if (path === "/orders") return "Order Management";
  if (path === "/orders/add") return "Create New Order";
  if (path.startsWith("/orders/edit")) return "Edit Order";
  if (path.startsWith("/orders/")) return "Order Details";

  if (path === "/challans") return "Delivery Challans";
  if (path === "/challans/add") return "New Delivery Challan";
  if (path.startsWith("/challans/")) return "Challan Details";

  if (path === "/billing") return "Billing & Payments";
  if (path === "/billing/add") return "Create Invoice";
  if (path.startsWith("/billing/edit")) return "Edit Invoice";
  if (path.startsWith("/billing/")) return "Invoice Details";

  if (path === "/ledger") return "Party Ledger";
  if (path === "/expenses") return "Expense Management";
  if (path === "/expenses/add") return "Add Expense";
  if (path.startsWith("/expenses/edit")) return "Edit Expense";
  if (path === "/finance") return "Finance & Accounts";

  if (path === "/inventory") return "Inventory Management";
  if (path === "/inventory/add") return "Add Inventory Item";
  if (path.startsWith("/inventory/edit")) return "Edit Inventory Item";
  if (path.startsWith("/inventory/")) return "Product Details";

  if (path === "/employees") return "Employee Management";
  if (path === "/employees/add") return "Add New Employee";
  if (path === "/employees/attendance") return "Attendance Management";
  if (path === "/employees/salary") return "Salary Management";
  if (path.startsWith("/employees/edit")) return "Edit Employee";
  if (path.startsWith("/employees/")) return "Employee Details";

  if (path === "/vendors") return "Vendor Management";
  if (path === "/vendors/add") return "Add New Vendor";
  if (path === "/vendors/applications") return "Vendor Applications";
  if (path.startsWith("/vendors/applications/")) return "Vendor Application";
  if (path === "/vendors/subscription") return "My Subscription";
  if (path === "/vendors/settings") return "Vendor Settings";
  if (path.startsWith("/vendors/edit")) return "Edit Vendor";
  if (path.startsWith("/vendors/")) return "Vendor Details";

  if (path === "/profile") return "Profile Settings";

  return "Dashboard";
};

const getBackRoute = (path: string): string | null => {
  if (path.startsWith("/customers/") && path !== "/customers") return "/customers";
  if (path.startsWith("/orders/") && path !== "/orders") return "/orders";
  if (path.startsWith("/challans/") && path !== "/challans") return "/challans";
  if (path.startsWith("/billing/") && path !== "/billing") return "/billing";
  if (path.startsWith("/expenses/") && path !== "/expenses") return "/expenses";
  if (path.startsWith("/inventory/") && path !== "/inventory") return "/inventory";
  if (path.startsWith("/employees/") && path !== "/employees") return "/employees";
  if (path.startsWith("/vendors/") && path !== "/vendors") return "/vendors";
  return null;
};

export const TopNav: React.FC<TopNavProps> = ({
  isMinimized,
  isDark,
  toggleDarkMode,
  toggleSidebar,
  isMobile = false,
  isMobileOpen = false,
  userType = null,
}) => {
  const pathname = usePathname();
  const [financeSearch, setFinanceSearch] = useState("");
  const [financeTab, setFinanceTab] = useState("payments");

  useEffect(() => {
    const handleTabChange = (e: any) => {
      if (e.detail) {
        setFinanceTab(e.detail);
        setFinanceSearch("");
      }
    };
    window.addEventListener("finance-tab-changed", handleTabChange);
    return () => window.removeEventListener("finance-tab-changed", handleTabChange);
  }, []);

  const handleToggleDarkMode = () => {
    toggleDarkMode();
    localStorage.setItem("theme", isDark ? "light" : "dark");
  };

  const handleFinanceSearchChange = (val: string) => {
    setFinanceSearch(val);
    window.dispatchEvent(new CustomEvent("finance-search", { detail: val }));
    window.dispatchEvent(new CustomEvent("ledger-search", { detail: val }));
    window.dispatchEvent(new CustomEvent("expense-search", { detail: val }));
  };

  const getFinancePlaceholder = () => {
    if (pathname === "/ledger") return "Search party ledger...";
    if (pathname === "/expenses") return "Search expenses...";
    switch (financeTab) {
      case "payments":
        return "Search payments...";
      case "ledger":
        return "Search party ledger...";
      case "expenses":
        return "Search expenses...";
      case "outstanding":
        return "Search outstanding...";
      default:
        return "Search in Finance...";
    }
  };

  return (
    <div className="h-16 border-b border-gray-300 dark:border-gray-700/40 flex items-center justify-between px-4 md:px-8 bg-white dark:bg-[#202936]">
      {/* Page Title & Mobile Menu Button */}
      <div className="flex items-center gap-3">
        {isMobile && (
          <button
            onClick={toggleSidebar}
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle menu"
          >
            <Menu size={18} className="text-gray-700 dark:text-gray-300" />
          </button>
        )}
        {getBackRoute(pathname) && (
          <Link
            href={getBackRoute(pathname)!}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            title="Back"
          >
            <ArrowLeft size={18} />
          </Link>
        )}
        <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white tracking-tight whitespace-nowrap">
          {getPageTitle(pathname)}
        </h1>
      </div>

      {/* Center: Search bar for Finance / Ledger / Expenses Page */}
      {(pathname === "/finance" || pathname === "/ledger" || pathname === "/expenses") && (
        <div className="flex-1 max-w-sm md:max-w-md mx-4 relative hidden sm:block">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder={getFinancePlaceholder()}
            value={financeSearch}
            onChange={(e) => handleFinanceSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
          />
          {financeSearch && (
            <button
              onClick={() => handleFinanceSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* Right Controls Area: Page-Specific Actions + Theme & User */}
      <div className="flex items-center gap-3">
        {/* Dashboard Range Filter in TopNav */}
        {pathname === "/dashboard" && (
          <select className="text-xs md:text-sm bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>This Year</option>
          </select>
        )}

        <button
          onClick={handleToggleDarkMode}
          className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle dark mode"
        >
          {isDark ? (
            <Sun size={18} className="text-gray-700 dark:text-gray-300" />
          ) : (
            <Moon size={18} className="text-gray-700" />
          )}
        </button>

        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
            <span className="text-white font-medium">
              {userType === "vendor" ? "V" : "A"}
            </span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-800 dark:text-white">
              {userType === "vendor" ? "Vendor User" : "Admin User"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {userType === "vendor"
                ? "vendor@texttile.com"
                : "admin@texttile.com"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
