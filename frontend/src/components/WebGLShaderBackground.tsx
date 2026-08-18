import React, { useEffect, useRef, useState } from 'react';
import { ThemeTokens } from '../utils/themeEngine';

interface WebGLShaderBackgroundProps {
  theme?: ThemeTokens;
}

interface FloatingHeart {
  x: number;
  y: number;
  baseY: number;
  size: number;
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
}

interface FloatingGlass {
  x: number;
  y: number;
  baseY: number;
  width: number;
  height: number;
  angle: number;
  vRot: number;
  vx: number;
  vy: number;
  alpha: number;
  layer: 'bg' | 'mid' | 'fg';
  isChampagneFlute: boolean;
  liquidColor: string;
  swayFreq: number;
  swayAmp: number;
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

interface RosePetal {
  x: number;
  y: number;
  size: number;
  rot: number;
  vRot: number;
  vx: number;
  vy: number;
  alpha: number;
  layer: 'bg' | 'mid' | 'fg';
  swayFreq: number;
}

export const WebGLShaderBackground: React.FC<WebGLShaderBackgroundProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isLowPowerMode, setIsLowPowerMode] = useState(false);
  const scrollYRef = useRef(0);

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
      // Start top center notch of heart
      c.moveTo(0, -s * 0.35);
      // Top left lobe
      c.bezierCurveTo(-s * 0.55, -s * 0.9, -s * 0.95, -s * 0.3, -s * 0.55, s * 0.2);
      // Bottom tip
      c.bezierCurveTo(-s * 0.35, s * 0.5, 0, s * 0.85, 0, s * 0.95);
      // Bottom tip to right lobe
      c.bezierCurveTo(0, s * 0.85, s * 0.35, s * 0.5, s * 0.55, s * 0.2);
      // Top right lobe
      c.bezierCurveTo(s * 0.95, -s * 0.3, s * 0.55, -s * 0.9, 0, -s * 0.35);
      c.closePath();

      // Glass gradient fill
      const grad = c.createLinearGradient(-s * 0.5, -s * 0.5, s * 0.5, s * 0.8);
      grad.addColorStop(0, gradColors[0]);
      grad.addColorStop(1, gradColors[1]);
      c.fillStyle = grad;
      c.shadowColor = strokeColor;
      c.shadowBlur = s > 60 ? 18 : 10;
      c.fill();

      // Translucent inner highlight curve
      c.strokeStyle = strokeColor;
      c.lineWidth = s > 70 ? 2.5 : 1.5;
      c.stroke();

      // Specular highlight crescent
      c.beginPath();
      c.arc(-s * 0.28, -s * 0.38, s * 0.18, 0, Math.PI * 2);
      c.fillStyle = 'rgba(255, 255, 255, 0.45)';
      c.fill();

      c.restore();
    };

    // Helper: Draw Glass Champagne Flute / Wine Glass Vector Shape
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
      const stemHeight = h * 0.42;
      const baseWidth = w * 0.75;

      // 1. Crystal Base
      c.beginPath();
      c.ellipse(0, h * 0.48, baseWidth / 2, h * 0.04, 0, 0, Math.PI * 2);
      c.fillStyle = 'rgba(255, 255, 255, 0.25)';
      c.strokeStyle = 'rgba(214, 170, 97, 0.6)';
      c.lineWidth = 1.5;
      c.fill();
      c.stroke();

      // 2. Crystal Stem
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

      // 3. Liquid inside bowl
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

      // Liquid surface meniscus
      c.beginPath();
      c.ellipse(0, -bowlHeight * 0.4, isFlute ? w * 0.24 : w * 0.38, h * 0.03, 0, 0, Math.PI * 2);
      c.fillStyle = 'rgba(240, 215, 164, 0.65)';
      c.fill();

      // 4. Glass Bowl Outer Contour
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
      c.shadowColor = 'rgba(214, 170, 97, 0.5)';
      c.shadowBlur = 12;
      c.stroke();

      // Glass Rim
      c.beginPath();
      c.ellipse(0, -bowlHeight, isFlute ? w * 0.3 : w * 0.4, h * 0.035, 0, 0, Math.PI * 2);
      c.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      c.lineWidth = 1.8;
      c.stroke();

      // Glass Specular Sheen Reflection
      c.beginPath();
      c.moveTo(-w * 0.22, -bowlHeight * 0.85);
      c.quadraticCurveTo(-w * 0.25, -bowlHeight * 0.3, -w * 0.08, -bowlHeight * 0.08);
      c.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      c.lineWidth = 2.2;
      c.stroke();

      c.restore();
    };

    // Helper: Draw Rose Petals
    const drawPetal = (
      c: CanvasRenderingContext2D,
      px: number,
      py: number,
      size: number,
      rot: number,
      alpha: number
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

      const pGrad = c.createLinearGradient(-size * 0.5, -size, size * 0.5, size);
      pGrad.addColorStop(0, 'rgba(201, 92, 120, 0.85)');
      pGrad.addColorStop(0.6, 'rgba(122, 31, 61, 0.9)');
      pGrad.addColorStop(1, 'rgba(53, 13, 29, 0.95)');
      c.fillStyle = pGrad;
      c.shadowColor = 'rgba(201, 92, 120, 0.5)';
      c.shadowBlur = 8;
      c.fill();

      // Petal central vein
      c.beginPath();
      c.moveTo(0, -size * 0.8);
      c.quadraticCurveTo(-size * 0.1, 0, 0, size * 0.85);
      c.strokeStyle = 'rgba(232, 183, 194, 0.4)';
      c.lineWidth = 1;
      c.stroke();

      c.restore();
    };

    // 1. INITIALIZE PROMINENT FLOATING HEARTS (LARGE, MEDIUM, SMALL ACROSS 3 DEPTH LAYERS)
    const hearts: FloatingHeart[] = [
      // FOREGROUND LARGE HEARTS (Clearly visible on sides)
      {
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
        x: width * 0.82,
        y: height * 0.72,
        baseY: height * 0.72,
        size: isMobile ? 55 : 85,
        angle: -0.12,
        vRot: 0.002,
        vx: -0.06,
        vy: -0.14,
        alpha: 0.68,
        layer: 'fg',
        colorGrad: ['rgba(232, 183, 194, 0.45)', 'rgba(100, 21, 47, 0.7)'],
        strokeColor: 'rgba(214, 170, 97, 0.8)',
        swayFreq: 0.01,
        swayAmp: 14,
      },
      {
        x: width * 0.15,
        y: height * 0.78,
        baseY: height * 0.78,
        size: isMobile ? 50 : 80,
        angle: 0.16,
        vRot: -0.002,
        vx: 0.06,
        vy: -0.13,
        alpha: 0.65,
        layer: 'fg',
        colorGrad: ['rgba(201, 92, 120, 0.4)', 'rgba(53, 13, 29, 0.75)'],
        strokeColor: 'rgba(240, 215, 164, 0.75)',
        swayFreq: 0.011,
        swayAmp: 12,
      },

      // MIDGROUND MEDIUM HEARTS
      {
        x: width * 0.28,
        y: height * 0.16,
        baseY: height * 0.16,
        size: isMobile ? 38 : 55,
        angle: 0.1,
        vRot: 0.002,
        vx: 0.05,
        vy: -0.1,
        alpha: 0.55,
        layer: 'mid',
        colorGrad: ['rgba(214, 170, 97, 0.35)', 'rgba(122, 31, 61, 0.6)'],
        strokeColor: 'rgba(214, 170, 97, 0.65)',
        swayFreq: 0.015,
        swayAmp: 10,
      },
      {
        x: width * 0.72,
        y: height * 0.22,
        baseY: height * 0.22,
        size: isMobile ? 35 : 50,
        angle: -0.15,
        vRot: -0.002,
        vx: -0.05,
        vy: -0.1,
        alpha: 0.52,
        layer: 'mid',
        colorGrad: ['rgba(201, 92, 120, 0.35)', 'rgba(53, 13, 29, 0.65)'],
        strokeColor: 'rgba(232, 183, 194, 0.65)',
        swayFreq: 0.013,
        swayAmp: 10,
      },
      {
        x: width * 0.35,
        y: height * 0.88,
        baseY: height * 0.88,
        size: isMobile ? 32 : 48,
        angle: 0.08,
        vRot: 0.0025,
        vx: 0.04,
        vy: -0.09,
        alpha: 0.48,
        layer: 'mid',
        colorGrad: ['rgba(232, 183, 194, 0.3)', 'rgba(100, 21, 47, 0.55)'],
        strokeColor: 'rgba(240, 215, 164, 0.6)',
        swayFreq: 0.016,
        swayAmp: 9,
      },

      // BACKGROUND SMALL HEARTS
      {
        x: width * 0.48,
        y: height * 0.12,
        baseY: height * 0.12,
        size: isMobile ? 22 : 32,
        angle: -0.05,
        vRot: 0.0015,
        vx: -0.03,
        vy: -0.07,
        alpha: 0.38,
        layer: 'bg',
        colorGrad: ['rgba(214, 170, 97, 0.25)', 'rgba(53, 13, 29, 0.45)'],
        strokeColor: 'rgba(214, 170, 97, 0.45)',
        swayFreq: 0.02,
        swayAmp: 6,
      },
      {
        x: width * 0.62,
        y: height * 0.62,
        baseY: height * 0.62,
        size: isMobile ? 20 : 28,
        angle: 0.12,
        vRot: -0.0015,
        vx: 0.03,
        vy: -0.06,
        alpha: 0.35,
        layer: 'bg',
        colorGrad: ['rgba(201, 92, 120, 0.25)', 'rgba(53, 13, 29, 0.4)'],
        strokeColor: 'rgba(232, 183, 194, 0.45)',
        swayFreq: 0.018,
        swayAmp: 5,
      },
    ];

    // 2. INITIALIZE LARGE FLOATING WINE & CHAMPAGNE GLASSES (CRITICAL REQUIREMENT)
    const glasses: FloatingGlass[] = [
      // LEFT SIDE LARGE TILTED CHAMPAGNE FLUTE
      {
        x: width * 0.08,
        y: height * 0.48,
        baseY: height * 0.48,
        width: isMobile ? 42 : 65,
        height: isMobile ? 85 : 135,
        angle: 0.18, // Tilted gently right
        vRot: 0.0015,
        vx: 0.04,
        vy: -0.08,
        alpha: 0.75,
        layer: 'fg',
        isChampagneFlute: true,
        liquidColor: 'rgba(214, 170, 97, 0.85)', // Champagne Gold liquid
        swayFreq: 0.009,
        swayAmp: 12,
      },
      // RIGHT SIDE LARGE ELEGANT WINE GLASS
      {
        x: width * 0.92,
        y: height * 0.52,
        baseY: height * 0.52,
        width: isMobile ? 46 : 72,
        height: isMobile ? 80 : 130,
        angle: -0.15, // Tilted gently left
        vRot: -0.0015,
        vx: -0.04,
        vy: -0.07,
        alpha: 0.72,
        layer: 'fg',
        isChampagneFlute: false,
        liquidColor: 'rgba(122, 31, 61, 0.9)', // Deep Burgundy Wine
        swayFreq: 0.008,
        swayAmp: 10,
      },
      // UPPER BACKGROUND DISTANT CHAMPAGNE GLASS
      {
        x: width * 0.22,
        y: height * 0.08,
        baseY: height * 0.08,
        width: isMobile ? 28 : 42,
        height: isMobile ? 55 : 82,
        angle: -0.08,
        vRot: 0.001,
        vx: 0.02,
        vy: -0.05,
        alpha: 0.45,
        layer: 'mid',
        isChampagneFlute: true,
        liquidColor: 'rgba(240, 215, 164, 0.75)',
        swayFreq: 0.012,
        swayAmp: 7,
      },
      // LOWER BACKGROUND DISTANT WINE GLASS
      {
        x: width * 0.78,
        y: height * 0.88,
        baseY: height * 0.88,
        width: isMobile ? 30 : 45,
        height: isMobile ? 52 : 78,
        angle: 0.12,
        vRot: -0.001,
        vx: -0.02,
        vy: -0.05,
        alpha: 0.42,
        layer: 'mid',
        isChampagneFlute: false,
        liquidColor: 'rgba(100, 21, 47, 0.8)',
        swayFreq: 0.011,
        swayAmp: 6,
      },
    ];

    // 3. FLOATING ROSE PETALS (MIDGROUND & FOREGROUND)
    const petalCount = isMobile ? 12 : 22;
    const petals: RosePetal[] = [];
    for (let i = 0; i < petalCount; i++) {
      petals.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 10 + (isMobile ? 12 : 18),
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.015,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -(Math.random() * 0.35 + 0.12),
        alpha: Math.random() * 0.4 + 0.35,
        layer: i % 2 === 0 ? 'fg' : 'mid',
        swayFreq: Math.random() * 0.02 + 0.01,
      });
    }

    // 4. GOLDEN PARTICLES & BOKEH DUST
    const particleCount = isMobile ? 24 : 48;
    const particles: Particle[] = [];
    const pColors = ['#D6AA61', '#F0D7A4', '#C95C78', '#FFF8EF', '#E8B7C2'];

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

    // Render Animation Loop with 3-Layer Parallax Scrolling
    const render = () => {
      time += 1;
      ctx.clearRect(0, 0, width, height);

      const scrollY = scrollYRef.current;
      const bgParallax = scrollY * 0.08;
      const midParallax = scrollY * 0.22;
      const fgParallax = scrollY * 0.42;

      // ─── 1. DRAW BACKGROUND LAYER (Slowest Movement) ───
      for (const h of hearts) {
        if (h.layer === 'bg') {
          h.angle += h.vRot;
          const currentX = h.x + Math.sin(time * h.swayFreq) * h.swayAmp;
          const currentY = ((h.baseY - bgParallax + (time * h.vy)) % (height + 100) + (height + 100)) % (height + 100) - 50;
          drawHeart(ctx, currentX, currentY, h.size, h.angle, h.alpha, h.colorGrad, h.strokeColor);
        }
      }

      for (const p of particles) {
        if (p.layer === 'bg') {
          p.x += p.vx;
          p.y += p.vy;
          if (p.y < -10) p.y = height + 10;
          const pY = ((p.y - bgParallax) % (height + 20) + (height + 20)) % (height + 20) - 10;
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, pY, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // ─── 2. DRAW MIDGROUND LAYER (Medium Movement) ───
      for (const g of glasses) {
        if (g.layer === 'mid') {
          g.angle += g.vRot;
          const gx = g.x + Math.sin(time * g.swayFreq) * g.swayAmp;
          const gy = ((g.baseY - midParallax + (time * g.vy)) % (height + 140) + (height + 140)) % (height + 140) - 70;
          drawWineGlass(ctx, gx, gy, g.width, g.height, g.angle, g.alpha, g.isChampagneFlute, g.liquidColor);
        }
      }

      for (const h of hearts) {
        if (h.layer === 'mid') {
          h.angle += h.vRot;
          const currentX = h.x + Math.sin(time * h.swayFreq) * h.swayAmp;
          const currentY = ((h.baseY - midParallax + (time * h.vy)) % (height + 120) + (height + 120)) % (height + 120) - 60;
          drawHeart(ctx, currentX, currentY, h.size, h.angle, h.alpha, h.colorGrad, h.strokeColor);
        }
      }

      for (const pt of petals) {
        if (pt.layer === 'mid') {
          pt.rot += pt.vRot;
          pt.x += pt.vx + Math.sin(time * pt.swayFreq) * 0.4;
          pt.y += pt.vy;
          if (pt.y < -30) pt.y = height + 30;
          const py = ((pt.y - midParallax) % (height + 60) + (height + 60)) % (height + 60) - 30;
          drawPetal(ctx, pt.x, py, pt.size, pt.rot, pt.alpha);
        }
      }

      for (const p of particles) {
        if (p.layer === 'mid') {
          p.x += p.vx;
          p.y += p.vy;
          if (p.y < -10) p.y = height + 10;
          const pY = ((p.y - midParallax) % (height + 20) + (height + 20)) % (height + 20) - 10;
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.shadowColor = '#D6AA61';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(p.x, pY, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // ─── 3. DRAW FOREGROUND LAYER (Large Prominent Hearts & Glasses with strongest movement) ───
      for (const g of glasses) {
        if (g.layer === 'fg') {
          g.angle += g.vRot;
          const gx = g.x + Math.sin(time * g.swayFreq) * g.swayAmp;
          const gy = ((g.baseY - fgParallax + (time * g.vy)) % (height + 180) + (height + 180)) % (height + 180) - 90;
          drawWineGlass(ctx, gx, gy, g.width, g.height, g.angle, g.alpha, g.isChampagneFlute, g.liquidColor);
        }
      }

      for (const h of hearts) {
        if (h.layer === 'fg') {
          h.angle += h.vRot;
          const currentX = h.x + Math.sin(time * h.swayFreq) * h.swayAmp;
          const currentY = ((h.baseY - fgParallax + (time * h.vy)) % (height + 160) + (height + 160)) % (height + 160) - 80;
          drawHeart(ctx, currentX, currentY, h.size, h.angle, h.alpha, h.colorGrad, h.strokeColor);
        }
      }

      for (const pt of petals) {
        if (pt.layer === 'fg') {
          pt.rot += pt.vRot;
          pt.x += pt.vx + Math.sin(time * pt.swayFreq) * 0.5;
          pt.y += pt.vy;
          if (pt.y < -40) pt.y = height + 40;
          const py = ((pt.y - fgParallax) % (height + 80) + (height + 80)) % (height + 80) - 40;
          drawPetal(ctx, pt.x, py, pt.size, pt.rot, pt.alpha);
        }
      }

      for (const p of particles) {
        if (p.layer === 'fg') {
          p.x += p.vx;
          p.y += p.vy;
          if (p.y < -10) p.y = height + 10;
          const pY = ((p.y - fgParallax) % (height + 20) + (height + 20)) % (height + 20) - 10;
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.shadowColor = '#F0D7A4';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(p.x, pY, p.radius * 1.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
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
      <div className="fixed inset-0 pointer-events-none -z-10 bg-gradient-to-b from-[#350D1D] via-[#1E060F] to-[#0D0206]" />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none -z-10 w-full h-full"
      style={{
        background:
          'radial-gradient(ellipse at center top, #4A1022 0%, #2A0815 45%, #140209 80%, #080104 100%)',
      }}
    />
  );
};
