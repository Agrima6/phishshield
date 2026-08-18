'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
          <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">New password</label>
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm new password</label>
          <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} />
        </div>
        <Button type="submit" className="w-full" loading={loading}>
          Set password &amp; continue
        </Button>
      </form>
    </div>
  );
}
