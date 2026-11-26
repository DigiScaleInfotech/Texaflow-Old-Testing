"use client";

import React from "react";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
} from "chart.js";
import { motion } from "framer-motion";
import {
  CircleCheck,
  Clock,
  AlertCircle,
  BarChart3,
  Shirt,
  CircleDollarSign,
  ShoppingBag,
  Scissors,
  Package,
} from "lucide-react";
import Image from "next/image";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: "bottom" as const,
      labels: {
        boxWidth: 8,
        usePointStyle: true,
        pointStyle: "circle",
        padding: 20,
        color: "rgb(156, 163, 175)",
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      border: { dash: [4, 4] },
      grid: {
        color: "rgba(156, 163, 175, 0.1)",
        drawBorder: false,
      },
      ticks: {
        color: "rgb(156, 163, 175)",
        padding: 10,
      },
    },
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: "rgb(156, 163, 175)",
        padding: 10,
      },
    },
  },
  elements: {
    line: {
      tension: 0.4,
    },
    point: {
      radius: 4,
      borderWidth: 2,
      hoverRadius: 6,
    },
  },
};

const topCustomers = [
  {
    name: "Sunil Joshi",
    image: "/default-avatar.svg",
    transactions: 245,
    spending: "₹2.4M",
    trend: "+12%",
    type: "Manufacturer",
  },
  {
    name: "Priya Sharma",
    image: "/default-avatar.svg",
    transactions: 189,
    spending: "₹1.8M",
    trend: "+8%",
    type: "Wholesaler",
  },
  {
    name: "Rakesh Kumar",
    image: "/default-avatar.svg",
    transactions: 165,
    spending: "₹1.5M",
    trend: "+5%",
    type: "Distributor",
  },
  {
    name: "Anita Desai",
    image: "/default-avatar.svg",
    transactions: 142,
    spending: "₹1.2M",
    trend: "+3%",
    type: "Retailer",
  },
  {
    name: "Rajesh Patel",
    image: "/default-avatar.svg",
    transactions: 128,
    spending: "₹1.1M",
    trend: "+4%",
    type: "Manufacturer",
  },
  {
    name: "Meera Singh",
    image: "/default-avatar.svg",
    transactions: 112,
    spending: "₹980K",
    trend: "+2%",
    type: "Wholesaler",
  },
];

interface ChartData {
  labels: string[];
  salesData: number[];
  ordersData: number[];
  revenueData?: number[];
  customerData?: {
    purchases: number[];
    returns: number[];
  };
  inventoryData?: {
    inStock: number[];
    lowStock: number[];
  };
}

