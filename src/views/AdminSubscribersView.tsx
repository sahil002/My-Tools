import { useState, useEffect } from 'react';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminTopNav } from '../components/admin/AdminTopNav';
import {
  Mail,
  Users,
  Send,
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  Bell,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  X,
  TrendingUp,
  Database,
  Copy,
  Check,
  Code2,
} from 'lucide-react';
import {
  getSubscribers,
  deleteSubscriber,
  toggleSubscriberStatus,
  subscribeUser,
  broadcastToolNotification,
  exportSubscribersCSV,
  getBroadcastHistory,
  SubscriberItem,
  BroadcastResult,
  SUBSCRIBERS_UPDATED_EVENT,
  SUPABASE_SUBSCRIBERS_SQL,
} from '../services/subscriberService';
import { useMergedTools } from '../services/toolRegistryService';

export function AdminSubscribersView() {
  const [subscribers, setSubscribers] = useState<SubscriberItem[]>(() => getSubscribers());
  const [broadcastHistory, setBroadcastHistory] = useState<BroadcastResult[]>(() => getBroadcastHistory());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'unsubscribed'>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newSource, setNewSource] = useState<SubscriberItem['source']>('admin_manual');
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastTool, setBroadcastTool] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { tools } = useMergedTools();

  const refreshData = () => {
    setSubscribers(getSubscribers());
    setBroadcastHistory(getBroadcastHistory());
  };

  useEffect(() => {
    window.addEventListener(SUBSCRIBERS_UPDATED_EVENT, refreshData);
    return () => window.removeEventListener(SUBSCRIBERS_UPDATED_EVENT, refreshData);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SUBSCRIBERS_SQL);
    setCopiedSql(true);
    showToast('Supabase SQL copied to clipboard!');
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // Filtered subscribers
  const filteredSubscribers = subscribers.filter((sub) => {
    const matchesSearch = sub.email.toLowerCase().includes(searchQuery.toLowerCase().trim());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || sub.source === sourceFilter;
    return matchesSearch && matchesStatus && matchesSource;
  });

  const totalCount = subscribers.length;
  const activeCount = subscribers.filter((s) => s.status === 'active').length;
  const unsubCount = subscribers.filter((s) => s.status === 'unsubscribed').length;
  const totalNotifications = subscribers.reduce((acc, s) => acc + (s.notificationsSent || 0), 0);

  const handleExportCSV = () => {
    if (subscribers.length === 0) {
      showToast('No subscribers to export.');
      return;
    }
    const csv = exportSubscribersCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `prbsolver-subscribers-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Subscribers CSV exported successfully.');
  };

  const handleToggleStatus = (id: string) => {
    toggleSubscriberStatus(id);
    refreshData();
    showToast('Subscriber status updated.');
  };

  const handleDelete = (id: string, email: string) => {
    if (window.confirm(`Are you sure you want to remove ${email} from the subscriber database?`)) {
      deleteSubscriber(id);
      refreshData();
      showToast('Subscriber removed successfully.');
    }
  };

  const handleAddSubscriber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    const res = subscribeUser(newEmail, newSource);
    showToast(res.message);
    if (res.success) {
      setNewEmail('');
      setIsAddModalOpen(false);
      refreshData();
    }
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastSubject.trim() || !broadcastTool.trim()) {
      alert('Please provide both the tool name and subject line.');
      return;
    }
    const res = broadcastToolNotification(
      broadcastTool.trim(),
      broadcastSubject.trim(),
      broadcastMessage.trim() || `Exciting news! We just released a major update to ${broadcastTool}. Check it out now on PRBSolver.`
    );
    showToast(`Notification broadcast dispatched to ${res.recipientCount} active subscribers!`);
    setIsBroadcastModalOpen(false);
    setBroadcastSubject('');
    setBroadcastTool('');
    setBroadcastMessage('');
    refreshData();
  };

  return (
    <div className="flex h-screen bg-[#FAF9FE] text-[#1E1035] overflow-hidden font-sans">
      {/* 1. Standard Admin Sidebar */}
      <AdminSidebar currentPath="/admin/subscribers" />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AdminTopNav />

        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Toast Notification */}
          {toastMessage && (
            <div className="fixed bottom-6 right-6 z-50 bg-[#1E1035] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs border border-[#DDD6FE] animate-in fade-in slide-in-from-bottom-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Header and Top Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EDE9FE]">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-semibold text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] mb-1.5 shadow-2xs">
                <Mail className="w-3.5 h-3.5" />
                <span>Audience &amp; Newsletter Alerts</span>
              </div>
              <h1 className="text-2xl font-heading font-extrabold text-[#1E1035] tracking-tight">
                Subscribers Management
              </h1>
              <p className="text-xs text-[#6D6582] mt-0.5">
                Real subscribers registered on PRBSolver for instant tool launch alerts and product updates.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIsSqlModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-heading font-semibold text-[#7C3AED] bg-[#F5F3FF] hover:bg-[#EDE9FE] border border-[#DDD6FE] transition-colors cursor-pointer shadow-2xs"
                title="View and copy Supabase SQL table schema"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Supabase SQL Table</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-heading font-medium text-[#1E1035] bg-white hover:bg-[#F5F3FF] border border-[#EDE9FE] transition-colors cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={() => setIsBroadcastModalOpen(true)}
                disabled={activeCount === 0}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-heading font-semibold transition-all shadow-xs cursor-pointer ${
                  activeCount > 0
                    ? 'bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white hover:opacity-95'
                    : 'bg-[#EDE9FE] text-[#9D95B3] cursor-not-allowed'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Alert ({activeCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-heading font-semibold text-white bg-[#1E1035] hover:bg-[#2D1B4E] transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Subscriber</span>
              </button>
            </div>
          </div>

          {/* Quick Notice Banner: Real Subscribers Active */}
          <div className="p-3.5 rounded-xl bg-[#F5F3FF] border border-[#DDD6FE] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#7C3AED] text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-heading font-bold text-[#1E1035]">100% Real Subscribers Mode Active</span>
                <p className="text-[11px] text-[#6D6582] mt-0.5">
                  Sample and test accounts have been wiped. When users enter their email on the homepage or any tool page, they appear here instantly and sync with your Supabase database.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsSqlModalOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-heading font-bold text-[#7C3AED] hover:underline shrink-0"
            >
              <span>Get Supabase SQL</span>
              <Code2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-[#EDE9FE] rounded-2xl shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-[#6D6582]">
                <span className="text-xs font-heading font-semibold">Total Audience</span>
                <div className="w-7 h-7 rounded-lg bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-heading font-extrabold text-[#1E1035]">{totalCount}</div>
              <div className="text-[11px] text-[#9D95B3]">Verified registered contacts</div>
            </div>

            <div className="p-4 bg-white border border-[#EDE9FE] rounded-2xl shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-[#6D6582]">
                <span className="text-xs font-heading font-semibold">Active Subscribers</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-heading font-extrabold text-emerald-600">{activeCount}</div>
              <div className="text-[11px] text-emerald-700/80 font-medium">Ready to receive alerts</div>
            </div>

            <div className="p-4 bg-white border border-[#EDE9FE] rounded-2xl shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-[#6D6582]">
                <span className="text-xs font-heading font-semibold">Unsubscribed</span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-heading font-extrabold text-amber-600">{unsubCount}</div>
              <div className="text-[11px] text-amber-700/80 font-medium">Opted-out (can re-activate)</div>
            </div>

            <div className="p-4 bg-white border border-[#EDE9FE] rounded-2xl shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-[#6D6582]">
                <span className="text-xs font-heading font-semibold">Dispatched Alerts</span>
                <div className="w-7 h-7 rounded-lg bg-[#FAF9FE] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-heading font-extrabold text-[#7C3AED]">{totalNotifications}</div>
              <div className="text-[11px] text-[#9D95B3]">Product notifications sent</div>
            </div>
          </div>

          {/* Search, Status and Source Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#EDE9FE] shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-[#9D95B3] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-[#FAF9FE] border border-[#EDE9FE] focus:border-[#7C3AED] focus:bg-white rounded-xl text-xs text-[#1E1035] outline-none shadow-2xs transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-[#9D95B3] hover:text-[#1E1035] cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                aria-label="Filter subscribers by status"
                className="bg-[#FAF9FE] border border-[#EDE9FE] rounded-xl px-3 py-2 text-xs text-[#1E1035] outline-none cursor-pointer focus:border-[#7C3AED]"
              >
                <option value="all">All Statuses ({totalCount})</option>
                <option value="active">Active Only ({activeCount})</option>
                <option value="unsubscribed">Unsubscribed ({unsubCount})</option>
              </select>

              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                aria-label="Filter subscribers by acquisition source"
                className="bg-[#FAF9FE] border border-[#EDE9FE] rounded-xl px-3 py-2 text-xs text-[#1E1035] outline-none cursor-pointer focus:border-[#7C3AED]"
              >
                <option value="all">All Sources</option>
                <option value="homepage_banner">Homepage Banner</option>
                <option value="tool_view">Tool View</option>
                <option value="footer">Footer</option>
                <option value="blog_sidebar">Blog / Guides</option>
                <option value="admin_manual">Admin Added</option>
              </select>
            </div>
          </div>

          {/* Subscribers Table or Empty State */}
          {filteredSubscribers.length === 0 ? (
            <div className="p-12 text-center bg-white border border-[#EDE9FE] rounded-2xl space-y-4 shadow-2xs">
              <div className="w-14 h-14 rounded-2xl bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center mx-auto">
                <Mail className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-heading font-bold text-[#1E1035]">
                  {searchQuery || statusFilter !== 'all' ? 'No matching subscribers found' : 'No Subscribers Yet'}
                </h3>
                <p className="text-xs text-[#6D6582] mt-1 max-w-md mx-auto">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try clearing your search query or adjusting your filters.'
                    : 'Real subscribers will automatically be captured whenever visitors enter their email across PRBSolver. You can also manually add your first subscriber.'}
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-heading font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Add Real Subscriber
                </button>
                <button
                  type="button"
                  onClick={() => setIsSqlModalOpen(true)}
                  className="px-4 py-2 bg-[#FAF9FE] border border-[#DDD6FE] text-[#1E1035] hover:bg-[#F5F3FF] text-xs font-heading font-medium rounded-xl transition-all cursor-pointer"
                >
                  Setup Supabase Table
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#EDE9FE] rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF9FE] border-b border-[#EDE9FE] text-[#6D6582] font-heading uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Subscriber</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Source</th>
                      <th className="py-3 px-4">Joined Date</th>
                      <th className="py-3 px-4 text-center">Alerts Sent</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE9FE]">
                    {filteredSubscribers.map((sub) => (
                      <tr key={sub.id} className="hover:bg-[#FAF9FE] transition-colors">
                        <td className="py-3 px-4 font-heading font-bold text-[#1E1035]">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                              {sub.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="block leading-tight text-xs font-medium text-[#1E1035]">{sub.email}</span>
                              <span className="text-[10px] text-[#9D95B3] font-mono">ID: {sub.id.slice(0, 12)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {sub.status === 'active' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-heading font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-heading font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Unsubscribed
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-heading bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]">
                            {sub.source.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#6D6582] font-mono text-[11px]">
                          {new Date(sub.subscribedAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-4 text-center font-heading font-bold text-[#1E1035]">
                          {sub.notificationsSent || 0}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(sub.id)}
                              className={`p-1.5 rounded-lg text-xs font-heading font-semibold transition-colors cursor-pointer ${
                                sub.status === 'active'
                                  ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                                  : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                              }`}
                              title={sub.status === 'active' ? 'Mark as Unsubscribed' : 'Reactivate Subscriber'}
                            >
                              {sub.status === 'active' ? 'Deactivate' : 'Reactivate'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(sub.id, sub.email)}
                              className="p-1.5 rounded-lg text-[#6D6582] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete from database"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Broadcast History Log */}
          {broadcastHistory.length > 0 && (
            <div className="bg-white border border-[#EDE9FE] rounded-2xl p-5 shadow-2xs space-y-3">
              <h2 className="text-sm font-heading font-bold text-[#1E1035] flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#7C3AED]" />
                <span>Recent Tool Broadcast Announcements</span>
              </h2>
              <div className="divide-y divide-[#EDE9FE]">
                {broadcastHistory.map((item, idx) => (
                  <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-[#1E1035]">{item.toolName}</span>
                        <span className="text-[11px] text-[#7C3AED] bg-[#F5F3FF] px-2 py-0.5 rounded-full border border-[#DDD6FE]">
                          {item.subject}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6D6582] mt-0.5">{item.message}</p>
                    </div>
                    <div className="text-right text-[11px] text-[#9D95B3] shrink-0 font-mono">
                      <span>{item.recipientCount} recipients</span> •{' '}
                      <span>{new Date(item.sentAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* SQL TABLE DRAWER / MODAL */}
      {isSqlModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E1035]/60 backdrop-blur-xs animate-in fade-in duration-200 font-sans"
        >
          <div className="bg-white border border-[#EDE9FE] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDE9FE]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-[#1E1035]">
                    Supabase PostgreSQL Table for Subscribers
                  </h3>
                  <p className="text-[11px] text-[#6D6582]">
                    Run this SQL script in your Supabase SQL Editor to enable cloud persistence.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSqlModalOpen(false)}
                className="p-1 rounded-lg text-[#6D6582] hover:text-[#1E1035] hover:bg-[#F5F3FF]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#FAF9FE] p-3 rounded-xl border border-[#EDE9FE] text-xs text-[#6D6582] space-y-1.5">
              <div className="font-heading font-semibold text-[#1E1035] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>How to apply this in Supabase:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11.5px]">
                <li>Go to <strong className="text-[#1E1035]">supabase.com</strong> and open your project dashboard.</li>
                <li>Click on <strong className="text-[#1E1035]">SQL Editor</strong> in the left sidebar.</li>
                <li>Paste the script below and click <strong className="text-[#7C3AED]">Run (Ctrl+Enter)</strong>.</li>
              </ol>
            </div>

            <div className="relative">
              <pre className="bg-[#1E1035] text-[#EDE9FE] p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-72 leading-relaxed border border-[#3E2468]">
                {SUPABASE_SUBSCRIBERS_SQL}
              </pre>
              <button
                type="button"
                onClick={handleCopySql}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-heading font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy SQL</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsSqlModalOpen(false)}
                className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-heading font-semibold rounded-xl cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD SUBSCRIBER MODAL */}
      {isAddModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E1035]/60 backdrop-blur-xs animate-in fade-in duration-200 font-sans"
        >
          <div className="bg-white border border-[#EDE9FE] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDE9FE]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-heading font-bold text-sm text-[#1E1035]">Add New Real Subscriber</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-[#6D6582] hover:text-[#1E1035] hover:bg-[#F5F3FF]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubscriber} className="space-y-4 text-xs">
              <div>
                <label className="block font-heading font-semibold text-[#1E1035] mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="subscriber@domain.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#EDE9FE] focus:border-[#7C3AED] rounded-xl text-xs text-[#1E1035] outline-none"
                />
              </div>

              <div>
                <label className="block font-heading font-semibold text-[#1E1035] mb-1">
                  Acquisition Channel
                </label>
                <select
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-[#EDE9FE] focus:border-[#7C3AED] rounded-xl text-xs text-[#1E1035] outline-none"
                >
                  <option value="admin_manual">Admin Manual Addition</option>
                  <option value="homepage_banner">Homepage Newsletter</option>
                  <option value="tool_view">Tool Release View</option>
                  <option value="blog_sidebar">Blog / Guides</option>
                  <option value="footer">Site Footer</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-[#DDD6FE] rounded-xl text-xs font-heading text-[#6D6582] hover:bg-[#F5F3FF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-xs font-heading font-semibold shadow-xs"
                >
                  Save Subscriber
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BROADCAST ALERT MODAL */}
      {isBroadcastModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E1035]/60 backdrop-blur-xs animate-in fade-in duration-200 font-sans"
        >
          <div className="bg-white border border-[#EDE9FE] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDE9FE]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <h3 className="font-heading font-bold text-sm text-[#1E1035]">
                  Broadcast Tool Launch Alert
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBroadcastModalOpen(false)}
                className="p-1 rounded-lg text-[#6D6582] hover:text-[#1E1035] hover:bg-[#F5F3FF]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs">
              <div>
                <label className="block font-heading font-semibold text-[#1E1035] mb-1">
                  Target Tool / Calculator *
                </label>
                <select
                  value={broadcastTool}
                  onChange={(e) => setBroadcastTool(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-[#EDE9FE] focus:border-[#7C3AED] rounded-xl text-xs text-[#1E1035] outline-none"
                >
                  <option value="">Select tool...</option>
                  {tools.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} (/{t.category}/{t.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-heading font-semibold text-[#1E1035] mb-1">
                  Email Subject Line *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. New Tool Alert: Compound Interest Calculator is Live!"
                  value={broadcastSubject}
                  onChange={(e) => setBroadcastSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#EDE9FE] focus:border-[#7C3AED] rounded-xl text-xs text-[#1E1035] outline-none"
                />
              </div>

              <div>
                <label className="block font-heading font-semibold text-[#1E1035] mb-1">
                  Announcement Message
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief overview of what makes this tool valuable for users..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#EDE9FE] focus:border-[#7C3AED] rounded-xl text-xs text-[#1E1035] outline-none"
                />
              </div>

              <div className="p-3 bg-[#FAF9FE] rounded-xl border border-[#EDE9FE] text-[11px] text-[#6D6582]">
                Will be sent to <strong className="text-[#7C3AED]">{activeCount}</strong> active subscriber(s).
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBroadcastModalOpen(false)}
                  className="px-4 py-2 border border-[#DDD6FE] rounded-xl text-xs font-heading text-[#6D6582] hover:bg-[#F5F3FF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-xs font-heading font-semibold shadow-xs"
                >
                  Dispatch Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
