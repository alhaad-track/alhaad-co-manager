
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileText, Download, Loader2, TrendingUp, Users, Car, Activity, Clock, MapPin } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { initialTrips, initialVehicles, initialUsers } from "@/lib/data";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function ReportGenerator() {
  const [reportType, setReportType] = useState("trips");
  const [isGenerating, setIsGenerating] = useState(false);

  // --- Stats & Chart Data Calculation ---
  const stats = useMemo(() => {
    if (reportType === "trips") {
      const totalDistance = initialTrips.reduce((acc, t) => acc + parseInt(t.distance), 0);
      const totalDuration = initialTrips.length * 2.5; // Mock avg duration
      return [
        { label: "Total Trips", value: initialTrips.length, icon: MapPin, color: "text-blue-600", bg: "bg-blue-100" },
        { label: "Total Distance", value: totalDistance + " km", icon: TrendingUp, color: "text-green-600", bg: "bg-green-100" },
        { label: "Avg Duration", value: "2h 30m", icon: Clock, color: "text-orange-600", bg: "bg-orange-100" },
      ];
    } else if (reportType === "vehicles") {
      const online = initialVehicles.filter(v => v.status === "online").length;
      const moving = initialVehicles.filter(v => v.status === "moving").length;
      const offline = initialVehicles.filter(v => v.status === "offline").length;
      return [
        { label: "Total Fleet", value: initialVehicles.length, icon: Car, color: "text-blue-600", bg: "bg-blue-100" },
        { label: "Active (Moving)", value: moving, icon: Activity, color: "text-green-600", bg: "bg-green-100" },
        { label: "Offline", value: offline, icon: PowerOffIcon, color: "text-gray-600", bg: "bg-gray-100" },
      ];
    } else {
      const managers = initialUsers.filter(u => u.role === "manager").length;
      return [
        { label: "Total Users", value: initialUsers.length, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
        { label: "Managers", value: managers, icon: UserCheckIcon, color: "text-purple-600", bg: "bg-purple-100" },
        { label: "Standard Users", value: initialUsers.length - managers, icon: Users, color: "text-gray-600", bg: "bg-gray-100" },
      ];
    }
  }, [reportType]);

  const chartData = useMemo(() => {
    if (reportType === "trips") {
      return initialTrips.map(t => ({ name: t.id, value: parseInt(t.distance) }));
    } else if (reportType === "vehicles") {
      const counts = initialVehicles.reduce((acc, v) => {
        acc[v.status] = (acc[v.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    } else {
      const counts = initialUsers.reduce((acc, u) => {
        acc[u.role] = (acc[u.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }
  }, [reportType]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // --- PDF Generation ---
  const generatePDF = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const doc = new jsPDF();
      const date = new Date().toLocaleDateString();

      doc.setFontSize(20);
      doc.text("Alhaad Track & Transport", 14, 22);
      doc.setFontSize(12);
      doc.text("Report Type: " + (reportType.charAt(0).toUpperCase() + reportType.slice(1)) + " Report", 14, 32);
      doc.text("Date: " + date, 14, 38);

      let head: string[][] = [];
      let body: string[][] = [];

      if (reportType === "trips") {
        head = [['ID', 'Vehicle', 'Start', 'End', 'Distance', 'Duration']];
        body = initialTrips.map(t => [t.id, initialVehicles.find(v => v.id === t.vehicleId)?.name || "Unknown", t.startLocation, t.endLocation, t.distance, t.duration]);
      } else if (reportType === "vehicles") {
        head = [['ID', 'Name', 'IMEI', 'Status', 'Driver']];
        body = initialVehicles.map(v => [v.id, v.name, v.imei, v.status, v.driverId ? "Assigned" : "Unassigned"]);
      } else {
        head = [['ID', 'Name', 'Email', 'Role', 'Created At']];
        body = initialUsers.map(u => [u.id, u.name, u.email, u.role, u.createdAt]);
      }

      autoTable(doc, { startY: 45, head, body });
      doc.save("alhaad_report_" + reportType + "_" + Date.now() + ".pdf");
      setIsGenerating(false);
    }, 1000);
  };

  return (
    <div className="space-y-8">
      {/* 1. Controls Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-900">Report Configuration</h2>
          <p className="text-sm text-gray-500">Select parameters to generate insights.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
          <div className="w-full sm:w-[200px]">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trips">Trip History</SelectItem>
                <SelectItem value="vehicles">Vehicle Status</SelectItem>
                <SelectItem value="users">User List</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={generatePDF} disabled={isGenerating} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Export PDF
          </Button>
        </div>
      </div>

      {/* 2. Insights & Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <div className="lg:col-span-1 space-y-4">
          {stats.map((stat, idx) => (
            <Card key={idx} className="border-none shadow-sm bg-white overflow-hidden">
              <CardContent className="p-6 flex items-center gap-4">
                <div className={"p-3 rounded-lg " + stat.bg}>
                  <stat.icon className={"h-6 w-6 " + stat.color} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart */}
        <Card className="lg:col-span-2 border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle>
              {reportType === 'trips' ? 'Distance per Trip' :
                reportType === 'vehicles' ? 'Fleet Status Distribution' : 'User Role Distribution'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                {reportType === 'trips' ? (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" hide />
                    <YAxis />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {chartData.map((entry, index) => (
                        <Cell key={"cell-" + index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Detailed Data Table */}
      <Card className="border-none shadow-sm bg-white">
        <CardHeader>
          <CardTitle>Detailed Report Data</CardTitle>
          <CardDescription>View detailed records before exporting.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                <tr>
                  {reportType === "trips" && ["ID", "Vehicle", "Start", "End", "Distance", "Duration"].map(h => <th key={h} className="px-6 py-3 font-medium">{h}</th>)}
                  {reportType === "vehicles" && ["ID", "Name", "IMEI", "Status", "Driver"].map(h => <th key={h} className="px-6 py-3 font-medium">{h}</th>)}
                  {reportType === "users" && ["ID", "Name", "Email", "Role", "Created At"].map(h => <th key={h} className="px-6 py-3 font-medium">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reportType === "trips" && initialTrips.map((trip) => (
                  <tr key={trip.id} className="bg-white hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">#{trip.id}</td>
                    <td className="px-6 py-4">{initialVehicles.find(v => v.id === trip.vehicleId)?.name || "Unknown"}</td>
                    <td className="px-6 py-4 text-gray-500">{trip.startLocation}</td>
                    <td className="px-6 py-4 text-gray-500">{trip.endLocation}</td>
                    <td className="px-6 py-4 font-medium">{trip.distance}</td>
                    <td className="px-6 py-4">{trip.duration}</td>
                  </tr>
                ))}
                {reportType === "vehicles" && initialVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="bg-white hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">#{vehicle.id}</td>
                    <td className="px-6 py-4 font-medium">{vehicle.name}</td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{vehicle.imei}</td>
                    <td className="px-6 py-4">
                      <span className={"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize " +
                        (vehicle.status === 'online' ? 'bg-green-100 text-green-800' :
                          vehicle.status === 'moving' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800')}>
                        {vehicle.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{vehicle.driverId ? "Assigned" : "Unassigned"}</td>
                  </tr>
                ))}
                {reportType === "users" && initialUsers.map((user) => (
                  <tr key={user.id} className="bg-white hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">#{user.id}</td>
                    <td className="px-6 py-4 font-medium">{user.name}</td>
                    <td className="px-6 py-4 text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 capitalize">
                      <span className={"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium " +
                        (user.role === 'manager' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800')}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{user.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper Icons
function PowerOffIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
      <line x1="12" x2="12" y1="2" y2="12" />
    </svg>
  )
}

function UserCheckIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  )
}

