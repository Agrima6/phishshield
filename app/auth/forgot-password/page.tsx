'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1200);
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center justify-center p-2 rounded-lg bg-green-50 text-green-600 mb-4">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Check your inbox</h2>
        <p className="text-sm text-slate-500 mt-2">
          We have sent a security recovery link to <span className="font-semibold text-slate-700">{email}</span>.
        </p>

        <Button
          onClick={() => router.push('/auth/login')}
          variant="outline"
          className="w-full mt-6 flex items-center justify-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Return to Login
        </Button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => router.push('/auth/login')}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
      </button>

      <div className="text-center md:text-left mb-6">
        <h2 className="text-xl font-bold text-slate-900">Reset your password</h2>
        <p className="text-sm text-slate-500 mt-1">
          Enter your corporate email address to receive a recovery magic link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Corporate Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              type="email"
              required
              placeholder="aarav@company.com"
              className="pl-9"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <Button type="submit" className="w-full" loading={loading}>
          Send Recovery Link
        </Button>
      </form>
    </div>
  );
}
