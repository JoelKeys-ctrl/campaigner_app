import React from 'react';
import Card from '../ui/Card';

interface StatCardProps {
  title: string;
  value: string;
  rate?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, rate }) => {
  return (
    <Card>
      <div className="flex flex-col">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <div className="flex items-baseline mt-2">
            <p className="text-3xl font-semibold text-gray-900 dark:text-white">{value}</p>
        </div>
        {rate && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{rate}</p>}
      </div>
    </Card>
  );
};

export default StatCard;
