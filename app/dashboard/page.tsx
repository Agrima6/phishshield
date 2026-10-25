'use client';

import React, { useState, useEffect } from 'react';
import {
  Send,
  Eye,
  MousePointerClick,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Trash2,
  BarChart3,
  CheckCircle2,
  XCircle,
  Mail,
  KeyRound
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { PageBanner } from '@/components/dashboard/page-banner';
import { api } from '@/lib/api';
import { recipientDisplayStatus, recipientEnvironment } from '@/lib/tracking';
import { useSession } from '@/hooks/use-session';
import Link from 'next/link';
import { toast } from 'sonner';

function riskColor(rate: number) {
  if (rate >= 15) return '#ef4444';
  if (rate >= 8) return '#f97316';
  if (rate >= 3) return '#f59e0b';
  return '#22c55e';
}

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function timeAgo(isoTimestamp: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(isoTimestamp).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export default function OverviewPage() {
  const { username, displayName, loginTenant } = useSession();
  const [greeting, setGreeting] = useState('Good morning');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [departmentRates, setDepartmentRates] = useState<{ department: string; rate: number; total_recipients: number }[]>([]);
  const [recentEvents, setRecentEvents] = useState<{ name: string; campaign: string; status: string; timestamp: string }[]>([]);
  const [ssoEnabled, setSsoEnabled] = useState(false);
  const [emailConfigured, setEmailConfigured] = useState(false);
  const [loading, setLoading] = useState(true);

  // Report popup + delete confirm for the Active Simulations table
  const [reportCampaign, setReportCampaign] = useState<any | null>(null);
  const [reportRecipients, setReportRecipients] = useState<any[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [camps, emps, analytics, settings] = await Promise.all([
        api.campaigns.list(),
        api.employees.list(),
        api.analytics.overview(),
        api.settings.get(),
      ]);
      setCampaigns(camps);
      setEmployees(emps);
      setDepartmentRates(analytics.department_rates);
      setRecentEvents(analytics.recent_events);
      setSsoEnabled(settings.sso.enabled);
      setEmailConfigured((settings.emailConfigs || []).length > 0);
    } catch (err: any) {
      toast.error('Failed to fetch dashboard metrics: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Computed client-side only (after mount) to avoid an SSR/client hydration
  // mismatch, since the greeting depends on the viewer's local clock.
  useEffect(() => {
    setGreeting(greetingForHour(new Date().getHours()));
  }, []);

  const friendlyName = (() => {
    if (displayName && displayName !== username) return displayName;
    if (loginTenant === 'default') return 'Super Admin';
    const prefix = (username || '').split('@')[0].split('+')[0];
    if (!prefix) return '';
    return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  })();

  const openReport = async (camp: any) => {
    setReportCampaign(camp);
    setReportLoading(true);
    try {
      const recipients = await api.recipients.list(camp._id || camp.id);
      setReportRecipients(recipients);
    } catch (err: any) {
      toast.error('Failed to load report: ' + err.message);
      setReportRecipients([]);
    } finally {
      setReportLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.campaigns.delete(deleteId);
      toast.success('Simulation deleted.');
      setDeleteId(null);
      loadData();
    } catch (err: any) {
      toast.error('Failed to delete: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Compute analytics from active tenant's campaigns
  const totalSent = campaigns.reduce((acc, c) => acc + (c.sentCount || c.sent_count || 0), 0);
  const totalOpened = campaigns.reduce((acc, c) => acc + (c.openedCount || c.opened_count || 0), 0);
  const totalClicked = campaigns.reduce((acc, c) => acc + (c.clickedCount || c.clicked_count || 0), 0);
  
  const openRate = totalSent ? Math.round((totalOpened / totalSent) * 100) : 0;
  const clickRate = totalSent ? Math.round((totalClicked / totalSent) * 100) : 0;

  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const highRiskEmployees = employees.filter(e => {
    const risk = e.risk_rating || e.riskRating || 'low';
    return risk === 'high';
  }).length;

  // Security Health Check: a small readiness checklist. `neutralOnFail` items
  // are informational (grey when not yet done) rather than a warning.
  const healthChecks: { ok: boolean; label: string; detail: string; icon: any; neutralOnFail?: boolean }[] = [
    {
      ok: emailConfigured,
      label: 'Email sending configured',
      detail: emailConfigured
        ? 'A sender profile is set up and ready to deliver simulations.'
        : 'No SMTP / SendGrid profile yet — add one in Tenant Settings to send.',
      icon: Mail,
    },
    {
      ok: ssoEnabled,
      label: 'Admin single sign-on',
      detail: ssoEnabled
        ? 'Microsoft Entra SSO is active for administrator login.'
        : 'SSO is not configured — admins sign in with email and password.',
      icon: KeyRound,
      neutralOnFail: true,
    },
    {
      ok: totalSent > 0,
      label: 'Simulations launched',
      detail: totalSent > 0
        ? `${totalSent} simulated email(s) delivered so far.`
        : 'No simulations sent yet — launch one from Campaign Manager.',
      icon: Send,
      neutralOnFail: true,
    },
    {
      ok: highRiskEmployees === 0,
      label: 'No high-risk employees',
      detail: highRiskEmployees === 0
        ? 'No employees have repeatedly clicked simulated links.'
        : `${highRiskEmployees} employee(s) clicked links in 2+ simulations — enroll them in training.`,
      icon: AlertTriangle,
    },
  ];
  const healthyCount = healthChecks.filter(c => c.ok).length;
  const healthPct = Math.round((healthyCount / healthChecks.length) * 100);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <PageBanner
        title="Dashboard"
        description={
          <>
            <p>Track your phishing simulations, open and click rates, and workforce risk — all in one place.</p>
            <p>Launch a new simulation, review who clicked, and follow up with the employees who need training.</p>
            <p className="text-white/60">Tip: use the cards below for a quick pulse, and open any active simulation to see its full report.</p>
          </>
        }
        eyebrow={
          friendlyName ? (
            <p className="text-sm font-semibold text-rose-200 mb-1">{greeting}, {friendlyName}</p>
          ) : undefined
        }
        actions={
          <Link href="/dashboard/campaigns">
            <Button size="sm" className="bg-white text-primary hover:bg-white/90">
              New Simulation
            </Button>
          </Link>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total emails sent */}
        <Card className="group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Simulated Emails</span>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm transition-transform duration-300 group-hover:scale-110">
                <Send className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-slate-900">{totalSent}</h3>
              <div className="flex items-center gap-1 text-[10px] text-green-600 font-semibold mt-1">
                <TrendingUp className="h-3 w-3" />
                <span>Active campaigns: {activeCampaigns.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Open Rate */}
        <Card className="group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Open Rate</span>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-sm transition-transform duration-300 group-hover:scale-110">
                <Eye className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-slate-900">{openRate}%</h3>
              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold mt-1">
                <span>Total opened: {totalOpened}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Click Rate */}
        <Card className="group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Click Rate</span>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary-hover text-white shadow-sm transition-transform duration-300 group-hover:scale-110">
                <MousePointerClick className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-slate-900">{clickRate}%</h3>
              <div className="flex items-center gap-1 text-[10px] text-green-600 font-semibold mt-1">
                <TrendingDown className="h-3 w-3" />
                <span>Total clicked: {totalClicked}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: High Risk Employees */}
        <Card className="group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">High Risk Employees</span>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-sm transition-transform duration-300 group-hover:scale-110">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-slate-900">{highRiskEmployees}</h3>
              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold mt-1">
                <span>Total recipients: {employees.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main split grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Department Click Rate graph and Risk indicators */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Department Vigilance Audit</CardTitle>
              <CardDescription>Average link click rates across active departments</CardDescription>
            </CardHeader>
            <CardContent>
              {departmentRates.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No department click-rate data yet, this fills in once employees with a department have appeared in a sent campaign.
                </p>
              ) : (
                <div className="h-64 pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={departmentRates} layout="vertical" margin={{ left: 8, right: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" unit="%" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis
                        type="category"
                        dataKey="department"
                        width={100}
                        tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: '#f8fafc' }}
                        formatter={(value: any) => [`${value}%`, 'Click rate']}
                        contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                      />
                      <Bar dataKey="rate" radius={[0, 6, 6, 0]} maxBarSize={22} animationDuration={700}>
                        {departmentRates.map((item, idx) => (
                          <Cell key={idx} fill={riskColor(item.rate)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Campaigns Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Active Simulations</CardTitle>
                <CardDescription>Simulations currently sending or logging hits</CardDescription>
              </div>
              <Badge variant="primary">{activeCampaigns.length} Active</Badge>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center items-center py-10 text-slate-400 text-xs">
                  <RefreshCw className="h-4 w-4 animate-spin text-primary mr-2" />
                  <span>Syncing active campaigns...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign Name</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Opened</TableHead>
                      <TableHead>Clicked</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeCampaigns.map((camp) => {
                      const idVal = camp._id || camp.id;
                      const sent = camp.sentCount || camp.sent_count || 0;
                      const opened = camp.openedCount || camp.opened_count || 0;
                      const clicked = camp.clickedCount || camp.clicked_count || 0;

                      return (
                        <TableRow
                          key={idVal}
                          onClick={() => openReport(camp)}
                          className="cursor-pointer hover:bg-slate-50"
                        >
                          <TableCell className="font-semibold">{camp.name}</TableCell>
                          <TableCell>{sent}</TableCell>
                          <TableCell>{opened}</TableCell>
                          <TableCell className="text-destructive font-semibold">{clicked}</TableCell>
                          <TableCell>
                            <Badge variant="warning" className="animate-pulse">Active</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-primary"
                                title="View report"
                                onClick={() => openReport(camp)}
                              >
                                <BarChart3 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-destructive"
                                title="Delete simulation"
                                onClick={() => setDeleteId(idVal)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {activeCampaigns.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-slate-400 text-xs">
                          No active phishing campaigns running.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Security Health Check & Risk Indicators */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>Security Health Check</CardTitle>
                  <CardDescription>Your program readiness at a glance</CardDescription>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="text-lg font-bold text-slate-900 leading-none">{healthyCount}<span className="text-slate-400 text-sm font-semibold">/{healthChecks.length}</span></div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">healthy</div>
                  </div>
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    healthPct === 100 ? 'bg-green-100 text-green-600' : healthPct >= 50 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                  }`}>
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                </div>
              </div>
              <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${healthPct === 100 ? 'bg-green-500' : healthPct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${healthPct}%` }}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {healthChecks.map((c, i) => {
                const tone = c.ok ? 'green' : c.neutralOnFail ? 'slate' : 'amber';
                const Icon = c.ok ? CheckCircle2 : c.neutralOnFail ? c.icon : AlertTriangle;
                const toneClass = tone === 'green'
                  ? 'bg-green-50/60 border-green-200'
                  : tone === 'amber'
                    ? 'bg-amber-50/60 border-amber-200'
                    : 'bg-slate-50 border-slate-200';
                const iconClass = tone === 'green' ? 'text-green-600' : tone === 'amber' ? 'text-amber-600' : 'text-slate-400';
                const titleClass = tone === 'green' ? 'text-green-900' : tone === 'amber' ? 'text-amber-900' : 'text-slate-700';
                const descClass = tone === 'green' ? 'text-green-700' : tone === 'amber' ? 'text-amber-700' : 'text-slate-500';
                return (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${toneClass}`}>
                    <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${iconClass}`} />
                    <div className="min-w-0">
                      <h4 className={`font-semibold text-xs ${titleClass}`}>{c.label}</h4>
                      <p className={`text-[10px] mt-0.5 leading-snug ${descClass}`}>{c.detail}</p>
                    </div>
                    {!c.ok && !c.neutralOnFail && (
                      <XCircle className="h-4 w-4 text-amber-400 shrink-0 ml-auto" />
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Risk Logs</CardTitle>
              <CardDescription>Latest simulated payload triggers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentEvents.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No opens or clicks recorded yet, this fills in once recipients interact with a sent campaign.
                </p>
              ) : (
                recentEvents.map((log, idx) => (
                  <div key={idx} className="flex justify-between items-start border-b border-slate-100 pb-2 last:border-0 last:pb-0 text-xs">
                    <div>
                      <span className="font-semibold text-slate-800">{log.name}</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">{log.campaign}</p>
                    </div>
                    <div className="text-right">
                      <span className={`font-semibold ${
                        log.status === 'Clicked Link' ? 'text-destructive' : 'text-amber-600'
                      }`}>{log.status}</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(log.timestamp)}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Campaign report popup (from Active Simulations) */}
      <Dialog open={!!reportCampaign} onOpenChange={(open) => !open && setReportCampaign(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{reportCampaign?.name}</DialogTitle>
            <DialogDescription>{reportCampaign?.subject || 'Simulation report'}</DialogDescription>
          </DialogHeader>
          {reportCampaign && (() => {
            const sent = reportCampaign.sentCount || reportCampaign.sent_count || 0;
            const clicked = reportCampaign.clickedCount || reportCampaign.clicked_count || 0;
            const opened = Math.max(reportCampaign.openedCount || reportCampaign.opened_count || 0, clicked);
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-xl font-bold text-slate-900">{sent}</div>
                    <div className="text-[10px] text-slate-500 font-semibold">Sent</div>
                  </div>
                  <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100">
                    <div className="text-xl font-bold text-amber-600">{opened}</div>
                    <div className="text-[10px] text-slate-500 font-semibold">Opened</div>
                  </div>
                  <div className="p-3 bg-red-50/50 rounded-lg border border-red-100">
                    <div className="text-xl font-bold text-destructive">{clicked}</div>
                    <div className="text-[10px] text-slate-500 font-semibold">Clicked</div>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-2">Recipient breakdown</h4>
                  <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 [&>th]:h-9 [&>th]:text-slate-700 [&>th]:font-semibold">
                          <TableHead>Recipient</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Clicked</TableHead>
                          <TableHead>Device</TableHead>
                          <TableHead>Location</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportLoading ? (
                          <TableRow><TableCell colSpan={5} className="text-center py-6 text-slate-400 text-xs">Loading recipients...</TableCell></TableRow>
                        ) : reportRecipients.length === 0 ? (
                          <TableRow><TableCell colSpan={5} className="text-center py-6 text-slate-400 text-xs">No recipients on this campaign.</TableCell></TableRow>
                        ) : (
                          reportRecipients.map((r: any, idx: number) => {
                            const status = recipientDisplayStatus(r);
                            const env = recipientEnvironment(r);
                            const g = env.location.geo;
                            const place = g ? [g.city, g.region, g.countryCode || g.country].filter(Boolean).join(', ') : '-';
                            return (
                              <TableRow key={r._id || r.id || idx}>
                                <TableCell>
                                  <div className="font-semibold text-slate-800 text-xs">{r.name || r.email}</div>
                                  {r.name && r.name !== r.email && <div className="text-[10px] text-slate-500">{r.email}</div>}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={status === 'clicked' || status === 'failed' ? 'danger' : status === 'opened' ? 'warning' : 'secondary'}>{status}</Badge>
                                </TableCell>
                                <TableCell className="text-xs text-slate-700">{r.clicked_at ? new Date(r.clicked_at).toLocaleString() : '-'}</TableCell>
                                <TableCell className="text-xs text-slate-700">{[env.device, env.os, env.browser].filter(Boolean).join(' · ') || '-'}</TableCell>
                                <TableCell className="text-xs text-slate-700">{place}</TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Link href="/dashboard/campaigns">
              <Button variant="outline" size="sm">Open in Campaign Manager</Button>
            </Link>
            <Button size="sm" onClick={() => setReportCampaign(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Delete simulation
            </DialogTitle>
            <DialogDescription>
              This permanently deletes the campaign and all of its tracking events. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={confirmDelete} loading={deleting}>Delete Permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
