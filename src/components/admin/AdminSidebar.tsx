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
  Globe2,
  Settings,
  ArrowLeft,
  X,
  Shield,
  Layers,
  Mail,
  BookOpen,
  Plus,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { ADMIN_STATS_SUMMARY } from '../../data/adminOverviewData';
import { getCommentsStats, COMMENTS_CHANGED_EVENT } from '../../services/commentModerationService';
import { getToolRequestsStats, TOOL_REQUESTS_CHANGED_EVENT } from '../../services/toolRequestsService';
import { getSubscribers, SUBSCRIBERS_UPDATED_EVENT } from '../../services/subscriberService';
import { useState, useEffect } from 'react';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  adminEmail?: string;
  currentPath?: string;
}

interface SubNavItem {
  id: string;
  name: string;
  path: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

interface NavItem {
  id: string;
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeColor?: string;
  subItems?: SubNavItem[];
  quickAction?: {
    label: string;
    path: string;
    title: string;
  };
}

export function AdminSidebar({
  isOpen = false,
  onClose = () => {},
  adminEmail = 'admin@onlinetools.internal',
}: AdminSidebarProps) {
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

  const [activeSubscribersCount, setActiveSubscribersCount] = useState<number>(() => {
    try {
      return getSubscribers().filter((s) => s.status === 'active').length;
    } catch {
      return 0;
    }
  });

  const [guidesSubmenuOpen, setGuidesSubmenuOpen] = useState<boolean>(() => {
    return currentPath.startsWith('/admin/guides') || currentPath.startsWith('/admin/post-editor');
  });

  useEffect(() => {
    if (currentPath.startsWith('/admin/guides') || currentPath.startsWith('/admin/post-editor')) {
      setGuidesSubmenuOpen(true);
    }
  }, [currentPath]);

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
    const handleSubscribersUpdate = () => {
      try {
        setActiveSubscribersCount(getSubscribers().filter((s) => s.status === 'active').length);
      } catch {
        // fallback
      }
    };

    window.addEventListener(COMMENTS_CHANGED_EVENT, handleCommentsUpdate);
    window.addEventListener(TOOL_REQUESTS_CHANGED_EVENT, handleRequestsUpdate);
    window.addEventListener(SUBSCRIBERS_UPDATED_EVENT, handleSubscribersUpdate);

    return () => {
      window.removeEventListener(COMMENTS_CHANGED_EVENT, handleCommentsUpdate);
      window.removeEventListener(TOOL_REQUESTS_CHANGED_EVENT, handleRequestsUpdate);
      window.removeEventListener(SUBSCRIBERS_UPDATED_EVENT, handleSubscribersUpdate);
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
    },
    {
      id: 'nav-categories',
      name: 'Categories',
      path: '/admin/categories',
      icon: Layers,
    },
    {
      id: 'nav-guides',
      name: 'Blog & Guides',
      path: '/admin/guides',
      icon: BookOpen,
      quickAction: {
        label: '+ New',
        path: '/admin/guides/create',
        title: 'Write / Add New Post (Full Page)',
      },
      subItems: [
        {
          id: 'sub-guides-all',
          name: 'All Guides & Posts',
          path: '/admin/guides',
          icon: BookOpen,
        },
        {
          id: 'sub-guides-create',
          name: '+ Add New Post',
          path: '/admin/guides/create',
          icon: Plus,
          badge: 'Editor',
          badgeColor: 'bg-purple-100 text-[#7C3AED] border border-[#C4B5FD]',
        },
      ],
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
      id: 'nav-subscribers',
      name: 'Subscribers',
      path: '/admin/subscribers',
      icon: Mail,
      badge: activeSubscribersCount > 0 ? activeSubscribersCount : undefined,
      badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
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
      name: 'SEO & Content',
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
          className="fixed inset-0 z-40 bg-[#1E1035]/50 backdrop-blur-xs lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        id="admin-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-60 sm:w-64 bg-[#FFFFFF] border-r border-[#EDE9FE] flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 font-sans shadow-xs shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#EDE9FE] shrink-0 bg-[#FAF9FE]/70">
          <Link
            href="/admin/dashboard"
            onClick={onClose}
            className="flex items-center gap-2 font-heading font-bold text-sm text-[#1E1035]"
          >
            <img
              src="/logo.png"
              alt="PRBSolver"
              className="w-7 h-7 rounded-lg object-contain shadow-2xs border border-[#DDD6FE] shrink-0"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/favicon.svg';
              }}
            />
            <div>
              <span className="block text-xs sm:text-[13px] font-heading font-bold tracking-tight text-[#1E1035] leading-tight">Admin Console</span>
              <span className="block text-[9.5px] font-sans font-medium text-[#7C3AED]">PRB (Problem) Solver</span>
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
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 font-sans">
          <div className="px-2.5 pb-1.5 text-[9.5px] font-heading font-bold uppercase tracking-wider text-[#9D95B3]">
            Management Modules
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path || (item.path !== '/admin/dashboard' && currentPath.startsWith(item.path));

            if (item.subItems && item.subItems.length > 0) {
              const isGroupActive = currentPath.startsWith(item.path) || currentPath.startsWith('/admin/post-editor');
              return (
                <div key={item.id} className="space-y-0.5">
                  <div
                    className={`group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                      isGroupActive
                        ? 'bg-[#7C3AED]/10 text-[#7C3AED] font-bold border border-[#DDD6FE]'
                        : 'text-[#6D6582] hover:bg-[#F5F3FF] hover:text-[#1E1035]'
                    }`}
                  >
                    <Link
                      id={item.id}
                      href={item.path}
                      onClick={onClose}
                      className="flex items-center gap-2.5 min-w-0 flex-1"
                    >
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                          isGroupActive
                            ? 'text-[#7C3AED]'
                            : 'text-[#6D6582] group-hover:text-[#7C3AED]'
                        }`}
                      />
                      <span className="font-heading font-medium truncate">{item.name}</span>
                    </Link>

                    <div className="flex items-center gap-1 shrink-0">
                      {item.quickAction && (
                        <Link
                          href={item.quickAction.path}
                          onClick={onClose}
                          title={item.quickAction.title}
                          className="px-1.5 py-0.5 rounded-md text-[10px] font-heading font-bold bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-2xs transition-transform hover:scale-105 cursor-pointer flex items-center gap-0.5"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>Post</span>
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setGuidesSubmenuOpen((prev) => !prev);
                        }}
                        className="p-1 rounded-md text-[#6D6582] hover:text-[#7C3AED] hover:bg-white/80 cursor-pointer"
                        title="Toggle Submenu"
                      >
                        {guidesSubmenuOpen ? (
                          <ChevronDown className="w-3 h-3 text-[#7C3AED]" />
                        ) : (
                          <ChevronRight className="w-3 h-3 text-[#9D95B3]" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Submenu Children */}
                  {guidesSubmenuOpen && (
                    <div className="pl-4 pr-1 py-1 space-y-0.5 border-l-2 border-[#DDD6FE] ml-3.5 animate-in fade-in slide-in-from-top-1 duration-150">
                      {item.subItems.map((sub) => {
                        const SubIcon = sub.icon || BookOpen;
                        const isSubActive =
                          sub.path === '/admin/guides/create'
                            ? currentPath === '/admin/guides/create' || currentPath.startsWith('/admin/guides/create') || currentPath.startsWith('/admin/post-editor')
                            : currentPath === '/admin/guides' && !currentPath.includes('/create');

                        return (
                          <Link
                            key={sub.id}
                            id={sub.id}
                            href={sub.path}
                            onClick={onClose}
                            className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-[11.5px] transition-colors ${
                              isSubActive
                                ? 'bg-[#7C3AED] text-white font-bold shadow-2xs'
                                : 'text-[#6D6582] hover:bg-[#F5F3FF] hover:text-[#7C3AED]'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <SubIcon className={`w-3 h-3 shrink-0 ${isSubActive ? 'text-white' : 'text-[#9D95B3]'}`} />
                              <span className="truncate">{sub.name}</span>
                            </div>

                            {sub.badge && (
                              <span
                                className={`text-[9.5px] font-heading font-semibold px-1.5 py-0.2 rounded-full shrink-0 ${
                                  isSubActive
                                    ? 'bg-white/20 text-white'
                                    : sub.badgeColor || 'bg-purple-100 text-[#7C3AED]'
                                }`}
                              >
                                {sub.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

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
