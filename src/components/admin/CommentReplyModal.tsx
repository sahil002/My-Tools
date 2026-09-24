import React, { useState, useEffect } from 'react';
import { ToolComment } from '../../services/commentModerationService';
import { X, CornerDownRight, ShieldCheck, Send, Trash2 } from 'lucide-react';

interface CommentReplyModalProps {
  isOpen: boolean;
  comment: ToolComment | null;
  onClose: () => void;
  onSaveReply: (commentId: string, replyText: string, authorName: string) => void;
  onRemoveReply?: (commentId: string) => void;
}

export function CommentReplyModal({
  isOpen,
  comment,
  onClose,
  onSaveReply,
  onRemoveReply,
}: CommentReplyModalProps) {
  const [replyText, setReplyText] = useState('');
  const [authorName, setAuthorName] = useState('Admin Team');
  const [autoApprove, setAutoApprove] = useState(true);

  useEffect(() => {
    if (comment) {
      setReplyText(comment.reply?.text || '');
      setAuthorName(comment.reply?.author || 'Admin Team');
      setAutoApprove(comment.status === 'pending');
    } else {
      setReplyText('');
    }
  }, [comment]);

  if (!isOpen || !comment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onSaveReply(comment.id, replyText.trim(), authorName.trim() || 'Admin Team');
    onClose();
  };

  const handleRemove = () => {
    if (onRemoveReply && comment.reply) {
      onRemoveReply(comment.id);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reply-modal-title"
    >
      <div className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4E8EF] dark:border-[#1B233A]">
          <div className="flex items-center gap-2">
            <CornerDownRight className="w-4 h-4 text-[#2563EB] dark:text-[#2563EB]" />
            <h3
              id="reply-modal-title"
              className="text-sm font-bold text-[#131A2B] dark:text-[#F4F6F9]"
            >
              {comment.reply ? 'Edit Official Reply' : 'Reply to Comment'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-lg text-[#5B6577] hover:text-[#131A2B] dark:text-[#9AA5B8] dark:hover:text-[#F4F6F9] hover:bg-[#F4F6F9] dark:hover:bg-[#1B233A] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Original Comment Preview */}
        <div className="p-6 bg-[#F4F6F9] dark:bg-[#131A2B]/60 border-b border-[#E4E8EF] dark:border-[#1B233A]">
          <div className="flex items-center justify-between text-xs text-[#5B6577] dark:text-[#9AA5B8] mb-1.5">
            <span className="font-semibold text-[#131A2B] dark:text-[#F4F6F9]">
              {comment.authorName}
              {comment.authorEmail && (
                <span className="font-normal text-[#5B6577] dark:text-[#9AA5B8] ml-1">
                  ({comment.authorEmail})
                </span>
              )}
            </span>
            <span className="text-[11px] font-mono">{comment.toolName}</span>
          </div>
          <p className="text-xs text-[#1B233A] dark:text-[#E4E8EF] italic leading-relaxed line-clamp-4">
            &ldquo;{comment.commentText}&rdquo;
          </p>
        </div>

        {/* Reply Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label
              htmlFor="reply-author-input"
              className="block text-xs font-semibold text-[#131A2B] dark:text-[#F4F6F9] mb-1"
            >
              Responding As
            </label>
            <div className="relative">
              <input
                id="reply-author-input"
                type="text"
                required
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="e.g. Admin Team, Technical Support"
                className="w-full px-3 py-2 pl-9 text-xs rounded-lg border border-[#E4E8EF] dark:border-[#1B233A] bg-[#FFFFFF] dark:bg-[#131A2B] text-[#131A2B] dark:text-[#F4F6F9] focus:outline-none focus:ring-1 focus:ring-[#2563EB] dark:focus:ring-[#2563EB]"
              />
              <ShieldCheck className="w-4 h-4 text-[#2563EB] dark:text-[#2563EB] absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label
              htmlFor="reply-text-input"
              className="block text-xs font-semibold text-[#131A2B] dark:text-[#F4F6F9] mb-1"
            >
              Reply Message <span className="text-[#DC2626]">*</span>
            </label>
            <textarea
              id="reply-text-input"
              required
              rows={4}
              maxLength={800}
              placeholder="Write a clear, helpful response explaining how the tool works or answering the user's inquiry..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E4E8EF] dark:border-[#1B233A] bg-[#FFFFFF] dark:bg-[#131A2B] text-[#131A2B] dark:text-[#F4F6F9] placeholder-[#9AA5B8] focus:outline-none focus:ring-1 focus:ring-[#2563EB] dark:focus:ring-[#2563EB] leading-relaxed resize-y"
            />
            <div className="flex justify-between items-center text-[10px] text-[#5B6577] dark:text-[#9AA5B8] mt-1">
              <span>This reply will be published directly under the user's comment.</span>
              <span>{replyText.length}/800</span>
            </div>
          </div>

          {comment.status === 'pending' && (
            <label className="flex items-center gap-2 text-xs text-[#131A2B] dark:text-[#F4F6F9] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoApprove}
                onChange={(e) => setAutoApprove(e.target.checked)}
                className="w-4 h-4 rounded border-[#E4E8EF] dark:border-[#1B233A] text-[#2563EB] focus:ring-[#2563EB]"
              />
              <span>Automatically approve this comment upon sending reply</span>
            </label>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between border-t border-[#E4E8EF] dark:border-[#1B233A]">
            {comment.reply && onRemoveReply ? (
              <button
                type="button"
                onClick={handleRemove}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#DC2626] dark:text-[#DC2626] hover:bg-[#FEF2F2] dark:hover:bg-rose-950/40 rounded-lg cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Reply</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-[#E4E8EF] dark:border-[#1B233A] text-[#5B6577] dark:text-[#9AA5B8] hover:bg-[#F4F6F9] dark:hover:bg-[#1B233A] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!replyText.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-[#FFFFFF] shadow-2xs transition-colors disabled:opacity-60 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{comment.reply ? 'Update Reply' : 'Post Reply'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
