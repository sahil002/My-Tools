import { Link, useRouter } from '../../context/RouterContext';
import {
  LayoutDashboard,
  Wrench,
  BarChart3,
  MessageSquare,
  Sparkles,
  Heart,
  Megaphone,
  SearchCheck,
  Settings,
  ArrowLeft,
  X,
  Shield,
} from 'lucide-react';
import { ADMIN_STATS_SUMMARY } from '../../data/adminOverviewData';
import { getCommentsStats, COMMENTS_CHANGED_EVENT } from '../../services/commentModerationService';
import { getToolRequestsStats, TOOL_REQUESTS_CHANGED_EVENT } from '../../services/toolRequestsService';
import { useState, useEffect } from 'react';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  adminEmail: string;
}

interface NavItem {
  id: string;
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeColor?: string;
}

export function AdminSidebar({ isOpen, onClose, adminEmail }: AdminSidebarProps) {
  const { currentPath } = useRouter();
  const [pendingCount, setPendingCount] = useState<number>(() => {
    try {
      return getCommentsStats().pending;
    } catch {
      return ADMIN_STATS_SUMMARY.pendingComments;
    }
  });

  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(() => {
    try {
      return getToolRequestsStats().newCount;
    } catch {
      return ADMIN_STATS_SUMMARY.pendingRequests;
    }
  });

  useEffect(() => {
    const handleCommentsUpdate = () => {
      try {
        setPendingCount(getCommentsStats().pending);
      } catch {
        // fallback
      }
    };
    const handleRequestsUpdate = () => {
      try {
        setPendingRequestsCount(getToolRequestsStats().newCount);
      } catch {
        // fallback
      }
    };
    window.addEventListener(COMMENTS_CHANGED_EVENT, handleCommentsUpdate);
    window.addEventListener(TOOL_REQUESTS_CHANGED_EVENT, handleRequestsUpdate);
    return () => {
      window.removeEventListener(COMMENTS_CHANGED_EVENT, handleCommentsUpdate);
      window.removeEventListener(TOOL_REQUESTS_CHANGED_EVENT, handleRequestsUpdate);
    };
  }, []);

  const navItems: NavItem[] = [
    {
      id: 'nav-overview',
      name: 'Overview',
      path: '/admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'nav-tools',
      name: 'Tools',
      path: '/admin/tools',
      icon: Wrench,
      badge: '12',
    },
    {
      id: 'nav-analytics',
      name: 'Analytics',
      path: '/admin/analytics',
      icon: BarChart3,
    },
    {
      id: 'nav-comments',
      name: 'Comments',
      path: '/admin/comments',
      icon: MessageSquare,
      badge: pendingCount > 0 ? pendingCount : undefined,
      badgeColor: 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]',
    },
    {
      id: 'nav-requests',
      name: 'Requests',
      path: '/admin/requests',
      icon: Sparkles,
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
      badgeColor: 'bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]',
    },
    {
      id: 'nav-favorites',
      name: 'Favorites',
      path: '/admin/favorites',
      icon: Heart,
    },
    {
      id: 'nav-ads',
      name: 'Ads',
      path: '/admin/ads',
      icon: Megaphone,
    },
    {
      id: 'nav-seo',
      name: 'SEO Optimizer',
      path: '/admin/seo',
      icon: SearchCheck,
    },
    {
      id: 'nav-settings',
      name: 'Settings',
      path: '/admin/settings',
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          id="admin-sidebar-backdrop"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        id="admin-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-52 sm:w-56 bg-[#FFFFFF] border-r border-[#EDE9FE] flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 font-sans shadow-xs shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 px-3.5 flex items-center justify-between border-b border-[#EDE9FE] shrink-0">
          <Link
            href="/admin/dashboard"
            onClick={onClose}
            className="flex items-center gap-2 font-heading font-bold text-sm text-[#1E1035]"
          >
            <div className="w-7 h-7 rounded-lg bg-[#7C3AED] text-[#FFFFFF] flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="block text-xs sm:text-[13px] font-heading font-bold tracking-tight text-[#1E1035] leading-tight">Admin Console</span>
              <span className="block text-[9.5px] font-sans font-medium text-[#6D6582]">Online Tools</span>
            </div>
          </Link>

          <button
            type="button"
            id="close-admin-sidebar-btn"
            onClick={onClose}
            className="lg:hidden p-1 rounded-md text-[#6D6582] hover:text-[#1E1035] hover:bg-[#F5F3FF]"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Modules */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5 font-sans">
          <div className="px-2.5 pb-1.5 text-[9.5px] font-heading font-bold uppercase tracking-wider text-[#9D95B3]">
            Management Modules
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path || (item.path !== '/admin/dashboard' && currentPath.startsWith(item.path));

            return (
              <Link
                key={item.id}
                id={item.id}
                href={item.path}
                onClick={onClose}
                className={`group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#7C3AED] text-[#FFFFFF] shadow-xs shadow-[#7C3AED]/20 font-semibold'
                    : 'text-[#6D6582] hover:bg-[#F5F3FF] hover:text-[#1E1035]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                      isActive
                        ? 'text-[#FFFFFF]'
                        : 'text-[#6D6582] group-hover:text-[#7C3AED]'
                    }`}
                  />
                  <span className="font-heading font-medium truncate">{item.name}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-heading font-semibold px-1.5 py-0.2 rounded-full shrink-0 ${
                      isActive
                        ? 'bg-[#FFFFFF]/20 text-[#FFFFFF]'
                        : item.badgeColor || 'bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-2.5 border-t border-[#EDE9FE] space-y-1.5 shrink-0 font-sans">
          <Link
            id="back-to-website-link"
            href="/"
            onClick={onClose}
            className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-heading font-semibold text-[#6D6582] hover:text-[#7C3AED] rounded-lg hover:bg-[#F5F3FF] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>View Website</span>
          </Link>

          <div className="px-2.5 py-1.5 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE]">
            <div className="text-[10.5px] font-heading font-semibold text-[#1E1035] truncate">
              {adminEmail}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
              <span className="text-[9.5px] text-[#6D6582] font-sans">Super Administrator</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
