import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, MapPin, User } from 'lucide-react';

interface CustomerFilterProps {
  onApplyFilters: (filters: CustomerFilters) => void;
  onClose: () => void;
  initialFilters?: CustomerFilters;
}

export interface CustomerFilters {
  gender: string[];
  state: string[];
  joinDateRange: {
    start: string;
    end: string;
  };
}

export const CustomerFilter: React.FC<CustomerFilterProps> = ({
  onApplyFilters,
  onClose,
  initialFilters
}) => {
  const [filters, setFilters] = useState<CustomerFilters>(
    initialFilters || {
      gender: [],
      state: [],
      joinDateRange: { start: '', end: '' }
    }
  );

  const handleGenderChange = (gender: string) => {
    setFilters(prev => {
      if (prev.gender.includes(gender)) {
        return {
          ...prev,
          gender: prev.gender.filter(g => g !== gender)
        };
      } else {
        return {
          ...prev,
          gender: [...prev.gender, gender]
        };
      }
    });
  };

  const handleStateChange = (state: string) => {
    setFilters(prev => {
      if (prev.state.includes(state)) {
        return {
          ...prev,
          state: prev.state.filter(s => s !== state)
        };
      } else {
        return {
          ...prev,
          state: [...prev.state, state]
        };
      }
    });
  };

  const handleJoinDateRangeChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'start' | 'end'
  ) => {
    const { value } = e.target;
    
    setFilters(prev => ({
      ...prev,
      joinDateRange: {
        ...prev.joinDateRange,
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
      gender: [],
      state: [],
      joinDateRange: { start: '', end: '' }
    });
  };

  // Sample states for demo purpose - in a real app, these might come from API or props
  const states = ['Maharashtra', 'Gujarat', 'Karnataka', 'Tamil Nadu', 'Delhi'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 rounded-xl shadow-lg max-w-md w-full"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filter Customers</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
        >
          <X size={18} className="text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Gender Filter */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <User size={16} />
            Gender
          </label>
          <div className="flex flex-wrap gap-2">
            {['male', 'female', 'other'].map((gender) => (
              <button
                key={gender}
                onClick={() => handleGenderChange(gender)}
                className={`px-3 py-1 rounded-full text-xs ${
                  filters.gender.includes(gender)
                    ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {gender}
              </button>
            ))}
          </div>
        </div>

        {/* State Filter */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <MapPin size={16} />
            State
          </label>
          <div className="flex flex-wrap gap-2">
            {states.map((state) => (
              <button
                key={state}
                onClick={() => handleStateChange(state)}
                className={`px-3 py-1 rounded-full text-xs ${
                  filters.state.includes(state)
                    ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {state}
              </button>
            ))}
          </div>
        </div>

        {/* Join Date Range Filter */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Calendar size={16} />
            Join Date Range
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                type="date"
                placeholder="Start Date"
                value={filters.joinDateRange.start}
                onChange={(e) => handleJoinDateRangeChange(e, 'start')}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
              />
            </div>
            <div>
              <input
                type="date"
                placeholder="End Date"
                value={filters.joinDateRange.end}
                onChange={(e) => handleJoinDateRangeChange(e, 'end')}
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
