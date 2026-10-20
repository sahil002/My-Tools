import { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Star,
  Send,
  CheckCircle2,
  ShieldCheck,
  CornerDownRight,
  AlertCircle,
} from 'lucide-react';
import {
  ToolComment,
  fetchApprovedCommentsForTool,
  addComment,
  COMMENTS_CHANGED_EVENT,
} from '../../services/commentModerationService';

interface ToolCommentsSectionProps {
  toolSlug: string;
  toolName: string;
}

export function ToolCommentsSection({ toolSlug, toolName }: ToolCommentsSectionProps) {
  const [comments, setComments] = useState<ToolComment[]>([]);
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [commentText, setCommentText] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Synchronous guard prevents rapid taps/Enter presses from creating duplicate submissions.
  const submitLock = useRef(false);
  const [submissionNotice, setSubmissionNotice] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Load approved comments
  const loadComments = async () => {
    // Clear immediately while checking the database; only server-approved rows are public.
    setComments([]);
    const list = await fetchApprovedCommentsForTool(toolSlug);
    setComments(list);
  };

  useEffect(() => {
    loadComments();

    const handleUpdate = () => {
      loadComments();
    };

    window.addEventListener(COMMENTS_CHANGED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(COMMENTS_CHANGED_EVENT, handleUpdate);
    };
  }, [toolSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLock.current || isSubmitting) return;

    // Bot honeypot prevention
    if (honeypot.trim()) {
      return;
    }

    if (!authorName.trim()) {
      setSubmissionNotice({
        type: 'error',
        message: 'Please provide your name to post a comment.',
      });
      return;
    }

    if (!commentText.trim() || commentText.trim().length < 5) {
      setSubmissionNotice({
        type: 'error',
        message: 'Please write a descriptive comment of at least 5 characters.',
      });
      return;
    }

    submitLock.current = true;
    setIsSubmitting(true);
    setSubmissionNotice(null);

    try {
      await addComment({
        toolSlug,
        toolName,
        authorName: authorName.trim(),
        authorEmail: authorEmail.trim() || undefined,
        commentText: commentText.trim(),
        rating: rating > 0 ? rating : undefined,
      });

      // Clear input fields
      setAuthorName('');
      setAuthorEmail('');
      setCommentText('');
      setRating(5);

      // All comments require admin approval. Pending comments are never rendered publicly.
      setSubmissionNotice({
        type: 'success',
        message: 'Thank you! Your comment has been submitted for review. It will appear here only after an administrator approves it.',
      });
    } catch {
      setSubmissionNotice({
        type: 'error',
        message: 'An unexpected error occurred. Please try submitting again.',
      });
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  };

  const totalDisplayCount = comments.length;

  return (
    <section
      id="tool-comments-section"
      className="mt-14 pt-9 border-t border-[#EDE9FE] font-sans"
      aria-labelledby="comments-heading"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2
              id="comments-heading"
              className="text-xl sm:text-2xl font-heading font-extrabold text-[#1E1035] tracking-tight"
            >
              User Feedback &amp; Discussion
            </h2>
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-heading font-semibold rounded-full bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]">
              {totalDisplayCount}
            </span>
          </div>
          <p className="text-xs text-[#6D6582] mt-1">
            Questions, improvement suggestions, or experience using {toolName}.
          </p>
        </div>

        <a
          href="#comment-form"
          className="inline-flex items-center gap-1.5 self-start sm:self-auto text-xs font-heading font-semibold text-[#7C3AED] hover:text-[#6D28D9] transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Write a Comment</span>
        </a>
      </div>

      {/* Submission Alert Notice */}
      {submissionNotice && (
        <div
          role="alert"
          className={`mb-6 p-4 rounded-xl text-xs flex items-start gap-3 border ${
            submissionNotice.type === 'success'
              ? 'bg-[#E9F8EF] text-[#16A34A] border-[#16A34A]/30'
              : 'bg-[#FEF2F2] text-[#DC2626] border-[#DC2626]/30'
          }`}
        >
          {submissionNotice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-heading font-semibold">
              {submissionNotice.type === 'success' ? 'Comment Recorded' : 'Action Required'}
            </p>
            <p className="mt-0.5 leading-relaxed">{submissionNotice.message}</p>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4 sm:space-y-5 mb-10">
        {/* Approved Published Comments */}
        {comments.map((comment) => (
          <article
            key={comment.id}
            className="group relative mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-[#E7E0F7] bg-white transition-all duration-200 hover:border-[#C4B5FD] hover:shadow-[0_8px_24px_rgba(76,29,149,0.08)]"
          >
            <div className="flex items-start gap-3.5 p-4 sm:p-5">
              <div
                aria-hidden="true"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-[#8B5CF6] via-[#7C3AED] to-[#4C1D95] text-sm font-extrabold uppercase text-white shadow-[0_0_0_1px_#DDD6FE]"
              >
                {(comment.authorName.trim().charAt(0) || 'U').toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="max-w-full break-words font-heading text-sm font-bold text-[#1E1035]">
                    {comment.authorName}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    <ShieldCheck className="h-3 w-3" /> Approved
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {comment.rating && (
                    <div className="inline-flex items-center gap-1 rounded-lg bg-[#FFFBEB] px-2 py-1" aria-label={`Rated ${comment.rating} out of 5`}>
                      <Star className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                      <span className="text-xs font-bold tabular-nums text-[#92400E]">{comment.rating}.0</span>
                      <span className="text-[10px] text-[#A16207]">/ 5</span>
                    </div>
                  )}
                  <time dateTime={comment.createdAt} className="text-[11px] text-[#8A829F]">
                    {formatDate(comment.createdAt)}
                  </time>
                </div>
                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#453B5C]">
                  {comment.commentText}
                </p>
                {comment.reply && (
                  <div className="mt-3 rounded-xl border-l-[3px] border-[#8B5CF6] bg-[#F8F6FF] px-3.5 py-3">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-[#6D28D9]">
                      <CornerDownRight className="h-3.5 w-3.5" />
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>{comment.reply.author}</span>
                      <span className="font-normal text-[#8A829F]">· {formatDate(comment.reply.repliedAt)}</span>
                    </div>
                    <p className="text-xs leading-5 text-[#5B5270]">{comment.reply.text}</p>
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}

        {/* Empty State */}
        {comments.length === 0 && (
          <div className="text-center py-10 px-4 bg-[#FAF9FE] border border-dashed border-[#EDE9FE] rounded-xl">
            <MessageSquare className="w-8 h-8 text-[#9D95B3] mx-auto mb-2 opacity-70" />
            <p className="text-sm font-heading font-semibold text-[#1E1035]">
              No comments posted yet
            </p>
            <p className="text-xs text-[#6D6582] mt-1 max-w-sm mx-auto">
              Be the first to share your experience, ask questions regarding calculations, or suggest an enhancement.
            </p>
          </div>
        )}
      </div>

      {/* Submission Form */}
      <div
        id="comment-form"
        className="bg-white border border-[#EDE9FE] rounded-2xl p-5 sm:p-6 shadow-2xs"
      >
        <h3 className="text-base font-heading font-bold text-[#1E1035] mb-1">
          Leave a Comment or Question
        </h3>
        <p className="text-xs text-[#6D6582] mb-5">
          All submissions are reviewed by our moderation team before appearing on this page.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Honeypot field for anti-spam bots */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="website-hp">Website</label>
            <input
              id="website-hp"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="comment-author-name"
                className="block text-xs font-heading font-semibold text-[#1E1035] mb-1.5"
              >
                Your Name <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="comment-author-name"
                type="text"
                required
                maxLength={60}
                placeholder="e.g. Alex Morgan"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-xl border border-[#E4DDF4] bg-white text-[#1E1035] placeholder-[#A29AB5] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#8B5CF6] transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="comment-author-email"
                className="block text-xs font-heading font-semibold text-[#1E1035] mb-1.5"
              >
                Email Address <span className="text-[10px] font-normal text-[#6D6582]">(Optional, not published)</span>
              </label>
              <input
                id="comment-author-email"
                type="email"
                maxLength={100}
                placeholder="you@domain.com"
                value={authorEmail}
                onChange={(e) => setAuthorEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#EDE9FE] bg-white text-[#1E1035] placeholder-[#9D95B3] focus:outline-hidden focus:ring-2 focus:ring-[#7C3AED]"
              />
            </div>
          </div>

          {/* Rating selector */}
          <div>
            <span className="block text-xs font-heading font-semibold text-[#1E1035] mb-1.5">
              Tool Rating <span className="text-[10px] font-normal text-[#6D6582]">(Optional)</span>
            </span>
            <div className="flex items-center gap-1" role="radiogroup" aria-label="Tool Rating">
              {[1, 2, 3, 4, 5].map((starVal) => {
                const activeVal = hoverRating !== null ? hoverRating : rating;
                const isFilled = starVal <= activeVal;
                return (
                  <button
                    key={starVal}
                    type="button"
                    role="radio"
                    aria-checked={rating === starVal}
                    aria-label={`${starVal} Star${starVal > 1 ? 's' : ''}`}
                    onClick={() => setRating(starVal)}
                    onMouseEnter={() => setHoverRating(starVal)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 rounded-lg hover:bg-[#F5F3FF] text-[#F59E0B] transition-colors cursor-pointer"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        isFilled ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-[#EDE9FE]'
                      }`}
                    />
                  </button>
                );
              })}
              <span className="text-xs text-[#6D6582] ml-2 font-medium">
                {rating} of 5 Stars
              </span>
            </div>
          </div>

          {/* Comment body */}
          <div>
            <label
              htmlFor="comment-body-text"
              className="block text-xs font-heading font-semibold text-[#1E1035] mb-1.5"
            >
              Your Comment or Question <span className="text-[#DC2626]">*</span>
            </label>
            <textarea
              id="comment-body-text"
              required
              rows={4}
              maxLength={1000}
              placeholder="Describe your question, share how this utility helped your workflow, or provide suggestions for improvement..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl border border-[#E4DDF4] bg-white text-[#1E1035] placeholder-[#A29AB5] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#8B5CF6] transition-colors leading-7 resize-y"
            />
            <div className="flex justify-between items-center mt-1 text-[11px] text-[#6D6582]">
              <span>Respectful language only. No promotional links.</span>
              <span>{commentText.length}/1000</span>
            </div>
          </div>

          {/* Submit button */}
          <div className="pt-1 flex items-center justify-end">
            <button
              type="submit"
              disabled={isSubmitting || submitLock.current}
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-heading font-bold rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-sm hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Comment for Review'}</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
