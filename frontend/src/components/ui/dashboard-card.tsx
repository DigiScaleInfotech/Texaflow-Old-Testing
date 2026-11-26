import React from 'react';
import { motion } from 'framer-motion';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  icon,
  trend
}) => {
  const isZero = !trend || trend.value === 0;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="glass-card p-6 rounded-xl"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
          <p className="text-2xl font-semibold mt-1 text-gray-900 dark:text-white">{value}</p>
          {trend && (
            <p className={`text-sm mt-2 flex items-center ${
              isZero
                ? 'text-gray-500 dark:text-gray-400'
                : trend.isPositive
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {isZero ? '— ' : trend.isPositive ? '↑ ' : '↓ '} {trend.value}%
              <span className="text-gray-500 dark:text-gray-400 text-xs ml-1">vs last month</span>
            </p>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg text-gray-600 dark:text-gray-400">
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
};
