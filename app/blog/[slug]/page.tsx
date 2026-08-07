'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, PenLine, Trash2, User2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/hooks/use-session';
import { api } from '@/lib/api';
import { BlogPost } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return iso;
  }
}

export default function BlogPostPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { role } = useSession();
  const isSuperAdmin = role === 'super_admin';

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', content: '' });

  useEffect(() => {
    if (!params?.slug) return;
    api.blog
      .get(params.slug)
      .then((data) => {
        setPost(data);
        setEditForm({ title: data.title, content: data.content });
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params?.slug]);

  const handleSave = async () => {
    if (!post) return;
    if (!editForm.title.trim() || !editForm.content.trim()) {
      toast.error('Title and content are required.');
      return;
    }
    setSaving(true);
    try {
      const updated = await api.blog.update(post.id, editForm);
      setPost(updated);
      setEditing(false);
      toast.success('Post updated.');
    } catch {
      toast.error('Failed to update post.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!post || !confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    try {
      await api.blog.remove(post.id);
      toast.success('Post deleted.');
      router.push('/blog');
    } catch {
      toast.error('Failed to delete post.');
    }
  };

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
          <Link href="/blog" className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Blog
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-14">
        {loading ? (
          <div className="text-sm text-slate-400 py-10 text-center">Loading...</div>
        ) : notFound || !post ? (
          <div className="text-center py-10">
            <p className="text-sm text-slate-500 mb-4">This post could not be found.</p>
            <Link href="/blog" className="text-sm font-semibold text-primary hover:underline">Back to Blog</Link>
          </div>
        ) : editing ? (
          <div className="space-y-4">
            <Input
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              className="text-xl font-bold h-auto py-2.5"
            />
            <textarea
              value={editForm.content}
              onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
              rows={16}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y"
            />
            <div className="flex gap-3">
              <Button onClick={handleSave} loading={saving}>Save changes</Button>
              <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4 mb-3">
              <h1 className="text-3xl font-bold tracking-tight">{post.title}</h1>
              {isSuperAdmin && (
                <div className="flex items-center gap-3 shrink-0 pt-1.5">
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="text-slate-400 hover:text-primary transition-colors cursor-pointer"
                    title="Edit post"
                  >
                    <PenLine className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="text-slate-400 hover:text-destructive transition-colors cursor-pointer"
                    title="Delete post"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-8">
              <User2 className="h-3.5 w-3.5" />
              <span>
                {post.author_name}
                {post.author_company ? `, ${post.author_company}` : ''}
              </span>
              <span>·</span>
              <span>{formatDate(post.created_at)}</span>
            </div>
            <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
              {post.content.split(/\n\n+/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </>
        )}
      </div>

      <footer className="border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-6 py-8 text-xs text-slate-400 text-center">
          © 2026 Workmate Shield. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
