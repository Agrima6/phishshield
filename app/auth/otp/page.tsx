'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { useSession } from '@/hooks/use-session';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function OtpPage() {
  const router = useRouter();
  const { login } = useSession();
  const [code, setCode] = useState<string[]>(new Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('admin@provana.com');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // 1. Check if SSO query parameters are present in URL
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    const emailParam = params.get('email');
    const roleParam = params.get('role');
    const tenantParam = params.get('tenant');
    const tenantNameParam = params.get('tenant_name');

    if (tokenParam && emailParam) {
      // Direct login for SSO (MFA is verified on Microsoft Azure Entra ID's end)
      login(
        tokenParam,
        emailParam,
        roleParam || 'admin',
        tenantParam || 'provana',
        tenantNameParam || 'Provana Corp'
      );
      toast.success('Successfully authenticated via Single Sign-On.');
      router.push('/');
      return;
    }

    // 2. Normal email/password flow
    const tempEmail = localStorage.getItem('temp_login_email');
    if (tempEmail) {
      setEmail(tempEmail);
    }
  }, [login, router]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    const value = element.value.replace(/[^0-9]/g, '');
    if (!value) return;

    const nextCode = [...code];
    nextCode[index] = value.substring(value.length - 1);
    setCode(nextCode);

    // Auto tab focus to next box
    if (index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const nextCode = [...code];
      if (!code[index] && index > 0) {
        // Clear previous input and move focus back
        nextCode[index - 1] = '';
        setCode(nextCode);
        inputRefs.current[index - 1]?.focus();
      } else {
        nextCode[index] = '';
        setCode(nextCode);
      }
    }
  };

  const handleVerify = () => {
    setLoading(true);
    setTimeout(() => {
      const token = localStorage.getItem('temp_session_token');
      const role = localStorage.getItem('temp_session_role') || 'admin';
      const tenant = localStorage.getItem('temp_session_tenant') || 'provana';
      const tenantName = localStorage.getItem('temp_session_tenant_name') || 'Provana Corp';

      if (!token) {
        toast.error('Authentication session expired. Please log in again.');
        router.push('/auth/login');
        return;
      }

      login(token, email, role, tenant, tenantName);
      
      // Clean up temp values
      localStorage.removeItem('temp_login_email');
      localStorage.removeItem('temp_session_token');
      localStorage.removeItem('temp_session_role');
      localStorage.removeItem('temp_session_tenant');
      localStorage.removeItem('temp_session_tenant_name');
      
      toast.success('Authenticator MFA code verified successfully!');
      router.push('/');
    }, 1200);
  };

  const codeFilled = code.every((val) => val !== '');

  return (
    <div>
      <button
        onClick={() => router.push('/auth/login')}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to credentials
      </button>

      <div className="text-center md:text-left mb-6">
        <div className="inline-flex items-center justify-center p-2 rounded-lg bg-amber-50 text-amber-600 mb-3">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 font-sans">Multi-Factor Verification</h2>
        <p className="text-sm text-slate-500 mt-1">
          We sent a verification code to <span className="font-semibold text-slate-700">{email}</span>.
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between gap-2">
          {code.map((data, index) => (
            <input
              key={index}
              type="text"
              name={`otp-${index}`}
              maxLength={1}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              value={data}
              onChange={(e) => handleChange(e.target, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="w-12 h-12 text-center text-lg font-bold border border-slate-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 outline-hidden transition-all bg-slate-50"
            />
          ))}
        </div>

        <Button
          onClick={handleVerify}
          className="w-full"
          disabled={!codeFilled}
          loading={loading}
        >
          Verify Authenticator Code
        </Button>

        <p className="text-xs text-center text-slate-500">
          Didn&apos;t receive the email code?{' '}
          <button className="text-primary hover:text-primary-hover font-semibold transition-colors focus:outline-hidden cursor-pointer">
            Resend Code
          </button>
        </p>
      </div>
    </div>
  );
}
