'use client';

import { useEffect, useRef } from 'react';

interface DotGridProps {
  className?: string;
  dotColor?: string;
  spacing?: number;
  maxOffset?: number;
  radius?: number;
  baseRadius?: number;
}

export function DotGrid({
  className = '',
  dotColor = 'rgba(122, 18, 32, 0.4)',
  spacing = 30,
  maxOffset = 16,
  radius = 150,
  baseRadius = 1.3,
}: DotGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const mouse = { x: -9999, y: -9999 };
    let dots: { ox: number; oy: number; x: number; y: number }[] = [];

    const buildGrid = () => {
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;
      const list: { ox: number; oy: number; x: number; y: number }[] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * spacing;
          const y = r * spacing;
          list.push({ ox: x, oy: y, x, y });
        }
      }
      dots = list;
    };

    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const handleLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const d of dots) {
        const dx = d.ox - mouse.x;
        const dy = d.oy - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let tx = d.ox;
        let ty = d.oy;
        let sizeBoost = 0;
        if (dist < radius) {
          const force = (1 - dist / radius) * maxOffset;
          const angle = Math.atan2(dy, dx);
          tx = d.ox + Math.cos(angle) * force;
          ty = d.oy + Math.sin(angle) * force;
          sizeBoost = (1 - dist / radius) * 1.8;
        }
        d.x += (tx - d.x) * 0.16;
        d.y += (ty - d.y) * 0.16;
        ctx.beginPath();
        ctx.arc(d.x, d.y, baseRadius + sizeBoost, 0, Math.PI * 2);
        ctx.fillStyle = dotColor;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    buildGrid();
    const ro = new ResizeObserver(buildGrid);
    ro.observe(parent);
    parent.addEventListener('mousemove', handleMove);
    parent.addEventListener('mouseleave', handleLeave);
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      parent.removeEventListener('mousemove', handleMove);
      parent.removeEventListener('mouseleave', handleLeave);
    };
  }, [dotColor, spacing, maxOffset, radius, baseRadius]);

  return <canvas ref={canvasRef} className={`absolute inset-0 pointer-events-none ${className}`} />;
}
