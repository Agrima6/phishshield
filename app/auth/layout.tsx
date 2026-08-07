'use client';

import React from 'react';
import Image from 'next/image';
import { ShieldCheck, Award, Lock } from 'lucide-react';
import { DotGrid } from '@/components/landing/dot-grid';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-12 bg-slate-50">
      {/* Left Branding / Compliance Pane */}
      <div className="hidden md:flex md:col-span-5 bg-[#1c0507] text-white flex-col justify-between p-12 relative overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-80"
          src="/videos/threat-terminal.mp4"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1c0507]/70 via-[#1c0507]/55 to-[#1c0507]/75" />
        <DotGrid dotColor="rgba(255,255,255,0.35)" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <Image src="/workmate-shield-logo.png" alt="Workmate Shield" width={56} height={56} className="h-14 w-14 rounded-lg shadow-xs" />
            <span className="font-semibold text-lg tracking-wider text-slate-100">
              WORKMATE <span className="text-primary font-bold">SHIELD</span>
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
              <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm text-slate-200">ISO 27001 & SOC 2 Audited</h4>
                <p className="text-xs text-slate-400">Enterprise grade cryptographic controls and access logs.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm text-slate-200">Microsoft Entra ID SSO Integration</h4>
                <p className="text-xs text-slate-400">Enable seamless OIDC single sign-on for your administration.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 shrink-0 mt-0.5" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6 29.6 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z" />
                <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35.1 26.8 36 24 36c-5.3 0-9.6-3.1-11.3-7.6l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 2.8-2.8 5.1-5.1 6.6l6.3 5.3C39.9 37.1 44 31.5 44 24c0-1.3-.1-2.7-.4-3.5z" />
              </svg>
              <div>
                <h4 className="font-semibold text-sm text-slate-200">Google Workspace SSO Integration</h4>
                <p className="text-xs text-slate-400">Let your team sign in with the Google account they already use every day.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 border-t border-slate-800 pt-6 flex items-center justify-between text-xs text-slate-400">
          <span>© 2026 Workmate Shield. All rights reserved.</span>
          <div className="flex items-center gap-1">
            <Award className="h-4 w-4 text-primary" />
            <span>Secure SaaS Platform</span>
          </div>
        </div>
      </div>

      {/* Right Form Pane */}
      <div className="col-span-1 md:col-span-7 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden bg-slate-50">
        {/* Large translucent brand watermark filling the empty space */}
        <Image
          src="/workmate-shield-logo-lg.png"
          alt=""
          width={640}
          height={640}
          aria-hidden="true"
          className="pointer-events-none select-none absolute -right-24 -bottom-24 w-[520px] h-[520px] opacity-[0.06] rotate-[-8deg]"
        />
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-8 shadow-xs relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}
