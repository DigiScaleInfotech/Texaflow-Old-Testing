import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Package, DollarSign, Tag, Bookmark } from 'lucide-react';

interface InventoryFilterProps {
  onApplyFilters: (filters: InventoryFilters) => void;
  onClose: () => void;
  initialFilters?: InventoryFilters;
}

export interface InventoryFilters {
  categories: string[];
  status: string[];
  priceRange: {
    min: string;
    max: string;
  };
  quantityRange: {
    min: string;
    max: string;
  };
}

export const InventoryFilter: React.FC<InventoryFilterProps> = ({
  onApplyFilters,
  onClose,
  initialFilters
}) => {
  const [filters, setFilters] = useState<InventoryFilters>(
    initialFilters || {
      categories: [],
      status: [],
      priceRange: { min: '', max: '' },
      quantityRange: { min: '', max: '' }
    }
  );

  const handleCategoryChange = (category: string) => {
    setFilters(prev => {
      if (prev.categories.includes(category)) {
        return {
          ...prev,
          categories: prev.categories.filter(c => c !== category)
        };
      } else {
        return {
          ...prev,
          categories: [...prev.categories, category]
        };
      }
    });
  };

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

  const handlePriceRangeChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'min' | 'max'
  ) => {
    const { value } = e.target;
    
    setFilters(prev => ({
      ...prev,
      priceRange: {
        ...prev.priceRange,
        [field]: value
      }
    }));
  };

  const handleQuantityRangeChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'min' | 'max'
  ) => {
    const { value } = e.target;
    
    setFilters(prev => ({
      ...prev,
      quantityRange: {
        ...prev.quantityRange,
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
      categories: [],
      status: [],
      priceRange: { min: '', max: '' },
      quantityRange: { min: '', max: '' }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 rounded-xl shadow-lg max-w-md w-full"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filter Inventory</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
        >
          <X size={18} className="text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Category Filter */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Bookmark size={16} />
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            {['Raw Material', 'Finished Goods', 'Accessories', 'Packaging', 'Tools'].map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-3 py-1 rounded-full text-xs ${
                  filters.categories.includes(category)
                    ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Stock Status Filter */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Tag size={16} />
            Stock Status
          </label>
          <div className="flex flex-wrap gap-2">
            {['In Stock', 'Low Stock', 'Out of Stock'].map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={`px-3 py-1 rounded-full text-xs ${
                  filters.status.includes(status)
                    ? status === 'In Stock'
                      ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                      : status === 'Low Stock'
                      ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                      : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range Filter */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <DollarSign size={16} />
            Price Range
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                type="number"
                placeholder="Min Price"
                value={filters.priceRange.min}
                onChange={(e) => handlePriceRangeChange(e, 'min')}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
              />
            </div>
            <div>
              <input
                type="number"
                placeholder="Max Price"
                value={filters.priceRange.max}
                onChange={(e) => handlePriceRangeChange(e, 'max')}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        {/* Quantity Range Filter */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Package size={16} />
            Quantity Range
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                type="number"
                placeholder="Min Quantity"
                value={filters.quantityRange.min}
                onChange={(e) => handleQuantityRangeChange(e, 'min')}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
              />
            </div>
            <div>
              <input
                type="number"
                placeholder="Max Quantity"
                value={filters.quantityRange.max}
                onChange={(e) => handleQuantityRangeChange(e, 'max')}
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
