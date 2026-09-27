import { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  X,
  MessageCircle,
  Twitter,
  Linkedin,
  Facebook,
  Send,
  ExternalLink,
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url?: string;
  description?: string;
}

export function ShareModal({ isOpen, onClose, title, url, description }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareText = description || `Check out this free tool: ${title}`;

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const shareChannels = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      bg: 'bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20',
      action: () => {
        window.open(
          `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} - ${shareUrl}`)}`,
          '_blank'
        );
      },
    },
    {
      name: 'Twitter / X',
      icon: Twitter,
      bg: 'bg-[#1DA1F2]/10 text-[#1DA1F2] hover:bg-[#1DA1F2]/20',
      action: () => {
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`,
          '_blank'
        );
      },
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      bg: 'bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2]/20',
      action: () => {
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
          '_blank'
        );
      },
    },
    {
      name: 'Facebook',
      icon: Facebook,
      bg: 'bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20',
      action: () => {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
          '_blank'
        );
      },
    },
    {
      name: 'Telegram',
      icon: Send,
      bg: 'bg-[#229ED9]/10 text-[#229ED9] hover:bg-[#229ED9]/20',
      action: () => {
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`,
          '_blank'
        );
      },
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200 font-sans"
    >
      <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EDE9FE]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center border border-[#DDD6FE]">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-[#1E1035]">Share This Tool</h3>
              <p className="text-[11px] text-[#6D6582] truncate max-w-[200px]">{title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#6D6582] hover:text-[#1E1035] hover:bg-[#FAF9FE] cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Share Channels */}
        <div className="grid grid-cols-5 gap-2">
          {shareChannels.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.name}
                type="button"
                onClick={c.action}
                className="flex flex-col items-center gap-1 p-2 rounded-xl border border-[#EDE9FE] hover:border-[#DDD6FE] transition-all cursor-pointer group"
                title={`Share on ${c.name}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${c.bg}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-medium text-[#6D6582] truncate max-w-full">
                  {c.name.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Copy Link Input Bar */}
        <div className="space-y-1.5 pt-1">
          <label className="text-[11px] font-heading font-semibold text-[#1E1035] block">
            Or Copy Link:
          </label>
          <div className="flex items-center gap-1.5 p-1.5 bg-[#FAF9FE] border border-[#DDD6FE] rounded-xl">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="bg-transparent text-xs text-[#1E1035] px-2 w-full outline-none font-mono truncate"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold rounded-lg transition-all shadow-xs shrink-0 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Universal Share Button component
 */
export function ShareButton({
  title,
  url,
  description,
  variant = 'compact',
}: {
  title: string;
  url?: string;
  description?: string;
  variant?: 'compact' | 'pill' | 'button';
}) {
  const [modalOpen, setModalOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if navigator.share is supported on mobile
    if (typeof navigator !== 'undefined' && navigator.share && window.innerWidth < 768) {
      navigator
        .share({
          title,
          text: description,
          url: url || window.location.href,
        })
        .catch(() => {
          setModalOpen(true);
        });
    } else {
      setModalOpen(true);
    }
  };

  return (
    <>
      {variant === 'compact' && (
        <button
          type="button"
          onClick={handleClick}
          className="p-1.5 rounded-lg text-[#6D6582] hover:text-[#7C3AED] hover:bg-[#F5F3FF] transition-colors cursor-pointer"
          title="Share tool"
          aria-label={`Share ${title}`}
        >
          <Share2 className="w-4 h-4" />
        </button>
      )}

      {variant === 'pill' && (
        <button
          type="button"
          onClick={handleClick}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-medium text-[#6D6582] bg-white border border-[#EDE9FE] hover:border-[#DDD6FE] hover:text-[#7C3AED] hover:bg-[#F5F3FF] shadow-2xs transition-all cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5 text-[#7C3AED]" />
          <span>Share</span>
        </button>
      )}

      {variant === 'button' && (
        <button
          type="button"
          onClick={handleClick}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-heading font-semibold text-[#1E1035] bg-white border border-[#DDD6FE] hover:border-[#7C3AED] hover:text-[#7C3AED] hover:bg-[#F5F3FF] shadow-2xs transition-all cursor-pointer"
        >
          <Share2 className="w-4 h-4 text-[#7C3AED]" />
          <span>Share Tool</span>
        </button>
      )}

      <ShareModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={title}
        url={url}
        description={description}
      />
    </>
  );
}
