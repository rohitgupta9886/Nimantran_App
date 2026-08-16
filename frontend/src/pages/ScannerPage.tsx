import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QrCode, CheckCircle2, AlertTriangle, XCircle, Camera, ShieldCheck, ArrowLeft, Users, Monitor } from 'lucide-react';
import { apiFetch } from '../services/api';

export const ScannerPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [passCode, setPassCode] = useState('NIM-ENTRY-1001');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleVerifyPass = async (codeToVerify?: string) => {
    const targetCode = codeToVerify || passCode;
    if (!targetCode) return;
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch<any>('/scanner/verify', {
        method: 'POST',
        body: JSON.stringify({
          pass_code: targetCode,
          event_id: eventId,
          location_name: 'Main Reception Gate',
        }),
      });
      setResult(res.data);
    } catch (err: any) {
      setError(err.message || 'QR Pass Verification Failed');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF7F5] text-[#302829] font-sans py-10 px-4 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Soft Glow Orbs */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none opacity-25 bg-[#9E6F6D]" />

      <div className="max-w-xl w-full space-y-6 relative z-10">
        
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            to={eventId ? `/events/${eventId}` : '/dashboard'}
            className="inline-flex items-center gap-2 text-xs font-mono font-extrabold text-[#9E6F6D] hover:text-[#875B59] bg-[#F2E5E2] px-4 py-2 rounded-full border border-[#E9D3D0] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Celebration Manager
          </Link>
          {eventId && (
            <Link
              to={`/welcome/${eventId}`}
              className="inline-flex items-center gap-1.5 text-xs font-mono font-extrabold text-[#9E6F6D] hover:text-[#875B59] bg-purple-50 px-4 py-2 rounded-full border border-purple-200 transition-colors"
            >
              <Monitor className="w-4 h-4 text-purple-700" /> TV Welcome Screen
            </Link>
          )}
        </div>

        {/* Top Header Card */}
        <div className="bg-white/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-[#E9D3D0] text-center space-y-3 shadow-xl">
          <div className="w-14 h-14 rounded-full bg-[#F2E5E2] text-[#9E6F6D] mx-auto flex items-center justify-center border border-[#E9D3D0] shadow-sm">
            <QrCode className="w-7 h-7 text-[#9E6F6D]" />
          </div>
          <span className="px-3.5 py-1 rounded-full bg-[#F2E5E2] text-[#9E6F6D] text-[10px] font-mono font-extrabold uppercase tracking-widest border border-[#E9D3D0] inline-block">
            ENTRANCE SCANNER KIOSK
          </span>
          <h1 className="font-serif text-3xl font-extrabold text-[#302829]">Reception Gate Scanner</h1>
          <p className="text-xs text-[#7A6B6C] max-w-md mx-auto leading-relaxed">
            Scan guest QR code or enter pass code for instant gate entrance verification & check-in.
          </p>
        </div>

        {/* Manual Input / Camera Simulation Box */}
        <div className="bg-white/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-[#E9D3D0] space-y-5 shadow-xl">
          <div className="flex items-center justify-between text-xs font-mono font-extrabold text-[#9E6F6D] uppercase tracking-wider">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#C9AA78]" /> Enter Pass Code or Camera Simulation
            </span>
            <Camera className="w-4 h-4 text-[#9E6F6D]" />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={passCode}
              onChange={(e) => setPassCode(e.target.value)}
              placeholder="NIM-ENTRY-1001"
              className="flex-1 px-4 py-3 rounded-2xl bg-[#FAF6F0] border border-[#E9D3D0] text-[#302829] font-mono text-sm font-extrabold tracking-widest uppercase focus:outline-none focus:border-[#9E6F6D]"
            />
            <button
              onClick={() => handleVerifyPass()}
              disabled={loading}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-[#9E6F6D] via-[#875B59] to-[#9E6F6D] text-white font-extrabold text-xs shadow-md hover:scale-105 transition-transform disabled:opacity-50 border border-[#E9D3D0]"
            >
              {loading ? 'Verifying...' : 'Verify Gate Pass'}
            </button>
          </div>

          {/* Quick Simulation Options */}
          <div className="pt-2 space-y-2 border-t border-[#E9D3D0]">
            <span className="text-[10px] font-mono text-[#8C7E80] font-bold uppercase tracking-wider block">
              💡 Quick Gate Test Simulations:
            </span>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                onClick={() => { setPassCode('NIM-ENTRY-1001'); handleVerifyPass('NIM-ENTRY-1001'); }}
                className="px-4 py-2 bg-[#F2E5E2] hover:bg-[#E9D3D0] border border-[#E9D3D0] rounded-xl text-[#9E6F6D] font-mono font-extrabold transition-colors shadow-sm"
              >
                Simulate Guest 1001
              </button>
              <button
                onClick={() => { setPassCode('NIM-ENTRY-1002'); handleVerifyPass('NIM-ENTRY-1002'); }}
                className="px-4 py-2 bg-[#F2E5E2] hover:bg-[#E9D3D0] border border-[#E9D3D0] rounded-xl text-[#9E6F6D] font-mono font-extrabold transition-colors shadow-sm"
              >
                Simulate Guest 1002
              </button>
            </div>
          </div>
        </div>

        {/* Verification Output Card - Error State */}
        {error && (
          <div className="p-6 sm:p-8 rounded-3xl bg-rose-50 border border-rose-300 text-center space-y-3 shadow-xl text-rose-950">
            <XCircle className="w-12 h-12 text-rose-600 mx-auto" />
            <h2 className="font-serif text-2xl font-extrabold text-rose-900">DENY ENTRY</h2>
            <p className="text-xs text-rose-700 font-semibold max-w-sm mx-auto">{error}</p>
          </div>
        )}

        {/* Verification Output Card - Success / Warning State */}
        {result && (
          <div className={`p-6 sm:p-8 rounded-3xl text-center space-y-5 shadow-2xl border ${
            result.already_checked_in
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : 'bg-emerald-50 border-emerald-300 text-emerald-950'
          }`}>
            {result.already_checked_in ? (
              <>
                <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto animate-bounce" />
                <div className="px-4 py-1.5 rounded-full bg-amber-200/80 text-amber-900 text-xs font-mono font-extrabold uppercase inline-block border border-amber-300">
                  WARNING: ALREADY CHECKED IN
                </div>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <div className="px-4 py-1.5 rounded-full bg-emerald-200/80 text-emerald-900 text-xs font-mono font-extrabold uppercase inline-block border border-emerald-300">
                  VALID INVITATION PASS
                </div>
              </>
            )}

            <div className="space-y-1">
              <h2 className="font-serif text-3xl font-extrabold text-[#302829]">{result.guest_name}</h2>
              {result.event_title && (
                <p className="font-serif font-bold text-sm text-[#893148]">{result.event_title}</p>
              )}
              <p className="text-xs font-mono font-bold text-[#9E6F6D]">{result.relationship || 'Honored Guest'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-y border-[#E9D3D0] text-xs font-mono">
              <div className="bg-white/80 p-3 rounded-2xl border border-[#E9D3D0] shadow-sm">
                <span className="text-[#8C7E80] block text-[10px] font-bold">ADULTS</span>
                <span className="text-xl font-extrabold text-[#302829]">{result.adults_count || 1}</span>
              </div>
              <div className="bg-white/80 p-3 rounded-2xl border border-[#E9D3D0] shadow-sm">
                <span className="text-[#8C7E80] block text-[10px] font-bold">CHILDREN</span>
                <span className="text-xl font-extrabold text-[#302829]">{result.children_count || 0}</span>
              </div>
            </div>

            {result.welcome_quote && (
              <p className="text-xs text-[#302829] italic font-serif leading-relaxed">
                "{result.welcome_quote}"
              </p>
            )}

            <button
              onClick={() => setResult(null)}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-xl transition-transform hover:scale-[1.02]"
            >
              ✓ ALLOW ENTRY & CONFIRM CHECK-IN
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
