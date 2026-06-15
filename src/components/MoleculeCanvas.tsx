import React, { useEffect, useRef, useCallback } from 'react';
import { useEmotion } from '../hooks/useEmotion';
import type { Emotions } from '../types/emotion';

interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  size: number;
}

interface MoleculeCanvasProps {
  text: string;
  fontFamily: string;
  fontSize: number;
  sensitivity: number;
  palette: string;
}

type ColorRGB = { r: number; g: number; b: number };
type Palette = {
  happy: ColorRGB;
  angry: ColorRGB;
  sad: ColorRGB;
  surprised: ColorRGB;
  neutral: ColorRGB;
};

// Brutalist Color Palettes
const PALETTES: Record<string, Palette> = {
  acid: {
    happy: { r: 253, g: 255, b: 182 },      // Acid Lemon
    angry: { r: 255, g: 173, b: 173 },      // Soft Red
    sad: { r: 155, g: 246, b: 255 },        // Electric Blue
    surprised: { r: 189, g: 178, b: 255 },  // Electric Purple
    neutral: { r: 245, g: 202, b: 195 }     // Peach
  },
  retro: {
    happy: { r: 244, g: 211, b: 94 },       // Mustard
    angry: { r: 242, g: 132, b: 130 },      // Coral
    sad: { r: 168, g: 218, b: 220 },        // Retro Blue
    surprised: { r: 189, g: 178, b: 255 },  // Purple
    neutral: { r: 132, g: 165, b: 157 }     // Sage
  },
  neon: {
    happy: { r: 0, g: 255, b: 0 },
    angry: { r: 255, g: 0, b: 0 },
    sad: { r: 0, g: 0, b: 255 },
    surprised: { r: 255, g: 0, b: 255 },
    neutral: { r: 255, g: 255, b: 255 }
  },
  mono: {
    happy: { r: 255, g: 255, b: 255 },
    angry: { r: 50, g: 50, b: 50 },
    sad: { r: 150, g: 150, b: 150 },
    surprised: { r: 200, g: 200, b: 200 },
    neutral: { r: 100, g: 100, b: 100 }
  }
};

const MoleculeCanvas: React.FC<MoleculeCanvasProps> = React.memo(({ text, fontFamily, fontSize, sensitivity, palette }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { emotionsRef } = useEmotion();
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, active: false });

  // Increased density for readability
  const step = 3; 
  const radius = 120;

  const getInterpolatedColor = useCallback((e: Emotions, paletteKey: string) => {
    const p = PALETTES[paletteKey] || PALETTES.acid;
    const r = (e.happy * p.happy.r + e.angry * p.angry.r + e.sad * p.sad.r + e.surprised * p.surprised.r + e.neutral * p.neutral.r);
    const g = (e.happy * p.happy.g + e.angry * p.angry.g + e.sad * p.sad.g + e.surprised * p.surprised.g + e.neutral * p.neutral.g);
    const b = (e.happy * p.happy.b + e.angry * p.angry.b + e.sad * p.sad.b + e.surprised * p.surprised.b + e.neutral * p.neutral.b);
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const initParticles = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'black';
      
      const responsiveFontSize = Math.min(canvas.width / 4, fontSize);
      ctx.font = `900 ${responsiveFontSize}px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const newParticles: Particle[] = [];

      for (let y = 0; y < canvas.height; y += step) {
        for (let x = 0; x < canvas.width; x += step) {
          const index = (y * canvas.width + x) * 4;
          if (data[index + 3] > 128) {
            newParticles.push({
              x: Math.random() * canvas.width,
              y: Math.random() * canvas.height,
              originX: x,
              originY: y,
              vx: (Math.random() - 0.5) * 15,
              vy: (Math.random() - 0.5) * 15,
              size: Math.random() * 3 + 1,
            });
          }
        }
      }

      if (newParticles.length === 0) {
        for (let i = 0; i < 1000; i++) {
          const x = Math.random() * canvas.width;
          const y = Math.random() * canvas.height;
          newParticles.push({
            x, y, originX: x, originY: y, vx: 0, vy: 0, size: 3
          });
        }
      }

      particlesRef.current = newParticles;
    };

    const handleResize = () => {
      initParticles();
    };

    window.addEventListener('resize', handleResize);
    initParticles();
    
    return () => window.removeEventListener('resize', handleResize);
  }, [text, fontFamily, fontSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let pulseTime = 0;

    const render = () => {
      const rawEmotions = emotionsRef.current || { happy: 0, sad: 0, angry: 0, surprised: 0, neutral: 1 };
      
      // APPLY SENSITIVITY - Boost small changes
      const boost = (val: number) => Math.min(1, Math.pow(val, 1 / (sensitivity * 0.5 + 0.1)));
      const emotions = {
        happy: boost(rawEmotions.happy),
        sad: boost(rawEmotions.sad),
        angry: boost(rawEmotions.angry),
        surprised: boost(rawEmotions.surprised),
        neutral: Math.max(0, 1 - boost(1 - rawEmotions.neutral))
      };

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const friction = 0.9 - (emotions.sad * 0.2);
      const ease = 0.1 + (emotions.happy * 0.1);
      const jitter = emotions.angry * 15 * sensitivity;
      const mouseRepulsion = 1 + (emotions.surprised * 5 * sensitivity);
      
      // Pulse effect for surprise
      pulseTime += 0.2;
      const pulseForce = emotions.surprised * Math.sin(pulseTime) * 10 * sensitivity;

      const color = getInterpolatedColor(emotions, palette);
      ctx.fillStyle = color;

      const particles = particlesRef.current;
      const mouse = mouseRef.current;
      const rSq = radius * radius * mouseRepulsion;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        const dx = p.originX - p.x;
        const dy = p.originY - p.y;
        p.vx += dx * ease;
        p.vy += dy * ease;

        if (mouse.active) {
          const mdx = p.x - mouse.x;
          const mdy = p.y - mouse.y;
          const distSq = mdx * mdx + mdy * mdy;
          if (distSq < rSq) {
            const dist = Math.sqrt(distSq);
            const force = (radius - dist) / radius;
            p.vx += (mdx / dist) * force * 20;
            p.vy += (mdy / dist) * force * 20;
          }
        }

        if (jitter > 0) {
          p.vx += (Math.random() - 0.5) * jitter;
          p.vy += (Math.random() - 0.5) * jitter;
        }

        if (pulseForce > 0) {
          const pdx = p.x - canvas.width / 2;
          const pdy = p.y - canvas.height / 2;
          const pdist = Math.sqrt(pdx * pdx + pdy * pdy) || 1;
          p.vx += (pdx / pdist) * pulseForce;
          p.vy += (pdy / pdist) * pulseForce;
        }

        p.vx *= friction;
        p.vy *= friction;
        p.x += p.vx;
        p.y += p.vy;

        // Solid square particles for brutalism
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };
    const onMouseOut = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseout', onMouseOut);
    
    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseout', onMouseOut);
      cancelAnimationFrame(animationFrameId);
    };
  }, [getInterpolatedColor, emotionsRef, sensitivity, palette]);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw', 
        height: '100vh',
        background: 'transparent',
        zIndex: 1,
        pointerEvents: 'none'
      }} 
    />
  );
});

export default MoleculeCanvas;
