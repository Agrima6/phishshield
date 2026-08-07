import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy - Workmate Shield',
  description: 'How Workmate Shield collects, uses, and protects data on this platform.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/workmate-shield-logo.png" alt="Workmate Shield" width={32} height={32} className="h-8 w-8 rounded-md" />
            <span className="font-bold text-sm tracking-wider">
              WORKMATE <span className="text-primary">SHIELD</span>
            </span>
          </Link>
          <Link href="/auth/sign-up" className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to sign up
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-14">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: August 2026</p>

        <div className="space-y-8 text-sm text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">What we collect</h2>
            <p className="mb-3">
              When you create an account, we collect your name and email address through our authentication
              provider, Clerk. If your organization is onboarded as a customer, we also store basic company
              details: company name, a primary contact name, email, and phone number.
            </p>
            <p>
              When you use the platform to run phishing simulations, your administrators upload an employee
              directory (names, emails, and departments) so campaigns can be sent and results tracked. This
              data belongs to your organization, and we process it only to operate the platform on your behalf.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">What we do not do</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>We do not sell your data, your employees&apos; data, or your company&apos;s data to anyone.</li>
              <li>We do not use your data to train external AI models or share it with advertisers.</li>
              <li>We do not access your organization&apos;s data unless needed to provide support you requested.</li>
              <li>One customer&apos;s data is never visible to another customer. Each company&apos;s workspace is isolated.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Simulation and tracking data</h2>
            <p>
              When a simulated phishing email is opened or clicked, we record the timestamp, a coarse device
              and browser type, and an IP address, so your organization can measure and improve its security
              awareness. This data is used only for the reporting and analytics features inside your own
              dashboard, and only your organization&apos;s administrators can see it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Who else touches this data</h2>
            <p className="mb-3">A small number of trusted service providers help us run the platform:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Clerk</strong>, for authentication and account sign-in.</li>
              <li><strong>Your chosen email provider</strong> (our shared gateway, or your own SMTP/SendGrid credentials if configured), to send simulation emails.</li>
              <li><strong>Our database host</strong>, to store your account and campaign data securely.</li>
            </ul>
            <p className="mt-3">None of these providers are permitted to use your data for their own purposes.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Data retention and deletion</h2>
            <p>
              We keep your data for as long as your account is active. If you close your account or ask us to
              delete your organization&apos;s data, we will remove it, including employee records, campaign
              history, and audit logs, within a reasonable timeframe.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Security</h2>
            <p>
              All traffic to and from the platform is encrypted with HTTPS. Access to your organization&apos;s
              data is restricted by role, and administrative actions are recorded in an audit log that your
              own admins can review.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Contact us</h2>
            <p>
              If you have questions about this policy or want to request a copy or deletion of your data,
              email us at{' '}
              <a href="mailto:info@wcspl.net" className="text-primary font-semibold hover:underline">info@wcspl.net</a>
              {' '}or{' '}
              <a href="mailto:support@wcspl.net" className="text-primary font-semibold hover:underline">support@wcspl.net</a>.
            </p>
          </section>
        </div>
      </div>

      <footer className="border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-6 py-8 text-xs text-slate-400 text-center">
          © 2026 Workmate Shield. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
