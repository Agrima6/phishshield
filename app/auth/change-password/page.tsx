'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSession } from '@/hooks/use-session';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { username } = useSession();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState<{ current: boolean; next: boolean; confirm: boolean }>({ current: false, next: false, confirm: false });

  const newLongEnough = newPassword.length >= 8;
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const canSubmit = !!currentPassword && newLongEnough && passwordsMatch;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      await api.auth.changePassword(currentPassword, newPassword);
      toast.success('Password updated.');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err?.message || 'Could not change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center md:text-left mb-6">
        <h2 className="text-xl font-bold text-slate-900">Set a new password</h2>
        <p className="text-sm text-slate-500 mt-1">
          {username ? `Signed in as ${username}. ` : ''}
          You&apos;re using a temporary password - set your own before continuing.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Temporary password</label>
          <div className="relative">
            <Input type={show.current ? 'text' : 'password'} className="pr-10" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            <button type="button" tabIndex={-1} onClick={() => setShow((s) => ({ ...s, current: !s.current }))} aria-label={show.current ? 'Hide password' : 'Show password'} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {show.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">New password</label>
          <div className="relative">
            <Input type={show.next ? 'text' : 'password'} className="pr-10" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
            <button type="button" tabIndex={-1} onClick={() => setShow((s) => ({ ...s, next: !s.next }))} aria-label={show.next ? 'Hide password' : 'Show password'} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {show.next ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {newPassword.length > 0 && !newLongEnough && (
            <p className="text-[11px] text-destructive mt-1">Use at least 8 characters.</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm new password</label>
          <div className="relative">
            <Input type={show.confirm ? 'text' : 'password'} className="pr-10" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} error={passwordsMismatch} required minLength={8} />
            <button type="button" tabIndex={-1} onClick={() => setShow((s) => ({ ...s, confirm: !s.confirm }))} aria-label={show.confirm ? 'Hide password' : 'Show password'} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {show.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {passwordsMismatch && (
            <p className="text-[11px] text-destructive mt-1 flex items-center gap-1"><X className="h-3 w-3" /> Passwords do not match.</p>
          )}
          {passwordsMatch && (
            <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1"><Check className="h-3 w-3" /> Passwords match.</p>
          )}
        </div>
        <Button type="submit" className="w-full" loading={loading} disabled={!canSubmit}>
          Set password &amp; continue
        </Button>
      </form>
    </div>
  );
}
