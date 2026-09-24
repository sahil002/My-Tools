import React, { useState, useEffect } from 'react';
import { useRouter } from '../context/RouterContext';
import { SEOHelmet } from '../components/SEOHelmet';
import {
  loginAdmin,
  getActiveAdminSession,
  getRateLimitStatus,
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_INITIAL_PASSWORD,
  RateLimitStatus,
} from '../services/adminAuth';
import { Shield, Lock, Mail, Eye, EyeOff, AlertTriangle, KeyRound, CheckCircle2 } from 'lucide-react';

export function AdminLoginView() {
  const { navigate, currentPath } = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimitStatus>(getRateLimitStatus());
  const [lockoutCountdown, setLockoutCountdown] = useState<number>(0);

  // Check if already authenticated; if so, redirect immediately to dashboard
  useEffect(() => {
    let isMounted = true;
    getActiveAdminSession().then((session) => {
      if (isMounted && session) {
        // Check for redirect query param
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect') || '/admin/dashboard';
        navigate(redirect);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Live countdown timer if locked out
  useEffect(() => {
    const status = getRateLimitStatus();
    setRateLimit(status);

    if (status.isLocked && status.lockoutSecondsLeft > 0) {
      setLockoutCountdown(status.lockoutSecondsLeft);
      const interval = setInterval(() => {
        setLockoutCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setRateLimit(getRateLimitStatus());
            setErrorMessage(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [errorMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rateLimit.isLocked || isSubmitting) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const result = await loginAdmin(email, password, rememberMe);

      if (result.success) {
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect') || '/admin/dashboard';
        navigate(redirect);
      } else {
        setErrorMessage(result.error || 'Authentication failed. Please verify credentials.');
        if (result.rateLimit) {
          setRateLimit(result.rateLimit);
          if (result.rateLimit.isLocked) {
            setLockoutCountdown(result.rateLimit.lockoutSecondsLeft);
          }
        }
      }
    } catch (err) {
      setErrorMessage('An unexpected security verification error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = () => {
    setEmail(DEFAULT_ADMIN_EMAIL);
    setPassword(DEFAULT_ADMIN_INITIAL_PASSWORD);
    setErrorMessage(null);
  };

  return (
    <div className="py-12 sm:py-16 max-w-md mx-auto px-4">
      {/* Strict noindex SEO tag */}
      <SEOHelmet
        title="Admin Panel Access"
        description="Restricted administrative access portal."
        canonicalPath="/panel-access"
        noindex={true}
      />

      <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl shadow-[0_4px_25px_rgba(124,58,237,0.06)] p-6 sm:p-8 transition-colors duration-200 font-sans">
        {/* Header Badge */}
        <div className="text-center mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center mx-auto mb-2.5 border border-[#DDD6FE] shadow-2xs">
            <Shield className="w-5 h-5" />
          </div>
          <h1 className="text-lg sm:text-xl font-heading font-bold text-[#1E1035] tracking-tight">
            Administrative Access
          </h1>
          <p className="text-xs text-[#6D6582] mt-1 font-sans">
            Restricted portal. Authorized personnel only.
          </p>
        </div>

        {/* Lockout / Rate limit Warning */}
        {rateLimit.isLocked ? (
          <div className="mb-6 p-4 rounded-xl bg-[#FFFBEB] border border-[#F59E0B]/30 text-[#F59E0B] text-xs font-sans">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
              <div>
                <p className="font-heading font-semibold text-[#1E1035]">Security Lockout Active</p>
                <p className="mt-1 leading-relaxed text-[#6D6582]">
                  Multiple failed login attempts detected. Access is temporarily suspended.
                </p>
                <p className="mt-2 font-mono font-bold text-[#F59E0B] bg-white px-2 py-1 rounded border border-[#F59E0B]/30 inline-block">
                  Cooldown: {Math.floor(lockoutCountdown / 60)}m {lockoutCountdown % 60}s
                </p>
              </div>
            </div>
          </div>
        ) : errorMessage ? (
          <div className="mb-6 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#DC2626]/30 text-[#DC2626] text-xs font-sans">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
              <p className="leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        ) : null}

        {/* Clean Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 font-sans">
          <div>
            <label htmlFor="admin-email" className="block text-xs font-heading font-semibold text-[#1E1035] mb-1.5">
              Admin Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9D95B3]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="email"
                disabled={rateLimit.isLocked || isSubmitting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@onlinetools.internal"
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#FFFFFF] border border-[#EDE9FE] rounded-xl text-[#1E1035] placeholder-[#9D95B3] focus:outline-hidden focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] disabled:opacity-50 transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-xs font-heading font-semibold text-[#1E1035] mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9D95B3]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                disabled={rateLimit.isLocked || isSubmitting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-10 py-2.5 text-sm bg-[#FFFFFF] border border-[#EDE9FE] rounded-xl text-[#1E1035] placeholder-[#9D95B3] focus:outline-hidden focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] disabled:opacity-50 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#9D95B3] hover:text-[#1E1035] cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me checkbox */}
          <div className="flex items-center justify-between pt-1 font-sans">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#6D6582]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={rateLimit.isLocked || isSubmitting}
                className="w-4 h-4 text-[#7C3AED] rounded border-[#DDD6FE] focus:ring-[#7C3AED]"
              />
              <span>Remember me (30 days)</span>
            </label>

            {rateLimit.attemptsCount > 0 && !rateLimit.isLocked && (
              <span className="text-[11px] text-[#F59E0B] font-heading font-medium">
                {rateLimit.remainingAttempts} attempts left
              </span>
            )}
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={rateLimit.isLocked || isSubmitting}
            className="w-full mt-2 py-2.5 px-4 bg-[#7C3AED] hover:bg-[#6D28D9] text-[#FFFFFF] rounded-xl text-sm font-heading font-semibold shadow-xs shadow-[#7C3AED]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Verifying credentials...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Authenticate Session</span>
              </>
            )}
          </button>
        </form>

        {/* Seeded Account Helper Notice */}
        <div className="mt-6 pt-5 border-t border-[#EDE9FE] text-xs text-[#6D6582] font-sans">
          <div className="bg-[#FAF9FE] border border-[#EDE9FE] rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-heading font-semibold text-[#1E1035] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                Seeded Admin Credentials
              </span>
              <button
                type="button"
                onClick={handleQuickFill}
                className="text-[11px] text-[#7C3AED] font-heading font-medium hover:underline cursor-pointer"
              >
                Auto-fill
              </button>
            </div>
            <p className="text-[11px] text-[#6D6582] leading-relaxed">
              New accounts cannot be created publicly (sign up disabled). To sign in with the pre-seeded admin account:
            </p>
            <div className="font-mono text-[11px] bg-[#FFFFFF] p-2.5 rounded-lg border border-[#EDE9FE] text-[#1E1035] space-y-0.5 select-all">
              <div>Email: <span className="font-medium text-[#7C3AED]">{DEFAULT_ADMIN_EMAIL}</span></div>
              <div>Password: <span className="font-medium text-[#7C3AED]">{DEFAULT_ADMIN_INITIAL_PASSWORD}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
