import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTechnicianSchedule } from '@/services/api';
import { QUERY_KEYS } from '@/services/query-keys';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardEvents } from '@/hooks/useWebSocket';
import { JobQueue } from '@/components/technician/JobQueue';
import { JobDetail } from '@/components/technician/JobDetail';
import { VoiceWidget } from '@/components/voice/VoiceWidget';
import type { TechnicianSchedule } from '@/types';

export default function TechnicianDashboardPage() {
  const { user } = useAuth();
  const { isConnected } = useDashboardEvents();
  const [activeStopId, setActiveStopId] = useState<string | null>(null);

  const { data: schedule, isLoading } = useQuery<TechnicianSchedule | null>({
    queryKey: QUERY_KEYS.schedule(),
    queryFn: () => getTechnicianSchedule(),
    refetchInterval: false,
  });

  const stops = schedule?.stops ?? [];
  const activeStop = stops.find((s) => s.id === activeStopId) ?? null;

  return (
    <div className="min-h-screen">
      {/* Top Navigation */}
      <header className="glass-nav sticky top-0 z-30 px-6 py-3.5">
        <div className="max-w-[900px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-lg font-bold tracking-tight select-none">OPSLY</h1>
            <nav className="hidden md:flex items-center gap-1">
              <span className="pill-active">My Jobs</span>
            </nav>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/40">
              <span className={`size-2 rounded-full ${
                isConnected ? 'bg-opsly-low' : 'bg-opsly-urgent animate-pulse'
              }`} />
              <span className="text-xs font-medium text-muted-foreground">
                {isConnected ? 'Live' : 'Connecting...'}
              </span>
            </div>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-full bg-opsly-low/10 flex items-center justify-center ring-2 ring-opsly-low/10">
                <span className="text-xs font-semibold text-opsly-low">
                  {user?.email?.charAt(0).toUpperCase() ?? 'T'}
                </span>
              </div>
              <span className="text-sm font-medium hidden sm:inline">
                {user?.email?.split('@')[0] ?? 'Technician'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[900px] mx-auto px-6 py-6">
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-card h-20 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && stops.length === 0 && (
          <div className="glass-card p-12 text-center">
            <p className="text-lg font-semibold">No jobs scheduled today</p>
            <p className="text-sm text-muted-foreground mt-1">
              Use the voice widget to check your schedule or report status updates.
            </p>
          </div>
        )}

        {!isLoading && stops.length > 0 && (
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-[1fr_380px]">
            {/* Left: Job Queue */}
            <JobQueue
              stops={stops}
              activeStopId={activeStopId}
              onSelectStop={setActiveStopId}
            />

            {/* Right: Job Detail or Voice */}
            <div className="space-y-6">
              {activeStop ? (
                <JobDetail stop={activeStop} onBack={() => setActiveStopId(null)} />
              ) : (
                <div className="glass-card p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Select a job to see details, or use voice to get briefed.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Voice Widget — floating bottom right */}
      <div className="fixed bottom-6 right-6 z-40">
        <VoiceWidget />
      </div>
    </div>
  );
}
