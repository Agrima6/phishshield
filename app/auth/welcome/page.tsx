'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, AlertTriangle, PartyPopper, ArrowRight } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { useSession } from '@/hooks/use-session';
import { api } from '@/lib/api';

export default function WelcomePage() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { login } = useSession();
  const router = useRouter();
  const [status, setStatus] = useState<'working' | 'ready' | 'error'>('working');
  const [error, setError] = useState('');
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setError('No active session found — please use the invite link from your email again.');
      setStatus('error');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error('Could not obtain a session token.');
        const session = await api.auth.establishSession(token);
        if (cancelled) return;
        login('clerk', session.email, session.role, 'default', 'Default Tenant', session.name);
        const settings = await api.settings.get().catch(() => null);
        if (!cancelled && settings?.name) setCompanyName(settings.name);
        if (!cancelled) setStatus('ready');
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.errors?.[0]?.message || err.message || 'Could not finish setting up your account.');
          setStatus('error');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);

  if (status === 'working') {
    return (
      <div className="flex flex-col items-center gap-2 py-12">
        <RefreshCw className="h-6 w-6 text-primary animate-spin" />
        <span className="text-sm font-medium text-slate-600">Setting up your account...</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center gap-3 text-center py-8">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="text-sm font-semibold text-slate-800">Something went wrong</p>
        <p className="text-xs text-slate-500 max-w-xs">{error}</p>
        <a href="/auth/login" className="text-xs text-primary hover:text-primary-hover font-semibold">
          Go to login
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center gap-4 py-8">
      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
        <PartyPopper className="h-7 w-7 text-primary" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-slate-900">You're all set!</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-xs">
          {companyName ? `Your account for ${companyName} is ready.` : 'Your account is ready.'} Welcome to Workmate Shield.
        </p>
      </div>
      <button
        onClick={() => router.push('/dashboard')}
        className="inline-flex items-center gap-2 text-sm font-bold px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors"
      >
        Go to Dashboard <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
