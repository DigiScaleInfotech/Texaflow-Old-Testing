"use client";

import React from "react";

interface StatCardProps {
  title: string;
  value: number;
  bgColor: string;
  textColor: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  bgColor,
  textColor,
}) => {
  return (
    <div className={`p-4 rounded-lg shadow-md ${bgColor} text-center`}>
      <h3 className={`text-lg font-semibold ${textColor}`}>{title}</h3>
      <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
    </div>
  );
};

export const Stats: React.FC = () => {
  const stats = [
    {
      title: "Total Orders",
      value: 1200,
      bgColor: "bg-blue-100",
      textColor: "text-blue-700",
    },
    {
      title: "Processing Orders",
      value: 300,
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-700",
    },
    {
      title: "Pending Orders",
      value: 150,
      bgColor: "bg-red-100",
      textColor: "text-red-700",
    },
    {
      title: "Inventory Items",
      value: 5000,
      bgColor: "bg-green-100",
      textColor: "text-green-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          title={stat.title}
          value={stat.value}
          bgColor={stat.bgColor}
          textColor={stat.textColor}
        />
      ))}
    </div>
  );
};
