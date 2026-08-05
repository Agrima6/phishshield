import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldCheck, MailWarning, Users, BarChart3, Clock, Lock,
  ArrowRight, MousePointerClick, GraduationCap, FileText,
} from 'lucide-react';

export const metadata = {
  title: 'Workmate Shield - Phishing Simulation & Security Awareness',
  description: 'Train your team to spot phishing before attackers do. Realistic simulations, real-time risk analytics, and one-click compliance reporting.',
};

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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Nav */}
      <header className="border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/workmate-shield-logo.png" alt="Workmate Shield" width={36} height={36} className="h-9 w-9 rounded-md" />
            <span className="font-bold text-sm tracking-wider">
              WORKMATE <span className="text-primary">SHIELD</span>
            </span>
          </div>
          <Link
            href="/auth/login"
            className="text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#f1e3e5_1px,transparent_1.5px)] [background-size:22px_22px] opacity-70 pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28 relative">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full mb-6">
              <ShieldCheck className="h-3.5 w-3.5" /> Security Awareness Platform
            </span>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-6">
              Train your team to spot phishing —{' '}
              <span className="text-primary">before attackers do.</span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed mb-8 max-w-xl">
              Workmate Shield runs authorized, realistic phishing simulations across your organization,
              tracks who clicks in real time, and turns the results into clear risk analytics — so your
              weakest link never becomes the headline.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 text-sm font-bold px-6 py-3.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors shadow-sm"
              >
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" /> For internal, authorized security-awareness use only
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-bold tracking-tight mb-3">Everything you need to run a real program</h2>
            <p className="text-slate-500 text-sm">Not just an email blaster — a full phishing-awareness lifecycle from simulation to reporting.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm mb-2">{f.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl font-bold tracking-tight mb-3">Up and running in three steps</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Add your team', desc: 'Import your employee directory by CSV, organized by department.' },
            { step: '02', title: 'Launch a simulation', desc: 'Pick a realistic template, choose your audience, and deploy — instantly or scheduled.' },
            { step: '03', title: 'Review the results', desc: 'Watch opens and clicks land in real time, then export a compliance-ready report.' },
          ].map((s) => (
            <div key={s.step} className="text-center md:text-left">
              <span className="text-4xl font-bold text-primary/20">{s.step}</span>
              <h3 className="font-bold text-base mt-2 mb-2">{s.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1c0507] text-white">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <GraduationCap className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
            Your people are your first line of defense. Make sure they&apos;re ready.
          </h2>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-sm font-bold px-6 py-3.5 rounded-lg bg-primary hover:bg-primary-hover transition-colors mt-4"
          >
            Sign In to Console <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <span>© 2026 Workmate Shield. All rights reserved.</span>
          <span>Intelligence that shields.</span>
        </div>
      </footer>
    </div>
  );
}
