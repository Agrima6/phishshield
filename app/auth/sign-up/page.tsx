'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { KeyRound, Mail, Eye, EyeOff, AlertTriangle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useAuth, useClerk } from '@clerk/nextjs';
import { useSession } from '@/hooks/use-session';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const signUpSchema = zod.object({
  email: zod.string().email('Enter a valid email address'),
  password: zod.string().min(8, 'Password must be at least 8 characters long'),
});

type SignUpFormValues = zod.infer<typeof signUpSchema>;

export default function SignUpPage() {
  const router = useRouter();
  const { login } = useSession();
  const clerk = useClerk();
  const { getToken, isLoaded } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '' },
  });

  const completeSignIn = async () => {
    const token = await getToken();
    if (!token) {
      throw new Error('Could not obtain a session token from Clerk.');
    }
    const session = await api.auth.establishSession(token);
    login('clerk', session.email, session.role, 'default', 'Default Tenant');
    toast.success('Account created and signed in.');
    router.push('/dashboard');
  };

  const onSubmit = async (data: SignUpFormValues) => {
    if (!isLoaded) {
      toast.error('Still connecting to the authentication service — please try again in a moment.');
      return;
    }
    setLoading(true);
    try {
      const result = await clerk.client.signUp.create({
        emailAddress: data.email,
        password: data.password,
      });

      if (result.status === 'complete') {
        await clerk.setActive({ session: result.createdSessionId });
        await completeSignIn();
        return;
      }

      // This Clerk instance requires a verification code sent to the new
      // address before the account is usable.
      await clerk.client.signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
      toast.success(`Verification code sent to ${data.email}.`);
    } catch (err: any) {
      const message = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err.message || 'Failed to create account.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!isLoaded || code.length < 6) return;
    setVerifying(true);
    try {
      const result = await clerk.client.signUp.attemptEmailAddressVerification({ code });
      if (result.status !== 'complete') {
        toast.error('Verification code was not accepted.');
        return;
      }
      await clerk.setActive({ session: result.createdSessionId });
      await completeSignIn();
    } catch (err: any) {
      const message = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || 'Invalid or expired code.';
      toast.error(message);
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!isLoaded) return;
    try {
      await clerk.client.signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      toast.success('Verification code resent.');
    } catch {
      toast.error('Failed to resend code.');
    }
  };

  // Clerk mounts its Smart CAPTCHA widget into this element for custom sign-up flows.
  const captchaSlot = <div id="clerk-captcha" />;

  if (pendingVerification) {
    return (
      <div>
        <button
          onClick={() => setPendingVerification(false)}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>

        <div className="text-center md:text-left mb-6">
          <div className="inline-flex items-center justify-center p-2 rounded-lg bg-amber-50 text-amber-600 mb-3">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 font-sans">Verify your email</h2>
          <p className="text-sm text-slate-500 mt-1">Enter the 6-digit code we just emailed you.</p>
        </div>

        <div className="space-y-4">
          <Input
            type="text"
            inputMode="numeric"
            placeholder="123456"
            className="text-center tracking-[0.5em] text-lg font-bold"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
          />
          <Button onClick={handleVerify} className="w-full" disabled={code.length < 6} loading={verifying}>
            Verify & Create Account
          </Button>
          <p className="text-xs text-center text-slate-500">
            Didn&apos;t get it?{' '}
            <button onClick={handleResend} className="text-primary hover:text-primary-hover font-semibold cursor-pointer">
              Resend code
            </button>
          </p>
        </div>

        {captchaSlot}
      </div>
    );
  }

  return (
    <div>
      <div className="text-center md:text-left mb-6">
        <h2 className="text-xl font-bold text-slate-900">Create your account</h2>
        <p className="text-sm text-slate-500 mt-1">Set up administrator access to the console</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Email</label>
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

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••••"
              className="pl-9 pr-10"
              error={!!errors.password}
              {...register('password')}
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
        </div>

        <Button type="submit" className="w-full" loading={loading}>
          Create Account
        </Button>
      </form>

      {captchaSlot}

      <p className="text-xs text-center text-slate-500 mt-6">
        Already have an account?{' '}
        <a href="/auth/login" className="text-primary hover:text-primary-hover font-semibold transition-colors">
          Sign in
        </a>
      </p>
    </div>
  );
}
