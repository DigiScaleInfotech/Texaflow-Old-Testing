'use client';

import React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, Plus, CheckCircle, XCircle, MoreVertical, Eye, Edit, Trash, ClipboardCheck, Settings, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { VendorFilter, type VendorFilters } from '@/components/ui/vendor/vendor-filter';
import { vendorService } from '@/services/vendor.service';
import { formatShortId } from '@/utils/format';

interface VendorItem {
  id: string;
  name: string;
  email: string;
  mobile: string;
  gst: string;
  address: string;
  status: string;
  joinDate: string;
  image: string;
}

const defaultMockVendors: VendorItem[] = [
  {
    id: 'V001',
    name: 'ABC Textiles',
    email: 'contact@abctextiles.com',
    mobile: '+91 9876543210',
    gst: 'GSTIN9876543210',
    address: 'Mumbai, Maharashtra',
    status: 'approved',
    joinDate: '2024-01-15',
    image: '/default-avatar.svg'
  },
  {
    id: 'V002',
    name: 'XYZ Fabrics',
    email: 'info@xyzfabrics.com',
    mobile: '+91 9876543211',
    gst: 'GSTIN9876543211',
    address: 'Surat, Gujarat',
    status: 'pending',
    joinDate: '2024-01-16',
    image: '/default-avatar.svg'
  },
  {
    id: 'V003',
    name: 'Elegant Textiles',
    email: 'support@eleganttextiles.com',
    mobile: '+91 9876543212',
    gst: 'GSTIN9876543212',
    address: 'Delhi, Delhi',
    status: 'approved',
    joinDate: '2024-01-10',
    image: '/default-avatar.svg'
  },
  {
    id: 'V004',
    name: 'Premium Fabrics',
    email: 'info@premiumfabrics.com',
    mobile: '+91 9876543213',
    gst: 'GSTIN9876543213',
    address: 'Bangalore, Karnataka',
    status: 'rejected',
    joinDate: '2024-01-18',
    image: '/default-avatar.svg'
  },
];

