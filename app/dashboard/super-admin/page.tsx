'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@/hooks/use-session';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { ShieldCheck, Building, Plus, Mail, Key, ShieldAlert, Globe, Calendar, Send, Users, MousePointerClick, UserPlus, Trash2 } from 'lucide-react';

interface TenantStats {
  id: string;
  name: string;
  domains: string[];
  created_at: string;
  campaigns_count: number;
  users_count: number;
  clicks_count: number;
}

interface AllowlistEntry {
  id: string;
  identifier: string;
  created_at: number;
}

export default function SuperAdminPage() {
  const { tenant } = useSession();
  const [tenantsList, setTenantsList] = useState<TenantStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // New Tenant Form State
  const [formData, setFormData] = useState({
    tenant_id: '',
    name: '',
    domain: '',
    admin_email: '',
    admin_password: '',
  });

  const [allowlist, setAllowlist] = useState<AllowlistEntry[]>([]);
  const [allowlistLoading, setAllowlistLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  const loadAllowlist = async () => {
    setAllowlistLoading(true);
    try {
      const data = await api.admin.allowlist.list();
      setAllowlist(data);
    } catch (err: any) {
      toast.error('Failed to load authorized sign-up emails: ' + err.message);
    } finally {
      setAllowlistLoading(false);
    }
  };

  useEffect(() => {
    loadAllowlist();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await api.admin.allowlist.add(inviteEmail.trim());
      toast.success(`${inviteEmail.trim()} can now create an account.`);
      setInviteEmail('');
      loadAllowlist();
    } catch (err: any) {
      toast.error('Failed to authorize email: ' + err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleRevoke = async (id: string, identifier: string) => {
    try {
      await api.admin.allowlist.remove(id);
      toast.success(`Revoked access for ${identifier}.`);
      loadAllowlist();
    } catch (err: any) {
      toast.error('Failed to revoke: ' + err.message);
    }
  };

  const loadTenants = async () => {
    if (tenant !== 'default') return;
    setLoading(true);
    try {
      const data = await api.admin.tenants.list();
      setTenantsList(data);
    } catch (err: any) {
      toast.error('Failed to load tenants directory: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, [tenant]);

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tenant_id || !formData.name || !formData.admin_email || !formData.admin_password) {
      toast.error('Please fill in all required onboarding fields.');
      return;
    }

    setSubmitting(true);
    try {
      const domains = formData.domain ? [formData.domain.trim()] : [];
      await api.admin.tenants.create({
        tenant_id: formData.tenant_id.trim().toLowerCase(),
        name: formData.name.trim(),
        domains,
        admin_email: formData.admin_email.trim(),
        admin_password: formData.admin_password,
      });

      toast.success(`Tenant ${formData.name} onboarded successfully! Share credentials with the client.`);
      
      // Reset form
      setFormData({
        tenant_id: '',
        name: '',
        domain: '',
        admin_email: '',
        admin_password: '',
      });
      
      loadTenants();
    } catch (err: any) {
      toast.error('Failed to onboard tenant: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (tenant !== 'default') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4">
        <ShieldAlert className="h-16 w-16 text-destructive animate-pulse" />
        <h2 className="text-xl font-bold text-slate-800 font-sans">Access Restricted</h2>
        <p className="text-sm max-w-md text-center">
          Only the Super Administrator of the Workmate Shield SaaS Platform is authorized to access the onboarded tenant directory.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-amber-500 text-slate-950">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">Super Admin SaaS Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Onboard client workspaces, monitor tenant engagement, and control database partitions.</p>
        </div>
      </div>

      {/* Authorized Sign-Up Emails */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" /> Authorized Sign-Up Emails
          </CardTitle>
          <CardDescription className="text-xs">
            Public sign-up is disabled — only emails added here can create an account. Add a colleague&apos;s
            work email below, and they&apos;ll be able to register themselves at the sign-up page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
              <Input
                type="email"
                required
                placeholder="colleague@yourcompany.com"
                className="pl-9"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <Button type="submit" loading={inviting} className="shrink-0">
              <Plus className="h-4 w-4 mr-1.5" /> Authorize
            </Button>
          </form>

          {allowlistLoading ? (
            <div className="flex items-center gap-2 text-xs text-slate-400 py-4">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Loading authorized emails...
            </div>
          ) : allowlist.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No emails authorized yet — add one above to let them sign up.</p>
          ) : (
            <div className="space-y-2">
              {allowlist.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-2.5 border border-slate-200 rounded-lg text-xs">
                  <span className="font-semibold text-slate-800">{entry.identifier}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-destructive" onClick={() => handleRevoke(entry.id, entry.identifier)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

        {/* Onboarding Form */}
        <Card className="xl:col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Building className="h-4 w-4 text-primary" /> Onboard New Tenant Workspace
            </CardTitle>
            <CardDescription className="text-xs">
              Provision a new isolated database partition and seed the initial corporate admin identity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleOnboard} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 mb-1">Company Workspace Name</label>
                <Input 
                  required
                  placeholder="e.g. Peardo International"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Unique Tenant ID (slug)</label>
                <Input 
                  required
                  placeholder="e.g. peardo"
                  value={formData.tenant_id}
                  onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                />
                <span className="text-[10px] text-slate-400 font-normal mt-1 block">
                  Lowercase letters, numbers, and hyphens only.
                </span>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Primary Routing Domain (Optional)</label>
                <Input 
                  placeholder="e.g. peardo.com"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                />
              </div>

              <div className="border-t border-slate-100 pt-4 mt-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-2 font-bold">
                  Corporate Admin Credentials
                </span>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-700 mb-1">Admin Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                      <Input 
                        required
                        type="email"
                        placeholder="admin@peardo.com"
                        className="pl-9"
                        value={formData.admin_email}
                        onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1">Initial Password</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                      <Input 
                        required
                        type="password"
                        placeholder="••••••••••••"
                        className="pl-9"
                        value={formData.admin_password}
                        onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full mt-4" loading={submitting}>
                <Plus className="h-4 w-4 mr-2" /> Onboard Tenant
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Tenants List */}
        <Card className="xl:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" /> Active SaaS Tenant Registry
            </CardTitle>
            <CardDescription className="text-xs">
              Live statistics and audit engagement metrics across all tenant partitions.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-xs gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span>Loading tenant telemetry...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant Workspace</TableHead>
                    <TableHead>Mapped Domains</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-center">Campaigns</TableHead>
                    <TableHead className="text-center">Users</TableHead>
                    <TableHead className="text-center">Clicks Tracked</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenantsList.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="py-3">
                        <div className="font-semibold text-slate-900">{t.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{t.id}</div>
                      </TableCell>
                      <TableCell className="text-slate-600 max-w-[150px] truncate">
                        {t.domains.length > 0 ? (
                          t.domains.map((dom) => (
                            <Badge key={dom} variant="secondary" className="mr-1 text-[10px]">
                              {dom}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 font-normal italic">None</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-500 text-xs py-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{t.created_at ? new Date(t.created_at).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-3">
                        <Badge variant="info" className="flex items-center justify-center gap-1 mx-auto w-12 text-[10px]">
                          <Send className="h-3 w-3 shrink-0" /> {t.campaigns_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center py-3">
                        <Badge variant="success" className="flex items-center justify-center gap-1 mx-auto w-12 text-[10px]">
                          <Users className="h-3 w-3 shrink-0" /> {t.users_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center py-3">
                        <Badge variant={t.clicks_count > 0 ? 'danger' : 'secondary'} className="flex items-center justify-center gap-1 mx-auto w-12 text-[10px]">
                          <MousePointerClick className="h-3 w-3 shrink-0" /> {t.clicks_count}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {tenantsList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-slate-400 text-xs">
                        No client tenants configured in SaaS portal.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
