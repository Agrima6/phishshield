// Local knowledge base for the in-app "Shieldy" assistant. Deliberately
// static (no LLM/API call) — the assistant is a guided, option-driven help
// tree over this content, with a simple local keyword search across all
// entries standing in for retrieval. If nothing here resolves the user's
// issue, the widget hands off to SUPPORT_EMAIL.

export const SUPPORT_EMAIL = 'support@workmateshield.com';

export interface KBEntry {
  q: string;
  a: string;
}

export interface KBCategory {
  id: string;
  label: string;
  entries: KBEntry[];
}

export const KNOWLEDGE_BASE: KBCategory[] = [
  {
    id: 'campaigns',
    label: 'Campaigns & Simulations',
    entries: [
      {
        q: 'How do I launch a new simulation?',
        a: 'Go to Campaign Manager and click "New Campaign". Walk through the 4-step wizard: name & subject, pick your audience, choose a template, and select a sending profile. It\'s created as a draft you can review before deploying.',
      },
      {
        q: 'Why is my campaign stuck on Draft?',
        a: 'Draft campaigns don\'t send automatically. Open Campaign Manager, find the campaign, and click "Deploy" to send it now, or the clock icon to schedule it for later.',
      },
      {
        q: 'Can I schedule a campaign for later?',
        a: 'Yes. On a draft campaign, click the clock icon and pick a date and time. You can cancel a scheduled send at any point before it fires.',
      },
      {
        q: 'How do I see results for one specific campaign?',
        a: 'In Campaign Manager, click the bar-chart icon on any campaign row. It opens a report with a sent/opened/clicked breakdown and a per-recipient status table.',
      },
      {
        q: 'Can I choose which email account sends a campaign?',
        a: 'Yes. In step 4 of the campaign wizard you can pick a custom SMTP or SendGrid profile configured in Tenant Settings, instead of the default system gateway.',
      },
    ],
  },
  {
    id: 'employees',
    label: 'Employee Directory',
    entries: [
      {
        q: 'How do I add employees?',
        a: 'Go to Employee Directory and either add one manually or import a CSV. Use the provided template to get the column headers right.',
      },
      {
        q: 'How do I organize employees by department?',
        a: 'Set the Department field when adding or importing employees. You can then filter both the directory and the campaign audience picker by department.',
      },
      {
        q: 'What counts as a "high risk" employee?',
        a: 'Employees who have clicked a simulated phishing link in 2 or more separate campaigns are flagged high risk on the Overview dashboard.',
      },
    ],
  },
  {
    id: 'templates',
    label: 'Phishing Templates',
    entries: [
      {
        q: 'How do I preview a template before sending it?',
        a: 'Click "Preview" on any template card (or in the campaign wizard\'s template step) to see exactly how it renders in an inbox, with sample data filled in.',
      },
      {
        q: 'What do the theme and delivery-type badges mean?',
        a: 'Theme is the real-world topic (IT & Security, Finance & Payroll, HR & Benefits, etc.) so you can browse by subject. Delivery type is the technical lure mechanism: Credential Harvester or Link Click.',
      },
      {
        q: 'Can I create my own template?',
        a: 'Yes. Click "New Template", fill in the subject and body (HTML supported), and optionally upload a header image. There\'s also an AI Occasion Generator tab for seasonal templates.',
      },
    ],
  },
  {
    id: 'reports',
    label: 'Reports & Analytics',
    entries: [
      {
        q: 'Where can I see overall click rates?',
        a: 'The Reports & Analytics page has a Vigilance Scorecard gauge, a department click-rate chart, and a full campaign performance trend chart.',
      },
      {
        q: 'How do I export a report?',
        a: 'Use the "Export CSV" or "Export PDF Report" buttons at the top of Reports & Analytics. The PDF includes your logo and a generated timestamp.',
      },
      {
        q: 'What does the Vigilance Score mean?',
        a: 'It\'s 100 minus your average click rate across all campaigns, a quick read on overall organizational resilience to phishing.',
      },
    ],
  },
  {
    id: 'account',
    label: 'Account & Settings',
    entries: [
      {
        q: 'How do I invite another admin?',
        a: 'If you\'re a Super Admin, go to Super Admin Console and add their email under Authorized Sign-Up Emails, or onboard a whole new company with its own isolated admin.',
      },
      {
        q: 'How do I change my company\'s branding color or logo?',
        a: 'Go to Tenant Settings to update your primary color, logo, and other branding. It applies across the dashboard automatically.',
      },
      {
        q: 'How do I set up single sign-on (SSO)?',
        a: 'Tenant Settings has a Microsoft Entra ID (OIDC) section. Register a multi-tenant app in Entra ID, then paste the client ID and tenant ID there.',
      },
    ],
  },
];

export interface KBSearchResult {
  category: KBCategory;
  entry: KBEntry;
  score: number;
}

// Extremely simple local retrieval: score every entry by how many
// query words it contains, favoring matches in the question. No network
// call, no embeddings — just a keyword overlap over the static KB above.
export function searchKnowledgeBase(query: string, limit = 3): KBSearchResult[] {
  const words = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3);
  if (words.length === 0) return [];

  const results: KBSearchResult[] = [];
  for (const category of KNOWLEDGE_BASE) {
    for (const entry of category.entries) {
      const qText = entry.q.toLowerCase();
      const aText = entry.a.toLowerCase();
      let score = 0;
      for (const w of words) {
        if (qText.includes(w)) score += 2;
        if (aText.includes(w)) score += 1;
      }
      if (score > 0) results.push({ category, entry, score });
    }
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}
