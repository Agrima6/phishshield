'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-8 shadow-xs text-center space-y-5">
        <div className="inline-flex items-center justify-center p-3 bg-slate-100 text-slate-600 rounded-full">
          <HelpCircle className="h-10 w-10" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">404</h1>
          <h3 className="text-lg font-bold text-slate-800 mt-2">Page Not Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
            We couldn&apos;t find the page or resource you requested. It might have been relocated, or the URL address contains a typo.
          </p>
        </div>
        <div className="pt-4 flex flex-col gap-2">
          <Button onClick={() => router.push('/')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
