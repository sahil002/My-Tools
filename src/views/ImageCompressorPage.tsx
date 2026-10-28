import { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

/**
 * Image Compressor page uses the same content width and responsive gutters as
 * every other PRBSolver tool page. The tool itself remains isolated in an iframe.
 */
export function ImageCompressorPage() {
  const [iframeHeight, setIframeHeight] = useState(1900);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'OT_EMBED_RESIZE' || typeof event.data.height !== 'number') return;
      const nextHeight = Math.max(1200, Math.min(12000, Math.ceil(event.data.height)));
      setIframeHeight((current) => Math.abs(current - nextHeight) >= 8 ? nextHeight : current);
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9FE] text-[#1E1035] antialiased">
      <Header />
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <section
          id="interactive-tool-section"
          aria-label="Image Compressor workspace"
          className="w-full min-w-0 overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-[#DDD6FE] bg-white shadow-[0_16px_45px_-10px_rgba(124,58,237,0.12),0_4px_18px_rgba(30,16,53,0.06)]"
        >
          <iframe
            title="PRBSolver Image Compressor"
            src="/image-compressor/index.html?embed=true"
            className="block w-full min-w-0 border-0"
            style={{ height: `${iframeHeight}px` }}
            allow="clipboard-write"
            loading="eager"
          />
        </section>
      </main>
      <Footer />
    </div>
  );
}
