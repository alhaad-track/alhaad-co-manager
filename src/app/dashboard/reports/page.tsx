import ReportGenerator from "@/components/reports/ReportGenerator";

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
                <p className="text-muted-foreground mt-2">
                    Generate and download system reports.
                </p>
            </div>

            <ReportGenerator />
        </div>
    );
}
