import React, { useState, useEffect } from 'react';
import { adminSessionManager } from '../../services/adminSessionManager';
import { logoutAdmin } from '../../services/adminAuth';
import { useRouter } from '../../context/RouterContext';
import { AlertTriangle, Clock, ShieldAlert, LogOut, CheckCircle2 } from 'lucide-react';

export function AdminSessionExpiryModal() {
  const { navigate } = useRouter();
  const [warningSeconds, setWarningSeconds] = useState<number | null>(null);

  useEffect(() => {
    // Start monitoring session idle activity
    adminSessionManager.start();

    // Listen for warnings
    const removeWarning = adminSessionManager.onWarning((secondsLeft) => {
      setWarningSeconds(secondsLeft);
    });

    // Listen for expiry
    const removeExpired = adminSessionManager.onExpired(() => {
      navigate('/admin/login?reason=expired');
    });

    return () => {
      removeWarning();
      removeExpired();
      adminSessionManager.stop();
    };
  }, [navigate]);

  if (warningSeconds === null) {
    return null;
  }

  const handleContinueSession = () => {
    adminSessionManager.extendSession();
    setWarningSeconds(null);
  };

  const handleLogoutNow = async () => {
    await logoutAdmin();
    setWarningSeconds(null);
    navigate('/admin/login');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center font-sans">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
          <Clock className="w-6 h-6 animate-pulse" />
        </div>

        <div>
          <h3 className="font-heading font-bold text-base text-[#1E1035]">
            Session Timeout Warning
          </h3>
          <p className="text-xs text-[#6D6582] mt-1">
            You have been inactive. For your security, this administrative session will lock in:
          </p>
        </div>

        <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200">
          <span className="font-mono text-2xl font-bold text-amber-700">
            {Math.floor(warningSeconds / 60)}:
            {String(warningSeconds % 60).padStart(2, '0')}
          </span>
          <span className="text-[11px] text-amber-800 block mt-0.5">remaining</span>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={handleLogoutNow}
            className="flex-1 py-2 px-3 rounded-xl border border-[#EDE9FE] text-xs font-semibold text-[#6D6582] hover:bg-[#FAF9FE] transition-colors cursor-pointer"
          >
            Log Out Now
          </button>
          <button
            type="button"
            onClick={handleContinueSession}
            className="flex-1 py-2 px-3 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Continue Session
          </button>
        </div>
      </div>
    </div>
  );
}
