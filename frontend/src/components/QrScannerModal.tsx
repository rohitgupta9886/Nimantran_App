import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, ShieldCheck, Key, AlertCircle, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerifyPass: (passCode: string, method: 'QR_SCAN' | 'MANUAL_PASSCODE') => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onVerifyPass,
  loading = false,
  error = null,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [manualCode, setManualCode] = useState('NIM-ENTRY-1001');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!isOpen || activeTab !== 'camera') {
      stopCameraScanner();
      return;
    }

    // Initialize Html5Qrcode scanner when modal opens on camera tab
    const scannerId = 'qr-camera-reader-viewport';
    const timer = setTimeout(() => {
      startCameraScanner(scannerId);
    }, 300);

    return () => {
      clearTimeout(timer);
      stopCameraScanner();
    };
  }, [isOpen, activeTab]);

  const startCameraScanner = async (elementId: string) => {
    try {
      setCameraError(null);
      if (html5QrcodeRef.current) {
        await stopCameraScanner();
      }

      const scanner = new Html5Qrcode(elementId);
      html5QrcodeRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          console.log('QR Code Scanned successfully:', decodedText);
          // Stop scanner immediately on scan
          await stopCameraScanner();
          // Extract pass code or URL token payload
          let code = decodedText.trim();
          if (code.includes('/pass/') || code.includes('/i/')) {
            const parts = code.split('/');
            code = parts[parts.length - 1];
          }
          await onVerifyPass(code, 'QR_SCAN');
        },
        (errorMessage) => {
          // Ignore transient scan frame errors
        }
      );
      setIsScanning(true);
    } catch (err: any) {
      console.error('Camera QR init error:', err);
      setCameraError(
        'Unable to access mobile camera. Please ensure camera permissions are allowed, or use Manual Pass Code fallback.'
      );
      setIsScanning(false);
    }
  };

  const stopCameraScanner = async () => {
    if (html5QrcodeRef.current && isScanning) {
      try {
        await html5QrcodeRef.current.stop();
        html5QrcodeRef.current.clear();
      } catch (e) {
        console.log('Scanner cleanup warning:', e);
      } finally {
        html5QrcodeRef.current = null;
        setIsScanning(false);
      }
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim() || loading) return;
    await onVerifyPass(manualCode.trim(), 'MANUAL_PASSCODE');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E9D3D0] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#9E6F6D] via-[#875B59] to-[#5E3735] text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
              <Camera className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-extrabold tracking-wide">Guest Gate Check-In</h2>
              <p className="text-[11px] font-mono text-amber-200/90 uppercase tracking-widest font-bold">
                1-Tap Camera & Pass Code Scanner
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCameraScanner();
              onClose();
            }}
            className="p-2 rounded-full hover:bg-white/20 text-white/90 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#E9D3D0] bg-[#FAF7F5] p-1.5 gap-2">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2.5 rounded-2xl text-xs font-mono font-extrabold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'camera'
                ? 'bg-white text-[#9E6F6D] shadow-md border border-[#E9D3D0]'
                : 'text-[#8C7E80] hover:text-[#302829]'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Scan with Camera</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2.5 rounded-2xl text-xs font-mono font-extrabold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'manual'
                ? 'bg-white text-[#9E6F6D] shadow-md border border-[#E9D3D0]'
                : 'text-[#8C7E80] hover:text-[#302829]'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Enter Pass Code</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div className="font-semibold">{error}</div>
            </div>
          )}

          {activeTab === 'camera' ? (
            <div className="space-y-4 text-center">
              {/* Camera Scanner Viewport Container */}
              <div className="relative mx-auto w-full max-w-xs h-64 bg-black rounded-3xl overflow-hidden border-4 border-[#9E6F6D] shadow-xl flex items-center justify-center">
                <div id="qr-camera-reader-viewport" className="w-full h-full object-cover" />
                
                {/* Visual Reticle Overlay */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  <div className="w-48 h-48 border-2 border-dashed border-amber-300/80 rounded-2xl relative animate-pulse">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-amber-400" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-amber-400" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-amber-400" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-amber-400" />
                  </div>
                </div>

                {loading && (
                  <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center text-amber-300 font-mono text-xs font-bold gap-2">
                    <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
                    <span>Verifying Guest Gate Pass...</span>
                  </div>
                )}
              </div>

              {cameraError ? (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-2">
                  <p className="font-semibold">{cameraError}</p>
                  <button
                    onClick={() => setActiveTab('manual')}
                    className="px-4 py-2 bg-amber-600 text-white rounded-xl font-bold font-mono text-xs shadow-md"
                  >
                    Switch to Manual Pass Code Entry
                  </button>
                </div>
              ) : (
                <p className="text-xs text-[#7A6B6C] font-mono font-medium">
                  Point camera at the Guest Invitation QR Code for instant auto-verification.
                </p>
              )}
            </div>
          ) : (
            /* Manual Passcode Entry Form */
            <form onSubmit={handleManualSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-mono font-extrabold uppercase tracking-wider text-[#9E6F6D] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600" /> Enter Guest Pass Code
                </label>
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="e.g. NIM-ENTRY-1001"
                  className="w-full px-4 py-3.5 rounded-2xl bg-[#FAF6F0] border border-[#E9D3D0] text-[#302829] font-mono text-base font-extrabold tracking-widest uppercase focus:outline-none focus:border-[#9E6F6D]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || !manualCode.trim()}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#9E6F6D] via-[#875B59] to-[#5E3735] text-white font-extrabold text-sm shadow-xl hover:scale-[1.02] transition-transform disabled:opacity-50 flex items-center justify-center gap-2 border border-amber-300/40"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin text-amber-300" />
                      <span>Verifying Pass Code...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-amber-300" />
                      <span>VERIFY GATE PASS & CHECK-IN</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3 bg-[#FAF7F5] rounded-xl border border-[#E9D3D0] text-[11px] text-[#7A6B6C] font-mono">
                💡 <span className="font-bold">Test Pass Codes:</span> NIM-ENTRY-1001, NIM-ENTRY-1002, NIM-ENTRY-1003
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
