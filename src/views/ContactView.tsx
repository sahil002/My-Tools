import React, { useState, useId } from 'react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { SEOHelmet } from '../components/SEOHelmet';
import { Link } from '../context/RouterContext';
import { Send, CheckCircle, AlertCircle, ArrowRight, Mail } from 'lucide-react';

export function ContactView() {
  const nameInputId = useId();
  const emailInputId = useId();
  const reasonInputId = useId();
  const messageInputId = useId();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('Suggest a New Tool');
  const [message, setMessage] = useState('');

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'unconfigured' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const contactEndpoint = import.meta.env.VITE_CONTACT_FORM_ENDPOINT;
  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Client-side validation
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please provide a valid email address so we can reply.');
      return;
    }

    const trimmedMessage = message.trim();
    if (!trimmedMessage || trimmedMessage.length < 10) {
      setErrorMessage('Please include a message of at least 10 characters.');
      return;
    }

    // Check if a real backend submission provider is configured
    if (!contactEndpoint) {
      // Do NOT display a fake success screen.
      // Transparently inform the user of the unconfigured state.
      setStatus('unconfigured');
      return;
    }

    setIsSubmittingTrue();
    try {
      const response = await fetch(contactEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: trimmedEmail,
          reason,
          message: trimmedMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('Unable to send message. Please try again later.');
      }

      setStatus('success');
    } catch (err: unknown) {
      setStatus('error');
      setErrorMessage(
        err instanceof Error ? err.message : 'An unexpected error occurred while transmitting your message.'
      );
    }
  };

  const setIsSubmittingTrue = () => {
    setStatus('submitting');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-7">
      <SEOHelmet
        title="Contact Us – Online Tools"
        description="Have feedback, found a calculation issue, or want to suggest a useful tool? Send us a message."
        canonicalPath="/contact"
      />

      {/* 1. Breadcrumb: Home → Contact */}
      <Breadcrumbs items={[{ label: 'Contact', path: '/contact' }]} />

      {/* 2. Header */}
      <header className="border-b border-[#EDE9FE] pb-5">
        <h1 className="text-xl sm:text-2xl font-heading font-bold text-[#1E1035] tracking-tight">
          Contact Us
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm font-sans text-[#6D6582] leading-relaxed">
          Have feedback, found a calculation issue, or want to suggest a useful tool? Send us a message.
        </p>
      </header>

      {/* 3. Form States & Implementation */}
      {status === 'success' ? (
        <div className="bg-[#FFFFFF] border border-[#16A34A]/30 rounded-2xl p-6 sm:p-8 text-center space-y-3 shadow-2xs">
          <div className="w-11 h-11 rounded-full bg-[#E9F8EF] text-[#16A34A] flex items-center justify-center mx-auto border border-[#16A34A]/20">
            <CheckCircle className="w-5 h-5" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-heading font-bold text-[#1E1035]">Message Sent</h2>
          <p className="text-xs sm:text-sm font-sans text-[#6D6582] max-w-md mx-auto">
            Thank you for reaching out. We review submitted feedback and tool suggestions regularly.
          </p>
          <button
            type="button"
            onClick={() => {
              setStatus('idle');
              setMessage('');
            }}
            className="mt-3 px-4 py-2 bg-[#7C3AED] text-[#FFFFFF] rounded-xl text-xs font-heading font-semibold hover:bg-[#6D28D9] transition-colors cursor-pointer shadow-2xs"
          >
            Send another message
          </button>
        </div>
      ) : status === 'unconfigured' ? (
        <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-5 sm:p-7 space-y-3.5 shadow-2xs">
          <div className="flex items-start gap-3 text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
            <AlertCircle className="w-4.5 h-4.5 shrink-0 text-amber-600 mt-0.5" aria-hidden="true" />
            <div className="text-xs sm:text-sm space-y-1">
              <p className="font-heading font-semibold text-amber-900">Direct Form Dispatch Not Configured</p>
              <p className="text-amber-800 font-sans leading-relaxed text-xs">
                A server-side submission endpoint is not currently configured in this environment. Your message was not transmitted to prevent simulated data loss.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-[#FAF9FE] border border-[#EDE9FE] rounded-xl text-xs text-[#6D6582] space-y-1.5 font-sans">
            <p className="font-heading font-semibold text-[#1E1035]">What you can do:</p>
            {contactEmail ? (
              <p>
                You can send this message directly via your email client to:{' '}
                <a
                  href={`mailto:${contactEmail}?subject=${encodeURIComponent(`[${reason}] Inquiry from ${name || 'User'}`)}&body=${encodeURIComponent(message)}`}
                  className="font-heading font-semibold text-[#7C3AED] underline hover:text-[#6D28D9]"
                >
                  {contactEmail}
                </a>
              </p>
            ) : (
              <p>
                We review submitted feedback and tool suggestions regularly. If you are an administrator, set{' '}
                <code className="bg-[#FFFFFF] px-1.5 py-0.5 rounded border border-[#EDE9FE] text-[#1E1035] font-mono">VITE_CONTACT_FORM_ENDPOINT</code>{' '}
                to connect an automated submission provider.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setStatus('idle')}
              className="px-4 py-2 bg-[#7C3AED] text-[#FFFFFF] rounded-xl text-xs font-heading font-semibold hover:bg-[#6D28D9] transition-colors cursor-pointer shadow-2xs"
            >
              Back to Form
            </button>
            {contactEmail && (
              <a
                href={`mailto:${contactEmail}?subject=${encodeURIComponent(`[${reason}] Inquiry`)}&body=${encodeURIComponent(message)}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#FFFFFF] border border-[#EDE9FE] text-[#1E1035] rounded-xl text-xs font-heading font-semibold hover:bg-[#FAF9FE] transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>Open in Email Client</span>
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-5 sm:p-7 shadow-2xs">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Error banner if validation fails */}
            {errorMessage && (
              <div
                role="alert"
                className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" aria-hidden="true" />
                <span className="font-sans">{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Name field */}
              <div>
                <label
                  htmlFor={nameInputId}
                  className="block text-xs font-heading font-semibold text-[#1E1035] uppercase tracking-wider mb-1"
                >
                  Name
                </label>
                <input
                  id={nameInputId}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-[#FFFFFF] border border-[#EDE9FE] rounded-xl px-3 py-2 text-sm text-[#1E1035] placeholder-[#9D95B3] focus:outline-hidden focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all font-sans"
                />
              </div>

              {/* Email field */}
              <div>
                <label
                  htmlFor={emailInputId}
                  className="block text-xs font-heading font-semibold text-[#1E1035] uppercase tracking-wider mb-1"
                >
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id={emailInputId}
                  type="email"
                  required
                  aria-required="true"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-[#FFFFFF] border border-[#EDE9FE] rounded-xl px-3 py-2 text-sm text-[#1E1035] placeholder-[#9D95B3] focus:outline-hidden focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all font-sans"
                />
              </div>
            </div>

            {/* Reason for contact */}
            <div>
              <label
                htmlFor={reasonInputId}
                className="block text-xs font-heading font-semibold text-[#1E1035] uppercase tracking-wider mb-1"
              >
                Reason <span className="text-red-500">*</span>
              </label>
              <select
                id={reasonInputId}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-[#FFFFFF] border border-[#EDE9FE] rounded-xl px-3 py-2 text-sm text-[#1E1035] font-sans font-medium focus:outline-hidden focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all cursor-pointer"
              >
                <option value="Suggest a New Tool">Suggest a New Tool</option>
                <option value="Report a Calculation or Formula Error">Report a Calculation or Formula Error</option>
                <option value="General Feedback">General Feedback</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Message field */}
            <div>
              <label
                htmlFor={messageInputId}
                className="block text-xs font-heading font-semibold text-[#1E1035] uppercase tracking-wider mb-1"
              >
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                id={messageInputId}
                required
                aria-required="true"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your feedback, formula issue, or tool suggestion in detail..."
                className="w-full bg-[#FFFFFF] border border-[#EDE9FE] rounded-xl p-3 text-sm text-[#1E1035] placeholder-[#9D95B3] focus:outline-hidden focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 resize-y leading-relaxed transition-all font-sans"
              />
            </div>

            {/* Privacy Notice */}
            <p className="text-xs text-[#6D6582] leading-relaxed font-sans">
              Please avoid including sensitive personal, financial, or confidential information in your message. See our{' '}
              <Link href="/privacy-policy" className="text-[#7C3AED] hover:underline font-heading font-semibold">
                Privacy Policy
              </Link>{' '}
              for more information.
            </p>

            {/* Submit Button & Response Note */}
            <div className="pt-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#7C3AED] text-[#FFFFFF] rounded-xl text-xs font-heading font-semibold hover:bg-[#6D28D9] transition-colors cursor-pointer disabled:opacity-60 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{status === 'submitting' ? 'Sending...' : 'Send Message'}</span>
              </button>
              <span className="text-[11px] text-[#6D6582] font-sans">
                We review submitted feedback and tool suggestions regularly.
              </span>
            </div>
          </form>
        </div>
      )}

      {/* 8. Optional CTA */}
      <div className="p-3.5 bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl flex items-center justify-between text-xs text-[#6D6582] shadow-2xs">
        <span className="font-sans">Looking for a tool?</span>
        <Link
          href="/tools"
          className="inline-flex items-center gap-1 font-heading font-semibold text-[#7C3AED] hover:underline"
        >
          Browse All Tools
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