export default function VendorsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<VendorFilters>({
    status: [],
    location: [],
    joinDateRange: { start: '', end: '' }
  });

  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await vendorService.getVendors({
        search: searchQuery || undefined,
        status: filters.status.length > 0 ? filters.status.join(',') : undefined,
        startDate: filters.joinDateRange.start || undefined,
        endDate: filters.joinDateRange.end || undefined
      });

      if (res && res.vendors) {
        const mapped: VendorItem[] = res.vendors.map((v: any) => ({
          id: v.id,
          name: v.name || v.businessName || 'Unnamed Vendor',
          email: v.email || '',
          mobile: v.phone || '',
          gst: v.gstNumber || 'N/A',
          address: typeof v.address === 'object' && v.address 
            ? `${v.address.city || ''}${v.address.city && v.address.state ? ', ' : ''}${v.address.state || ''}`.trim() || 'N/A'
            : (v.address || 'N/A'),
          status: v.status?.toLowerCase() || 'pending',
          joinDate: v.createdAt || '2024-01-15',
          image: v.logo || v.image || '/default-avatar.svg'
        }));
        setVendors(mapped);
      } else {
        setVendors([]);
      }
    } catch (err) {
      console.warn('Vendors fetch error:', err);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [searchQuery, filters]);

  const handleDeleteVendor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return;
    try {
      await vendorService.deleteVendor(id);
      setVendors(prev => prev.filter(v => v.id !== id));
      setActiveActionMenu(null);
    } catch (err) {
      console.error('Failed to delete vendor:', err);
      setVendors(prev => prev.filter(v => v.id !== id));
      setActiveActionMenu(null);
    }
  };

  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
  
  const [menuPosition, setMenuPosition] = useState<'left' | 'right'>('right');
  const [menuVerticalPosition, setMenuVerticalPosition] = useState<'top' | 'bottom'>('top');

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

  const toggleActionMenu = (vendorId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (activeActionMenu === vendorId) {
      setActiveActionMenu(null);
      return;
    }
    
    const button = e.currentTarget as HTMLElement;
    const buttonRect = button.getBoundingClientRect();
    const spaceBelow = window.innerHeight - buttonRect.bottom;
    setMenuVerticalPosition(spaceBelow < 200 ? 'bottom' : 'top');
    setActiveActionMenu(vendorId);
  };

  const filteredVendors = useMemo(() => {
    return vendors.filter(vendor => {
      if (searchQuery && 
          !vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !vendor.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !vendor.email.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !vendor.mobile.includes(searchQuery) &&
          !vendor.gst.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      if (filters.status.length > 0 && !filters.status.includes(vendor.status)) {
        return false;
      }

      if (filters.location.length > 0) {
        const vendorCity = vendor.address.split(',')[0].trim();
        if (!filters.location.some(location => vendorCity.includes(location))) {
          return false;
        }
      }

      if (filters.joinDateRange.start && new Date(vendor.joinDate) < new Date(filters.joinDateRange.start)) {
        return false;
      }
      if (filters.joinDateRange.end && new Date(vendor.joinDate) > new Date(filters.joinDateRange.end)) {
        return false;
      }

      return true;
    });
  }, [vendors, searchQuery, filters]);

  const handleApplyFilters = (newFilters: VendorFilters) => {
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
              placeholder="Search vendors..."
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
                {filters.status.length + 
                 filters.location.length +
                 (filters.joinDateRange.start || filters.joinDateRange.end ? 1 : 0)}
              </span>
            )}
          </button>
          <Link 
            href="/vendors/applications" 
            className="flex items-center gap-1 text-sm px-3 py-2 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-800/40 transition-colors whitespace-nowrap"
          >
            <ClipboardCheck size={16} />
            <span className="whitespace-nowrap">Applications</span>
          </Link>
          <Link 
            href="/vendors/settings"
            className="flex items-center gap-1 text-sm px-3 py-2 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
          >
            <Settings size={16} />
            <span className="whitespace-nowrap">Settings</span>
          </Link>
          <Link 
            href="/vendors/add" 
            className="flex items-center gap-1 text-sm px-3.5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors whitespace-nowrap"
          >
            <Plus size={16} />
            <span className="whitespace-nowrap">Add Vendor</span>
          </Link>
        </div>

        {showFilters && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowFilters(false)}>
            <div onClick={e => e.stopPropagation()}>
              <VendorFilter 
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Vendor ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">GST</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Join Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading && filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Loading vendors...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredVendors.length > 0 ? (
                filteredVendors.map((vendor) => (
                  <motion.tr 
                    key={vendor.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                          <Image
                            src={vendor.image || '/default-avatar.svg'}
                            alt={vendor.name}
                            fill
                            className="object-cover bg-white dark:bg-gray-800"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-gray-900 dark:text-gray-300 truncate">{vendor.name}</div>
                          <div className="text-xs text-gray-500 truncate">{vendor.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 font-mono" title={vendor.id}>
                      {formatShortId(vendor.id, 'VND')}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{vendor.gst}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{vendor.joinDate}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 w-fit ${
                        vendor.status === 'approved' 
                          ? 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400' 
                          : vendor.status === 'rejected'
                          ? 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                          : 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                      }`}>
                        {vendor.status === 'approved' && <CheckCircle size={14} />}
                        {vendor.status === 'rejected' && <XCircle size={14} />}
                        {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative inline-block text-left action-menu-container">
                        <button 
                          onClick={(e) => toggleActionMenu(vendor.id, e)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
                        >
                          <MoreVertical size={16} />
                        </button>
                        
                        {activeActionMenu === vendor.id && (
                          <div className={`absolute right-0 ${
                            menuVerticalPosition === 'bottom' ? 'bottom-full mb-1' : 'top-full mt-1'
                          } bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 py-1.5 z-[100] min-w-36 whitespace-nowrap`}>
                            <button 
                              onClick={() => router.push(`/vendors/${vendor.id}`)}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Eye size={16} className="mr-2 text-blue-500" />
                              View
                            </button>
                            <button 
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={() => router.push(`/vendors/edit/${vendor.id}`)}
                            >
                              <Edit size={16} className="mr-2 text-amber-500" />
                              Edit
                            </button>
                            {vendor.status === 'pending' && (
                              <button 
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                onClick={() => router.push(`/vendors/applications/${vendor.id}`)}
                              >
                                <ClipboardCheck size={16} className="mr-2 text-amber-500" />
                                Review Application
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeleteVendor(vendor.id)}
                              className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
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
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No vendors found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
        <div>Showing {filteredVendors.length} of {vendors.length} entries</div>
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