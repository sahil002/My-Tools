import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { getActiveAdminSession, AdminSession } from '../../services/adminAuth';
import { SEOHelmet } from '../SEOHelmet';
import { Shield } from 'lucide-react';

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

export function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const { currentPath, navigate } = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const active = await getActiveAdminSession();
        if (!isMounted) return;

        if (!active) {
          const redirectParam = encodeURIComponent(currentPath || '/admin/dashboard');
          navigate(`/admin/login?redirect=${redirectParam}`);
        } else {
          setSession(active);
        }
      } catch (err) {
        if (!isMounted) return;
        const redirectParam = encodeURIComponent(currentPath || '/admin/dashboard');
        navigate(`/admin/login?redirect=${redirectParam}`);
      } finally {
        if (isMounted) {
          setChecking(false);
        }
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [currentPath, navigate]);

  // While verifying server-side session, do not render private admin components
  if (checking) {
    return (
      <div className="min-h-screen bg-[#FAF9FE] flex flex-col items-center justify-center p-6 text-center">
        <SEOHelmet
          title="Verifying Security Credentials – Online Tools"
          description="Restricted administrative access check."
          canonicalPath="/admin"
          noindex={true}
        />
        <div className="w-12 h-12 rounded-2xl bg-[#F5F3FF] border border-[#DDD6FE] text-[#7C3AED] flex items-center justify-center mb-4 shadow-sm animate-pulse">
          <Shield className="w-6 h-6" />
        </div>
        <p className="font-heading font-semibold text-sm text-[#1E1035]">
          Verifying Admin Credentials...
        </p>
        <p className="font-sans text-xs text-[#6D6582] mt-1">
          Validating server-side session token
        </p>
      </div>
    );
  }

  // If not authenticated, the useEffect has already initiated redirection
  if (!session) {
    return null;
  }

  return <>{children}</>;
}
