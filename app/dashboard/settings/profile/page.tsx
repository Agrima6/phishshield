'use client';

import React, { useState, useEffect } from 'react';
import { User, Shield, KeyRound, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useSession } from '@/hooks/use-session';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { username, role } = useSession();
  const [profile, setProfile] = useState({
    name: 'Administrator',
    email: '',
    phone: '+1 (555) 019-2834',
    mfaEnabled: true
  });

  useEffect(() => {
    setProfile(prev => ({ ...prev, email: username }));
  }, [username]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Administrator profile information saved successfully.');
  };

  const handleRotateMFASecret = () => {
    toast.success('MFA secret keys regenerated. Scan the new QR code in your Authenticator app.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">Profile Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage admin password credentials and active multi-factor authentication tokens.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Form: Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>Primary administrator account contact data</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 mb-1">Display Name</label>
                  <Input 
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Corporate Email</label>
                  <Input 
                    disabled
                    value={profile.email}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Phone Number (SMS alerts)</label>
                <Input 
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>

              <Button type="submit" size="sm">
                Save Profile
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right Form: MFA status */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Factor Authentication</CardTitle>
              <CardDescription>MFA tokens protect administrative actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield className="h-4.5 w-4.5 text-green-600 shrink-0" />
                  <span className="font-semibold">MFA Protection Active</span>
                </div>
                <Badge variant="success">Verified</Badge>
              </div>

              <p className="text-slate-500 font-medium leading-relaxed">
                MFA is mandated by corporate policy for all administrator roles on this workspace tenant.
              </p>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRotateMFASecret}
                className="w-full flex items-center justify-center gap-1.5"
              >
                <KeyRound className="h-4 w-4" /> Rotate Authenticator Secret
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
