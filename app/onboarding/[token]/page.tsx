'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, Upload, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function OnboardingPage() {
  const params = useParams();
  const token = params.token as string;

  const [phase, setPhase] = useState<'loading' | 'error' | 'form' | 'submitted'>('loading');
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#7a1220');
  const [logoUrl, setLogoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.registration
      .getOnboarding(token)
      .then((res) => {
        setCompanyName(res.company_name);
        setPhase('form');
      })
      .catch(() => setPhase('error'));
  }, [token]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.registration.uploadLogo(token, file);
      setLogoUrl(res.url);
    } catch (err: any) {
      toast.error(err?.message || 'Logo upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      toast.error('Headquarters address is required.');
      return;
    }
    setSubmitting(true);
    try {
      await api.registration.submitOnboarding(token, {
        address,
        gst_number: gstNumber,
        employee_count: employeeCount,
        logo_url: logoUrl,
        primary_color: primaryColor,
      });
      setPhase('submitted');
    } catch (err: any) {
      toast.error(err?.message || 'Could not submit onboarding.');
    } finally {
      setSubmitting(false);
    }
  };

  if (phase === 'loading') {
    return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Loading your onboarding...</div>;
  }

  if (phase === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-3" />
          <h1 className="text-lg font-bold text-slate-900 mb-2">This link isn&apos;t valid</h1>
          <p className="text-sm text-slate-500">It may have expired or already been used.</p>
        </div>
      </div>
    );
  }

  if (phase === 'submitted') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Onboarding submitted</h1>
          <p className="text-sm text-slate-500">Our team will review your submission and get back to you shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <h1 className="text-xl font-bold text-slate-900 mb-1">Finish onboarding {companyName}</h1>
        <p className="text-sm text-slate-500 mb-6">A few more details, then your submission goes to review.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Headquarters address *</label>
            <Input placeholder="Street, city, state, postal code" value={address} onChange={(e) => setAddress(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">GST / registration number</label>
              <Input placeholder="Optional" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Number of employees</label>
              <Input placeholder="e.g. 50" value={employeeCount} onChange={(e) => setEmployeeCount(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Company logo</label>
            <div className="flex items-center gap-3">
              {logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Logo preview" className="h-12 w-12 rounded-lg object-cover border border-slate-200" />
              )}
              <label className="flex items-center gap-2 text-sm text-slate-600 border border-dashed border-slate-300 rounded-lg px-3 py-2 cursor-pointer hover:border-primary transition-colors">
                <Upload className="h-4 w-4" />
                {uploading ? 'Uploading...' : logoUrl ? 'Change logo' : 'Choose a file'}
                <input type="file" accept=".png,.jpg,.jpeg,.gif,.webp,.svg" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Brand color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-14 rounded-md border border-slate-200 cursor-pointer"
              />
              <span className="text-sm text-slate-500">{primaryColor}</span>
            </div>
          </div>

          <Button type="submit" className="w-full" loading={submitting}>
            Submit for review
          </Button>
        </form>
      </div>
    </div>
  );
}
