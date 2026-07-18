'use client';

import React from 'react';
import { HelpCircle, ChevronRight, BookOpen, ShieldCheck, Mail } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function HelpPage() {
  const guides = [
    {
      title: "Bypassing Spam Filters for Simulations",
      category: "Email Routing",
      desc: "Configure SPF, DKIM, and DMARC alignment headers on your dynamic SMTP configurations to guarantee inbox placement.",
      icon: Mail
    },
    {
      title: "Active Directory OIDC Integration",
      category: "Single Sign On",
      desc: "Step-by-step instructions to register a multi-tenant client app inside Microsoft Entra ID admin dashboards.",
      icon: ShieldCheck
    },
    {
      title: "Simulations Execution Policy",
      category: "Compliance Policies",
      desc: "Corporate guidelines on controlled phishing simulations, employee alerts, and training assignments.",
      icon: BookOpen
    }
  ];

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Help Center & Documentation</h1>
        <p className="text-sm text-slate-500 mt-0.5">Learn how to customize corporate setups, configure custom mail servers, and manage user directories.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {guides.map((g, idx) => {
          const Icon = g.icon;
          return (
            <Card key={idx} className="cursor-pointer hover:border-primary transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded bg-slate-50 border border-slate-100 text-slate-600">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">{g.category}</span>
                </div>
                <CardTitle className="text-sm font-bold text-slate-800 mt-3">{g.title}</CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {g.desc}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 flex items-center justify-end text-xs text-primary font-semibold">
                Read guide <ChevronRight className="h-4 w-4" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>Common platform support topics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs leading-relaxed text-slate-600">
          {[
            { q: "How are dynamic email configurations resolved for different clients?", a: "The backend extracts the active tenant context from the administrator authentication token. During campaign dispatches, the scheduler selects the email sending configuration matched to the tenant settings profile." },
            { q: "Are simulated emails encrypted during transit?", a: "Yes, our SMTP gateways enforce TLS 1.2+ encryption protocols. Custom configurations can toggle TLS requirements inside profile cards." }
          ].map((faq, idx) => (
            <div key={idx} className="space-y-1">
              <h4 className="font-bold text-slate-800">Q: {faq.q}</h4>
              <p className="text-slate-500 font-medium">A: {faq.a}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
