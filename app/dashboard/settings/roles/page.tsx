'use client';

import React, { useState } from 'react';
import { Key, ShieldCheck, Info, UserCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { toast } from 'sonner';

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
