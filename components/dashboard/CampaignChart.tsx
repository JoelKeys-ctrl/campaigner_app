import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Campaign, CampaignDataPoint } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface CampaignChartProps {
    campaigns: Campaign[];
}

const CampaignChart: React.FC<CampaignChartProps> = ({ campaigns }) => {
    const { theme } = useTheme();

    const chartData: CampaignDataPoint[] = useMemo(() => {
        const sentCampaigns = campaigns.filter(c => c.status === 'sent');
        if (sentCampaigns.length === 0) {
            return [];
        }

        const dataByMonth: { [key: string]: { sent: number; opened: number; replied: number } } = {};

        sentCampaigns.forEach(campaign => {
            const dateString = campaign.scheduled_at || campaign.created_at;
            
            if (typeof dateString !== 'string' || dateString.trim() === '') {
                console.warn(`Skipping campaign with invalid date string:`, campaign);
                return;
            }
            const date = new Date(dateString);

            if (isNaN(date.getTime())) {
                console.warn(`Skipping campaign with invalid date:`, campaign);
                return; // Skip if date is invalid
            }
            
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!dataByMonth[monthKey]) {
                dataByMonth[monthKey] = { sent: 0, opened: 0, replied: 0 };
            }

            const sentCount = campaign.recipient_ids.length;
            const openedCount = Math.floor(sentCount * 0.45); // Mock open rate
            const repliedCount = Math.floor(openedCount * 0.15); // Mock reply rate
            
            dataByMonth[monthKey].sent += sentCount;
            dataByMonth[monthKey].opened += openedCount;
            dataByMonth[monthKey].replied += repliedCount;
        });
        
        return Object.entries(dataByMonth)
            .map(([monthKey, data]) => ({
                date: new Date(monthKey + '-02').toLocaleString('default', { month: 'short' }), // Use day 2 to avoid timezone issues
                ...data
            }))
            .sort((a, b) => new Date(a.date + ' 1, 2024').getTime() - new Date(b.date + ' 1, 2024').getTime()); // A bit hacky sort for month names
    }, [campaigns]);


    const axisStrokeColor = theme === 'dark' ? '#9ca3af' : '#6b7280';
    const gridStrokeColor = theme === 'dark' ? '#374151' : '#e5e7eb';
    const tooltipContentStyle = {
        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
        border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        borderRadius: '0.5rem',
    };
    const tooltipItemStyle = { color: theme === 'dark' ? '#d1d5db' : '#374151' };
    const tooltipLabelStyle = { color: theme === 'dark' ? '#f9fafb' : '#111827' };
    const legendStyle = { color: theme === 'dark' ? '#d1d5db' : '#374151' };
    
    if (chartData.length === 0) {
        return (
            <div style={{ width: '100%', height: 300 }} className="flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">No campaign data to display. Send a campaign to see performance here.</p>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke={axisStrokeColor} />
                    <YAxis stroke={axisStrokeColor} />
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStrokeColor} />
                    <Tooltip 
                        contentStyle={tooltipContentStyle}
                        itemStyle={tooltipItemStyle}
                        labelStyle={tooltipLabelStyle}
                    />
                    <Legend wrapperStyle={legendStyle} />
                    <Area type="monotone" dataKey="opened" stroke="#3b82f6" fillOpacity={1} fill="url(#colorOpened)" strokeWidth={2} />
                    <Area type="monotone" dataKey="sent" stroke="#10b981" fillOpacity={1} fill="url(#colorSent)" strokeWidth={2} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default CampaignChart;