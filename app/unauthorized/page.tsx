'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  AlertTriangle, 
  HelpCircle, 
  Lock, 
  RefreshCw, 
  ShieldAlert, 
  Zap, 
  ChevronLeft,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type ErrorState = 'menu' | '404' | '500' | 'rate-limit' | 'unauthorized' | 'maintenance';

export default function ErrorSandboxPage() {
  const router = useRouter();
  const [activeState, setActiveState] = useState<ErrorState>('menu');

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      
      {/* 1. Menu view */}
      {activeState === 'menu' && (
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-8 shadow-xs space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center p-2.5 bg-amber-50 text-amber-600 rounded-lg mb-3">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Security & Error State Sandbox</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Verify how the enterprise UI handles common fallbacks, permission gates, and rate limit errors.
            </p>
          </div>

          <div className="space-y-2 text-xs font-semibold">
            <button 
              onClick={() => setActiveState('404')}
              className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-primary hover:bg-slate-50 transition-all flex items-center justify-between text-slate-700 cursor-pointer"
            >
              <span>Verify 404 Page Not Found state</span>
              <HelpCircle className="h-4 w-4 text-slate-400" />
            </button>

            <button 
              onClick={() => setActiveState('500')}
              className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-primary hover:bg-slate-50 transition-all flex items-center justify-between text-slate-700 cursor-pointer"
            >
              <span>Verify 500 Internal Error state</span>
              <RefreshCw className="h-4 w-4 text-slate-400" />
            </button>

            <button 
              onClick={() => setActiveState('rate-limit')}
              className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-primary hover:bg-slate-50 transition-all flex items-center justify-between text-slate-700 cursor-pointer"
            >
              <span>Verify API Rate Limit Alert state</span>
              <Zap className="h-4 w-4 text-slate-400" />
            </button>

            <button 
              onClick={() => setActiveState('unauthorized')}
              className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-primary hover:bg-slate-50 transition-all flex items-center justify-between text-slate-700 cursor-pointer"
            >
              <span>Verify 403 Permission Denied state</span>
              <Lock className="h-4 w-4 text-slate-400" />
            </button>

            <button 
              onClick={() => setActiveState('maintenance')}
              className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-primary hover:bg-slate-50 transition-all flex items-center justify-between text-slate-700 cursor-pointer"
            >
              <span>Verify Portal System Maintenance state</span>
              <Settings className="h-4 w-4 text-slate-400" />
            </button>
          </div>

          <div className="pt-2">
            <Button variant="outline" className="w-full flex items-center justify-center gap-1.5" onClick={() => router.push('/')}>
              <ChevronLeft className="h-4 w-4" /> Back to Overview Dashboard
            </Button>
          </div>
        </div>
      )}

      {/* 2. 404 View */}
      {activeState === '404' && (
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-8 shadow-xs text-center space-y-5">
          <div className="inline-flex items-center justify-center p-3 bg-slate-100 text-slate-600 rounded-full">
            <HelpCircle className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">404</h1>
            <h3 className="text-lg font-bold text-slate-800 mt-2">Page Not Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
              We couldn&apos;t find the resource you requested. It might have been relocated, or the URL address contains a typo.
            </p>
          </div>
          <div className="pt-4 flex flex-col gap-2">
            <Button onClick={() => setActiveState('menu')}>
              Return to Sandbox Menu
            </Button>
            <Button variant="outline" onClick={() => router.push('/')}>
              Go to Overview Dashboard
            </Button>
          </div>
        </div>
      )}

      {/* 3. 500 View */}
      {activeState === '500' && (
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-8 shadow-xs text-center space-y-5">
          <div className="inline-flex items-center justify-center p-3 bg-red-50 text-destructive rounded-full">
            <RefreshCw className="h-10 w-10 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">500</h1>
            <h3 className="text-lg font-bold text-slate-800 mt-2">Internal Server Error</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
              An unexpected exception occurred while retrieving database configurations. Our operations team has been notified.
            </p>
          </div>
          <div className="pt-4 flex flex-col gap-2">
            <Button onClick={() => setActiveState('menu')}>
              Return to Sandbox Menu
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry Connection
            </Button>
          </div>
        </div>
      )}

      {/* 4. Rate Limit View */}
      {activeState === 'rate-limit' && (
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-8 shadow-xs text-center space-y-5">
          <div className="inline-flex items-center justify-center p-3 bg-amber-50 text-amber-600 rounded-full">
            <Zap className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Rate Limit Exceeded</h1>
            <p className="text-xs text-slate-500 mt-2 max-w-xs mx-auto leading-relaxed">
              Too many requests. You have triggered our administrative rate limiting policy. Please wait 60 seconds before sending more requests.
            </p>
          </div>
          <div className="pt-4 flex flex-col gap-2">
            <Button onClick={() => setActiveState('menu')}>
              Return to Sandbox Menu
            </Button>
            <Button variant="outline" onClick={() => setActiveState('menu')}>
              Try Again Now
            </Button>
          </div>
        </div>
      )}

      {/* 5. Unauthorized View */}
      {activeState === 'unauthorized' && (
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-8 shadow-xs text-center space-y-5">
          <div className="inline-flex items-center justify-center p-3 bg-red-50 text-destructive rounded-full">
            <Lock className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">403 Permission Denied</h1>
            <p className="text-xs text-slate-500 mt-2 max-w-xs mx-auto leading-relaxed">
              You do not have the required administrative scopes to write settings files. Please contact your administrator.
            </p>
          </div>
          <div className="pt-4 flex flex-col gap-2">
            <Button onClick={() => setActiveState('menu')}>
              Return to Sandbox Menu
            </Button>
            <Button variant="outline" onClick={() => router.push('/')}>
              Go to Overview Dashboard
            </Button>
          </div>
        </div>
      )}

      {/* 6. Maintenance View */}
      {activeState === 'maintenance' && (
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-8 shadow-xs text-center space-y-5">
          <div className="inline-flex items-center justify-center p-3 bg-blue-50 text-blue-600 rounded-full">
            <Settings className="h-10 w-10 animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Under Maintenance</h1>
            <p className="text-xs text-slate-500 mt-2 max-w-xs mx-auto leading-relaxed">
              We are currently deploying updates. The Phishing Awareness Portal will be back online shortly. We apologize for the inconvenience.
            </p>
          </div>
          <div className="pt-4 flex flex-col gap-2">
            <Button onClick={() => setActiveState('menu')}>
              Return to Sandbox Menu
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
