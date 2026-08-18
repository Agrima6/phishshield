'use client';

import React, { useState, useEffect } from 'react';
import { Key, ShieldCheck, Info, UserCheck, UserPlus, Mail, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  must_change_password: boolean;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  operator: 'Campaign Operator',
  auditor: 'Auditor',
  template_author: 'Template Author',
};

function TeamMembersCard() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'operator' });

  const loadTeam = async () => {
    setLoading(true);
    try {
      setTeam(await api.team.list());
    } catch (err: any) {
      toast.error('Failed to load team: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Name and email are required.');
      return;
    }
    setInviting(true);
    try {
      const result = await api.team.invite(form);
      if (result.email_warning) {
        toast.warning(result.email_warning);
      } else {
        toast.success(`${form.name} added. Login details sent to ${form.email}.`);
      }
      setForm({ name: '', email: '', role: 'operator' });
      loadTeam();
    } catch (err: any) {
      toast.error('Failed to add team member: ' + err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (member: TeamMember) => {
    if (!window.confirm(`Remove ${member.name} (${member.email}) from your team?`)) return;
    setRemovingId(member.id);
    try {
      await api.team.remove(member.id);
      toast.success(`${member.name} removed.`);
      loadTeam();
    } catch (err: any) {
      toast.error('Failed to remove: ' + err.message);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-primary" /> Team Members
        </CardTitle>
        <CardDescription className="text-xs">
          Add colleagues to your workspace with a specific role. They&apos;ll get an email with login details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleInvite} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
          <Input placeholder="Priya Patel" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input type="email" placeholder="priya@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <select
            className="h-10 rounded-md border border-border bg-background px-3 text-sm"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="operator">Campaign Operator</option>
            <option value="auditor">Auditor</option>
            <option value="template_author">Template Author</option>
            <option value="admin">Admin</option>
          </select>
          <Button type="submit" loading={inviting}>
            <UserPlus className="h-4 w-4 mr-1.5" /> Add
          </Button>
        </form>

        {loading ? (
          <div className="flex items-center gap-2 text-xs text-slate-400 py-6 justify-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Loading team...
          </div>
        ) : team.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No team members yet, add one above.</p>
        ) : (
          <div className="space-y-2">
            {team.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-2.5 border border-slate-200 rounded-lg text-xs">
                <div>
                  <div className="font-semibold text-slate-800">{m.name}</div>
                  <div className="text-slate-400 flex items-center gap-1.5">
                    <Mail className="h-3 w-3" /> {m.email}
                    {m.must_change_password && <Badge variant="warning" className="text-[9px] ml-1">Pending first login</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="info" className="text-[10px]">{ROLE_LABELS[m.role] || m.role}</Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-destructive" loading={removingId === m.id} onClick={() => handleRemove(m)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function RolesPage() {
  const [permissions, setPermissions] = useState({
    admin: { campaign_create: true, campaign_delete: true, sso_write: true, logs_read: true, employees_write: true },
    auditor: { campaign_create: false, campaign_delete: false, sso_write: false, logs_read: true, employees_write: false },
    operator: { campaign_create: true, campaign_delete: false, sso_write: false, logs_read: true, employees_write: true }
  });

  const handleToggle = (role: 'admin' | 'auditor' | 'operator', key: keyof typeof permissions.admin) => {
    if (role === 'admin') {
      toast.warning('Super Administrator roles permissions are static and cannot be modified.');
      return;
    }
    
    setPermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [key]: !prev[role][key]
      }
    }));
    toast.success('Permissions matrix updated. Access policies synced.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">Roles & Permissions</h1>
        <p className="text-sm text-slate-500 mt-0.5">Control tenant administration scopes and grant granular security privileges.</p>
      </div>

      <TeamMembersCard />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Summary Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Access Control Policy</CardTitle>
              <CardDescription>Role-based access matrix rules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs leading-relaxed text-slate-600">
              <div className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <Info className="h-4.5 w-4.5 text-slate-500 shrink-0 mt-0.5" />
                <p>
                  Any alterations to operator or auditor credentials immediately log to the SOC-2 immutable Audit Ledger.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="danger">Super Admin</Badge>
                  <span className="font-semibold text-slate-700">Full tenant CRUD capabilities.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="info">Campaign Operator</Badge>
                  <span className="font-semibold text-slate-700">Access to setup simulation runs only.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Auditor</Badge>
                  <span className="font-semibold text-slate-700">Read-only audit trail logging access.</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Permission Matrix Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Permissions Matrix</CardTitle>
            <CardDescription>Tick checkbox targets to toggle administrative capabilities</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Capability Name</TableHead>
                  <TableHead>Super Admin</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Auditor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { key: 'campaign_create', name: 'Setup/Launch Phishing Campaigns' },
                  { key: 'campaign_delete', name: 'Delete Phishing Campaigns' },
                  { key: 'sso_write', name: 'Modify SSO Credentials & Branding' },
                  { key: 'employees_write', name: 'Add/Import Employee Lists' },
                  { key: 'logs_read', name: 'Access Audit Ledger Registry' }
                ].map((item) => (
                  <TableRow key={item.key}>
                    <TableCell className="font-semibold text-slate-800 text-xs">{item.name}</TableCell>
                    <TableCell>
                      <input 
                        type="checkbox" 
                        checked={permissions.admin[item.key as keyof typeof permissions.admin]}
                        onChange={() => handleToggle('admin', item.key as keyof typeof permissions.admin)}
                        className="accent-primary h-4 w-4 cursor-pointer"
                      />
                    </TableCell>
                    <TableCell>
                      <input 
                        type="checkbox" 
                        checked={permissions.operator[item.key as keyof typeof permissions.admin]}
                        onChange={() => handleToggle('operator', item.key as keyof typeof permissions.admin)}
                        className="accent-primary h-4 w-4 cursor-pointer"
                      />
                    </TableCell>
                    <TableCell>
                      <input 
                        type="checkbox" 
                        checked={permissions.auditor[item.key as keyof typeof permissions.admin]}
                        onChange={() => handleToggle('auditor', item.key as keyof typeof permissions.admin)}
                        className="accent-primary h-4 w-4 cursor-pointer"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
