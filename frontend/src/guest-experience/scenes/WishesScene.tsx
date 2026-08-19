import React, { useState } from 'react';
import { Sparkles, Gift, Send } from 'lucide-react';

interface WishesSceneProps {
  hasShagun: boolean;
  wishesList: any[];
  onOpenShagunModal: () => void;
  onPostWish: (name: string, rel: string, msg: string) => Promise<boolean>;
}

export const WishesScene: React.FC<WishesSceneProps> = ({
  hasShagun,
  wishesList,
  onOpenShagunModal,
  onPostWish,
}) => {
  const [wishName, setWishName] = useState('');
  const [wishRel, setWishRel] = useState('Family & Friends');
  const [wishMessage, setWishMessage] = useState('');
  const [submittingWish, setSubmittingWish] = useState(false);
  const [wishSuccessMsg, setWishSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishMessage.trim()) return;
    setSubmittingWish(true);
    const ok = await onPostWish(wishName.trim() || 'Valued Guest', wishRel.trim(), wishMessage.trim());
    setSubmittingWish(false);
    if (ok) {
      setWishMessage('');
      setWishSuccessMsg('✨ Your warm blessing has been shared!');
      setTimeout(() => setWishSuccessMsg(null), 4000);
    }
  };

  return (
    <section id="wishes-section" className="space-y-6 font-sans">
      <div className="text-center space-y-1">
        <span className="text-[10px] font-mono uppercase tracking-[0.25em] font-extrabold text-amber-300 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>WALL OF LOVE & BLESSINGS</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-white drop-shadow-md">
          Send Your Warm Wishes
        </h2>
      </div>

      {/* Shagun CTA (if enabled) */}
      {hasShagun && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-500/20 border border-amber-300/60 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 max-w-xl mx-auto shadow-xl">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-300 flex items-center justify-center text-amber-300">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-white text-base">Digital Shagun Envelope</h4>
              <p className="text-xs text-amber-200">Send auspicious blessings via UPI</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenShagunModal}
            className="px-5 py-2.5 rounded-full bg-amber-500 text-black font-serif font-extrabold text-xs tracking-wider uppercase shadow-lg hover:bg-amber-400 transition-all active:scale-95"
          >
            Send Shagun ✨
          </button>
        </div>
      )}

      {/* Wishes Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-6 rounded-3xl border-2 border-amber-300/70 bg-black/60 backdrop-blur-2xl shadow-2xl space-y-4 max-w-xl mx-auto"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Your Name"
            value={wishName}
            onChange={(e) => setWishName(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-white/10 border border-amber-300/40 text-white placeholder-amber-200/50 text-sm focus:outline-none focus:border-amber-400"
          />
          <input
            type="text"
            placeholder="Relation (e.g. Friend, Cousin)"
            value={wishRel}
            onChange={(e) => setWishRel(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-white/10 border border-amber-300/40 text-white placeholder-amber-200/50 text-sm focus:outline-none focus:border-amber-400"
          />
        </div>

        <textarea
          rows={3}
          placeholder="Write your heartfelt blessing or message..."
          value={wishMessage}
          onChange={(e) => setWishMessage(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-amber-300/40 text-white placeholder-amber-200/50 text-sm focus:outline-none focus:border-amber-400"
        />

        <div className="flex items-center justify-between">
          {wishSuccessMsg ? (
            <span className="text-xs text-emerald-400 font-bold">{wishSuccessMsg}</span>
          ) : <span />}

          <button
            type="submit"
            disabled={submittingWish || !wishMessage.trim()}
            className="px-6 py-2.5 rounded-full bg-amber-500 text-black font-serif font-extrabold text-xs uppercase tracking-wider shadow-md hover:bg-amber-400 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submittingWish ? 'Posting...' : 'Post Blessing'}</span>
          </button>
        </div>
      </form>

      {/* Wishes Feed */}
      {wishesList && wishesList.length > 0 && (
        <div className="space-y-3 max-w-xl mx-auto pt-2">
          {wishesList.slice(0, 5).map((w: any, idx: number) => (
            <div
              key={w.id || idx}
              className="p-4 rounded-2xl bg-white/5 border border-amber-300/30 backdrop-blur-xl text-left space-y-1 shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-amber-200 text-sm">{w.guest_name || 'Guest'}</span>
                {w.relation && <span className="text-[10px] font-mono text-amber-300/70">{w.relation}</span>}
              </div>
              <p className="text-xs text-white/90 italic font-serif">"{w.message}"</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
