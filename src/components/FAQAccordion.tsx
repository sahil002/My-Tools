import { useState } from 'react';
import { ChevronDown, HelpCircle, Sparkles, MessageCircleQuestion, ArrowRight } from 'lucide-react';
import { Link } from '../context/RouterContext';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
  title?: string;
  description?: string;
}

export function FAQAccordion({
  items,
  title = 'Frequently Asked Questions',
  description = 'Clear, verified answers to common questions regarding calculation formulas, privacy, and online tools.',
}: FAQAccordionProps) {
  const [openIndexes, setOpenIndexes] = useState<number[]>([0]);

  const toggleIndex = (index: number) => {
    setOpenIndexes((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  if (!items || items.length === 0) return null;

  return (
    <section id="faq-section" aria-labelledby="faq-heading" className="my-10 space-y-6">
      {/* Header with Distinctive Eyebrow Badge & Title */}
      <div className="text-left pb-2.5 border-b border-[#EDE9FE]">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-semibold text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] mb-2 shadow-2xs">
          <HelpCircle className="w-3.5 h-3.5 text-[#7C3AED]" />
          <span>Questions &amp; Answers</span>
        </div>
        <h2 id="faq-heading" className="text-xl sm:text-2xl font-heading font-bold text-[#1E1035] tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-xs sm:text-sm font-sans text-[#6D6582] max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Accordion Cards List */}
      <div className="space-y-3 font-sans">
        {items.map((item, index) => {
          const isOpen = openIndexes.includes(index);
          const answerId = `faq-answer-${index}`;
          const buttonId = `faq-btn-${index}`;

          return (
            <div
              key={index}
              className={`border rounded-2xl bg-[#FFFFFF] transition-all duration-200 overflow-hidden ${
                isOpen
                  ? 'border-[#DDD6FE] shadow-[0_4px_16px_rgba(124,58,237,0.06)] ring-1 ring-[#7C3AED]/25'
                  : 'border-[#EDE9FE] shadow-[0_2px_8px_rgba(124,58,237,0.02)] hover:border-[#DDD6FE]'
              }`}
            >
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={answerId}
                onClick={() => toggleIndex(index)}
                className="w-full text-left py-4 px-5 flex items-center justify-between gap-3 text-sm sm:text-base font-heading font-bold text-[#1E1035] hover:text-[#7C3AED] focus:outline-hidden cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold shrink-0 transition-colors ${
                    isOpen ? 'bg-[#7C3AED] text-white' : 'bg-[#F5F3FF] text-[#7C3AED]'
                  }`}>
                    Q{index + 1}
                  </span>
                  <span>{item.question}</span>
                </div>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  isOpen ? 'bg-[#F5F3FF] text-[#7C3AED]' : 'text-[#9D95B3]'
                }`}>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#7C3AED]' : ''
                    }`}
                    aria-hidden="true"
                  />
                </div>
              </button>
              {isOpen && (
                <div
                  id={answerId}
                  role="region"
                  aria-labelledby={buttonId}
                  className="px-5 pb-5 pt-1 text-xs sm:text-sm font-sans text-[#6D6582] leading-relaxed border-t border-[#F5F3FF]"
                >
                  <p className="m-0 pl-9">{item.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Helpful Support / Contact Banner */}
      <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#FAF5FF] via-[#FAF9FE] to-white border border-[#EDE9FE] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-left">
          <div className="w-10 h-10 rounded-xl bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center shrink-0 shadow-2xs">
            <MessageCircleQuestion className="w-5 h-5 text-[#7C3AED]" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-heading font-bold text-[#1E1035]">
              Still have questions or need a specific calculation?
            </h3>
            <p className="text-xs text-[#6D6582] font-sans">
              We update our algorithms frequently based on user requests and feedback.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/guides"
            className="px-3 py-1.5 rounded-xl text-xs font-heading font-semibold bg-white text-[#1E1035] border border-[#EDE9FE] hover:border-[#7C3AED] hover:text-[#7C3AED] transition-colors"
          >
            Explore Guides
          </Link>
          <Link
            href="/request-a-tool"
            className="px-3 py-1.5 rounded-xl text-xs font-heading font-bold bg-[#7C3AED] text-white hover:bg-[#6D28D9] transition-all shadow-xs flex items-center gap-1"
          >
            <span>Request Tool</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </section>
  );
}
