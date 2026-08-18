'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MailWarning, Users, BarChart3, Clock, Lock,
  ArrowRight, MousePointerClick, GraduationCap, FileText, Sparkles, TriangleAlert, X,
} from 'lucide-react';
import { Reveal } from './reveal';
import { DotGrid } from './dot-grid';

const features = [
  {
    icon: MailWarning,
    title: 'Realistic Phishing Simulations',
    description: 'Launch authorized mock campaigns using a library of real-world lures: password resets, invoices, delivery notices, and more.',
    detail: 'Choose from a growing library of templates across IT & Security, Finance & Payroll, HR & Benefits, Productivity & Collaboration, and Shipping & Delivery themes, or write your own from scratch with a full HTML editor. Preview exactly what a recipient will see before you send, including the subject line and sender name.',
  },
  {
    icon: MousePointerClick,
    title: 'Real-Time Click Tracking',
    description: 'See exactly who opened, clicked, or reported a simulated attack the moment it happens, down to device and location.',
    detail: 'Every open and click is logged the instant it happens, along with device type, operating system, and IP address. Built-in bot and scanner filtering keeps automated email security tools from skewing your results, so the numbers reflect real human behavior.',
  },
  {
    icon: BarChart3,
    title: 'Department Risk Analytics',
    description: 'Spot your most at-risk teams with live vigilance scores, click-rate trends, and recent risk event feeds.',
    detail: 'A vigilance score gauge, a department-by-department click-rate chart, and a campaign performance trend line give you a clear read on organizational risk at a glance, not just a spreadsheet of raw numbers.',
  },
  {
    icon: Users,
    title: 'Employee Directory & Targeting',
    description: 'Organize your workforce by department, filter and target campaigns precisely, and track individual improvement over time.',
    detail: 'Import your whole team by CSV in one pass, organized by department from the start. Target a campaign at a single department, a custom selection, or your entire organization, and track how each employee\'s click rate improves across rounds of training.',
  },
  {
    icon: Clock,
    title: 'Scheduled Campaigns',
    description: 'Queue a simulation for the exact date and time you want it to land, with no need to be online when it fires.',
    detail: 'Set a campaign to fire at a specific date and time and walk away. It sends automatically in the background, and you can cancel or reschedule it any time before it goes out.',
  },
  {
    icon: FileText,
    title: 'One-Click Compliance Reports',
    description: 'Export branded PDF and CSV reports for audits and leadership reviews, generated in seconds.',
    detail: 'Generate a PDF report carrying your own company logo, complete with department risk breakdowns and campaign totals, ready to hand to auditors or leadership. Need the raw numbers instead? Export the same data as CSV in one click.',
  },
];

const steps = [
  {
    step: '01',
    title: 'Add your team',
    desc: 'Import your employee directory by CSV, organized by department.',
    detail: 'Download the provided CSV template, fill in names, emails, and departments, and import the whole list in one step. You can always add or edit individual employees afterward from the Employee Directory.',
  },
  {
    step: '02',
    title: 'Launch a simulation',
    desc: 'Pick a realistic template, choose your audience, and deploy instantly or on a schedule.',
    detail: 'Walk through a short wizard: name the campaign, pick your audience (filterable by department), choose a template, and optionally select a custom sending profile so it goes out from your own company domain instead of a shared address.',
  },
  {
    step: '03',
    title: 'Review the results',
    desc: 'Watch opens and clicks land in real time, then export a compliance-ready report.',
    detail: 'Watch sent, opened, and clicked counts update live as recipients interact with the email. Drill into any single campaign for a per-recipient breakdown, then export a branded PDF or CSV report when you are ready to share results.',
  },
];

const stats = [
  { value: '1 in 3', label: 'employees click a simulated phishing email on their first attempt' },
  { value: '<5 min', label: 'to launch a fully targeted campaign from template to send' },
  { value: '90%+', label: 'reduction in click-through rates after a few rounds of training' },
];

