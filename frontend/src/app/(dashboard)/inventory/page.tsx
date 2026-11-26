'use client';

import React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Plus, AlertCircle, Edit2, Trash2, MoreVertical, Eye, Edit, Trash } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { InventoryFilter, type InventoryFilters } from '@/components/ui/inventory/inventory-filter';
import Image from 'next/image';
import { inventoryService } from '@/services/inventory.service';
import { formatShortId, formatCurrency } from '@/utils/format';

export default function InventoryPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<InventoryFilters>({
    categories: [],
    status: [],
    priceRange: { min: '', max: '' },
    quantityRange: { min: '', max: '' }
  });

  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await inventoryService.getInventory({ search: searchQuery });
      if (res && res.products) {
        const mapped = res.products.map((p: any) => ({
          id: p.id,
          name: p.name,
          category: typeof p.category === 'object' ? p.category?.name : (p.category || 'General'),
          quantity: p.quantity || 0,
          price: parseFloat(p.price) || 0,
          supplier: p.supplier || 'N/A',
          lowStock: (p.quantity || 0) <= (p.lowStockAlert || 10),
          image: p.imageUrl || p.image || '/default-product.svg',
        }));
        setInventory(mapped);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await inventoryService.deleteProduct(productId);
      setInventory((prev) => prev.filter((item) => item.id !== productId));
      setActiveActionMenu(null);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete product');
    }
  };

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
  const toggleActionMenu = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (activeActionMenu === itemId) {
      setActiveActionMenu(null);
      return;
    }
    
    const button = e.currentTarget as HTMLElement;
    const buttonRect = button.getBoundingClientRect();
    const spaceBelow = window.innerHeight - buttonRect.bottom;
    setMenuVerticalPosition(spaceBelow < 200 ? 'bottom' : 'top');
    setActiveActionMenu(itemId);
  };

  // Filter and search functionality
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      // Search filter
      if (searchQuery && 
          !item.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !item.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !item.supplier.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(item.category)) {
        return false;
      }

      // Status filter
      if (filters.status.length > 0) {
        const itemStatus = item.lowStock ? 'Low Stock' : 'In Stock';
        if (!filters.status.includes(itemStatus)) {
          return false;
        }
      }

      // Price range filter
      if (filters.priceRange.min && item.price < Number(filters.priceRange.min)) {
        return false;
      }
      if (filters.priceRange.max && item.price > Number(filters.priceRange.max)) {
        return false;
      }

      // Quantity range filter
      if (filters.quantityRange.min && item.quantity < Number(filters.quantityRange.min)) {
        return false;
      }
      if (filters.quantityRange.max && item.quantity > Number(filters.quantityRange.max)) {
        return false;
      }

      return true;
    });
  }, [inventory, searchQuery, filters]);

  const handleApplyFilters = (newFilters: InventoryFilters) => {
    setFilters(newFilters);
    setShowFilters(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="glass-card p-4 rounded-xl">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
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
              : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-white'
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
                {filters.categories.length + 
                 filters.status.length +
                 (filters.priceRange.min || filters.priceRange.max ? 1 : 0) +
                 (filters.quantityRange.min || filters.quantityRange.max ? 1 : 0)}
              </span>
            )}
          </button>
          <Link 
            href="/inventory/add" 
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap text-sm font-medium transition-colors"
          >
            <Plus size={18} />
            Add New Item
          </Link>
        </div>

        {/* Filter modal */}
        {showFilters && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowFilters(false)}>
            <div onClick={e => e.stopPropagation()}>
              <InventoryFilter 
                onApplyFilters={handleApplyFilters}
                onClose={() => setShowFilters(false)}
                initialFilters={filters}
              />
            </div>
          </div>
        )}

        <div className="overflow-x-auto md:overflow-visible">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Image</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Product ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading && filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Loading inventory...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredInventory.length > 0 ? (
                filteredInventory.map((item) => (
                  <motion.tr 
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Image 
                        src={item.image || '/default-product.svg'} 
                        alt={item.name} 
                        width={48} 
                        height={48} 
                        className="object-cover rounded-lg bg-white dark:bg-gray-800"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 font-mono" title={item.id}>
                      {formatShortId(item.id, 'PRD')}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{item.name}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{item.category}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{item.quantity}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-mono">₹{formatCurrency(item.price)}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{item.supplier}</td>
                    <td className="px-6 py-4">
                      {item.lowStock ? (
                        <span className="px-3 py-1 rounded-full text-xs bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle size={14} />
                          Low Stock
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative inline-block text-left action-menu-container">
                        <button 
                          onClick={(e) => toggleActionMenu(item.id, e)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
                        >
                          <MoreVertical size={16} />
                        </button>
                        
                        {activeActionMenu === item.id && (
                          <div className={`absolute right-0 ${
                            menuVerticalPosition === 'bottom' ? 'bottom-full mb-1' : 'top-full mt-1'
                          } bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 py-1.5 z-[100] min-w-36 whitespace-nowrap`}>
                            <button 
                              onClick={() => router.push(`/inventory/${item.id}`)}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Eye size={16} className="mr-2 text-blue-500" />
                              View
                            </button>
                            <button 
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={() => router.push(`/inventory/edit/${item.id}`)}
                            >
                              <Edit size={16} className="mr-2 text-amber-500" />
                              Edit
                            </button>
                            <button 
                              className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={() => handleDelete(item.id)}
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
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No inventory items found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between items-center text-gray-600 dark:text-gray-400 mt-4">
        <div>Showing {filteredInventory.length} of {inventory.length} entries</div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700">
            Previous
          </button>
          <button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700">
            Next
          </button>
        </div>
      </div>
    </motion.div>
  );
}
