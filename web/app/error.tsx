'use client';

import { useEffect } from 'react';
import { RotateCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Client-side exception caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full rounded-3xl border border-white/10 bg-neutral-900/80 p-8 shadow-2xl backdrop-blur">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
          ⚠️
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Something tripped up</h2>
        <p className="text-xs text-neutral-400 mb-4">
          A client state hiccup occurred while loading. Click below to refresh your session.
        </p>
        {error.message && (
          <p className="mb-6 rounded-xl border border-white/5 bg-black/50 p-3 text-left font-mono text-xs text-amber-300/90 break-words">
            {error.message}
          </p>
        )}
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.reload();
            } else {
              reset();
            }
          }}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 text-sm font-semibold text-black hover:bg-neutral-200 transition active:scale-95"
        >
          <RotateCcw className="h-4 w-4" /> Reload Session
        </button>
      </div>
    </div>
  );
}
