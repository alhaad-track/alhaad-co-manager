"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { initialVehicles } from "@/lib/data";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, Label } from 'recharts';

export default function DashboardCharts() {
    // --- Data Preparation ---

    // 1. Vehicle Status (Donut Chart)
    const statusCounts = initialVehicles.reduce((acc, vehicle) => {
        acc[vehicle.status] = (acc[vehicle.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Ensure all statuses are represented for the legend
    const pieData = [
        { name: 'Total Moving', value: statusCounts['moving'] || 0, color: '#22c55e' }, // green-500
        { name: 'Total Idle', value: 0, color: '#f97316' }, // orange-500 (Mocked as 0 for now)
        { name: 'Total Offline', value: statusCounts['offline'] || 0, color: '#64748b' }, // slate-500
        { name: 'Total Inactive', value: 0, color: '#d1d5db' }, // gray-300
        { name: 'Total No Data', value: 0, color: '#3b82f6' }, // blue-500
    ].filter(item => item.value >= 0); // Keep all for legend even if 0

    // 2. Idling Trends (Bar Chart) - Mock Data
    const idlingData = [
        { month: 'Dec \'25', hours: 14 },
        { month: 'Nov \'25', hours: 22 },
        { month: 'Oct \'25', hours: 0 },
        { month: 'Sep \'25', hours: 0 },
        { month: 'Aug \'25', hours: 0 },
        { month: 'Jul \'25', hours: 0 },
    ];

    // 3. Total KM Driven (Bar Chart) - Mock Data
    const kmData = [
        { month: 'Dec \'25', km: 3100 },
        { month: 'Nov \'25', km: 4300 },
        { month: 'Oct \'25', km: 0 },
        { month: 'Sep \'25', km: 0 },
        { month: 'Aug \'25', km: 0 },
        { month: 'Jul \'25', km: 0 },
    ];

    // Custom Legend for Donut Chart
    const renderLegend = (props: any) => {
        const { payload } = props;
        return (
            <ul className="flex flex-col gap-2 text-sm">
                {payload.map((entry: any, index: number) => (
                    <li key={`item-${index}`} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-gray-600">{entry.value}</span>
                        </div>
                        <span className="font-bold bg-gray-200 px-2 py-0.5 rounded text-xs text-gray-700">
                            {pieData.find(d => d.name === entry.value)?.value}
                        </span>
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className="grid gap-6 md:grid-cols-3">
            {/* 1. Vehicle Status Donut Chart */}
            <Card className="border-none shadow-sm bg-white">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-500">Vehicles Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px] flex items-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="40%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                    <Label
                                        content={({ viewBox }) => {
                                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                                return (
                                                    <text
                                                        x={viewBox.cx}
                                                        y={viewBox.cy}
                                                        textAnchor="middle"
                                                        dominantBaseline="middle"
                                                    >
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={viewBox.cy}
                                                            dy="-4"
                                                            className="fill-foreground text-3xl font-bold"
                                                        >
                                                            {initialVehicles.length}
                                                        </tspan>
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={viewBox.cy}
                                                            dy="24"
                                                            className="fill-muted-foreground text-xs"
                                                        >
                                                            Total
                                                        </tspan>
                                                    </text>
                                                )
                                            }
                                        }}
                                    />
                                </Pie>
                                <Tooltip />
                                <Legend
                                    layout="vertical"
                                    verticalAlign="middle"
                                    align="right"
                                    content={renderLegend}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Idling Chart */}
            <Card className="border-none shadow-sm bg-white">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-500">Idling</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={idlingData} barSize={40}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="month"
                                    stroke="#9ca3af"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#9ca3af"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="hours" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* 3. Total KM Driven Chart */}
            <Card className="border-none shadow-sm bg-white">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-500">Total KM Driven</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={kmData} barSize={40}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="month"
                                    stroke="#9ca3af"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#9ca3af"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value / 1000}K`}
                                />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="km" fill="#f97316" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
