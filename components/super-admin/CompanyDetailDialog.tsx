'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, FileText, MapPin, Mail, Palette, Pencil, Phone, Send, User, Users } from 'lucide-react';

const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '';

const isHexColor = (c?: string) => !!c && /^#[0-9a-fA-F]{6}$/.test(c);

/** Brand colour for accents; falls back to the app's maroon if the stored value isn't a plain #rrggbb. */
const brandColor = (c?: string) => (isHexColor(c) ? (c as string) : '#7a1220');

/** White or near-black, whichever reads better on the given brand colour (WCAG relative luminance). */
const readableOn = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.5 ? '#0f172a' : '#ffffff';
};

const initials = (name?: string) =>
  (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';

const RISK_VARIANT: Record<string, 'danger' | 'warning' | 'success'> = { high: 'danger', medium: 'warning', low: 'success' };

export interface CompanySummary {
  id: string;
  company_name: string;
  primary_color: string;
  status: string;
  created_at: string;
  campaign_count: number;
  last_campaign_at: string | null;
}

interface Props {
  company: CompanySummary | null;
  /** Full record from GET /api/admin/tenants/<id>: contact, registration, employees. */
  detail: any;
  loading: boolean;
  onClose: () => void;
  onEdit: () => void;
}

/** Super-admin company profile: brand-tinted header, headline numbers, contact/business cards, employee list. */
export function CompanyDetailDialog({ company, detail, loading, onClose, onEdit }: Props) {
  const [employeeFilter, setEmployeeFilter] = useState('');
  const close = () => { setEmployeeFilter(''); onClose(); };

  return (
    <Dialog open={!!company} onOpenChange={(open) => { if (!open) close(); }}>
      <DialogContent className="max-w-2xl max-h-[88vh] p-0 gap-0 overflow-hidden flex flex-col">
          {(() => {
            const color = brandColor(detail?.primary_color || company?.primary_color);
            const employees: any[] = detail?.employees || [];
            const filtered = employees.filter((e) => {
              const q = employeeFilter.trim().toLowerCase();
              return !q || [e.name, e.email, e.department].some((v) => (v || '').toLowerCase().includes(q));
            });
            const declared = detail?.registration?.employee_count;
            const status = detail?.status || company?.status;
            return (
              <>
                <div className="h-1.5 shrink-0" style={{ backgroundColor: color }} />
                <div className="shrink-0 px-6 pt-5 pb-4 pr-12 border-b border-slate-100" style={{ backgroundColor: `${color}12` }}>
                  <div className="flex items-center gap-3">
                    {detail?.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={detail.logo_url} alt="" className="h-12 w-12 rounded-xl object-cover border border-white shadow-sm bg-white" />
                    ) : (
                      <div
                        className="h-12 w-12 rounded-xl flex items-center justify-center text-base font-bold shadow-sm"
                        style={{ backgroundColor: color, color: readableOn(color) }}
                      >
                        {initials(company?.company_name)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <DialogTitle className="text-lg font-bold text-slate-900 leading-tight truncate">{company?.company_name}</DialogTitle>
                      {/* asChild: a <p> can't contain the Badge's <div>, so render the description as a <div>. */}
                      <DialogDescription asChild>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-slate-500">
                          {status && (
                            <Badge variant={status === 'active' ? 'success' : 'secondary'} className="text-[10px]">{status}</Badge>
                          )}
                          <span>Onboarded {formatDate(detail?.created_at || company?.created_at) || 'N/A'}</span>
                        </div>
                      </DialogDescription>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                  {loading ? (
                    <div className="flex items-center gap-2 text-xs text-slate-400 py-12 justify-center">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Loading...
                    </div>
                  ) : detail ? (
                    <>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-xl border border-slate-200 p-3.5">
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500"><Users className="h-3.5 w-3.5 shrink-0" /> Employees</div>
                          <div className="mt-1.5 text-2xl font-bold text-slate-900 leading-none">{employees.length}</div>
                          <div className="mt-1 text-[11px] text-slate-400">{declared ? `of ${declared} declared` : 'added so far'}</div>
                        </div>
                        <div className="rounded-xl border border-slate-200 p-3.5" title="Campaigns that actually sent at least one email. Deleting a campaign does not reduce this.">
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500"><Send className="h-3.5 w-3.5 shrink-0" /> Campaigns run</div>
                          <div className="mt-1.5 text-2xl font-bold text-slate-900 leading-none">{company?.campaign_count ?? 0}</div>
                          <div className="mt-1 text-[11px] text-slate-400">lifetime, kept if deleted</div>
                        </div>
                        <div className="rounded-xl border border-slate-200 p-3.5">
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500"><Calendar className="h-3.5 w-3.5 shrink-0" /> Last campaign</div>
                          <div className="mt-1.5 text-base font-bold text-slate-900 leading-none py-1">
                            {company?.last_campaign_at ? formatDate(company.last_campaign_at) : 'Never'}
                          </div>
                          <div className="mt-1 text-[11px] text-slate-400">first email sent</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="rounded-xl border border-slate-200 p-4">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-3">Contact</span>
                          <div className="space-y-2.5 text-xs text-slate-700">
                            <div className="flex items-start gap-2.5">
                              <User className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                              <div>
                                <div className="font-medium text-slate-900">{detail.contact_name || '-'}</div>
                                {detail.designation && <div className="text-slate-400">{detail.designation}</div>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <a href={`mailto:${detail.admin_email}`} className="truncate hover:underline" title={detail.admin_email}>{detail.admin_email}</a>
                            </div>
                            {detail.contact_mobile && (
                              <div className="flex items-center gap-2.5">
                                <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <a href={`tel:${detail.contact_mobile}`} className="hover:underline">{detail.contact_mobile}</a>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 p-4">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-3">Business</span>
                          <div className="space-y-2.5 text-xs text-slate-700">
                            <div className="flex items-start gap-2.5">
                              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                              <span className={detail.registration?.address ? '' : 'text-slate-400'}>{detail.registration?.address || 'Address not provided'}</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className={detail.registration?.gst_number ? 'font-mono' : 'text-slate-400'}>{detail.registration?.gst_number || 'GST not provided'}</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <Palette className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="inline-block h-4 w-4 rounded-full border border-slate-200" style={{ backgroundColor: color }} />
                              <span className="font-mono text-slate-500">{color}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">Employees ({employees.length})</span>
                          {employees.length > 6 && (
                            <Input
                              value={employeeFilter}
                              onChange={(e) => setEmployeeFilter(e.target.value)}
                              placeholder="Search name, email, department"
                              className="h-7 w-full sm:w-56 text-xs"
                            />
                          )}
                        </div>
                        {employees.length === 0 ? (
                          <p className="text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl py-6 text-center">No employees added yet.</p>
                        ) : filtered.length === 0 ? (
                          <p className="text-xs text-slate-400 py-4 text-center">No employees match &ldquo;{employeeFilter}&rdquo;.</p>
                        ) : (
                          <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 max-h-60 overflow-y-auto">
                            {filtered.map((e: any) => (
                              <div key={e.id} className="flex items-center gap-3 px-3 py-2.5">
                                <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 text-[11px] font-semibold flex items-center justify-center shrink-0">{initials(e.name)}</div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-medium text-slate-800 truncate">{e.name}</div>
                                  <div className="text-[11px] text-slate-400 truncate">{e.email}</div>
                                </div>
                                {e.department && <span className="hidden sm:block text-[11px] text-slate-500 shrink-0">{e.department}</span>}
                                {e.risk_rating && (
                                  <Badge variant={RISK_VARIANT[e.risk_rating] || 'secondary'} className="text-[10px] capitalize shrink-0">{e.risk_rating}</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-slate-400 py-8 text-center">Couldn&apos;t load details.</p>
                  )}
                </div>

                <div className="shrink-0 flex items-center justify-between gap-2 px-6 py-3 border-t border-slate-100 bg-slate-50/70">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!company}
                    onClick={() => { const t = company; if (t) { setEmployeeFilter(''); onEdit(); } }}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit company
                  </Button>
                  <Button size="sm" onClick={close}>Close</Button>
                </div>
              </>
            );
          })()}
      </DialogContent>
    </Dialog>
  );
}
