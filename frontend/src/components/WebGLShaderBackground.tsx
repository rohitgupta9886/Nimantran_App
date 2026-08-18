import React, { useEffect, useRef, useState } from 'react';
import { ThemeTokens } from '../utils/themeEngine';

interface WebGLShaderBackgroundProps {
  theme?: ThemeTokens;
}

export const WebGLShaderBackground: React.FC<WebGLShaderBackgroundProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isLowPowerMode, setIsLowPowerMode] = useState(false);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsLowPowerMode(true);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsLowPowerMode(true);
      return;
    }

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const isMobile = width < 640;

    // 1. LAYER 1 (BACKGROUND): SOFT GLOWING ROMANTIC BOKEH DISCS
    const bokehCount = isMobile ? 8 : 16;
    const bokehColors = [
      'rgba(212, 175, 55, 0.16)', // Warm Gold
      'rgba(110, 32, 53, 0.22)',  // Deep Wine
      'rgba(200, 155, 90, 0.15)', // Champagne
      'rgba(244, 114, 182, 0.14)',// Soft Rose
      'rgba(232, 207, 167, 0.12)',// Highlight Cream
    ];

    const bokehs: Array<{
      x: number;
      y: number;
      radius: number;
      color: string;
      alpha: number;
      maxAlpha: number;
      minAlpha: number;
      dAlpha: number;
    }> = [];

    for (let i = 0; i < bokehCount; i++) {
      const maxA = Math.random() * 0.25 + 0.1;
      bokehs.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 60 + 30,
        color: bokehColors[i % bokehColors.length],
        alpha: Math.random() * maxA,
        maxAlpha: maxA,
        minAlpha: 0.03,
        dAlpha: (Math.random() * 0.002 + 0.001) * (Math.random() > 0.5 ? 1 : -1),
      });
    }

    // 2. LAYER 2 (MIDGROUND): FLOATING ROSE PETALS, MARIGOLD & CHAMPAGNE PARTICLES
    const elementCount = isMobile ? 12 : 24;
    const elements: Array<{
      x: number;
      y: number;
      char: string;
      size: number;
      vx: number;
      vy: number;
      rot: number;
      vrot: number;
      alpha: number;
      swayAngle: number;
      swaySpeed: number;
    }> = [];

    const symbols = ['🌸', '🌹', '✨', '💖', '🥂', '🪷', '⭐'];

    for (let i = 0; i < elementCount; i++) {
      elements.push({
        x: Math.random() * width,
        y: Math.random() * height,
        char: symbols[i % symbols.length],
        size: Math.random() * 12 + 18,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -(Math.random() * 0.3 + 0.1), // Gently float upwards
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.01,
        alpha: Math.random() * 0.35 + 0.2,
        swayAngle: Math.random() * Math.PI * 2,
        swaySpeed: Math.random() * 0.02 + 0.01,
      });
    }

    // 3. LAYER 3 (FOREGROUND): TINY GOLDEN DUST PARTICLES
    const dustCount = isMobile ? 18 : 36;
    const dustParticles: Array<{
      x: number;
      y: number;
      radius: number;
      color: string;
      vx: number;
      vy: number;
      alpha: number;
      pulseSpeed: number;
    }> = [];

    const dustColors = ['#D4AF37', '#FFE58F', '#C89B5A', '#FFFFFF', '#FCF1F0'];

    for (let i = 0; i < dustCount; i++) {
      dustParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2 + 0.8,
        color: dustColors[i % dustColors.length],
        vx: (Math.random() - 0.5) * 0.15,
        vy: -(Math.random() * 0.25 + 0.08),
        alpha: Math.random() * 0.6 + 0.3,
        pulseSpeed: Math.random() * 0.03 + 0.01,
      });
    }

    // Animation Render Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Bokeh Discs (Layer 1)
      for (const b of bokehs) {
        b.alpha += b.dAlpha;
        if (b.alpha >= b.maxAlpha || b.alpha <= b.minAlpha) {
          b.dAlpha = -b.dAlpha;
        }
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, b.alpha));
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 2. Draw Floating Elements (Layer 2)
      ctx.font = '22px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (const el of elements) {
        el.x += el.vx + Math.sin(el.swayAngle) * 0.3;
        el.y += el.vy;
        el.rot += el.vrot;
        el.swayAngle += el.swaySpeed;

        if (el.y < -40) {
          el.y = height + 40;
          el.x = Math.random() * width;
        }

        ctx.save();
        ctx.globalAlpha = el.alpha;
        ctx.translate(el.x, el.y);
        ctx.rotate(el.rot);
        ctx.font = `${el.size}px serif`;
        ctx.fillText(el.char, 0, 0);
        ctx.restore();
      }

      // 3. Draw Golden Dust Sparkles (Layer 3)
      for (const d of dustParticles) {
        d.x += d.vx;
        d.y += d.vy;

        if (d.y < -10) {
          d.y = height + 10;
          d.x = Math.random() * width;
        }

        ctx.save();
        ctx.globalAlpha = d.alpha;
        ctx.fillStyle = d.color;
        ctx.shadowColor = '#D4AF37';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (isLowPowerMode) {
    return (
      <div 
        className="fixed inset-0 pointer-events-none -z-10 bg-gradient-to-b from-[#1C050C] via-[#0E0306] to-[#080204]"
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none -z-10 w-full h-full"
      style={{
        background: 'radial-gradient(ellipse at center top, #2D0B14 0%, #150308 60%, #0A0104 100%)',
      }}
    />
  );
};
