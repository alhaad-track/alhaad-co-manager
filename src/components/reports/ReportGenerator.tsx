"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileText, Download, Loader2, TrendingUp, Filter, AlertTriangle, MapPin, Navigation, Clock, Activity, StopCircle, ChevronDown, ChevronUp } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import {
  getDevices,
  getTrips,
  getEvents,
  getStops,
  getSummary,
  getRoute,
  reverseGeocode
} from "@/lib/api";
import TripMap from "@/components/map/TripMap";

// Helper to format duration
const formatDuration = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
};

export default function ReportGenerator() {
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [reportType, setReportType] = useState("trips");
  const [period, setPeriod] = useState("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [loading, setLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Map state
  const [isMapCollapsed, setIsMapCollapsed] = useState(false);

  // Address state for route report
  const [addressMap, setAddressMap] = useState<Record<number, string>>({});
  const [loadingAddresses, setLoadingAddresses] = useState<Record<number, boolean>>({});

  // Trip Map state
  const [selectedTripRoute, setSelectedTripRoute] = useState<any[]>([]);
  const [loadingTripRoute, setLoadingTripRoute] = useState<string | null>(null); // Stores trip ID or index being loaded

  // Fetch devices on mount
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const data = await getDevices();
        setDevices(data);
        if (data.length > 0) {
          setSelectedDeviceId(data[0].id.toString());
        }
      } catch (err) {
        console.error("Failed to load devices", err);
        setError("Failed to load devices list.");
      }
    };
    fetchDevices();
  }, []);

  // Clear report data when parameters change
  useEffect(() => {
    setReportData([]);
    setError(null);
    setAddressMap({});
    setLoadingAddresses({});
    setSelectedTripRoute([]);
  }, [selectedDeviceId, reportType, period, customFrom, customTo]);

  const getDateRange = () => {
    const to = new Date();
    const from = new Date();

    switch (period) {
      case "today":
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case "yesterday":
        from.setDate(from.getDate() - 1);
        from.setHours(0, 0, 0, 0);
        to.setDate(to.getDate() - 1);
        to.setHours(23, 59, 59, 999);
        break;
      case "this_week":
        const day = from.getDay() || 7;
        if (day !== 1) from.setHours(-24 * (day - 1));
        from.setHours(0, 0, 0, 0);
        break;
      case "7_days":
        from.setDate(from.getDate() - 7);
        break;
      case "this_month":
        from.setDate(1);
        from.setHours(0, 0, 0, 0);
        break;
      case "custom":
        if (!customFrom || !customTo) throw new Error("Please select start and end dates.");
        return { from: new Date(customFrom).toISOString(), to: new Date(customTo).toISOString() };
    }
    return { from: from.toISOString(), to: to.toISOString() };
  };

  const handleGenerate = async () => {
    if (!selectedDeviceId) {
      setError("Please select a device.");
      return;
    }
    setLoading(true);
    setError(null);
    setReportData([]);
    setAddressMap({});
    setLoadingAddresses({});
    setSelectedTripRoute([]);

    try {
      const range = getDateRange();
      const params = new URLSearchParams({
        deviceId: selectedDeviceId,
        from: range.from,
        to: range.to
      });

      let data: any[] = [];
      switch (reportType) {
        case "trips": data = await getTrips(params); break;
        case "stops": data = await getStops(params); break;
        case "summary": data = await getSummary(params); break;
        case "events": data = await getEvents(params); break;
        case "route": data = await getRoute(params); break;
        default: throw new Error("Unknown report type");
      }

      setReportData(data);
      if (data.length === 0) setError("No data found for the selected period.");
    } catch (err: any) {
      console.error("Report generation failed", err);
      setError(err.message || "Failed to generate report.");
    } finally {
      setLoading(false);
    }
  };

  const handleShowAddress = async (lat: number, lon: number, index: number) => {
    if (!lat || !lon) return;
    setLoadingAddresses(prev => ({ ...prev, [index]: true }));
    try {
      const address = await reverseGeocode(lat, lon);
      setAddressMap(prev => ({ ...prev, [index]: address }));
    } catch (err) {
      console.error("Failed to fetch address", err);
    } finally {
      setLoadingAddresses(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleShowTripRoute = async (trip: any, index: number) => {
    setLoadingTripRoute(index.toString());
    try {
      // Fetch route for specific trip duration
      const params = new URLSearchParams({
        deviceId: selectedDeviceId,
        from: new Date(trip.startTime).toISOString(),
        to: new Date(trip.endTime).toISOString()
      });
      const routeData = await getRoute(params);
      setSelectedTripRoute(routeData);
      setIsMapCollapsed(false); // Auto expand map
    } catch (err) {
      console.error("Failed to fetch trip route", err);
      setError("Failed to load map for this trip.");
    } finally {
      setLoadingTripRoute(null);
    }
  };

  // --- Statistics Calculation ---
  const stats = useMemo(() => {
    if (!reportData.length) return [];

    if (reportType === "trips") {
      const totalDist = reportData.reduce((acc, t) => acc + t.distance, 0);
      const totalDuration = reportData.reduce((acc, t) => acc + t.duration, 0);
      const avgSpeed = reportData.reduce((acc, t) => acc + (t.averageSpeed || 0), 0) / reportData.length;

      return [
        { label: "Total Trips", value: reportData.length, icon: Navigation, color: "text-blue-600", bg: "bg-blue-100" },
        { label: "Total Distance", value: `${(totalDist / 1000).toFixed(2)} km`, icon: MapPin, color: "text-green-600", bg: "bg-green-100" },
        { label: "Total Duration", value: formatDuration(totalDuration), icon: Clock, color: "text-orange-600", bg: "bg-orange-100" },
        { label: "Avg Speed", value: `${(avgSpeed * 1.852).toFixed(1)} km/h`, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-100" }
      ];
    } else if (reportType === "stops") {
      const totalDuration = reportData.reduce((acc, s) => acc + s.duration, 0);
      return [
        { label: "Total Stops", value: reportData.length, icon: StopCircle, color: "text-red-600", bg: "bg-red-100" },
        { label: "Total Idle Time", value: formatDuration(totalDuration), icon: Clock, color: "text-orange-600", bg: "bg-orange-100" },
        { label: "Avg Stop Time", value: formatDuration(totalDuration / (reportData.length || 1)), icon: Activity, color: "text-blue-600", bg: "bg-blue-100" }
      ];
    } else if (reportType === "events") {
      const types = new Set(reportData.map(e => e.type)).size;
      return [
        { label: "Total Events", value: reportData.length, icon: AlertTriangle, color: "text-yellow-600", bg: "bg-yellow-100" },
        { label: "Event Types", value: types, icon: Filter, color: "text-blue-600", bg: "bg-blue-100" }
      ];
    } else if (reportType === "summary") {
      const row = reportData[0] || {};
      return [
        { label: "Distance", value: `${((row.distance || 0) / 1000).toFixed(2)} km`, icon: MapPin, color: "text-green-600", bg: "bg-green-100" },
        { label: "Max Speed", value: `${((row.maxSpeed || 0) * 1.852).toFixed(1)} km/h`, icon: TrendingUp, color: "text-red-600", bg: "bg-red-100" },
        { label: "Engine Hours", value: formatDuration(row.engineHours || 0), icon: Activity, color: "text-purple-600", bg: "bg-purple-100" }
      ];
    } else if (reportType === "route") {
      const avgSpeed = reportData.reduce((acc, p) => acc + (p.speed || 0), 0) / reportData.length;
      return [
        { label: "Data Points", value: reportData.length, icon: MapPin, color: "text-blue-600", bg: "bg-blue-100" },
        { label: "Avg Speed", value: `${(avgSpeed * 1.852).toFixed(1)} km/h`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-100" }
      ];
    }
    return [];
  }, [reportData, reportType]);

  // --- Chart Data Preparation ---
  const chartData = useMemo(() => {
    if (!reportData.length) return [];

    if (reportType === "trips") {
      // Bar Chart: Distance per Trip (Last 20)
      return reportData.slice(-20).map((t, i) => ({
        name: `Trip ${i + 1}`,
        value: parseFloat((t.distance / 1000).toFixed(2)),
        date: new Date(t.startTime).toLocaleDateString()
      }));
    } else if (reportType === "stops") {
      // Bar Chart: Duration per Stop (Last 20)
      return reportData.slice(-20).map((s, i) => ({
        name: `Stop ${i + 1}`,
        value: parseFloat((s.duration / 60000).toFixed(1)), // Minutes
      }));
    } else if (reportType === "events") {
      // Pie Chart: Event Type Distribution
      const counts: Record<string, number> = {};
      reportData.forEach(e => counts[e.type] = (counts[e.type] || 0) + 1);
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    } else if (reportType === "route") {
      // Line Chart: Speed over Time (Downsampled)
      return reportData.filter((_, i) => i % Math.max(1, Math.floor(reportData.length / 50)) === 0).map(p => ({
        name: new Date(p.fixTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: parseFloat(((p.speed || 0) * 1.852).toFixed(1))
      }));
    }
    return [];
  }, [reportData, reportType]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const generatePDF = () => {
    setIsGeneratingPdf(true);
    setTimeout(() => {
      const doc = new jsPDF();
      const date = new Date().toLocaleDateString();
      const deviceName = devices.find(d => d.id.toString() === selectedDeviceId)?.name || "Unknown Device";

      doc.setFontSize(20);
      doc.text("Alhaad Track Report", 14, 22);
      doc.setFontSize(12);
      doc.text(`Type: ${reportType.toUpperCase()}`, 14, 32);
      doc.text(`Device: ${deviceName}`, 14, 38);
      doc.text(`Generated: ${date}`, 14, 44);

      let head: string[][] = [];
      let body: string[][] = [];

      if (reportType === "trips") {
        head = [['Start Time', 'End Time', 'Distance (km)', 'Avg Speed (kn)', 'Duration']];
        body = reportData.map(t => [new Date(t.startTime).toLocaleString(), new Date(t.endTime).toLocaleString(), (t.distance / 1000).toFixed(2), t.averageSpeed?.toFixed(1) || "0", formatDuration(t.duration)]);
      } else if (reportType === "stops") {
        head = [['Start Time', 'End Time', 'Duration', 'Address']];
        body = reportData.map(s => [new Date(s.startTime).toLocaleString(), new Date(s.endTime).toLocaleString(), formatDuration(s.duration), s.address || "Unknown"]);
      } else if (reportType === "events") {
        head = [['Time', 'Type', 'Geofence']];
        body = reportData.map(e => [new Date(e.eventTime).toLocaleString(), e.type, e.geofenceId ? `Geofence #${e.geofenceId}` : "-"]);
      } else if (reportType === "summary") {
        head = [['Device', 'Distance (km)', 'Max Speed']];
        body = reportData.map(s => [deviceName, (s.distance / 1000).toFixed(2), s.maxSpeed?.toFixed(1) || "0"]);
      } else if (reportType === "route") {
        head = [['Time', 'Lat', 'Lon', 'Speed', 'Address']];
        // For PDF, we just hyphen for async addresses to keep it synchronous and simple, or could pre-fetch
        body = reportData.slice(0, 500).map((p, idx) => [
          new Date(p.fixTime).toLocaleString(),
          p.latitude?.toFixed(5) || "0",
          p.longitude?.toFixed(5) || "0",
          p.speed ? (p.speed * 1.852).toFixed(1) : "0",
          addressMap[idx] || p.address || "-"
        ]);
      }

      autoTable(doc, { startY: 50, head, body });
      doc.save(`alhaad_report_${reportType}_${Date.now()}.pdf`);
      setIsGeneratingPdf(false);
    }, 100);
  };

  return (
    <div className="space-y-8">
      {/* Controls Section */}
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-xl text-orange-600">Report Generator</CardTitle>
          <CardDescription>Select device and parameters to generate detailed reports.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2"><Label>Device</Label><Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}><SelectTrigger><SelectValue placeholder="Select Device" /></SelectTrigger><SelectContent>{devices.map(d => (<SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>))}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Report Type</Label><Select value={reportType} onValueChange={setReportType}><SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger><SelectContent><SelectItem value="trips">Trips</SelectItem><SelectItem value="stops">Stops</SelectItem><SelectItem value="summary">Summary</SelectItem><SelectItem value="events">Events</SelectItem><SelectItem value="route">Route (Raw Data)</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Period</Label><Select value={period} onValueChange={setPeriod}><SelectTrigger><SelectValue placeholder="Select Period" /></SelectTrigger><SelectContent><SelectItem value="today">Today</SelectItem><SelectItem value="yesterday">Yesterday</SelectItem><SelectItem value="this_week">This Week</SelectItem><SelectItem value="7_days">Last 7 Days</SelectItem><SelectItem value="this_month">This Month</SelectItem><SelectItem value="custom">Custom Range</SelectItem></SelectContent></Select></div>
            <Button onClick={handleGenerate} disabled={loading} className="bg-orange-600 hover:bg-orange-700 text-white w-full">{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Filter className="mr-2 h-4 w-4" />} Generate Report</Button>
          </div>
          {period === "custom" && (<div className="grid grid-cols-2 gap-4 mt-4 bg-gray-50 p-4 rounded-lg"><div className="space-y-2"><Label>From</Label><Input type="datetime-local" value={customFrom} onChange={e => setCustomFrom(e.target.value)} /></div><div className="space-y-2"><Label>To</Label><Input type="datetime-local" value={customTo} onChange={e => setCustomTo(e.target.value)} /></div></div>)}
          {error && (<div className="mt-4 bg-red-50 text-red-600 p-3 rounded-md flex items-center gap-2 text-sm"><AlertTriangle className="h-4 w-4" />{error}</div>)}
        </CardContent>
      </Card>

      {/* Results Section */}
      {reportData.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-600" />
              Report Results ({reportData.length} records)
            </h3>
            <Button variant="outline" onClick={generatePDF} disabled={isGeneratingPdf} className="border-orange-200 text-orange-700 hover:bg-orange-50">
              {isGeneratingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />} Export PDF
            </Button>
          </div>

          {/* Stats Grid */}
          {stats.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, idx) => (
                <Card key={idx} className="border-none shadow-sm bg-white">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className={"p-3 rounded-lg " + stat.bg}><stat.icon className={"h-6 w-6 " + stat.color} /></div>
                    <div><p className="text-sm font-medium text-gray-500">{stat.label}</p><h3 className="text-xl font-bold text-gray-900">{stat.value}</h3></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Trip Map for Route/Stops Report and Trips Selection (Collapsible) */}
          {(reportType === 'route' || reportType === 'stops' || (reportType === 'trips' && selectedTripRoute.length > 0)) && (
            <div className="mb-6 border rounded-lg overflow-hidden shadow-sm bg-gray-100 transition-all duration-300">
              <div className="flex items-center justify-between p-2 bg-white border-b px-4 cursor-pointer" onClick={() => setIsMapCollapsed(!isMapCollapsed)}>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-orange-600" />
                  <h3 className="font-semibold text-sm text-gray-700">
                    {reportType === 'stops' ? 'Stops Visualization' :
                      reportType === 'trips' ? 'Trip Route Visualization' :
                        'Route Map Visualization'}
                  </h3>
                </div>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  {isMapCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </Button>
              </div>
              {!isMapCollapsed && (
                <div className="h-[400px] relative">
                  <TripMap
                    showAllMarkers={reportType === 'stops'}
                    route={reportType === 'trips' ? selectedTripRoute : reportData.map(p => ({
                      latitude: p.latitude,
                      longitude: p.longitude,
                      fixTime: p.startTime || p.fixTime,
                      speed: p.speed || 0,
                      address: p.address
                    }))}
                  />
                </div>
              )}
            </div>
          )}

          {/* Visualization Chart */}
          {chartData.length > 0 && reportType !== 'summary' && (
            <Card className="border-none shadow-sm bg-white">
              <CardHeader><CardTitle>Visualization</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {reportType === 'events' ? (
                      <PieChart>
                        <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                          {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    ) : reportType === 'route' ? (
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis label={{ value: 'km/h', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#ea580c" strokeWidth={2} dot={false} />
                      </LineChart>
                    ) : (
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip cursor={{ fill: 'transparent' }} />
                        <Bar dataKey="value" fill="#ea580c" radius={[4, 4, 0, 0]} name={reportType === 'trips' ? 'Distance (km)' : 'Duration (min)'} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Details Table */}
          <Card className="overflow-hidden border-0 shadow-sm bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-orange-50/50 border-b">
                  <tr>
                    {reportType === "trips" && ["Start Time", "End Time", "Distance", "Avg Speed", "Duration", "Actions"].map(h => <th key={h} className="px-6 py-3 font-medium">{h}</th>)}
                    {reportType === "stops" && ["Start Time", "End Time", "Duration", "Address"].map(h => <th key={h} className="px-6 py-3 font-medium">{h}</th>)}
                    {reportType === "events" && ["Time", "Type", "Geofence / Attributes"].map(h => <th key={h} className="px-6 py-3 font-medium">{h}</th>)}
                    {reportType === "summary" && ["Device", "Distance", "Max Speed", "Engine Hours"].map(h => <th key={h} className="px-6 py-3 font-medium">{h}</th>)}
                    {reportType === "route" && ["Time", "Lat", "Lon", "Speed", "Address"].map(h => <th key={h} className="px-6 py-3 font-medium">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reportData.slice(0, 100).map((row, idx) => (
                    <tr key={idx} className="bg-white hover:bg-gray-50/50 transition-colors">
                      {reportType === "trips" && (<><td className="px-6 py-4">{new Date(row.startTime).toLocaleString()}</td><td className="px-6 py-4">{new Date(row.endTime).toLocaleString()}</td><td className="px-6 py-4">{(row.distance / 1000).toFixed(2)} km</td><td className="px-6 py-4">{row.averageSpeed ? (row.averageSpeed * 1.852).toFixed(1) : "0"} km/h</td><td className="px-6 py-4">{formatDuration(row.duration)}</td>
                        <td className="px-6 py-4">
                          <Button variant="ghost" size="sm" className="text-orange-600 hover:bg-orange-50" onClick={() => handleShowTripRoute(row, idx)} disabled={loadingTripRoute === idx.toString()}>
                            {loadingTripRoute === idx.toString() ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4 mr-1" />}
                            Show Route
                          </Button>
                        </td></>)}
                      {reportType === "stops" && (
                        <>
                          <td className="px-6 py-4">{new Date(row.startTime).toLocaleString()}</td>
                          <td className="px-6 py-4">{new Date(row.endTime).toLocaleString()}</td>
                          <td className="px-6 py-4">{formatDuration(row.duration)}</td>
                          <td className="px-6 py-4 text-gray-500 truncate max-w-xs">
                            {addressMap[idx] || row.address ? (
                              <span className="text-gray-700">{addressMap[idx] || row.address}</span>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-orange-600 h-6 px-2 hover:bg-orange-50"
                                onClick={() => handleShowAddress(row.latitude, row.longitude, idx)}
                                disabled={loadingAddresses[idx]}
                              >
                                {loadingAddresses[idx] ? <Loader2 className="h-3 w-3 animate-spin" /> : "Show Address"}
                              </Button>
                            )}
                          </td>
                        </>
                      )}
                      {reportType === "events" && (<><td className="px-6 py-4">{new Date(row.eventTime).toLocaleString()}</td><td className="px-6 py-4 font-medium capitalize">{row.type}</td><td className="px-6 py-4 text-gray-500">{row.geofenceId ? `Geofence ID: ${row.geofenceId}` : JSON.stringify(row.attributes)}</td></>)}
                      {reportType === "summary" && (<><td className="px-6 py-4 font-medium">{devices.find(d => d.id === row.deviceId)?.name || row.deviceId}</td><td className="px-6 py-4">{(row.distance / 1000).toFixed(2)} km</td><td className="px-6 py-4">{row.maxSpeed ? (row.maxSpeed * 1.852).toFixed(1) : "0"} km/h</td><td className="px-6 py-4">{row.engineHours ? formatDuration(row.engineHours) : "-"}</td></>)}
                      {reportType === "route" && (
                        <>
                          <td className="px-6 py-4">{new Date(row.fixTime).toLocaleString()}</td>
                          <td className="px-6 py-4 font-mono">{row.latitude?.toFixed(5) || "0"}</td>
                          <td className="px-6 py-4 font-mono">{row.longitude?.toFixed(5) || "0"}</td>
                          <td className="px-6 py-4">{row.speed ? (row.speed * 1.852).toFixed(1) : "0"} km/h</td>
                          <td className="px-6 py-4 truncate max-w-xs">
                            {addressMap[idx] ? (
                              <span className="text-gray-700">{addressMap[idx]}</span>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-orange-600 h-6 px-2 hover:bg-orange-50"
                                onClick={() => handleShowAddress(row.latitude, row.longitude, idx)}
                                disabled={loadingAddresses[idx]}
                              >
                                {loadingAddresses[idx] ? <Loader2 className="h-3 w-3 animate-spin" /> : "Show Address"}
                              </Button>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {reportData.length > 100 && (<div className="p-4 text-center text-sm text-gray-500 bg-gray-50">Showing first 100 records. Export to PDF to see all.</div>)}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
