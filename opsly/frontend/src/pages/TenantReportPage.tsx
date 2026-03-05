import { useAuth } from '@/hooks/useAuth';
import { Link, useLocation } from 'react-router-dom';
import VoiceWidget from '@/components/voice/VoiceWidget';

export default function TenantReportPage() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <main className="flex min-h-screen flex-col">
      <header className="glass-nav sticky top-0 z-30 px-6 h-16">
        <div className="max-w-[1440px] mx-auto h-full flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold tracking-tight select-none">OPSLY</h1>
            <div className="flex items-center gap-1">
              <Link
                to="/tenant/report"
                className={location.pathname === '/tenant/report' ? 'pill-active text-xs' : 'pill-inactive text-xs'}
              >
                Report Issue
              </Link>
              <Link
                to="/tenant/orders"
                className={location.pathname === '/tenant/orders' ? 'pill-active text-xs' : 'pill-inactive text-xs'}
              >
                My Orders
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.email}
            </span>
            <button
              onClick={logout}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <section className="flex flex-1 items-center justify-center p-6">
        <div className="h-[600px] w-full max-w-lg">
          <VoiceWidget />
        </div>
      </section>
    </main>
  );
}
