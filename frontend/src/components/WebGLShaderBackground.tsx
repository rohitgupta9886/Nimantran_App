import React, { useEffect, useRef, useState } from 'react';
import { ThemeTokens } from '../utils/themeEngine';

interface WebGLShaderBackgroundProps {
  theme: ThemeTokens;
}

export const WebGLShaderBackground: React.FC<WebGLShaderBackgroundProps> = ({ theme }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isLowPowerMode, setIsLowPowerMode] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
    let isCanvasVisible = true;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const isMobile = width < 640;

    // 1. FLOATING ROMANTIC EMOJIS (HEARTS, PETALS, WINE GLASSES, SPARKLES)
    // Curated romantic elements with depth-of-field variations
    const romanticSymbols = [
      { char: '💖', type: 'HEART', baseSize: 32, blur: 0 },
      { char: '❤️', type: 'HEART', baseSize: 24, blur: 1 },
      { char: '💕', type: 'HEART', baseSize: 36, blur: 2 },
      { char: '💗', type: 'HEART', baseSize: 20, blur: 0 },
      { char: '🌹', type: 'PETAL', baseSize: 28, blur: 0.5 },
      { char: '🌸', type: 'FLOWER', baseSize: 26, blur: 0 },
      { char: '🥂', type: 'WINE', baseSize: 34, blur: 1.5 },
      { char: '🍷', type: 'WINE', baseSize: 30, blur: 1 },
      { char: '✨', type: 'SPARKLE', baseSize: 18, blur: 0 },
      { char: '⭐', type: 'SPARKLE', baseSize: 16, blur: 0 },
      { char: '🪔', type: 'CANDLE', baseSize: 22, blur: 0 },
    ];

    const itemCount = isMobile ? 12 : 28;

    const items: Array<{
      x: number;
      y: number;
      z: number;
      char: string;
      size: number;
      vx: number;
      vy: number;
      vz: number;
      rot: number;
      vrot: number;
      alpha: number;
      swayAngle: number;
      swaySpeed: number;
      swayFreq: number;
      blur: number;
    }> = [];

    for (let i = 0; i < itemCount; i++) {
      const sym = romanticSymbols[i % romanticSymbols.length];
      items.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 300 + 40,
        char: sym.char,
        size: Math.random() * 12 + sym.baseSize,
        vx: (Math.random() - 0.5) * 0.15,
        vy: -(Math.random() * 0.35 + 0.12), // Gently rise upward
        vz: (Math.random() - 0.5) * 0.08,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.008,
        alpha: Math.random() * 0.45 + 0.25,
        swayAngle: Math.random() * Math.PI * 2,
        swaySpeed: Math.random() * 0.8 + 0.3,
        swayFreq: Math.random() * 0.015 + 0.005,
        blur: sym.blur,
      });
    }

    // 2. SOFT ROMANTIC BOKEH DISCS (CIRCULAR & HEART LIGHT DISCS)
    const bokehCount = isMobile ? 10 : 20;
    const bokehColors = [
      'rgba(244, 63, 94, 0.18)',   // Rose Red
      'rgba(255, 215, 0, 0.16)',   // Champagne Gold
      'rgba(192, 132, 252, 0.14)', // Romantic Violet
      'rgba(99, 102, 241, 0.15)',  // Deep Indigo
      'rgba(244, 114, 182, 0.16)', // Soft Pink
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
        radius: Math.random() * 50 + 25,
        color: bokehColors[i % bokehColors.length],
        alpha: Math.random() * maxA,
        maxAlpha: maxA,
        minAlpha: 0.03,
        dAlpha: (Math.random() * 0.003 + 0.001) * (Math.random() > 0.5 ? 1 : -1),
      });
    }

    // 3. CANDLELIGHT SPARKLES / DUST PARTICLES
    const particleCount = isMobile ? 15 : 35;
    const particles: Array<{
      x: number;
      y: number;
      radius: number;
      color: string;
      vx: number;
      vy: number;
      alpha: number;
    }> = [];

    const sparkColors = ['#FFD700', '#FBBF24', '#F43F5E', '#FFFFFF', '#E0E7FF'];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2 + 0.8,
        color: sparkColors[Math.floor(Math.random() * sparkColors.length)],
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        alpha: Math.random() * 0.5 + 0.2,
      });
    }

    let mouseX = width / 2;
    let mouseY = height / 2;
    let scrollY = window.scrollY;
    let scrollRaf: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleScroll = () => {
      if (scrollRaf !== null) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = null;
        scrollY = window.scrollY;
      });
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isCanvasVisible = entry.isIntersecting;
        });
      },
      { threshold: 0.01 }
    );
    observer.observe(canvas);

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    const render = () => {
      if (document.hidden || !isCanvasVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // 🌟 DEEP RICH ROMANTIC BLUE GRADIENT ATMOSPHERE 🌟
      const gradient = ctx.createRadialGradient(
        width * 0.5 + (mouseX - width * 0.5) * 0.02,
        height * 0.35 + (mouseY - height * 0.35) * 0.02,
        80,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.85
      );
      gradient.addColorStop(0, '#162447');   // Dark Royal Indigo Blue
      gradient.addColorStop(0.35, '#0F1B38'); // Deep Sapphire Navy
      gradient.addColorStop(0.75, '#0A1128'); // Midnight Romantic Blue
      gradient.addColorStop(1, '#050914');    // Deepest Velvet Night

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Render Soft Romantic Bokeh Discs
      bokehs.forEach((b) => {
        b.alpha += b.dAlpha;
        if (b.alpha > b.maxAlpha || b.alpha < b.minAlpha) {
          b.dAlpha = -b.dAlpha;
        }
        ctx.save();
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.globalAlpha = Math.max(0, b.alpha);
        ctx.fill();
        ctx.restore();
      });

      // Render Candlelight Sparkles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      // Render Floating Romantic Items (Hearts, Rose Petals, Wine Glasses, Sparkles)
      items.forEach((item) => {
        item.swayAngle += item.swayFreq;
        item.x += Math.sin(item.swayAngle) * item.swaySpeed + item.vx;
        item.y += item.vy;
        item.z += item.vz;
        item.rot += item.vrot;

        if (item.y < -50) {
          item.y = height + 50;
          item.x = Math.random() * width;
        }
        if (item.x < -50) item.x = width + 50;
        if (item.x > width + 50) item.x = -50;

        const scale = 350 / (350 + item.z);
        const screenX = item.x * scale;
        const screenY = item.y * scale;
        const renderSize = item.size * scale;

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(item.rot);
        ctx.font = `${Math.max(renderSize, 14)}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = item.alpha * scale;
        ctx.fillText(item.char, 0, 0);
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (scrollRaf !== null) cancelAnimationFrame(scrollRaf);
      observer.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [theme]);

  if (isLowPowerMode) {
    return (
      <div
        className="fixed inset-0 pointer-events-none z-0 transition-colors duration-1000"
        style={{
          background: 'radial-gradient(circle at 50% 35%, #162447 0%, #0A1128 70%, #050914 100%)',
        }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 w-full h-full opacity-95 transition-opacity duration-1000"
    />
  );
};
