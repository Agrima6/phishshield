'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Search, ArrowLeft, Mail } from 'lucide-react';
import { KNOWLEDGE_BASE, KBCategory, searchKnowledgeBase, SUPPORT_EMAIL } from '@/lib/support-kb';

interface TranscriptEntry {
  role: 'user' | 'bot';
  text: string;
}

interface Option {
  label: string;
  onClick: () => void;
  href?: string;
}

function RobotAvatar({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <line x1="24" y1="5" x2="24" y2="11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="4" r="2.5" fill="currentColor" />
      <rect x="8" y="11" width="32" height="28" rx="12" fill="currentColor" fillOpacity="0.18" />
      <rect x="8" y="11" width="32" height="28" rx="12" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="7" cy="25" r="3" fill="currentColor" />
      <circle cx="41" cy="25" r="3" fill="currentColor" />
      <circle cx="18" cy="25" r="3.4" fill="currentColor" />
      <circle cx="30" cy="25" r="3.4" fill="currentColor" />
      <path d="M18 32c1.8 2 4.2 3 6 3s4.2-1 6-3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Workmate Shield support request')}`;

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([
    { role: 'bot', text: "Hi, I'm Shieldy! 🤖 Pick a topic below and I'll dig in with you." },
  ]);
  const [options, setOptions] = useState<Option[]>([]);
  const [thinking, setThinking] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [transcript, options, thinking, open]);

  // Seed the root menu once, after the opening greeting above.
  useEffect(() => {
    setOptions(rootOptions());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const say = (userChoice: string | null, botReply: string, nextOptions: Option[]) => {
    setOptions([]);
    if (userChoice) {
      setTranscript((prev) => [...prev, { role: 'user', text: userChoice }]);
    }
    setThinking(true);
    window.setTimeout(() => {
      setTranscript((prev) => [...prev, { role: 'bot', text: botReply }]);
      setThinking(false);
      setOptions(nextOptions);
    }, 350);
  };

  const rootOptions = (): Option[] => [
    ...KNOWLEDGE_BASE.map((cat) => ({ label: cat.label, onClick: () => openCategory(cat) })),
    { label: "Something else / talk to a human", onClick: goToContact },
  ];

  const openCategory = (cat: KBCategory) => {
    say(cat.label, `Here are common questions about ${cat.label}:`, [
      ...cat.entries.map((entry) => ({ label: entry.q, onClick: () => openAnswer(cat, entry.q, entry.a) })),
      { label: '⬅ None of these, go back', onClick: goToRoot },
    ]);
  };

  const openAnswer = (cat: KBCategory, question: string, answer: string) => {
    say(question, answer, [
      { label: '✅ That solved it', onClick: onResolved },
      { label: '❌ Still need help', onClick: goToContact },
      { label: `⬅ Back to ${cat.label}`, onClick: () => openCategory(cat) },
    ]);
  };

  const onResolved = () => {
    say('✅ That solved it', 'Glad I could help! Anything else you want to look into?', rootOptions());
  };

  const goToRoot = () => {
    say(null, 'What do you need help with?', rootOptions());
  };

  const goToContact = () => {
    say('❌ Still need help', `No problem, our support team can take it from here. Reach us any time at ${SUPPORT_EMAIL} and we'll get back to you.`, [
      { label: `📧 Email ${SUPPORT_EMAIL}`, href: SUPPORT_MAILTO, onClick: () => {} },
      { label: '⬅ Back to main menu', onClick: goToRoot },
    ]);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchValue.trim();
    if (!query) return;
    setSearchValue('');
    const results = searchKnowledgeBase(query);
    if (results.length === 0) {
      say(query, "I couldn't find anything about that in my help topics. Want me to loop in support?", [
        { label: `📧 Email ${SUPPORT_EMAIL}`, href: SUPPORT_MAILTO, onClick: () => {} },
        { label: '⬅ Back to main menu', onClick: goToRoot },
      ]);
      return;
    }
    say(query, "Here's what I found:", [
      ...results.map((r) => ({ label: r.entry.q, onClick: () => openAnswer(r.category, r.entry.q, r.entry.a) })),
      { label: '⬅ None of these, go back', onClick: goToRoot },
    ]);
  };

  return (
    <>
      {/* Floating launcher button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open Shieldy chat assistant"
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform duration-200 animate-[bounce_3s_ease-in-out_infinite]"
        >
          <RobotAvatar className="h-8 w-8" />
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-success border-2 border-white" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[340px] sm:w-[380px] h-[520px] max-h-[75vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-[fadeInUp_0.2s_ease-out]">
          {/* Header */}
          <div className="bg-primary text-primary-foreground px-4 py-3.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center relative">
                <RobotAvatar className="h-6 w-6" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success border-2 border-primary" />
              </div>
              <div>
                <div className="font-bold text-sm leading-tight">Shieldy</div>
                <div className="text-[10px] opacity-80 leading-tight">Your Workmate Shield assistant</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="hover:opacity-75 transition-opacity">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3.5 py-4 space-y-3 bg-slate-50">
            {transcript.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-white text-slate-700 border border-slate-200 rounded-bl-sm'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300 animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300 animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300 animate-bounce" />
                </div>
              </div>
            )}
            {!thinking && options.length > 0 && (
              <div className="flex flex-col items-start gap-1.5 pt-1">
                {options.map((opt, i) =>
                  opt.href ? (
                    <a
                      key={i}
                      href={opt.href}
                      onClick={opt.onClick}
                      className="text-left text-xs font-semibold px-3 py-2 rounded-xl border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors flex items-center gap-1.5"
                    >
                      <Mail className="h-3.5 w-3.5 shrink-0" /> {opt.label}
                    </a>
                  ) : (
                    <button
                      key={i}
                      onClick={opt.onClick}
                      className="text-left text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-primary hover:text-primary transition-colors"
                    >
                      {opt.label}
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="p-3 border-t border-slate-100 flex items-center gap-2 shrink-0 bg-white">
            {transcript.length > 1 && (
              <button
                type="button"
                onClick={goToRoot}
                aria-label="Back to main menu"
                className="h-9 w-9 shrink-0 rounded-full border border-slate-200 text-slate-400 hover:text-primary hover:border-primary flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Or search a topic..."
              className="flex-1 text-xs px-3.5 py-2.5 rounded-full border border-slate-200 outline-none focus:border-primary transition-colors"
            />
            <button
              type="submit"
              disabled={!searchValue.trim()}
              className="h-9 w-9 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:bg-primary-hover transition-colors"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}
