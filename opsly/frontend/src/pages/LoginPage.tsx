import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      setError('Invalid email or password. Please try again.');
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
        .animate-slide-up-d1 { animation: slide-up-fade 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both; }
        .animate-slide-up-d2 { animation: slide-up-fade 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both; }
        .animate-slide-up-d3 { animation: slide-up-fade 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both; }
        .animate-slide-up-d4 { animation: slide-up-fade 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.4s both; }
        .animate-slide-up-d5 { animation: slide-up-fade 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.5s both; }
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

      {/* Left — Hero image panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between p-12">
        {/* Background image */}
        <img
          src="/hero-apartment.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20" />

        {/* Brand content — slide-in animations */}
        <div className="relative z-10 animate-slide-right">
          <div className="flex items-center gap-3 group cursor-default">
            <div className="size-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <span className="text-white font-bold text-lg">O</span>
            </div>
            <span className="text-white font-bold text-2xl tracking-tight drop-shadow-lg">OPSLY</span>
          </div>
        </div>

        <div className="relative z-10 space-y-4 animate-slide-right" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-white text-3xl font-bold tracking-tight leading-tight drop-shadow-lg">
            AI-Powered Property<br />Management Platform
          </h2>
          <p className="text-white/80 text-base max-w-sm leading-relaxed drop-shadow-md">
            Voice-first maintenance reporting, smart work order routing, and real-time operations visibility.
          </p>
        </div>

        <div className="relative z-10 animate-slide-right" style={{ animationDelay: '0.4s' }}>
          <p className="text-white/50 text-xs drop-shadow-md">
            Built with Google Gemini AI
          </p>
        </div>
      </div>

      {/* Right — Login form */}
      <div className="flex-1 flex items-center justify-center bg-background px-6">
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
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to your account to continue
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
                htmlFor="email"
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-lift w-full h-12 rounded-2xl border border-input bg-secondary px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:ring-[3px] focus:ring-primary/10 hover:border-border"
              />
            </div>

            <div className="space-y-1.5 animate-slide-up-d2">
              <label
                htmlFor="password"
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-lift w-full h-12 rounded-2xl border border-input bg-secondary px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:ring-[3px] focus:ring-primary/10 hover:border-border"
              />
            </div>

            <div className="animate-slide-up-d3">
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
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </Button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground animate-slide-up-d4">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="text-primary font-semibold hover:underline underline-offset-4 transition-colors duration-200 hover:text-primary/80"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
