import React, { useState } from 'react';
import { Heart, QrCode, Smartphone, Copy, Check, ExternalLink, ShieldCheck, X, Sparkles } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface DigitalShagunModalProps {
  isOpen: boolean;
  onClose: () => void;
  hostName: string;
  eventTitle: string;
  upiId?: string;
  upiMobile?: string;
  upiQrUrl?: string;
}

export const DigitalShagunModal: React.FC<DigitalShagunModalProps> = ({
  isOpen,
  onClose,
  hostName,
  eventTitle,
  upiId,
  upiMobile,
  upiQrUrl,
}) => {
  const [copiedField, setCopiedField] = useState<'upi' | 'mobile' | null>(null);
  const [paymentInitiated, setPaymentInitiated] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string, type: 'upi' | 'mobile') => {
    navigator.clipboard.writeText(text);
    setCopiedField(type);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const constructUpiDeepLink = (pa: string) => {
    const cleanPa = pa.trim();
    const cleanPn = encodeURIComponent(hostName || 'Event Host');
    return `upi://pay?pa=${cleanPa}&pn=${cleanPn}&cu=INR`;
  };

  const handleInitiatePayment = (pa: string) => {
    setPaymentInitiated(true);
    const deepLink = constructUpiDeepLink(pa);
    window.location.href = deepLink;
  };

  const activeUpi = upiId || (upiMobile ? `${upiMobile}@upi` : null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-amber-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-[#893148] via-[#A74960] to-[#5E000F] text-white flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center border border-amber-300/40 shadow-inner">
              <Heart className="w-6 h-6 text-amber-300 fill-amber-300 animate-pulse" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-extrabold tracking-wide text-amber-200">Send Digital Shagun</h2>
              <p className="text-xs font-serif italic text-amber-100/90">
                Send love & wedding blessings to {hostName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 text-white/90 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content Area */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
          {paymentInitiated && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs space-y-1.5 animate-in zoom-in-95">
              <div className="font-bold flex items-center gap-2 text-emerald-800 text-sm">
                <Check className="w-5 h-5 text-emerald-600" />
                <span>UPI Payment Initiated!</span>
              </div>
              <p className="text-emerald-700 leading-relaxed font-serif">
                Your payment app (Google Pay, PhonePe, Paytm, BHIM) has been launched. Please complete the transaction in your app.
              </p>
            </div>
          )}

          {/* Option 1: Host UPI QR Code */}
          <div className="bg-[#FAF6F0] p-5 rounded-2xl border border-amber-200/80 text-center space-y-3 shadow-sm">
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-mono font-extrabold uppercase tracking-widest border border-amber-300 inline-flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-amber-700" /> Option 1: Scan Host UPI QR
            </span>

            <div className="p-4 bg-white rounded-2xl border border-amber-200 w-48 h-48 mx-auto flex items-center justify-center shadow-md">
              {upiQrUrl ? (
                <img src={upiQrUrl} alt="Host UPI QR Code" className="w-full h-full object-contain rounded-xl" />
              ) : activeUpi ? (
                <QRCodeSVG value={constructUpiDeepLink(activeUpi)} size={160} level="M" />
              ) : (
                <div className="text-center text-xs text-amber-800 font-serif">
                  No QR uploaded
                </div>
              )}
            </div>

            <p className="text-xs text-[#5E000F] font-serif italic">
              Scan using any UPI app (GPay, PhonePe, Paytm) or tap direct UPI pay below.
            </p>
          </div>

          {/* Option 2: Pay via Host UPI ID */}
          {upiId && (
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E9D3D0] space-y-3 shadow-sm">
              <div className="flex items-center justify-between text-xs font-mono font-extrabold text-[#893148] uppercase tracking-wider">
                <span>Option 2: Pay via UPI ID</span>
                <span className="text-[10px] bg-amber-100 px-2.5 py-0.5 rounded-full text-amber-900 border border-amber-200">
                  Instant UPI
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-3 rounded-xl bg-[#FAF7F5] border border-[#E9D3D0] font-mono text-sm font-extrabold text-[#302829] truncate">
                  {upiId}
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(upiId, 'upi')}
                  className="px-4 py-3 rounded-xl bg-[#FAF7F5] border border-[#E9D3D0] hover:bg-amber-50 font-mono font-bold text-xs text-[#893148] transition-colors flex items-center gap-1.5"
                >
                  {copiedField === 'upi' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[#893148]" />}
                  <span>{copiedField === 'upi' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleInitiatePayment(upiId)}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#A74960] via-[#893148] to-[#5E000F] text-white font-extrabold text-xs shadow-md hover:scale-[1.01] transition-transform flex items-center justify-center gap-2 border border-amber-300/40"
              >
                <ExternalLink className="w-4 h-4 text-amber-300" />
                <span>PAY VIA INSTALLED UPI APP (GPAY / PHONEPE / PAYTM)</span>
              </button>
            </div>
          )}

          {/* Option 3: Pay via Host Mobile Number */}
          {upiMobile && (
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E9D3D0] space-y-3 shadow-sm">
              <div className="flex items-center justify-between text-xs font-mono font-extrabold text-[#893148] uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-[#893148]" /> Option 3: Pay via Host Mobile
                </span>
                <span className="text-[10px] bg-purple-100 px-2.5 py-0.5 rounded-full text-purple-900 border border-purple-200">
                  Mobile UPI
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-3 rounded-xl bg-[#FAF7F5] border border-[#E9D3D0] font-mono text-sm font-extrabold text-[#302829]">
                  {upiMobile}
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(upiMobile, 'mobile')}
                  className="px-4 py-3 rounded-xl bg-[#FAF7F5] border border-[#E9D3D0] hover:bg-amber-50 font-mono font-bold text-xs text-[#893148] transition-colors flex items-center gap-1.5"
                >
                  {copiedField === 'mobile' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[#893148]" />}
                  <span>{copiedField === 'mobile' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleInitiatePayment(`${upiMobile}@upi`)}
                className="w-full py-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4 text-purple-200" />
                <span>PAY USING MOBILE NUMBER ({upiMobile})</span>
              </button>
            </div>
          )}

          {/* Direct Safe Payment Notice */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-950 font-serif leading-relaxed space-y-1">
            <div className="font-extrabold font-mono text-amber-900 uppercase flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> 100% Direct & Safe Payment Guarantee
            </div>
            <p>
              Your digital shagun is transferred directly from your bank account to the Host's account. Nimantran AI never stores bank credentials, OTPs, or UPI PINs.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
