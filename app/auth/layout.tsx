'use client';

import React from 'react';
import { ShieldCheck, ShieldAlert, Award, Lock } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-12 bg-slate-50">
      {/* Left Branding / Compliance Pane */}
      <div className="hidden md:flex md:col-span-5 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Subtle geometric grid background overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1.5px)] [background-size:24px_24px] opacity-30" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-amber-500 rounded-lg flex items-center justify-center font-bold text-slate-950 text-xl shadow-xs">
              P
            </div>
            <span className="font-semibold text-lg tracking-wider text-slate-100">
              PHISHSHIELD <span className="text-amber-500 font-bold">ENTERPRISE</span>
            </span>
          </div>
        </div>

        <div className="relative z-10 my-auto py-12">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-4">
            Defend Your Organization Against Phishing & Social Engineering
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-sm">
            Launch controlled phishing simulations, audit human risk indicators, and administer compliance courses from a unified tenant workspace.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm text-slate-200">ISO 27001 & SOC 2 Audited</h4>
                <p className="text-xs text-slate-400">Enterprise grade cryptographic controls and access logs.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm text-slate-200">Microsoft Entra ID SSO Integration</h4>
                <p className="text-xs text-slate-400">Enable seamless OIDC single sign-on for your administration.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 border-t border-slate-800 pt-6 flex items-center justify-between text-xs text-slate-400">
          <span>© 2026 PhishShield. All rights reserved.</span>
          <div className="flex items-center gap-1">
            <Award className="h-4 w-4 text-amber-500" />
            <span>Secure SaaS Platform</span>
          </div>
        </div>
      </div>

      {/* Right Form Pane */}
      <div className="col-span-1 md:col-span-7 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-8 shadow-xs">
          {children}
        </div>
      </div>
    </div>
  );
}
