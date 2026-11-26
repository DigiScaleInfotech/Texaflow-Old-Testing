import React from 'react';
import { motion } from 'framer-motion';

interface OrderCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  bgColor?: string;
  textColor?: string;
  subtitle?: string;
  className?: string;
  trend?: {
    value: number | string;
    isPositive: boolean;
    label?: string;
  };
}

export const OrderCard: React.FC<OrderCardProps> = ({
  title,
  value,
  icon,
  bgColor = 'bg-white dark:bg-gray-800/50',
  textColor = 'text-gray-900 dark:text-white',
  subtitle,
  className = '',
  trend
}) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`glass-card p-6 rounded-xl ${bgColor} ${className}`}
    >
      <div className="flex justify-between items-start">
        <div className="min-w-0 pr-2">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">{title}</h3>
          <p className={`text-2xl font-semibold mt-1 font-mono tracking-tight truncate ${textColor}`}>{value}</p>
          {trend && (
            <p className={`text-sm mt-2 flex items-center ${
              trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}%
              <span className="text-gray-500 dark:text-gray-400 text-xs ml-1">{trend.label || 'vs last month'}</span>
            </p>
          )}
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg text-gray-600 dark:text-gray-400 flex-shrink-0">
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
};
