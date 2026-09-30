import { useState, useEffect } from 'react';
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
  const [newEmail, setNewEmail] = useState('');
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastTool, setBroadcastTool] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { tools } = useMergedTools();

  useEffect(() => {
    const handleUpdate = () => {
      setSubscribers(getSubscribers());
      setBroadcastHistory(getBroadcastHistory());
    };
    window.addEventListener(SUBSCRIBERS_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(SUBSCRIBERS_UPDATED_EVENT, handleUpdate);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
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
    const csv = exportSubscribersCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `onlinetools-subscribers-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Subscribers CSV exported successfully.');
  };

  const handleToggleStatus = (id: string) => {
    toggleSubscriberStatus(id);
    setSubscribers(getSubscribers());
    showToast('Subscriber status updated.');
  };

  const handleDelete = (id: string, email: string) => {
    if (window.confirm(`Are you sure you want to remove ${email} from the subscriber database?`)) {
      deleteSubscriber(id);
      setSubscribers(getSubscribers());
      showToast('Subscriber removed successfully.');
    }
  };

  const handleAddSubscriber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    const res = subscribeUser(newEmail, 'admin_manual');
    showToast(res.message);
    if (res.success) {
      setNewEmail('');
      setIsAddModalOpen(false);
      setSubscribers(getSubscribers());
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
      broadcastMessage.trim() || `Exciting news! We just released a major update to ${broadcastTool}. Check it out now.`
    );
    showToast(`Notification broadcast dispatched to ${res.recipientCount} active subscribers!`);
    setIsBroadcastModalOpen(false);
    setBroadcastSubject('');
    setBroadcastTool('');
    setBroadcastMessage('');
    setSubscribers(getSubscribers());
    setBroadcastHistory(getBroadcastHistory());
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1E1035] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs border border-[#DDD6FE] animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header and Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-[#1E1035] tracking-tight">
              Email Subscribers &amp; Alert Hub
            </h1>
            <span className="text-xs font-heading font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live DB Active
            </span>
          </div>
          <p className="text-xs text-[#6D6582] mt-1 font-sans">
            Real subscribers registered via the homepage and tool pages for instant tool updates &amp; announcements.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#EDE9FE] text-[#1E1035] hover:bg-[#FAF9FE] text-xs font-heading font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#DDD6FE] text-[#7C3AED] hover:bg-[#F5F3FF] text-xs font-heading font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span>Add Subscriber</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (tools.length > 0) {
                setBroadcastTool(tools[0].name);
                setBroadcastSubject(`New Tool Released: ${tools[0].name}!`);
              }
              setIsBroadcastModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-heading font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Broadcast Tool Alert</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Metric Stat Cards with Distinct Accent Colors */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Subscribers */}
        <div className="bg-white border border-[#EDE9FE] rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#6D6582] mb-1.5">
            <span className="font-heading font-semibold">Total Registered</span>
            <Users className="w-4 h-4 text-[#7C3AED]" />
          </div>
          <div className="text-2xl font-heading font-extrabold text-[#1E1035] font-mono">
            {totalCount.toLocaleString()}
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span>100% Verified Subscriptions</span>
          </div>
        </div>

        {/* Active Subscribers (Emerald Accent) */}
        <div className="bg-white border border-emerald-100 rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-emerald-800 mb-1.5">
            <span className="font-heading font-semibold">Active Recipients</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-2xl font-heading font-extrabold text-emerald-700 font-mono">
            {activeCount.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-emerald-600">
            {totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 100}% Active Engagement Rate
          </div>
        </div>

        {/* Inactive / Unsubscribed (Amber Accent) */}
        <div className="bg-white border border-amber-100 rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-amber-800 mb-1.5">
            <span className="font-heading font-semibold">Unsubscribed</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-heading font-extrabold text-amber-700 font-mono">
            {unsubCount.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-amber-600">
            Self-managed opt-outs
          </div>
        </div>

        {/* Dispatched Broadcasts (Violet Accent) */}
        <div className="bg-white border border-[#DDD6FE] rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#7C3AED] mb-1.5">
            <span className="font-heading font-semibold">Alerts Delivered</span>
            <Bell className="w-4 h-4 text-[#7C3AED]" />
          </div>
          <div className="text-2xl font-heading font-extrabold text-[#7C3AED] font-mono">
            {totalNotifications.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-[#6D6582]">
            Tool updates &amp; launch notices
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-[#EDE9FE] rounded-2xl overflow-hidden shadow-2xs">
        {/* Search & Filter Toolbar */}
        <div className="p-4 sm:p-5 border-b border-[#EDE9FE] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#9D95B3] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by subscriber email address..."
              className="w-full pl-9 pr-4 py-2 bg-[#FAF9FE] border border-[#EDE9FE] focus:border-[#7C3AED] focus:bg-white rounded-xl text-xs font-sans text-[#1E1035] outline-hidden transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-[#FAF9FE] border border-[#EDE9FE] rounded-xl text-xs font-heading font-semibold text-[#1E1035] outline-hidden cursor-pointer"
            >
              <option value="all">All Statuses ({totalCount})</option>
              <option value="active">Active Only ({activeCount})</option>
              <option value="unsubscribed">Unsubscribed ({unsubCount})</option>
            </select>

            {/* Source Filter */}
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-2 bg-[#FAF9FE] border border-[#EDE9FE] rounded-xl text-xs font-heading font-semibold text-[#1E1035] outline-hidden cursor-pointer"
            >
              <option value="all">All Sources</option>
              <option value="homepage_banner">Homepage Banner</option>
              <option value="tool_view">Tool Page</option>
              <option value="footer">Footer</option>
              <option value="admin_manual">Admin Manual</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        {filteredSubscribers.length === 0 ? (
          <div className="p-12 text-center text-[#6D6582] space-y-2">
            <Mail className="w-8 h-8 text-[#DDD6FE] mx-auto mb-2" />
            <p className="font-heading font-semibold text-sm text-[#1E1035]">No subscribers found</p>
            <p className="text-xs">No email records match the selected filters or search keyword.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAF9FE] text-[#6D6582] border-b border-[#EDE9FE] font-heading uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3">Subscriber Email</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Source</th>
                  <th className="px-5 py-3">Subscribed On</th>
                  <th className="px-5 py-3">Notifs Sent</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE9FE] font-sans">
                {filteredSubscribers.map((sub) => {
                  const subDate = new Date(sub.subscribedAt);
                  const isAct = sub.status === 'active';

                  return (
                    <tr key={sub.id} className="hover:bg-[#FAF9FE] transition-colors">
                      {/* Email */}
                      <td className="px-5 py-3.5 font-medium text-[#1E1035]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center shrink-0 font-bold uppercase text-[11px]">
                            {sub.email.charAt(0)}
                          </div>
                          <div>
                            <span className="font-mono text-xs font-semibold">{sub.email}</span>
                            {sub.lastNotificationDate && (
                              <span className="text-[10px] text-[#9D95B3] block">
                                Last alerted: {new Date(sub.lastNotificationDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-heading font-semibold border ${
                            isAct
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isAct ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                          />
                          <span>{isAct ? 'Active' : 'Unsubscribed'}</span>
                        </span>
                      </td>

                      {/* Source */}
                      <td className="px-5 py-3.5 text-[#6D6582]">
                        <span className="bg-[#F5F3FF] text-[#7C3AED] px-2 py-0.5 rounded-md border border-[#DDD6FE] font-mono text-[11px]">
                          {sub.source.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Subscribed On */}
                      <td className="px-5 py-3.5 text-[#6D6582] font-mono">
                        {subDate.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      {/* Notifs Sent */}
                      <td className="px-5 py-3.5 font-mono font-bold text-[#1E1035]">
                        {sub.notificationsSent || 0}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(sub.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-heading font-semibold border transition-colors cursor-pointer ${
                            isAct
                              ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                          }`}
                        >
                          {isAct ? 'Deactivate' : 'Reactivate'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(sub.id, sub.email)}
                          className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                          title="Delete subscriber permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Broadcast History & Activity Log */}
      {broadcastHistory.length > 0 && (
        <div className="bg-white border border-[#EDE9FE] rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#EDE9FE]">
            <h3 className="text-sm font-heading font-bold text-[#1E1035] flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#7C3AED]" />
              Recent Broadcast Dispatches
            </h3>
            <span className="text-xs text-[#6D6582]">{broadcastHistory.length} recorded</span>
          </div>

          <div className="space-y-2.5">
            {broadcastHistory.slice(0, 5).map((b, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-[#1E1035]">{b.subject}</span>
                    <span className="text-[10px] text-[#7C3AED] bg-white px-2 py-0.5 rounded border border-[#DDD6FE]">
                      Tool: {b.toolName}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6D6582] mt-0.5 line-clamp-1">{b.message}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-[11px] text-[#6D6582] font-mono">
                  <span className="text-emerald-600 font-semibold">
                    ✓ Sent to {b.recipientCount} subscribers
                  </span>
                  <span>{new Date(b.sentAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Broadcast Notification Modal */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E1035]/50 backdrop-blur-xs font-sans animate-in fade-in">
          <div className="bg-white border border-[#DDD6FE] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDE9FE]">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-[#7C3AED]" />
                <h3 className="font-heading font-bold text-base text-[#1E1035]">
                  Dispatch Tool Notification Alert
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBroadcastModalOpen(false)}
                className="p-1 rounded-lg text-[#6D6582] hover:bg-[#F5F3FF] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-heading font-semibold text-[#1E1035] mb-1">
                  Target Tool / Calculator Name
                </label>
                <input
                  type="text"
                  value={broadcastTool}
                  onChange={(e) => setBroadcastTool(e.target.value)}
                  placeholder="e.g. Compound Interest Calculator"
                  required
                  className="w-full px-3 py-2 bg-white border border-[#DDD6FE] focus:border-[#7C3AED] rounded-xl font-sans text-xs outline-hidden"
                />
              </div>

              <div>
                <label className="block font-heading font-semibold text-[#1E1035] mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={broadcastSubject}
                  onChange={(e) => setBroadcastSubject(e.target.value)}
                  placeholder="e.g. New Tool Alert: Compound Interest Calculator is Live!"
                  required
                  className="w-full px-3 py-2 bg-white border border-[#DDD6FE] focus:border-[#7C3AED] rounded-xl font-sans text-xs outline-hidden"
                />
              </div>

              <div>
                <label className="block font-heading font-semibold text-[#1E1035] mb-1">
                  Message / Update Summary
                </label>
                <textarea
                  rows={3}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Explain what is new or how users can leverage this calculator..."
                  className="w-full px-3 py-2 bg-white border border-[#DDD6FE] focus:border-[#7C3AED] rounded-xl font-sans text-xs outline-hidden resize-none"
                />
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] leading-relaxed flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  This alert will be logged and dispatched to all <strong>{activeCount} active email subscribers</strong> in the database.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBroadcastModalOpen(false)}
                  className="px-4 py-2 bg-white border border-[#EDE9FE] rounded-xl font-heading font-semibold text-[#6D6582] hover:bg-[#FAF9FE]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl font-heading font-bold shadow-2xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Notification</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subscriber Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E1035]/50 backdrop-blur-xs font-sans animate-in fade-in">
          <div className="bg-white border border-[#DDD6FE] rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDE9FE]">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#7C3AED]" />
                <h3 className="font-heading font-bold text-sm text-[#1E1035]">
                  Add Manual Subscriber
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-[#6D6582] hover:bg-[#F5F3FF] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubscriber} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-heading font-semibold text-[#1E1035] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="subscriber@example.com"
                  required
                  className="w-full px-3 py-2 bg-white border border-[#DDD6FE] focus:border-[#7C3AED] rounded-xl font-sans text-xs outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 bg-white border border-[#EDE9FE] rounded-xl font-heading font-semibold text-[#6D6582]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl font-heading font-bold shadow-2xs"
                >
                  Add Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
