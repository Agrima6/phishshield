import { Campaign, Employee, PhishingTemplate, TenantSettings, AuditLog, SystemNotification } from '@/types';

// Helper to check for SSR
const isClient = typeof window !== 'undefined';

const getLocalStorage = <T,>(key: string, defaultValue: T): T => {
  if (!isClient) return defaultValue;
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      return JSON.parse(saved) as T;
    } catch {
      return defaultValue;
    }
  }
  return defaultValue;
};

const setLocalStorage = <T,>(key: string, value: T): void => {
  if (isClient) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

// --- INITIAL SEED DATA ---

const defaultTenantSettings: TenantSettings = {
  id: 'provana',
  name: 'Provana Corp',
  domains: ['provana.localhost'],
  branding: {
    primaryColor: '#d97706', // amber accent
  },
  sso: {
    enabled: true,
    clientId: '849e7592-38d2-4cfb-b72e-8c3491fa1202',
    tenantId: 'f87a3891-b3b4-4b55-a228-cc3929420042',
  },
  emailConfigs: [
    {
      id: 'provana-smtp',
      name: 'Provana SMTP Gateway',
      provider: 'smtp',
      host: 'localhost',
      port: 1025,
      username: 'alerts@provana.com',
      fromEmail: 'security-alerts@provana.com',
      fromName: 'IT Security Team',
      isConfigured: true
    },
    {
      id: 'sendgrid-alert',
      name: 'SendGrid Emergency Profile',
      provider: 'sendgrid',
      fromEmail: 'hr@provana.com',
      fromName: 'Provana HR Portal',
      isConfigured: true
    }
  ]
};

const defaultCampaigns: Campaign[] = [
  {
    id: 'camp-q2-assessment',
    name: 'Q2 Phishing Assessment',
    status: 'active',
    subject: 'Urgent Action Required: Please review your profile',
    senderName: 'Provana IT Security',
    emailConfigId: 'provana-smtp',
    sentCount: 145,
    openedCount: 84,
    clickedCount: 12,
    createdAt: '2026-07-16T10:45:00Z'
  },
  {
    id: 'camp-bonus-harvester',
    name: 'New Year Bonus Harvester',
    status: 'completed',
    subject: 'HR Portal: Q1 Bonus Payment Allocation Details',
    senderName: 'Provana HR Portal',
    emailConfigId: 'sendgrid-alert',
    sentCount: 300,
    openedCount: 240,
    clickedCount: 4,
    createdAt: '2026-06-10T09:12:00Z'
  },
  {
    id: 'camp-draft-sysupdate',
    name: 'System Software Mandated Update',
    status: 'draft',
    subject: 'CRITICAL Security Hotfix: Patch Required Immediately',
    senderName: 'IT Operations',
    sentCount: 0,
    openedCount: 0,
    clickedCount: 0,
    createdAt: '2026-07-17T15:30:00Z'
  }
];

const defaultEmployees: Employee[] = [
  {
    id: 'emp-1',
    name: 'Jane Cooper',
    email: 'jane.c@provana.com',
    department: 'Engineering',
    manager: 'Devon Lane',
    riskRating: 'low',
    trainingStatus: 'completed',
    hitsCount: 0,
    totalSimulations: 4
  },
  {
    id: 'emp-2',
    name: 'Robert Fox',
    email: 'robert.f@provana.com',
    department: 'Sales',
    manager: 'Devon Lane',
    riskRating: 'high',
    trainingStatus: 'non-compliant',
    hitsCount: 3,
    totalSimulations: 4
  },
  {
    id: 'emp-3',
    name: 'Cody Fisher',
    email: 'cody.f@provana.com',
    department: 'Human Resources',
    manager: 'Sarah Jenkins',
    riskRating: 'medium',
    trainingStatus: 'in-progress',
    hitsCount: 1,
    totalSimulations: 4
  },
  {
    id: 'emp-4',
    name: 'Alice Johnson',
    email: 'alice.j@provana.com',
    department: 'Finance',
    manager: 'Sarah Jenkins',
    riskRating: 'low',
    trainingStatus: 'completed',
    hitsCount: 0,
    totalSimulations: 4
  }
];

const defaultTemplates: PhishingTemplate[] = [
  {
    id: 'temp-o365',
    name: 'Microsoft Office 365 Password Reset',
    category: 'credential-harvester',
    thumbnail: '📧',
    description: 'Mimics standard cloud password expiry requests.',
    subject: 'Action Required: Reset your Microsoft Office 365 password immediately',
    body: 'Your account password expires in 24 hours. Please click below to keep your current password.'
  },
  {
    id: 'temp-invoice',
    name: 'Urgent Invoice Payment Alert',
    category: 'link-click',
    thumbnail: '💸',
    description: 'Checks finance team vigilance for fake supplier bills.',
    subject: 'Overdue Invoice #94821 - Immediate Payment Required',
    body: 'Your payment for invoice #94821 is 15 days overdue. Late fees will accumulate starting tomorrow.'
  },
  {
    id: 'temp-delivery',
    name: 'Missed Package Delivery',
    category: 'malicious-attachment',
    thumbnail: '📦',
    description: 'Checks click-through rates on external courier links.',
    subject: 'Delivery Failed: Reschedule your courier parcel arrival',
    body: 'We attempted to deliver your package at 2:00 PM today. Please download the attached slip to claim your parcel.'
  }
];

const defaultAuditLogs: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-07-18T01:52:10Z',
    actor: 'admin@provana.com',
    ipAddress: '192.168.1.45',
    category: 'SSO_CONFIG',
    message: 'Microsoft Entra OIDC tenant secrets updated by administrator.'
  },
  {
    id: 'log-2',
    timestamp: '2026-07-17T18:34:55Z',
    actor: 'admin@provana.com',
    ipAddress: '192.168.1.45',
    category: 'CAMPAIGN',
    message: 'Active simulation campaign "Q2 Phishing Assessment" initiated.'
  },
  {
    id: 'log-3',
    timestamp: '2026-07-16T11:12:04Z',
    actor: 'system',
    ipAddress: '127.0.0.1',
    category: 'SMTP',
    message: 'Dynamic profile encryption keys successfully rotated.'
  }
];

