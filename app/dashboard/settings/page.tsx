'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Key, 
  Mail, 
  Palette, 
  Plus, 
  Trash2, 
  Check, 
  Lock, 
  ShieldCheck, 
  PlusCircle, 
  Eye,
  EyeOff,
  Upload,
  RefreshCw
} from 'lucide-react';
import { TenantSettings, EmailConfig } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { api, API_BASE } from '@/lib/api';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Custom states
  const [activeTab, setActiveTab] = useState<'branding' | 'sso' | 'email'>('branding');
  const [smtpModalOpen, setSmtpModalOpen] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);

  // New Email Profile Form
  const [newProfile, setNewProfile] = useState({
    name: '',
    provider: 'smtp' as 'smtp' | 'sendgrid',
    host: '',
    port: 587,
    username: '',
    password: '',
    fromEmail: '',
    fromName: ''
  });

  useEffect(() => {
    setLoading(true);
    api.settings.get()
      .then((data) => {
        setSettings(data);
      })
      .catch((err) => {
        toast.error('Failed to load tenant settings: ' + err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      await api.settings.save(settings);
      toast.success('Branding and accent settings updated successfully.');
    } catch (err: any) {
      toast.error('Failed to save branding settings: ' + err.message);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;
    if (file.size > 3 * 1024 * 1024) {
      toast.error('Logo file must be under 3 MB.');
      return;
    }
    setLogoUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await api.uploadImage(formData);
      const updated = { ...settings, branding: { ...settings.branding, logoUrl: res.url } };
      setSettings(updated);
      await api.settings.save(updated);
      toast.success('Logo updated. It now appears in the dashboard and PDF reports.');
    } catch (err: any) {
      toast.error('Failed to upload logo: ' + err.message);
    } finally {
      setLogoUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!settings) return;
    const updated = { ...settings, branding: { ...settings.branding, logoUrl: '' } };
    setSettings(updated);
    try {
      await api.settings.save(updated);
      toast.success('Reverted to the default Workmate Shield logo.');
    } catch (err: any) {
      toast.error('Failed to remove logo: ' + err.message);
    }
  };

  const handleSaveSSO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      await api.settings.save(settings);
      toast.success('Microsoft Entra ID SSO configurations saved successfully.');
    } catch (err: any) {
      toast.error('Failed to save SSO settings: ' + err.message);
    }
  };

  const handleAddEmailProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings || !newProfile.name || !newProfile.fromEmail) {
      toast.error('Profile Label and Sender Email are required.');
      return;
    }

    const created: EmailConfig = {
      id: `cfg-${Date.now()}`,
      name: newProfile.name,
      provider: newProfile.provider,
      host: newProfile.provider === 'smtp' ? newProfile.host : undefined,
      port: newProfile.provider === 'smtp' ? newProfile.port : undefined,
      username: newProfile.provider === 'smtp' ? newProfile.username : undefined,
      fromEmail: newProfile.fromEmail,
      fromName: newProfile.fromName || 'Security Gateway',
      isConfigured: true,
      // Temporarily attach these properties so mapTenantSettingsToBackend maps them to api secrets
      apiKey: newProfile.provider === 'sendgrid' ? newProfile.password : undefined,
      password: newProfile.provider === 'smtp' ? newProfile.password : undefined,
    } as any;

    const updatedSettings = {
      ...settings,
      emailConfigs: [...settings.emailConfigs, created]
    };

    try {
      await api.settings.save(updatedSettings);
      setSettings(updatedSettings);
      setSmtpModalOpen(false);
      setNewProfile({
        name: '',
        provider: 'smtp',
        host: '',
        port: 587,
        username: '',
        password: '',
        fromEmail: '',
        fromName: ''
      });
      toast.success(`Sender profile "${created.name}" configured successfully!`);
    } catch (err: any) {
      toast.error('Failed to create sender profile: ' + err.message);
    }
  };

  const handleDeleteProfile = (id: string) => {
    setProfileToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteProfile = async () => {
    if (!settings || !profileToDelete) return;
    const updatedConfigs = settings.emailConfigs.filter(cfg => cfg.id !== profileToDelete);
    const updatedSettings = { ...settings, emailConfigs: updatedConfigs };
    
    try {
      await api.settings.save(updatedSettings);
      setSettings(updatedSettings);
      toast.success('Email sender configuration profile deleted.');
    } catch (err: any) {
      toast.error('Failed to delete sender profile: ' + err.message);
    } finally {
      setDeleteConfirmOpen(false);
      setProfileToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-xs gap-2">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span>Loading tenant security configurations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">Tenant Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Configure organization parameters, OIDC federations, and corporate email routing profiles.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Navigation Sidebar */}
        <Card className="lg:col-span-1">
          <CardContent className="p-3 space-y-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('branding')}
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 cursor-pointer ${
                activeTab === 'branding' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Palette className="h-4 w-4" /> Branding & Theme
            </button>
            <button
              onClick={() => setActiveTab('sso')}
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 cursor-pointer ${
                activeTab === 'sso' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Key className="h-4 w-4" /> Microsoft SSO (OIDC)
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 cursor-pointer ${
                activeTab === 'email' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Mail className="h-4 w-4" /> Custom Mail Configurations
            </button>
          </CardContent>
        </Card>

        {/* Configurations Form Container */}
        <div className="lg:col-span-3">
          {settings && (
            <>
              {/* Branding Tab */}
              {activeTab === 'branding' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Branding & Visual Customization</CardTitle>
                    <CardDescription>Customize the console logo and primary styling accent values for this tenant workspace.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <label className="block text-slate-700 mb-1">Company Logo</label>
                      <p className="text-[10px] text-slate-400 font-normal mb-2">
                        Shown in the dashboard sidebar and on PDF reports in place of the default Workmate Shield logo. Workmate Shield branding stays visible as &quot;Powered by&quot; text either way.
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-14 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={settings.branding.logoUrl ? `${API_BASE}${settings.branding.logoUrl}` : '/workmate-shield-logo.png'}
                            alt="Current logo"
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors">
                          {logoUploading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                          {logoUploading ? 'Uploading...' : 'Upload new logo'}
                          <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={logoUploading} />
                        </label>
                        {settings.branding.logoUrl && (
                          <Button type="button" variant="ghost" size="sm" onClick={handleRemoveLogo}>
                            Reset to default
                          </Button>
                        )}
                      </div>
                    </div>

                    <form onSubmit={handleSaveBranding} className="space-y-4 text-xs font-semibold">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-700 mb-1">Company Workspace Name</label>
                          <Input
                            value={settings.name}
                            onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 mb-1">Primary Color Hex Value</label>
                          <div className="flex gap-2">
                            <Input 
                              value={settings.branding.primaryColor}
                              onChange={(e) => setSettings({
                                ...settings,
                                branding: { ...settings.branding, primaryColor: e.target.value }
                              })}
                              className="font-mono"
                            />
                            <input 
                              type="color" 
                              value={settings.branding.primaryColor}
                              onChange={(e) => setSettings({
                                ...settings,
                                branding: { ...settings.branding, primaryColor: e.target.value }
                              })}
                              className="h-10 w-12 border border-slate-200 rounded-md cursor-pointer bg-transparent"
                            />
                          </div>
                        </div>
                      </div>

                      <Button type="submit" size="sm">
                        Save Branding Settings
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* SSO Tab */}
              {activeTab === 'sso' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Microsoft Entra ID SSO integration</CardTitle>
                    <CardDescription>Setup OIDC credentials to federate administrator sign-in options.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSaveSSO} className="space-y-4 text-xs font-semibold">
                      <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg">
                        <Lock className="h-4.5 w-4.5 text-amber-600 shrink-0" />
                        <span className="font-normal text-[11px] leading-relaxed">
                          Enterprise warning: Client SSO Client Secrets are stored as AES-256-GCM encrypted values at rest inside MongoDB schemas. They are masked inside settings forms to prevent key exposure.
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-700 mb-1">SSO Application (Client) ID</label>
                          <Input 
                            placeholder="849e7592-38d2-4cfb-b72e-8c3491fa1202"
                            value={settings.sso.clientId || ''}
                            onChange={(e) => setSettings({
                              ...settings,
                              sso: { ...settings.sso, clientId: e.target.value }
                            })}
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 mb-1">SSO Directory (Tenant) ID</label>
                          <Input 
                            placeholder="f87a3891-b3b4-4b55-a228-cc3929420042"
                            value={settings.sso.tenantId || ''}
                            onChange={(e) => setSettings({
                              ...settings,
                              sso: { ...settings.sso, tenantId: e.target.value }
                            })}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-700 mb-1">OIDC SSO Client Secret Key</label>
                        <div className="relative">
                          <Input 
                            type={showSecret ? 'text' : 'password'}
                            placeholder="••••••••••••••••••••••••"
                            value={settings.sso.clientSecret || ''}
                            onChange={(e) => setSettings({
                              ...settings,
                              sso: { ...settings.sso, clientSecret: e.target.value }
                            })}
                          />
                          <button
                            type="button"
                            onClick={() => setShowSecret(!showSecret)}
                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                          >
                            {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id="sso-enabled"
                          checked={settings.sso.enabled}
                          onChange={(e) => setSettings({
                            ...settings,
                            sso: { ...settings.sso, enabled: e.target.checked }
                          })}
                          className="accent-primary cursor-pointer h-4 w-4"
                        />
                        <label htmlFor="sso-enabled" className="text-slate-750 cursor-pointer select-none">
                          Enable Microsoft Entra ID Single-Sign-On option on login pages
                        </label>
                      </div>

                      <Button type="submit" size="sm">
                        Save SSO Credentials
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Custom Email configs tab */}
              {activeTab === 'email' && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle>Outgoing Email Sending Profiles</CardTitle>
                      <CardDescription>Setup SMTP or SendGrid configurations to match corporate sending domains.</CardDescription>
                    </div>
                    <Button onClick={() => setSmtpModalOpen(true)} className="flex items-center gap-1.5" size="sm">
                      <PlusCircle className="h-4 w-4" /> Add Profile
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    
                    <div className="space-y-3">
                      {settings.emailConfigs.map((cfg) => (
                        <div key={cfg.id} className="p-4 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{cfg.name}</span>
                              <Badge variant={cfg.provider === 'smtp' ? 'info' : 'warning'} className="text-[9px]">
                                {cfg.provider === 'smtp' ? 'SMTP' : 'SendGrid'}
                              </Badge>
                            </div>
                            <p className="text-slate-500 font-medium">
                              From: <span className="font-semibold text-slate-750">{cfg.fromName} &lt;{cfg.fromEmail}&gt;</span>
                            </p>
                            {cfg.provider === 'smtp' && (
                              <p className="text-[10px] text-slate-400 font-mono">Gateway: {cfg.host}:{cfg.port}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-[10px] text-green-700 font-semibold bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                              <ShieldCheck className="h-3.5 w-3.5" /> Credentials Encrypted
                            </div>
                            <button 
                              onClick={() => handleDeleteProfile(cfg.id)}
                              className="text-slate-400 hover:text-destructive p-1 rounded-sm cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {settings.emailConfigs.length === 0 && (
                        <p className="text-center py-6 text-slate-400 text-xs">
                          No custom SMTP or SendGrid sending profiles configured. Campaigns will route using system mailers.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {/* SMTP configuration creation modal */}
      <Dialog open={smtpModalOpen} onOpenChange={setSmtpModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Custom Sending Profile</DialogTitle>
            <DialogDescription>Input SMTP server addresses or SendGrid token parameters.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddEmailProfile} className="space-y-4 py-4 text-xs font-semibold">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 mb-1">Profile Name Label</label>
                <Input 
                  required
                  placeholder="e.g. SMTP HR Gateway" 
                  value={newProfile.name}
                  onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Mail Provider</label>
                <Select
                  value={newProfile.provider}
                  onChange={(e) => setNewProfile({ ...newProfile, provider: e.target.value as 'smtp' | 'sendgrid' })}
                >
                  <option value="smtp">SMTP Server</option>
                  <option value="sendgrid">SendGrid Web API</option>
                </Select>
              </div>
            </div>

            {/* Conditionally render SMTP config details */}
            {newProfile.provider === 'smtp' ? (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-slate-700 mb-1">SMTP Host URL</label>
                    <Input 
                      placeholder="smtp.office365.com" 
                      value={newProfile.host}
                      onChange={(e) => setNewProfile({ ...newProfile, host: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1">SMTP Port</label>
                    <Input 
                      type="number"
                      placeholder="587" 
                      value={newProfile.port}
                      onChange={(e) => setNewProfile({ ...newProfile, port: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 mb-1">Username / Auth Account</label>
                    <Input 
                      placeholder="alerts@sharma.com" 
                      value={newProfile.username}
                      onChange={(e) => setNewProfile({ ...newProfile, username: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1">Authentication Password</label>
                    <Input 
                      type="password"
                      placeholder="••••••••••••" 
                      value={newProfile.password}
                      onChange={(e) => setNewProfile({ ...newProfile, password: e.target.value })}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-slate-700 mb-1">SendGrid Web API Key</label>
                <Input 
                  type="password"
                  placeholder="SG.••••••••••••••••••••••••" 
                  value={newProfile.password}
                  onChange={(e) => setNewProfile({ ...newProfile, password: e.target.value })}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 mb-1">From Sender Address</label>
                <Input 
                  required
                  type="email"
                  placeholder="security-audit@sharma.com" 
                  value={newProfile.fromEmail}
                  onChange={(e) => setNewProfile({ ...newProfile, fromEmail: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-1">From Sender Display Name</label>
                <Input 
                  placeholder="IT Security Operations" 
                  value={newProfile.fromName}
                  onChange={(e) => setNewProfile({ ...newProfile, fromName: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" size="sm" onClick={() => setSmtpModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Save & Encrypt Profile
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Remove Email Configuration
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this email configuration profile? Campaigns linked to this config will default to system mailings.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={confirmDeleteProfile}>
              Remove Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
