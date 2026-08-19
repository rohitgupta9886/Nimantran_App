import React, { useState } from 'react';
import { ShieldCheck, Copy, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface VIPPassSceneProps {
  passcode: string;
  qrValue: string;
}

export const VIPPassScene: React.FC<VIPPassSceneProps> = ({ passcode, qrValue }) => {
  const [copiedPasscode, setCopiedPasscode] = useState(false);

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(passcode);
      setCopiedPasscode(true);
      setTimeout(() => setCopiedPasscode(false), 2500);
    } catch (e) {}
  };

  return (
    <section
      className="p-6 sm:p-8 rounded-3xl border-2 border-amber-300/80 shadow-2xl backdrop-blur-2xl text-center space-y-5 max-w-md mx-auto relative overflow-hidden font-sans"
      style={{
        background: 'linear-gradient(135deg, rgba(40, 10, 20, 0.95) 0%, rgba(20, 4, 10, 0.98) 100%)',
      }}
    >
      <div className="space-y-1">
        <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>OFFICIAL GUEST PASS</span>
        </span>
        <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">Digital VIP Entry Pass</h3>
      </div>

      {/* QR Code Container */}
      <div className="p-4 bg-white rounded-2xl shadow-xl w-48 h-48 mx-auto flex items-center justify-center border-2 border-amber-300">
        <QRCodeSVG
          value={qrValue || 'NIM-VIP-1001'}
          size={160}
          level="H"
          includeMargin={false}
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-mono text-amber-200">
          Passcode: <span className="font-bold text-white">{passcode}</span>
        </p>
        <button
          type="button"
          onClick={handleCopy}
          className="px-4 py-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-mono font-bold border border-amber-300/50 inline-flex items-center gap-1.5 transition-all"
        >
          {copiedPasscode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedPasscode ? 'Passcode Copied!' : 'Copy Entry Code'}</span>
        </button>
      </div>
    </section>
  );
};
