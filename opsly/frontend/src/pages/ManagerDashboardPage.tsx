import { useDashboardEvents } from '@/hooks/useWebSocket';
import { useDashboardStore } from '@/stores/dashboardStore';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { WorkOrderTable } from '@/components/dashboard/WorkOrderTable';
import { WorkOrderDetail } from '@/components/dashboard/WorkOrderDetail';
import { EscalationFeed } from '@/components/dashboard/EscalationFeed';
import { TechnicianPanel } from '@/components/dashboard/TechnicianPanel';
import { AssignTechnicianModal } from '@/components/dashboard/AssignTechnicianModal';
import { useAuth } from '@/hooks/useAuth';

export default function ManagerDashboardPage() {
  const { user } = useAuth();
  const { isConnected } = useDashboardEvents();
  const selectedWorkOrderId = useDashboardStore((s) => s.selectedWorkOrderId);

  return (
    <div className="min-h-screen">
      {/* Top Navigation */}
      <header className="glass-nav sticky top-0 z-30 px-6 py-3.5">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-lg font-bold tracking-tight select-none">OPSLY</h1>
            <nav className="hidden md:flex items-center gap-1">
              <span className="pill-active">Dashboard</span>
            </nav>
          </div>

          <div className="flex items-center gap-5">
            {/* Connection indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/40">
              <span className={`size-2 rounded-full ${
                isConnected ? 'bg-opsly-low' : 'bg-opsly-urgent animate-pulse'
              }`} />
              <span className="text-xs font-medium text-muted-foreground">
                {isConnected ? 'Live' : 'Connecting...'}
              </span>
            </div>

            {/* Separator */}
            <div className="h-5 w-px bg-border" />

            {/* User info */}
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/5">
                <span className="text-xs font-semibold text-primary">
                  {user?.email?.charAt(0).toUpperCase() ?? 'M'}
                </span>
              </div>
              <span className="text-sm font-medium hidden sm:inline">
                {user?.email?.split('@')[0] ?? 'Manager'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        {/* KPI Cards */}
        <KpiCards />

        {/* Filter Bar */}
        <FilterBar />

        {/* Main Grid: Table + Side Panels */}
        <div className={`grid gap-6 ${
          selectedWorkOrderId
            ? 'grid-cols-1 xl:grid-cols-[1fr_380px]'
            : 'grid-cols-1 xl:grid-cols-[1fr_340px]'
        }`}>
          {/* Left: Work Order Table */}
          <div className="min-w-0">
            <WorkOrderTable />
          </div>

          {/* Right: Detail or Side Panels */}
          <div className="space-y-6">
            {selectedWorkOrderId ? (
              <WorkOrderDetail />
            ) : (
              <>
                <EscalationFeed />
                <TechnicianPanel />
              </>
            )}
          </div>
        </div>
      </main>

      {/* Assign Technician Modal (global) */}
      <AssignTechnicianModal />
    </div>
  );
}
