'use client';

import React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Plus, Edit2, Trash2, MoreVertical, Eye, Edit, Trash } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { EmployeeFilter, type EmployeeFilters } from '@/components/ui/employee/employee-filter';
import { employeeService } from '@/services/employee.service';
import { formatShortId, formatCurrency } from '@/utils/format';

export default function EmployeesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<EmployeeFilters>({
    roles: [],
    salaryRange: { min: '', max: '' },
    gender: []
  });

  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await employeeService.getEmployees({ search: searchQuery });
      if (res && res.employees) {
        const mapped = res.employees.map((e: any) => ({
          id: e.id,
          employeeId: e.employeeId || e.id,
          name: e.name,
          mobile: e.mobile || e.phone || '',
          role: e.role || 'Staff',
          salary: parseFloat(e.salary) || 0,
          paidSalary: parseFloat(e.paidSalary) || parseFloat(e.salary) || 0,
          totalSalary: parseFloat(e.totalSalary) || parseFloat(e.salary) || 0,
          gender: e.gender || 'male',
          department: e.department || 'Production',
        }));
        setEmployees(mapped);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleDelete = async (employeeId: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    try {
      await employeeService.deleteEmployee(employeeId);
      setEmployees((prev) => prev.filter((e) => e.id !== employeeId));
      setActiveActionMenu(null);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete employee');
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
  const toggleActionMenu = (employeeId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (activeActionMenu === employeeId) {
      setActiveActionMenu(null);
      return;
    }

    const button = e.currentTarget as HTMLElement;
    const buttonRect = button.getBoundingClientRect();
    const spaceBelow = window.innerHeight - buttonRect.bottom;
    setMenuVerticalPosition(spaceBelow < 200 ? 'bottom' : 'top');
    setActiveActionMenu(employeeId);
  };

  // Filter and search functionality
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      // Search filter
      if (searchQuery && 
          !employee.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !employee.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !employee.mobile.includes(searchQuery)) {
        return false;
      }

      // Role filter
      if (filters.roles.length > 0 && !filters.roles.includes(employee.role)) {
        return false;
      }

      // Gender filter
      if (filters.gender.length > 0 && !filters.gender.includes(employee.gender)) {
        return false;
      }

      // Salary range filter
      if (filters.salaryRange.min && employee.salary < Number(filters.salaryRange.min)) {
        return false;
      }
      if (filters.salaryRange.max && employee.salary > Number(filters.salaryRange.max)) {
        return false;
      }

      return true;
    });
  }, [employees, searchQuery, filters]);

  // Function to get profile image - defaults to clean neutral avatar
  const getProfileImage = (employee: any) => {
    return employee?.image || employee?.avatar || '/default-avatar.svg';
  };

  const handleApplyFilters = (newFilters: EmployeeFilters) => {
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
        {/* Search and filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search employees..."
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
                {filters.roles.length + 
                 filters.gender.length +
                 (filters.salaryRange.min || filters.salaryRange.max ? 1 : 0)}
              </span>
            )}
          </button>
          <Link 
            href="/employees/add" 
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap text-sm font-medium transition-colors"
          >
            <Plus size={18} />
            Add Employee
          </Link>
        </div>

        {/* Filter modal */}
        {showFilters && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowFilters(false)}>
            <div onClick={e => e.stopPropagation()}>
              <EmployeeFilter 
                onApplyFilters={handleApplyFilters}
                onClose={() => setShowFilters(false)}
                initialFilters={filters}
              />
            </div>
          </div>
        )}

        {/* Updated table container - remove the nested divs causing unnecessary scrolling */}
        <div className="overflow-x-auto md:overflow-visible">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Mobile</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Salary</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Paid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading && filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Loading employees...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee) => (
                  <motion.tr 
                    key={employee.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
                          <Image
                            src={getProfileImage(employee)}
                            alt={employee.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <span className="text-gray-900 dark:text-gray-300">{employee.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 font-mono" title={employee.id}>
                      {formatShortId(employee.id, 'EMP')}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{employee.mobile}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{employee.role}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-mono">₹{formatCurrency(employee.salary)}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-mono">₹{formatCurrency(employee.paidSalary)}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-mono">₹{formatCurrency(employee.totalSalary)}</td>
                    <td className="px-6 py-4">
                      <div className="relative inline-block text-left action-menu-container">
                        <button 
                          onClick={(e) => toggleActionMenu(employee.id, e)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
                        >
                          <MoreVertical size={16} />
                        </button>
                        
                        {activeActionMenu === employee.id && (
                          <div className={`absolute right-0 ${
                            menuVerticalPosition === 'bottom' ? 'bottom-full mb-1' : 'top-full mt-1'
                          } bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 py-1.5 z-[100] min-w-36 whitespace-nowrap`}>
                            <button 
                              onClick={() => router.push(`/employees/${employee.id}`)}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Eye size={16} className="mr-2 text-blue-500" />
                              View
                            </button>
                            <button 
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={() => router.push(`/employees/edit/${employee.id}`)}
                            >
                              <Edit size={16} className="mr-2 text-amber-500" />
                              Edit
                            </button>
                            <button 
                              className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={() => handleDelete(employee.id)}
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
                    No employees found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between items-center text-gray-600 dark:text-gray-400 mt-4">
        <div>Showing {filteredEmployees.length} of {employees.length} entries</div>
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
