/**
 * Shared logic for rendering a template's email HTML for preview purposes -
 * used by both the Templates page and the Campaigns page preview dialogs so
 * they don't drift apart (they did once already: campaigns/page.tsx had its
 * own stale copy that never got the header-image fix applied to the
 * templates page).
 *
 * Mirrors the backend's _inject_header_image (see app.py) so what an admin
 * sees in either preview matches what a launched campaign actually sends:
 * - body already has an <img>? swap that first image's src for the
 *   uploaded header image, so re-uploading it actually changes what shows,
 *   instead of leaving a stale hardcoded image in place.
 * - no <img> at all? insert one as the first row (or prepend it if there's
 *   no <table> wrapper to anchor to).
 * - no header image uploaded? body is returned unchanged.
 */
export function injectHeaderImage(bodyHtml: string, headerImageUrl?: string | null): string {
  if (!headerImageUrl) return bodyHtml;
  if (/<img\b/i.test(bodyHtml)) {
    return bodyHtml.replace(/(<img\b[^>]*\bsrc=")([^"]+)(")/i, `$1${headerImageUrl}$3`);
  }
  const headerImg = `<img src="${headerImageUrl}" width="600" alt="" style="display:block;width:100%;height:auto;border:0;" />`;
  const tableOpen = bodyHtml.match(/<table\b[^>]*>/i);
  return tableOpen
    ? bodyHtml.slice(0, tableOpen.index! + tableOpen[0].length) + `<tr><td>${headerImg}</td></tr>` + bodyHtml.slice(tableOpen.index! + tableOpen[0].length)
    : headerImg + bodyHtml;
}

/** A template's `thumbnail` field is either a real uploaded image URL or an
 * emoji/icon fallback (e.g. '🔑') - only the former is usable as an <img> src. */
export function templateHeaderImageUrl(temp: any): string {
  const thumb = temp?.thumbnail;
  return thumb && (thumb.startsWith('http') || thumb.startsWith('/')) ? thumb : '';
}

/** Fills in the same placeholders the real send pipeline substitutes, with
 * realistic sample values, and injects the header image - so the preview
 * shows what a recipient would actually see rather than raw {{tokens}} or
 * a missing header. */
export function renderTemplateEmailHtml(temp: any): string {
  if (!temp?.body) return '';
  const body = injectHeaderImage(temp.body as string, templateHeaderImageUrl(temp));
  return body
    .replaceAll('{{greeting}}', 'Hi')
    .replaceAll('{{first_name}}', 'Alex')
    .replaceAll('{{email}}', 'alex.morgan@yourcompany.com')
    .replaceAll('{{phishing_link}}', '#preview-only');
}
