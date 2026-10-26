'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Bold, Italic, Underline, Link2, Image as ImageIcon, Code2, Eye, Variable, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api, API_BASE } from '@/lib/api';
import { toast } from 'sonner';

const VARIABLES = [
  { token: '{{greeting}}', label: 'Greeting' },
  { token: '{{first_name}}', label: 'First name' },
  { token: '{{email}}', label: "Recipient's email" },
  { token: '{{phishing_link}}', label: 'Tracked link (use as a button/link href)' },
];

const resolveSrc = (src: string) => (src.startsWith('/') ? `${API_BASE}${src}` : src);

interface Props {
  /** Initial HTML. Only read on mount/remount (see `resetKey`) - this is an
   * uncontrolled editor, like a <textarea defaultValue>, so the iframe's own
   * edits are never clobbered by a parent re-render mid-typing. */
  value: string;
  onChange: (html: string) => void;
  /** Bump this (e.g. the template id, or a counter) to force the editor to
   * reload a different document - switching templates without unmounting
   * the whole dialog around it. */
  resetKey?: string | number | null;
  height?: number;
}

/**
 * A lightweight visual editor for phishing-template HTML: click text to
 * edit it in place, click an image to replace it, with the underlying HTML
 * (including {{merge_tags}} and the real layout/inline styles) preserved
 * exactly except for the edits made. Not a drag-and-drop page builder -
 * editing happens inside the template's own markup via the iframe's
 * designMode, which is what keeps the original layout/styling intact.
 *
 * Raw HTML remains available behind "View source" for anyone who needs it,
 * it's just no longer what's shown by default.
 */
