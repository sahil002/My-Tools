import { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Mail,
  User,
  Tag,
  StickyNote,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  ToolRequest,
  ToolRequestStatus,
  addToolRequestAdminNote,
  deleteToolRequestAdminNote,
  updateToolRequestStatus,
} from '../../services/toolRequestsService';

interface ToolRequestNotesModalProps {
  request: ToolRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  adminEmail?: string;
}

export function ToolRequestNotesModal({
  request,
  isOpen,
  onClose,
  onUpdated,
  adminEmail = 'Admin',
}: ToolRequestNotesModalProps) {
  const [newNoteText, setNewNoteText] = useState('');
  const [authorName, setAuthorName] = useState(adminEmail.split('@')[0] || 'Admin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<ToolRequestStatus>(
    request?.status || 'new'
  );

  if (!isOpen || !request) return null;

  const handleStatusChange = (status: ToolRequestStatus) => {
    setCurrentStatus(status);
    updateToolRequestStatus(request.id, status);
    onUpdated();
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    setIsSubmitting(true);
    try {
      addToolRequestAdminNote(request.id, newNoteText, authorName);
      setNewNoteText('');
      onUpdated();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = (noteId: string) => {
    deleteToolRequestAdminNote(request.id, noteId);
    onUpdated();
  };

  const statusOptions: { value: ToolRequestStatus; label: string; dotColor: string }[] = [
    { value: 'new', label: 'New / In Review', dotColor: 'bg-blue-500' },
    { value: 'in_progress', label: 'In Progress / Planned', dotColor: 'bg-amber-500' },
    { value: 'completed', label: 'Completed / Shipped', dotColor: 'bg-emerald-500' },
    { value: 'declined', label: 'Declined', dotColor: 'bg-slate-500' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6 overflow-y-auto">
      <div
        id="tool-request-modal-container"
        className="relative w-full max-w-2xl bg-[#FFFFFF] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl shadow-2xl overflow-hidden my-8"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 border-b border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#0B0F17]">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#E2E8F0] dark:bg-[#1E293B] text-[#475569] dark:text-[#94A3B8]">
                {request.id}
              </span>
              {request.category && (
                <span className="text-xs px-2 py-0.5 rounded-full border border-[#CBD5E1] dark:border-[#334155] text-[#475569] dark:text-[#94A3B8] flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {request.category}
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              {request.toolName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] hover:bg-[#E2E8F0] dark:hover:bg-[#1E293B] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6 max-h-[calc(85vh-140px)] overflow-y-auto">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-[#F8FAFC] dark:bg-[#0B0F17] border border-[#E2E8F0] dark:border-[#1E293B] text-xs">
            <div>
              <span className="text-[#64748B] dark:text-[#94A3B8] block mb-1 font-medium">Status</span>
              <div className="flex items-center gap-1.5">
                <select
                  value={currentStatus}
                  onChange={(e) => handleStatusChange(e.target.value as ToolRequestStatus)}
                  className="w-full bg-[#FFFFFF] dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#334155] rounded-md px-2.5 py-1.5 font-medium text-[#0F172A] dark:text-[#F8FAFC] text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <span className="text-[#64748B] dark:text-[#94A3B8] block mb-1 font-medium">Submitted Date</span>
              <div className="flex items-center gap-1.5 text-[#0F172A] dark:text-[#F8FAFC] py-1">
                <Calendar className="w-3.5 h-3.5 text-[#64748B]" />
                <span>
                  {new Date(request.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[#64748B] dark:text-[#94A3B8] block mb-1 font-medium">Requester</span>
              <div className="flex items-center gap-1.5 text-[#0F172A] dark:text-[#F8FAFC] py-1">
                <User className="w-3.5 h-3.5 text-[#64748B]" />
                <span className="truncate">{request.requesterName || 'Anonymous Visitor'}</span>
              </div>
            </div>

            <div>
              <span className="text-[#64748B] dark:text-[#94A3B8] block mb-1 font-medium">Requester Email</span>
              <div className="flex items-center gap-1.5 text-[#0F172A] dark:text-[#F8FAFC] py-1">
                <Mail className="w-3.5 h-3.5 text-[#64748B]" />
                {request.requesterEmail ? (
                  <a
                    href={`mailto:${request.requesterEmail}`}
                    className="text-[#2563EB] dark:text-[#60A5FA] hover:underline truncate"
                  >
                    {request.requesterEmail}
                  </a>
                ) : (
                  <span className="text-[#94A3B8]">Not provided</span>
                )}
              </div>
            </div>
          </div>

          {/* Description & Use Case */}
          <div className="space-y-3">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] mb-1.5">
                Tool Description & Requirements
              </h3>
              <div className="p-3.5 rounded-lg bg-[#F8FAFC] dark:bg-[#0B0F17] border border-[#E2E8F0] dark:border-[#1E293B] text-sm text-[#0F172A] dark:text-[#F8FAFC] leading-relaxed whitespace-pre-wrap">
                {request.description}
              </div>
            </div>

            {request.useCase && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] mb-1.5">
                  Workflow Use Case
                </h3>
                <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#0B0F17] border border-[#E2E8F0] dark:border-[#1E293B] text-xs text-[#475569] dark:text-[#CBD5E1] leading-relaxed">
                  {request.useCase}
                </div>
              </div>
            )}
          </div>

          {/* Internal Admin Notes Section */}
          <div className="border-t border-[#E2E8F0] dark:border-[#1E293B] pt-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  Internal Admin Notes
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#E2E8F0] dark:bg-[#1E293B] text-[#475569] dark:text-[#94A3B8] font-mono">
                  {request.adminNotes?.length || 0}
                </span>
              </div>
            </div>

            {/* Notes List */}
            {(!request.adminNotes || request.adminNotes.length === 0) ? (
              <div className="p-4 text-center rounded-lg border border-dashed border-[#CBD5E1] dark:border-[#334155] text-xs text-[#64748B] dark:text-[#94A3B8] my-3">
                No internal notes recorded yet. Add notes below to keep track of development status, sprint links, or duplicate requests.
              </div>
            ) : (
              <div className="space-y-2.5 my-3">
                {request.adminNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#0B0F17] border border-[#E2E8F0] dark:border-[#1E293B] flex items-start justify-between gap-3 group text-xs"
                  >
                    <div className="flex-1 space-y-1">
                      <p className="text-[#0F172A] dark:text-[#F8FAFC] text-xs leading-relaxed whitespace-pre-wrap">
                        {note.text}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                        <span className="font-semibold text-[#475569] dark:text-[#CBD5E1]">
                          {note.author}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(note.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[#64748B] hover:text-rose-600 dark:hover:text-rose-400 transition-opacity cursor-pointer rounded"
                      title="Delete note"
                      aria-label="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Note Form */}
            <form onSubmit={handleAddNote} className="mt-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#64748B] dark:text-[#94A3B8]">Posting as:</span>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="px-2 py-0.5 text-xs rounded bg-[#FFFFFF] dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#334155] text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  placeholder="Author name"
                />
              </div>
              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Write an internal admin note (e.g. implementation details, library recommendation, duplicate reference)..."
                rows={3}
                className="w-full text-xs p-3 rounded-lg bg-[#FFFFFF] dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#334155] text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !newNoteText.trim()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#2563EB] text-[#FFFFFF] text-xs font-semibold hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save Internal Note</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#0B0F17] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-[#64748B] dark:text-[#94A3B8]">
            {request.ipAddress && (
              <span>Client IP: <code className="font-mono text-[11px]">{request.ipAddress}</code></span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/admin/tools?createFromRequest=${encodeURIComponent(request.toolName)}&cat=${encodeURIComponent(request.category || '')}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#CBD5E1] dark:border-[#334155] text-[#0F172A] dark:text-[#F8FAFC] hover:bg-[#E2E8F0] dark:hover:bg-[#1E293B] transition-colors font-medium"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Create Tool in Directory</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-md bg-[#0F172A] dark:bg-[#F8FAFC] text-[#FFFFFF] dark:text-[#0F172A] hover:bg-[#1E293B] dark:hover:bg-[#E2E8F0] transition-colors font-medium cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
