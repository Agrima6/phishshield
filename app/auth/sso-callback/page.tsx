'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { useClerk, useAuth } from '@clerk/nextjs';
import { useSession } from '@/hooks/use-session';
import { api } from '@/lib/api';

export default function SSOCallbackPage() {
  const clerk = useClerk();
  const { getToken } = useAuth();
  const { login } = useSession();
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await clerk.handleRedirectCallback({});
        const token = await getToken();
        if (!token) {
          throw new Error('Could not obtain a session token from Clerk after redirect.');
        }
        const session = await api.auth.establishSession(token);
        if (cancelled) return;
        login('clerk', session.email, session.role, 'default', 'Default Tenant', session.name);
        router.push('/dashboard');
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.errors?.[0]?.message || err.message || 'Sign-in failed to complete.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 text-center py-8">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="text-sm font-semibold text-slate-800">Sign-in failed</p>
        <p className="text-xs text-slate-500">{error}</p>
        <a href="/auth/login" className="text-xs text-primary hover:text-primary-hover font-semibold">
          Back to login
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 py-12">
      <RefreshCw className="h-6 w-6 text-primary animate-spin" />
      <span className="text-sm font-medium text-slate-600">Completing sign-in...</span>
    </div>
  );
}