export function VisualTemplateEditor({ value, onChange, resetKey, height = 360 }: Props) {
  const [mode, setMode] = useState<'visual' | 'html'>('visual');
  const [htmlDraft, setHtmlDraft] = useState(value);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingImgRef = useRef<HTMLImageElement | null>(null);
  const uploadingRef = useRef(false);
  const [uploading, setUploading] = useState(false);
  const emitChange = useCallback(
    (doc: Document) => onChange(doc.documentElement.outerHTML),
    [onChange],
  );

  // (Re)build the iframe's document exactly once per mount/resetKey/mode
  // flip - never on every keystroke, or the cursor/scroll position would
  // reset on each render.
  useEffect(() => {
    if (mode !== 'visual') return;
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(htmlDraft || '<html><body></body></html>');
    doc.close();
    // Absolute-ize any already-relative /static/uploads/... src so images
    // actually render inside the iframe (which has its own origin context).
    doc.querySelectorAll('img[src^="/"]').forEach((img) => {
      (img as HTMLImageElement).src = resolveSrc(img.getAttribute('src') || '');
    });
    try {
      doc.designMode = 'on';
    } catch {
      // Some sandboxed/embedded contexts refuse designMode; the iframe
      // still renders the template, just read-only - better than a blank editor.
    }

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleEmit = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => emitChange(doc), 300);
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const img = target.closest('img') as HTMLImageElement | null;
      if (img) {
        // Images are replaced via upload, not edited as text - and a click
        // on one shouldn't fall through to a wrapping <a>'s navigation.
        e.preventDefault();
        e.stopPropagation();
        pendingImgRef.current = img;
        fileInputRef.current?.click();
        return;
      }
      const link = target.closest('a');
      if (link) {
        // designMode makes <a> clickable/navigable by default; inside the
        // editor a click should place the cursor to edit the link's text,
        // not follow it (doubly true since the real href is often a
        // {{phishing_link}} token that isn't a real URL at all).
        e.preventDefault();
      }
    };
    const onInput = () => scheduleEmit();
    const onMutate = () => scheduleEmit();

    doc.addEventListener('click', onClick, true);
    doc.addEventListener('input', onInput);
    const observer = new MutationObserver(onMutate);
    observer.observe(doc.documentElement, { childList: true, subtree: true, characterData: true, attributes: true });

    return () => {
      doc.removeEventListener('click', onClick, true);
      doc.removeEventListener('input', onInput);
      observer.disconnect();
      if (debounceTimer) clearTimeout(debounceTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, resetKey]);

  const exec = (command: string, arg?: string) => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    doc.execCommand(command, false, arg);
    emitChange(doc);
  };

  const insertVariable = (token: string) => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    doc.execCommand('insertText', false, token);
    emitChange(doc);
  };

  const insertTrackedLink = () => {
    const doc = iframeRef.current?.contentDocument;
    const win = iframeRef.current?.contentWindow;
    if (!doc || !win) return;
    const selection = win.getSelection();
    const text = selection && !selection.isCollapsed ? selection.toString() : 'Click here';
    doc.execCommand(
      'insertHTML',
      false,
      `<a href="{{phishing_link}}" style="color:#2563eb;text-decoration:underline;">${text}</a>`,
    );
    emitChange(doc);
  };

  const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    const img = pendingImgRef.current;
    pendingImgRef.current = null;
    if (!file || !img) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image exceeds the 5 MB limit.');
      return;
    }
    uploadingRef.current = true;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.uploadImage(formData);
      img.src = resolveSrc(res.url);
      const doc = iframeRef.current?.contentDocument;
      if (doc) emitChange(doc);
      toast.success('Image replaced.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload image.');
    } finally {
      uploadingRef.current = false;
      setUploading(false);
    }
  };

  const switchToHtml = () => {
    const doc = iframeRef.current?.contentDocument;
    const html = doc ? doc.documentElement.outerHTML : htmlDraft;
    setHtmlDraft(html);
    onChange(html);
    setMode('html');
  };

  const switchToVisual = () => {
    onChange(htmlDraft);
    setMode('visual');
  };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 bg-slate-50 border-b border-slate-200">
        {mode === 'visual' ? (
          <>
            <ToolbarButton icon={Bold} label="Bold" onClick={() => exec('bold')} />
            <ToolbarButton icon={Italic} label="Italic" onClick={() => exec('italic')} />
            <ToolbarButton icon={Underline} label="Underline" onClick={() => exec('underline')} />
            <div className="w-px h-5 bg-slate-200 mx-1" />
            <ToolbarButton icon={Link2} label="Insert tracked link" onClick={insertTrackedLink} />
            <ToolbarButton
              icon={ImageIcon}
              label="Replace an image"
              onClick={() => toast.info('Click directly on an image in the template to replace it.')}
            />
            <div className="w-px h-5 bg-slate-200 mx-1" />
            <div className="relative group">
              <ToolbarButton icon={Variable} label="Insert variable" onClick={() => {}} />
              <div className="absolute left-0 top-full mt-1 hidden group-hover:block group-focus-within:block z-10 bg-white border border-slate-200 rounded-md shadow-lg py-1 w-56">
                {VARIABLES.map((v) => (
                  <button
                    key={v.token}
                    type="button"
                    onClick={() => insertVariable(v.token)}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex flex-col"
                  >
                    <span className="font-mono text-primary">{v.token}</span>
                    <span className="text-slate-400 text-[10px]">{v.label}</span>
                  </button>
                ))}
              </div>
            </div>
            {uploading && (
              <span className="flex items-center gap-1 text-[10px] text-slate-400 ml-1">
                <RefreshCw className="h-3 w-3 animate-spin" /> Uploading...
              </span>
            )}
            <div className="flex-1" />
            <ToolbarButton icon={Code2} label="View source" onClick={switchToHtml} />
          </>
        ) : (
          <>
            <span className="text-[10px] font-semibold text-slate-500 px-1">Editing raw HTML</span>
            <div className="flex-1" />
            <ToolbarButton icon={Eye} label="Back to visual editor" onClick={switchToVisual} />
          </>
        )}
      </div>

      {mode === 'visual' ? (
        <iframe
          ref={iframeRef}
          title="Template visual editor"
          className="w-full bg-white"
          style={{ height, border: 'none' }}
        />
      ) : (
        <textarea
          className="w-full bg-white font-mono text-xs p-3 outline-hidden"
          style={{ height, resize: 'vertical' }}
          value={htmlDraft}
          onChange={(e) => {
            setHtmlDraft(e.target.value);
            onChange(e.target.value);
          }}
        />
      )}

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChosen} />
    </div>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button type="button" variant="ghost" size="icon" title={label} onClick={onClick} className="h-7 w-7">
      <Icon className="h-3.5 w-3.5" />
    </Button>
  );
}
