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
  Eye
} from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [settings, setSettings] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'draft' | 'completed'>('all');

  // Form states
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    subject: '',
    senderName: '',
    templateId: '',
    emailConfigId: ''
  });

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);

  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

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
    const bodyHtml = chosenTemplate ? chosenTemplate.body : '<p>Account verification required.</p>';

    const targetEmployees = employees.filter((e) => selectedEmployeeIds.includes(e._id || e.id));
    if (targetEmployees.length === 0) {
      toast.error('Select at least one employee to target.');
      return;
    }

    try {
      // 1. Create campaign in Flask backend
      const created = await api.campaigns.create({
        name: newCampaign.name,
        subject: newCampaign.subject,
        body_html: bodyHtml,
        sender_name: newCampaign.senderName,
        redirect_url: 'https://login.microsoftonline.com',
        email_config_id: newCampaign.emailConfigId || undefined
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
        emailConfigId: ''
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

  const handleLaunchCampaign = async (id: string, name: string) => {
    try {
      await api.campaigns.send(id);
      toast.success(`Phishing simulation "${name}" launched successfully! Emails queued.`);
      loadData();
    } catch (err: any) {
      toast.error('Failed to launch campaign: ' + err.message);
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

  const renderTemplatePreviewHtml = (temp: any) => {
    if (!temp?.body) return '';
    return temp.body
      .replaceAll('{{greeting}}', 'Hi')
      .replaceAll('{{first_name}}', 'Alex')
      .replaceAll('{{email}}', 'alex.morgan@yourcompany.com')
      .replaceAll('{{phishing_link}}', '#preview-only');
  };

  const filteredCampaigns = campaigns.filter(camp => {
    if (filterStatus === 'all') return true;
    return camp.status === filterStatus;
  });

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
                  <TableHead>Campaign Name</TableHead>
                  <TableHead>Subject Line</TableHead>
                  <TableHead>Delivered</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead>Clicked</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map((camp) => {
                  const idVal = camp._id || camp.id;
                  const sent = camp.sentCount || camp.sent_count || 0;
                  const opened = camp.openedCount || camp.opened_count || 0;
                  const clicked = camp.clickedCount || camp.clicked_count || 0;

                  return (
                    <TableRow key={idVal}>
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
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          {camp.status === 'draft' && (
                            <Button 
                              variant="primary" 
                              size="sm" 
                              onClick={() => handleLaunchCampaign(idVal, camp.name)}
                              className="h-8"
                            >
                              <Play className="h-3.5 w-3.5 mr-1 fill-current" /> Deploy
                            </Button>
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
                <label className="block text-slate-700 mb-1">Email Subject Header</label>
                <Input 
                  required
                  placeholder="Urgent action required: Corporate password security update" 
                  value={newCampaign.subject}
                  onChange={(e) => setNewCampaign({ ...newCampaign, subject: e.target.value })}
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
          {wizardStep === 2 && (
            <div className="py-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-700">Target Employees</label>
                <button
                  type="button"
                  className="text-[10px] font-semibold text-primary hover:underline"
                  onClick={() =>
                    setSelectedEmployeeIds(
                      selectedEmployeeIds.length === employees.length
                        ? []
                        : employees.map((e) => e._id || e.id)
                    )
                  }
                >
                  {selectedEmployeeIds.length === employees.length ? 'Deselect all' : 'Select all'}
                </button>
              </div>
              {employees.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No employees in the directory yet. Add employees before creating a campaign.
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {employees.map((emp) => {
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
                          <p className="text-[10px] text-slate-500">{emp.email}</p>
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
          )}

          {/* Wizard Step 3: Choose Template */}
          {wizardStep === 3 && (
            <div className="space-y-3 py-4 max-h-60 overflow-y-auto">
              {templates.map((temp) => {
                const tempId = temp._id || temp.id;
                return (
                  <div 
                    key={tempId}
                    onClick={() => setNewCampaign({ ...newCampaign, templateId: tempId, subject: temp.subject })}
                    className={`p-3 border rounded-lg flex items-center justify-between cursor-pointer transition-all ${
                      newCampaign.templateId === tempId 
                        ? 'border-primary bg-amber-50/20' 
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{temp.thumbnail && (temp.thumbnail.startsWith('/') || temp.thumbnail.startsWith('http')) ? '🎨' : (temp.thumbnail || '🔑')}</span>
                      <div>
                        <h4 className="font-semibold text-xs text-slate-900">{temp.name}</h4>
                        <p className="text-[10px] text-slate-500">{temp.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-primary"
                        onClick={(e) => { e.stopPropagation(); setPreviewTemplate(temp); }}
                      >
                        <Eye className="h-3.5 w-3.5" />
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
                      {cfg.name} ({cfg.provider === 'smtp' ? 'SMTP' : 'SendGrid'}) — {cfg.fromEmail}
                    </option>
                  ))}
                </Select>
                <p className="text-[10px] text-slate-400 font-normal mt-1.5 leading-relaxed">
                  Tenant configuration allows you to select custom SMTP profiles to bypass spam triggers.
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
