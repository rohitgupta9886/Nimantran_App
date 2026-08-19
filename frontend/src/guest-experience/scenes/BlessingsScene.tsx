import React from 'react';

interface BlessingsSceneProps {
  content?: string;
  hostName?: string;
  vedicHeader?: string;
}

export const BlessingsScene: React.FC<BlessingsSceneProps> = ({
  content,
  hostName,
  vedicHeader,
}) => {
  return (
    <section
      className="p-8 rounded-3xl border-2 border-amber-300/80 shadow-2xl backdrop-blur-2xl text-center space-y-4 relative overflow-hidden font-sans"
      style={{
        background: 'linear-gradient(135deg, rgba(50, 12, 24, 0.95) 0%, rgba(25, 5, 12, 0.98) 100%)',
      }}
    >
      {/* Ornate Gold Corner Filigrees */}
      <div className="absolute top-2 left-2 text-amber-400/40 text-2xl font-serif">╔</div>
      <div className="absolute top-2 right-2 text-amber-400/40 text-2xl font-serif">╗</div>
      <div className="absolute bottom-2 left-2 text-amber-400/40 text-2xl font-serif">╚</div>
      <div className="absolute bottom-2 right-2 text-amber-400/40 text-2xl font-serif">╝</div>

      <div className="space-y-1">
        <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300 block">
          {vedicHeader || '|| ॐ श्री गणेशाय नमः ||'}
        </span>
        <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-white">
          With The Blessings of Our Families
        </h3>
      </div>

      <p className="font-serif italic text-sm sm:text-base text-amber-100/90 leading-relaxed max-w-xl mx-auto">
        "{content ||
          'Together with our families, we joyfully invite you to celebrate the joyous union of our lives and bless us on this auspicious occasion.'}"
      </p>

      <div className="pt-2">
        <p className="text-xs font-mono uppercase tracking-widest text-amber-300">
          Warmly Hosted By: <span className="font-bold text-white">{hostName || 'The Family'}</span>
        </p>
      </div>
    </section>
  );
};
