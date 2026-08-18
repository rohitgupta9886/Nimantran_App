import React, { useEffect, useRef, useState } from 'react';
import { ThemeTokens } from '../utils/themeEngine';
import { getCelebrationCategory, CelebrationCategory } from '../utils/celebrationEngine';

interface WebGLShaderBackgroundProps {
  theme?: ThemeTokens;
  eventType?: string;
}

interface FloatingElement {
  x: number;
  y: number;
  baseY: number;
  size: number;
  width?: number;
  height?: number;
  angle: number;
  vRot: number;
  vx: number;
  vy: number;
  alpha: number;
  layer: 'bg' | 'mid' | 'fg';
  colorGrad: [string, string];
  strokeColor: string;
  swayFreq: number;
  swayAmp: number;
  type: 'heart' | 'glass' | 'star' | 'lotus' | 'prism' | 'petal' | 'confetti';
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  color: string;
  vx: number;
  vy: number;
  alpha: number;
  layer: 'bg' | 'mid' | 'fg';
}

export const WebGLShaderBackground: React.FC<WebGLShaderBackgroundProps> = ({ eventType = 'WEDDING' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isLowPowerMode, setIsLowPowerMode] = useState(false);
  const scrollYRef = useRef(0);
  const category: CelebrationCategory = getCelebrationCategory(eventType);

  useEffect(() => {
    const handleScroll = () => {
      scrollYRef.current = window.scrollY || window.pageYOffset || 0;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

    // Helper: Draw Glass Heart Vector Shape
    const drawHeart = (
      c: CanvasRenderingContext2D,
      hx: number,
      hy: number,
      size: number,
      angle: number,
      alpha: number,
      gradColors: [string, string],
      strokeColor: string
    ) => {
      c.save();
      c.translate(hx, hy);
      c.rotate(angle);
      c.globalAlpha = Math.max(0, Math.min(1, alpha));

      const s = size;
      c.beginPath();
      c.moveTo(0, -s * 0.35);
      c.bezierCurveTo(-s * 0.55, -s * 0.9, -s * 0.95, -s * 0.3, -s * 0.55, s * 0.2);
      c.bezierCurveTo(-s * 0.35, s * 0.5, 0, s * 0.85, 0, s * 0.95);
      c.bezierCurveTo(0, s * 0.85, s * 0.35, s * 0.5, s * 0.55, s * 0.2);
      c.bezierCurveTo(s * 0.95, -s * 0.3, s * 0.55, -s * 0.9, 0, -s * 0.35);
      c.closePath();

      const grad = c.createLinearGradient(-s * 0.5, -s * 0.5, s * 0.5, s * 0.8);
      grad.addColorStop(0, gradColors[0]);
      grad.addColorStop(1, gradColors[1]);
      c.fillStyle = grad;
      c.shadowColor = strokeColor;
      c.shadowBlur = s > 60 ? 18 : 10;
      c.fill();

      c.strokeStyle = strokeColor;
      c.lineWidth = s > 70 ? 2.5 : 1.5;
      c.stroke();

      c.beginPath();
      c.arc(-s * 0.28, -s * 0.38, s * 0.18, 0, Math.PI * 2);
      c.fillStyle = 'rgba(255, 255, 255, 0.45)';
      c.fill();

      c.restore();
    };

    // Helper: Draw Glass Champagne / Wine Glass
    const drawWineGlass = (
      c: CanvasRenderingContext2D,
      gx: number,
      gy: number,
      w: number,
      h: number,
      angle: number,
      alpha: number,
      isFlute: boolean,
      liquidColor: string
    ) => {
      c.save();
      c.translate(gx, gy);
      c.rotate(angle);
      c.globalAlpha = Math.max(0, Math.min(1, alpha));

      const bowlHeight = isFlute ? h * 0.58 : h * 0.48;
      const baseWidth = w * 0.75;

      c.beginPath();
      c.ellipse(0, h * 0.48, baseWidth / 2, h * 0.04, 0, 0, Math.PI * 2);
      c.fillStyle = 'rgba(255, 255, 255, 0.25)';
      c.strokeStyle = 'rgba(214, 170, 97, 0.6)';
      c.lineWidth = 1.5;
      c.fill();
      c.stroke();

      c.beginPath();
      c.moveTo(-w * 0.04, 0);
      c.lineTo(-w * 0.04, h * 0.48);
      c.lineTo(w * 0.04, h * 0.48);
      c.lineTo(w * 0.04, 0);
      c.closePath();
      c.fillStyle = 'rgba(255, 255, 255, 0.35)';
      c.strokeStyle = 'rgba(214, 170, 97, 0.5)';
      c.lineWidth = 1;
      c.fill();
      c.stroke();

      c.beginPath();
      if (isFlute) {
        c.moveTo(-w * 0.24, -bowlHeight * 0.4);
        c.quadraticCurveTo(-w * 0.28, 0, 0, 0);
        c.quadraticCurveTo(w * 0.28, 0, w * 0.24, -bowlHeight * 0.4);
      } else {
        c.moveTo(-w * 0.38, -bowlHeight * 0.4);
        c.quadraticCurveTo(-w * 0.48, 0, 0, 0);
        c.quadraticCurveTo(w * 0.48, 0, w * 0.38, -bowlHeight * 0.4);
      }
      c.closePath();
      const liquidGrad = c.createLinearGradient(0, -bowlHeight * 0.5, 0, 0);
      liquidGrad.addColorStop(0, liquidColor);
      liquidGrad.addColorStop(1, 'rgba(53, 13, 29, 0.95)');
      c.fillStyle = liquidGrad;
      c.fill();

      c.beginPath();
      if (isFlute) {
        c.moveTo(-w * 0.3, -bowlHeight);
        c.lineTo(-w * 0.28, -bowlHeight * 0.5);
        c.quadraticCurveTo(-w * 0.3, 0, 0, 0);
        c.quadraticCurveTo(w * 0.3, 0, w * 0.28, -bowlHeight * 0.5);
        c.lineTo(w * 0.3, -bowlHeight);
      } else {
        c.moveTo(-w * 0.4, -bowlHeight);
        c.quadraticCurveTo(-w * 0.52, -bowlHeight * 0.4, 0, 0);
        c.quadraticCurveTo(w * 0.52, -bowlHeight * 0.4, w * 0.4, -bowlHeight);
      }
      c.closePath();
      c.strokeStyle = 'rgba(214, 170, 97, 0.75)';
      c.lineWidth = 1.5;
      c.stroke();
      c.restore();
    };

    // Helper: Draw 5-Point Celebration Star (Birthday / Party)
    const drawStar = (
      c: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      spikes: number,
      outerRadius: number,
      innerRadius: number,
      angle: number,
      alpha: number,
      color: string
    ) => {
      c.save();
      c.translate(cx, cy);
      c.rotate(angle);
      c.globalAlpha = Math.max(0, Math.min(1, alpha));

      let rot = (Math.PI / 2) * 3;
      let x = 0;
      let y = 0;
      const step = Math.PI / spikes;

      c.beginPath();
      c.moveTo(0, -outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = Math.cos(rot) * outerRadius;
        y = Math.sin(rot) * outerRadius;
        c.lineTo(x, y);
        rot += step;

        x = Math.cos(rot) * innerRadius;
        y = Math.sin(rot) * innerRadius;
        c.lineTo(x, y);
        rot += step;
      }
      c.lineTo(0, -outerRadius);
      c.closePath();

      c.fillStyle = color;
      c.shadowColor = color;
      c.shadowBlur = 14;
      c.fill();
      c.restore();
    };

    // Helper: Draw Sacred Lotus Petal (Mundan / Baby / Devotional)
    const drawLotus = (
      c: CanvasRenderingContext2D,
      lx: number,
      ly: number,
      size: number,
      angle: number,
      alpha: number
    ) => {
      c.save();
      c.translate(lx, ly);
      c.rotate(angle);
      c.globalAlpha = Math.max(0, Math.min(1, alpha));

      c.beginPath();
      c.moveTo(0, -size);
      c.quadraticCurveTo(size * 0.7, -size * 0.3, 0, size * 0.8);
      c.quadraticCurveTo(-size * 0.7, -size * 0.3, 0, -size);
      c.closePath();

      const lGrad = c.createLinearGradient(0, -size, 0, size);
      lGrad.addColorStop(0, '#F59E0B');
      lGrad.addColorStop(0.5, '#EC4899');
      lGrad.addColorStop(1, '#B45309');
      c.fillStyle = lGrad;
      c.shadowColor = '#F59E0B';
      c.shadowBlur = 10;
      c.fill();

      c.restore();
    };

    // Helper: Draw Corporate Geometric Prism
    const drawPrism = (
      c: CanvasRenderingContext2D,
      px: number,
      py: number,
      size: number,
      angle: number,
      alpha: number
    ) => {
      c.save();
      c.translate(px, py);
      c.rotate(angle);
      c.globalAlpha = Math.max(0, Math.min(1, alpha));

      c.beginPath();
      c.moveTo(0, -size);
      c.lineTo(size * 0.86, size * 0.5);
      c.lineTo(-size * 0.86, size * 0.5);
      c.closePath();

      c.strokeStyle = 'rgba(56, 189, 248, 0.75)';
      c.lineWidth = 2;
      c.fillStyle = 'rgba(15, 23, 42, 0.4)';
      c.shadowColor = '#38BDF8';
      c.shadowBlur = 12;
      c.fill();
      c.stroke();
      c.restore();
    };

    // Helper: Draw Rose / Floral Petals
    const drawPetal = (
      c: CanvasRenderingContext2D,
      px: number,
      py: number,
      size: number,
      rot: number,
      alpha: number,
      color: string
    ) => {
      c.save();
      c.translate(px, py);
      c.rotate(rot);
      c.globalAlpha = Math.max(0, Math.min(1, alpha));

      c.beginPath();
      c.moveTo(0, -size);
      c.bezierCurveTo(-size * 0.8, -size * 0.6, -size * 0.9, size * 0.4, 0, size);
      c.bezierCurveTo(size * 0.9, size * 0.4, size * 0.8, -size * 0.6, 0, -size);
      c.closePath();

      c.fillStyle = color;
      c.shadowColor = color;
      c.shadowBlur = 6;
      c.fill();
      c.restore();
    };

    // Generate Dynamic Floating Elements based on category
    const elements: FloatingElement[] = [];

    if (category === 'WEDDING' || category === 'ROMANCE') {
      // Large Hearts on sides
      elements.push(
        {
          type: 'heart',
          x: width * 0.12,
          y: height * 0.28,
          baseY: height * 0.28,
          size: isMobile ? 65 : 105,
          angle: -0.18,
          vRot: 0.003,
          vx: 0.08,
          vy: -0.15,
          alpha: 0.78,
          layer: 'fg',
          colorGrad: ['rgba(201, 92, 120, 0.45)', 'rgba(100, 21, 47, 0.75)'],
          strokeColor: 'rgba(240, 215, 164, 0.85)',
          swayFreq: 0.012,
          swayAmp: 18,
        },
        {
          type: 'heart',
          x: width * 0.88,
          y: height * 0.35,
          baseY: height * 0.35,
          size: isMobile ? 60 : 95,
          angle: 0.22,
          vRot: -0.0025,
          vx: -0.07,
          vy: -0.12,
          alpha: 0.72,
          layer: 'fg',
          colorGrad: ['rgba(214, 170, 97, 0.45)', 'rgba(122, 31, 61, 0.75)'],
          strokeColor: 'rgba(255, 248, 239, 0.85)',
          swayFreq: 0.014,
          swayAmp: 15,
        },
        {
          type: 'glass',
          x: width * 0.08,
          y: height * 0.48,
          baseY: height * 0.48,
          size: 0,
          width: isMobile ? 42 : 65,
          height: isMobile ? 85 : 135,
          angle: 0.18,
          vRot: 0.0015,
          vx: 0.04,
          vy: -0.08,
          alpha: 0.75,
          layer: 'fg',
          colorGrad: ['rgba(214, 170, 97, 0.85)', 'rgba(53, 13, 29, 0.95)'],
          strokeColor: '#D6AA61',
          swayFreq: 0.009,
          swayAmp: 12,
        },
        {
          type: 'glass',
          x: width * 0.92,
          y: height * 0.52,
          baseY: height * 0.52,
          size: 0,
          width: isMobile ? 46 : 72,
          height: isMobile ? 80 : 130,
          angle: -0.15,
          vRot: -0.0015,
          vx: -0.04,
          vy: -0.07,
          alpha: 0.72,
          layer: 'fg',
          colorGrad: ['rgba(122, 31, 61, 0.9)', 'rgba(53, 13, 29, 0.95)'],
          strokeColor: '#7A1F3D',
          swayFreq: 0.008,
          swayAmp: 10,
        }
      );
    } else if (category === 'BIRTHDAY') {
      // Large Floating Celebration Stars & Confetti
      elements.push(
        {
          type: 'star',
          x: width * 0.15,
          y: height * 0.25,
          baseY: height * 0.25,
          size: isMobile ? 45 : 75,
          angle: 0,
          vRot: 0.008,
          vx: 0.06,
          vy: -0.14,
          alpha: 0.85,
          layer: 'fg',
          colorGrad: ['#F59E0B', '#D97706'],
          strokeColor: '#FDE68A',
          swayFreq: 0.012,
          swayAmp: 15,
        },
        {
          type: 'star',
          x: width * 0.85,
          y: height * 0.38,
          baseY: height * 0.38,
          size: isMobile ? 40 : 68,
          angle: 0.2,
          vRot: -0.007,
          vx: -0.06,
          vy: -0.12,
          alpha: 0.8,
          layer: 'fg',
          colorGrad: ['#EC4899', '#BE185D'],
          strokeColor: '#FBCFE8',
          swayFreq: 0.014,
          swayAmp: 14,
        },
        {
          type: 'star',
          x: width * 0.25,
          y: height * 0.75,
          baseY: height * 0.75,
          size: isMobile ? 32 : 52,
          angle: -0.1,
          vRot: 0.006,
          vx: 0.04,
          vy: -0.1,
          alpha: 0.65,
          layer: 'mid',
          colorGrad: ['#8B5CF6', '#6D28D9'],
          strokeColor: '#DDD6FE',
          swayFreq: 0.016,
          swayAmp: 10,
        }
      );
    } else if (category === 'BABY_SACRED' || category === 'DEVOTIONAL') {
      // Sacred Lotus Blossoms & Auspicious Motifs
      elements.push(
        {
          type: 'lotus',
          x: width * 0.14,
          y: height * 0.3,
          baseY: height * 0.3,
          size: isMobile ? 38 : 62,
          angle: -0.1,
          vRot: 0.003,
          vx: 0.05,
          vy: -0.12,
          alpha: 0.82,
          layer: 'fg',
          colorGrad: ['#F59E0B', '#B45309'],
          strokeColor: '#FEF3C7',
          swayFreq: 0.01,
          swayAmp: 14,
        },
        {
          type: 'lotus',
          x: width * 0.86,
          y: height * 0.4,
          baseY: height * 0.4,
          size: isMobile ? 35 : 58,
          angle: 0.15,
          vRot: -0.003,
          vx: -0.05,
          vy: -0.11,
          alpha: 0.78,
          layer: 'fg',
          colorGrad: ['#EC4899', '#BE185D'],
          strokeColor: '#FDE68A',
          swayFreq: 0.012,
          swayAmp: 12,
        }
      );
    } else if (category === 'CORPORATE') {
      // Clean Geometric Prisms & Platinum Nodes
      elements.push(
        {
          type: 'prism',
          x: width * 0.12,
          y: height * 0.32,
          baseY: height * 0.32,
          size: isMobile ? 40 : 65,
          angle: 0.1,
          vRot: 0.002,
          vx: 0.04,
          vy: -0.08,
          alpha: 0.75,
          layer: 'fg',
          colorGrad: ['#0EA5E9', '#0369A1'],
          strokeColor: '#38BDF8',
          swayFreq: 0.008,
          swayAmp: 10,
        },
        {
          type: 'prism',
          x: width * 0.88,
          y: height * 0.42,
          baseY: height * 0.42,
          size: isMobile ? 36 : 58,
          angle: -0.12,
          vRot: -0.002,
          vx: -0.04,
          vy: -0.07,
          alpha: 0.7,
          layer: 'fg',
          colorGrad: ['#38BDF8', '#0284C7'],
          strokeColor: '#BAE6FD',
          swayFreq: 0.009,
          swayAmp: 9,
        }
      );
    }

    // Floating Petals / Small Sparkles
    const petalCount = isMobile ? 12 : 20;
    const petals: Array<{ x: number; y: number; size: number; rot: number; vRot: number; vx: number; vy: number; alpha: number; layer: 'fg' | 'mid'; color: string }> = [];
    const petalColor = category === 'BIRTHDAY' ? '#F59E0B' : category === 'BABY_SACRED' || category === 'DEVOTIONAL' ? '#E68A00' : category === 'CORPORATE' ? '#38BDF8' : '#C95C78';

    for (let i = 0; i < petalCount; i++) {
      petals.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 8 + (isMobile ? 10 : 16),
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.015,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -(Math.random() * 0.35 + 0.12),
        alpha: Math.random() * 0.4 + 0.35,
        layer: i % 2 === 0 ? 'fg' : 'mid',
        color: petalColor,
      });
    }

    // Golden Sparkle Dust Particles
    const particleCount = isMobile ? 20 : 40;
    const particles: Particle[] = [];
    const pColors = category === 'CORPORATE' ? ['#38BDF8', '#BAE6FD', '#FFFFFF'] : ['#D6AA61', '#F0D7A4', '#C95C78', '#FFF8EF'];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2.5 + 0.8,
        color: pColors[i % pColors.length],
        vx: (Math.random() - 0.5) * 0.2,
        vy: -(Math.random() * 0.28 + 0.08),
        alpha: Math.random() * 0.65 + 0.25,
        layer: i % 3 === 0 ? 'fg' : i % 3 === 1 ? 'mid' : 'bg',
      });
    }

    let time = 0;

    const render = () => {
      time += 1;
      ctx.clearRect(0, 0, width, height);

      const scrollY = scrollYRef.current;
      const bgParallax = scrollY * 0.08;
      const midParallax = scrollY * 0.22;
      const fgParallax = scrollY * 0.42;

      // 1. Draw Floating Category Elements
      for (const el of elements) {
        const parallax = el.layer === 'fg' ? fgParallax : el.layer === 'mid' ? midParallax : bgParallax;
        el.angle += el.vRot;
        const currentX = el.x + Math.sin(time * el.swayFreq) * el.swayAmp;
        const currentY = ((el.baseY - parallax + (time * el.vy)) % (height + 160) + (height + 160)) % (height + 160) - 80;

        if (el.type === 'heart') {
          drawHeart(ctx, currentX, currentY, el.size, el.angle, el.alpha, el.colorGrad, el.strokeColor);
        } else if (el.type === 'glass') {
          drawWineGlass(ctx, currentX, currentY, el.width || 60, el.height || 120, el.angle, el.alpha, true, el.colorGrad[0]);
        } else if (el.type === 'star') {
          drawStar(ctx, currentX, currentY, 5, el.size, el.size * 0.45, el.angle, el.alpha, el.colorGrad[0]);
        } else if (el.type === 'lotus') {
          drawLotus(ctx, currentX, currentY, el.size, el.angle, el.alpha);
        } else if (el.type === 'prism') {
          drawPrism(ctx, currentX, currentY, el.size, el.angle, el.alpha);
        }
      }

      // 2. Draw Petals
      for (const pt of petals) {
        const parallax = pt.layer === 'fg' ? fgParallax : midParallax;
        pt.rot += pt.vRot;
        pt.x += pt.vx + Math.sin(time * 0.015) * 0.4;
        pt.y += pt.vy;
        if (pt.y < -30) pt.y = height + 30;
        const py = ((pt.y - parallax) % (height + 60) + (height + 60)) % (height + 60) - 30;
        drawPetal(ctx, pt.x, py, pt.size, pt.rot, pt.alpha, pt.color);
      }

      // 3. Draw Sparkles / Dust
      for (const p of particles) {
        const parallax = p.layer === 'fg' ? fgParallax : p.layer === 'mid' ? midParallax : bgParallax;
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) p.y = height + 10;
        const pY = ((p.y - parallax) % (height + 20) + (height + 20)) % (height + 20) - 10;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, pY, p.radius, 0, Math.PI * 2);
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
  }, [eventType, category]);

  const bgStyle =
    category === 'BIRTHDAY'
      ? 'radial-gradient(ellipse at center top, #3B1666 0%, #1E0A38 50%, #0D031A 100%)'
      : category === 'BABY_SACRED' || category === 'DEVOTIONAL'
      ? 'radial-gradient(ellipse at center top, #471A02 0%, #260E01 50%, #0F0500 100%)'
      : category === 'CORPORATE'
      ? 'radial-gradient(ellipse at center top, #0F172A 0%, #090D1A 50%, #020617 100%)'
      : 'radial-gradient(ellipse at center top, #4A1022 0%, #2A0815 45%, #140209 80%, #080104 100%)';

  if (isLowPowerMode) {
    return <div className="fixed inset-0 pointer-events-none -z-10" style={{ background: bgStyle }} />;
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none -z-10 w-full h-full"
      style={{ background: bgStyle }}
    />
  );
};
