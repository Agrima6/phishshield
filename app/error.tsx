'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-8 shadow-xs text-center space-y-5">
        <div className="inline-flex items-center justify-center p-3 bg-red-50 text-destructive rounded-full">
          <RefreshCw className="h-10 w-10 animate-spin" style={{ animationDuration: '4s' }} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">500</h1>
          <h3 className="text-lg font-bold text-slate-800 mt-2">Internal Server Error</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
            An unexpected error occurred in the React rendering tree. Please click the button below to retry or reload the page.
          </p>
        </div>
        <div className="pt-4 flex flex-col gap-2">
          <Button onClick={() => reset()}>
            Retry Render
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reload Portal
          </Button>
        </div>
      </div>
    </div>
  );
}
