import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { Campaign } from '../../types';

interface CampaignChartProps {
    campaigns: Campaign[];
}

const CampaignChart: React.FC<CampaignChartProps> = ({ campaigns }) => {
    const [chartMode, setChartMode] = useState<'bar' | 'area'>('bar');
    const [metricType, setMetricType] = useState<'recipients' | 'campaigns'>('recipients');

    const chartData = useMemo(() => {
        // Generate the last 6 calendar months based on current time
        const now = new Date();
        const monthsList: { key: string; label: string; sentRecipients: number; totalCampaigns: number }[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = d.toLocaleString('default', { month: 'short' }).toUpperCase();
            monthsList.push({ key, label, sentRecipients: 0, totalCampaigns: 0 });
        }

        const monthMap = new Map(monthsList.map(m => [m.key, m]));

        campaigns.forEach(campaign => {
            const dateString = campaign.scheduled_at || campaign.created_at;
            if (!dateString) return;
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return;

            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const entry = monthMap.get(monthKey);
            if (entry) {
                entry.totalCampaigns += 1;
                if (campaign.status === 'sent') {
                    entry.sentRecipients += campaign.recipient_ids?.length || 0;
                }
            }
        });

        return monthsList.map(m => ({
            date: m.label,
            recipients: m.sentRecipients,
            campaigns: m.totalCampaigns,
            displayValue: metricType === 'recipients' ? m.sentRecipients : m.totalCampaigns,
        }));
    }, [campaigns, metricType]);

    const totalInWindow = useMemo(() => {
        return chartData.reduce((acc, item) => acc + item.displayValue, 0);
    }, [chartData]);

    const peakInfo = useMemo(() => {
        let maxIdx = -1;
        let maxVal = 0;
        chartData.forEach((item, idx) => {
            if (item.displayValue > maxVal) {
                maxVal = item.displayValue;
                maxIdx = idx;
            }
        });
        return { index: maxIdx, value: maxVal };
    }, [chartData]);

    const formatYAxis = (val: number) => {
        if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
        return `${val}`;
    };

    return (
        <div className="w-full flex flex-col justify-between">
            {/* Header controls for chart */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <button 
                    type="button"
                    onClick={() => setChartMode(prev => prev === 'bar' ? 'area' : 'bar')}
                    className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-[#0b7b50] dark:hover:text-emerald-400 transition-colors"
                >
                    {chartMode === 'bar' ? 'Wave View' : 'Bar View'}
                </button>
                
                {/* Metric toggle */}
                <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800/80 rounded-full p-1 border border-gray-200/50 dark:border-gray-700/50 text-xs">
                    <button
                        type="button"
                        onClick={() => setMetricType('recipients')}
                        className={`px-3 py-1 font-medium rounded-full transition-all ${
                            metricType === 'recipients'
                                ? 'bg-[#0b7b50] text-white shadow-xs'
                                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'
                        }`}
                    >
                        Emails
                    </button>
                    <button
                        type="button"
                        onClick={() => setMetricType('campaigns')}
                        className={`px-3 py-1 font-medium rounded-full transition-all ${
                            metricType === 'campaigns'
                                ? 'bg-[#0b7b50] text-white shadow-xs'
                                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'
                        }`}
                    >
                        Campaigns
                    </button>
                </div>
            </div>

            {/* Chart Area */}
            <div className="w-full h-64 relative">
                {totalInWindow === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 z-10 bg-white/60 dark:bg-[#18202c]/60 rounded-2xl">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            No data yet
                        </p>
                    </div>
                ) : null}

                <ResponsiveContainer width="100%" height="100%">
                    {chartMode === 'bar' ? (
                        <BarChart
                            data={chartData}
                            margin={{ top: 28, right: 10, left: -15, bottom: 0 }}
                            barSize={32}
                        >
                            <CartesianGrid 
                                strokeDasharray="0" 
                                vertical={false} 
                                stroke="#f1f3f6" 
                                className="dark:stroke-gray-800"
                            />
                            <XAxis 
                                dataKey="date" 
                                stroke="#9ca3af" 
                                tickLine={false} 
                                axisLine={false}
                                tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }}
                                dy={8}
                            />
                            <YAxis 
                                stroke="#9ca3af" 
                                tickLine={false} 
                                axisLine={false}
                                tick={{ fontSize: 11, fill: '#9ca3af' }}
                                tickFormatter={formatYAxis}
                                allowDecimals={false}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(11, 123, 80, 0.04)' }}
                                contentStyle={{
                                    backgroundColor: '#ffffff',
                                    borderRadius: '16px',
                                    border: '1px solid #f1f3f6',
                                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                                    fontSize: '12px',
                                    padding: '8px 14px',
                                }}
                                formatter={(value: any) => [
                                    `${value} ${metricType === 'recipients' ? 'emails' : 'campaigns'}`,
                                    metricType === 'recipients' ? 'Dispatched' : 'Total'
                                ]}
                                labelStyle={{ color: '#111827', fontWeight: 600, marginBottom: '2px' }}
                            />
                            <Bar 
                                dataKey="displayValue" 
                                radius={[16, 16, 16, 16]}
                            >
                                {chartData.map((_, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={peakInfo.index === index && peakInfo.value > 0 ? '#0b7b50' : '#88d9b9'} 
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    ) : (
                        <AreaChart
                            data={chartData}
                            margin={{ top: 20, right: 10, left: -15, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="mintWave" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0b7b50" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#88d9b9" stopOpacity={0.02}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid 
                                strokeDasharray="0" 
                                vertical={false} 
                                stroke="#f1f3f6" 
                                className="dark:stroke-gray-800"
                            />
                            <XAxis 
                                dataKey="date" 
                                stroke="#9ca3af" 
                                tickLine={false} 
                                axisLine={false}
                                tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }}
                                dy={8}
                            />
                            <YAxis 
                                stroke="#9ca3af" 
                                tickLine={false} 
                                axisLine={false}
                                tick={{ fontSize: 11, fill: '#9ca3af' }}
                                tickFormatter={formatYAxis}
                                allowDecimals={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#ffffff',
                                    borderRadius: '16px',
                                    border: '1px solid #f1f3f6',
                                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                                    fontSize: '12px',
                                    padding: '8px 14px',
                                }}
                                formatter={(value: any) => [
                                    `${value} ${metricType === 'recipients' ? 'emails' : 'campaigns'}`,
                                    metricType === 'recipients' ? 'Dispatched' : 'Total'
                                ]}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="displayValue" 
                                stroke="#0b7b50" 
                                strokeWidth={2.5}
                                fill="url(#mintWave)" 
                            />
                        </AreaChart>
                    )}
                </ResponsiveContainer>

                {/* Dynamic Peak indicator only when real peak exists (> 0) */}
                {chartMode === 'bar' && peakInfo.index >= 0 && peakInfo.value > 0 && (
                    <div 
                        className="absolute pointer-events-none hidden sm:flex flex-col items-center"
                        style={{
                            left: `${((peakInfo.index + 0.5) / chartData.length) * 85 + 6}%`,
                            top: '2px',
                            transform: 'translateX(-50%)',
                        }}
                    >
                        <span className="bg-[#0b7b50] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                            {peakInfo.value} {metricType === 'recipients' ? 'emails' : 'campaigns'}
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#0b7b50] mt-1" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default CampaignChart;
