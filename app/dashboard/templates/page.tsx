'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileCode, 
  Plus, 
  Search, 
  Eye, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle,
  Upload,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { api, API_BASE } from '@/lib/api';
import { PhishingTemplate } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import Link from 'next/link';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<any | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creationMode, setCreationMode] = useState<'manual' | 'ai'>('manual');

  // Image Upload State
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');

  // AI Occasion Generator State
  const [generating, setGenerating] = useState(false);
  const [aiOccasion, setAiOccasion] = useState('Diwali');

  // New Template Form
  const [newTemp, setNewTemp] = useState({
    name: '',
    category: 'credential-harvester',
    subject: '',
    body: '',
    description: '',
    thumbnail: ''
  });

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await api.templates.list();
      setTemplates(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load templates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds the 5 MB limit.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.uploadImage(formData);
      const fullUrl = res.url;
      setNewTemp(prev => ({ ...prev, thumbnail: fullUrl }));
      setImagePreview(fullUrl);
      toast.success('Template image uploaded successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleAIGenerate = async () => {
    setGenerating(true);
    try {
      const result = await api.ai.generateTemplate(aiOccasion);
      
      // Auto populate fields
      setNewTemp({
        name: `${aiOccasion} Security Awareness`,
        category: 'link-click',
        subject: result.subject || '',
        body: result.body || '',
        description: `Gemini AI-generated awareness template for ${aiOccasion}.`,
        thumbnail: result.thumbnail || '🎨'
      });
      setImagePreview('');
      toast.success(`Generated template options for ${aiOccasion} successfully.`);
    } catch (err: any) {
      toast.error(err.message || 'AI template generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemp.name || !newTemp.subject || !newTemp.body) {
      toast.error('Template name, subject, and body content are required.');
      return;
    }

    try {
      // If no thumbnail was selected/uploaded, assign a default category indicator
      const thumbnailVal = newTemp.thumbnail || (
        newTemp.category === 'credential-harvester' ? '🔑' : newTemp.category === 'link-click' ? '🔗' : '📎'
      );

      await api.templates.create({
        name: newTemp.name,
        category: newTemp.category,
        subject: newTemp.subject,
        body: newTemp.body,
        description: newTemp.description,
        thumbnail: thumbnailVal
      });

      toast.success(`Simulation Template "${newTemp.name}" created successfully.`);
      setCreateOpen(false);
      setNewTemp({ name: '', category: 'credential-harvester', subject: '', body: '', description: '', thumbnail: '' });
      setImagePreview('');
      loadTemplates();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create template.');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this custom template?')) return;
    try {
      await api.templates.delete(id);
      toast.success('Template removed successfully.');
      loadTemplates();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete template.');
    }
  };

  const handlePreview = (temp: any) => {
    setActiveTemplate(temp);
    setPreviewOpen(true);
  };

  // Fills in the same placeholders the real send pipeline substitutes, with
  // realistic sample values, so the preview shows what a recipient would
  // actually see rather than raw {{tokens}}.
  const renderPreviewHtml = (temp: any) => {
    if (!temp?.body) return '';
    return temp.body
      .replaceAll('{{greeting}}', 'Hi')
      .replaceAll('{{first_name}}', 'Alex')
      .replaceAll('{{email}}', 'alex.morgan@yourcompany.com')
      .replaceAll('{{phishing_link}}', '#preview-only');
  };

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' ? true : t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getThumbnailElement = (thumbnail: string) => {
    if (!thumbnail) return <span className="text-2xl">📁</span>;
    if (thumbnail.startsWith('http') || thumbnail.startsWith('/')) {
      const srcUrl = thumbnail.startsWith('/') ? `${API_BASE}${thumbnail}` : thumbnail;
      return (
        <img 
          src={srcUrl} 
          alt="thumbnail" 
          className="w-10 h-10 rounded object-cover border border-slate-200" 
          onError={(e) => {
            // fallback
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      );
    }
    return <span className="text-2xl">{thumbnail}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">Phishing Templates Library</h1>
          <p className="text-sm text-slate-500 mt-0.5">Explore standard cybersecurity warning payloads or craft tailor-made templates.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="flex items-center gap-1.5 size-sm">
          <Plus className="h-4 w-4" /> New Template
        </Button>
      </div>

      {/* Search / Filter header */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search template library by keyword or email subject..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1.5 w-full md:w-auto text-xs font-semibold">
            <span className="text-slate-500 shrink-0">Category:</span>
            <Select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-48"
            >
              <option value="all">All categories</option>
              <option value="credential-harvester">Credential Harvester</option>
              <option value="link-click">Link Click</option>
              <option value="malicious-attachment">Malicious Attachment</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Grid List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <RefreshCw className="h-10 w-10 text-primary animate-spin" />
          <span className="text-sm font-medium text-slate-500">Loading templates...</span>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-lg bg-white">
          <FileCode className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-700">No templates found</h3>
          <p className="text-xs text-slate-400 mt-1">Try modifying your search filter or create a new template.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((temp) => (
            <Card key={temp._id || temp.id} className="flex flex-col justify-between relative group hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  {getThumbnailElement(temp.thumbnail)}
                  <div className="flex items-center gap-1.5">
                    <Badge variant={
                      temp.category === 'credential-harvester' ? 'danger' : temp.category === 'link-click' ? 'warning' : 'info'
                    } className="capitalize text-[10px]">
                      {temp.category.replace('-', ' ')}
                    </Badge>
                    {temp.is_global && (
                      <Badge variant="secondary" className="text-[10px]">Global</Badge>
                    )}
                  </div>
                </div>
                <CardTitle className="text-sm font-bold text-slate-800 mt-2 truncate">{temp.name}</CardTitle>
                <CardDescription className="text-xs mt-1 text-slate-500 line-clamp-2 h-8 leading-relaxed">
                  {temp.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs pt-0">
                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="font-semibold text-slate-500">Subject:</span>
                  <p className="text-slate-700 font-medium truncate mt-0.5">{temp.subject}</p>
                </div>
              </CardContent>
              <CardFooter className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => handlePreview(temp)} className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" /> Preview
                </Button>
                <div className="flex gap-2">
                  {!temp.is_global && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteTemplate(temp._id || temp.id)}
                      className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <Link href="/dashboard/campaigns">
                    <Button variant="outline" size="sm">
                      Use
                    </Button>
                  </Link>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Email Template Preview</DialogTitle>
            <DialogDescription>Exactly how this simulation payload renders in a recipient&apos;s inbox, with sample data filled in.</DialogDescription>
          </DialogHeader>

          {activeTemplate && (
            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
              <div className="bg-slate-50 p-3 border-b border-slate-200 font-semibold space-y-1">
                <div><span className="text-slate-400">From:</span> {activeTemplate.sender_name || 'IT Security Team'} &lt;security@yourcompany.com&gt;</div>
                <div><span className="text-slate-400">Subject:</span> {activeTemplate.subject}</div>
              </div>
              <iframe
                title="Email preview"
                sandbox=""
                srcDoc={renderPreviewHtml(activeTemplate)}
                className="w-full bg-white"
                style={{ height: '480px', border: 'none' }}
              />
            </div>
          )}

          <DialogFooter>
            <Button size="sm" onClick={() => setPreviewOpen(false)}>
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Craft Simulation Scenario</DialogTitle>
            <DialogDescription>Create a custom template payload mapping to company tools.</DialogDescription>
          </DialogHeader>

          {/* Creation Mode Tabs */}
          <div className="flex border-b border-slate-200 mb-4">
            <button 
              type="button"
              className={`flex-1 py-2 text-center text-xs font-semibold border-b-2 transition-all ${
                creationMode === 'manual' 
                  ? 'border-primary text-primary font-bold' 
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setCreationMode('manual')}
            >
              Manual Builder
            </button>
            <button 
              type="button"
              className={`flex-1 py-2 text-center text-xs font-semibold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                creationMode === 'ai' 
                  ? 'border-primary text-primary font-bold' 
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setCreationMode('ai')}
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" /> AI Occasion Generator
            </button>
          </div>

          {creationMode === 'ai' && (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 text-xs">
              <label className="block text-slate-700 font-bold mb-1.5">Select Occasion Theme</label>
              <div className="flex gap-2">
                <Select 
                  value={aiOccasion}
                  onChange={(e) => setAiOccasion(e.target.value)}
                  className="flex-1"
                >
                  <option value="Diwali">Diwali (Festival of Lights)</option>
                  <option value="Holi">Holi (Festival of Colors)</option>
                  <option value="Christmas">Christmas Holiday Season</option>
                  <option value="New Year">New Year Bonus Announcements</option>
                  <option value="Independence Day">Independence Day Holidays</option>
                  <option value="Cyber Security Awareness">Cyber Security Awareness Month</option>
                  <option value="Phishing Awareness">Authenticator/MFA Phishing Test</option>
                  <option value="Company Announcements">Organizational Restructuring</option>
                  <option value="Password Security">Mandatory Password Expired Reset</option>
                  <option value="Data Privacy">GDPR/SOC2 Declaration</option>
                </Select>
                <Button 
                  type="button" 
                  onClick={handleAIGenerate} 
                  disabled={generating}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 flex items-center gap-1"
                >
                  {generating ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  {generating ? 'Drafting...' : 'Generate'}
                </Button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Uses Google Gemini AI to draft contextually relevant subject headers, body copies, and image tags.</p>
            </div>
          )}

          <form onSubmit={handleCreateTemplate} className="space-y-4 text-xs font-semibold">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 mb-1">Scenario Label Name</label>
                <Input 
                  required
                  placeholder="e.g. ADP Portal Payroll Lockout" 
                  value={newTemp.name}
                  onChange={(e) => setNewTemp({ ...newTemp, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Category</label>
                <Select
                  value={newTemp.category}
                  onChange={(e) => setNewTemp({ ...newTemp, category: e.target.value })}
                >
                  <option value="credential-harvester">Credential Harvester</option>
                  <option value="link-click">Link Click</option>
                  <option value="malicious-attachment">Malicious Attachment</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-slate-700 mb-1">Brief Description</label>
                <Input 
                  placeholder="Checks if employees will click on payroll verification triggers." 
                  value={newTemp.description}
                  onChange={(e) => setNewTemp({ ...newTemp, description: e.target.value })}
                />
              </div>

              {/* Image Upload Integration */}
              <div>
                <label className="block text-slate-700 mb-1">Template Header Image / Icon</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input 
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="template-image-file"
                    />
                    <label 
                      htmlFor="template-image-file"
                      className="flex items-center justify-center gap-1.5 p-2 border border-dashed border-slate-300 rounded-md cursor-pointer hover:bg-slate-50 transition-colors bg-white font-medium text-slate-600"
                    >
                      {uploading ? (
                        <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                      ) : (
                        <Upload className="h-4 w-4 text-slate-400" />
                      )}
                      {uploading ? 'Uploading...' : 'Upload Image'}
                    </label>
                  </div>
                  {imagePreview && (
                    <img 
                      src={`${API_BASE}${imagePreview}`} 
                      alt="Preview" 
                      className="w-10 h-10 object-cover rounded border border-slate-200 shrink-0" 
                    />
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 mb-1">Email Subject Header</label>
              <Input 
                required
                placeholder="Urgent: Verify your ADP payroll bank information" 
                value={newTemp.subject}
                onChange={(e) => setNewTemp({ ...newTemp, subject: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1">Email Body Content</label>
              <textarea 
                required
                rows={5}
                className="w-full border border-slate-200 bg-background rounded-md p-2 outline-hidden font-normal text-slate-800"
                placeholder="Write your email body copy here. Direct links will automatically be attached to primary action buttons."
                value={newTemp.body}
                onChange={(e) => setNewTemp({ ...newTemp, body: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" size="sm" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Save Template
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
