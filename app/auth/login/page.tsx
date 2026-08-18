'use client';

import React, { useState, Suspense } from 'react';
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
  email: zod.string().min(1, 'Username or email is required'),
  password: zod.string().min(1, 'Password is required'),
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
  const { login } = useSession();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    try {
      const res = await api.auth.login(data.email, data.password);
      login(res.token, res.email, res.role, res.tenant_id, res.tenant_id === 'default' ? 'Default Tenant' : res.name, res.name);
      toast.success('Signed in successfully.');
      if (res.must_change_password) {
        router.push('/auth/change-password');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center md:text-left mb-6">
        <h2 className="text-xl font-bold text-slate-900">Sign in to console</h2>
        <p className="text-sm text-slate-500 mt-1">Enter your administrator credentials</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Email or username</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              type="text"
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
          Continue
        </Button>
      </form>

      <p className="text-xs text-center text-slate-500 mt-6">
        Don&apos;t have an organization account yet?{' '}
        <a href="/register" className="text-primary hover:text-primary-hover font-semibold">
          Register your company
        </a>
      </p>
    </div>
  );
}
