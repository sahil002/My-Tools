import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Star,
  Send,
  CheckCircle2,
  Clock,
  ShieldCheck,
  CornerDownRight,
  AlertCircle,
} from 'lucide-react';
import {
  ToolComment,
  getApprovedCommentsForTool,
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
  const [submissionNotice, setSubmissionNotice] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [myPendingComments, setMyPendingComments] = useState<ToolComment[]>([]);

  // Load approved comments
  const loadComments = () => {
    const list = getApprovedCommentsForTool(toolSlug);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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

    setIsSubmitting(true);
    setSubmissionNotice(null);

    try {
      const newComment = addComment({
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

      if (newComment.status === 'approved') {
        setSubmissionNotice({
          type: 'success',
          message: 'Thank you! Your comment has been published.',
        });
      } else {
        // Stored as pending
        setMyPendingComments((prev) => [newComment, ...prev]);
        setSubmissionNotice({
          type: 'success',
          message: 'Thank you! Your comment has been submitted and is awaiting admin moderation before appearing publicly.',
        });
      }
    } catch {
      setSubmissionNotice({
        type: 'error',
        message: 'An unexpected error occurred. Please try submitting again.',
      });
    } finally {
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

  const totalDisplayCount = comments.length + myPendingComments.length;

  return (
    <section
      id="tool-comments-section"
      className="mt-12 pt-8 border-t border-[#E4E8EF] dark:border-[#1B233A] font-sans"
      aria-labelledby="comments-heading"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2
              id="comments-heading"
              className="text-xl font-heading font-extrabold text-[#131A2B] dark:text-[#FFFFFF] tracking-tight"
            >
              User Feedback &amp; Discussion
            </h2>
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-heading font-semibold rounded-full bg-[#F4F6F9] dark:bg-[#1B233A] text-[#5B6577] dark:text-[#9AA5B8] border border-[#E4E8EF] dark:border-[#1B233A]">
              {totalDisplayCount}
            </span>
          </div>
          <p className="text-xs text-[#5B6577] dark:text-[#9AA5B8] mt-1">
            Questions, improvement suggestions, or experience using {toolName}.
          </p>
        </div>

        <a
          href="#comment-form"
          className="inline-flex items-center gap-1.5 self-start sm:self-auto text-xs font-heading font-semibold text-[#2563EB] hover:underline"
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
      <div className="space-y-4 mb-10">
        {/* Locally pending comments submitted in this session */}
        {myPendingComments.map((comment) => (
          <div
            key={comment.id}
            className="bg-[#FFFFFF] dark:bg-[#1B233A] border border-[#F59E0B]/40 rounded-xl p-5 shadow-2xs transition-colors"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="font-heading font-semibold text-sm text-[#131A2B] dark:text-[#FFFFFF]">
                  {comment.authorName}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-heading font-medium text-[#F59E0B] bg-[#FFFBEB] px-2 py-0.5 rounded-full border border-[#F59E0B]/30">
                  <Clock className="w-3 h-3" />
                  <span>Awaiting Moderation</span>
                </span>
              </div>
              <span className="text-[11px] text-[#5B6577] dark:text-[#9AA5B8]">Just now</span>
            </div>

            {comment.rating && (
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${
                      s <= comment.rating!
                        ? 'text-[#F59E0B] fill-[#F59E0B]'
                        : 'text-[#E4E8EF] dark:text-[#5B6577]'
                    }`}
                  />
                ))}
              </div>
            )}

            <p className="text-sm text-[#131A2B] dark:text-[#FFFFFF] leading-relaxed whitespace-pre-wrap">
              {comment.commentText}
            </p>
          </div>
        ))}

        {/* Approved Published Comments */}
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="bg-[#FFFFFF] dark:bg-[#1B233A] border border-[#E4E8EF] dark:border-[#1B233A] rounded-xl p-5 shadow-2xs transition-colors"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="font-heading font-semibold text-sm text-[#131A2B] dark:text-[#FFFFFF]">
                  {comment.authorName}
                </span>
                {comment.rating && (
                  <div className="flex items-center gap-0.5 ml-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3 h-3 ${
                          s <= comment.rating!
                            ? 'text-[#F59E0B] fill-[#F59E0B]'
                            : 'text-[#E4E8EF] dark:text-[#5B6577]'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
              <time
                dateTime={comment.createdAt}
                className="text-[11px] text-[#5B6577] dark:text-[#9AA5B8]"
              >
                {formatDate(comment.createdAt)}
              </time>
            </div>

            <p className="text-sm text-[#131A2B] dark:text-[#FFFFFF] leading-relaxed whitespace-pre-wrap">
              {comment.commentText}
            </p>

            {/* Admin Reply */}
            {comment.reply && (
              <div className="mt-4 pt-3 border-t border-[#E4E8EF] dark:border-[#131A2B] ml-2 sm:ml-4 pl-3 sm:pl-4 border-l-2 border-l-[#2563EB]">
                <div className="flex items-center gap-2 mb-1.5">
                  <CornerDownRight className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span className="inline-flex items-center gap-1 text-[11px] font-heading font-semibold text-[#2563EB]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{comment.reply.author}</span>
                  </span>
                  <span className="text-[10px] text-[#5B6577] dark:text-[#9AA5B8]">
                    {formatDate(comment.reply.repliedAt)}
                  </span>
                </div>
                <p className="text-xs text-[#5B6577] dark:text-[#9AA5B8] leading-relaxed">
                  {comment.reply.text}
                </p>
              </div>
            )}
          </div>
        ))}

        {/* Empty State */}
        {comments.length === 0 && myPendingComments.length === 0 && (
          <div className="text-center py-10 px-4 bg-[#F4F6F9] dark:bg-[#131A2B] border border-dashed border-[#E4E8EF] dark:border-[#1B233A] rounded-xl">
            <MessageSquare className="w-8 h-8 text-[#9AA5B8] mx-auto mb-2 opacity-70" />
            <p className="text-sm font-heading font-semibold text-[#131A2B] dark:text-[#FFFFFF]">
              No comments posted yet
            </p>
            <p className="text-xs text-[#5B6577] dark:text-[#9AA5B8] mt-1 max-w-sm mx-auto">
              Be the first to share your experience, ask questions regarding calculations, or suggest an enhancement.
            </p>
          </div>
        )}
      </div>

      {/* Submission Form */}
      <div
        id="comment-form"
        className="bg-[#FFFFFF] dark:bg-[#1B233A] border border-[#E4E8EF] dark:border-[#1B233A] rounded-2xl p-5 sm:p-6 shadow-2xs"
      >
        <h3 className="text-base font-heading font-bold text-[#131A2B] dark:text-[#FFFFFF] mb-1">
          Leave a Comment or Question
        </h3>
        <p className="text-xs text-[#5B6577] dark:text-[#9AA5B8] mb-5">
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
                className="block text-xs font-heading font-semibold text-[#131A2B] dark:text-[#FFFFFF] mb-1.5"
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
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E4E8EF] dark:border-[#1B233A] bg-[#FFFFFF] dark:bg-[#131A2B] text-[#131A2B] dark:text-[#FFFFFF] placeholder-[#9AA5B8] focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            <div>
              <label
                htmlFor="comment-author-email"
                className="block text-xs font-heading font-semibold text-[#131A2B] dark:text-[#FFFFFF] mb-1.5"
              >
                Email Address <span className="text-[10px] font-normal text-[#5B6577] dark:text-[#9AA5B8]">(Optional, not published)</span>
              </label>
              <input
                id="comment-author-email"
                type="email"
                maxLength={100}
                placeholder="you@domain.com"
                value={authorEmail}
                onChange={(e) => setAuthorEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E4E8EF] dark:border-[#1B233A] bg-[#FFFFFF] dark:bg-[#131A2B] text-[#131A2B] dark:text-[#FFFFFF] placeholder-[#9AA5B8] focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          {/* Rating selector */}
          <div>
            <span className="block text-xs font-heading font-semibold text-[#131A2B] dark:text-[#FFFFFF] mb-1.5">
              Tool Rating <span className="text-[10px] font-normal text-[#5B6577] dark:text-[#9AA5B8]">(Optional)</span>
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
                    className="p-1 rounded-lg hover:bg-[#F4F6F9] dark:hover:bg-[#131A2B] text-[#F59E0B] transition-colors cursor-pointer"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        isFilled ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-[#E4E8EF] dark:text-[#5B6577]'
                      }`}
                    />
                  </button>
                );
              })}
              <span className="text-xs text-[#5B6577] dark:text-[#9AA5B8] ml-2 font-medium">
                {rating} of 5 Stars
              </span>
            </div>
          </div>

          {/* Comment body */}
          <div>
            <label
              htmlFor="comment-body-text"
              className="block text-xs font-heading font-semibold text-[#131A2B] dark:text-[#FFFFFF] mb-1.5"
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
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#E4E8EF] dark:border-[#1B233A] bg-[#FFFFFF] dark:bg-[#131A2B] text-[#131A2B] dark:text-[#FFFFFF] placeholder-[#9AA5B8] focus:outline-hidden focus:ring-2 focus:ring-[#2563EB] leading-relaxed resize-y"
            />
            <div className="flex justify-between items-center mt-1 text-[11px] text-[#5B6577] dark:text-[#9AA5B8]">
              <span>Respectful language only. No promotional links.</span>
              <span>{commentText.length}/1000</span>
            </div>
          </div>

          {/* Submit button */}
          <div className="pt-1 flex items-center justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-heading font-semibold rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-[#FFFFFF] shadow-2xs transition-colors disabled:opacity-60 cursor-pointer"
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
