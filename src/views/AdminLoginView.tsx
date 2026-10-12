import React, { useState, useEffect } from 'react';
import { useRouter } from '../context/RouterContext';
import { SEOHelmet } from '../components/SEOHelmet';
import {
  loginAdmin,
  getActiveAdminSession,
  getRateLimitStatus,
  RateLimitStatus,
} from '../services/adminAuth';
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertTriangle,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export function AdminLoginView() {
  const { navigate } = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimitStatus>(getRateLimitStatus());
  const [lockoutCountdown, setLockoutCountdown] = useState<number>(0);
  const [twoFactorStep, setTwoFactorStep] = useState<'none' | 'verify' | 'setup'>('none');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorQr, setTwoFactorQr] = useState('');
  const [twoFactorBackupCodes, setTwoFactorBackupCodes] = useState<string[]>([]);
  const [isTwoFactorBusy, setIsTwoFactorBusy] = useState(false);


  const [openedInNewTab, setOpenedInNewTab] = useState(false);
  const [targetDashboardPath, setTargetDashboardPath] = useState('/admin/dashboard');

  const openDashboardInNewTab = (redirectPath: string) => {
    setTargetDashboardPath(redirectPath);
    setOpenedInNewTab(true);
    try {
      const opened = window.open(redirectPath, '_blank');
      if (opened) opened.focus();
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let isMounted = true;
    const params = new URLSearchParams(window.location.search);
    const reason = params.get('reason');
    if (reason === 'expired') {
      setErrorMessage('Your administrative session expired due to inactivity. Please sign in again.');
    }

    getActiveAdminSession().then((session) => {
      if (isMounted && session && !reason) {
        const redirect = params.get('redirect') || '/admin/dashboard';
        navigate(redirect);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (rateLimit.isLocked && rateLimit.lockoutSecondsLeft > 0) {
      setLockoutCountdown(rateLimit.lockoutSecondsLeft);
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
  }, [rateLimit]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rateLimit.isLocked || isSubmitting) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const result = await loginAdmin(email, password, rememberMe);
      if (!result.success) {
        setErrorMessage(result.error || 'Authentication failed. Please verify credentials.');
        if (result.rateLimit) {
          setRateLimit(result.rateLimit);
          if (result.rateLimit.isLocked) setLockoutCountdown(result.rateLimit.lockoutSecondsLeft);
        }
        return;
      }

      if (result.error === 'REQUIRES_2FA' || result.error === 'REQUIRES_2FA_SETUP') {
        const setup = result.error === 'REQUIRES_2FA_SETUP';
        setTwoFactorStep(setup ? 'setup' : 'verify');
        if (setup) {
          setIsTwoFactorBusy(true);
          const response = await fetch('/api/admin/2fa', {
            method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'setup' }),
          });
          const payload = await response.json().catch(() => null);
          if (!response.ok || !payload?.success) {
            setErrorMessage(payload?.error || 'Unable to start authenticator setup.');
            setTwoFactorStep('none');
          } else {
            setTwoFactorSecret(payload.secret);
            setTwoFactorQr(payload.qrCode);
          }
          setIsTwoFactorBusy(false);
        }
        return;
      }

      const params = new URLSearchParams(window.location.search);
      openDashboardInNewTab(params.get('redirect') || '/admin/dashboard');
    } catch {
      setErrorMessage('An unexpected login error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-12 sm:py-16 max-w-md mx-auto px-4">
      <SEOHelmet
        title="Admin Login – PRBSolver"
        description="Restricted administrative access portal."
        canonicalPath="/admin/login"
        noindex={true}
      />

      <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl shadow-[0_4px_25px_rgba(124,58,237,0.06)] p-6 sm:p-8 transition-colors duration-200 font-sans">
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center mx-auto mb-2.5 border border-[#DDD6FE] shadow-2xs">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-lg sm:text-xl font-heading font-bold text-[#1E1035] tracking-tight">
            Administrative Access
          </h1>
          <p className="text-xs text-[#6D6582] mt-1 font-sans">
            Restricted portal. Authorized personnel only.
          </p>
        </div>

        {errorMessage && (
          <div id="admin-login-error-banner" role="alert" className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {successMessage && !openedInNewTab && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {openedInNewTab ? (
          <div className="text-center py-4 space-y-4 animate-in fade-in">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-2xs">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-base font-heading font-bold text-[#1E1035]">Admin Dashboard Opened!</h2>
              <p className="text-xs text-[#6D6582] mt-1 max-w-xs mx-auto">Your administrative session is now active in a new browser tab.</p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <a href={targetDashboardPath} target="_blank" rel="noreferrer" className="w-full py-2.5 px-4 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-heading font-semibold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5">
                <span>Re-open Dashboard Tab</span><ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button type="button" onClick={() => navigate(targetDashboardPath)} className="w-full py-2 px-4 bg-[#FAF9FE] border border-[#DDD6FE] text-[#1E1035] hover:bg-[#F5F3FF] text-xs font-heading font-medium rounded-xl transition-all cursor-pointer">
                Continue in this tab instead
              </button>
              <button type="button" onClick={() => navigate('/')} className="text-xs text-[#7C3AED] hover:underline transition-colors pt-1 cursor-pointer">
                Return to Website Home
              </button>
            </div>
          </div>
        ) : (
          <>

            {twoFactorStep !== 'none' ? (
              <div className="space-y-4">
                {twoFactorStep === 'setup' ? (
                  <>
                    <h2 className="text-sm font-heading font-bold text-[#1E1035]">Set up mobile authenticator</h2>
                    <p className="text-xs text-[#6D6582]">Scan this QR with Google Authenticator, Microsoft Authenticator, or another TOTP app. Keep the setup key private.</p>
                    {twoFactorQr ? <img src={twoFactorQr} alt="Authenticator setup QR code" className="w-48 h-48 mx-auto border border-[#EDE9FE] rounded-xl p-2 bg-white" /> : <p className="text-xs text-[#6D6582]">{isTwoFactorBusy ? 'Preparing secure QR code…' : 'QR code unavailable.'}</p>}
                    {twoFactorSecret && <div className="break-all rounded-lg bg-[#F5F3FF] p-3 text-xs"><span className="font-semibold">Manual setup key:</span> {twoFactorSecret}</div>}
                    <p className="text-xs text-[#6D6582]">After scanning, enter the current six-digit code to enable 2-step verification.</p>
                  </>
                ) : (
                  <>
                    <h2 className="text-sm font-heading font-bold text-[#1E1035]">Authenticator verification</h2>
                    <p className="text-xs text-[#6D6582]">Enter the current six-digit code from your authenticator app.</p>
                  </>
                )}
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (twoFactorStep === 'setup' ? !/^\d{6}$/.test(twoFactorCode) : (!/^\d{6}$/.test(twoFactorCode) && !(useBackupCode && /^[A-F0-9]{10}$/i.test(twoFactorCode)))) { setErrorMessage(useBackupCode ? 'Enter a valid 10-character backup code.' : 'Enter a valid 6-digit authenticator code.'); return; }
                  setIsTwoFactorBusy(true); setErrorMessage(null);
                  try {
                    const response = await fetch('/api/admin/2fa', {
                      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(twoFactorStep === 'setup'
                        ? { action: 'enroll', secret: twoFactorSecret, code: twoFactorCode }
                        : { action: 'verify', code: twoFactorCode }),
                    });
                    const payload = await response.json().catch(() => null);
                    if (!response.ok || !payload?.success) { setErrorMessage(payload?.error || 'Authenticator verification failed.'); return; }
                    if (Array.isArray(payload.backupCodes) && payload.backupCodes.length) {
                      setTwoFactorBackupCodes(payload.backupCodes);
                      setSuccessMessage('Authenticator enabled. Save these one-time backup codes before continuing.');
                      return;
                    }
                    const params = new URLSearchParams(window.location.search);
                    openDashboardInNewTab(params.get('redirect') || '/admin/dashboard');
                  } catch {
                    setErrorMessage('Authenticator service is unavailable. Please try again.');
                  } finally {
                    setIsTwoFactorBusy(false);
                  }
                }} className="space-y-3">
                  <label className="block text-xs font-heading font-semibold text-[#1E1035]">{useBackupCode ? "One-time backup code" : "6-digit authenticator code"}</label>
                  <input inputMode={useBackupCode ? "text" : "numeric"} autoComplete="one-time-code" pattern={useBackupCode ? "[A-Fa-f0-9]{10}" : "[0-9]{6}"} required value={twoFactorCode} onChange={(e) => setTwoFactorCode(useBackupCode ? e.target.value.replace(/[^a-fA-F0-9]/g,'').slice(0,10).toUpperCase() : e.target.value.replace(/\D/g,'').slice(0,6))} placeholder={useBackupCode ? 'A1B2C3D4E5' : '123456'} maxLength={useBackupCode ? 10 : 6} className="w-full px-3 py-2.5 bg-[#FAF9FE] border border-[#DDD6FE] focus:border-[#7C3AED] text-sm rounded-xl outline-hidden" />
                  <button type="submit" disabled={isTwoFactorBusy} className="w-full py-2.5 px-4 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-heading font-semibold rounded-xl disabled:opacity-50">{isTwoFactorBusy ? 'Verifying…' : twoFactorStep === 'setup' ? 'Enable Authenticator' : 'Verify & Sign In'}</button>
                  {twoFactorStep === 'verify' && (
                    <button type="button" onClick={() => { setUseBackupCode(!useBackupCode); setTwoFactorCode(''); setErrorMessage(null); }} className="w-full py-1 text-xs text-[#7C3AED] underline">
                      {useBackupCode ? 'Use authenticator code instead' : 'Use a backup code'}
                    </button>
                  )}
                  <button type="button" onClick={() => { setTwoFactorStep('none'); setTwoFactorCode(''); setUseBackupCode(false); setTwoFactorSecret(''); setTwoFactorQr(''); setTwoFactorBackupCodes([]); setErrorMessage(null); setSuccessMessage(null); }} className="w-full py-2 text-xs text-[#6D6582]">Cancel</button>
                </form>
                {twoFactorBackupCodes.length > 0 && (
                  <div className="space-y-3 rounded-xl border border-[#DDD6FE] bg-[#F5F3FF] p-3">
                    <p className="text-xs font-semibold text-[#1E1035]">Save each backup code securely. Each code works once.</p>
                    <ul className="grid grid-cols-2 gap-2 text-xs font-mono">{twoFactorBackupCodes.map(code => <li key={code}>{code}</li>)}</ul>
                    <button type="button" onClick={() => { navigator.clipboard?.writeText(twoFactorBackupCodes.join('\n')); }} className="w-full py-2 bg-white border border-[#DDD6FE] rounded-lg text-xs">Copy backup codes</button>
                    <button type="button" onClick={() => { setTwoFactorBackupCodes([]); const params = new URLSearchParams(window.location.search); openDashboardInNewTab(params.get('redirect') || '/admin/dashboard'); }} className="w-full py-2 bg-[#7C3AED] text-white rounded-lg text-xs">I saved my codes — Continue</button>
                  </div>
                )}
              </div>
            ) : (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div>
                  <label htmlFor="admin-email-input" className="block text-xs font-heading font-semibold text-[#1E1035] mb-1.5">Admin Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6D6582]"><Mail className="w-4 h-4" /></div>
                    <input id="admin-email-input" name="email" type="email" autoComplete="username email" required disabled={rateLimit.isLocked || isSubmitting} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@onlinetools.internal" className="w-full pl-10 pr-3.5 py-2.5 bg-[#FAF9FE] border border-[#DDD6FE] focus:border-[#7C3AED] focus:bg-[#FFFFFF] text-xs font-sans text-[#1E1035] rounded-xl outline-hidden transition-all placeholder:text-[#6D6582]/60 disabled:opacity-50" />
                  </div>
                </div>

                <div>
                  <label htmlFor="admin-password-input" className="block text-xs font-heading font-semibold text-[#1E1035] mb-1.5">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6D6582]"><Lock className="w-4 h-4" /></div>
                    <input id="admin-password-input" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required disabled={rateLimit.isLocked || isSubmitting} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter administrator password" className="w-full pl-10 pr-10 py-2.5 bg-[#FAF9FE] border border-[#DDD6FE] focus:border-[#7C3AED] focus:bg-[#FFFFFF] text-xs font-sans text-[#1E1035] rounded-xl outline-hidden transition-all placeholder:text-[#6D6582]/60 disabled:opacity-50" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6D6582] hover:text-[#1E1035] cursor-pointer">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#6D6582]">
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} disabled={rateLimit.isLocked || isSubmitting} className="w-3.5 h-3.5 rounded-sm border-[#DDD6FE] text-[#7C3AED] focus:ring-[#7C3AED]" />
                    <span>Remember me (30 days)</span>
                  </label>
                </div>

                <button type="submit" id="admin-login-submit-btn" disabled={rateLimit.isLocked || isSubmitting} className="w-full mt-2 py-2.5 px-4 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-heading font-semibold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? (
                    <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Verifying Credentials...</span></>
                  ) : (
                    <><KeyRound className="w-4 h-4" /><span>Verify Credentials</span></>
                  )}
                </button>
            </form>
            )}
          </>
        )}

        <div className="mt-6 pt-4 border-t border-[#EDE9FE] flex items-center justify-center gap-1.5 text-[11px] text-[#6D6582]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>RFC 6238 TOTP Two-Factor Protection &amp; HTTPS Session Encryption</span>
        </div>
      </div>
    </div>
  );
}
