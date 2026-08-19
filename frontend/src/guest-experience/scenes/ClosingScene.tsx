import React, { useState } from 'react';
import { RotateCcw, Share2, Check } from 'lucide-react';

interface ClosingSceneProps {
  title: string;
  onReplay: () => void;
}

export const ClosingScene: React.FC<ClosingSceneProps> = ({ title, onReplay }) => {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleShare = () => {
    try {
      if (navigator.share) {
        navigator.share({
          title: title || 'Celebration Invitation',
          text: `You are cordially invited to ${title || 'our celebration'}!`,
          url: window.location.href,
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch (e) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <section className="text-center space-y-4 pt-6 pb-12 font-sans">
      <p className="text-xs font-mono uppercase tracking-widest text-amber-300">
        WE LOOK FORWARD TO CELEBRATING WITH YOU
      </p>
      <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-white">
        {title || 'The Celebration'}
      </h3>

      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={onReplay}
          className="px-6 py-3 rounded-full bg-black/60 border border-amber-300/60 text-amber-200 font-serif font-bold text-xs flex items-center gap-2 shadow-lg backdrop-blur-xl hover:bg-black/80 transition-all active:scale-95"
        >
          <RotateCcw className="w-4 h-4 text-amber-400" />
          <span>Replay Invitation ↺</span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="px-6 py-3 rounded-full bg-amber-500 text-black font-serif font-extrabold text-xs flex items-center gap-2 shadow-lg hover:bg-amber-400 transition-all active:scale-95"
        >
          {copiedLink ? <Check className="w-4 h-4 text-black" /> : <Share2 className="w-4 h-4 text-black" />}
          <span>{copiedLink ? 'Link Copied!' : 'Share Invitation'}</span>
        </button>
      </div>
    </section>
  );
};
