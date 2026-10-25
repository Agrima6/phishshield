'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, Upload, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { toast } from 'sonner';

// Standard 15-character Indian GSTIN: 2 state digits, 5 PAN letters, 4 digits,
// 1 PAN letter, 1 entity digit/letter, fixed 'Z', 1 checksum char.
const GST_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const isGstValid = (v: string) => GST_RE.test(v.trim().toUpperCase());

export default function OnboardingPage() {
  const params = useParams();
  const token = params.token as string;

  const [phase, setPhase] = useState<'loading' | 'error' | 'form' | 'submitted'>('loading');
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMobile, setContactMobile] = useState('');
  const [designation, setDesignation] = useState('');
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
        setContactName(res.contact_name || '');
        setContactEmail(res.contact_email || '');
        setContactMobile(res.contact_mobile || '');
        setDesignation(res.designation || '');
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
      toast.error('Company registered address is required.');
      return;
    }
    if (gstNumber.trim() && !isGstValid(gstNumber)) {
      toast.error('Please enter a valid 15-character GSTIN, or leave it blank.');
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

  const gstEntered = gstNumber.trim().length > 0;
  const gstOk = !gstEntered || isGstValid(gstNumber);

  const readOnlyInfo: [string, string][] = [
    ['Company', companyName],
    ['Contact person', contactName || '—'],
    ['Work email', contactEmail || '—'],
    ['Mobile', contactMobile || '—'],
    ['Designation', designation || '—'],
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-t-2xl border border-b-0 border-slate-200 shadow-sm px-8 pt-8 pb-5">
          <div className="flex items-center gap-2 text-primary mb-2">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wide">Company onboarding</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Finish onboarding {companyName}</h1>
          <p className="text-sm text-slate-500">
            Confirm your details and add a few company specifics. Your submission then goes to our team for review.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-b-2xl border border-slate-200 shadow-sm px-8 pb-8 pt-6 space-y-6">
          {/* Pre-filled identity (read-only) */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-sm font-bold text-slate-800">Your details</h2>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">From registration</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {readOnlyInfo.map(([label, val]) => (
                <div key={label}>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</label>
                  <div className="text-sm text-slate-500 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 truncate cursor-not-allowed" title={val}>
                    {val}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              These were captured when you registered and can&apos;t be edited here. Need a change? Contact our team after review.
            </p>
          </div>

          {/* New company details */}
          <div className="border-t border-slate-100 pt-5">
            <h2 className="text-sm font-bold text-slate-800 mb-1">Company details</h2>
            <p className="text-[11px] text-slate-400 mb-4">
              <span className="text-destructive font-semibold">*</span> required. Other fields are optional but help us set up your account.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company registered address <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="Registered office address as on your incorporation / GST certificate"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Please enter your company&apos;s official registered address — not a branch or personal address.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    GST / registration number <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <Input
                    placeholder="e.g. 29ABCDE1234F1Z5"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                    error={gstEntered && !gstOk}
                    maxLength={15}
                  />
                  {gstEntered && !gstOk ? (
                    <p className="text-[11px] text-destructive mt-1">Enter a valid 15-character GSTIN (e.g. 29ABCDE1234F1Z5).</p>
                  ) : gstEntered && gstOk ? (
                    <p className="text-[11px] text-emerald-600 mt-1">Looks like a valid GSTIN format.</p>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-1">15-character GSTIN, if your company has one.</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Number of employees <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <Input
                    type="number"
                    min={1}
                    placeholder="e.g. 50"
                    value={employeeCount}
                    onChange={(e) => setEmployeeCount(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company logo <span className="text-slate-400 font-normal">(optional)</span>
                </label>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Brand color <span className="text-slate-400 font-normal">(optional)</span>
                </label>
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
