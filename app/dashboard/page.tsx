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
  RefreshCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { PageBanner } from '@/components/dashboard/page-banner';
import { api } from '@/lib/api';
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
  const { username, displayName } = useSession();
  const [greeting, setGreeting] = useState('Good morning');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [departmentRates, setDepartmentRates] = useState<{ department: string; rate: number; total_recipients: number }[]>([]);
  const [recentEvents, setRecentEvents] = useState<{ name: string; campaign: string; status: string; timestamp: string }[]>([]);
  const [ssoEnabled, setSsoEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

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
    if (displayName && displayName !== username) return displayName.split(' ')[0];
    const prefix = (username || '').split('@')[0].split('+')[0];
    if (!prefix) return '';
    return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  })();

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

  return (
    <div className="space-y-6">
      {/* Page header */}
      <PageBanner
        title="Overview Dashboard"
        description="Real-time simulation metrics, compliance scores, and human risk telemetry."
        eyebrow={
          friendlyName ? (
            <p className="text-sm font-semibold text-rose-200 mb-1">{greeting}, {friendlyName}</p>
          ) : undefined
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              Refresh telemetry
            </Button>
            <Link href="/dashboard/campaigns">
              <Button size="sm" className="bg-white text-primary hover:bg-white/90">
                New Simulation
              </Button>
            </Link>
          </>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeCampaigns.map((camp) => {
                      const idVal = camp._id || camp.id;
                      const sent = camp.sentCount || camp.sent_count || 0;
                      const opened = camp.openedCount || camp.opened_count || 0;
                      const clicked = camp.clickedCount || camp.clicked_count || 0;

                      return (
                        <TableRow key={idVal}>
                          <TableCell className="font-semibold">{camp.name}</TableCell>
                          <TableCell>{sent}</TableCell>
                          <TableCell>{opened}</TableCell>
                          <TableCell className="text-destructive font-semibold">{clicked}</TableCell>
                          <TableCell>
                            <Badge variant="warning" className="animate-pulse">Active</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {activeCampaigns.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-slate-400 text-xs">
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
            <CardHeader>
              <CardTitle>Security Health Check</CardTitle>
              <CardDescription>Compliance verification checklist</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {ssoEnabled && (
                <div className="flex items-start gap-3 p-3 bg-green-50/50 border border-green-200 rounded-lg">
                  <ShieldCheck className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-xs text-green-900">Microsoft Entra OIDC Active</h4>
                    <p className="text-[10px] text-green-700 mt-0.5">SSO single sign-on is fully active for administration login.</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 p-3 bg-amber-50/50 border border-amber-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-xs text-amber-900">High Risk Employees ({highRiskEmployees})</h4>
                  <p className="text-[10px] text-amber-700 mt-0.5">Employees have clicked on links in 2 or more simulations.</p>
                </div>
              </div>
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

    </div>
  );
}
