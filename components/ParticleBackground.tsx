/**
 * 在页面背景中渲染粒子动画效果
 */

"use client";
import { useEffect, useRef } from 'react';

interface Particle { x: number; y: number; vx: number; vy: number; size: number; }

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    function handleResize() {
      const c = canvasRef.current;
      if (!c) return;
      width = c.width = window.innerWidth;
      height = c.height = window.innerHeight;
    }
    window.addEventListener('resize', handleResize);

    // init particles
    const count = Math.min(120, Math.floor(width / 15));
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      size: Math.random() * 1.2 + 0.4,
    }));

    function step() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(99, 140, 255, 0.35)';
      const particles = particlesRef.current;
      for (let p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x += width; else if (p.x > width) p.x -= width;
        if (p.y < 0) p.y += height; else if (p.y > height) p.y -= height;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      // draw lines between near particles for subtle mesh
      ctx.strokeStyle = 'rgba(99,140,255,0.15)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x; const dy = a.y - b.y;
          const dist = dx * dx + dy * dy;
          if (dist < 140 * 140) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(step);
    }
    const id = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', handleResize); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 -z-10 opacity-70 pointer-events-none" />;
}
