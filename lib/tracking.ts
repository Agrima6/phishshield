/**
 * Helpers for presenting recipient tracking data in reports.
 *
 * The DB `status` column is a coarse lifecycle marker (pending/sent/opened/
 * failed) - it never holds 'clicked'. Clicks live in clicked_at/click_count,
 * so the status shown in the UI is derived from those fields instead of
 * trusting `status` alone. The backend guarantees CLICKED => OPENED (a click
 * with no observed pixel hit sets opened_at to the click time), and this
 * derivation is monotonic: clicked > opened > sent, never downgrading.
 */

export type RecipientDisplayStatus = 'clicked' | 'opened' | 'sent' | 'failed' | 'pending';

export function recipientDisplayStatus(r: any): RecipientDisplayStatus {
  if (r?.status === 'failed') return 'failed';
  if (r?.clicked_at || (r?.click_count ?? 0) > 0) return 'clicked';
  if (r?.opened_at || r?.status === 'opened') return 'opened';
  if (r?.status === 'sent') return 'sent';
  return 'pending';
}

/** True when the recorded open came from an email provider's image proxy
 * rather than the recipient's own device, so the IP/device shown for it
 * belong to the provider (e.g. Google) and not the person. */
export function isProxyOpen(userAgent?: string | null): boolean {
  return /googleimageproxy|gmailimageproxy/i.test(userAgent || '');
}

/** Coarse browser name from a User-Agent string. Order matters: Edge and
 * Opera report "Chrome", and Chrome reports "Safari". */
export function parseBrowser(userAgent?: string | null): string {
  const ua = userAgent || '';
  if (!ua) return '';
  if (/googleimageproxy|gmailimageproxy/i.test(ua)) return 'Gmail image proxy';
  if (/edg(e|a|ios)?\//i.test(ua)) return 'Edge';
  if (/opr\/|opera/i.test(ua)) return 'Opera';
  if (/firefox|fxios/i.test(ua)) return 'Firefox';
  if (/chrome|crios/i.test(ua)) return 'Chrome';
  if (/safari/i.test(ua)) return 'Safari';
  return 'Other';
}

/** Best available device/network details for a recipient: prefer the click
 * (a real navigation from the person's own browser) over the open, which is
 * often a provider proxy fetch. */
export function recipientEnvironment(r: any) {
  const clicked = !!(r?.clicked_at || (r?.click_count ?? 0) > 0);
  const device = (clicked && r?.clicked_device_type) || r?.opened_device_type || '';
  const os = (clicked && r?.clicked_os) || r?.opened_os || '';
  const ua = (clicked && r?.clicked_ua) || r?.opened_ua || '';
  return {
    device,
    os,
    browser: parseBrowser(ua),
    clickIp: r?.clicked_ip || '',
    openIp: r?.opened_ip || '',
    openViaProxy: isProxyOpen(r?.opened_ua),
  };
}
