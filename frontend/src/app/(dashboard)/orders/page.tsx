'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, MoreVertical, Plus, ShoppingBag, CheckCircle, Clock, AlertCircle, Eye, Edit, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { OrderCard } from '@/components/ui/order/order-card';
import { OrderFilter, type OrderFilters } from '@/components/ui/order/order-filter';
import { orderService } from '@/services/order.service';
import { formatShortId, formatCurrency } from '@/utils/format';

// Define the order type
interface Order {
  id: string;
  customer: string;
  customerGender: string;
  customerAvatar?: string;
  date: string;
  quantity: number;
  total: number;
  status: string;
  image: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<OrderFilters>({
    status: [],
    dateRange: { start: '', end: '' },
    priceRange: { min: '', max: '' }
  });

  // Add state for tracking which action menu is active
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
  
  // Add state to track position of dropdown menu
  const [menuPosition, setMenuPosition] = useState<'left' | 'right'>('right');
  
  // Add state to track vertical position of dropdown menu
  const [menuVerticalPosition, setMenuVerticalPosition] = useState<'top' | 'bottom'>('top');

  // Add click outside handler to close the menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (activeActionMenu && !target.closest('.action-menu-container')) {
        setActiveActionMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeActionMenu]);

  // Toggle menu function with position detection
  const toggleActionMenu = (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (activeActionMenu === orderId) {
      setActiveActionMenu(null);
      return;
    }
    
    const button = e.currentTarget as HTMLElement;
    const buttonRect = button.getBoundingClientRect();
    const spaceBelow = window.innerHeight - buttonRect.bottom;
    setMenuVerticalPosition(spaceBelow < 200 ? 'bottom' : 'top');
    setActiveActionMenu(orderId);
  };

  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Order statistics dynamically calculated from real orders
  const orderStats = useMemo(() => {
    const totalCount = allOrders.length;
    const completedCount = allOrders.filter(
      (o) => o.status.toLowerCase() === 'completed'
    ).length;
    const processingCount = allOrders.filter(
      (o) => o.status.toLowerCase() === 'processing'
    ).length;
    const pendingCount = allOrders.filter(
      (o) => o.status.toLowerCase() === 'pending'
    ).length;

    return {
      total: {
        value: totalCount,
        trend: { value: totalCount > 0 ? 100 : 0, isPositive: true }
      },
      completed: {
        value: completedCount,
        trend: { value: 0, isPositive: true }
      },
      processing: {
        value: processingCount,
        trend: { value: 0, isPositive: true }
      },
      pending: {
        value: pendingCount,
        trend: { value: pendingCount > 0 ? 100 : 0, isPositive: pendingCount === 0 }
      }
    };
  }, [allOrders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderService.getOrders();
      if (res && res.orders) {
        const mapped: Order[] = res.orders.map((o: any) => ({
          id: o.or_id || o.id,
          customer: o.customer?.name || o.customerName || 'Customer',
          customerGender: o.customer?.gender || 'male',
          date: new Date(o.orderDate || o.createdAt || Date.now()).toISOString().split('T')[0],
          quantity: o.items?.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0) || o.itemCount || 1,
          total: parseFloat(o.total) || 0,
          status: o.status || 'pending',
          image: o.items?.[0]?.product?.imageUrl || o.items?.[0]?.product?.image || '/default-product.svg',
          customerAvatar: o.customer?.avatar || o.customer?.image || '/default-avatar.svg',
        }));
        setAllOrders(mapped);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleDelete = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;
    try {
      await orderService.deleteOrder(orderId);
      setAllOrders((prev) => prev.filter((o) => o.id !== orderId));
      setActiveActionMenu(null);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete order');
    }
  };

  // Filter and search functionality
  const filteredOrders = useMemo(() => {
    return allOrders.filter(order => {
      // Search filter
      if (searchQuery && !order.customer.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !order.id.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(order.status)) {
        return false;
      }

      // Date range filter
      if (filters.dateRange.start && new Date(order.date) < new Date(filters.dateRange.start)) {
        return false;
      }
      if (filters.dateRange.end && new Date(order.date) > new Date(filters.dateRange.end)) {
        return false;
      }

      // Price range filter
      if (filters.priceRange.min && order.total < Number(filters.priceRange.min)) {
        return false;
      }
      if (filters.priceRange.max && order.total > Number(filters.priceRange.max)) {
        return false;
      }

      return true;
    });
  }, [allOrders, searchQuery, filters]);

  // Function to get profile image - defaults to clean neutral avatar
  const getProfileImage = (order: any) => {
    return order?.customerAvatar || '/default-avatar.svg';
  };

  const handleApplyFilters = (newFilters: OrderFilters) => {
    setFilters(newFilters);
    setShowFilters(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Order Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <OrderCard
          title="Total Orders"
          value={orderStats.total.value}
          icon={<ShoppingBag className="text-blue-500" />}
          trend={orderStats.total.trend}
        />
        <OrderCard
          title="Completed Orders"
          value={orderStats.completed.value}
          icon={<CheckCircle className="text-green-500" />}
          trend={orderStats.completed.trend}
        />
        <OrderCard
          title="Processing Orders"
          value={orderStats.processing.value}
          icon={<Clock className="text-yellow-500" />}
          trend={orderStats.processing.trend}
        />
        <OrderCard
          title="Pending Orders"
          value={orderStats.pending.value}
          icon={<AlertCircle className="text-orange-500" />}
          trend={orderStats.pending.trend}
        />
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <button 
          onClick={() => setShowFilters(true)}
          className={`px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 ${
            Object.values(filters).some(val => 
              Array.isArray(val) ? val.length > 0 : 
              typeof val === 'object' ? Object.values(val).some(v => v !== '') : 
              val !== ''
            )
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
            : 'bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-white'
          }`}
        >
          <Filter size={20} />
          Filter
          {Object.values(filters).some(val => 
            Array.isArray(val) ? val.length > 0 : 
            typeof val === 'object' ? Object.values(val).some(v => v !== '') : 
            val !== ''
          ) && (
            <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
              {filters.status.length + 
                (filters.dateRange.start || filters.dateRange.end ? 1 : 0) +
                (filters.priceRange.min || filters.priceRange.max ? 1 : 0)}
            </span>
          )}
        </button>
        <Link 
          href="/orders/add" 
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap text-sm font-medium transition-colors"
        >
          <Plus size={18} />
          New Order
        </Link>
      </div>

      {/* Filter modal */}
      {showFilters && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowFilters(false)}>
          <div onClick={e => e.stopPropagation()}>
            <OrderFilter 
              onApplyFilters={handleApplyFilters}
              onClose={() => setShowFilters(false)}
              initialFilters={filters}
            />
          </div>
        </div>
      )}

      <div className="glass-card rounded-xl">
        <div className="overflow-x-auto md:overflow-visible">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Image</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Order ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Customer</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Quantity</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Total</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading && filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Loading orders...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <motion.tr 
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Image 
                        src={order.image || '/default-product.svg'} 
                        alt={`Order ${order.id}`} 
                        width={48} 
                        height={48} 
                        className="object-cover rounded-lg bg-white dark:bg-gray-800"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 font-mono" title={order.id}>
                      {formatShortId(order.id, 'ORD')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
                          <Image
                            src={order.customerAvatar || '/default-avatar.svg'}
                            alt={order.customer}
                            fill
                            className="object-cover bg-white dark:bg-gray-800"
                          />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">{order.customer}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{order.date}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{order.quantity}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-mono">₹{formatCurrency(order.total)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        order.status === 'delivered' 
                          ? 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400' 
                          : order.status === 'processing'
                          ? 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                          : order.status === 'cancelled'
                          ? 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                          : 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative inline-block text-left action-menu-container">
                        <button 
                          onClick={(e) => toggleActionMenu(order.id, e)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
                        >
                          <MoreVertical size={16} />
                        </button>
                        
                        {activeActionMenu === order.id && (
                          <div className={`absolute right-0 ${
                            menuVerticalPosition === 'bottom' ? 'bottom-full mb-1' : 'top-full mt-1'
                          } bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 py-1.5 z-[100] min-w-36 whitespace-nowrap`}>
                            <button 
                              onClick={() => router.push(`/orders/${order.id}`)}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Eye size={16} className="mr-2 text-blue-500" />
                              View
                            </button>
                            <button 
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={() => router.push(`/orders/edit/${order.id}`)}
                            >
                              <Edit size={16} className="mr-2 text-amber-500" />
                              Update
                            </button>
                            <button 
                              className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={() => handleDelete(order.id)}
                            >
                              <Trash size={16} className="mr-2" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No orders found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between items-center text-gray-600 dark:text-gray-400 mt-4">
        <div>Showing {filteredOrders.length} of {allOrders.length} entries</div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700">
            Previous
          </button>
          <button className="px-4 py-2 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700">
            Next
          </button>
        </div>
      </div>
    </motion.div>
  );
}
