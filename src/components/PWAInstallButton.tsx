import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-1.5 font-bold rounded-lg transition shadow-sm active:scale-95 bg-amber-400 hover:bg-amber-300 text-slate-950 ${
          compact ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-sm'
        }`}
        title="Install to your phone home screen for offline access"
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 font-bold rounded-lg transition shadow-sm active:scale-95 bg-emerald-800 text-white hover:bg-emerald-700 border border-emerald-600 ${
            compact ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-sm'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Add to Phone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-slate-900 border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-600" />
                  Install on iPhone / iPad
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs shrink-0">1</span>
                  <span>Tap the <strong>Share button</strong> (square with arrow) at the bottom or top of Safari.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs shrink-0">2</span>
                  <span>Scroll down and tap <strong>"Add to Home Screen"</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs shrink-0">3</span>
                  <span>Tap <strong>Add</strong>. Open anytime even with zero data!</span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 active:scale-98 transition"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback indicator showing app is 100% offline ready
  return (
    <div
      className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-950/60 text-emerald-200 border border-emerald-700/60"
      title="Works 100% offline on any phone browser"
    >
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
      <span>Offline Ready</span>
    </div>
  );
};
