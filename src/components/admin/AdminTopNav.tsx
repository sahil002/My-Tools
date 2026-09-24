import { Menu, Sun, Moon, KeyRound, LogOut } from 'lucide-react';

interface AdminTopNavProps {
  onToggleSidebar: () => void;
  adminTheme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenPasswordModal: () => void;
  onLogout: () => void;
  pageTitle?: string;
}

export function AdminTopNav({
  onToggleSidebar,
  adminTheme,
  onToggleTheme,
  onOpenPasswordModal,
  onLogout,
  pageTitle = 'Dashboard Overview',
}: AdminTopNavProps) {
  return (
    <header
      id="admin-top-nav"
      className="sticky top-0 z-30 h-13.5 sm:h-14 bg-[#FFFFFF] border-b border-[#EDE9FE] px-4 sm:px-6 flex items-center justify-between transition-colors duration-150 font-sans"
    >
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          id="admin-mobile-menu-btn"
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 rounded-lg text-[#6D6582] hover:text-[#1E1035] hover:bg-[#F5F3FF] border border-[#EDE9FE]"
          aria-label="Toggle navigation drawer"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div>
          <span className="text-sm sm:text-base font-heading font-bold text-[#1E1035] tracking-tight block leading-tight">
            {pageTitle}
          </span>
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-[#6D6582] font-sans">
            <span>Admin</span>
            <span>/</span>
            <span className="text-[#1E1035] font-medium">{pageTitle}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* System Status Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] animate-pulse" />
          <span className="font-heading font-semibold">Live Systems Normal</span>
        </div>

        {/* Dark/Light Mode Toggle */}
        <button
          type="button"
          id="admin-theme-toggle-btn"
          onClick={onToggleTheme}
          className="p-1.5 rounded-lg text-[#6D6582] hover:text-[#1E1035] hover:bg-[#F5F3FF] border border-[#EDE9FE] transition-colors cursor-pointer"
          title={`Switch to ${adminTheme === 'light' ? 'Dark' : 'Light'} Mode`}
          aria-label="Toggle Admin theme"
        >
          {adminTheme === 'light' ? (
            <Moon className="w-3.5 h-3.5 text-[#7C3AED]" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-[#F59E0B]" />
          )}
        </button>

        {/* Change Password Button */}
        <button
          type="button"
          id="admin-change-password-btn"
          onClick={onOpenPasswordModal}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-heading font-semibold text-[#1E1035] bg-[#FFFFFF] border border-[#EDE9FE] rounded-lg hover:bg-[#F5F3FF] transition-colors cursor-pointer"
        >
          <KeyRound className="w-3 h-3 text-[#7C3AED]" />
          <span>Security</span>
        </button>

        {/* Logout Button */}
        <button
          type="button"
          id="admin-logout-btn"
          onClick={onLogout}
          className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 text-xs font-heading font-semibold bg-[#FEF2F2] text-[#DC2626] border border-[#DC2626]/20 rounded-lg hover:bg-[#FEE2E2] transition-colors cursor-pointer"
          title="Sign out of administrative session"
        >
          <LogOut className="w-3 h-3" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
