'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { KeyRound, Mail, Eye, EyeOff, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuth, useClerk } from '@clerk/nextjs';
import { useSession } from '@/hooks/use-session';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const loginSchema = zod.object({
  email: zod.string().min(1, 'Username or Email is required'),
  password: zod.string().min(8, 'Password must be at least 8 characters long'),
});

type LoginFormValues = zod.infer<typeof loginSchema>;

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useSession();
  const clerk = useClerk();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Simple password strength computation
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (!pass) return 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strengthScore = getPasswordStrength(passwordValue);

  // Hands a Clerk session token to the Flask backend so it can mint the
  // session cookie /api/phish/* routes check, then enters the console.
  const completeSignIn = async () => {
    const token = await getToken();
    if (!token) {
      throw new Error('Could not obtain a session token from Clerk.');
    }
    const session = await api.auth.establishSession(token);
    login('clerk', session.email, session.role, 'default', 'Default Tenant', session.name);
    router.push('/dashboard');
  };

  // This Clerk instance is single-session: if the browser already has an
  // active Clerk session (e.g. from an earlier sign-in attempt), starting a
  // new one throws "Session already exists" instead of just letting it
  // through. So on load, if we're already signed in at the Clerk level, skip
  // straight to establishing our own app session rather than showing the form.
  useEffect(() => {
    const loggedOutParam = searchParams.get('loggedout') === '1';
    const loggedOutFlag = typeof window !== 'undefined' && sessionStorage.getItem('phish_just_logged_out') === '1';
    console.log('[login] auto-restore check:', { isLoaded, isSignedIn, loggedOutParam, loggedOutFlag });
    if (!isLoaded) return;
    // A deliberate logout just happened. Clerk's signed-out state can take a
    // tick to propagate through React context, so isSignedIn may still read
    // stale (true) right as this page mounts - without this check we'd
    // immediately restore the session we just asked to end, making logout a
    // no-op. Skip the restore, and force the sign-out through again in case
    // it's genuinely still active.
    if (loggedOutParam || loggedOutFlag) {
      console.log('[login] skipping auto-restore due to logout flag/param');
      sessionStorage.removeItem('phish_just_logged_out');
      if (loggedOutParam) {
        router.replace('/auth/login');
      }
      if (isSignedIn) {
        clerk.signOut().catch(() => {});
      }
      return;
    }
    if (!isSignedIn) return;
    console.log('[login] proceeding to auto-restore session');
    setRestoring(true);
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      toast.error('Restoring your session is taking too long. Please sign in again.');
      setRestoring(false);
    }, 12000);
    completeSignIn()
      .catch((err: any) => {
        if (settled) return;
        toast.error(err?.errors?.[0]?.message || err.message || 'Failed to restore your session.');
        setRestoring(false);
      })
      .finally(() => {
        settled = true;
        clearTimeout(timeout);
      });
    return () => {
      settled = true;
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);

  const onSubmit = async (data: LoginFormValues) => {
    if (!isLoaded) {
      toast.error('Still connecting to the authentication service — please try again in a moment.');
      return;
    }
    setLoading(true);
    try {
      // A stale Clerk session (e.g. left over from an interrupted logout)
      // makes signIn.create() below reject with "session already exists"
      // instead of just letting a fresh sign-in through. Clear it first so
      // submitting the form always starts from a clean slate.
      if (isSignedIn) {
        await clerk.signOut().catch(() => {});
      }
      // 1. Authenticate against Clerk directly (this Clerk instance requires a password first factor)
      const result = await clerk.client.signIn.create({
        identifier: data.email,
        password: data.password,
      });

      if (result.status !== 'complete') {
        console.log('[login] sign-in did not complete:', JSON.stringify(result, null, 2));
        toast.error(`Sign-in status: ${result.status}. See console for details.`);
        return;
      }

      // 2. Activate the Clerk session client-side, then finish via the shared helper.
      await clerk.setActive({ session: result.createdSessionId });
      await completeSignIn();
      toast.success('Signed in successfully.');
    } catch (err: any) {
      // Clerk's client sometimes already holds a valid session (e.g. from an
      // earlier sign-in on this browser) before this component's isSignedIn
      // state has caught up, so signIn.create() rejects with "session
      // already exists" instead of just letting the existing session
      // through. Since a session genuinely IS active at that point, finish
      // signing into this app with it rather than dead-ending on an error.
      const code = err?.errors?.[0]?.code || '';
      if (code === 'session_exists' || /already signed in|session.*exists/i.test(err?.message || '')) {
        try {
          await completeSignIn();
          toast.success('Signed in successfully.');
          return;
        } catch {
          // fall through to the generic error below
        }
      }
      const message = err?.errors?.[0]?.message || err.message || 'Invalid corporate email or password.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isLoaded) {
      toast.error('Still connecting to the authentication service — please try again in a moment.');
      return;
    }
    setGoogleLoading(true);
    try {
      if (isSignedIn) {
        await clerk.signOut().catch(() => {});
      }
      // Full-page redirect to Google; the browser navigates away from here.
      await clerk.client.signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: `${window.location.origin}/auth/sso-callback`,
        redirectUrlComplete: `${window.location.origin}/dashboard`,
      });
    } catch (err: any) {
      const message = err?.errors?.[0]?.message || err.message || 'Google sign-in failed.';
      toast.error(message);
      setGoogleLoading(false);
    }
  };

  if (restoring) {
    return (
      <div className="flex flex-col items-center gap-2 py-12">
        <RefreshCw className="h-6 w-6 text-primary animate-spin" />
        <span className="text-sm font-medium text-slate-600">Restoring your session...</span>
        <button
          type="button"
          onClick={async () => {
            setRestoring(false);
            try {
              await clerk.signOut();
            } catch {
              // ignore — we're showing the manual login form either way
            }
          }}
          className="text-xs text-primary hover:text-primary-hover font-semibold mt-2"
        >
          Taking too long? Sign in manually
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center md:text-left mb-6">
        <h2 className="text-xl font-bold text-slate-900">Sign in to console</h2>
        <p className="text-sm text-slate-500 mt-1">Enter your tenant administrator credentials</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Corporate Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              type="email"
              placeholder="name@company.com"
              className="pl-9"
              error={!!errors.email}
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-destructive mt-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Password
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••••"
              className="pl-9 pr-10"
              error={!!errors.password}
              {...register('password', {
                onChange: (e) => setPasswordValue(e.target.value),
              })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-hidden"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive mt-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {errors.password.message}
            </p>
          )}

          {/* Password Strength Indicator */}
          {passwordValue && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                <span>Password Strength</span>
                <span className="font-semibold text-slate-700">
                  {strengthScore === 4
                    ? 'Strong'
                    : strengthScore === 3
                    ? 'Medium'
                    : 'Weak'}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1 h-1">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-full rounded-full transition-all duration-300 ${
                      strengthScore >= step
                        ? strengthScore === 4
                          ? 'bg-success'
                          : strengthScore === 3
                          ? 'bg-amber-500'
                          : 'bg-destructive'
                        : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end text-xs">
          <a
            href="/auth/forgot-password"
            className="text-primary hover:text-primary-hover font-semibold transition-colors"
          >
            Forgot your password?
          </a>
        </div>

        {/* Submit */}
        <Button type="submit" className="w-full" loading={loading}>
          Continue
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-slate-500 font-medium">Or Authenticate With</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleSignIn}
        className="w-full flex items-center justify-center gap-2"
        loading={googleLoading}
      >
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6 29.6 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35.1 26.8 36 24 36c-5.3 0-9.6-3.1-11.3-7.6l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 2.8-2.8 5.1-5.1 6.6l6.3 5.3C39.9 37.1 44 31.5 44 24c0-1.3-.1-2.7-.4-3.5z" />
        </svg>
        Sign in with Google
      </Button>

      <p className="text-xs text-center text-slate-500 mt-6">
        New employee accounts are provisioned by your administrator — contact them for access.
      </p>
    </div>
  );
}
