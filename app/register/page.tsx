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
  company_name: zod
    .string()
    .trim()
    .min(2, 'Company name is required')
    .max(100, 'Company name is too long'),
  contact_name: zod
    .string()
    .trim()
    .min(2, 'Please enter your full name')
    .max(60, 'Name is too long')
    .regex(/^[A-Za-z][A-Za-z .'-]*$/, 'Name can only contain letters, spaces, . - and \''),
  contact_email: zod
    .string()
    .trim()
    .min(1, 'Work email is required')
    .email('Enter a valid email address (e.g. abc@company.com)')
    .max(120, 'Email is too long'),
  contact_mobile: zod
    .string()
    .trim()
    .optional()
    .refine(
      (v) => !v || /^6\d{9}$/.test(v),
      'Mobile number must start with 6 and be 10 digits.',
    ),
  designation: zod
    .string()
    .trim()
    .optional()
    .refine(
      (v) => !v || /^[A-Za-z][A-Za-z .&/'-]{1,49}$/.test(v),
      'Designation can only contain letters (no numbers)',
    ),
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
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 text-primary mb-3">
            <span className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide">Register Your Company</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1.5">Get Started With Workmate Shield</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            We&apos;d be glad to welcome your organization. Please share a few details below, and we&apos;ll
            send a secure setup link to your work email so you can complete onboarding in just a few minutes.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name <span className="text-destructive">*</span></label>
            <Input maxLength={100} placeholder="Please enter your company name" error={!!errors.company_name} {...register('company_name')} />
            {errors.company_name && <p className="text-xs text-destructive mt-1">{errors.company_name.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person <span className="text-destructive">*</span></label>
            <Input maxLength={60} placeholder="Please enter your full name" error={!!errors.contact_name} {...register('contact_name')} />
            {errors.contact_name && <p className="text-xs text-destructive mt-1">{errors.contact_name.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email <span className="text-destructive">*</span></label>
            <Input type="email" placeholder="abc@company.com" error={!!errors.contact_email} {...register('contact_email')} />
            {errors.contact_email ? (
              <p className="text-xs text-destructive mt-1">{errors.contact_email.message}</p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">We&apos;ll send your secure setup link to this address.</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number</label>
              <Input
                inputMode="numeric"
                maxLength={10}
                placeholder="Please enter your mobile number"
                error={!!errors.contact_mobile}
                {...register('contact_mobile')}
                onChange={(e) => {
                  // Allow digits only, hard-capped at 10.
                  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  register('contact_mobile').onChange(e);
                }}
              />
              {errors.contact_mobile && <p className="text-xs text-destructive mt-1">{errors.contact_mobile.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
              <Input
                maxLength={50}
                placeholder="Please enter your designation"
                error={!!errors.designation}
                {...register('designation')}
                onChange={(e) => {
                  // Letters and basic punctuation only - strip any digits.
                  e.target.value = e.target.value.replace(/[0-9]/g, '');
                  register('designation').onChange(e);
                }}
              />
              {errors.designation && <p className="text-xs text-destructive mt-1">{errors.designation.message}</p>}
            </div>
          </div>
          <Button type="submit" className="w-full" loading={loading}>
            Submit
          </Button>
          <p className="text-[11px] text-center text-slate-400">
            No credit card required. Your details stay private and are used only to set up your account.
          </p>
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
