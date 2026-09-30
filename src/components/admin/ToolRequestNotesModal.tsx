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
    { value: 'new', label: 'New / In Review', dotColor: 'bg-purple-500' },
    { value: 'in_progress', label: 'In Progress / Planned', dotColor: 'bg-amber-500' },
    { value: 'completed', label: 'Completed / Shipped', dotColor: 'bg-emerald-500' },
    { value: 'declined', label: 'Declined', dotColor: 'bg-slate-400' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E1035]/50 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto font-sans"
    >
      <div
        id="tool-request-modal-container"
        className="relative w-full max-w-2xl bg-white border border-[#EDE9FE] rounded-2xl shadow-2xl overflow-hidden my-8"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 border-b border-[#EDE9FE] bg-[#FAF9FE]">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]">
                {request.id}
              </span>
              {request.category && (
                <span className="text-xs px-2.5 py-0.5 rounded-full border border-[#DDD6FE] bg-white text-[#7C3AED] font-heading font-semibold flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {request.category}
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-heading font-extrabold text-[#1E1035]">
              {request.toolName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6D6582] hover:text-[#1E1035] hover:bg-[#F5F3FF] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6 max-h-[calc(85vh-140px)] overflow-y-auto">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE] text-xs">
            <div>
              <span className="text-[#6D6582] block mb-1 font-heading font-semibold">Status</span>
              <div className="flex items-center gap-1.5">
                <select
                  value={currentStatus}
                  onChange={(e) => handleStatusChange(e.target.value as ToolRequestStatus)}
                  className="w-full bg-white border border-[#DDD6FE] focus:border-[#7C3AED] rounded-xl px-2.5 py-1.5 font-medium text-[#1E1035] text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
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
              <span className="text-[#6D6582] block mb-1 font-heading font-semibold">Submitted Date</span>
              <div className="flex items-center gap-1.5 text-[#1E1035] py-1">
                <Calendar className="w-3.5 h-3.5 text-[#7C3AED]" />
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
              <span className="text-[#6D6582] block mb-1 font-heading font-semibold">Requester</span>
              <div className="flex items-center gap-1.5 text-[#1E1035] py-1">
                <User className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span className="truncate">{request.requesterName || 'Anonymous Visitor'}</span>
              </div>
            </div>

            <div>
              <span className="text-[#6D6582] block mb-1 font-heading font-semibold">Requester Email</span>
              <div className="flex items-center gap-1.5 text-[#1E1035] py-1">
                <Mail className="w-3.5 h-3.5 text-[#7C3AED]" />
                {request.requesterEmail ? (
                  <a
                    href={`mailto:${request.requesterEmail}`}
                    className="text-[#7C3AED] hover:underline truncate"
                  >
                    {request.requesterEmail}
                  </a>
                ) : (
                  <span className="text-[#9D95B3]">Not provided</span>
                )}
              </div>
            </div>
          </div>

          {/* Description & Use Case */}
          <div className="space-y-3">
            <div>
              <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-[#6D6582] mb-1.5">
                Tool Description &amp; Requirements
              </h3>
              <div className="p-3.5 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE] text-xs text-[#1E1035] leading-relaxed whitespace-pre-wrap">
                {request.description}
              </div>
            </div>

            {request.useCase && (
              <div>
                <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-[#6D6582] mb-1.5">
                  Workflow Use Case
                </h3>
                <div className="p-3 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE] text-xs text-[#6D6582] leading-relaxed">
                  {request.useCase}
                </div>
              </div>
            )}
          </div>

          {/* Internal Admin Notes Section */}
          <div className="border-t border-[#EDE9FE] pt-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-[#7C3AED]" />
                <h3 className="text-sm font-heading font-bold text-[#1E1035]">
                  Internal Admin Notes
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] font-mono">
                  {request.adminNotes?.length || 0}
                </span>
              </div>
            </div>

            {/* Notes List */}
            {(!request.adminNotes || request.adminNotes.length === 0) ? (
              <div className="p-4 text-center rounded-xl border border-dashed border-[#DDD6FE] text-xs text-[#6D6582] my-3">
                No internal notes recorded yet. Add notes below to keep track of development status or library recommendations.
              </div>
            ) : (
              <div className="space-y-2.5 my-3">
                {request.adminNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE] flex items-start justify-between gap-3 group text-xs"
                  >
                    <div className="flex-1 space-y-1">
                      <p className="text-[#1E1035] text-xs leading-relaxed whitespace-pre-wrap">
                        {note.text}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-[#6D6582]">
                        <span className="font-semibold text-[#1E1035]">
                          {note.author}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#7C3AED]" />
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
                      className="opacity-0 group-hover:opacity-100 p-1 text-[#6D6582] hover:text-rose-600 transition-opacity cursor-pointer rounded"
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
                <span className="text-[#6D6582] font-medium">Posting as:</span>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-white border border-[#DDD6FE] focus:border-[#7C3AED] text-[#1E1035] outline-none"
                  placeholder="Author name"
                />
              </div>
              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Write an internal admin note..."
                rows={3}
                className="w-full text-xs p-3 rounded-xl bg-white border border-[#DDD6FE] focus:border-[#7C3AED] text-[#1E1035] placeholder-[#9D95B3] outline-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !newNoteText.trim()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#7C3AED] text-white text-xs font-heading font-semibold hover:bg-[#6D28D9] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save Internal Note</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#EDE9FE] bg-[#FAF9FE] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-[#6D6582]">
            {request.ipAddress && (
              <span>Client IP: <code className="font-mono text-[11px]">{request.ipAddress}</code></span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#7C3AED] text-white hover:bg-[#6D28D9] transition-colors font-heading font-semibold cursor-pointer shadow-xs"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
