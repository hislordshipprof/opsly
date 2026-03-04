import { useAuth } from '@/hooks/useAuth';
import VoiceWidget from '@/components/voice/VoiceWidget';

export default function TenantReportPage() {
  const { user, logout } = useAuth();

  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <h1 className="text-lg font-bold">OPSLY</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {user?.email} ({user?.role})
          </span>
          <button
            onClick={logout}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Sign out
          </button>
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
