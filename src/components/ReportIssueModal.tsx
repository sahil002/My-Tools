import { useState } from 'react';
import { AlertTriangle, X, CheckCircle2, Send, HelpCircle } from 'lucide-react';
import { submitToolIssue, ToolIssue } from '../services/toolIssuesService';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolSlug: string;
  toolName: string;
}

export function ReportIssueModal({ isOpen, onClose, toolSlug, toolName }: ReportIssueModalProps) {
  const [issueType, setIssueType] = useState<ToolIssue['issueType']>('calculation_incorrect');
  const [description, setDescription] = useState('');
  const [inputValues, setInputValues] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (description.trim().length < 10) {
      setErrorMessage('Please describe the issue in at least 10 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      submitToolIssue({
        toolSlug,
        toolName,
        issueType,
        description: description.trim(),
        inputValues: inputValues.trim() || undefined,
        expectedBehavior: expectedBehavior.trim() || undefined,
        userEmail: userEmail.trim() || undefined,
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setDescription('');
        setInputValues('');
        setExpectedBehavior('');
        setUserEmail('');
        onClose();
      }, 2000);
    } catch {
      setErrorMessage('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200 font-sans"
    >
      <div className="bg-white border border-[#EDE9FE] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EDE9FE]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-[#1E1035]">Report an Issue</h3>
              <p className="text-[11px] text-[#6D6582] truncate max-w-[240px]">{toolName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6D6582] hover:text-[#1E1035] hover:bg-[#FAF9FE] cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="text-center py-6 space-y-3 animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-heading font-bold text-base text-[#1E1035]">Thank You!</h4>
            <p className="text-xs text-[#6D6582] max-w-xs mx-auto">
              Your feedback has been sent to our engineering team. We will review and fix this promptly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="font-heading font-semibold text-[#1E1035] block mb-1">
                What went wrong?
              </label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#FAF9FE] border border-[#DDD6FE] focus:border-[#7C3AED] rounded-xl text-xs text-[#1E1035] outline-none"
              >
                <option value="calculation_incorrect">Calculation / Output Incorrect</option>
                <option value="button_not_working">Button or Input Not Responding</option>
                <option value="layout_broken">Display or Layout Broken on Screen</option>
                <option value="performance_slow">Slow Performance / Freezing</option>
                <option value="other">Other Issue or Suggestion</option>
              </select>
            </div>

            <div>
              <label className="font-heading font-semibold text-[#1E1035] block mb-1">
                Describe the problem *
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. When I entered $150 and 20%, the tax was calculated backwards..."
                className="w-full px-3 py-2 bg-[#FAF9FE] border border-[#DDD6FE] focus:border-[#7C3AED] rounded-xl text-xs text-[#1E1035] outline-none resize-none"
              />
            </div>

            <div>
              <label className="font-heading font-semibold text-[#1E1035] block mb-1">
                Your Email <span className="font-normal text-[#9D95B3]">(Optional, if you want an update)</span>
              </label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 bg-[#FAF9FE] border border-[#DDD6FE] focus:border-[#7C3AED] rounded-xl text-xs text-[#1E1035] outline-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-heading font-medium text-[#6D6582] hover:bg-[#FAF9FE] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-heading font-semibold text-xs rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Sending...' : 'Submit Report'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
