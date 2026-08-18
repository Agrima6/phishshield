'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, PenLine, Trash2, X, User2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/hooks/use-session';
import { api } from '@/lib/api';
import { BlogPost } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function excerpt(content: string, max = 180) {
  const flat = content.replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max).trim()}...` : flat;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return iso;
  }
}

export default function BlogPage() {
  const { role, isLoggedIn } = useSession();
  const isSuperAdmin = role === 'super_admin';

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWriteForm, setShowWriteForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', author_name: '', author_company: '' });

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.blog.list();
      setPosts(data);
    } catch {
      toast.error('Could not load blog posts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim() || !form.author_name.trim()) {
      toast.error('Title, content, and your name are required.');
      return;
    }
    setSubmitting(true);
    try {
      await api.blog.create(form);
      toast.success('Post published.');
      setForm({ title: '', content: '', author_name: '', author_company: '' });
      setShowWriteForm(false);
      load();
    } catch {
      toast.error('Failed to publish post.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (post: BlogPost) => {
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    try {
      await api.blog.remove(post.id);
      toast.success('Post deleted.');
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
    } catch {
      toast.error('Failed to delete post.');
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/workmate-shield-logo.png" alt="Workmate Shield" width={32} height={32} className="h-8 w-8 rounded-md" />
            <span className="font-bold text-sm tracking-wider">
              WORKMATE <span className="text-primary">SHIELD</span>
            </span>
          </Link>
          <Link
            href={isLoggedIn ? '/dashboard' : '/'}
            className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> {isLoggedIn ? 'Back to Dashboard' : 'Back to Home'}
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-14">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Blog</h1>
            <p className="text-sm text-slate-500">Notes on phishing awareness, security habits, and what actually works.</p>
          </div>
          <Button onClick={() => setShowWriteForm(true)} className="shrink-0">
            <PenLine className="h-4 w-4 mr-1.5" /> Write a post
          </Button>
        </div>

        {loading ? (
          <div className="text-sm text-slate-400 py-10 text-center">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="text-sm text-slate-400 py-10 text-center">No posts yet. Be the first to write one.</div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <div
                key={post.id}
                className="group border border-slate-200 rounded-xl p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <Link href={`/blog/${post.slug}`} className="flex-1 min-w-0">
                    <h2 className="font-bold text-lg mb-1.5 group-hover:text-primary transition-colors">{post.title}</h2>
                    <p className="text-sm text-slate-500 leading-relaxed mb-3">{excerpt(post.content)}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <User2 className="h-3.5 w-3.5" />
                      <span>
                        {post.author_name}
                        {post.author_company ? `, ${post.author_company}` : ''}
                      </span>
                      <span>·</span>
                      <span>{formatDate(post.created_at)}</span>
                    </div>
                  </Link>
                  {isSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDelete(post)}
                      className="text-slate-300 hover:text-destructive transition-colors shrink-0 cursor-pointer"
                      title="Delete post"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-6 py-8 text-xs text-slate-400 text-center">
          © 2026 Workmate Shield. All rights reserved.
        </div>
      </footer>

      {showWriteForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => !submitting && setShowWriteForm(false)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-7 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowWriteForm(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="font-bold text-lg mb-1">Write a post</h3>
            <p className="text-xs text-slate-500 mb-5">Your post goes live immediately and is visible to everyone.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Give your post a title"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Your name</label>
                  <Input
                    value={form.author_name}
                    onChange={(e) => setForm({ ...form, author_name: e.target.value })}
                    placeholder="Aarav Sharma"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company (optional)</label>
                  <Input
                    value={form.author_company}
                    onChange={(e) => setForm({ ...form, author_company: e.target.value })}
                    placeholder="Sharma Enterprises Pvt Ltd"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Content</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Write your post here..."
                  rows={8}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y"
                />
              </div>
              <Button type="submit" className="w-full" loading={submitting}>
                Publish post
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
