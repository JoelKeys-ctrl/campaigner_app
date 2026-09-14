import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  rate?: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, rate, subtitle }) => {
  return (
    <div className="bg-white dark:bg-[#18202c] border border-slate-200/70 dark:border-gray-800 rounded-[22px] p-5 shadow-[0_2px_14px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-all hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 tracking-tight">{title}</h3>
          {subtitle && <p className="text-[11px] text-gray-400 font-normal mt-0.5">{subtitle}</p>}
        </div>
        <div className="w-6 h-6 rounded-lg bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 text-gray-400 flex items-center justify-center text-xs select-none">
          ↗
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-2">
        <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</p>
        {rate && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e7f7f0] dark:bg-emerald-950/60 text-[#0b7b50] dark:text-emerald-300">
            {rate}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
