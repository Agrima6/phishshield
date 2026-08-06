'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@/hooks/use-session';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { ShieldCheck, Building, Plus, Mail, Phone, Briefcase, ShieldAlert, Calendar, Send, Users, UserPlus, Trash2, Pencil, User } from 'lucide-react';

interface TenantRow {
  id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_mobile: string;
  designation: string;
  admin_email: string;
  primary_color: string;
  status: string;
  created_at: string;
  employee_count: number;
  campaign_count: number;
}

interface AllowlistEntry {
  id: string;
  identifier: string;
  created_at: number;
}

const emptyForm = {
  company_name: '',
  contact_name: '',
  contact_email: '',
  contact_mobile: '',
  designation: '',
  admin_email: '',
};

export default function SuperAdminPage() {
  const { role } = useSession();
  const [tenantsList, setTenantsList] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState(emptyForm);

  const [allowlist, setAllowlist] = useState<AllowlistEntry[]>([]);
  const [allowlistLoading, setAllowlistLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  const [editTarget, setEditTarget] = useState<TenantRow | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TenantRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isSuperAdmin = role === 'super_admin';

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

  const loadTenants = async () => {
    setLoading(true);
    try {
      const data = await api.admin.tenants.list();
      setTenantsList(data);
    } catch (err: any) {
      toast.error('Failed to load company directory: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isSuperAdmin) return;
    loadAllowlist();
    loadTenants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin]);

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

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_name || !formData.contact_email || !formData.admin_email) {
      toast.error('Company name, contact email, and admin email are required.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await api.admin.tenants.create(formData);
      if (result.invite_warning) {
        toast.warning(result.invite_warning);
      } else {
        toast.success(`${formData.company_name} onboarded. An invite was sent to ${formData.admin_email}.`);
      }
      setFormData(emptyForm);
      loadTenants();
    } catch (err: any) {
      toast.error('Failed to onboard company: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (t: TenantRow) => {
    setEditTarget(t);
    setEditForm({
      company_name: t.company_name,
      contact_name: t.contact_name || '',
      contact_email: t.contact_email,
      contact_mobile: t.contact_mobile || '',
      designation: t.designation || '',
      admin_email: t.admin_email,
    });
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    setSavingEdit(true);
    try {
      await api.admin.tenants.update(editTarget.id, editForm);
      toast.success('Company details updated.');
      setEditTarget(null);
      loadTenants();
    } catch (err: any) {
      toast.error('Failed to update company: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.admin.tenants.remove(deleteTarget.id);
      toast.success(`${deleteTarget.company_name} and all of its data were deleted.`);
      setDeleteTarget(null);
      loadTenants();
    } catch (err: any) {
      toast.error('Failed to delete company: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4">
        <ShieldAlert className="h-16 w-16 text-destructive animate-pulse" />
        <h2 className="text-xl font-bold text-slate-800 font-sans">Access Restricted</h2>
        <p className="text-sm max-w-md text-center">
          Only the Super Administrator of the Workmate Shield SaaS Platform is authorized to access the company directory.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary text-primary-foreground">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">Super Admin SaaS Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Onboard client companies, monitor engagement, and manage isolated data partitions.</p>
        </div>
      </div>

      {/* Authorized Sign-Up Emails */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" /> Authorized Sign-Up Emails
          </CardTitle>
          <CardDescription className="text-xs">
            Public sign-up is disabled, only emails added here can create an account. Add a colleague&apos;s
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
            <p className="text-xs text-slate-400 py-4 text-center">No emails authorized yet. Add one above to let them sign up.</p>
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

      {/* Onboarding Form */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Building className="h-4 w-4 text-primary" /> Onboard New Company
          </CardTitle>
          <CardDescription className="text-xs">
            Creates a fully isolated data partition for this company and invites their first admin by email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleOnboard} className="text-xs font-semibold">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label className="block text-slate-700 mb-1">Company Name</label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    required
                    placeholder="e.g. Peardo International"
                    className="pl-9"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Contact Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="e.g. Jordan Lee"
                    className="pl-9"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Contact Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    required
                    type="email"
                    placeholder="ops@peardo.com"
                    className="pl-9"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Contact Mobile Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="+1 555 123 4567"
                    className="pl-9"
                    value={formData.contact_mobile}
                    onChange={(e) => setFormData({ ...formData, contact_mobile: e.target.value })}
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-700 mb-1">Contact Designation</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="e.g. IT Director"
                    className="pl-9"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 mt-5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-2 font-bold">
                First Admin Account
              </span>
              <div className="max-w-md">
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
                <span className="text-[10px] text-slate-400 font-normal mt-1 block">
                  They&apos;ll receive an email invite to set their own password, no password is set here.
                </span>
              </div>
            </div>

            <Button type="submit" className="mt-5" loading={submitting}>
              <Plus className="h-4 w-4 mr-2" /> Onboard Company
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Company Registry */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Building className="h-4 w-4 text-primary" /> Company Directory
          </CardTitle>
          <CardDescription className="text-xs">
            Every onboarded company, with fully isolated employees, campaigns, and templates.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-xs gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Loading company directory...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Admin / Contact</TableHead>
                  <TableHead>Onboarded</TableHead>
                  <TableHead className="text-center">Employees</TableHead>
                  <TableHead className="text-center">Campaigns</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenantsList.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="py-3">
                      <div className="font-semibold text-slate-900">{t.company_name}</div>
                      <div className="text-[10px] text-slate-400">{t.designation}</div>
                    </TableCell>
                    <TableCell className="text-slate-600 text-xs py-3">
                      <div>{t.contact_name || t.admin_email}</div>
                      <div className="text-[10px] text-slate-400">{t.admin_email}</div>
                      <div className="text-[10px] text-slate-400">{t.contact_mobile || '-'}</div>
                    </TableCell>
                    <TableCell className="text-slate-500 text-xs py-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{t.created_at ? new Date(t.created_at).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-3">
                      <Badge variant="success" className="flex items-center justify-center gap-1 mx-auto w-12 text-[10px]">
                        <Users className="h-3 w-3 shrink-0" /> {t.employee_count}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center py-3">
                      <Badge variant="info" className="flex items-center justify-center gap-1 mx-auto w-12 text-[10px]">
                        <Send className="h-3 w-3 shrink-0" /> {t.campaign_count}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-primary" onClick={() => openEdit(t)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-destructive" onClick={() => setDeleteTarget(t)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {tenantsList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-slate-400 text-xs">
                      No companies onboarded yet, use the form above to add your first one.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Company Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
            <DialogDescription>Update {editTarget?.company_name}&apos;s details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs font-semibold">
            <div>
              <label className="block text-slate-700 mb-1">Company Name</label>
              <Input value={editForm.company_name} onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })} />
            </div>
            <div>
              <label className="block text-slate-700 mb-1">Contact Name</label>
              <Input value={editForm.contact_name} onChange={(e) => setEditForm({ ...editForm, contact_name: e.target.value })} />
            </div>
            <div>
              <label className="block text-slate-700 mb-1">Contact Email</label>
              <Input type="email" value={editForm.contact_email} onChange={(e) => setEditForm({ ...editForm, contact_email: e.target.value })} />
            </div>
            <div>
              <label className="block text-slate-700 mb-1">Contact Mobile</label>
              <Input value={editForm.contact_mobile} onChange={(e) => setEditForm({ ...editForm, contact_mobile: e.target.value })} />
            </div>
            <div>
              <label className="block text-slate-700 mb-1">Designation</label>
              <Input value={editForm.designation} onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })} />
            </div>
            <div>
              <label className="block text-slate-700 mb-1">Admin Email</label>
              <Input type="email" value={editForm.admin_email} onChange={(e) => setEditForm({ ...editForm, admin_email: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveEdit} loading={savingEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" /> Delete Company
            </DialogTitle>
            <DialogDescription>
              This permanently deletes {deleteTarget?.company_name} and all of its employees, campaigns, templates, and audit logs. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={handleConfirmDelete} loading={deleting}>Delete Permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
