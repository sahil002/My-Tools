import React, { useState, useEffect } from 'react';
import { useRouter } from '../context/RouterContext';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { SEOHelmet } from '../components/SEOHelmet';
import {
  loginAdmin,
  getActiveAdminSession,
  getRateLimitStatus,
  RateLimitStatus,
} from '../services/adminAuth';
import {
  isTwoFactorEnabled,
  createTOTPSecret,
  generateQRCodeImage,
  verifyTOTPCode,
} from '../services/twoFactorAuth';
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertTriangle,
  KeyRound,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

type LoginStep = 'credentials' | '2fa_verify' | '2fa_setup';

export function AdminLoginView() {
  const { navigate } = useRouter();

  const [step, setStep] = useState<LoginStep>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimitStatus>(getRateLimitStatus());
  const [lockoutCountdown, setLockoutCountdown] = useState<number>(0);

  const [totpCode, setTotpCode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [isBackupMode, setIsBackupMode] = useState(false);
  const [openedInNewTab, setOpenedInNewTab] = useState(false);
  const [targetDashboardPath, setTargetDashboardPath] = useState('/admin/dashboard');
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [recoverySent, setRecoverySent] = useState(false);

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

  const prepare2FASetup = async (adminEmail: string) => {
    const setup = createTOTPSecret(adminEmail);
    setTotpSecret(setup.secret);
    setBackupCodes(setup.backupCodes);
    const qrImage = await generateQRCodeImage(setup.uri);
    setQrCodeUrl(qrImage);
    setTotpCode('');
    setErrorMessage(null);
    setSuccessMessage(null);
    setStep('2fa_setup');
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rateLimit.isLocked || isSubmitting) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const result = await loginAdmin(email, password, rememberMe);

      if (result.error === 'REQUIRES_2FA') {
        setStep('2fa_verify');
        return;
      }

      if ((result as any).error === 'REQUIRES_2FA_SETUP') {
        // The server has verified the credentials and issued the short-lived
        // pending-2FA cookie. Generate the enrollment secret + QR locally,
        // then send the secret/code to the protected setup endpoint.
        await prepare2FASetup(email);
        return;
      }

      if (!result.success) {
        setErrorMessage(result.error || 'Authentication failed. Please verify credentials.');
        if (result.rateLimit) {
          setRateLimit(result.rateLimit);
          if (result.rateLimit.isLocked) {
            setLockoutCountdown(result.rateLimit.lockoutSecondsLeft);
          }
        }
        return;
      }

      const has2FA = await isTwoFactorEnabled(email);
      if (has2FA) {
        setStep('2fa_verify');
      } else {
        await prepare2FASetup(email);
      }
    } catch {
      setErrorMessage('An unexpected security verification error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStart2FARecovery = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setRecoveryCode('');

    if (!isSupabaseConfigured() || !supabase) {
      setErrorMessage('Email recovery is not configured. Please contact the site administrator.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { shouldCreateUser: false },
      });

      if (error) {
        setErrorMessage('Unable to send the recovery code. Please make sure you can access the admin email address.');
        return;
      }

      setIsRecoveryMode(true);
      setRecoverySent(true);
      setSuccessMessage('A recovery code has been sent to your admin email address. Check your inbox and enter the code below.');
    } catch {
      setErrorMessage('Unable to start secure email recovery. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete2FARecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanCode = recoveryCode.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!/^\d{6}$/.test(cleanCode)) {
      setErrorMessage('Please enter the 6-digit recovery code sent to your admin email.');
      return;
    }

    if (!isSupabaseConfigured() || !supabase) {
      setErrorMessage('Email recovery is not configured. Please contact the site administrator.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanCode,
        type: 'email',
      });

      if (error || !data.session?.access_token) {
        setErrorMessage('Invalid or expired recovery code. Please request a new code.');
        return;
      }

      const response = await fetch('/api/admin/reset-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${data.session.access_token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ email: cleanEmail }),
      });

      const result = await response.json().catch(() => null);
      await supabase.auth.signOut();

      if (!response.ok || !result?.success) {
        setErrorMessage(result?.error || 'Unable to reset the authenticator securely.');
        return;
      }

      setIsRecoveryMode(false);
      setRecoverySent(false);
      setRecoveryCode('');
      setTotpCode('');
      setTotpSecret(null);
      setQrCodeUrl(null);
      setBackupCodes([]);
      setSuccessMessage('Authenticator reset successfully. Please sign in again with your password to receive a new QR code.');
      setStep('credentials');
    } catch {
      try { await supabase.auth.signOut(); } catch {}
      setErrorMessage('Unable to complete secure authenticator recovery. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanInput = totpCode.trim();
    if (!cleanInput) {
      setErrorMessage('Please enter the 6-digit code or backup code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: cleanInput }),
      });
      const result = await response.json().catch(() => null);
      if (response.ok && result?.success) {
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect') || '/admin/dashboard';
        openDashboardInNewTab(redirect);
      } else {
        setErrorMessage('Invalid authentication code. Please check Google Authenticator on your phone.');
      }
    } catch {
      setErrorMessage('Failed to verify authentication code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteSetup2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!totpSecret) {
      setErrorMessage('Authenticator setup is not ready. Please sign in again.');
      return;
    }

    const cleanCode = totpCode.trim();
    if (!verifyTOTPCode(totpSecret, cleanCode)) {
      setErrorMessage('Incorrect code. Please scan the QR code and enter the 6 digits shown in your mobile app.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/setup-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ secret: totpSecret, backupCodes, code: cleanCode }),
      });
      const setupResult = await response.json().catch(() => null);
      if (!response.ok || !setupResult?.success) {
        setErrorMessage(setupResult?.error || 'Failed to save secure authenticator configuration.');
        return;
      }

      setSuccessMessage('Two-Factor Authentication successfully activated! Opening Dashboard in new tab...');
      setTimeout(() => {
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect') || '/admin/dashboard';
        openDashboardInNewTab(redirect);
      }, 1000);
    } catch {
      setErrorMessage('Failed to save 2FA configuration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const copySecretKey = () => {
    if (totpSecret) {
      navigator.clipboard.writeText(totpSecret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
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
            {step === 'credentials' ? <Shield className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
          </div>
          <h1 className="text-lg sm:text-xl font-heading font-bold text-[#1E1035] tracking-tight">
            {step === 'credentials' && 'Administrative Access'}
            {step === '2fa_verify' && 'Mobile 2-Step Verification'}
            {step === '2fa_setup' && 'Set Up Mobile Authenticator'}
          </h1>
          <p className="text-xs text-[#6D6582] mt-1 font-sans">
            {step === 'credentials' && 'Restricted portal. Authorized personnel only.'}
            {step === '2fa_verify' && `Enter the 6-digit code from your phone for ${email}`}
            {step === '2fa_setup' && 'Scan QR code with Google Authenticator or Microsoft Authenticator'}
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
            {step === 'credentials' && (
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

            {step === '2fa_verify' && !isRecoveryMode && (
              <form onSubmit={handleVerify2FASubmit} className="space-y-4">
                <div className="p-3.5 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE] text-center">
                  <p className="text-xs text-[#6D6582]">
                    {isBackupMode ? (
                      <span>Enter one of your 8-character <strong>Backup Recovery Codes</strong>:</span>
                    ) : (
                      <span>Open your mobile <strong>Google Authenticator</strong> or <strong>Microsoft Authenticator</strong> app and enter the 6-digit code:</span>
                    )}
                  </p>
                </div>

                <div>
                  <label htmlFor="admin-totp-input" className="block text-xs font-heading font-semibold text-[#1E1035] mb-1.5">
                    {isBackupMode ? 'Recovery Backup Code' : '6-Digit Authentication Code'}
                  </label>
                  <input id="admin-totp-input" type="text" required autoFocus maxLength={isBackupMode ? 10 : 6} value={totpCode} onChange={(e) => setTotpCode(e.target.value.toUpperCase())} placeholder={isBackupMode ? 'XXXX-XXXX' : '123456'} className="w-full text-center tracking-widest text-lg font-mono py-3 bg-[#FAF9FE] border border-[#DDD6FE] focus:border-[#7C3AED] focus:bg-[#FFFFFF] text-[#1E1035] rounded-xl outline-hidden transition-all placeholder:text-[#6D6582]/40" />
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full py-2.5 px-4 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-heading font-semibold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50">
                  {isSubmitting ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>{isSubmitting ? 'Verifying Code...' : 'Authorize Admin Session'}</span>
                </button>

                <div className="flex items-center justify-between pt-2 text-xs">
                  <button type="button" onClick={() => { setIsBackupMode(!isBackupMode); setTotpCode(''); setErrorMessage(null); }} className="text-[#7C3AED] hover:underline cursor-pointer" disabled={isSubmitting}>
                    {isBackupMode ? 'Use Authenticator Code' : 'Lost phone? Use Backup Code'}
                  </button>
                  <button type="button" onClick={() => { setStep('credentials'); setTotpCode(''); setErrorMessage(null); setIsRecoveryMode(false); setRecoverySent(false); }} className="text-[#6D6582] hover:text-[#1E1035] cursor-pointer">Cancel</button>
                </div>

                <div className="pt-1 text-center">
                  <button type="button" onClick={handleStart2FARecovery} disabled={isSubmitting || isBackupMode} className="text-xs text-[#7C3AED] hover:underline font-medium cursor-pointer disabled:opacity-50">
                    Lost your phone and backup codes?
                  </button>
                </div>
              </form>
            )}

            {isRecoveryMode && (
              <form onSubmit={handleComplete2FARecovery} className="space-y-4">
                <div className="p-3.5 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE] text-center">
                  <p className="text-xs text-[#6D6582]">We sent a one-time recovery code to <strong>{email}</strong>. This verifies that you control the admin email before the old authenticator is reset.</p>
                </div>
                <div>
                  <label htmlFor="admin-recovery-code" className="block text-xs font-heading font-semibold text-[#1E1035] mb-1.5">Email Recovery Code</label>
                  <input id="admin-recovery-code" type="text" inputMode="numeric" autoComplete="one-time-code" required maxLength={6} autoFocus value={recoveryCode} onChange={(e) => setRecoveryCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" className="w-full text-center tracking-widest text-lg font-mono py-3 bg-[#FAF9FE] border border-[#DDD6FE] focus:border-[#7C3AED] focus:bg-[#FFFFFF] text-[#1E1035] rounded-xl outline-hidden transition-all" />
                </div>
                <button type="submit" disabled={isSubmitting || !recoverySent} className="w-full py-2.5 px-4 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-heading font-semibold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50">
                  {isSubmitting ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>{isSubmitting ? 'Recovering Account...' : 'Verify Email & Reset Authenticator'}</span>
                </button>
                <div className="flex items-center justify-between pt-1 text-xs">
                  <button type="button" onClick={handleStart2FARecovery} disabled={isSubmitting} className="text-[#7C3AED] hover:underline cursor-pointer">Send New Code</button>
                  <button type="button" onClick={() => { setIsRecoveryMode(false); setRecoverySent(false); setRecoveryCode(''); setErrorMessage(null); setSuccessMessage(null); }} className="text-[#6D6582] hover:text-[#1E1035] cursor-pointer">Back to Authenticator</button>
                </div>
              </form>
            {step === '2fa_setup' && (
              <form onSubmit={handleCompleteSetup2FA} className="space-y-4">
                <div className="text-center">
                  <div className="p-3 bg-white border border-[#DDD6FE] rounded-2xl inline-block shadow-xs mb-3">
                    {qrCodeUrl ? (
                      <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48 mx-auto rounded-lg" />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center bg-[#FAF9FE] rounded-lg">
                        <div className="w-8 h-8 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-[#6D6582] max-w-xs mx-auto">
                    Scan this QR code with <strong>Google Authenticator</strong> or <strong>Microsoft Authenticator</strong> on your phone.
                  </p>
                </div>

                {totpSecret && (
                  <div className="p-2.5 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE] text-[11px] text-[#6D6582] flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-[#1E1035]">Manual Key: </span>
                      <span className="font-mono">{totpSecret}</span>
                    </div>
                    <button type="button" onClick={copySecretKey} className="p-1 hover:text-[#7C3AED] cursor-pointer" title="Copy Key">
                      {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}

                {backupCodes.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-amber-600" /><span>Save Your Backup Codes:</span></span>
                      <button type="button" onClick={copyBackupCodes} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-amber-300 rounded text-[10px] font-semibold text-amber-800 hover:bg-amber-100 cursor-pointer">
                        {copiedCodes ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCodes ? 'Copied' : 'Copy All'}</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1 font-mono text-[10px] bg-white p-1.5 rounded border border-amber-200">
                      {backupCodes.map((code, idx) => <span key={idx}>{code}</span>)}
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="setup-totp-code" className="block text-xs font-heading font-semibold text-[#1E1035] mb-1.5">Enter the 6-Digit Code from App to Confirm:</label>
                  <input id="setup-totp-code" type="text" required maxLength={6} value={totpCode} onChange={(e) => setTotpCode(e.target.value)} placeholder="123456" className="w-full text-center tracking-widest text-lg font-mono py-2.5 bg-[#FAF9FE] border border-[#DDD6FE] focus:border-[#7C3AED] focus:bg-[#FFFFFF] text-[#1E1035] rounded-xl outline-hidden transition-all" />
                </div>

                <button type="submit" disabled={isSubmitting || !qrCodeUrl} className="w-full py-2.5 px-4 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-heading font-semibold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50">
                  {isSubmitting ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{isSubmitting ? 'Activating 2FA...' : 'Confirm & Enable 2FA'}</span>
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
