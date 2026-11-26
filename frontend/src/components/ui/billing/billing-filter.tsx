import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, DollarSign, Tag } from 'lucide-react';

interface BillingFilterProps {
  onApplyFilters: (filters: BillingFilters) => void;
  onClose: () => void;
  initialFilters?: BillingFilters;
}

export interface BillingFilters {
  status: string[];
  dateRange: {
    start: string;
    end: string;
  };
  amountRange: {
    min: string;
    max: string;
  };
  type ?: Array<string>;
}

export const BillingFilter: React.FC<BillingFilterProps> = ({
  onApplyFilters,
  onClose,
  initialFilters
}) => {
  const [filters, setFilters] = useState<BillingFilters>(
    initialFilters || {
      status: [],
      dateRange: { start: '', end: '' },
      amountRange: { min: '', max: '' }
    }
  );

  const handleStatusChange = (status: string) => {
    setFilters(prev => {
      if (prev.status.includes(status)) {
        return {
          ...prev,
          status: prev.status.filter(s => s !== status)
        };
      } else {
        return {
          ...prev,
          status: [...prev.status, status]
        };
      }
    });
  };

  const handleDateRangeChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'start' | 'end'
  ) => {
    const { value } = e.target;
    
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: value
      }
    }));
  };

  const handleAmountRangeChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'min' | 'max'
  ) => {
    const { value } = e.target;
    
    setFilters(prev => ({
      ...prev,
      amountRange: {
        ...prev.amountRange,
        [field]: value
      }
    }));
  };

  const handleApplyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleResetFilters = () => {
    setFilters({
      status: [],
      dateRange: { start: '', end: '' },
      amountRange: { min: '', max: '' }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 rounded-xl shadow-lg max-w-md w-full"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filter Bills</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
        >
          <X size={18} className="text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Status Filter */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Tag size={16} />
            Payment Status
          </label>
          <div className="flex flex-wrap gap-2">
            {['paid', 'pending', 'overdue', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={`px-3 py-1 rounded-full text-xs ${
                  filters.status.includes(status)
                    ? status === 'paid'
                      ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                      : status === 'pending'
                      ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                      : status === 'overdue'
                      ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400'
                      : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Amount Range Filter */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <DollarSign size={16} />
            Amount Range
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                type="number"
                placeholder="Min Amount"
                value={filters.amountRange.min}
                onChange={(e) => handleAmountRangeChange(e, 'min')}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
              />
            </div>
            <div>
              <input
                type="number"
                placeholder="Max Amount"
                value={filters.amountRange.max}
                onChange={(e) => handleAmountRangeChange(e, 'max')}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        {/* Date Range Filter */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Calendar size={16} />
            Date Range
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                type="date"
                placeholder="Start Date"
                value={filters.dateRange.start}
                onChange={(e) => handleDateRangeChange(e, 'start')}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
              />
            </div>
            <div>
              <input
                type="date"
                placeholder="End Date"
                value={filters.dateRange.end}
                onChange={(e) => handleDateRangeChange(e, 'end')}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleResetFilters}
            className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
          >
            Reset
          </button>
          <button
            onClick={handleApplyFilters}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </motion.div>
  );
};
