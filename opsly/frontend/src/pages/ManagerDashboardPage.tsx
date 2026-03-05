import { useDashboardEvents } from '@/hooks/useWebSocket';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { KpiOverview } from '@/components/dashboard/KpiOverview';
import { WorkOrderTable } from '@/components/dashboard/WorkOrderTable';
import { WorkOrderDetailPanel } from '@/components/dashboard/WorkOrderDetailPanel';
import { EscalationFeed } from '@/components/dashboard/EscalationFeed';
import { TechnicianPanel } from '@/components/dashboard/TechnicianPanel';
import { AssignTechnicianModal } from '@/components/dashboard/AssignTechnicianModal';
import { useAuth } from '@/hooks/useAuth';

export default function ManagerDashboardPage() {
  const { user, logout } = useAuth();
  const { isConnected } = useDashboardEvents();

  return (
    <div className="min-h-screen">
      {/* Ambient glow orbs — dark mode only */}
      <div className="hidden dark:block fixed inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden="true">
        <div className="ambient-orb w-[500px] h-[500px] bg-[hsla(200,80%,50%,0.08)] top-[-5%] left-[-5%]" />
        <div className="ambient-orb w-[600px] h-[600px] bg-[hsla(180,70%,40%,0.06)] bottom-[-10%] right-[-5%]"
             style={{ animationDelay: '2s' }} />
        <div className="ambient-orb w-[400px] h-[400px] bg-[hsla(220,80%,50%,0.05)] top-[40%] left-[30%]"
             style={{ animationDelay: '1s' }} />
      </div>

      {/* Top Navigation */}
      <header className="glass-nav sticky top-0 z-30 px-6 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-bold tracking-tight select-none">OPSLY</h1>
            <nav className="hidden md:flex items-center gap-1">
              <span className="nav-tab-active">Dashboard</span>
              <span className="nav-tab-inactive cursor-pointer">Properties</span>
              <span className="nav-tab-inactive cursor-pointer">People</span>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Connection indicator with animated ping */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/30 bg-white/40 dark:border-border dark:bg-card/40">
              <span className="relative flex size-2">
                {isConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-opsly-low opacity-75" />
                )}
                <span className={`relative inline-flex size-2 rounded-full ${
                  isConnected ? 'bg-opsly-low' : 'bg-opsly-urgent animate-pulse'
                }`} />
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {isConnected ? 'Live' : 'Connecting...'}
              </span>
            </div>

            {/* Separator */}
            <div className="h-5 w-px bg-border/50" />

            {/* User info — enhanced with role label */}
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/70">
                  {user?.role ?? 'Admin'}
                </span>
                <span className="text-sm font-medium leading-tight">
                  {user?.name ?? user?.email?.split('@')[0] ?? 'Manager'}
                </span>
                <button
                  onClick={logout}
                  className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors mt-0.5"
                >
                  Sign out
                </button>
              </div>
              <div className="size-9 rounded-full bg-indigo-100/80 dark:bg-primary/10 flex items-center justify-center ring-2 ring-white/50 dark:ring-primary/5">
                <span className="text-xs font-bold text-indigo-700 dark:text-primary">
                  {(user?.name ?? user?.email ?? 'M').charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* KPI Cards */}
        <KpiCards />

        {/* Filter Bar */}
        <FilterBar />

        {/* KPI Overview Metrics Strip */}
        <KpiOverview />

        {/* Main Grid: Table + Side Panels */}
        <div className="grid gap-6 grid-cols-1 xl:grid-cols-[1fr_340px]">
          {/* Left: Work Order Table */}
          <div className="min-w-0">
            <WorkOrderTable />
          </div>

          {/* Right: Side Panels */}
          <div className="space-y-6">
            <EscalationFeed />
            <TechnicianPanel />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-[1600px] mx-auto px-4 sm:px-6 py-10">
        <div className="glass-strip px-6 py-5 flex flex-col md:flex-row justify-between items-center text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
          <p>&copy; 2026 OPSLY Infrastructure Systems</p>
          <div className="flex gap-8 mt-4 md:mt-0">
            <span className="hover:text-foreground transition-colors cursor-pointer">API Status</span>
            <span className="hover:text-foreground transition-colors cursor-pointer">Docs</span>
            <span className="hover:text-foreground transition-colors cursor-pointer">Support</span>
          </div>
        </div>
      </footer>

      {/* Assign Technician Modal (global) */}
      <AssignTechnicianModal />

      {/* Work Order Detail Slide-out Panel (global) */}
      <WorkOrderDetailPanel />
    </div>
  );
}
