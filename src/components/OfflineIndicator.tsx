import React from 'react';
import { WifiOff, ShieldCheck } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-slate-900/95 border border-amber-500/40 px-3.5 py-1.5 text-xs font-semibold text-amber-300 shadow-xl backdrop-blur-md animate-bounce">
      <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span>Offline Mode — All changes save locally to your phone!</span>
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
    </div>
  );
};
