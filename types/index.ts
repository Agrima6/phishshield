export interface EmailConfig {
  id: string;
  name: string;
  provider: 'smtp' | 'sendgrid';
  host?: string;
  port?: number;
  username?: string;
  fromEmail: string;
  fromName: string;
  isConfigured: boolean;
}

export interface TenantSettings {
  id: string;
  name: string;
  domains: string[];
  branding: {
    primaryColor: string;
    logoUrl?: string;
  };
  sso: {
    clientId?: string;
    tenantId?: string;
    clientSecret?: string;
    enabled: boolean;
  };
  emailConfigs: EmailConfig[];
}

export interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'draft' | 'completed';
  subject: string;
  senderName: string;
  emailConfigId?: string;
  scheduledAt?: string;
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  manager: string;
  riskRating: 'low' | 'medium' | 'high';
  hitsCount: number;
  totalSimulations: number;
}

export interface PhishingTemplate {
  id: string;
  name: string;
  category: 'credential-harvester' | 'link-click' | 'malicious-attachment';
  thumbnail: string;
  description: string;
  subject: string;
  body: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  ipAddress: string;
  category: 'SSO_CONFIG' | 'CAMPAIGN' | 'SMTP' | 'EMPLOYEE' | 'SECURITY';
  message: string;
}

export interface SystemNotification {
  id: number;
  text: string;
  time: string;
  read: boolean;
  type: 'campaign' | 'system' | 'training';
}
