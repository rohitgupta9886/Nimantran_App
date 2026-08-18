import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Camera,
  ShieldCheck,
  ArrowLeft,
  Users,
  Monitor,
  Sparkles,
} from 'lucide-react';
import { apiFetch } from '../services/api';
import { Button, Input, Card, Badge } from '../components/ui';

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
    <div className="min-h-screen w-full bg-canvas text-charcoal-900 font-sans py-8 px-4 flex flex-col items-center justify-center relative">
      <div className="max-w-lg w-full space-y-6 relative z-10">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            to={eventId ? `/events/${eventId}` : '/dashboard'}
            className="inline-flex items-center gap-2 text-xs font-semibold text-charcoal-700 hover:text-wine bg-white px-3.5 py-2 rounded-xl border border-charcoal-200 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Event
          </Link>
          {eventId && (
            <Link
              to={`/welcome/${eventId}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-800 hover:text-purple-900 bg-purple-50 px-3.5 py-2 rounded-xl border border-purple-200 transition-colors shadow-xs"
            >
              <Monitor className="w-4 h-4 text-purple-700" /> Welcome Wall
            </Link>
          )}
        </div>

        {/* Header Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-charcoal-200/80 text-center space-y-3 shadow-md">
          <div className="w-14 h-14 rounded-2xl bg-gold-50 text-wine mx-auto flex items-center justify-center border border-gold/20 shadow-xs">
            <QrCode className="w-7 h-7" />
          </div>
          <Badge variant="wine" size="sm">
            ENTRANCE SCANNER KIOSK
          </Badge>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-charcoal-900">
            Guest Check-in Gate
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-500 max-w-sm mx-auto">
            Scan guest QR code or enter pass code for instant gate verification and check-in.
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-charcoal-200/80 space-y-4 shadow-md">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-charcoal-700">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-gold" /> Pass Verification
            </span>
            <Camera className="w-4 h-4 text-wine" />
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <Input
              value={passCode}
              onChange={(e) => setPassCode(e.target.value)}
              placeholder="e.g. NIM-ENTRY-1001"
              className="font-mono font-bold uppercase"
            />
            <Button
              onClick={() => handleVerifyPass()}
              isLoading={loading}
              variant="primary"
              size="md"
              className="shrink-0 sm:w-auto w-full"
            >
              Verify Pass
            </Button>
          </div>

          {/* Quick Simulation Samples */}
          <div className="pt-2">
            <span className="text-[11px] font-bold text-charcoal-400 uppercase tracking-wider block mb-2">
              Quick Test Pass Codes
            </span>
            <div className="flex flex-wrap gap-1.5">
              {['NIM-ENTRY-1001', 'NIM-ENTRY-1002', 'NIM-VIP-GUEST', 'INVALID-CODE'].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => {
                    setPassCode(sample);
                    handleVerifyPass(sample);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-canvas hover:bg-surface-subtle text-charcoal-700 font-mono text-[11px] font-bold border border-charcoal-200 transition-colors"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Result Verification Card */}
        {result && (
          <div className="bg-white p-6 rounded-3xl border-2 border-emerald-400 shadow-xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <Badge variant="success" size="sm" dot>
                  Verified & Checked In
                </Badge>
                <h3 className="font-serif text-xl font-bold text-charcoal-900 mt-1">
                  Welcome, {result.guest_name || 'Honored Guest'}!
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-canvas border border-charcoal-200/60">
                <span className="text-charcoal-400 block text-[10px] font-bold uppercase">Headcount</span>
                <span className="font-bold text-charcoal-900 font-serif text-base">
                  {result.adults_attending || 1} Guests
                </span>
              </div>
              <div className="p-3 rounded-xl bg-canvas border border-charcoal-200/60">
                <span className="text-charcoal-400 block text-[10px] font-bold uppercase">Pass Code</span>
                <span className="font-mono font-bold text-wine text-xs">
                  {result.pass_code || passCode}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-white p-5 rounded-3xl border-2 border-red-300 shadow-lg space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5 text-red-700 font-bold text-sm">
              <XCircle className="w-5 h-5 shrink-0" />
              <span>Pass Not Verified</span>
            </div>
            <p className="text-xs text-charcoal-600 pl-7">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};
