"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Car, Map, LogOut, LayoutDashboard, Hexagon, User, Bell, FileText, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, logout, isAuthenticated } = useAuth();
    const router = useRouter();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, router]);

    if (!isAuthenticated) {
        return null;
    }

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            <div className="p-6 border-b border-gray-200">
                <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
                    <Car className="w-6 h-6" />
                    Alhaad Track
                </h1>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
                    <LayoutDashboard className="w-5 h-5" />
                    Dashboard
                </Link>
                <Link href="/dashboard/users" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
                    <Users className="w-5 h-5" />
                    Users
                </Link>
                <Link href="/dashboard/vehicles" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
                    <Car className="w-5 h-5" />
                    Vehicles
                </Link>
                <Link href="/dashboard/tracking" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
                    <Map className="w-5 h-5" />
                    Live Tracking
                </Link>
                <Link href="/dashboard/geofences" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
                    <Hexagon className="w-5 h-5" />
                    Geofences
                </Link>
                <Link href="/dashboard/drivers" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
                    <User className="w-5 h-5" />
                    Drivers
                </Link>
                <Link href="/dashboard/alerts" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
                    <Bell className="w-5 h-5" />
                    Alerts
                </Link>
                <Link href="/dashboard/reports" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
                    <FileText className="w-5 h-5" />
                    Reports
                </Link>
            </nav>

            <div className="p-4 border-t border-gray-200">
                <div className="flex items-center gap-3 px-4 py-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {user?.name.charAt(0)}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                </div>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={logout}>
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </Button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
            {/* Mobile Header */}
            <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-start gap-4 sticky top-0 z-20">
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="w-6 h-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-72">
                        <SidebarContent />
                    </SheetContent>
                </Sheet>
                <div className="flex items-center gap-2 font-bold text-blue-600">
                    <Car className="w-6 h-6" />
                    Alhaad Track
                </div>
            </div>

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col h-screen sticky top-0">
                <SidebarContent />
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto h-[calc(100vh-65px)] md:h-screen">
                <div className="p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
