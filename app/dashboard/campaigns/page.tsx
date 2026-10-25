'use client';

import React, { useState, useEffect } from 'react';
import {
  Send,
  Plus,
  Mail,
  User,
  Globe,
  Settings,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Play,
  RefreshCw,
  Eye,
  Clock,
  XCircle,
  BarChart3,
  Pencil,
  Download,
  FileText,
  ArrowUp,
  ArrowDown,
  ArrowUpDown
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api } from '@/lib/api';
import { renderTemplateEmailHtml, templateHeaderImageUrl } from '@/lib/templateEmail';
import { recipientDisplayStatus, recipientEnvironment } from '@/lib/tracking';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

// After a recipient clicks and sees the awareness landing page, this decides
// where the "Sign in" button ultimately sends them. Match the template's
// implied brand where it's a real, well-known one; otherwise fall back to a
// neutral page instead of always pointing at Microsoft regardless of theme.
//
// This looks at BOTH the template name and its free-text theme/subject so a
// "Invoice Payment Overdue" or "Google Drive share" template no longer gets
// funnelled to the Microsoft login page just because it mentions a password.
// The admin can always override whatever this returns in the final step.
function defaultRedirectForTemplate(template: { name?: string; theme?: string; subject?: string; category?: string } | string): string {
  const hay = (typeof template === 'string'
    ? template
    : [template?.name, template?.theme, template?.subject, template?.category].filter(Boolean).join(' ')
  ).toLowerCase();

  const brandRedirects: [RegExp, string][] = [
    [/onedrive|share ?point|sharepoint/, 'https://onedrive.live.com'],
    [/google ?drive|gmail|google ?workspace|google/, 'https://accounts.google.com'],
    [/dropbox/, 'https://www.dropbox.com/login'],
    [/zoom/, 'https://zoom.us/signin'],
    [/slack/, 'https://slack.com/signin'],
    [/docusign/, 'https://account.docusign.com'],
    [/workday|benefits|payroll|hr\b|open enrollment/, 'https://www.workday.com/en-us/login.html'],
    [/invoice|payment|accounts ?payable|finance|billing|quickbooks/, 'https://quickbooks.intuit.com/login/'],
    [/linkedin/, 'https://www.linkedin.com/login'],
    [/amazon|aws/, 'https://www.amazon.com/ap/signin'],
    [/okta/, 'https://login.okta.com'],
    [/office ?365|outlook|microsoft|o365|azure|teams|password|vpn|mfa|login|account/, 'https://login.microsoftonline.com'],
  ];
  for (const [pattern, url] of brandRedirects) {
    if (pattern.test(hay)) return url;
  }
  // Nothing matched a known brand - a neutral, obviously-safe landing spot.
  return 'https://www.google.com';
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [settings, setSettings] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);
  const [scheduleCampaign, setScheduleCampaign] = useState<any | null>(null);
  const [scheduleDateTime, setScheduleDateTime] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'draft' | 'completed'>('all');

  // Form states
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    subject: '',
    senderName: '',
    templateId: '',
    emailConfigId: '',
    redirectUrl: '',
    trainingUrl: '',
    // Per-campaign override of the chosen template's email HTML. Empty means
    // "use the template body as-is"; editing it in the wizard customises this
    // one send without touching the saved template.
    bodyHtml: ''
  });

  // Inline "edit this template for this campaign only" editor, opened from
  // the template-selection step.
  const [editTemplateOpen, setEditTemplateOpen] = useState(false);
  const [templateDraft, setTemplateDraft] = useState({ subject: '', bodyHtml: '', redirectUrl: '' });

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);

  const [reportCampaign, setReportCampaign] = useState<any | null>(null);
  const [reportRecipients, setReportRecipients] = useState<any[]>([]);
  const [reportLoading, setReportLoading] = useState(false);

  const [previewCampaign, setPreviewCampaign] = useState<any | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [editDraftId, setEditDraftId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ name: '', subject: '', senderName: '', redirectUrl: '', trainingUrl: '', bodyHtml: '' });
  const [editDraftSaving, setEditDraftSaving] = useState(false);

  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [audienceDeptFilter, setAudienceDeptFilter] = useState<string>('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const [camps, tenantSettings, templatesList, employeesList] = await Promise.all([
        api.campaigns.list(),
        api.settings.get(),
        api.templates.list(),
        api.employees.list()
      ]);
      setCampaigns(camps);
      setSettings(tenantSettings);
      setTemplates(templatesList);
      setEmployees(employeesList);
      setSelectedEmployeeIds(employeesList.map((e: any) => e._id || e.id));
    } catch (err: any) {
      toast.error('Failed to connect to backend: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCampaign = async () => {
    if (!newCampaign.name || !newCampaign.subject || !newCampaign.senderName || !newCampaign.templateId) {
      toast.error('Please fill in all campaign fields and select a template.');
      return;
    }

    const chosenTemplate = templates.find(t => (t._id || t.id) === newCampaign.templateId);
    // Prefer the per-campaign edited body if the admin customised it in the
    // wizard; otherwise fall back to the saved template body.
    const bodyHtml = newCampaign.bodyHtml?.trim()
      ? newCampaign.bodyHtml
      : (chosenTemplate ? chosenTemplate.body : '<p>Account verification required.</p>');

    const targetEmployees = employees.filter((e) => selectedEmployeeIds.includes(e._id || e.id));
    if (targetEmployees.length === 0) {
      toast.error('Select at least one employee to target.');
      return;
    }

    try {
      // 1. Create campaign in Flask backend
      const headerImageUrl = templateHeaderImageUrl(chosenTemplate) || undefined;

      const created = await api.campaigns.create({
        name: newCampaign.name,
        subject: newCampaign.subject,
        body_html: bodyHtml,
        sender_name: newCampaign.senderName,
        redirect_url: newCampaign.redirectUrl || defaultRedirectForTemplate(chosenTemplate || ''),
        training_url: newCampaign.trainingUrl || undefined,
        email_config_id: newCampaign.emailConfigId || undefined,
        header_image_url: headerImageUrl,
      });

      // 2. Target the selected employees
      await api.recipients.add(created.id,
        targetEmployees.map((e) => ({ email: e.email, name: e.name }))
      );

      toast.success(`Simulation campaign "${created.name}" created as draft.`);
      setWizardOpen(false);
      setWizardStep(1);
      setNewCampaign({
        name: '',
        subject: '',
        senderName: '',
        templateId: '',
        emailConfigId: '',
        redirectUrl: '',
        trainingUrl: '',
        bodyHtml: ''
      });
      loadData();
    } catch (err: any) {
      toast.error('Failed to build simulation run: ' + err.message);
    }
  };

  const toggleEmployeeSelected = (id: string) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const [launchingId, setLaunchingId] = useState<string | null>(null);

  const handleLaunchCampaign = async (id: string, name: string) => {
    setLaunchingId(id);
    try {
      await api.campaigns.send(id);
      toast.success(`Phishing simulation "${name}" queued — sending now.`);

      // The send happens in a background job on the server; the campaign's
      // real counts don't exist yet the instant this call returns. Poll
      // status until the job actually finishes, then refresh, instead of
      // reloading once immediately (which just showed stale/draft data and
      // made it look like nothing happened until a manual page refresh).
      const deadline = Date.now() + 60_000;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 1500));
        const status = await api.campaigns.sendStatus(id);
        if (status.state === 'done' || status.state === 'error' || status.state === 'idle') break;
      }
      toast.success(`"${name}" finished sending.`);
      await loadData();
    } catch (err: any) {
      toast.error('Failed to launch campaign: ' + err.message);
    } finally {
      setLaunchingId(null);
    }
  };

  const openCampaignReport = async (camp: any) => {
    setReportCampaign(camp);
    setReportLoading(true);
    try {
      const recipients = await api.recipients.list(camp._id || camp.id);
      setReportRecipients(recipients);
    } catch (err: any) {
      toast.error('Failed to load campaign report: ' + err.message);
      setReportRecipients([]);
    } finally {
      setReportLoading(false);
    }
  };

  const openDraftEdit = async (camp: any) => {
    const idVal = camp._id || camp.id;
    setEditDraftId(idVal);
    setEditDraft({
      name: camp.name || '', subject: camp.subject || '', senderName: camp.senderName || camp.sender_name || '',
      redirectUrl: '', trainingUrl: '', bodyHtml: '',
    });
    try {
      const full = await api.campaigns.getStats(idVal);
      setEditDraft({
        name: full.name || camp.name || '',
        subject: full.subject || camp.subject || '',
        senderName: full.sender_name || camp.senderName || '',
        redirectUrl: full.redirect_url || '',
        trainingUrl: full.training_url || '',
        bodyHtml: full.body_html || '',
      });
    } catch { /* keep what we have */ }
  };

  const handleSaveDraft = async () => {
    if (!editDraftId) return;
    if (!editDraft.name.trim() || !editDraft.subject.trim()) {
      toast.error('Name and subject are required.');
      return;
    }
    setEditDraftSaving(true);
    try {
      await api.campaigns.update(editDraftId, {
        name: editDraft.name,
        subject: editDraft.subject,
        sender_name: editDraft.senderName,
        redirect_url: editDraft.redirectUrl,
        training_url: editDraft.trainingUrl,
        body_html: editDraft.bodyHtml,
      });
      toast.success('Draft updated.');
      setEditDraftId(null);
      loadData();
    } catch (err: any) {
      toast.error('Failed to save draft: ' + err.message);
    } finally {
      setEditDraftSaving(false);
    }
  };

  const openPreview = async (camp: any) => {
    setPreviewCampaign(camp);
    setPreviewLoading(true);
    try {
      const full = await api.campaigns.getStats(camp._id || camp.id);
      setPreviewCampaign({ ...camp, ...full });
    } catch {
      // fall back to the list row we already have
    } finally {
      setPreviewLoading(false);
    }
  };

  // Build a detailed CSV from the recipient data already loaded for the open
  // report and trigger a client-side download. Done in the browser (rather
  // than hitting the backend export endpoint) so the file always matches
  // exactly what the admin is looking at, with no extra auth round-trip.
  const downloadCampaignReportCsv = () => {
    if (!reportCampaign) return;
    const esc = (v: any) => {
      const s = v === null || v === undefined ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const headers = [
      'Name', 'Email', 'Status', 'Opened At', 'Open Count', 'Clicked At', 'Click Count',
      'Device', 'OS', 'Browser', 'Click IP', 'Open IP', 'Open via proxy',
      'City', 'Region', 'Country', 'Latitude', 'Longitude', 'ISP', 'Reverse DNS',
    ];
    const rows = reportRecipients.map((r: any) => {
      const env = recipientEnvironment(r);
      const g = env.location.geo;
      return [
        r.name || '', r.email || '', recipientDisplayStatus(r),
        r.opened_at ? new Date(r.opened_at).toISOString() : '', r.open_count || 0,
        r.clicked_at ? new Date(r.clicked_at).toISOString() : '', r.click_count || 0,
        env.device, env.os, env.browser, env.clickIp, env.openIp, env.openViaProxy ? 'yes' : 'no',
        g?.city || '', g?.region || '', g?.country || '',
        g?.lat ?? '', g?.lon ?? '', g?.isp || '', g?.hostname || '',
      ].map(esc).join(',');
    });
    const sent = reportCampaign.sentCount || reportCampaign.sent_count || 0;
    const clicked = reportCampaign.clickedCount || reportCampaign.clicked_count || 0;
    const opened = Math.max(reportCampaign.openedCount || reportCampaign.opened_count || 0, clicked);
    const summary = [
      `# Campaign,${esc(reportCampaign.name)}`,
      `# Subject,${esc(reportCampaign.subject)}`,
      `# Exported,${new Date().toISOString()}`,
      `# Sent,${sent}`,
      `# Opened,${opened}`,
      `# Clicked,${clicked}`,
      '',
    ].join('\n');
    const csv = summary + headers.join(',') + '\n' + rows.join('\n') + '\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (reportCampaign.name || 'campaign').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    a.href = url;
    a.download = `${safeName}-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Build a polished, branded PDF report (vector text via jsPDF - no
  // html2canvas, so Tailwind v4's oklch colors are a non-issue). Lays out a
  // maroon header band, KPI cards, an engagement funnel infographic and a
  // colour-coded recipient table. Libraries are imported lazily so they only
  // load the first time an admin actually exports.
  const [pdfExporting, setPdfExporting] = useState(false);
  const downloadCampaignReportPdf = async () => {
    if (!reportCampaign) return;
    setPdfExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const M = 40;

      const maroon: [number, number, number] = [122, 18, 32];
      const orange: [number, number, number] = [217, 119, 6];
      const red: [number, number, number] = [220, 38, 38];
      const green: [number, number, number] = [22, 163, 74];
      const ink: [number, number, number] = [15, 23, 42];
      const sub: [number, number, number] = [100, 116, 139];
      const line: [number, number, number] = [226, 232, 240];

      const sent = reportCampaign.sentCount || reportCampaign.sent_count || 0;
      const clicked = reportCampaign.clickedCount || reportCampaign.clicked_count || 0;
      const opened = Math.max(reportCampaign.openedCount || reportCampaign.opened_count || 0, clicked);
      const openRate = sent ? Math.round((opened / sent) * 100) : 0;
      const clickRate = sent ? Math.round((clicked / sent) * 100) : 0;
      const ctr = opened ? Math.round((clicked / opened) * 100) : 0;
      const risk = clickRate >= 50 ? { label: 'High', col: red } : clickRate >= 20 ? { label: 'Moderate', col: orange } : clickRate > 0 ? { label: 'Low–Moderate', col: orange } : { label: 'Low', col: green };

      // Company branding: primary colour + logo, from tenant settings.
      const hexToRgb = (hex?: string): [number, number, number] | null => {
        if (!hex) return null;
        const m = hex.replace('#', '').trim();
        if (/^[0-9a-f]{6}$/i.test(m)) return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)];
        if (/^[0-9a-f]{3}$/i.test(m)) return [parseInt(m[0] + m[0], 16), parseInt(m[1] + m[1], 16), parseInt(m[2] + m[2], 16)];
        return null;
      };
      const brandCol: [number, number, number] = hexToRgb(settings?.branding?.primaryColor) || maroon;
      const loadImageDataUrl = async (url: string): Promise<{ data: string; fmt: string } | null> => {
        try {
          const res = await fetch(url, { cache: 'no-store' });
          if (!res.ok) return null;
          const blob = await res.blob();
          // SVG can't be embedded by jsPDF; everything else we try as an image.
          if (/svg/i.test(blob.type) || /\.svg($|\?)/i.test(url)) return null;
          const fmt = /png/i.test(blob.type) || /\.png($|\?)/i.test(url) ? 'PNG'
            : /webp/i.test(blob.type) || /\.webp($|\?)/i.test(url) ? 'WEBP'
            : 'JPEG';
          const data: string = await new Promise((resolve, reject) => {
            const fr = new FileReader();
            fr.onload = () => resolve(fr.result as string);
            fr.onerror = reject;
            fr.readAsDataURL(blob);
          });
          return { data, fmt };
        } catch { return null; }
      };
      // Resolve the tenant logo to a same-origin path first (an absolute
      // api.* URL would be blocked by CORS when fetched for the PDF), then the
      // absolute URL, then the bundled app logo as a last resort.
      const logoRaw: string = settings?.branding?.logoUrl || '';
      const logoCandidates: string[] = [];
      if (logoRaw) {
        if (logoRaw.startsWith('/')) logoCandidates.push(logoRaw);
        else {
          try { logoCandidates.push(new URL(logoRaw).pathname); } catch { /* ignore */ }
          logoCandidates.push(logoRaw);
        }
      }
      logoCandidates.push('/workmate-shield-logo.png');
      let logo: { data: string; fmt: string } | null = null;
      for (const cand of logoCandidates) {
        logo = await loadImageDataUrl(cand);
        if (logo) break;
      }

      // Header band (brand colour + company logo)
      const headerH = 118;
      doc.setFillColor(...brandCol);
      doc.rect(0, 0, pageW, headerH, 'F');
      // subtle darker base stripe for depth
      doc.setFillColor(0, 0, 0);
      doc.setGState(new (doc as any).GState({ opacity: 0.12 }));
      doc.rect(0, headerH - 6, pageW, 6, 'F');
      doc.setGState(new (doc as any).GState({ opacity: 1 }));
      let titleX = M;
      if (logo) {
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(M, 30, 56, 56, 10, 10, 'F');
        try { doc.addImage(logo.data, logo.fmt, M + 7, 37, 42, 42); } catch { /* unsupported image */ }
        titleX = M + 72;
      }
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
      doc.text(reportCampaign.name || 'Campaign', titleX, 46);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text('Phishing Simulation Report', titleX, 64);
      doc.setFontSize(9);
      doc.text(doc.splitTextToSize(reportCampaign.subject || '', pageW - titleX - M - 130), titleX, 82);
      doc.setFontSize(8);
      doc.text(`Generated ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, pageW - M, 32, { align: 'right' });
      const bw = 112, bh = 24, bx = pageW - M - bw, by = 46;
      doc.setFillColor(...risk.col); doc.roundedRect(bx, by, bw, bh, 12, 12, 'F');
      doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
      doc.text(`Risk: ${risk.label}`, bx + bw / 2, by + 16, { align: 'center' });

      // ---- Page 1: visual summary ----
      const recips: any[] = reportRecipients || [];
      const tg = 14;

      // Donut gauge: the headline "click rate" metric
      doc.setTextColor(...ink); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
      doc.text('Click rate', M + 72, 150, { align: 'center' });
      const gaugeCx = M + 72, gaugeCy = 208, gaugeR = 46;
      const drawArc = (a0: number, a1: number, col: [number, number, number]) => {
        doc.setDrawColor(...col);
        const steps = Math.max(2, Math.round(Math.abs(a1 - a0) / 5));
        let px: number | null = null, py = 0;
        for (let i = 0; i <= steps; i++) {
          const a = ((a0 + (a1 - a0) * i / steps) - 90) * Math.PI / 180;
          const x = gaugeCx + gaugeR * Math.cos(a), yy = gaugeCy + gaugeR * Math.sin(a);
          if (px !== null) doc.line(px, py, x, yy);
          px = x; py = yy;
        }
      };
      (doc as any).setLineCap('round');
      doc.setLineWidth(13);
      drawArc(0, 360, [236, 239, 244]);
      if (clickRate > 0) drawArc(0, Math.min(360, clickRate * 3.6), red);
      doc.setLineWidth(0.3);
      doc.setTextColor(...ink); doc.setFont('helvetica', 'bold'); doc.setFontSize(24);
      doc.text(`${clickRate}%`, gaugeCx, gaugeCy + 4, { align: 'center' });
      doc.setTextColor(...sub); doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
      doc.text('clicked the link', gaugeCx, gaugeCy + 18, { align: 'center' });

      // Stat tiles to the right of the gauge
      const tileX0 = M + 160;
      const tw = (pageW - M - tileX0 - tg * 2) / 3;
      const tileY = 158, th = 92;
      const tiles: [string, string, [number, number, number], [number, number, number]][] = [
        ['Emails sent', String(sent), ink, [248, 250, 252]],
        ['Opened', String(opened), orange, [255, 247, 237]],
        ['Clicked', String(clicked), red, [254, 242, 242]],
      ];
      tiles.forEach((t, i) => {
        const x = tileX0 + i * (tw + tg);
        doc.setFillColor(...t[3]); doc.setDrawColor(...line);
        doc.roundedRect(x, tileY, tw, th, 10, 10, 'FD');
        doc.setFillColor(...t[2]); doc.circle(x + 15, tileY + 18, 3.5, 'F');
        doc.setTextColor(...t[2]); doc.setFont('helvetica', 'bold'); doc.setFontSize(30);
        doc.text(t[1], x + tw / 2, tileY + 58, { align: 'center' });
        doc.setTextColor(...sub); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
        doc.text(t[0], x + tw / 2, tileY + 78, { align: 'center' });
      });

      let y = Math.max(gaugeCy + gaugeR, tileY + th) + 34;

      // Engagement funnel
      doc.setTextColor(...ink); doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
      doc.text('Engagement funnel', M, y);
      y += 20;
      const barX = M + 64;
      const barMax = pageW - M - 96 - barX;
      const maxVal = Math.max(sent, 1);
      const funnelRows: [string, number, [number, number, number]][] = [
        ['Sent', sent, brandCol],
        ['Opened', opened, orange],
        ['Clicked', clicked, red],
      ];
      funnelRows.forEach(([label, val, col]) => {
        doc.setTextColor(...ink); doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
        doc.text(label, M, y + 13);
        doc.setFillColor(241, 245, 249); doc.roundedRect(barX, y, barMax, 18, 4, 4, 'F');
        const w = Math.max(3, (val / maxVal) * barMax);
        doc.setFillColor(...col); doc.roundedRect(barX, y, w, 18, 4, 4, 'F');
        doc.setTextColor(...ink); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
        doc.text(`${val}  (${sent ? Math.round((val / sent) * 100) : 0}%)`, barX + barMax + 8, y + 13);
        y += 28;
      });
      y += 12;

      // Exposure breakdown: one segmented bar + legend
      doc.setTextColor(...ink); doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
      doc.text('Exposure breakdown', M, y);
      y += 16;
      const openedOnly = Math.max(0, opened - clicked);
      const notOpened = Math.max(0, sent - opened);
      const totalExp = Math.max(1, clicked + openedOnly + notOpened);
      const segs: [string, number, [number, number, number]][] = [
        ['Clicked', clicked, red],
        ['Opened, not clicked', openedOnly, orange],
        ['Not opened', notOpened, [148, 163, 184]],
      ];
      const expW = pageW - M * 2;
      let sx = M;
      segs.forEach(([, val, col]) => {
        const w = (val / totalExp) * expW;
        if (w <= 0) return;
        doc.setFillColor(...col);
        doc.rect(sx, y, w, 20, 'F');
        sx += w;
      });
      y += 36;
      const legW = (pageW - M * 2) / 3;
      segs.forEach(([lab, val, col], i) => {
        const x = M + i * legW;
        doc.setFillColor(...col); doc.roundedRect(x, y - 9, 10, 10, 2, 2, 'F');
        doc.setTextColor(...ink); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
        doc.text(String(val), x + 16, y);
        doc.setTextColor(...sub); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
        doc.text(lab, x + 16, y + 12);
      });
      y += 30;

      // "Why this matters" - sobering cyber-security facts to drive the point home.
      const facts = [
        'Over 90% of successful cyberattacks begin with a phishing email.',
        'A single careless click can hand attackers passwords, customer records and funds.',
        'The global average cost of a data breach is about $4.45 million (IBM, 2023).',
        'Stolen credentials and phishing are the leading causes of breaches (Verizon DBIR).',
        'Attackers can go from one click to full network access in under an hour.',
        'Breaches can mean regulatory fines, legal action and lasting loss of customer trust.',
      ];
      const factLines = facts.map((f) => doc.splitTextToSize(`•  ${f}`, pageW - M * 2 - 24));
      const flat = ([] as string[]).concat(...factLines);
      const boxH = 30 + flat.length * 12 + 10;
      if (y + boxH > pageH - 50) { doc.addPage(); y = 54; }
      doc.setFillColor(254, 242, 242); doc.setDrawColor(254, 202, 202);
      doc.roundedRect(M, y, pageW - M * 2, boxH, 8, 8, 'FD');
      doc.setTextColor(...red); doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
      doc.text('Why this matters', M + 14, y + 20);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(120, 30, 30);
      let fy = y + 36;
      flat.forEach((ln: string) => { doc.text(ln, M + 14, fy); fy += 12; });
      y += boxH;

      // Recipient detail on its own page
      doc.addPage();
      doc.setTextColor(...ink); doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
      doc.text('Recipient detail', M, 48);

      const tableBody = recips.map((r: any) => {
        const env = recipientEnvironment(r);
        const g = env.location.geo;
        const place = g
          ? [g.city, g.region, g.countryCode || g.country].filter(Boolean).join(', ')
          : env.location.proxyOnly ? 'Proxy only' : '-';
        // Only show the email on a second line when the name is a distinct
        // value - avoids the "email printed twice" when name === email.
        const who = r.name && r.name !== r.email ? `${r.name}\n${r.email}` : (r.email || r.name || '-');
        return [
          who,
          recipientDisplayStatus(r),
          r.opened_at ? new Date(r.opened_at).toLocaleString() : '-',
          r.clicked_at ? new Date(r.clicked_at).toLocaleString() : '-',
          [env.device, env.os, env.browser].filter(Boolean).join(' · ') || '-',
          env.clickIp || env.openIp || '-',
          place || '-',
        ];
      });

      autoTable(doc, {
        startY: 60,
        head: [['Recipient', 'Status', 'Opened', 'Clicked', 'Device', 'IP', 'Location']],
        body: tableBody.length ? tableBody : [['No recipients on this campaign.', '', '', '', '', '', '']],
        margin: { left: M, right: M, bottom: 44 },
        styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 4, textColor: [30, 41, 59], lineColor: line, lineWidth: 0.5, valign: 'middle' },
        headStyles: { fillColor: brandCol, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [250, 250, 251] },
        columnStyles: { 0: { cellWidth: 108 }, 1: { cellWidth: 46, halign: 'center' } },
        didParseCell: (data: any) => {
          if (data.section === 'body' && data.column.index === 1) {
            const v = String(data.cell.raw);
            data.cell.styles.fontStyle = 'bold';
            if (v === 'clicked' || v === 'failed') data.cell.styles.textColor = red;
            else if (v === 'opened') data.cell.styles.textColor = orange;
            else data.cell.styles.textColor = sub;
          }
        },
      } as any);

      // Location disclaimer after the detail table
      let dy = (doc as any).lastAutoTable.finalY + 14;
      if (dy > pageH - 60) { doc.addPage(); dy = 54; }
      doc.setFont('helvetica', 'italic'); doc.setFontSize(7); doc.setTextColor(...sub);
      const note = 'Location is estimated from the IP address and is approximate (often the ISP hub, unreliable for VPNs and mobile networks). The sub-label is the IP reverse-DNS (ISP gateway), not the device. Hostnames and MAC addresses are never sent to a website.';
      doc.text(doc.splitTextToSize(note, pageW - M * 2), M, dy);

      // Consistent footer on every page
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...sub);
        doc.text(reportCampaign.name || 'Campaign', M, pageH - 16);
        doc.text(`Page ${i} of ${pageCount}`, pageW - M, pageH - 16, { align: 'right' });
      }

      const safeName = (reportCampaign.name || 'campaign').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      doc.save(`${safeName}-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err: any) {
      toast.error('Failed to generate PDF: ' + err.message);
    } finally {
      setPdfExporting(false);
    }
  };

  const handleDeleteCampaignClick = (id: string) => {
    setCampaignToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteCampaign = async () => {
    if (!campaignToDelete) return;
    try {
      await api.campaigns.delete(campaignToDelete);
      toast.success('Simulation run removed.');
      setDeleteConfirmOpen(false);
      setCampaignToDelete(null);
      loadData();
    } catch (err: any) {
      toast.error('Deletion error: ' + err.message);
    }
  };

  const openScheduleDialog = (camp: any) => {
    setScheduleCampaign(camp);
    setScheduleDateTime(camp.scheduledAt ? camp.scheduledAt.slice(0, 16) : '');
  };

  const handleConfirmSchedule = async () => {
    if (!scheduleCampaign || !scheduleDateTime) return;
    setScheduling(true);
    try {
      const isoValue = new Date(scheduleDateTime).toISOString();
      await api.campaigns.schedule(scheduleCampaign._id || scheduleCampaign.id, isoValue);
      toast.success(`"${scheduleCampaign.name}" scheduled for ${new Date(isoValue).toLocaleString()}.`);
      setScheduleCampaign(null);
      loadData();
    } catch (err: any) {
      toast.error('Failed to schedule campaign: ' + err.message);
    } finally {
      setScheduling(false);
    }
  };

  const handleCancelSchedule = async (camp: any) => {
    try {
      await api.campaigns.schedule(camp._id || camp.id, null);
      toast.success(`Cancelled the scheduled send for "${camp.name}".`);
      loadData();
    } catch (err: any) {
      toast.error('Failed to cancel schedule: ' + err.message);
    }
  };

  const renderTemplatePreviewHtml = renderTemplateEmailHtml;

  const filteredCampaigns = campaigns.filter(camp => {
    if (filterStatus === 'all') return true;
    return camp.status === filterStatus;
  });

  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);
  const toggleSort = (key: string) =>
    setSort((cur) => (cur && cur.key === key ? { key, dir: cur.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
  const sortVal = (camp: any, key: string): string | number => {
    switch (key) {
      case 'name': return (camp.name || '').toLowerCase();
      case 'subject': return (camp.subject || '').toLowerCase();
      case 'delivered': return camp.sentCount || camp.sent_count || 0;
      case 'opened': return camp.openedCount || camp.opened_count || 0;
      case 'clicked': return camp.clickedCount || camp.clicked_count || 0;
      case 'status': return (camp.status || '').toLowerCase();
      default: return 0;
    }
  };
  const sortedCampaigns = sort
    ? [...filteredCampaigns].sort((a, b) => {
        const av = sortVal(a, sort.key), bv = sortVal(b, sort.key);
        const cmp = typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv));
        return sort.dir === 'asc' ? cmp : -cmp;
      })
    : filteredCampaigns;
  const SortHead = ({ label, k, right }: { label: string; k: string; right?: boolean }) => (
    <TableHead className={right ? 'text-right' : ''}>
      <button onClick={() => toggleSort(k)} className={`inline-flex items-center gap-1 select-none hover:text-slate-900 ${right ? 'flex-row-reverse' : ''}`}>
        {label}
        {sort?.key === k
          ? (sort.dir === 'asc' ? <ArrowUp className="h-3 w-3 text-emerald-600" /> : <ArrowDown className="h-3 w-3 text-destructive" />)
          : <ArrowUpDown className="h-3 w-3 text-slate-300" />}
      </button>
    </TableHead>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">Phishing Simulations</h1>
          <p className="text-sm text-slate-500 mt-0.5">Deploy authorized mock campaigns to evaluate workforce vigilance.</p>
        </div>
        <Button onClick={() => setWizardOpen(true)} className="flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> New Campaign
        </Button>
      </div>

      {/* Campaigns Listing */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 gap-2">
          <div>
            <CardTitle>Simulation History</CardTitle>
            <CardDescription>Deploy mock credential harvesters or direct link clicks.</CardDescription>
          </div>
          <div className="flex items-center gap-1">
            {(['all', 'draft', 'active', 'completed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded-md text-xs font-semibold capitalize border transition-all ${
                  filterStatus === status 
                    ? 'bg-slate-900 border-slate-950 text-white' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <RefreshCw className="h-10 w-10 text-primary animate-spin" />
              <span className="text-sm font-medium text-slate-500">Loading simulations...</span>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="text-center py-16">
              <Mail className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-700">No campaigns found</h3>
              <p className="text-xs text-slate-400 mt-1">Deploy a new simulation run to populate statistics.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <SortHead label="Campaign Name" k="name" />
                  <SortHead label="Subject Line" k="subject" />
                  <SortHead label="Delivered" k="delivered" />
                  <SortHead label="Opened" k="opened" />
                  <SortHead label="Clicked" k="clicked" />
                  <SortHead label="Status" k="status" />
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCampaigns.map((camp, idx) => {
                  const idVal = camp._id || camp.id;
                  const sent = camp.sentCount || camp.sent_count || 0;
                  const opened = camp.openedCount || camp.opened_count || 0;
                  const clicked = camp.clickedCount || camp.clicked_count || 0;

                  return (
                    <TableRow key={idVal}>
                      <TableCell className="text-slate-400 text-xs">{idx + 1}</TableCell>
                      <TableCell className="font-semibold text-slate-900">{camp.name}</TableCell>
                      <TableCell className="text-slate-650 max-w-[200px] truncate">{camp.subject}</TableCell>
                      <TableCell className="font-medium">{sent}</TableCell>
                      <TableCell className="text-slate-600">{opened}</TableCell>
                      <TableCell className={clicked > 0 ? 'text-destructive font-bold' : 'text-slate-600'}>
                        {clicked}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          camp.status === 'active' ? 'warning' : camp.status === 'completed' ? 'success' : 'secondary'
                        }>
                          {camp.status}
                        </Badge>
                        {camp.status === 'draft' && camp.scheduledAt && (
                          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {new Date(camp.scheduledAt).toLocaleString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-primary"
                            onClick={() => openPreview(camp)}
                            title="Preview campaign"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-primary"
                            onClick={() => openCampaignReport(camp)}
                            title="View campaign report"
                          >
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                          {camp.status === 'draft' && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-primary"
                                onClick={() => openDraftEdit(camp)}
                                title="Edit draft"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleLaunchCampaign(idVal, camp.name)}
                                loading={launchingId === idVal}
                                disabled={launchingId !== null && launchingId !== idVal}
                                className="h-8"
                              >
                                {launchingId === idVal ? 'Sending...' : (
                                  <>
                                    <Play className="h-3.5 w-3.5 mr-1 fill-current" /> Deploy
                                  </>
                                )}
                              </Button>
                              {camp.scheduledAt ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-slate-400 hover:text-destructive"
                                  onClick={() => handleCancelSchedule(camp)}
                                  title="Cancel scheduled send"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-slate-400 hover:text-primary"
                                  onClick={() => openScheduleDialog(camp)}
                                  title="Schedule for later"
                                >
                                  <Clock className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteCampaignClick(idVal)}
                            className="text-slate-400 hover:text-destructive h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Creation Wizard Dialog */}
      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Deploy Simulation Wizard (Step {wizardStep} of 4)</DialogTitle>
            <DialogDescription>
              Deploy mock security audit payloads to track organizational vigilance.
            </DialogDescription>
          </DialogHeader>

          {/* Wizard Step 1: Core Details */}
          {wizardStep === 1 && (
            <div className="space-y-4 py-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 mb-1">Campaign Reference Name</label>
                <Input 
                  required
                  placeholder="e.g. Q3 Office 365 Phishing Audit" 
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Sender Mask Name</label>
                <Input 
                  required
                  placeholder="e.g. Microsoft IT Gateway" 
                  value={newCampaign.senderName}
                  onChange={(e) => setNewCampaign({ ...newCampaign, senderName: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Wizard Step 2: Select Audience */}
          {wizardStep === 2 && (() => {
            const deptOptions = Array.from(new Set(employees.map((e) => e.department).filter(Boolean))).sort();
            const visibleEmployees = audienceDeptFilter === 'all'
              ? employees
              : employees.filter((e) => e.department === audienceDeptFilter);
            const visibleIds = visibleEmployees.map((e) => e._id || e.id);
            const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedEmployeeIds.includes(id));
            return (
            <div className="py-4">
              <div className="flex items-center justify-between mb-2 gap-2">
                <label className="block text-xs font-semibold text-slate-700 shrink-0">Target Employees</label>
                <div className="flex items-center gap-2">
                  {deptOptions.length > 0 && (
                    <Select
                      value={audienceDeptFilter}
                      onChange={(e) => setAudienceDeptFilter(e.target.value)}
                      className="h-7 text-[10px] py-0"
                    >
                      <option value="all">All departments</option>
                      {deptOptions.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </Select>
                  )}
                  <button
                    type="button"
                    className="text-[10px] font-semibold text-primary hover:underline shrink-0"
                    onClick={() =>
                      setSelectedEmployeeIds((prev) =>
                        allVisibleSelected
                          ? prev.filter((id) => !visibleIds.includes(id))
                          : Array.from(new Set([...prev, ...visibleIds]))
                      )
                    }
                  >
                    {allVisibleSelected ? 'Deselect all' : 'Select all'}
                  </button>
                </div>
              </div>
              {employees.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No employees in the directory yet. Add employees before creating a campaign.
                </p>
              ) : visibleEmployees.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No employees in this department.
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {visibleEmployees.map((emp) => {
                    const empId = emp._id || emp.id;
                    const checked = selectedEmployeeIds.includes(empId);
                    return (
                      <div
                        key={empId}
                        onClick={() => toggleEmployeeSelected(empId)}
                        className={`p-3 border rounded-lg flex items-center justify-between cursor-pointer transition-all ${
                          checked ? 'border-primary bg-amber-50/20' : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <h4 className="font-semibold text-xs text-slate-900">{emp.name}</h4>
                          <p className="text-[10px] text-slate-500">{emp.email}{emp.department ? ` · ${emp.department}` : ''}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleEmployeeSelected(empId)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 accent-primary"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="text-[10px] text-slate-400 font-normal mt-2 leading-relaxed">
                {selectedEmployeeIds.length} of {employees.length} employee(s) selected.
              </p>
            </div>
            );
          })()}

          {/* Wizard Step 3: Choose Template */}
          {wizardStep === 3 && (
            <div className="space-y-3 py-4 max-h-60 overflow-y-auto">
              {templates.map((temp) => {
                const tempId = temp._id || temp.id;
                return (
                  <div 
                    key={tempId}
                    onClick={() => setNewCampaign({
                      ...newCampaign,
                      templateId: tempId,
                      subject: temp.subject,
                      bodyHtml: temp.body || '',
                      redirectUrl: defaultRedirectForTemplate(temp),
                    })}
                    className={`p-3 border rounded-lg flex items-center justify-between cursor-pointer transition-all ${
                      newCampaign.templateId === tempId 
                        ? 'border-primary bg-amber-50/20' 
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{temp.thumbnail && (temp.thumbnail.startsWith('/') || temp.thumbnail.startsWith('http')) ? '🎨' : (temp.thumbnail || '🔑')}</span>
                      <div>
                        <h4 className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                          {temp.name}
                          {newCampaign.templateId === tempId && newCampaign.bodyHtml && newCampaign.bodyHtml !== (temp.body || '') && (
                            <Badge variant="warning" className="text-[9px] scale-90">Customised</Badge>
                          )}
                        </h4>
                        <p className="text-[10px] text-slate-500">{temp.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-primary"
                        title="Preview email"
                        onClick={(e) => { e.stopPropagation(); setPreviewTemplate(temp); }}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-primary"
                        title="Edit for this campaign"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Select this template and open the per-campaign editor,
                          // seeding the draft from whatever is current (an earlier
                          // edit on this template, else the saved template body).
                          const alreadySelected = newCampaign.templateId === tempId;
                          setNewCampaign((prev) => ({
                            ...prev,
                            templateId: tempId,
                            subject: alreadySelected ? prev.subject : temp.subject,
                            bodyHtml: alreadySelected && prev.bodyHtml ? prev.bodyHtml : (temp.body || ''),
                            redirectUrl: alreadySelected && prev.redirectUrl ? prev.redirectUrl : defaultRedirectForTemplate(temp),
                          }));
                          setTemplateDraft({
                            subject: alreadySelected && newCampaign.subject ? newCampaign.subject : temp.subject || '',
                            bodyHtml: alreadySelected && newCampaign.bodyHtml ? newCampaign.bodyHtml : (temp.body || ''),
                            redirectUrl: alreadySelected && newCampaign.redirectUrl ? newCampaign.redirectUrl : defaultRedirectForTemplate(temp),
                          });
                          setEditTemplateOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {newCampaign.templateId === tempId && (
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Wizard Step 4: Sender Configuration */}
          {wizardStep === 4 && (
            <div className="space-y-4 py-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 mb-1">Select Outgoing SMTP / SendGrid Profile</label>
                <Select
                  value={newCampaign.emailConfigId}
                  onChange={(e) => setNewCampaign({ ...newCampaign, emailConfigId: e.target.value })}
                >
                  <option value="">Default System gateway (Workmate Shield Shared SMTP)</option>
                  {settings?.emailConfigs.map((cfg: any) => (
                    <option key={cfg.id} value={cfg.id}>
                      {cfg.name} ({cfg.provider === 'smtp' ? 'SMTP' : 'SendGrid'}): {cfg.fromEmail}
                    </option>
                  ))}
                </Select>
                <p className="text-[10px] text-slate-400 font-normal mt-1.5 leading-relaxed">
                  Tenant configuration allows you to select custom SMTP profiles to bypass spam triggers.
                  To send from your own company domain, add a profile in Tenant Settings first.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Post-Click Redirect URL</label>
                <Input
                  placeholder="https://login.microsoftonline.com"
                  value={newCampaign.redirectUrl}
                  onChange={(e) => setNewCampaign({ ...newCampaign, redirectUrl: e.target.value })}
                />
                <p className="text-[10px] text-slate-400 font-normal mt-1.5 leading-relaxed">
                  Where the &quot;Sign in&quot; button on the awareness page sends the recipient afterward.
                  Pre-filled to match the selected template, but you can point it anywhere.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Training video / resource link <span className="text-slate-400 font-normal">(optional)</span></label>
                <Input
                  placeholder="https://youtube.com/watch?v=…  or any training page URL"
                  value={newCampaign.trainingUrl}
                  onChange={(e) => setNewCampaign({ ...newCampaign, trainingUrl: e.target.value })}
                />
                <p className="text-[10px] text-slate-400 font-normal mt-1.5 leading-relaxed">
                  Shown on the &quot;you&apos;ve been phished&quot; awareness page after the recipient submits the form.
                  A YouTube link embeds as a video; any other link shows as a button.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between items-center sm:justify-between w-full">
            <div>
              {wizardStep > 1 && (
                <Button variant="outline" size="sm" onClick={() => setWizardStep(wizardStep - 1)}>
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setWizardOpen(false)}>
                Cancel
              </Button>
              {wizardStep < 4 ? (
                <Button
                  size="sm"
                  onClick={() => setWizardStep(wizardStep + 1)}
                  disabled={wizardStep === 2 && selectedEmployeeIds.length === 0}
                >
                  Next
                </Button>
              ) : (
                <Button size="sm" onClick={handleCreateCampaign}>
                  Create Campaign Draft
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Email Template Preview</DialogTitle>
            <DialogDescription>Exactly how this template renders in a recipient&apos;s inbox, with sample data filled in.</DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
              <div className="bg-slate-50 p-3 border-b border-slate-200 font-semibold space-y-1">
                <div><span className="text-slate-400">From:</span> {newCampaign.senderName || 'IT Security Team'} &lt;security@yourcompany.com&gt;</div>
                <div><span className="text-slate-400">Subject:</span> {previewTemplate.subject}</div>
              </div>
              <iframe
                title="Email preview"
                sandbox=""
                srcDoc={renderTemplatePreviewHtml(previewTemplate)}
                className="w-full bg-white"
                style={{ height: '440px', border: 'none' }}
              />
            </div>
          )}
          <DialogFooter>
            <Button size="sm" onClick={() => setPreviewTemplate(null)}>
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit-template-for-this-campaign Dialog */}
      <Dialog open={editTemplateOpen} onOpenChange={setEditTemplateOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit template for this campaign</DialogTitle>
            <DialogDescription>
              Changes here apply to this one simulation only — the saved template is left untouched.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 mb-1">Email Subject</label>
                <Input
                  value={templateDraft.subject}
                  onChange={(e) => setTemplateDraft({ ...templateDraft, subject: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-1">Post-Click Redirect URL</label>
                <Input
                  value={templateDraft.redirectUrl}
                  onChange={(e) => setTemplateDraft({ ...templateDraft, redirectUrl: e.target.value })}
                  placeholder="https://login.microsoftonline.com"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-1">Email Body (HTML)</label>
                <textarea
                  value={templateDraft.bodyHtml}
                  onChange={(e) => setTemplateDraft({ ...templateDraft, bodyHtml: e.target.value })}
                  spellCheck={false}
                  className="w-full h-64 rounded-md border border-slate-200 p-2 font-mono text-[11px] leading-relaxed text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <p className="text-[10px] text-slate-400 font-normal mt-1">
                  Use placeholders like {'{{first_name}}'} and {'{{phishing_link}}'} — they are filled in per recipient when the campaign sends.
                </p>
              </div>
            </div>
            <div className="text-xs">
              <label className="block text-slate-700 mb-1 font-semibold">Live preview</label>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 p-2 border-b border-slate-200 font-semibold space-y-0.5">
                  <div><span className="text-slate-400">From:</span> {newCampaign.senderName || 'IT Security Team'}</div>
                  <div className="truncate"><span className="text-slate-400">Subject:</span> {templateDraft.subject || '(no subject)'}</div>
                </div>
                <iframe
                  title="Edited email preview"
                  sandbox=""
                  srcDoc={renderTemplatePreviewHtml({ body: templateDraft.bodyHtml, thumbnail: templates.find(t => (t._id || t.id) === newCampaign.templateId)?.thumbnail })}
                  className="w-full bg-white"
                  style={{ height: '340px', border: 'none' }}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setEditTemplateOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setNewCampaign((prev) => ({
                  ...prev,
                  subject: templateDraft.subject,
                  bodyHtml: templateDraft.bodyHtml,
                  redirectUrl: templateDraft.redirectUrl,
                }));
                setEditTemplateOpen(false);
                toast.success('Template customised for this campaign.');
              }}
            >
              Apply changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={!!scheduleCampaign} onOpenChange={(open) => !open && setScheduleCampaign(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Schedule Deployment</DialogTitle>
            <DialogDescription>
              Choose when &quot;{scheduleCampaign?.name}&quot; should automatically send — no need to be online at that time.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 text-xs font-semibold">
            <label className="block text-slate-700 mb-1">Send Date & Time</label>
            <Input
              type="datetime-local"
              min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
              value={scheduleDateTime}
              onChange={(e) => setScheduleDateTime(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setScheduleCampaign(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirmSchedule} loading={scheduling} disabled={!scheduleDateTime}>
              Confirm Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Draft Edit Dialog */}
      <Dialog open={!!editDraftId} onOpenChange={(open) => !open && setEditDraftId(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit draft campaign</DialogTitle>
            <DialogDescription>Make changes to this draft before launching it. Changes are saved to the draft.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 mb-1">Campaign name</label>
                <Input value={editDraft.name} onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-slate-700 mb-1">Subject</label>
                <Input value={editDraft.subject} onChange={(e) => setEditDraft({ ...editDraft, subject: e.target.value })} />
              </div>
              <div>
                <label className="block text-slate-700 mb-1">Sender name</label>
                <Input value={editDraft.senderName} onChange={(e) => setEditDraft({ ...editDraft, senderName: e.target.value })} />
              </div>
              <div>
                <label className="block text-slate-700 mb-1">Post-click redirect URL</label>
                <Input value={editDraft.redirectUrl} onChange={(e) => setEditDraft({ ...editDraft, redirectUrl: e.target.value })} />
              </div>
              <div>
                <label className="block text-slate-700 mb-1">Training video / resource link</label>
                <Input value={editDraft.trainingUrl} onChange={(e) => setEditDraft({ ...editDraft, trainingUrl: e.target.value })} />
              </div>
              <div>
                <label className="block text-slate-700 mb-1">Email body (HTML)</label>
                <textarea
                  value={editDraft.bodyHtml}
                  onChange={(e) => setEditDraft({ ...editDraft, bodyHtml: e.target.value })}
                  spellCheck={false}
                  className="w-full h-48 rounded-md border border-slate-200 p-2 font-mono text-[11px] leading-relaxed text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="text-xs">
              <label className="block text-slate-700 mb-1 font-semibold">Live preview</label>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 p-2 border-b border-slate-200 font-semibold space-y-0.5">
                  <div className="truncate"><span className="text-slate-400">From:</span> {editDraft.senderName || 'IT Security Team'}</div>
                  <div className="truncate"><span className="text-slate-400">Subject:</span> {editDraft.subject || '(no subject)'}</div>
                </div>
                <iframe
                  title="Draft email preview"
                  sandbox=""
                  srcDoc={renderTemplatePreviewHtml({ body: editDraft.bodyHtml })}
                  className="w-full bg-white"
                  style={{ height: '320px', border: 'none' }}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setEditDraftId(null)}>Cancel</Button>
            <Button size="sm" loading={editDraftSaving} onClick={handleSaveDraft}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Campaign Preview Dialog */}
      <Dialog open={!!previewCampaign} onOpenChange={(open) => !open && setPreviewCampaign(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewCampaign?.name}</DialogTitle>
            <DialogDescription>What this simulation will send — email, sender and destinations.</DialogDescription>
          </DialogHeader>
          {previewCampaign && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-xs">
                {([
                  ['Status', previewCampaign.status],
                  ['Subject line', previewCampaign.subject],
                  ['Sender name', previewCampaign.sender_name || previewCampaign.senderName],
                  ['Post-click redirect', previewCampaign.redirect_url || '—'],
                  ['Training resource', previewCampaign.training_url || '—'],
                  ['Delivered / Opened / Clicked', `${previewCampaign.sentCount || previewCampaign.total_sent || 0} / ${previewCampaign.openedCount || previewCampaign.total_opened || 0} / ${previewCampaign.clickedCount || previewCampaign.total_clicked || 0}`],
                ] as [string, string][]).map(([label, val]) => (
                  <div key={label}>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{label}</div>
                    <div className="text-slate-800 break-words">{val || '—'}</div>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Email preview</div>
                {previewLoading ? (
                  <p className="text-xs text-slate-400 py-6 text-center border border-slate-200 rounded-lg">Loading…</p>
                ) : previewCampaign.body_html ? (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <iframe
                      title="Campaign email preview"
                      sandbox=""
                      srcDoc={renderTemplatePreviewHtml({ body: previewCampaign.body_html })}
                      className="w-full bg-white"
                      style={{ height: '360px', border: 'none' }}
                    />
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center border border-slate-200 rounded-lg">No email body stored for this campaign.</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button size="sm" onClick={() => setPreviewCampaign(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Campaign Report Dialog */}
      <Dialog open={!!reportCampaign} onOpenChange={(open) => !open && setReportCampaign(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{reportCampaign?.name}</DialogTitle>
            <DialogDescription>{reportCampaign?.subject}</DialogDescription>
          </DialogHeader>
          {reportCampaign && (() => {
            const sent = reportCampaign.sentCount || reportCampaign.sent_count || 0;
            const clicked = reportCampaign.clickedCount || reportCampaign.clicked_count || 0;
            // A click always implies the email was opened (the backend
            // enforces this), so the funnel can never legitimately show
            // fewer opens than clicks - the max() only guards against
            // stale cached counts from before that rule existed.
            const opened = Math.max(reportCampaign.openedCount || reportCampaign.opened_count || 0, clicked);
            const funnel = [
              { stage: 'Sent', value: sent, fill: '#7a1220' },
              { stage: 'Opened', value: opened, fill: '#f59e0b' },
              { stage: 'Clicked', value: clicked, fill: '#ef4444' },
            ];
            const openRate = sent > 0 ? Math.round((opened / sent) * 100) : 0;
            const clickRate = sent > 0 ? Math.round((clicked / sent) * 100) : 0;
            const clickThrough = opened > 0 ? Math.round((clicked / opened) * 100) : 0;
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-center">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-xl font-bold text-slate-900">{sent}</div>
                    <div className="text-[10px] text-slate-600 font-semibold">Sent</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-xl font-bold text-amber-600">{opened}</div>
                    <div className="text-[10px] text-slate-600 font-semibold">Opened</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-xl font-bold text-destructive">{clicked}</div>
                    <div className="text-[10px] text-slate-600 font-semibold">Clicked</div>
                  </div>
                  <div className="p-3 bg-amber-50/40 rounded-lg border border-amber-100">
                    <div className="text-xl font-bold text-amber-600">{openRate}%</div>
                    <div className="text-[10px] text-slate-600 font-semibold">Open rate</div>
                  </div>
                  <div className="p-3 bg-red-50/40 rounded-lg border border-red-100">
                    <div className="text-xl font-bold text-destructive">{clickRate}%</div>
                    <div className="text-[10px] text-slate-600 font-semibold">Click rate</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-xl font-bold text-slate-900">{clickThrough}%</div>
                    <div className="text-[10px] text-slate-600 font-semibold">Clicked / opened</div>
                  </div>
                </div>

                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnel} layout="vertical" margin={{ left: 8, right: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="stage" width={60} tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={22} animationDuration={600}>
                        {funnel.map((item, idx) => (
                          <Cell key={idx} fill={item.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-slate-900">Recipient breakdown</h4>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        className="h-8 gap-1.5 text-xs"
                        onClick={downloadCampaignReportPdf}
                        loading={pdfExporting}
                        disabled={reportLoading || reportRecipients.length === 0}
                        title="Download a full PDF report"
                      >
                        <FileText className="h-3.5 w-3.5" /> Download PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs"
                        onClick={downloadCampaignReportCsv}
                        disabled={reportLoading || reportRecipients.length === 0}
                        title="Download the raw data as CSV"
                      >
                        <Download className="h-3.5 w-3.5" /> CSV
                      </Button>
                    </div>
                  </div>
                  <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 [&>th]:h-10 [&>th]:text-slate-700 [&>th]:font-semibold">
                          <TableHead>Recipient</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Opened</TableHead>
                          <TableHead>Clicked</TableHead>
                          <TableHead>Device</TableHead>
                          <TableHead>IP address</TableHead>
                          <TableHead>Location (approx.)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportLoading ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-6 text-slate-400 text-xs">
                              Loading recipients...
                            </TableCell>
                          </TableRow>
                        ) : reportRecipients.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-6 text-slate-400 text-xs">
                              No recipients on this campaign.
                            </TableCell>
                          </TableRow>
                        ) : (
                          reportRecipients.map((r: any, idx: number) => {
                            const status = recipientDisplayStatus(r);
                            const env = recipientEnvironment(r);
                            const openCount = r.open_count || 0;
                            const clickCount = r.click_count || 0;
                            return (
                            <TableRow key={r._id || r.id || idx}>
                              <TableCell>
                                <div className="font-semibold text-slate-900">{r.name || r.email}</div>
                                {r.name && r.name !== r.email && (
                                  <div className="text-[11px] text-slate-500">{r.email}</div>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant={status === 'clicked' || status === 'failed' ? 'danger' : status === 'opened' ? 'warning' : 'secondary'}>
                                  {status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-slate-700">
                                {r.opened_at ? new Date(r.opened_at).toLocaleString() : '-'}
                                {r.opened_at && (
                                  <div className="text-[10px] text-slate-500">
                                    {openCount > 0 ? `${openCount}× tracked` : 'inferred from click'}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-slate-700">
                                {r.clicked_at ? new Date(r.clicked_at).toLocaleString() : '-'}
                                {clickCount > 0 && (
                                  <div className="text-[10px] text-slate-500">{clickCount}× clicked</div>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-slate-700">
                                {env.device || env.os || env.browser
                                  ? [env.device, env.os, env.browser].filter(Boolean).join(' · ')
                                  : '-'}
                              </TableCell>
                              <TableCell className="text-[11px] text-slate-700 font-mono">
                                {env.clickIp && <div>Click: {env.clickIp}</div>}
                                {env.openIp && (
                                  <div>
                                    Open: {env.openIp}
                                    {env.openViaProxy && (
                                      <span className="font-sans text-[10px] text-slate-500"> (Gmail proxy)</span>
                                    )}
                                  </div>
                                )}
                                {!env.clickIp && !env.openIp && '-'}
                              </TableCell>
                              <TableCell className="text-xs text-slate-500">
                                {env.location.geo ? (() => {
                                  const g = env.location.geo;
                                  const place = [g.city, g.region, g.countryCode || g.country].filter(Boolean).join(', ');
                                  return (
                                    <div className="space-y-0.5">
                                      <div className="font-semibold text-slate-900">{place || '-'}</div>
                                      {g.lat !== null && g.lon !== null && (
                                        <a
                                          href={`https://www.openstreetmap.org/?mlat=${g.lat}&mlon=${g.lon}#map=10/${g.lat}/${g.lon}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="font-mono text-[11px] text-primary hover:underline"
                                        >
                                          {g.lat.toFixed(3)}, {g.lon.toFixed(3)}
                                        </a>
                                      )}
                                      {g.isp && <div className="text-[10px] text-slate-500">{g.isp}</div>}
                                      {g.hostname && (
                                        <div className="text-[10px] text-slate-500 font-mono break-all" title={g.hostname}>
                                          {g.hostname}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })() : env.location.proxyOnly ? (
                                  <span className="text-[10px] text-slate-500">Only seen via Gmail's image proxy - no real location</span>
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                            </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
                    Location is estimated from the IP address: usually the nearest ISP hub, often tens of
                    kilometres off, and unreliable for VPNs and mobile networks. The name shown under it is
                    the IP&apos;s reverse-DNS name (typically the ISP&apos;s gateway), not the device&apos;s own
                    name. A device&apos;s hostname and MAC address are never sent to a website, so they can&apos;t
                    be reported.
                  </p>
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button size="sm" onClick={() => setReportCampaign(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Delete Campaign
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this campaign? This action is permanent and deletes all associated tracking events and statistics.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={confirmDeleteCampaign}>
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
