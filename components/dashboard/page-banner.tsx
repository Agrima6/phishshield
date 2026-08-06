'use client';

import React from 'react';
import { DotGrid } from '@/components/landing/dot-grid';

interface PageBannerProps {
  title: string;
  description?: string;
  video?: string;
  actions?: React.ReactNode;
  eyebrow?: React.ReactNode;
}

export function PageBanner({ title, description, video, actions, eyebrow }: PageBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#1c0507] text-white px-6 py-8 sm:px-8 sm:py-9">
      {video && (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-70"
          src={video}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1c0507]/85 via-[#1c0507]/65 to-[#1c0507]/85" />
      <DotGrid dotColor="rgba(255,255,255,0.35)" />
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {eyebrow}
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">{title}</h1>
          {description && <p className="text-sm text-white/70 mt-1 max-w-xl">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
