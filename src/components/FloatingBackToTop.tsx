import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export function FloatingBackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

      if (scrollHeight > 0) {
        const progress = Math.min(100, Math.max(0, Math.round((scrollY / scrollHeight) * 100)));
        setScrollProgress(progress);
      }

      // Show button after scrolling down 280px
      if (scrollY > 280) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="animate-bounce hover:animate-none transition-all duration-300">
        <button
          type="button"
          id="floating-back-to-top"
          onClick={scrollToTop}
          className="group relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#9333EA] hover:from-[#6D28D9] hover:to-[#7C3AED] text-white shadow-[0_6px_25px_rgba(124,58,237,0.4)] hover:shadow-[0_8px_30px_rgba(124,58,237,0.55)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer ring-4 ring-[#7C3AED]/20 hover:ring-[#7C3AED]/35"
          aria-label="Back to top of page"
        >
          {/* Circular Progress Ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-0.5">
            <circle
              cx="50%"
              cy="50%"
              r="42%"
              className="stroke-white/20"
              strokeWidth="2.5"
              fill="none"
            />
            <circle
              cx="50%"
              cy="50%"
              r="42%"
              className="stroke-white"
              strokeWidth="2.5"
              strokeDasharray="100"
              strokeDashoffset={100 - scrollProgress}
              strokeLinecap="round"
              fill="none"
              style={{ transition: 'stroke-dashoffset 0.15s ease' }}
            />
          </svg>

          <ArrowUp className="w-5 h-5 transition-transform group-hover:-translate-y-0.5 duration-200" />

          {/* Hover Tooltip */}
          <span className="absolute bottom-full right-0 mb-2 px-2.5 py-1 text-[11px] font-heading font-medium text-white bg-[#1E1035] rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Back to Top ({scrollProgress}%)
          </span>
        </button>
      </div>
    </div>
  );
}
