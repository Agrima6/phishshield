'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const schema = zod.object({
  company_name: zod.string().min(1, 'Company name is required'),
  contact_name: zod.string().min(1, 'Contact person is required'),
  contact_email: zod.string().email('Enter a valid email address'),
  contact_mobile: zod.string().optional(),
  designation: zod.string().optional(),
});

type FormValues = zod.infer<typeof schema>;

export default function RegisterPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      await api.registration.register(data);
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err?.message || 'Could not submit registration.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Registration received</h1>
          <p className="text-sm text-slate-500">
            We&apos;ve emailed you a link to finish your organization&apos;s onboarding - check your inbox.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6 py-16">
      <div className="max-w-lg w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="flex items-center gap-2 text-primary mb-2">
          <ShieldCheck className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wide">Register your company</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-1">Get started with Workmate Shield</h1>
        <p className="text-sm text-slate-500 mb-6">Tell us a bit about your company - we&apos;ll email you a link to finish setup.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Company name</label>
            <Input placeholder="Acme Inc." error={!!errors.company_name} {...register('company_name')} />
            {errors.company_name && <p className="text-xs text-destructive mt-1">{errors.company_name.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contact person</label>
            <Input placeholder="Jane Doe" error={!!errors.contact_name} {...register('contact_name')} />
            {errors.contact_name && <p className="text-xs text-destructive mt-1">{errors.contact_name.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Work email</label>
            <Input type="email" placeholder="jane@acme.com" error={!!errors.contact_email} {...register('contact_email')} />
            {errors.contact_email && <p className="text-xs text-destructive mt-1">{errors.contact_email.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile number</label>
              <Input placeholder="+1 555 123 4567" {...register('contact_mobile')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
              <Input placeholder="IT Director" {...register('designation')} />
            </div>
          </div>
          <Button type="submit" className="w-full" loading={loading}>
            Submit registration
          </Button>
        </form>

        <p className="text-xs text-center text-slate-500 mt-6">
          Already onboarded?{' '}
          <a href="/auth/login" className="text-primary hover:text-primary-hover font-semibold">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
