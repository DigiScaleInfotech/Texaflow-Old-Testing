'use client';

import { useState, useEffect } from 'react';
import { DashboardCard } from '@/components/ui/dashboard-card';
import { 
  SalesChart, 
  OrdersDistributionChart, 
  ProductPerformanceChart,
  InventoryStatusChart,
  EarningsChart,
  YearlyRevenueChart,
  TopCustomersList
} from '@/components/ui/dashboard-charts';
import { 
  ShoppingCart, 
  Users, 
  Package, 
  Receipt, 
  Store, 
  Building2,
  TrendingUp,
  Clock,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { dashboardService } from '@/services/dashboard.service';

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [ordersData, setOrdersData] = useState<any>(null);
  const [inventoryData, setInventoryData] = useState<any>(null);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [yearlyRevenue, setYearlyRevenue] = useState<any>(null);
  const [productPerformance, setProductPerformance] = useState<any>(null);
  const [salesData, setSalesData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [sumRes, ordersRes, invRes, custRes, revRes, prodRes, salesRes] = await Promise.allSettled([
          dashboardService.getSummary(),
          dashboardService.getOrdersData(),
          dashboardService.getInventoryData(),
          dashboardService.getTopCustomers(),
          dashboardService.getYearlyRevenue(),
          dashboardService.getProductPerformance(),
          dashboardService.getSalesData(),
        ]);

        if (sumRes.status === 'fulfilled' && sumRes.value) setSummary(sumRes.value);
        if (ordersRes.status === 'fulfilled' && ordersRes.value) setOrdersData(ordersRes.value);
        if (invRes.status === 'fulfilled' && invRes.value) setInventoryData(invRes.value);
        if (custRes.status === 'fulfilled' && custRes.value) setTopCustomers(custRes.value.customers || []);
        if (revRes.status === 'fulfilled' && revRes.value) setYearlyRevenue(revRes.value);
        if (prodRes.status === 'fulfilled' && prodRes.value) setProductPerformance(prodRes.value);
        if (salesRes.status === 'fulfilled' && salesRes.value) setSalesData(salesRes.value);
      } catch (err) {
        console.error('Error fetching dashboard summary:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    salesData: [65, 59, 80, 81, 56, 89],
    ordersData: [30, 40, 35, 50, 49, 60],
    revenueData: [],
    customerData: {
      purchases: [180, 220, 205, 240, 280, 260],
      returns: [20, 18, 25, 22, 30, 28]
    },
    inventoryData: {
      inStock: [320, 350, 305, 390, 400, 380],
      lowStock: [80, 65, 90, 70, 55, 75]
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 dark:bg-[#202936]"
    >
      {/* Stats cards grid */} 
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* First line */}
        <DashboardCard
          title="Total Orders"
          value={String(summary?.totalOrders ?? 0)}
          icon={<ShoppingCart className="text-blue-500" />}
          trend={{ value: summary?.trends?.orders?.percentChange ?? 0, isPositive: summary?.trends?.orders?.isPositive ?? true }}
        />
        <DashboardCard
          title="Processing Orders"
          value={String(summary?.processingOrders ?? 0)}
          icon={<Clock className="text-pink-500" />}
          trend={{ value: summary?.trends?.processingOrders?.percentChange ?? 0, isPositive: summary?.trends?.processingOrders?.isPositive ?? true }}
        />
        <DashboardCard
          title="Pending Orders"
          value={String(summary?.pendingOrders ?? 0)}
          icon={<AlertCircle className="text-orange-500" />}
          trend={{ value: summary?.trends?.pendingOrders?.percentChange ?? 0, isPositive: summary?.trends?.pendingOrders?.isPositive ?? false }}
        />
        <DashboardCard
          title="Inventory Items"
          value={String(summary?.inventoryItems ?? 0)}
          icon={<Package className="text-purple-500" />}
          trend={{ value: summary?.trends?.inventory?.percentChange ?? 0, isPositive: summary?.trends?.inventory?.isPositive ?? true }}
        />

        {/* Second line */}
        <DashboardCard
          title="Total Customers"
          value={String(summary?.totalCustomers ?? 0)}
          icon={<Users className="text-green-500" />}
          trend={{ value: summary?.trends?.customers?.percentChange ?? 0, isPositive: summary?.trends?.customers?.isPositive ?? true }}
        />
        <DashboardCard
          title="Total Employees"
          value={String(summary?.totalEmployees ?? 0)}
          icon={<Building2 className="text-indigo-500" />}
          trend={{ value: 0, isPositive: true }}
        />
        <DashboardCard
          title="Overdue Payments"
          value={`₹${(summary?.overdueAmount ?? 0).toLocaleString('en-IN')}`}
          icon={<AlertCircle className="text-rose-500" />}
          trend={
            summary?.overdueCount
              ? { value: summary.overdueCount, isPositive: false }
              : undefined
          }
        />
        <DashboardCard
          title="Revenue"
          value={`₹${(summary?.revenue ?? 0).toLocaleString('en-IN')}`}
          icon={<Receipt className="text-yellow-500" />}
          trend={{ value: summary?.trends?.revenue?.percentChange ?? 0, isPositive: summary?.trends?.revenue?.isPositive ?? true }}
        />
      </div>

      {/* Main charts grid */}
      <div className="space-y-6">
        {/* Top row - Sales and Product Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <SalesChart data={chartData} salesData={salesData} />
          </div>
          <div className="lg:col-span-2">
            <ProductPerformanceChart data={chartData} performanceData={productPerformance} />
          </div>
        </div>
        
        {/* Middle row - Orders, Activity, and Earnings */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-11 gap-4">
          <div className="md:col-span-1 lg:col-span-3">
            <OrdersDistributionChart data={chartData} ordersData={ordersData} summary={summary} />
          </div>
          <div className="md:col-span-1 lg:col-span-4">
            <YearlyRevenueChart data={chartData} yearlyRevenue={yearlyRevenue} totalRevenue={summary?.revenue} />
          </div>
          <div className="md:col-span-2 lg:col-span-4">
            <EarningsChart data={chartData} totalEarnings={summary?.revenue} />
          </div>
        </div>

        {/* Bottom row - Inventory Status and Top Customers */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6">
            <InventoryStatusChart data={chartData} inventoryData={inventoryData} />
          </div>
          <div className="lg:col-span-6">
            <TopCustomersList customers={topCustomers} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
