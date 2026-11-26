'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Filter, MoreVertical, Eye, Edit, Trash, Phone, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Customer } from '@/types';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { CustomerFilter, type CustomerFilters } from '@/components/ui/customer/customer-filter';
import { customerService } from '@/services/customer.service';
import { formatShortId } from '@/utils/format';

export default function CustomersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<CustomerFilters>({
    gender: [],
    state: [],
    joinDateRange: { start: '', end: '' }
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await customerService.getCustomers();
      if (res && res.customers) {
        const mapped: Customer[] = res.customers.map((c: any) => ({
          id: c.id,
          name: c.name,
          mobile: c.phone || c.mobile || '',
          joiningDate: new Date(c.createdAt || c.joiningDate || Date.now()),
          state: c.state || 'N/A',
          gender: (c.gender === 'female' ? 'female' : 'male') as 'male' | 'female',
          email: c.email,
          address: c.address,
          totalOrders: c.totalOrders || 0,
          totalSpent: c.totalSpent || 0,
          accountType: c.accountType || 'Customer',
          primaryContact: c.displayName || c.primaryContact || c.name,
          salutation: c.salutation,
          firstName: c.firstName,
          lastName: c.lastName,
          gstNumber: c.gstNumber,
          pan: c.pan,
          paymentTerms: c.paymentTerms || 'Net 30',
          isMsmeRegistered: c.isMsmeRegistered,
          msmeType: c.msmeType,
          msmeRegNumber: c.msmeRegNumber,
          contactPersons: c.contactPersons || [],
        }));
        setCustomers(mapped);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleDelete = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    try {
      await customerService.deleteCustomer(customerId);
      setCustomers((prev) => prev.filter((c) => c.id !== customerId));
      setActiveActionMenu(null);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete customer');
    }
  };

  // Replace hover state with click state
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);

  // Add state to track position of dropdown menu
  const [menuPosition, setMenuPosition] = useState<'left' | 'right'>('right');

  // Add state to track vertical position of dropdown menu
  const [menuVerticalPosition, setMenuVerticalPosition] = useState<'top' | 'bottom'>('top');

  // Add click outside handler to close the menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Cast to Element instead of Node to access closest method
      const target = event.target as Element;
      // Close menu when clicking outside of it
      if (activeActionMenu && !target.closest('.action-menu-container')) {
        setActiveActionMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeActionMenu]);

  // Toggle menu function to check viewport position
  const toggleActionMenu = (customerId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (activeActionMenu === customerId) {
      setActiveActionMenu(null);
      return;
    }

    const button = e.currentTarget as HTMLElement;
    const buttonRect = button.getBoundingClientRect();
    const spaceBelow = window.innerHeight - buttonRect.bottom;
    setMenuVerticalPosition(spaceBelow < 180 ? 'bottom' : 'top');
    setActiveActionMenu(customerId);
  };

  // Filter and search functionality
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      // Search filter
      if (searchQuery && !customer.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !customer.id.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Gender filter
      if (filters.gender.length > 0 && !filters.gender.includes(customer.gender)) {
        return false;
      }

      // State filter
      if (filters.state.length > 0 && !filters.state.includes(customer.state)) {
        return false;
      }

      // Join date range filter
      if (filters.joinDateRange.start && customer.joiningDate < new Date(filters.joinDateRange.start)) {
        return false;
      }
      if (filters.joinDateRange.end && customer.joiningDate > new Date(filters.joinDateRange.end)) {
        return false;
      }

      return true;
    });
  }, [customers, searchQuery, filters]);

  // Function to get profile image - defaults to clean neutral avatar
  const getProfileImage = (customer: any) => {
    return customer?.avatar || customer?.image || '/default-avatar.svg';
  };

  const handleApplyFilters = (newFilters: CustomerFilters) => {
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
        <div className="flex flex-wrap sm:flex-nowrap gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search customers..."
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
              : 'bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-white'
            }`}
          >
            <Filter size={18} />
            Filter
            {Object.values(filters).some(val => 
              Array.isArray(val) ? val.length > 0 : 
              typeof val === 'object' ? Object.values(val).some(v => v !== '') : 
              val !== ''
            ) && (
              <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
                {filters.gender.length + 
                  filters.state.length +
                  (filters.joinDateRange.start || filters.joinDateRange.end ? 1 : 0)}
              </span>
            )}
          </button>
          <Link 
            href="/customers/add"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap text-sm font-medium transition-colors"
          >
            <Plus size={18} />
            Add Customer
          </Link>
        </div>

        {/* Filter modal */}
        {showFilters && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowFilters(false)}>
            <div onClick={e => e.stopPropagation()}>
              <CustomerFilter 
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
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Customer ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Customer Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Account Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Primary Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Mobile / Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  GSTIN / PAN
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Payment Terms
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading && filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Loading customers...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <motion.tr 
                    key={customer.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    {/* Customer ID */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 font-mono" title={customer.cus_id || customer.id}>
                      {formatShortId(customer.cus_id || customer.id, 'CUST')}
                    </td>

                    {/* Customer Name */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="relative h-9 w-9 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0">
                          <Image
                            src={getProfileImage(customer)}
                            alt={customer.name}
                            fill
                            className="object-cover bg-white dark:bg-gray-800"
                          />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">{customer.name}</div>
                        </div>
                      </div>
                    </td>

                    {/* Account Type */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <span className="font-medium">{customer.accountType || 'Customer'}</span>
                      </div>
                    </td>

                    {/* Primary Contact */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200 font-medium">
                      {customer.contactPersons && customer.contactPersons.length > 0 && customer.contactPersons[0].name
                        ? customer.contactPersons[0].name
                        : customer.salutation
                        ? `${customer.salutation} ${customer.firstName || ''} ${customer.lastName || ''}`.trim()
                        : customer.primaryContact || customer.name}
                    </td>

                    {/* Mobile / Phone */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300 font-mono">
                        <Phone size={14} className="text-gray-400 flex-shrink-0" />
                        <span>{customer.mobile || '—'}</span>
                      </div>
                    </td>

                    {/* GSTIN / PAN */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 font-mono">
                      {customer.gstNumber || customer.pan || '—'}
                    </td>

                    {/* Payment Terms & Credit */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      <div>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {customer.paymentTerms || 'Due on Receipt'}
                        </span>
                        {(Number(customer.creditLimit) || 0) > 0 ? (
                          <div className="text-[11px] text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                            Limit: ₹{(Number(customer.creditLimit) || 0).toLocaleString()}
                            {(customer.totalOutstanding || 0) > 0 && (
                              <span className="text-rose-500 dark:text-rose-400 ml-1">
                                (Used: ₹{(Number(customer.totalOutstanding) || 0).toLocaleString()})
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                            Credit: Unlimited
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <div className="inline-flex items-center justify-end gap-1.5 text-gray-500 dark:text-gray-400">
                        <button
                          onClick={() => router.push(`/customers/${customer.id}`)}
                          title="View Details"
                          className="p-1.5 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <BookOpen size={16} />
                        </button>
                        <button
                          onClick={() => router.push(`/customers/edit/${customer.id}`)}
                          title="Edit Customer"
                          className="p-1.5 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          title="Delete Customer"
                          className="p-1.5 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No customers found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between items-center text-gray-600 dark:text-gray-400 mt-4">
        <div>Showing {filteredCustomers.length} of {customers.length} entries</div>
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