export default function LandingClient() {
  const [expandedFeature, setExpandedFeature] = useState<number | null>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      {/* Nav */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/workmate-shield-logo.png" alt="Workmate Shield" width={36} height={36} className="h-9 w-9 rounded-md" />
            <span className="font-bold text-sm tracking-wider text-slate-900">
              WORKMATE <span className="text-primary">SHIELD</span>
            </span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/blog" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">
              Blog
            </Link>
            <Link
              href="/auth/login"
              className="group relative overflow-hidden text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground transition-transform hover:scale-105 active:scale-95"
            >
              <span className="relative z-10">Sign In</span>
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-white">
        <DotGrid />
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl animate-[floatSlow_12s_ease-in-out_infinite]" />
        <div className="pointer-events-none absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-rose-300/20 blur-3xl animate-[floatSlow_15s_ease-in-out_infinite_1s]" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-24 md:pt-28 md:pb-32 grid md:grid-cols-2 gap-14 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 border border-primary/15 px-3 py-1 rounded-full mb-6 animate-[fadeInUp_0.6s_ease-out]">
              <Sparkles className="h-3.5 w-3.5" /> Security Awareness Platform
            </span>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-6 text-slate-900 animate-[fadeInUp_0.7s_ease-out_0.1s_both]">
              Train your team to spot phishing{' '}
              <span className="bg-gradient-to-r from-primary via-rose-500 to-primary bg-[length:200%_auto] bg-clip-text text-transparent animate-[shimmer_4s_linear_infinite]">
                before attackers do.
              </span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed mb-8 max-w-xl animate-[fadeInUp_0.7s_ease-out_0.2s_both]">
              Workmate Shield runs authorized, realistic phishing simulations across your organization,
              tracks who clicks in real time, and turns the results into clear risk analytics so your
              weakest link never becomes the headline.
            </p>
            <div className="flex flex-wrap items-center gap-4 animate-[fadeInUp_0.7s_ease-out_0.3s_both]">
              <Link
                href="/register"
                className="group relative overflow-hidden inline-flex items-center gap-2 text-sm font-bold px-6 py-3.5 rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-105 active:scale-95"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Get Started <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              </Link>
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" /> For internal, authorized security-awareness use only
              </span>
            </div>
          </div>

          {/* Floating product mockup */}
          <Reveal delay={150}>
            <div className="relative mx-auto max-w-md md:max-w-none animate-[floatSlow_8s_ease-in-out_infinite]">
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 to-rose-400/10 rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl border border-slate-200 shadow-2xl shadow-primary/10 bg-white overflow-hidden rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
                  <span className="ml-3 text-[11px] text-slate-400 font-medium">Inbox: Simulated Campaign</span>
                </div>
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-auto block"
                  src="/videos/phishing-inbox.mp4"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Threat is real */}
      <section className="relative overflow-hidden bg-white border-y border-slate-100">
        <DotGrid />
        <div className="pointer-events-none absolute top-0 right-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl animate-[floatSlow_14s_ease-in-out_infinite]" />
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-stretch">
          <Reveal className="h-full">
            <div className="relative h-full min-h-[320px] rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-black">
              <video
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover opacity-90"
                src="/videos/threat-terminal.mp4"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white text-xs font-semibold bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <TriangleAlert className="h-3.5 w-3.5 text-rose-300" /> Live threat simulation
              </div>
            </div>
          </Reveal>
          <Reveal delay={100} className="h-full">
            <div className="h-full flex flex-col justify-center">
              <h2 className="text-3xl font-bold tracking-tight mb-4">The threat isn&apos;t hypothetical.</h2>
              <p className="text-slate-600 leading-relaxed mb-8">
                Phishing is still the number one way attackers get into an organization. One convincing
                email is all it takes, and most teams only find out how exposed they are after it&apos;s
                too late. Workmate Shield lets you find out first, safely.
              </p>
              <div className="grid grid-cols-3 gap-4">
                {stats.map((s) => (
                  <div key={s.value}>
                    <div className="text-2xl font-bold text-primary mb-1">{s.value}</div>
                    <div className="text-xs text-slate-500 leading-snug">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-3xl font-bold tracking-tight mb-3">Everything you need to run a real program</h2>
              <p className="text-slate-500 text-sm">Not just an email blaster: a full phishing-awareness lifecycle from simulation to reporting.</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 80}>
                <div className="group bg-white border border-slate-200 rounded-xl p-6 h-full flex flex-col transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-primary/30">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-sm mb-2">{f.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">{f.description}</p>
                  <button
                    type="button"
                    onClick={() => setExpandedFeature(i)}
                    className="mt-auto self-start text-xs font-semibold text-primary hover:text-primary-hover inline-flex items-center gap-1 cursor-pointer"
                  >
                    More <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </button>
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
                <p className="text-sm text-slate-500 leading-relaxed mb-3">{s.desc}</p>
                <button
                  type="button"
                  onClick={() => setExpandedStep(i)}
                  className="text-xs font-semibold text-primary hover:text-primary-hover inline-flex items-center gap-1 cursor-pointer"
                >
                  More <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#3a0a10] via-[#5c0f18] to-[#7a1220] text-white">
        <DotGrid dotColor="rgba(255,255,255,0.4)" />
        <Reveal className="relative z-10">
          <div className="max-w-4xl mx-auto px-6 py-20 text-center">
            <GraduationCap className="h-10 w-10 text-rose-200 mx-auto mb-4 animate-[floatSlow_4s_ease-in-out_infinite]" />
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
              Your people are your first line of defense. Make sure they&apos;re ready.
            </h2>
            <Link
              href="/auth/login"
              className="group relative overflow-hidden inline-flex items-center gap-2 text-sm font-bold px-6 py-3.5 rounded-lg bg-white text-[#7a1220] shadow-lg shadow-black/20 transition-transform hover:scale-105 active:scale-95 mt-4"
            >
              <span className="relative z-10 flex items-center gap-2">
                Sign In to Console <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-black/10 to-transparent" />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <span>© 2026 Workmate Shield. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/blog" className="hover:text-primary transition-colors">Blog</Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
          </div>
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
          50% { transform: translateY(-14px) translateX(6px); }
        }
        @keyframes shimmer {
          to { background-position: 200% center; }
        }
      `}</style>

      {expandedFeature !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setExpandedFeature(null)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-7 animate-[fadeInUp_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setExpandedFeature(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
              {(() => {
                const Icon = features[expandedFeature].icon;
                return <Icon className="h-5.5 w-5.5" />;
              })()}
            </div>
            <h3 className="font-bold text-lg mb-3">{features[expandedFeature].title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{features[expandedFeature].detail}</p>
            <button
              type="button"
              onClick={() => setExpandedFeature(null)}
              className="mt-6 w-full text-sm font-semibold px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {expandedStep !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setExpandedStep(null)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-7 animate-[fadeInUp_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setExpandedStep(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <span className="inline-flex items-center justify-center h-11 w-11 rounded-full bg-primary/10 text-primary font-bold text-sm border border-primary/20 mb-4">
              {steps[expandedStep].step}
            </span>
            <h3 className="font-bold text-lg mb-3">{steps[expandedStep].title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{steps[expandedStep].detail}</p>
            <button
              type="button"
              onClick={() => setExpandedStep(null)}
              className="mt-6 w-full text-sm font-semibold px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
