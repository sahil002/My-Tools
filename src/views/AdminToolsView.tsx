import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from '../context/RouterContext';
import { useTheme } from '../context/ThemeContext';
import { SEOHelmet } from '../components/SEOHelmet';
import {
  getActiveAdminSession,
  logoutAdmin,
  updateAdminPassword,
  AdminSession,
  getAdminLoginRoute,
} from '../services/adminAuth';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminTopNav } from '../components/admin/AdminTopNav';
import { ToolUploadModal } from '../components/admin/ToolUploadModal';
import {
  getAllToolsList,
  toggleToolStatus,
  removeCustomTool,
  ToolListItem,
} from '../../src/services/customToolsService';
import {
  Wrench,
  Search,
  Plus,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  Edit2,
  Trash2,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  FolderArchive,
  BarChart2,
  Power,
  Layers,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  FileCode,
} from 'lucide-react';
import { ToolCategory } from '../types';

export function AdminToolsView() {
  const { navigate } = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  // Tools Data State
  const [tools, setTools] = useState<ToolListItem[]>([]);
  const [isLoadingTools, setIsLoadingTools] = useState(true);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingTool, setEditingTool] = useState<ToolListItem | null>(null);
  const [toolToDelete, setToolToDelete] = useState<ToolListItem | null>(null);
  const [previewTool, setPreviewTool] = useState<ToolListItem | null>(null);

  // Verify authentication on mount
  useEffect(() => {
    let isMounted = true;
    getActiveAdminSession().then((activeSession) => {
      if (!isMounted) return;
      if (!activeSession) {
        const loginRoute = getAdminLoginRoute();
        navigate(`${loginRoute}?redirect=/admin/tools`);
      } else {
        setSession(activeSession);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Load tools list
  const loadTools = async () => {
    setIsLoadingTools(true);
    try {
      const list = await getAllToolsList();
      setTools(list);
    } catch (err) {
      console.error('Failed to load tools:', err);
    } finally {
      setIsLoadingTools(false);
    }
  };

  useEffect(() => {
    if (session) {
      loadTools();
    }
  }, [session]);

  const handleLogout = () => {
    logoutAdmin();
    const loginRoute = getAdminLoginRoute();
    navigate(loginRoute);
  };

  // Status toggle handler
  const handleToggleStatus = async (tool: ToolListItem) => {
    try {
      const updatedStatus = await toggleToolStatus(tool.id, tool.isCustom, tool.status);
      setTools((prev) =>
        prev.map((t) => (t.id === tool.id ? { ...t, status: updatedStatus } : t))
      );
      setActionNotice({
        type: 'success',
        message: `Tool "${tool.name}" is now ${updatedStatus === 'active' ? 'Active' : 'Inactive (Deactivated)'}.`,
      });
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err) {
      setActionNotice({
        type: 'error',
        message: `Failed to toggle status: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  };

  // Delete tool handler
  const handleDeleteTool = async () => {
    if (!toolToDelete) return;
    try {
      await removeCustomTool(toolToDelete.id);
      setTools((prev) => prev.filter((t) => t.id !== toolToDelete.id));
      setActionNotice({
        type: 'success',
        message: `Custom tool "${toolToDelete.name}" has been deleted.`,
      });
      setToolToDelete(null);
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err) {
      setActionNotice({
        type: 'error',
        message: `Failed to delete tool: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  };

  // Password change handler
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setPasswordStatus({ success: false, message: 'Password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ success: false, message: 'Passwords do not match.' });
      return;
    }

    setSavingPassword(true);
    setPasswordStatus(null);

    try {
      await updateAdminPassword(newPassword);
      setPasswordStatus({ success: true, message: 'Password updated successfully!' });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordStatus(null);
      }, 2000);
    } catch {
      setPasswordStatus({ success: false, message: 'Failed to update password.' });
    } finally {
      setSavingPassword(false);
    }
  };

  // Filtered tools list
  const filteredTools = useMemo(() => {
    return tools.filter((t) => {
      // Search filter
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        t.name.toLowerCase().includes(query) ||
        t.slug.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.keywords.some((k) => k.toLowerCase().includes(query));

      // Category filter
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;

      // Status filter
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [tools, searchQuery, categoryFilter, statusFilter]);

  // Metric counts
  const totalCount = tools.length;
  const activeCount = tools.filter((t) => t.status === 'active').length;
  const inactiveCount = tools.filter((t) => t.status === 'inactive').length;
  const customCount = tools.filter((t) => t.isCustom).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9FE] text-[#1E1035]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#7C3AED]/20 border-t-[#7C3AED] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#6D6582]">Verifying administrative access...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div>
      <div
        id="admin-tools-container"
        className="min-h-screen bg-[#FAF9FE] text-[#1E1035] flex flex-col lg:flex-row font-sans transition-colors duration-200"
      >
        <SEOHelmet
          title="Tools Manager | Admin Console"
          description="Manage deployed tools, monitor performance, and upload zip packages for sandboxed auto-embedding."
          canonicalPath="/admin/tools"
          noindex={true}
        />

        {/* Sidebar */}
        <AdminSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          adminEmail={session.user.email}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <AdminTopNav
            onToggleSidebar={() => setSidebarOpen(true)}
            adminTheme={theme}
            onToggleTheme={toggleTheme}
            onOpenPasswordModal={() => setShowPasswordModal(true)}
            onLogout={handleLogout}
            pageTitle="Tools Manager"
          />

          <main id="admin-tools-main" className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto space-y-6">
            {/* Header with Title & "Add New Tool" Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-heading font-extrabold tracking-tight text-[#1E1035]">
                  Tools Manager
                </h1>
                <p className="text-xs sm:text-sm text-[#6D6582] mt-0.5">
                  List, inspect, configure, and upload web applet zip packages for isolated sandboxed auto-embedding.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  id="add-new-tool-btn"
                  onClick={() => {
                    setEditingTool(null);
                    setShowUploadModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-[#FFFFFF] rounded-xl text-xs font-heading font-bold transition-all shadow-xs shadow-[#7C3AED]/20 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Tool</span>
                </button>
              </div>
            </div>

            {/* Action Feedback Banner */}
            {actionNotice && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-center justify-between transition-all ${
                  actionNotice.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {actionNotice.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  )}
                  <span className="font-medium">{actionNotice.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActionNotice(null)}
                  className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Top Stat Strips (4 metrics) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-4 shadow-xs">
                <span className="text-xs text-[#6D6582]">Total Registered</span>
                <div className="text-2xl font-bold font-mono text-[#1E1035] mt-1">
                  {totalCount}
                </div>
              </div>

              <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-4 shadow-xs">
                <span className="text-xs text-emerald-600 font-medium">Active (Live)</span>
                <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
                  {activeCount}
                </div>
              </div>

              <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-4 shadow-xs">
                <span className="text-xs text-amber-600 font-medium">Inactive (Offline)</span>
                <div className="text-2xl font-bold font-mono text-amber-700 mt-1">
                  {inactiveCount}
                </div>
              </div>

              <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-4 shadow-xs">
                <span className="text-xs text-[#7C3AED] font-medium">Custom Sandboxed</span>
                <div className="text-2xl font-bold font-mono text-[#7C3AED] mt-1">
                  {customCount}
                </div>
              </div>
            </div>

            {/* Search, Category & Status Filter Bar */}
            <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9D95B3]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tools by name, slug, or keywords..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF9FE] border border-[#EDE9FE] rounded-xl text-[#1E1035] placeholder-[#9D95B3] focus:outline-hidden focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Category Dropdown */}
                <div className="flex items-center gap-1.5 text-xs text-[#6D6582]">
                  <Filter className="w-3.5 h-3.5 text-[#7C3AED]" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-[#FAF9FE] border border-[#EDE9FE] rounded-xl text-[#1E1035] focus:outline-hidden focus:border-[#7C3AED]"
                  >
                    <option value="all">All Categories</option>
                    <option value="calculators">Calculators</option>
                    <option value="text-tools">Text Tools</option>
                    <option value="converters">Converters</option>
                    <option value="date-time">Date & Time</option>
                    <option value="education">Education</option>
                    <option value="developer-tools">Developer Tools</option>
                  </select>
                </div>

                {/* Status Switcher Buttons */}
                <div className="flex items-center p-0.5 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE]">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className={`px-2.5 py-1 text-xs font-heading font-semibold rounded-lg transition-colors cursor-pointer ${
                      statusFilter === 'all'
                        ? 'bg-[#FFFFFF] text-[#1E1035] shadow-2xs'
                        : 'text-[#6D6582] hover:text-[#1E1035]'
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('active')}
                    className={`px-2.5 py-1 text-xs font-heading font-semibold rounded-lg transition-colors cursor-pointer ${
                      statusFilter === 'active'
                        ? 'bg-[#FFFFFF] text-[#1E1035] shadow-2xs'
                        : 'text-[#6D6582] hover:text-[#1E1035]'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('inactive')}
                    className={`px-2.5 py-1 text-xs font-heading font-semibold rounded-lg transition-colors cursor-pointer ${
                      statusFilter === 'inactive'
                        ? 'bg-[#FFFFFF] text-[#1E1035] shadow-2xs'
                        : 'text-[#6D6582] hover:text-[#1E1035]'
                    }`}
                  >
                    Inactive
                  </button>
                </div>
              </div>
            </div>

            {/* Tools Data Table */}
            <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl overflow-hidden shadow-xs transition-colors">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FAF9FE] border-b border-[#EDE9FE] text-[#6D6582] font-heading font-bold">
                      <th className="py-3 px-4 sm:px-6">Tool Name & Slug</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Performance Snapshot</th>
                      <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE9FE]">
                    {isLoadingTools ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-[#6D6582]">
                          <div className="w-6 h-6 border-2 border-[#7C3AED]/20 border-t-[#7C3AED] rounded-full animate-spin mx-auto mb-2" />
                          <span>Loading tool inventory...</span>
                        </td>
                      </tr>
                    ) : filteredTools.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-[#6D6582]">
                          <Wrench className="w-8 h-8 mx-auto mb-2 text-[#9D95B3]" />
                          <p className="font-heading font-bold text-[#1E1035]">No tools found</p>
                          <p className="text-xs text-[#6D6582] mt-0.5">Try altering your search or filters</p>
                        </td>
                      </tr>
                    ) : (
                      filteredTools.map((tool) => {
                        const isLiveActive = tool.status === 'active';

                        return (
                          <tr
                            key={tool.id}
                            className="hover:bg-[#FAF9FE] transition-colors"
                          >
                            {/* Name & Slug */}
                            <td className="py-3.5 px-4 sm:px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center shrink-0">
                                  {tool.isCustom ? (
                                    <FolderArchive className="w-4 h-4" />
                                  ) : (
                                    <Wrench className="w-4 h-4" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-heading font-bold text-[#1E1035] truncate">
                                      {tool.name}
                                    </span>
                                    {tool.isCustom ? (
                                      <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-[#EDE9FE] text-[#7C3AED] border border-[#DDD6FE]">
                                        Custom Zip
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-[#FAF9FE] text-[#6D6582] border border-[#EDE9FE]">
                                        Native
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] font-mono text-[#6D6582] truncate mt-0.5">
                                    /tools/{tool.slug}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Category */}
                            <td className="py-3.5 px-4">
                              <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#FAF9FE] border border-[#EDE9FE] text-[#6D6582] capitalize">
                                {tool.category.replace('-', ' ')}
                              </span>
                            </td>

                            {/* Status with One-Click Switch Toggle */}
                            <td className="py-3.5 px-4">
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(tool)}
                                className="group inline-flex items-center gap-1.5 cursor-pointer focus:outline-hidden"
                                title={`Click to ${isLiveActive ? 'deactivate' : 'activate'} this tool`}
                              >
                                <span
                                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                                    isLiveActive ? 'bg-emerald-500' : 'bg-[#9D95B3]'
                                  }`}
                                />
                                <span
                                  className={`text-xs font-semibold ${
                                    isLiveActive
                                      ? 'text-emerald-700'
                                      : 'text-[#6D6582]'
                                  }`}
                                >
                                  {isLiveActive ? 'Active' : 'Inactive'}
                                </span>
                              </button>
                            </td>

                            {/* Performance Snapshot */}
                            <td
                              className="py-3.5 px-4 cursor-pointer group"
                              onClick={() => navigate(`/admin/analytics?tool=${tool.slug}`)}
                              title="Click to view detailed performance analytics"
                            >
                              <div className="space-y-1 text-[11px]">
                                <div className="flex items-center gap-2">
                                  <span className="text-[#6D6582]">Invocations:</span>
                                  <span className="font-mono font-semibold text-[#1E1035] group-hover:text-[#7C3AED] transition-colors">
                                    {tool.performance.invocations.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[#6D6582]">Views:</span>
                                  <span className="font-mono text-[#1E1035]">
                                    {tool.performance.views.toLocaleString()}
                                  </span>
                                  {tool.zipFileSize ? (
                                    <span className="text-[#9D95B3] font-mono">
                                      • {(tool.zipFileSize / 1024).toFixed(0)} KB
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 sm:px-6 text-right">
                              <div className="inline-flex items-center gap-1 justify-end">
                                {/* Performance Analytics */}
                                <button
                                  type="button"
                                  onClick={() => navigate(`/admin/analytics?tool=${tool.slug}`)}
                                  className="p-1.5 rounded-lg text-[#6D6582] hover:text-[#7C3AED] hover:bg-[#F5F3FF] transition-colors cursor-pointer"
                                  title="View detailed performance analytics"
                                >
                                  <BarChart2 className="w-4 h-4" />
                                </button>

                                {/* View Live Tool */}
                                <a
                                  href={`/tools/${tool.slug}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 rounded-lg text-[#6D6582] hover:text-[#7C3AED] hover:bg-[#F5F3FF] transition-colors"
                                  title="Open live tool page in new tab"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>

                                {/* Preview in Sandboxed Modal (custom tools) */}
                                {tool.isCustom && (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewTool(tool)}
                                    className="p-1.5 rounded-lg text-[#6D6582] hover:text-[#7C3AED] hover:bg-[#F5F3FF] transition-colors cursor-pointer"
                                    title="Test in Sandboxed iframe"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                )}

                                {/* Edit / Replace Zip */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingTool(tool);
                                    setShowUploadModal(true);
                                  }}
                                  className="p-1.5 rounded-lg text-[#6D6582] hover:text-[#1E1035] hover:bg-[#FAF9FE] transition-colors cursor-pointer"
                                  title="Edit tool metadata or replace zip package"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>

                                {/* Delete (for custom tools) or Deactivate Toggle */}
                                {tool.isCustom ? (
                                  <button
                                    type="button"
                                    onClick={() => setToolToDelete(tool)}
                                    className="p-1.5 rounded-lg text-[#6D6582] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                    title="Delete custom tool"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleStatus(tool)}
                                    className="p-1.5 rounded-lg text-[#6D6582] hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                                    title={isLiveActive ? 'Deactivate tool' : 'Activate tool'}
                                  >
                                    <Power className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="p-4 bg-[#FAF9FE] border-t border-[#EDE9FE] flex items-center justify-between text-xs text-[#6D6582]">
                <span>
                  Showing {filteredTools.length} of {totalCount} tools
                </span>
                <span className="font-semibold text-[#1E1035]">
                  Direct embed mount active at <code>/tools/[slug]</code>
                </span>
              </div>
            </div>
          </main>
        </div>

        {/* Tool Upload & Edit Modal */}
        <ToolUploadModal
          isOpen={showUploadModal}
          onClose={() => {
            setShowUploadModal(false);
            setEditingTool(null);
          }}
          onToolSaved={loadTools}
          initialTool={editingTool}
        />

        {/* Delete Confirmation Modal */}
        {toolToDelete && (
          <div
            id="delete-confirm-modal-backdrop"
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-6 max-w-md w-full shadow-xl animate-in fade-in duration-150">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-heading font-bold text-[#1E1035]">
                    Confirm Delete Tool
                  </h3>
                  <p className="text-xs text-[#6D6582]">
                    This action will permanently remove the embedded bundle.
                  </p>
                </div>
              </div>

              <p className="text-xs text-[#6D6582] mb-6 leading-relaxed">
                Are you sure you want to delete <strong className="text-[#1E1035]">{toolToDelete.name}</strong> (/tools/{toolToDelete.slug})? If you only wish to take it offline temporarily, use the status toggle instead.
              </p>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setToolToDelete(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#6D6582] hover:text-[#1E1035] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteTool}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-[#FFFFFF] rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Delete Tool
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Live Sandboxed Preview Modal */}
        {previewTool && (
          <div
            id="preview-tool-modal-backdrop"
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
          >
            <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-150">
              <div className="h-16 px-6 border-b border-[#EDE9FE] flex items-center justify-between shrink-0 bg-[#FAF9FE]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-heading font-bold text-[#1E1035]">
                    Sandboxed Preview: {previewTool.name}
                  </span>
                  <span className="text-[11px] font-mono text-[#6D6582]">
                    (/tools/{previewTool.slug})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`/tools/${previewTool.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-heading font-semibold bg-[#7C3AED] text-white rounded-xl hover:bg-[#6D28D9] shadow-xs"
                  >
                    <span>Open in New Tab</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setPreviewTool(null)}
                    className="p-1.5 rounded-lg text-[#6D6582] hover:text-[#1E1035] cursor-pointer"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden p-4 bg-[#FAF9FE]">
                <iframe
                  id={`admin-test-iframe-${previewTool.slug}`}
                  title={previewTool.name}
                  src={`/tools/${previewTool.slug}`}
                  sandbox="allow-scripts allow-forms"
                  referrerPolicy="no-referrer"
                  className="w-full h-full min-h-[520px] rounded-xl border border-[#EDE9FE] bg-white shadow-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {showPasswordModal && (
          <div
            id="password-change-modal-backdrop"
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <div
              id="password-change-modal"
              className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-6 max-w-md w-full shadow-xl animate-in fade-in duration-150"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-heading font-bold text-[#1E1035]">
                    Update Admin Password
                  </h3>
                  <p className="text-xs text-[#6D6582]">
                    Encrypted with PBKDF2 (100,000 rounds)
                  </p>
                </div>
              </div>

              {passwordStatus && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 mb-4 ${
                    passwordStatus.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {passwordStatus.success ? (
                    <CheckCircle className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{passwordStatus.message}</span>
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#1E1035] mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full px-3 py-2 text-xs bg-[#FAF9FE] border border-[#EDE9FE] rounded-xl text-[#1E1035] focus:outline-hidden focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1E1035] mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-3 py-2 text-xs bg-[#FAF9FE] border border-[#EDE9FE] rounded-xl text-[#1E1035] focus:outline-hidden focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordStatus(null);
                    }}
                    disabled={savingPassword}
                    className="px-3.5 py-2 text-xs text-[#6D6582] hover:text-[#1E1035] font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-[#FFFFFF] rounded-xl text-xs font-heading font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {savingPassword ? 'Encrypting...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
