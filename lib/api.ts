import { TenantSettings, Campaign, PhishingTemplate, Employee } from '@/types';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function fetcher<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('phish_session_token') : null;
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  if (token) {
    headers.set('X-Admin-Key', token);
  }

  const activeTenant = typeof window !== 'undefined' ? localStorage.getItem('phish_tenant') : null;
  if (activeTenant) {
    headers.set('X-Switch-Tenant', activeTenant);
  }

  // Relative path (not API_BASE) so this goes through the same-origin
  // rewrite proxy in next.config.ts, keeping the session cookie same-site.
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `HTTP error ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// Map back and forth between backend JSON and frontend models
export function mapBackendToTenantSettings(backend: any): TenantSettings {
  return {
    id: backend.tenant_id || 'default',
    name: backend.name || 'Default Company',
    domains: backend.domains || [],
    branding: {
      primaryColor: backend.branding?.primary_color || '#d97706',
      logoUrl: backend.branding?.logo_url || '',
    },
    sso: {
      clientId: backend.sso_config?.client_id || '',
      tenantId: backend.sso_config?.tenant_id || '',
      enabled: !!backend.sso_config?.client_id,
    },
    emailConfigs: (backend.email_configs || []).map((ec: any) => ({
      id: ec.id,
      name: ec.name,
      provider: ec.provider,
      host: ec.smtp_host || '',
      port: ec.smtp_port || 465,
      username: ec.smtp_username || '',
      fromEmail: ec.provider === 'sendgrid' ? ec.sendgrid_from_email : ec.smtp_from_email,
      fromName: ec.provider === 'sendgrid' ? ec.sendgrid_from_name : ec.smtp_from_name,
      isConfigured: ec.provider === 'sendgrid' ? ec.sendgrid_api_key_configured : ec.smtp_password_configured,
    })),
  };
}

export function mapTenantSettingsToBackend(settings: TenantSettings): any {
  return {
    name: settings.name,
    domains: settings.domains,
    branding: {
      logo_url: settings.branding.logoUrl || '',
      primary_color: settings.branding.primaryColor,
      base_url: typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : '',
    },
    sso_config: {
      client_id: settings.sso.clientId || '',
      tenant_id: settings.sso.tenantId || '',
      client_secret: settings.sso.clientSecret || '',
    },
    email_configs: settings.emailConfigs.map((cfg: any) => ({
      id: cfg.id,
      name: cfg.name,
      provider: cfg.provider,
      sendgrid_from_email: cfg.provider === 'sendgrid' ? cfg.fromEmail : '',
      sendgrid_from_name: cfg.provider === 'sendgrid' ? cfg.fromName : '',
      sendgrid_api_key: cfg.provider === 'sendgrid' && cfg.apiKey ? cfg.apiKey : '',
      smtp_host: cfg.provider === 'smtp' ? cfg.host : '',
      smtp_port: cfg.provider === 'smtp' ? Number(cfg.port) : 465,
      smtp_username: cfg.provider === 'smtp' ? cfg.username : '',
      smtp_password: cfg.provider === 'smtp' && cfg.password ? cfg.password : '',
      smtp_from_email: cfg.provider === 'smtp' ? cfg.fromEmail : '',
      smtp_from_name: cfg.provider === 'smtp' ? cfg.fromName : '',
      smtp_use_ssl: cfg.provider === 'smtp' ? (cfg.port === 465) : false,
    })),
  };
}

export function mapBackendToCampaign(backend: any): Campaign {
  return {
    id: backend.id || backend._id,
    name: backend.name,
    status: backend.status || 'draft',
    subject: backend.subject,
    senderName: backend.sender_name || 'Security Team',
    emailConfigId: backend.email_config_id || undefined,
    scheduledAt: backend.scheduled_at || undefined,
    sentCount: backend.total_sent || 0,
    openedCount: backend.total_opened || 0,
    clickedCount: backend.total_clicked || 0,
    createdAt: backend.created_at || new Date().toISOString(),
  };
}

export const api = {
  auth: {
    // Exchanges a verified Clerk session token for the Flask session that
    // _get_session_info() in app.py actually checks on every later request.
    establishSession: async (clerkToken: string) => {
      const res = await fetcher<{
        id: string;
        name: string;
        email: string;
        role: string;
      }>('/api/auth/clerk/session', {
        method: 'POST',
        headers: { Authorization: `Bearer ${clerkToken}` },
      });

      // _get_session_info() only accepts the literal string "clerk" here — the
      // real credential is the Flask session cookie set by the call above.
      localStorage.setItem('phish_session_token', 'clerk');
      localStorage.setItem('phish_username', res.email || res.name);
      localStorage.setItem('phish_role', res.role);
      localStorage.setItem('phish_tenant', 'default');
      localStorage.setItem('phish_tenant_name', 'Default Tenant');

      return res;
    },
    logout: async () => {
      await fetcher('/api/auth/clerk/logout', { method: 'POST' }).catch(() => {});
      localStorage.removeItem('phish_session_token');
      localStorage.removeItem('phish_username');
      localStorage.removeItem('phish_role');
      localStorage.removeItem('phish_tenant');
      localStorage.removeItem('phish_tenant_name');
    },
    me: async () => {
      return fetcher<{
        role: string;
        label: string;
        username: string;
        tenant_id: string;
        tenant_name: string;
      }>('/api/phish/me');
    },
  },
  
  analytics: {
    overview: async () => {
      return fetcher<{
        department_rates: { department: string; rate: number; total_recipients: number }[];
        recent_events: { name: string; campaign: string; status: string; timestamp: string }[];
      }>('/api/phish/analytics/overview');
    },
  },

  settings: {
    get: async () => {
      const res = await fetcher<any>('/api/tenant/settings');
      return mapBackendToTenantSettings(res);
    },
    save: async (settings: TenantSettings) => {
      const payload = mapTenantSettingsToBackend(settings);
      const res = await fetcher<any>('/api/tenant/settings', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return res;
    },
    testEmail: async (configId: string, provider: 'smtp' | 'sendgrid', configData: any, recipientEmail: string) => {
      // Re-map single email config to matching backend schema
      const mappedConfig = {
        id: configId,
        provider,
        sendgrid_from_email: provider === 'sendgrid' ? configData.fromEmail : '',
        sendgrid_from_name: provider === 'sendgrid' ? configData.fromName : '',
        sendgrid_api_key: provider === 'sendgrid' ? configData.apiKey : '',
        smtp_host: provider === 'smtp' ? configData.host : '',
        smtp_port: provider === 'smtp' ? Number(configData.port) : 465,
        smtp_username: provider === 'smtp' ? configData.username : '',
        smtp_password: provider === 'smtp' ? configData.password : '',
        smtp_from_email: provider === 'smtp' ? configData.fromEmail : '',
        smtp_from_name: provider === 'smtp' ? configData.fromName : '',
        smtp_use_ssl: provider === 'smtp' ? (configData.port === 465) : false,
      };
      
      return fetcher<{ success: boolean; message?: string; error?: string }>(
        '/api/tenant/settings/test-email',
        {
          method: 'POST',
          body: JSON.stringify({
            config: mappedConfig,
            recipient: recipientEmail,
          }),
        }
      );
    },
  },

  campaigns: {
    list: async () => {
      const res = await fetcher<any[]>('/api/phish/campaigns');
      return res.map(mapBackendToCampaign);
    },
    create: async (campaign: {
      name: string;
      subject: string;
      body_html: string;
      sender_name: string;
      redirect_url?: string;
      email_config_id?: string;
    }) => {
      const res = await fetcher<any>('/api/phish/campaigns', {
        method: 'POST',
        body: JSON.stringify(campaign),
      });
      return mapBackendToCampaign(res);
    },
    delete: async (id: string) => {
      return fetcher<{ message: string }>(`/api/phish/campaigns/${id}`, {
        method: 'DELETE',
      });
    },
    getStats: async (id: string) => {
      return fetcher<any>(`/api/phish/campaigns/${id}`);
    },
    send: async (id: string, emailConfigId?: string) => {
      return fetcher<any>(`/api/phish/campaigns/${id}/send`, {
        method: 'POST',
        body: JSON.stringify({ email_config_id: emailConfigId }),
      });
    },
    resend: async (id: string, emailConfigId?: string) => {
      return fetcher<any>(`/api/phish/campaigns/${id}/resend`, {
        method: 'POST',
        body: JSON.stringify({ email_config_id: emailConfigId }),
      });
    },
    sendStatus: async (id: string) => {
      return fetcher<any>(`/api/phish/campaigns/${id}/send/status`);
    },
    schedule: async (id: string, scheduledAt: string | null) => {
      return fetcher<{ scheduled_at: string | null }>(`/api/phish/campaigns/${id}/schedule`, {
        method: 'POST',
        body: JSON.stringify({ scheduled_at: scheduledAt }),
      });
    },
    clearFailed: async (id: string) => {
      return fetcher<{ cleared: number }>(`/api/phish/campaigns/${id}/failed`, {
        method: 'DELETE',
      });
    },
    clearDuplicates: async (id: string) => {
      return fetcher<{ cleared: number }>(`/api/phish/campaigns/${id}/duplicates`, {
        method: 'DELETE',
      });
    },
    getDeviceStats: async (id: string) => {
      return fetcher<any>(`/api/phish/campaigns/${id}/device-stats`);
    },
    getReportCsvUrl: (id: string) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('phish_session_token') : '';
      return `${API_BASE}/api/phish/campaigns/${id}/report?key=${encodeURIComponent(token || '')}`;
    },
  },

  recipients: {
    list: async (campaignId: string) => {
      return fetcher<any[]>(`/api/phish/campaigns/${campaignId}/recipients`);
    },
    add: async (campaignId: string, recipients: { email: string; name?: string }[]) => {
      return fetcher<{ added: number; invalid: string[]; recipients: any[]; warnings?: string[] }>(
        `/api/phish/campaigns/${campaignId}/recipients`,
        {
          method: 'POST',
          body: JSON.stringify({ recipients }),
        }
      );
    },
    delete: async (campaignId: string, recipientId: string) => {
      return fetcher<{ message: string }>(
        `/api/phish/campaigns/${campaignId}/recipients/${recipientId}`,
        {
          method: 'DELETE',
        }
      );
    },
  },

  branding: {
    getBranding: async (tenant?: string) => {
      const url = tenant ? `/api/auth/branding?tenant=${encodeURIComponent(tenant)}` : '/api/auth/branding';
      return fetcher<{
        tenant_id: string;
        tenant_name: string;
        logo_url: string;
        primary_color: string;
        sso_configured: boolean;
      }>(url);
    },
  },

  admin: {
    tenants: {
      list: async () => {
        return fetcher<any[]>('/api/admin/tenants');
      },
      create: async (data: {
        tenant_id: string;
        name: string;
        domains: string[];
        admin_email: string;
        admin_password: string;
      }) => {
        return fetcher<{ message: string }>('/api/admin/tenants', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      },
    },
    allowlist: {
      list: async () => {
        return fetcher<{ id: string; identifier: string; created_at: number }[]>('/api/admin/allowlist');
      },
      add: async (email: string) => {
        return fetcher<any>('/api/admin/allowlist', {
          method: 'POST',
          body: JSON.stringify({ email }),
        });
      },
      remove: async (id: string) => {
        return fetcher<any>(`/api/admin/allowlist/${id}`, { method: 'DELETE' });
      },
    },
  },

  templates: {
    list: async () => {
      return fetcher<any[]>('/api/phish/templates');
    },
    create: async (data: {
      name: string;
      category: string;
      subject: string;
      body: string;
      description?: string;
      thumbnail?: string;
    }) => {
      return fetcher<any>('/api/phish/templates', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string) => {
      return fetcher<any>(`/api/phish/templates/${id}`, {
        method: 'DELETE',
      });
    },
  },

  employees: {
    list: async () => {
      return fetcher<any[]>('/api/phish/employees');
    },
    create: async (data: {
      name: string;
      email: string;
      department?: string;
      manager?: string;
      riskRating?: string;
    }) => {
      return fetcher<any>('/api/phish/employees', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: any) => {
      return fetcher<any>(`/api/phish/employees/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string) => {
      return fetcher<any>(`/api/phish/employees/${id}`, {
        method: 'DELETE',
      });
    },
    import: async (formData: FormData) => {
      return fetcher<any>('/api/phish/employees/import', {
        method: 'POST',
        body: formData,
      });
    },
  },

  auditLogs: {
    list: async () => {
      return fetcher<any[]>('/api/phish/audit-logs');
    },
    create: async (data: {
      actor: string;
      category: string;
      message: string;
      ipAddress?: string;
    }) => {
      return fetcher<any>('/api/phish/audit-logs', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  ai: {
    generateTemplate: async (category: string) => {
      return fetcher<any>('/api/phish/ai/generate-template', {
        method: 'POST',
        body: JSON.stringify({ category }),
      });
    },
    generateEmail: async (data: {
      prompt: string;
      type?: string;
      tone?: string;
      constraints?: string;
    }) => {
      return fetcher<any>('/api/phish/ai/generate', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  uploadImage: async (formData: FormData) => {
    return fetcher<{ url: string }>('/api/phish/upload/image', {
      method: 'POST',
      body: formData,
    });
  },
};
