import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { HecticLogoMark } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const destination =
    (location.state as { from?: { pathname?: string } })?.from?.pathname ||
    '/editor';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please provide both username and password.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await login({ username: username.trim(), password });
      navigate(destination, { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Authentication failed. Verify credentials and server connectivity.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseDemoCredentials = () => {
    setUsername('editor');
    setPassword('editor123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F3F0E9] text-[#111110] flex flex-col justify-between selection:bg-[#14bfb9] selection:text-[#111110]">
      {/* Header */}
      <header className="w-full border-b border-[#111110]/10 bg-white/70 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 text-[#111110] hover:opacity-75 transition-opacity"
        >
          <HecticLogoMark className="h-6 w-7" />
          <span className="font-display text-sm tracking-wider uppercase font-medium">
            Hectic Lab
          </span>
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono-hl text-[#111110]/60 hover:text-[#14bfb9] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Portfolio</span>
        </Link>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[440px] bg-white border border-[#111110]/10 rounded-3xl p-8 sm:p-10 shadow-[0_20px_60px_rgba(17,17,16,0.06)] relative overflow-hidden">
          {/* Subtle Top Accent Ribbon */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#14bfb9] via-[#2cf5ef] to-[#14bfb9]" />

          <div className="text-center mb-8">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2cf5ef]/20 border border-[#14bfb9]/40 mb-4 text-[#0c7c76]">
              <Lock className="h-5 w-5" />
            </div>
            <h1 className="font-display text-2xl font-normal tracking-tight uppercase text-[#111110]">
              Editor Sign In
            </h1>
            <p className="mt-2 text-xs text-[#111110]/65 font-mono-hl">
              Restricted studio access for editors & staff
            </p>
          </div>

          {user && (
            <div className="mb-6 p-4 rounded-2xl bg-[#14bfb9]/10 border border-[#14bfb9]/30 text-xs">
              <div className="flex items-center gap-2 text-[#0c7c76] font-medium mb-1">
                <ShieldCheck className="h-4 w-4" />
                <span>Currently signed in as {user.username}</span>
              </div>
              <p className="text-[#111110]/70 text-[11px] mb-3 font-mono-hl">
                You already hold active {user.is_superuser ? 'Superuser' : 'Editor'} permissions.
              </p>
              <button
                type="button"
                onClick={() => navigate('/editor')}
                className="w-full bg-[#111110] text-[#2cf5ef] font-medium py-2 rounded-xl text-xs hover:bg-black transition-colors cursor-pointer"
              >
                Enter Editor Studio
              </button>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 font-mono-hl leading-relaxed"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-[11px] uppercase tracking-wider font-mono-hl text-[#111110]/70 mb-1.5"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. editor"
                className="w-full rounded-xl bg-[#faf9f5] border border-[#111110]/15 px-4 py-2.5 text-sm text-[#111110] placeholder-[#111110]/35 focus:bg-white focus:border-[#14bfb9] focus:outline-none focus:ring-2 focus:ring-[#14bfb9]/20 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-[11px] uppercase tracking-wider font-mono-hl text-[#111110]/70"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl bg-[#faf9f5] border border-[#111110]/15 px-4 py-2.5 pr-11 text-sm text-[#111110] placeholder-[#111110]/35 focus:bg-white focus:border-[#14bfb9] focus:outline-none focus:ring-2 focus:ring-[#14bfb9]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#111110]/65 hover:text-[#111110] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 rounded-xl bg-[#111110] text-[#2cf5ef] px-4 py-3 text-xs font-medium uppercase tracking-wider hover:bg-black focus:outline-none focus:ring-2 focus:ring-[#14bfb9] focus:ring-offset-2 disabled:opacity-50 transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#2cf5ef] border-t-transparent" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In to Editor</span>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Assistant */}
          <div className="mt-6 pt-5 border-t border-[#111110]/10 text-center">
            <p className="text-[11px] font-mono-hl text-[#111110]/65 mb-2">
              Default Editor Access
            </p>
            <button
              type="button"
              onClick={handleUseDemoCredentials}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#f4f3ee] hover:bg-[#eae8df] border border-[#111110]/10 text-[11px] font-mono-hl text-[#111110] transition-colors cursor-pointer"
            >
              <Sparkles className="h-3 w-3 text-[#0c7c76]" />
              <span>Fill: editor / editor123</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#111110]/10 bg-white/40 px-6 py-4 text-center text-[11px] font-mono-hl text-[#111110]/65">
        Hectic Lab Studio Architecture • Authorized Personnel Only
      </footer>
    </div>
  );
}
