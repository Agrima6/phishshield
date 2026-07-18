'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { KeyRound, Mail, Eye, EyeOff, AlertTriangle } from 'lucide-react';
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
  const router = useRouter();
  const { login } = useSession();
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');
  const [ssoLoading, setSsoLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@provana.com',
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

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    try {
      // 1. Submit email and password to Flask auth login endpoint
      const res = await api.auth.login(data.email, data.password);
      
      // 2. Credentials verified, temporarily store for the OTP step
      localStorage.setItem('temp_login_email', data.email);
      localStorage.setItem('temp_session_token', res.token);
      localStorage.setItem('temp_session_role', res.role);
      localStorage.setItem('temp_session_tenant', res.tenant_id);
      localStorage.setItem('temp_session_tenant_name', res.tenant_name);

      toast.success('Credentials verified. Proceeding to OTP authentication.');
      router.push('/auth/otp');
    } catch (err: any) {
      toast.error(err.message || 'Invalid corporate email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSSOLogin = () => {
    setSsoLoading(true);
    
    // Resolve tenant from the email input field to initiate tenant-specific SSO
    const emailInput = (document.querySelector('input[type="email"]') as HTMLInputElement)?.value || '';
    let tenantId = 'provana';
    if (emailInput.includes('@hero.')) {
      tenantId = 'hero';
    } else if (emailInput.includes('@default.')) {
      tenantId = 'default';
    }
    
    toast.loading('Redirecting to Microsoft Entra ID SSO...');
    
    // Redirect browser to flask backend auth OIDC login endpoint
    window.location.href = `http://localhost:8000/api/auth/sso/login?tenant=${tenantId}`;
  };

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
            href="/forgot-password"
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

      {/* SSO Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-slate-500 font-medium">Or Authenticate With</span>
        </div>
      </div>

      {/* Microsoft SSO OIDC Button */}
      <Button
        type="button"
        variant="outline"
        onClick={handleSSOLogin}
        className="w-full flex items-center justify-center gap-2"
        loading={ssoLoading}
      >
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 23 23">
          <path fill="#f35325" d="M1 1h10v10H1z" />
          <path fill="#81bc06" d="M12 1h10v10H12z" />
          <path fill="#05a6f0" d="M1 12h10v10H1z" />
          <path fill="#ffba08" d="M12 12h10v10H12z" />
        </svg>
        Microsoft Entra ID SSO
      </Button>
    </div>
  );
}
