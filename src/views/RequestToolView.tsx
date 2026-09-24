import React, { useState, useId, useMemo } from 'react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { SEOHelmet } from '../components/SEOHelmet';
import { Link } from '../context/RouterContext';
import {
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  Wrench,
} from 'lucide-react';
import {
  submitToolRequest,
  getGroupedToolRequests,
  GroupedToolRequest,
  TOOL_REQUESTS_CHANGED_EVENT,
} from '../services/toolRequestsService';
import { CATEGORIES } from '../data/categories';

export function RequestToolView() {
  const toolNameId = useId();
  const categoryId = useId();
  const descriptionId = useId();
  const useCaseId = useId();
  const emailId = useId();
  const nameId = useId();
  const honeypotId = useId();

  const [toolName, setToolName] = useState('');
  const [category, setCategory] = useState('Calculators');
  const [description, setDescription] = useState('');
  const [useCase, setUseCase] = useState('');
  const [email, setEmail] = useState('');
  const [requesterName, setRequesterName] = useState('');
  const [honeypot, setHoneypot] = useState('');

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedRequestId, setSubmittedRequestId] = useState<string>('');

  // Grouped requests to show community trending requests
  const [groupedRequests, setGroupedRequests] = useState<GroupedToolRequest[]>(() =>
    getGroupedToolRequests()
  );

  const reloadTrending = () => {
    setGroupedRequests(getGroupedToolRequests());
  };

  React.useEffect(() => {
    window.addEventListener(TOOL_REQUESTS_CHANGED_EVENT, reloadTrending);
    return () => window.removeEventListener(TOOL_REQUESTS_CHANGED_EVENT, reloadTrending);
  }, []);

  const topDemanded = useMemo(() => {
    return [...groupedRequests]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [groupedRequests]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (honeypot) {
      return;
    }

    const trimmedName = toolName.trim();
    const trimmedDesc = description.trim();

    if (!trimmedName) {
      setErrorMessage('Please provide a name or title for the requested tool.');
      return;
    }

    if (trimmedDesc.length < 15) {
      setErrorMessage('Please provide a brief description of how the tool should calculate or behave (at least 15 characters).');
      return;
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setErrorMessage('Please provide a valid email address or leave the field blank.');
        return;
      }
    }

    setStatus('submitting');
    try {
      const created = submitToolRequest({
        toolName: trimmedName,
        category,
        description: trimmedDesc,
        useCase: useCase.trim() || undefined,
        requesterEmail: email.trim() || undefined,
        requesterName: requesterName.trim() || undefined,
      });

      setSubmittedRequestId(created.id);
      setStatus('success');
      setToolName('');
      setDescription('');
      setUseCase('');
      setEmail('');
      setRequesterName('');
    } catch {
      setErrorMessage('Failed to save tool request. Please try again.');
      setStatus('error');
    }
  };

  // Upvote / "+1 I Want This Too" quick handler
  const handleSupportExisting = (group: GroupedToolRequest) => {
    submitToolRequest({
      toolName: group.toolName,
      category: group.category || 'General Utility',
      description: `Community +1 request endorsement for ${group.toolName}.`,
      requesterEmail: undefined,
      requesterName: 'Community Endorsement',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
      <SEOHelmet
        title="Request a Tool – Online Calculators & Utilities Directory"
        description="Suggest a calculator, converter, or developer utility to our team. Community requests directly shape our roadmap."
        canonicalPath="/request-a-tool"
      />

      <Breadcrumbs
        items={[
          { label: 'Explore Tools', path: '/tools' },
          { label: 'Request a Tool', path: '/request-a-tool' },
        ]}
      />

      {/* Header */}
      <div className="border-b border-[#EDE9FE] pb-5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-heading font-semibold uppercase tracking-wider bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] mb-2 shadow-2xs">
          <Sparkles className="w-3 h-3" />
          <span>Feature &amp; Utility Requests</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-[#1E1035]">
          Request a New Tool
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm font-sans text-[#6D6582] max-w-2xl leading-relaxed">
          Need a specialized financial calculator, file converter, text transformation script, or developer utility? Describe what you are looking for. Our team builds and deploys high-priority community requests weekly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Main Request Form */}
        <div className="lg:col-span-8">
          <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-5 sm:p-7 shadow-[0_2px_14px_rgba(124,58,237,0.03)] font-sans">
            {status === 'success' ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center mx-auto border border-[#DDD6FE]">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-xl font-heading font-bold text-[#1E1035]">
                    Tool Request Submitted!
                  </h2>
                  <p className="text-xs sm:text-sm font-sans text-[#6D6582] mt-2 max-w-md mx-auto leading-relaxed">
                    Thank you for your suggestion. Your request has been queued in our engineering dashboard under reference{' '}
                    <code className="px-1.5 py-0.5 rounded bg-[#F5F3FF] border border-[#EDE9FE] font-mono text-[#7C3AED] text-xs">
                      {submittedRequestId || 'REQ-CONFIRMED'}
                    </code>.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE] text-xs text-[#6D6582] max-w-md mx-auto text-left space-y-1.5 font-sans">
                  <div className="font-heading font-semibold text-[#1E1035]">What happens next?</div>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Our team reviews utility feasibility and client-side privacy requirements.</li>
                    <li>If you provided an email, you will receive an update once published.</li>
                    <li>Duplicate requests from other users automatically increase build priority.</li>
                  </ul>
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => setStatus('idle')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7C3AED] text-white text-xs font-heading font-semibold hover:bg-[#6D28D9] transition-colors cursor-pointer shadow-2xs"
                  >
                    <span>Submit Another Request</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2 font-sans">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Honeypot for bot filtering */}
                <div className="hidden" aria-hidden="true">
                  <label htmlFor={honeypotId}>Do not fill this field</label>
                  <input
                    id={honeypotId}
                    type="text"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                {/* Tool Name */}
                <div>
                  <label
                    htmlFor={toolNameId}
                    className="block text-xs font-heading font-semibold text-[#1E1035] mb-1.5"
                  >
                    Requested Tool Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id={toolNameId}
                    type="text"
                    required
                    value={toolName}
                    onChange={(e) => setToolName(e.target.value)}
                    placeholder="e.g. SVG to PNG Converter, 401(k) Retirement Calculator"
                    className="w-full text-sm p-3 rounded-xl bg-[#FFFFFF] border border-[#DDD6FE] text-[#1E1035] placeholder-[#9D95B3] focus:outline-hidden focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] font-sans"
                  />
                </div>

                {/* Category Selection */}
                <div>
                  <label
                    htmlFor={categoryId}
                    className="block text-xs font-heading font-semibold text-[#1E1035] mb-1.5"
                  >
                    Target Category
                  </label>
                  <select
                    id={categoryId}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-sm p-3 rounded-xl bg-[#FFFFFF] border border-[#DDD6FE] text-[#1E1035] focus:outline-hidden focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] cursor-pointer font-sans"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                    <option value="Other / General Utility">Other / General Utility</option>
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor={descriptionId}
                    className="block text-xs font-heading font-semibold text-[#1E1035] mb-1.5"
                  >
                    How should this tool work? <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id={descriptionId}
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the calculations, inputs, and outputs you expect. For example: Allow pasting SVG vector code or uploading a .svg file and exporting crisp 2x/4x PNG files with transparent background."
                    className="w-full text-sm p-3 rounded-xl bg-[#FFFFFF] border border-[#DDD6FE] text-[#1E1035] placeholder-[#9D95B3] focus:outline-hidden focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] font-sans"
                  />
                </div>

                {/* Use Case (Optional) */}
                <div>
                  <label
                    htmlFor={useCaseId}
                    className="block text-xs font-heading font-semibold text-[#1E1035] mb-1.5"
                  >
                    Workflow Use Case <span className="text-[#9D95B3] font-normal">(Optional)</span>
                  </label>
                  <input
                    id={useCaseId}
                    type="text"
                    value={useCase}
                    onChange={(e) => setUseCase(e.target.value)}
                    placeholder="e.g. Exporting retina assets for mobile apps, comparing mortgage options"
                    className="w-full text-sm p-3 rounded-xl bg-[#FFFFFF] border border-[#DDD6FE] text-[#1E1035] placeholder-[#9D95B3] focus:outline-hidden focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] font-sans"
                  />
                </div>

                {/* Requester Contact Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#EDE9FE]">
                  <div>
                    <label
                      htmlFor={nameId}
                      className="block text-xs font-heading font-semibold text-[#1E1035] mb-1.5"
                    >
                      Your Name / Handle <span className="text-[#9D95B3] font-normal">(Optional)</span>
                    </label>
                    <input
                      id={nameId}
                      type="text"
                      value={requesterName}
                      onChange={(e) => setRequesterName(e.target.value)}
                      placeholder="e.g. Marcus"
                      className="w-full text-sm p-2.5 rounded-xl bg-[#FFFFFF] border border-[#DDD6FE] text-[#1E1035] placeholder-[#9D95B3] focus:outline-hidden focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] font-sans"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={emailId}
                      className="block text-xs font-heading font-semibold text-[#1E1035] mb-1.5"
                    >
                      Email Address <span className="text-[#9D95B3] font-normal">(Optional, for notification)</span>
                    </label>
                    <input
                      id={emailId}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.com"
                      className="w-full text-sm p-2.5 rounded-xl bg-[#FFFFFF] border border-[#DDD6FE] text-[#1E1035] placeholder-[#9D95B3] focus:outline-hidden focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] font-sans"
                    />
                  </div>
                </div>

                {/* Privacy Assurance & Submit Button */}
                <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-xs font-sans text-[#6D6582] text-center sm:text-left">
                    Your email is never sold or used for marketing. All tools run 100% client-side in the browser.
                  </p>

                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#7C3AED] text-white text-xs font-heading font-semibold hover:bg-[#6D28D9] transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Request</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Sidebar: Trending Community Requests */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-5 shadow-[0_2px_14px_rgba(124,58,237,0.03)] font-sans">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#7C3AED]" />
              <h2 className="text-sm font-heading font-bold text-[#1E1035]">
                Trending Community Requests
              </h2>
            </div>
            <p className="text-xs text-[#6D6582] mb-4 leading-relaxed font-sans">
              Already requested utilities currently prioritized by our engineering queue:
            </p>

            <div className="space-y-3">
              {topDemanded.map((group) => (
                <div
                  key={group.groupKey}
                  className="p-3 rounded-xl bg-white border border-[#EDE9FE] hover:border-[#DDD6FE] text-xs space-y-2 font-sans shadow-2xs transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-heading font-semibold text-[#1E1035]">
                      {group.toolName}
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#F5F3FF] text-[#7C3AED] font-mono text-[10px] shrink-0 font-bold border border-[#DDD6FE]">
                      {group.count} {group.count === 1 ? 'vote' : 'votes'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-[11px] pt-1">
                    <span className="text-[#6D6582]">
                      {group.category || 'General'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSupportExisting(group)}
                      className="inline-flex items-center gap-1 text-[#7C3AED] font-heading font-semibold hover:underline cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>I want this too</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-[#EDE9FE] text-center">
              <Link
                href="/tools"
                className="text-xs font-heading font-semibold text-[#7C3AED] hover:underline inline-flex items-center gap-1"
              >
                <span>Browse {CATEGORIES.length} Tool Categories</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Development Standards Note */}
          <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#EDE9FE] text-xs text-[#6D6582] space-y-2 font-sans shadow-[0_2px_14px_rgba(124,58,237,0.03)]">
            <div className="flex items-center gap-1.5 font-heading font-semibold text-[#1E1035]">
              <Wrench className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>Our Tool Criteria</span>
            </div>
            <p className="leading-relaxed text-[11px] font-sans">
              We specialize in zero-installation, private client-side utilities. We do not store sensitive calculations or execute high-risk server scraping bots.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