export const SalesChart = ({
  data,
  salesData
}: {
  data?: ChartData;
  salesData?: any;
}) => {
  const labels = salesData?.labels && salesData.labels.length > 0
    ? salesData.labels
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const currentWeekData = salesData?.salesData && salesData.salesData.length > 0
    ? salesData.salesData
    : [0, 0, 0, 0, 0, 0, 0];

  const lastWeekData = salesData?.lastWeekSalesData && salesData.lastWeekSalesData.length > 0
    ? salesData.lastWeekSalesData
    : [0, 0, 0, 0, 0, 0, 0];

  const chartData = {
    labels,
    datasets: [
      {
        label: "This Week",
        data: currentWeekData,
        borderColor: "rgb(99, 102, 241)",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        fill: true,
      },
      {
        label: "Last Week",
        data: lastWeekData,
        borderColor: "rgb(203, 213, 225)",
        backgroundColor: "rgba(203, 213, 225, 0.1)",
        fill: true,
      },
    ],
  };

  const topProducts = [
    {
      name: "Cotton Fabric",
      sales: 245,
      icon: <ShoppingBag size={18} />,
      trend: "+12%",
      color: "text-blue-500",
    },
    {
      name: "Silk Material",
      sales: 189,
      icon: <Shirt size={18} />,
      trend: "+8%",
      color: "text-purple-500",
    },
    {
      name: "Processing Units",
      sales: 165,
      icon: <Scissors size={18} />,
      trend: "+5%",
      color: "text-pink-500",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-gray-200 dark:border-gray-700/40 p-6 rounded-xl bg-white dark:bg-[#202936]"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Sales Overview
        </h3>
        <select className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <option>This Week</option>
          <option>Last Week</option>
        </select>
      </div>
      <div className="h-72">
        <Line
          options={{ ...options, maintainAspectRatio: false }}
          data={chartData}
        />
      </div>
    </motion.div>
  );
};

export const OrdersDistributionChart = ({
  data,
  ordersData,
  summary
}: {
  data?: ChartData;
  ordersData?: any;
  summary?: any;
}) => {
  const pendingCount = summary?.pendingOrders ?? (ordersData?.data ? ordersData.data[ordersData.labels?.indexOf("Pending") ?? 0] ?? 0 : 0);
  const processingCount = summary?.processingOrders ?? (ordersData?.data ? ordersData.data[ordersData.labels?.indexOf("Processing") ?? 1] ?? 0 : 0);
  const completedCount = (summary?.totalOrders ?? 0) - pendingCount - processingCount > 0 
    ? (summary?.totalOrders ?? 0) - pendingCount - processingCount 
    : (ordersData?.data ? ordersData.data[ordersData.labels?.indexOf("Delivered") ?? 3] ?? 0 : 0);

  const total = pendingCount + processingCount + completedCount;
  const chartData = {
    labels: ["Completed", "Processing", "Pending"],
    datasets: [
      {
        data: total > 0 ? [completedCount, processingCount, pendingCount] : [0, 0, 0],
        backgroundColor: [
          "rgb(34, 197, 94)",
          "rgb(99, 102, 241)",
          "rgb(251, 191, 36)",
        ],
        borderWidth: 0,
        borderRadius: 4,
      },
    ],
  };

  const orderStats = [
    {
      status: "Completed",
      count: completedCount,
      icon: <CircleCheck size={18} />,
      color: "text-green-500",
    },
    {
      status: "Processing",
      count: processingCount,
      icon: <Clock size={18} />,
      color: "text-blue-500",
    },
    {
      status: "Pending",
      count: pendingCount,
      icon: <AlertCircle size={18} />,
      color: "text-yellow-500",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-gray-200 dark:border-gray-700/40 p-5 rounded-xl bg-white dark:bg-[#202936] h-fit overflow-hidden"
    >
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Orders Overview
      </h3>
      <div className="flex flex-col items-center">
        <div className="w-44 h-44 mb-4">
          <Doughnut
            data={chartData}
            options={{
              ...options,
              maintainAspectRatio: true,
              plugins: { legend: { display: false } },
            }}
          />
        </div>
        <div className="w-full space-y-1 overflow-y-auto max-h-fit pr-2">
          {orderStats.map((stat) => (
            <div
              key={stat.status}
              className="flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className={`${stat.color}`}>{stat.icon}</div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {stat.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-semibold ${stat.color}`}>
                  {stat.count}
                </span>
                <span className="text-xs text-gray-500">orders</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export const ProductPerformanceChart = ({
  data,
  performanceData
}: {
  data?: ChartData;
  performanceData?: any;
}) => {
  const hasData =
    performanceData?.labels &&
    performanceData.labels.length > 0 &&
    performanceData?.data &&
    performanceData.data.some((v: number) => v > 0);

  const labels = hasData ? performanceData.labels : [];
  const counts = hasData ? performanceData.data : [];

  const chartData = {
    labels,
    datasets: [
      {
        label: "Sales Volume",
        data: counts,
        backgroundColor: [
          "rgba(99, 102, 241, 0.8)",
          "rgba(34, 197, 94, 0.8)",
          "rgba(251, 191, 36, 0.8)",
          "rgba(147, 51, 234, 0.8)",
          "rgba(239, 68, 68, 0.8)",
        ],
        borderRadius: 8,
      },
    ],
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="border border-gray-200 dark:border-gray-700/40 p-6 rounded-xl bg-white dark:bg-[#202936] h-fit"
    >
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Product Performance
      </h3>
      <div className="h-72">
        {hasData ? (
          <Bar
            options={{
              ...options,
              indexAxis: "y",
              maintainAspectRatio: false,
              plugins: {
                ...options.plugins,
                legend: { display: false },
              },
            }}
            data={chartData}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
            <Package size={44} className="mb-2 opacity-30" />
            <p className="text-sm">No product sales data available yet</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export const CustomerActivityChart = ({ data }: { data: ChartData }) => {
  const chartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Purchases",
        data: [280, 450, 380, 590, 480, 620],
        borderColor: "rgb(99, 102, 241)",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        fill: true,
        tension: 0.6,
      },
      {
        label: "Returns",
        data: [45, 82, 65, 90, 70, 85],
        borderColor: "rgb(239, 68, 68)",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        fill: true,
        tension: 0.6,
      },
    ],
  };

  const stats = [
    {
      title: "Active Buyers",
      value: "1,248",
      trend: "+12%",
      icon: <ShoppingBag size={18} />,
      color: "text-blue-500",
    },
    {
      title: "Avg. Purchase",
      value: "₹3,500",
      trend: "+8%",
      icon: <CircleDollarSign size={18} />,
      color: "text-green-500",
    },
    {
      title: "Return Rate",
      value: "8.5%",
      trend: "-2%",
      icon: <AlertCircle size={18} />,
      color: "text-red-500",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-gray-200 dark:border-gray-700/40 p-6 rounded-xl bg-white dark:bg-[#202936] h-fit"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Customer Activity
        </h3>
        <select className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <option>Last 6 Months</option>
          <option>This Year</option>
        </select>
      </div>
      <div className="h-[300px]">
        <Line
          options={{
            ...options,
            maintainAspectRatio: false,
            elements: { line: { tension: 0.6 } },
          }}
          data={chartData}
        />
      </div>
      <div className="mt-4 space-y-2">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.color} bg-opacity-10`}>
                {stat.icon}
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {stat.title}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {stat.value}
              </span>
              <span
                className={`text-sm ${
                  stat.trend === "0%"
                    ? "text-gray-400"
                    : stat.trend.startsWith("+")
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export const EarningsChart = ({
  data,
  earningsData,
  totalEarnings
}: {
  data?: ChartData;
  earningsData?: any;
  totalEarnings?: number;
}) => {
  const currentEarnings = totalEarnings !== undefined ? totalEarnings : 0;
  const hasEarnings = currentEarnings > 0 || (earningsData?.data && earningsData.data.some((d: number) => d > 0));
  const monthlyData = {
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    datasets: [
      {
        label: "Monthly Earnings",
        data: earningsData?.data || [
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, currentEarnings, 0
        ],
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.6,
      },
    ],
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-gray-200 dark:border-gray-700/40 p-6 rounded-xl bg-white dark:bg-[#202936] h-fit"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Monthly Earnings
        </h3>
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold text-emerald-500">₹{currentEarnings.toLocaleString('en-IN')}</div>
          <div className={`text-sm ${hasEarnings ? "text-emerald-500" : "text-gray-400"}`}>
            {hasEarnings ? "+100%" : "0%"}
          </div>
        </div>
      </div>
      <div className="h-80">
        <Line
          options={{
            ...options,
            maintainAspectRatio: false,
            plugins: { ...options.plugins, legend: { display: false } },
          }}
          data={monthlyData}
        />
      </div>
    </motion.div>
  );
};

export const YearlyRevenueChart = ({
  data,
  yearlyRevenue,
  totalRevenue
}: {
  data?: ChartData;
  yearlyRevenue?: any;
  totalRevenue?: number;
}) => {
  const currentYear = new Date().getFullYear();
  const labels = yearlyRevenue?.labels && yearlyRevenue.labels.length > 0
    ? yearlyRevenue.labels
    : ["2022", "2023", "2024", "2025", String(currentYear)];
  const revenueValues = yearlyRevenue?.data && yearlyRevenue.data.length > 0
    ? yearlyRevenue.data
    : [0, 0, 0, 0, totalRevenue || 0];

  const totalRev = totalRevenue !== undefined ? totalRevenue : (revenueValues.reduce((a: number, b: number) => a + Number(b || 0), 0) || 0);
  const hasRevenue = totalRev > 0 || revenueValues.some((v: number) => v > 0);

  const yearlyData = {
    labels,
    datasets: [
      {
        label: "Revenue",
        data: revenueValues,
        backgroundColor: [
          "rgba(99, 102, 241, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(139, 92, 246, 0.8)",
          "rgba(14, 165, 233, 0.8)",
        ],
        borderRadius: 6,
      },
    ],
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-gray-200 dark:border-gray-700/40 p-6 rounded-xl bg-white dark:bg-[#202936] h-fit"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Yearly Revenue
        </h3>
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold text-blue-500">₹{totalRev.toLocaleString('en-IN')}</div>
          <div className={`text-sm ${hasRevenue ? "text-blue-500" : "text-gray-400"}`}>
            {hasRevenue ? "+100%" : "0%"}
          </div>
        </div>
      </div>
      <div className="h-80">
        <Bar
          options={{
            ...options,
            maintainAspectRatio: false,
            plugins: { ...options.plugins, legend: { display: false } },
          }}
          data={yearlyData}
        />
      </div>
    </motion.div>
  );
};

export const InventoryStatusChart = ({
  data,
  inventoryData
}: {
  data?: ChartData;
  inventoryData?: any;
}) => {
  const [filter, setFilter] = React.useState<"Last Week" | "Last Month" | "Last Three Months" | "Last 6 Months" | "This Year">("Last 6 Months");

  const totalSKUs = inventoryData?.totalProducts ?? 0;
  const stockValue = inventoryData?.inventoryValue ?? 0;
  const lowStock = inventoryData?.lowStockProducts ?? 0;
  const inStock = inventoryData?.stockStatus?.data ? (inventoryData.stockStatus.data[0] || 0) : 0;

  const chartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "In Stock",
        data: [0, 0, 0, 0, 0, inStock],
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.6,
      },
      {
        label: "Low Stock Items",
        data: [0, 0, 0, 0, 0, lowStock],
        borderColor: "rgb(249, 115, 22)",
        backgroundColor: "rgba(249, 115, 22, 0.1)",
        fill: true,
        tension: 0.6,
      },
    ],
  };

  const stats = [
    {
      title: "Total SKUs",
      value: String(totalSKUs),
      trend: totalSKUs > 0 ? "+100%" : "0%",
      icon: <Package size={18} />,
      color: "text-blue-500",
    },
    {
      title: "Stock Value",
      value: `₹${stockValue.toLocaleString('en-IN')}`,
      trend: stockValue > 0 ? "+100%" : "0%",
      icon: <CircleDollarSign size={18} />,
      color: "text-green-500",
    },
    {
      title: "Low Stock Items",
      value: String(lowStock),
      trend: lowStock > 0 ? `+${lowStock}` : "0",
      icon: <AlertCircle size={18} />,
      color: "text-orange-500",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-gray-200 dark:border-gray-700/40 p-6 rounded-xl bg-white dark:bg-[#202936] h-fit"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Inventory Status
        </h3>
        <select
          className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          value={filter}
          onChange={(e : any) => setFilter(e.target.value)}
        >
          <option>Last Week</option>
          <option>Last Month</option>
          <option>Last Three Months</option>
          <option>Last 6 Months</option>
          <option>This Year</option>
        </select>
      </div>
      <div className="h-[300px]">
        <Line
          options={{
            ...options,
            maintainAspectRatio: false,
            elements: { line: { tension: 0.6 } },
          }}
          data={chartData}
        />
      </div>
      <div className="mt-4 space-y-2">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.color} bg-opacity-10`}>
                {stat.icon}
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {stat.title}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {stat.value}
              </span>
              <span
                className={`text-sm ${
                  stat.trend === "0%"
                    ? "text-gray-400"
                    : stat.trend.startsWith("+")
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export const TopCustomersList = ({
  customers
}: {
  customers?: any[];
}) => {
  const displayCustomers = customers && customers.length > 0
    ? customers.map((c) => ({
        name: c.name || "Customer",
        image: c.image || c.avatar || "/default-avatar.svg",
        transactions: c.totalOrders ?? c.transactions ?? 1,
        spending: `₹${(Number(c.totalSpent) || 0).toLocaleString('en-IN')}`,
        trend: "+100%",
        type: c.gender === "female" ? "Retailer" : "Wholesaler"
      }))
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-gray-200 dark:border-gray-700/40 p-6 rounded-xl bg-white dark:bg-[#202936]"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Top Customers
        </h3>
        <select className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <option>This Month</option>
          <option>Last Month</option>
        </select>
      </div>
      <div className="space-y-1">
        {/* Table Headers */}
        <div className="grid grid-cols-12 text-xs font-medium text-gray-500 dark:text-gray-400 pb-2 border-b border-gray-200 dark:border-gray-700/40">
          <div className="col-span-5">Customer</div>
          <div className="col-span-3 text-center">Transactions</div>
          <div className="col-span-4 text-right">Revenue</div>
        </div>
        {/* Customer List */}
        <div className="space-y-3 pt-3">
          {displayCustomers.length > 0 ? (
            displayCustomers.map((customer) => (
              <div
                key={customer.name}
                className="grid grid-cols-12 items-center py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
              >
                <div className="col-span-5 flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-gray-100 dark:border-gray-800">
                    <Image
                      src={customer.image}
                      alt={customer.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {customer.name}
                    </div>
                    <div className="text-xs text-gray-500">{customer.type}</div>
                  </div>
                </div>
                <div className="col-span-3 text-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {customer.transactions}
                  </span>
                </div>
                <div className="col-span-4 text-right flex items-center justify-end gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {customer.spending}
                  </span>
                  <span className="text-xs text-green-500">{customer.trend}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              No customers found.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
