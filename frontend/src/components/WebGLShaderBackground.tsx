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
  type: 'heart' | 'glass' | 'rings' | 'star' | 'petal' | 'bokeh';
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  color: string;
  vx: number;
  vy: number;
  alpha: number;
  pulseSpeed: number;
  pulsePhase: number;
  layer: 'bg' | 'mid' | 'fg';
}

export const WebGLShaderBackground: React.FC<WebGLShaderBackgroundProps> = ({ eventType = 'WEDDING' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isLowPowerMode, setIsLowPowerMode] = useState(false);
  const scrollYRef = useRef(0);
  const mouseRef = useRef({ x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 });
  const category: CelebrationCategory = getCelebrationCategory(eventType);

  useEffect(() => {
    const handleScroll = () => {
      scrollYRef.current = window.scrollY || window.pageYOffset || 0;
    };
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX / window.innerWidth;
      mouseRef.current.targetY = e.clientY / window.innerHeight;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
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

    // Helper: Draw 3D Glass & Velvet Heart
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
      c.shadowBlur = s > 50 ? 20 : 10;
      c.fill();

      c.strokeStyle = strokeColor;
      c.lineWidth = s > 60 ? 2.5 : 1.5;
      c.stroke();

      // Specular Glass Reflection Highlight
      c.beginPath();
      c.ellipse(-s * 0.28, -s * 0.38, s * 0.16, s * 0.08, -Math.PI / 4, 0, Math.PI * 2);
      c.fillStyle = 'rgba(255, 255, 255, 0.65)';
      c.fill();

      c.restore();
    };

    // Helper: Draw 3D Crystal Wine / Champagne Flute
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

      // Base Pedestal
      c.beginPath();
      c.ellipse(0, h * 0.48, baseWidth / 2, h * 0.04, 0, 0, Math.PI * 2);
      c.fillStyle = 'rgba(255, 255, 255, 0.35)';
      c.strokeStyle = 'rgba(245, 158, 11, 0.7)';
      c.lineWidth = 1.5;
      c.fill();
      c.stroke();

      // Stem
      c.beginPath();
      c.moveTo(-w * 0.04, 0);
      c.lineTo(-w * 0.04, h * 0.48);
      c.lineTo(w * 0.04, h * 0.48);
      c.lineTo(w * 0.04, 0);
      c.closePath();
      c.fillStyle = 'rgba(255, 255, 255, 0.4)';
      c.strokeStyle = 'rgba(245, 158, 11, 0.5)';
      c.lineWidth = 1;
      c.fill();
      c.stroke();

      // Bowl Outer Glass
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

      const glassGrad = c.createLinearGradient(-w * 0.4, 0, w * 0.4, 0);
      glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
      glassGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
      glassGrad.addColorStop(1, 'rgba(255, 255, 255, 0.4)');
      c.fillStyle = glassGrad;
      c.strokeStyle = 'rgba(245, 158, 11, 0.8)';
      c.lineWidth = 1.8;
      c.fill();
      c.stroke();

      // Sparkling Champagne / Rose Wine Liquid
      c.beginPath();
      if (isFlute) {
        c.moveTo(-w * 0.2, -bowlHeight * 0.1);
        c.quadraticCurveTo(-w * 0.22, 0, 0, 0);
        c.quadraticCurveTo(w * 0.22, 0, w * 0.2, -bowlHeight * 0.1);
      } else {
        c.moveTo(-w * 0.32, -bowlHeight * 0.1);
        c.quadraticCurveTo(-w * 0.38, 0, 0, 0);
        c.quadraticCurveTo(w * 0.38, 0, w * 0.32, -bowlHeight * 0.1);
      }
      c.closePath();
      c.fillStyle = liquidColor;
      c.fill();

      // Rising Champagne Bubbles
      c.beginPath();
      c.arc(0, -bowlHeight * 0.2, 1.5, 0, Math.PI * 2);
      c.arc(-w * 0.08, -bowlHeight * 0.28, 1, 0, Math.PI * 2);
      c.arc(w * 0.06, -bowlHeight * 0.34, 1.2, 0, Math.PI * 2);
      c.fillStyle = '#FFFFFF';
      c.fill();

      // Rim Highlight
      c.beginPath();
      c.ellipse(0, -bowlHeight * 0.4, isFlute ? w * 0.24 : w * 0.38, h * 0.02, 0, 0, Math.PI * 2);
      c.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      c.lineWidth = 1.5;
      c.stroke();

      c.restore();
    };

    // Helper: Draw 3D Interlocking Wedding Rings
    const drawInterlockingRings = (
      c: CanvasRenderingContext2D,
      rx: number,
      ry: number,
      size: number,
      angle: number,
      alpha: number
    ) => {
      c.save();
      c.translate(rx, ry);
      c.rotate(angle);
      c.globalAlpha = Math.max(0, Math.min(1, alpha));

      const r = size * 0.35;
      // Ring 1 (Gold)
      c.beginPath();
      c.arc(-r * 0.5, 0, r, 0, Math.PI * 2);
      c.strokeStyle = '#F59E0B';
      c.lineWidth = size * 0.08;
      c.shadowColor = '#FBBF24';
      c.shadowBlur = 12;
      c.stroke();

      // Ring 2 (Rose Gold / Platinum)
      c.beginPath();
      c.arc(r * 0.5, 0, r, 0, Math.PI * 2);
      c.strokeStyle = '#FDA4AF';
      c.lineWidth = size * 0.08;
      c.stroke();

      // Solitaire Diamond Glimmer
      c.beginPath();
      c.arc(-r * 0.5, -r, size * 0.08, 0, Math.PI * 2);
      c.fillStyle = '#FFFFFF';
      c.shadowColor = '#FFFFFF';
      c.shadowBlur = 15;
      c.fill();

      c.restore();
    };

    // Helper: Draw 3D Fluttering Rose Petals
    const drawRosePetal = (
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
      c.moveTo(0, -size * 0.5);
      c.bezierCurveTo(size * 0.4, -size * 0.3, size * 0.4, size * 0.3, 0, size * 0.5);
      c.bezierCurveTo(-size * 0.4, size * 0.3, -size * 0.4, -size * 0.3, 0, -size * 0.5);
      c.closePath();

      const petalGrad = c.createRadialGradient(0, 0, 0, 0, 0, size * 0.5);
      petalGrad.addColorStop(0, '#F43F5E');
      petalGrad.addColorStop(0.7, '#E11D48');
      petalGrad.addColorStop(1, '#881337');
      c.fillStyle = petalGrad;
      c.shadowColor = '#FB7185';
      c.shadowBlur = 8;
      c.fill();

      c.restore();
    };

    // Helper: Draw Sparkling Starburst
    const drawStar = (
      c: CanvasRenderingContext2D,
      sx: number,
      sy: number,
      size: number,
      angle: number,
      alpha: number,
      color: string
    ) => {
      c.save();
      c.translate(sx, sy);
      c.rotate(angle);
      c.globalAlpha = Math.max(0, Math.min(1, alpha));

      c.beginPath();
      for (let i = 0; i < 4; i++) {
        c.moveTo(0, 0);
        c.lineTo(0, -size);
        c.lineTo(size * 0.15, -size * 0.15);
        c.lineTo(size, 0);
        c.lineTo(size * 0.15, size * 0.15);
        c.lineTo(0, size);
        c.lineTo(-size * 0.15, size * 0.15);
        c.lineTo(-size, 0);
        c.lineTo(-size * 0.15, -size * 0.15);
        c.closePath();
      }
      c.fillStyle = color;
      c.shadowColor = color;
      c.shadowBlur = 12;
      c.fill();

      c.restore();
    };

    // Initialize 3D Floating Elements
    const elementCount = isMobile ? 18 : 34;
    const elements: FloatingElement[] = [];

    const heartPalettes: [string, string][] = [
      ['rgba(244, 63, 94, 0.75)', 'rgba(136, 19, 55, 0.85)'], // Rose Red
      ['rgba(251, 113, 133, 0.7)', 'rgba(190, 18, 60, 0.8)'], // Blush
      ['rgba(245, 158, 11, 0.8)', 'rgba(180, 83, 9, 0.85)'], // Royal Amber Gold
      ['rgba(236, 72, 153, 0.7)', 'rgba(157, 23, 77, 0.8)'], // Fuchsia Romantic
    ];

    const types: FloatingElement['type'][] = [
      'heart',
      'heart',
      'heart',
      'glass',
      'rings',
      'petal',
      'petal',
      'star',
      'bokeh',
    ];

    for (let i = 0; i < elementCount; i++) {
      const layer: 'bg' | 'mid' | 'fg' = i % 3 === 0 ? 'bg' : i % 3 === 1 ? 'mid' : 'fg';
      const type = types[i % types.length];
      const pal = heartPalettes[i % heartPalettes.length];

      const size =
        layer === 'bg'
          ? Math.random() * 25 + 45
          : layer === 'mid'
          ? Math.random() * 20 + 25
          : Math.random() * 15 + 14;

      elements.push({
        x: Math.random() * width,
        y: Math.random() * height,
        baseY: Math.random() * height,
        size,
        width: size * (type === 'glass' ? 0.7 : 1),
        height: size * (type === 'glass' ? 1.6 : 1),
        angle: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.015,
        vx: (Math.random() - 0.5) * (layer === 'fg' ? 0.4 : 0.2),
        vy: -(Math.random() * (layer === 'fg' ? 0.6 : 0.3) + 0.2),
        alpha: layer === 'bg' ? 0.35 : layer === 'mid' ? 0.65 : 0.85,
        layer,
        colorGrad: pal,
        strokeColor: 'rgba(255, 215, 0, 0.6)',
        swayFreq: Math.random() * 0.02 + 0.01,
        swayAmp: Math.random() * 20 + 10,
        type,
      });
    }

    // Initialize Golden Stardust Particles
    const particleCount = isMobile ? 35 : 75;
    const particles: Particle[] = [];
    const particleColors = ['#F59E0B', '#FBBF24', '#FEF3C7', '#FDA4AF', '#FFFFFF', '#38BDF8'];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2.2 + 0.8,
        color: particleColors[Math.floor(Math.random() * particleColors.length)],
        vx: (Math.random() - 0.5) * 0.3,
        vy: -(Math.random() * 0.4 + 0.1),
        alpha: Math.random() * 0.7 + 0.3,
        pulseSpeed: Math.random() * 0.03 + 0.01,
        pulsePhase: Math.random() * Math.PI * 2,
        layer: i % 2 === 0 ? 'bg' : 'fg',
      });
    }

    let time = 0;

    // 60FPS Main Animation Render Loop
    const render = () => {
      time += 0.016;

      // Mouse Parallax Easing
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;
      const mouseOffsetX = (mouseRef.current.x - 0.5) * 40;
      const mouseOffsetY = (mouseRef.current.y - 0.5) * 30;

      const scrollY = scrollYRef.current;

      // Clear Canvas
      ctx.clearRect(0, 0, width, height);

      // 1. Deep Atmospheric Gradient Background
      const bgGrad = ctx.createRadialGradient(
        width * 0.5 + mouseOffsetX * 0.3,
        height * 0.35 + mouseOffsetY * 0.3,
        width * 0.1,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.85
      );

      bgGrad.addColorStop(0, '#2D0A14'); // Romantic Wine / Velvet Core
      bgGrad.addColorStop(0.45, '#19040A');
      bgGrad.addColorStop(0.8, '#0F0206');
      bgGrad.addColorStop(1, '#050103');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Cosmic Ambient Aurora Glow Centers
      const aura1 = ctx.createRadialGradient(
        width * 0.2 + mouseOffsetX * 0.5,
        height * 0.7 - scrollY * 0.05,
        10,
        width * 0.2,
        height * 0.7,
        width * 0.4
      );
      aura1.addColorStop(0, 'rgba(244, 63, 94, 0.18)');
      aura1.addColorStop(1, 'transparent');
      ctx.fillStyle = aura1;
      ctx.fillRect(0, 0, width, height);

      const aura2 = ctx.createRadialGradient(
        width * 0.8 - mouseOffsetX * 0.5,
        height * 0.25 - scrollY * 0.08,
        10,
        width * 0.8,
        height * 0.25,
        width * 0.45
      );
      aura2.addColorStop(0, 'rgba(245, 158, 11, 0.15)');
      aura2.addColorStop(1, 'transparent');
      ctx.fillStyle = aura2;
      ctx.fillRect(0, 0, width, height);

      // 3. Render 3D Floating Elements by Multi-Depth Layer
      const renderLayers: ('bg' | 'mid' | 'fg')[] = ['bg', 'mid', 'fg'];

      renderLayers.forEach((layer) => {
        const parallaxFactor = layer === 'bg' ? 0.08 : layer === 'mid' ? 0.2 : 0.35;
        const mouseFactor = layer === 'bg' ? 0.3 : layer === 'mid' ? 0.7 : 1.2;

        elements
          .filter((el) => el.layer === layer)
          .forEach((el) => {
            // Update Position with sinusoidal sway and upward float
            el.y += el.vy;
            el.angle += el.vRot;
            const sway = Math.sin(time * el.swayFreq * 100 + el.baseY) * el.swayAmp;
            const currentX = el.x + sway + mouseOffsetX * mouseFactor;
            const currentY = el.y - scrollY * parallaxFactor + mouseOffsetY * mouseFactor;

            // Wrap around screen boundaries smoothly
            if (el.y < -100) {
              el.y = height + 100;
              el.x = Math.random() * width;
            }
            if (el.x < -100) el.x = width + 100;
            if (el.x > width + 100) el.x = -100;

            // Render shape by type
            switch (el.type) {
              case 'heart':
                drawHeart(ctx, currentX, currentY, el.size, el.angle, el.alpha, el.colorGrad, el.strokeColor);
                break;
              case 'glass':
                drawWineGlass(
                  ctx,
                  currentX,
                  currentY,
                  el.width || el.size * 0.7,
                  el.height || el.size * 1.6,
                  el.angle,
                  el.alpha,
                  true,
                  'rgba(244, 63, 94, 0.65)'
                );
                break;
              case 'rings':
                drawInterlockingRings(ctx, currentX, currentY, el.size, el.angle, el.alpha);
                break;
              case 'petal':
                drawRosePetal(ctx, currentX, currentY, el.size, el.angle, el.alpha);
                break;
              case 'star':
                drawStar(ctx, currentX, currentY, el.size * 0.6, el.angle, el.alpha, '#FBBF24');
                break;
              case 'bokeh':
                ctx.save();
                ctx.beginPath();
                ctx.arc(currentX, currentY, el.size * 0.8, 0, Math.PI * 2);
                ctx.fillStyle = el.colorGrad[0];
                ctx.globalAlpha = el.alpha * 0.4;
                ctx.shadowColor = el.colorGrad[1];
                ctx.shadowBlur = 25;
                ctx.fill();
                ctx.restore();
                break;
            }
          });
      });

      // 4. Render Golden Stardust & Shimmering Embers
      particles.forEach((p) => {
        p.y += p.vy;
        p.x += p.vx;
        p.pulsePhase += p.pulseSpeed;
        const currentAlpha = p.alpha * (0.6 + 0.4 * Math.sin(p.pulsePhase));

        if (p.y < 0) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }

        const parallaxY = p.y - scrollY * (p.layer === 'bg' ? 0.05 : 0.25);

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, parallaxY, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, Math.min(1, currentAlpha));
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [category]);

  if (isLowPowerMode) {
    return (
      <div
        className="fixed inset-0 pointer-events-none -z-10 bg-gradient-to-b from-[#2D0A14] via-[#19040A] to-[#0A0205]"
        aria-hidden="true"
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none -z-10 w-full h-full"
      style={{
        width: '100vw',
        height: '100vh',
      }}
      aria-hidden="true"
    />
  );
};
