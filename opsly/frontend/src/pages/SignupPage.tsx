import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Role } from '@/types';

const ROLE_OPTIONS = [
  { value: Role.TENANT, label: 'Tenant', description: 'Report maintenance issues' },
  { value: Role.TECHNICIAN, label: 'Technician', description: 'Manage assigned work orders' },
  { value: Role.MANAGER, label: 'Manager', description: 'Oversee all operations' },
] as const;

export default function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(Role.TENANT);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      await register({ name: name.trim(), email, password, role });
      navigate('/login');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? String((err as { response: { data: { message: string } } }).response?.data?.message ?? '')
          : '';
      setError(message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen font-[Plus_Jakarta_Sans,DM_Sans,system-ui,sans-serif]">
      {/* Keyframe styles for floating circles and entrance animations */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0) translateX(0) scale(1); }
          33% { transform: translateY(-20px) translateX(10px) scale(1.03); }
          66% { transform: translateY(10px) translateX(-15px) scale(0.97); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(3deg); }
        }
        @keyframes slide-up-fade {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-right-fade {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scale-fade {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 12s ease-in-out infinite; }
        .animate-float-fast { animation: float-fast 6s ease-in-out infinite; }
        .animate-slide-up { animation: slide-up-fade 0.6s cubic-bezier(0.4, 0, 0.2, 1) both; }
        .animate-slide-up-d1 { animation: slide-up-fade 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.08s both; }
        .animate-slide-up-d2 { animation: slide-up-fade 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.16s both; }
        .animate-slide-up-d3 { animation: slide-up-fade 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.24s both; }
        .animate-slide-up-d4 { animation: slide-up-fade 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.32s both; }
        .animate-slide-up-d5 { animation: slide-up-fade 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.40s both; }
        .animate-slide-up-d6 { animation: slide-up-fade 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.48s both; }
        .animate-slide-right { animation: slide-right-fade 0.8s cubic-bezier(0.4, 0, 0.2, 1) both; }
        .animate-scale-fade { animation: scale-fade 0.5s cubic-bezier(0.4, 0, 0.2, 1) both; }
        .btn-shimmer {
          background-size: 200% 100%;
          background-image: linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.15) 50%, transparent 75%);
        }
        .btn-shimmer:hover { animation: shimmer 1.5s ease-in-out infinite; }
        .input-lift {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .input-lift:focus {
          transform: translateY(-1px);
          box-shadow: 0 4px 20px -4px rgba(59, 130, 246, 0.15);
        }
      `}</style>

      {/* Left — Brand gradient panel (lighter blue) */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-[#3b82f6] to-[#60a5fa] flex-col justify-between p-12">
        {/* Animated floating circles */}
        <div className="absolute top-[12%] left-[8%] size-72 rounded-full bg-white/[0.07] blur-3xl animate-float-slow" />
        <div className="absolute bottom-[15%] right-[3%] size-96 rounded-full bg-sky-300/[0.08] blur-3xl animate-float-medium" />
        <div className="absolute top-[55%] left-[35%] size-48 rounded-full bg-white/[0.06] blur-2xl animate-float-fast" />
        <div className="absolute top-[30%] right-[20%] size-32 rounded-full bg-blue-200/[0.08] blur-2xl animate-float-medium" style={{ animationDelay: '2s' }} />

        {/* Brand content — slide-in animations */}
        <div className="relative z-10 animate-slide-right">
          <div className="flex items-center gap-3 group cursor-default">
            <div className="size-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <span className="text-white font-bold text-lg">O</span>
            </div>
            <span className="text-white font-bold text-2xl tracking-tight">OPSLY</span>
          </div>
        </div>

        <div className="relative z-10 space-y-4 animate-slide-right" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-white text-3xl font-bold tracking-tight leading-tight">
            Get Started with<br />Smart Operations
          </h2>
          <p className="text-white/70 text-base max-w-sm leading-relaxed">
            Join the platform that uses voice AI and real-time dashboards to streamline property maintenance.
          </p>
        </div>

        <div className="relative z-10 animate-slide-right" style={{ animationDelay: '0.4s' }}>
          <p className="text-white/40 text-xs">
            Built with Google Gemini AI
          </p>
        </div>
      </div>

      {/* Right — Signup form */}
      <div className="flex-1 flex items-center justify-center bg-background px-6 py-10">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10 animate-slide-up">
            <div className="size-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">O</span>
            </div>
            <span className="font-bold text-2xl tracking-tight text-foreground">OPSLY</span>
          </div>

          <div className="space-y-2 mb-8 animate-slide-up">
            <h1 className="text-[30px] font-bold tracking-tight text-foreground">
              Create account
            </h1>
            <p className="text-sm text-muted-foreground">
              Set up your profile to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-2xl bg-destructive/10 border border-destructive/20 px-4 py-3 animate-scale-fade">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-1.5 animate-slide-up-d1">
              <label
                htmlFor="name"
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground"
              >
                Full Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Jane Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="input-lift w-full h-12 rounded-2xl border border-input bg-secondary px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:ring-[3px] focus:ring-primary/10 hover:border-border"
              />
            </div>

            <div className="space-y-1.5 animate-slide-up-d2">
              <label
                htmlFor="signup-email"
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground"
              >
                Email Address
              </label>
              <input
                id="signup-email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-lift w-full h-12 rounded-2xl border border-input bg-secondary px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:ring-[3px] focus:ring-primary/10 hover:border-border"
              />
            </div>

            <div className="space-y-1.5 animate-slide-up-d3">
              <label
                htmlFor="signup-password"
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground"
              >
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="input-lift w-full h-12 rounded-2xl border border-input bg-secondary px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:ring-[3px] focus:ring-primary/10 hover:border-border"
              />
            </div>

            <div className="space-y-1.5 animate-slide-up-d4">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                I am a...
              </label>
              <div className="grid grid-cols-3 gap-2">
                {ROLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRole(opt.value)}
                    className={`flex flex-col items-center gap-1 rounded-2xl border px-3 py-3 text-center cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.97] ${
                      role === opt.value
                        ? 'border-primary/40 bg-primary/5 ring-[3px] ring-primary/10 shadow-md shadow-blue-500/10'
                        : 'border-input bg-secondary hover:border-border hover:shadow-sm'
                    }`}
                  >
                    <span className={`text-sm font-semibold transition-colors duration-200 ${
                      role === opt.value ? 'text-primary' : 'text-foreground'
                    }`}>
                      {opt.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-tight">
                      {opt.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="animate-slide-up-d5">
              <Button
                type="submit"
                disabled={loading}
                className="btn-shimmer w-full h-12 rounded-2xl bg-primary text-white font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:brightness-110 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:shadow-none"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  'Create account'
                )}
              </Button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground animate-slide-up-d6">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary font-semibold hover:underline underline-offset-4 transition-colors duration-200 hover:text-primary/80"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
