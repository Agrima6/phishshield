'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldCheck, MailWarning, Users, BarChart3, Clock, Lock,
  ArrowRight, MousePointerClick, GraduationCap, FileText, Sparkles,
} from 'lucide-react';
import { Reveal } from './reveal';

const features = [
  {
    icon: MailWarning,
    title: 'Realistic Phishing Simulations',
    description: 'Launch authorized mock campaigns using a library of real-world lures — password resets, invoices, delivery notices, and more.',
  },
  {
    icon: MousePointerClick,
    title: 'Real-Time Click Tracking',
    description: 'See exactly who opened, clicked, or reported a simulated attack, the moment it happens — down to device and location.',
  },
  {
    icon: BarChart3,
    title: 'Department Risk Analytics',
    description: 'Spot your most at-risk teams with live vigilance scores, click-rate trends, and recent risk event feeds.',
  },
  {
    icon: Users,
    title: 'Employee Directory & Targeting',
    description: 'Organize your workforce by department, filter and target campaigns precisely, and track individual improvement over time.',
  },
  {
    icon: Clock,
    title: 'Scheduled Campaigns',
    description: 'Queue a simulation for the exact date and time you want it to land — no need to be online when it fires.',
  },
  {
    icon: FileText,
    title: 'One-Click Compliance Reports',
    description: 'Export branded PDF and CSV reports for audits and leadership reviews, generated in seconds.',
  },
];

const steps = [
  { step: '01', title: 'Add your team', desc: 'Import your employee directory by CSV, organized by department.' },
  { step: '02', title: 'Launch a simulation', desc: 'Pick a realistic template, choose your audience, and deploy — instantly or scheduled.' },
  { step: '03', title: 'Review the results', desc: 'Watch opens and clicks land in real time, then export a compliance-ready report.' },
];

function HeroSpotlight() {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    ref.current!.style.setProperty('--x', `${x}%`);
    ref.current!.style.setProperty('--y', `${y}%`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className="absolute inset-0 overflow-hidden [--x:50%] [--y:30%]"
    >
      {/* Drifting starfield */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.35)_1px,transparent_1.5px)] [background-size:26px_26px] opacity-30 animate-[driftBg_60s_linear_infinite]" />
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.2)_1px,transparent_1.5px)] [background-size:46px_46px] opacity-20 animate-[driftBg_90s_linear_infinite_reverse]" />

      {/* Mouse-following spotlight */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: 'radial-gradient(500px circle at var(--x) var(--y), rgba(233,79,101,0.22), transparent 60%)',
        }}
      />

      {/* Floating gradient orbs */}
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/25 blur-3xl animate-[floatSlow_10s_ease-in-out_infinite]" />
      <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-rose-500/15 blur-3xl animate-[floatSlow_13s_ease-in-out_infinite_1s]" />
      <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl animate-[floatSlow_16s_ease-in-out_infinite_2s]" />
    </div>
  );
}

export default function LandingClient() {
  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      {/* Nav */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/70 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/workmate-shield-logo.png" alt="Workmate Shield" width={36} height={36} className="h-9 w-9 rounded-md" />
            <span className="font-bold text-sm tracking-wider">
              WORKMATE <span className="text-primary">SHIELD</span>
            </span>
          </div>
          <Link
            href="/auth/login"
            className="group relative overflow-hidden text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground transition-transform hover:scale-105 active:scale-95"
          >
            <span className="relative z-10">Sign In</span>
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0d0304] text-white">
        <HeroSpotlight />
        <div className="max-w-6xl mx-auto px-6 py-28 md:py-36 relative z-10">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-200 bg-white/10 border border-white/10 px-3 py-1 rounded-full mb-6 animate-[fadeInUp_0.6s_ease-out]">
              <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" /> Security Awareness Platform
            </span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-6 animate-[fadeInUp_0.7s_ease-out_0.1s_both]">
              Train your team to spot phishing —{' '}
              <span className="bg-gradient-to-r from-primary via-rose-300 to-primary bg-[length:200%_auto] bg-clip-text text-transparent animate-[shimmer_4s_linear_infinite]">
                before attackers do.
              </span>
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed mb-8 max-w-xl animate-[fadeInUp_0.7s_ease-out_0.2s_both]">
              Workmate Shield runs authorized, realistic phishing simulations across your organization,
              tracks who clicks in real time, and turns the results into clear risk analytics — so your
              weakest link never becomes the headline.
            </p>
            <div className="flex flex-wrap items-center gap-4 animate-[fadeInUp_0.7s_ease-out_0.3s_both]">
              <Link
                href="/auth/login"
                className="group relative overflow-hidden inline-flex items-center gap-2 text-sm font-bold px-6 py-3.5 rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 active:scale-95"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Get Started <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              </Link>
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" /> For internal, authorized security-awareness use only
              </span>
            </div>
          </div>
        </div>
        {/* Fade to white at bottom of hero */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-white pointer-events-none" />
      </section>

      {/* Features */}
      <section className="bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-3xl font-bold tracking-tight mb-3">Everything you need to run a real program</h2>
              <p className="text-slate-500 text-sm">Not just an email blaster — a full phishing-awareness lifecycle from simulation to reporting.</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 80}>
                <div className="group bg-white border border-slate-200 rounded-xl p-6 h-full transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-primary/30">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-sm mb-2">{f.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{f.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-bold tracking-tight mb-3">Up and running in three steps</h2>
          </div>
        </Reveal>
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="hidden md:block absolute top-6 left-[16.5%] right-[16.5%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          {steps.map((s, i) => (
            <Reveal key={s.step} delay={i * 120}>
              <div className="text-center md:text-left group">
                <span className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary font-bold text-sm border border-primary/20 transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110">
                  {s.step}
                </span>
                <h3 className="font-bold text-base mt-4 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-[#0d0304] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.25)_1px,transparent_1.5px)] [background-size:28px_28px] opacity-20 animate-[driftBg_70s_linear_infinite]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-primary/25 blur-3xl animate-[floatSlow_12s_ease-in-out_infinite]" />
        <Reveal className="relative z-10">
          <div className="max-w-4xl mx-auto px-6 py-20 text-center">
            <GraduationCap className="h-10 w-10 text-primary mx-auto mb-4 animate-[floatSlow_4s_ease-in-out_infinite]" />
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
              Your people are your first line of defense. Make sure they&apos;re ready.
            </h2>
            <Link
              href="/auth/login"
              className="group relative overflow-hidden inline-flex items-center gap-2 text-sm font-bold px-6 py-3.5 rounded-lg bg-primary shadow-lg shadow-primary/30 transition-transform hover:scale-105 active:scale-95 mt-4"
            >
              <span className="relative z-10 flex items-center gap-2">
                Sign In to Console <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <span>© 2026 Workmate Shield. All rights reserved.</span>
          <span>Intelligence that shields.</span>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-18px) translateX(10px); }
        }
        @keyframes driftBg {
          from { background-position: 0 0; }
          to { background-position: 200px 200px; }
        }
        @keyframes shimmer {
          to { background-position: 200% center; }
        }
      `}</style>
    </div>
  );
}
