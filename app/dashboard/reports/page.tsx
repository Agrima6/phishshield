'use client';

import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  FileText,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  RadialBarChart, RadialBar, PolarAngleAxis,
  AreaChart, Area,
} from 'recharts';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { PageBanner } from '@/components/dashboard/page-banner';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function riskColor(rate: number) {
  if (rate > 25) return '#ef4444';
  if (rate > 10) return '#f59e0b';
  return '#22c55e';
}

function scoreColor(score: number) {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [camps, emps] = await Promise.all([
        api.campaigns.list(),
        api.employees.list()
      ]);
      setCampaigns(camps);
      setEmployees(emps);
    } catch (err: any) {
      toast.error('Failed to load reports telemetry: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportReport = async (format: 'csv' | 'pdf') => {
    const deptRows = getDeptStats();
    const now = new Date();
    const dateLabel = now.toLocaleDateString();
    const generatedLabel = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

    if (format === 'csv') {
      const csvDeptTotals = deptRows.reduce(
        (acc, d) => ({ count: acc.count + d.count, runs: acc.runs + d.runs, clicks: acc.clicks + d.clicks }),
        { count: 0, runs: 0, clicks: 0 }
      );
      const csvCampaignRows = campaigns.map((c) => [
        c.name,
        c.subject,
        c.sentCount || c.sent_count || 0,
        c.openedCount || c.opened_count || 0,
        c.clickedCount || c.clicked_count || 0,
      ]);
      const csvCampaignTotals = csvCampaignRows.reduce(
        (acc, r) => ({ sent: acc.sent + Number(r[2]), opened: acc.opened + Number(r[3]), clicked: acc.clicked + Number(r[4]) }),
        { sent: 0, opened: 0, clicked: 0 }
      );
      const rows: (string | number)[][] = [
        [`Generated ${generatedLabel}`],
        [],
        ['Department', 'Employees', 'Simulations Run', 'Clicks', 'Risk'],
        ...deptRows.map((d) => [d.dept, d.count, d.runs, d.clicks, d.risk]),
        ['Total', csvDeptTotals.count, csvDeptTotals.runs, csvDeptTotals.clicks, ''],
        [],
        ['Campaign Name', 'Subject', 'Sent', 'Opened', 'Clicked'],
        ...csvCampaignRows,
        ['Total', '', csvCampaignTotals.sent, csvCampaignTotals.opened, csvCampaignTotals.clicked],
      ];
      downloadCsv(`workmate-shield-report-${dateLabel}.csv`, rows);
      toast.success('CSV report downloaded.');
      return;
    }

    try {
      const doc = new jsPDF();
      const logoDataUrl = await loadImageAsDataUrl('/workmate-shield-logo.png');
      let y = 15;

      if (logoDataUrl) {
        doc.addImage(logoDataUrl, 'PNG', 14, 10, 16, 16);
      }
      doc.setFontSize(16);
      doc.setTextColor(122, 18, 32); // brand maroon
      doc.text('Workmate Shield', logoDataUrl ? 34 : 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('Security Awareness — Simulation Report', logoDataUrl ? 34 : 14, 26);
      doc.text(`Generated ${generatedLabel}`, 14, 34);
      y = 42;

      doc.setFontSize(12);
      doc.setTextColor(30, 30, 30);
      doc.text('Summary', 14, y);
      y += 6;
      autoTable(doc, {
        startY: y,
        head: [['Total Simulated Emails', 'Click Rate', 'Vigilance Score']],
        body: [[String(totalSent), `${clickRate}%`, `${vigilanceScore}%`]],
        theme: 'grid',
        headStyles: { fillColor: [122, 18, 32] },
      });
      // @ts-expect-error - jspdf-autotable augments the doc instance at runtime
      y = doc.lastAutoTable.finalY + 10;

      doc.setFontSize(12);
      doc.text('Department Vigilance Audit', 14, y);
      y += 6;
      const deptTotals = deptRows.reduce(
        (acc, d) => ({ count: acc.count + d.count, runs: acc.runs + d.runs, clicks: acc.clicks + d.clicks }),
        { count: 0, runs: 0, clicks: 0 }
      );
      autoTable(doc, {
        startY: y,
        head: [['Department', 'Employees', 'Simulations Run', 'Clicks', 'Risk']],
        body: deptRows.map((d) => [d.dept, d.count, d.runs, d.clicks, d.risk]),
        foot: [['Total', deptTotals.count, deptTotals.runs, deptTotals.clicks, '']],
        theme: 'grid',
        headStyles: { fillColor: [122, 18, 32] },
        footStyles: { fillColor: [240, 230, 231], textColor: [122, 18, 32], fontStyle: 'bold' },
      });
      // @ts-expect-error - jspdf-autotable augments the doc instance at runtime
      y = doc.lastAutoTable.finalY + 10;

      doc.setFontSize(12);
      doc.text('Campaign Summary', 14, y);
      y += 6;
      const campaignRows = campaigns.map((c) => [
        c.name,
        c.subject,
        c.sentCount || c.sent_count || 0,
        c.openedCount || c.opened_count || 0,
        c.clickedCount || c.clicked_count || 0,
      ]);
      const campaignTotals = campaignRows.reduce(
        (acc, r) => ({ sent: acc.sent + Number(r[2]), opened: acc.opened + Number(r[3]), clicked: acc.clicked + Number(r[4]) }),
        { sent: 0, opened: 0, clicked: 0 }
      );
      autoTable(doc, {
        startY: y,
        head: [['Campaign', 'Subject', 'Sent', 'Opened', 'Clicked']],
        body: campaignRows,
        foot: [['Total', '', campaignTotals.sent, campaignTotals.opened, campaignTotals.clicked]],
        theme: 'grid',
        headStyles: { fillColor: [122, 18, 32] },
        footStyles: { fillColor: [240, 230, 231], textColor: [122, 18, 32], fontStyle: 'bold' },
      });

      doc.save(`workmate-shield-report-${dateLabel}.pdf`);
      toast.success('PDF report downloaded.');
    } catch (err: any) {
      toast.error('Failed to generate PDF report: ' + err.message);
    }
  };

  // Calculations
  const totalSent = campaigns.reduce((acc, c) => acc + (c.sentCount || c.sent_count || 0), 0);
  const totalClicked = campaigns.reduce((acc, c) => acc + (c.clickedCount || c.clicked_count || 0), 0);
  const clickRate = totalSent ? Math.round((totalClicked / totalSent) * 100) : 0;
  const vigilanceScore = 100 - clickRate;

  // Segment by department
  const getDeptStats = () => {
    const depts: Record<string, { count: number; clicks: number; runs: number }> = {};
    employees.forEach(emp => {
      const dept = emp.department || 'General';
      const clicks = emp.hits_count !== undefined ? emp.hits_count : emp.hitsCount || 0;
      const runs = emp.total_simulations !== undefined ? emp.total_simulations : emp.totalSimulations || 0;
      
      if (!depts[dept]) {
        depts[dept] = { count: 0, clicks: 0, runs: 0 };
      }
      depts[dept].count += 1;
      depts[dept].clicks += clicks;
      depts[dept].runs += runs;
    });

    return Object.entries(depts).map(([dept, data]) => {
      let risk = 'Low';
      let color = 'text-green-600';
      const rate = data.runs ? (data.clicks / data.runs) : 0;
      if (rate > 0.25) {
        risk = 'High';
        color = 'text-red-600 font-bold';
      } else if (rate > 0.1) {
        risk = 'Medium';
        color = 'text-amber-500 font-semibold';
      }
      return { dept, count: data.count, runs: data.runs, clicks: data.clicks, risk, color, ratePct: Math.round(rate * 100) };
    });
  };

  const deptStats = getDeptStats();

  const campaignTrend = campaigns.map((c) => ({
    name: c.name?.length > 14 ? `${c.name.slice(0, 14)}…` : c.name,
    sent: c.sentCount || c.sent_count || 0,
    opened: c.openedCount || c.opened_count || 0,
    clicked: c.clickedCount || c.clicked_count || 0,
  }));

  return (
    <div className="space-y-6">
      <PageBanner
        title="Reports & Analytics"
        description="Aggregate human risk dashboards, click-through tables, and compliance PDF exports."
        video="/videos/analytics-bg.mp4"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportReport('csv')}
              className="flex items-center gap-1 bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              <FileSpreadsheet className="h-4 w-4" /> Export CSV
            </Button>
            <Button
              size="sm"
              onClick={() => handleExportReport('pdf')}
              className="flex items-center gap-1 bg-white text-primary hover:bg-white/90"
            >
              <FileText className="h-4 w-4" /> Export PDF Report
            </Button>
          </>
        }
      />

      {loading ? (
        <div className="text-center py-20 text-slate-400 text-xs">
          Syncing dashboard statistics...
        </div>
      ) : (
        <>
          {/* Grid panels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* KPI Panel */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Vigilance Scorecard</CardTitle>
                <CardDescription>Overall department vulnerability rating</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="relative p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="relative h-40 w-40 mx-auto">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        innerRadius="72%"
                        outerRadius="100%"
                        barSize={12}
                        data={[{ value: vigilanceScore, fill: scoreColor(vigilanceScore) }]}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                        <RadialBar background={{ fill: '#e2e8f0' }} dataKey="value" cornerRadius={8} animationDuration={800} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-slate-900">{vigilanceScore}%</span>
                      <span className="text-[10px] text-slate-500 font-semibold">Vigilance</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-1 text-[10px] text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full mt-3 mx-auto w-fit">
                    <TrendingUp className="h-3 w-3" />
                    <span>Based on {campaigns.length} campaigns</span>
                  </div>
                </div>

                <div className="space-y-3 text-xs font-semibold text-slate-600">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span>Total simulated emails</span>
                    <span className="text-slate-900 font-bold">{totalSent} sent</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span>Susceptibility rate</span>
                    <span className="text-destructive font-bold">{clickRate}% click-rate</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reporting efficiency</span>
                    <span className="text-green-600 font-bold">42% reports sent</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Department click rate summary table */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Department vulnerability profile</CardTitle>
                <CardDescription>Individual metrics segmented by corporate sector</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {deptStats.length > 0 && (
                  <div className="h-48 px-4 pt-2 pb-4 border-b border-slate-100">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={deptStats} margin={{ left: -20, right: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="dept" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis unit="%" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          cursor={{ fill: '#f8fafc' }}
                          formatter={(value: any) => [`${value}%`, 'Click rate']}
                          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                        />
                        <Bar dataKey="ratePct" radius={[6, 6, 0, 0]} maxBarSize={40} animationDuration={700}>
                          {deptStats.map((item, idx) => (
                            <Cell key={idx} fill={riskColor(item.ratePct)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sector / Team</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead>Phishing Runs</TableHead>
                      <TableHead>Total Clicks</TableHead>
                      <TableHead>Risk Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deptStats.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-semibold text-slate-800">{item.dept}</TableCell>
                        <TableCell>{item.count} staff</TableCell>
                        <TableCell>{item.runs} simulations</TableCell>
                        <TableCell className="font-medium text-slate-700">{item.clicks}</TableCell>
                        <TableCell className={item.color}>{item.risk}</TableCell>
                      </TableRow>
                    ))}
                    {deptStats.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-slate-400 text-xs">
                          No department profiles recorded yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

          </div>

          {/* Campaign performance trend */}
          {campaignTrend.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Campaign performance trend</CardTitle>
                <CardDescription>Sent, opened, and clicked volume across all campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={campaignTrend} margin={{ left: -20, right: 8 }}>
                      <defs>
                        <linearGradient id="sentGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#7a1220" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#7a1220" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="clickedGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ef4444" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                      <Area type="monotone" dataKey="sent" stroke="#7a1220" strokeWidth={2} fill="url(#sentGradient)" name="Sent" />
                      <Area type="monotone" dataKey="clicked" stroke="#ef4444" strokeWidth={2} fill="url(#clickedGradient)" name="Clicked" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Historical Simulation Run Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Vigilance history log</CardTitle>
              <CardDescription>Performance of all completed phishing campaigns</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Simulation Campaign</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total Sent</TableHead>
                    <TableHead>Opened</TableHead>
                    <TableHead>Clicked</TableHead>
                    <TableHead>Click Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((camp) => {
                    const idVal = camp._id || camp.id;
                    const sent = camp.sentCount || camp.sent_count || 0;
                    const opened = camp.openedCount || camp.opened_count || 0;
                    const clicked = camp.clickedCount || camp.clicked_count || 0;
                    const rate = sent ? Math.round((clicked / sent) * 100) : 0;
                    return (
                      <TableRow key={idVal}>
                        <TableCell className="font-semibold text-slate-850">{camp.name}</TableCell>
                        <TableCell className="text-xs capitalize text-slate-500">{camp.status}</TableCell>
                        <TableCell>{sent}</TableCell>
                        <TableCell>{opened}</TableCell>
                        <TableCell className="text-destructive font-semibold">{clicked}</TableCell>
                        <TableCell className="font-bold text-slate-800">{rate}%</TableCell>
                      </TableRow>
                    );
                  })}
                  {campaigns.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-slate-400 text-xs">
                        No campaigns found in historical logs.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
