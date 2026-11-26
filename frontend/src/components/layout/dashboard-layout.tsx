"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Receipt,
  Package,
  UserCircle,
  Building2,
  Store,
  Sun,
  Moon,
  Menu,
  ChevronLeft,
  ChevronRight,
  X,
  LogOut,
  Star,
  CalendarCheck,
  CreditCard, // Add this import for the salary icon
  Wallet,
  Truck,
  BookOpen,
} from "lucide-react";
import { TopNav } from "./top-nav";
import { authService } from "@/services/auth.service";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isDark, setIsDark] = React.useState(() => {
    // Load theme preference from localStorage or fallback to system preference
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      return savedTheme === "dark";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);
  const [isEmployeesSubMenuOpen, setIsEmployeesSubMenuOpen] = useState(false);

  // Detect if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsMinimized(true);
      }
    };

    // Get user type
    const currentUserType = localStorage.getItem("userType");
    setUserType(currentUserType);

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsMinimized(!isMinimized);
    }
  };

  const toggleEmployeesSubMenu = () => {
    setIsEmployeesSubMenuOpen(!isEmployeesSubMenuOpen);
  };

  // Logout function
  const handleLogout = async () => {
    await authService.logout();
    router.push("/auth/login");
  };

  // Close mobile sidebar when clicking a link
  const handleNavLinkClick = () => {
    if (isMobile && isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  // Define menu items - hide Vendors for vendor user type but add Subscription for vendors
  const menuItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard size={18} />,
    },
    { label: "Customers", href: "/customers", icon: <Users size={18} /> },
    { label: "Orders", href: "/orders", icon: <ShoppingCart size={18} /> },
    { label: "Challans", href: "/challans", icon: <Truck size={18} /> },
    { label: "Billing", href: "/billing", icon: <Receipt size={18} /> },
    { label: "Party Ledger", href: "/ledger", icon: <BookOpen size={18} /> },
    { label: "Expenses", href: "/expenses", icon: <Wallet size={18} /> },
    { label: "Inventory", href: "/inventory", icon: <Package size={18} /> },
    {
      label: "Employees",
      icon: <Building2 size={18} />,
      onClick: toggleEmployeesSubMenu,
      subMenu: [
        {
          label: "Employee List",
          href: "/employees",
          icon: <Users size={18} />,
        },
        {
          label: "Attendance",
          href: "/employees/attendance",
          icon: <CalendarCheck size={18} />,
        },
        {
          label: "Salary",
          href: "/employees/salary",
          icon: <CreditCard size={18} />,
        },
      ],
    },
    // Only show Vendors menu item for admin users
    ...(userType !== "vendor"
      ? [{ label: "Vendors", href: "/vendors", icon: <Store size={18} /> }]
      : []),
    // Add Subscription page for vendors
    ...(userType === "vendor"
      ? [
          {
            label: "Subscription",
            href: "/vendors/subscription",
            icon: <Star size={18} />,
          },
        ]
      : []),
    { label: "Profile", href: "/profile", icon: <UserCircle size={18} /> },
  ];

  return (
    <div className="min-h-screen text-sm flex font-['Plus_Jakarta_Sans'] bg-gray-50 dark:bg-gradient-to-br dark:from-[#202936] dark:to-[#202936] print:bg-white print:bg-none print:min-h-0 print:h-auto">
      {/* Overlay for mobile sidebar */}
      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar - Desktop: Normal, Mobile: Off-canvas */}
      <nav
        className={`
          ${
            isMobile
              ? "fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out w-64"
              : `fixed left-0 top-0 h-full ${
                  isMinimized ? "w-20" : "w-64"
                } transition-all duration-300`
          }
          ${isMobile && !isMobileOpen ? "-translate-x-full" : "translate-x-0"}
          glass-card border-r dark:border-gray-700 border-gray-300 flex flex-col print:hidden
        `}
      >
        {/* Sidebar Header */}
        {isMinimized && !isMobile ? (
          <div className="h-16 flex items-center justify-between px-3 border-b border-gray-200 dark:border-gray-800">
            <Link
              href="/dashboard"
              className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0"
              onClick={handleNavLinkClick}
              title="TextTile"
            >
              <span className="text-white font-bold">T</span>
            </Link>
            <button
              onClick={toggleSidebar}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        ) : (
          <div className="h-16 px-5 flex justify-between items-center border-b border-gray-200 dark:border-gray-800">
            <Link
              href="/dashboard"
              className="flex items-center space-x-3"
              onClick={handleNavLinkClick}
            >
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold">T</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
                TextTile
              </h1>
            </Link>

            {!isMobile && (
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft size={18} />
              </button>
            )}

            {isMobile && (
              <button
                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-400"
                onClick={() => setIsMobileOpen(false)}
                aria-label="Close sidebar"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* Navigation menu */}
        <ul
          className={`${
            isMinimized && !isMobile ? "px-2" : "px-4"
          } space-y-2 flex-1`}
        >
          {menuItems.map((item) =>
            item.subMenu ? (
              <li key={item.label}>
                <button
                  onClick={item.onClick}
                  className={`flex items-center gap-3 p-3 w-full rounded-lg transition-all ${
                    isEmployeesSubMenuOpen
                      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium"
                      : "text-gray-700 hover:text-gray-900 opacity-80 hover:opacity-100 hover:bg-gray-100/80 dark:text-gray-400 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
                  }`}
                >
                  {item.icon}
                  {(!isMinimized || isMobile) && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </button>
                {isEmployeesSubMenuOpen && (
                  <ul className="space-y-2 pl-4">
                    {item.subMenu.map((subItem) => (
                      <li key={subItem.label}>
                        <Link
                          href={subItem.href}
                          className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                            pathname === subItem.href
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium"
                              : "text-gray-700 hover:text-gray-900 opacity-80 hover:opacity-100 hover:bg-gray-100/80 dark:text-gray-400 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
                          }`}
                          onClick={handleNavLinkClick}
                        >
                          {subItem.icon}
                          {(!isMinimized || isMobile) && (
                            <span className="font-medium">{subItem.label}</span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ) : (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    pathname === item.href
                      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium"
                      : "text-gray-700 hover:text-gray-900 opacity-80 hover:opacity-100 hover:bg-gray-100/80 dark:text-gray-400 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
                  }`}
                  onClick={handleNavLinkClick}
                >
                  {item.icon}
                  {(!isMinimized || isMobile) && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </Link>
              </li>
            )
          )}
        </ul>

        {/* Logout button at bottom */}
        <div
          className={`mt-auto mb-6 ${
            isMinimized && !isMobile ? "px-2" : "px-4"
          }`}
        >
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 w-full rounded-lg transition-all text-red-500 hover:bg-red-500/10 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
          >
            <LogOut size={18} />
            {(!isMinimized || isMobile) && (
              <span className="font-medium">Logout</span>
            )}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div
        style={
          {
            "--sidebar-width": isMobile
              ? "0px"
              : isMinimized
              ? "5rem"
              : "16rem",
          } as React.CSSProperties
        }
        className={`flex-1 ${
          isMobile ? "ml-0" : isMinimized ? "ml-20" : "ml-64"
        } transition-all duration-300 w-full overflow-hidden print:ml-0 print:w-full print:p-0 print:overflow-visible`}
      >
        <div className="print:hidden">
          <TopNav
            isMinimized={isMinimized}
            isDark={isDark}
            toggleDarkMode={toggleDarkMode}
            toggleSidebar={toggleSidebar}
            isMobile={isMobile}
            isMobileOpen={isMobileOpen}
            userType={userType}
          />
        </div>
        {/* Make sure this content area is scrollable */}
        <div className="p-4 md:p-8 overflow-y-auto h-[calc(100vh-64px)] print:h-auto print:overflow-visible print:p-0 print:m-0">
          {children}
        </div>
      </div>
    </div>
  );
};
