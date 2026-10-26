'use client';

import React, { useRef, useState } from 'react';
import { Link2, Upload, X, Film, FileText, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { uploadWithProgress, API_BASE } from '@/lib/api';
import { toast } from 'sonner';

const ALLOWED_EXTS = ['.mp4', '.webm', '.pdf', '.ppt', '.pptx'];
const ALLOWED_MIME = [
  'video/mp4',
  'video/webm',
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];
const MAX_BYTES = 50 * 1024 * 1024;

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function isOwnUploadedVideo(url: string): boolean {
  return /\.(mp4|webm)(\?.*)?$/i.test(url);
}

function isOwnUploadedResource(url: string): boolean {
  return /\.(mp4|webm|pdf|ppt|pptx)(\?.*)?$/i.test(url);
}

function resolveUrl(url: string): string {
  return url.startsWith('/') ? `${API_BASE}${url}` : url;
}

interface Props {
  /** The campaign's training_url - a plain link (YouTube/other) OR an
   * uploaded video's URL. One field serves both, same as the backend. */
  value: string;
  onChange: (url: string) => void;
}

/** Optional training-resource picker for a campaign: either paste a link
 * (YouTube embeds, anything else shows as a button - existing behavior) or
 * upload a video file directly (MP4/WebM, up to 50 MB), with a live upload
 * progress bar and a preview/replace/remove flow once one is set. */
export function TrainingResourceField({ value, onChange }: Props) {
  const [mode, setMode] = useState<'link' | 'upload'>(isOwnUploadedResource(value) ? 'upload' : 'link');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pendingName, setPendingName] = useState('');
  const [pendingSize, setPendingSize] = useState(0);
  const abortRef = useRef<(() => void) | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validate = (file: File): string | null => {
    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_EXTS.includes(ext) && !ALLOWED_MIME.includes(file.type)) {
      return `Unsupported file type. Use: ${ALLOWED_EXTS.join(', ')}`;
    }
    if (file.size > MAX_BYTES) {
      return `File exceeds the 50 MB limit (this file is ${formatBytes(file.size)}).`;
    }
    if (file.size === 0) {
      return 'That file is empty.';
    }
    return null;
  };

  const handleFile = (file: File) => {
    const error = validate(file);
    if (error) {
      toast.error(error);
      return;
    }
    setPendingName(file.name);
    setPendingSize(file.size);
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('video', file);
    const { promise, abort } = uploadWithProgress<{ url: string; size: number }>(
      '/api/phish/upload/video',
      formData,
      setProgress,
    );
    abortRef.current = abort;
    promise
      .then((res) => {
        onChange(res.url);
        toast.success('File uploaded.');
      })
      .catch((err: any) => {
        if (err.message !== 'Upload cancelled.') toast.error(err.message || 'Failed to upload file.');
      })
      .finally(() => {
        setUploading(false);
        abortRef.current = null;
      });
  };

  const handleRemove = () => {
    abortRef.current?.();
    onChange('');
    setPendingName('');
    setPendingSize(0);
    setUploading(false);
    setProgress(0);
  };

  const hasUploadedResource = mode === 'upload' && value && isOwnUploadedResource(value) && !uploading;
  const uploadedIsVideo = isOwnUploadedVideo(value);

  return (
    <div>
      <div className="flex items-center gap-1 mb-2">
        <button
          type="button"
          onClick={() => setMode('link')}
          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 ${
            mode === 'link' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Link2 className="h-3 w-3" /> Paste a link
        </button>
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 ${
            mode === 'upload' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Upload className="h-3 w-3" /> Upload a file
        </button>
      </div>

      {mode === 'link' ? (
        <Input
          placeholder="https://youtube.com/watch?v=…  or any training page URL"
          value={isOwnUploadedResource(value) ? '' : value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,.mp4,.webm,.pdf,.ppt,.pptx"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) handleFile(file);
            }}
          />

          {uploading ? (
            <div className="border border-slate-200 rounded-md p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-700 truncate">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                  <span className="truncate">{pendingName}</span>
                  <span className="text-slate-400 shrink-0">({formatBytes(pendingSize)})</span>
                </span>
                <button type="button" onClick={handleRemove} className="text-slate-400 hover:text-destructive shrink-0">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
              <div className="text-[10px] text-slate-400">Uploading... {progress}%</div>
            </div>
          ) : hasUploadedResource ? (
            <div className="border border-slate-200 rounded-md p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-slate-700 font-medium truncate">
                  {uploadedIsVideo ? (
                    <Film className="h-3.5 w-3.5 text-primary shrink-0" />
                  ) : (
                    <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                  )}
                  <span className="truncate">{pendingName || (uploadedIsVideo ? 'Uploaded video' : 'Uploaded file')}</span>
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-[11px]" onClick={() => fileInputRef.current?.click()}>
                    Replace
                  </Button>
                  <button type="button" onClick={handleRemove} className="text-slate-400 hover:text-destructive p-1">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {uploadedIsVideo ? (
                <video controls preload="metadata" className="w-full rounded-md bg-black max-h-48">
                  <source src={resolveUrl(value)} />
                </video>
              ) : (
                <a
                  href={resolveUrl(value)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <FileText className="h-3.5 w-3.5" /> Open file
                </a>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 p-3 border border-dashed border-slate-300 rounded-md hover:bg-slate-50 transition-colors text-xs font-medium text-slate-500"
            >
              <Upload className="h-4 w-4 text-slate-400" /> Choose a video, PDF, or PPT file (up to 50 MB)
            </button>
          )}
        </div>
      )}

      <p className="text-[10px] text-slate-400 font-normal mt-1.5 leading-relaxed">
        Shown on the &quot;you&apos;ve been phished&quot; awareness page after the recipient submits the form.
        A YouTube link embeds as a video, an uploaded video plays natively, an uploaded PDF/PPT opens as a file,
        and any other link shows as a button. Optional - campaigns work the same without one.
      </p>
    </div>
  );
}