const defaultNotifications: SystemNotification[] = [
  {
    id: 1,
    text: "Simulation Campaign 'Q2 Phishing Assessment' successfully initiated.",
    time: '5 mins ago',
    read: false,
    type: 'campaign'
  },
  {
    id: 2,
    text: 'Microsoft Entra ID Client SSO Credentials rotated by Administrator.',
    time: '1 hour ago',
    read: false,
    type: 'system'
  },
  {
    id: 3,
    text: 'Assigned Course "Social Engineering" deadline remaining: 2 days.',
    time: '1 day ago',
    read: true,
    type: 'training'
  }
];

// --- DB GET/SET OPERATIONS ---

const getTenantKey = (key: string): string => {
  if (!isClient) return key;
  const tenant = localStorage.getItem('phish_tenant') || 'provana';
  return `${tenant}_${key}`;
};

export const db = {
  getSettings: (): TenantSettings => getLocalStorage<TenantSettings>(getTenantKey('settings'), defaultTenantSettings),
  saveSettings: (settings: TenantSettings): void => setLocalStorage<TenantSettings>(getTenantKey('settings'), settings),
  
  getCampaigns: (): Campaign[] => getLocalStorage<Campaign[]>(getTenantKey('campaigns'), defaultCampaigns),
  saveCampaigns: (campaigns: Campaign[]): void => setLocalStorage<Campaign[]>(getTenantKey('campaigns'), campaigns),
  
  getEmployees: (): Employee[] => getLocalStorage<Employee[]>(getTenantKey('employees'), defaultEmployees),
  saveEmployees: (employees: Employee[]): void => setLocalStorage<Employee[]>(getTenantKey('employees'), employees),
  
  getTemplates: (): PhishingTemplate[] => getLocalStorage<PhishingTemplate[]>(getTenantKey('templates'), defaultTemplates),
  saveTemplates: (templates: PhishingTemplate[]): void => setLocalStorage<PhishingTemplate[]>(getTenantKey('templates'), templates),

  
  getAuditLogs: (): AuditLog[] => getLocalStorage<AuditLog[]>(getTenantKey('audit_logs'), defaultAuditLogs),
  saveAuditLogs: (logs: AuditLog[]): void => setLocalStorage<AuditLog[]>(getTenantKey('audit_logs'), logs),
  
  getNotifications: (): SystemNotification[] => getLocalStorage<SystemNotification[]>(getTenantKey('notifications'), defaultNotifications),
  saveNotifications: (notifs: SystemNotification[]): void => setLocalStorage<SystemNotification[]>(getTenantKey('notifications'), notifs),
};
