import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

export const SpiderBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const numParticles = Math.min(Math.floor((width * height) / 14000), 65);
    const particles: Particle[] = [];

    const colors = [
      'rgba(220, 38, 38, 0.65)',  // Vibrant Red
      'rgba(37, 99, 235, 0.65)',  // Deep Blue
      'rgba(99, 102, 241, 0.55)', // Indigo
      'rgba(239, 68, 68, 0.6)'    // Bright Red
    ];

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        radius: Math.random() * 2.5 + 1.5,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    let angle = 0;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      angle += 0.001;

      // 1. DRAW RADIAL WEB PATTERN IN BACKGROUND
      const maxRadius = Math.max(width, height) * 0.7;
      const numRings = 7;
      const numSpokes = 12;

      ctx.save();
      ctx.translate(centerX, centerY);

      // Draw web spokes (radial lines)
      ctx.lineWidth = 0.9;
      for (let i = 0; i < numSpokes; i++) {
        const rad = (i * (Math.PI * 2) / numSpokes) + angle;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(rad) * maxRadius, Math.sin(rad) * maxRadius);
        ctx.strokeStyle = i % 2 === 0 ? 'rgba(220, 38, 38, 0.10)' : 'rgba(37, 99, 235, 0.10)';
        ctx.stroke();
      }

      // Draw concentric web polygon rings
      for (let r = 1; r <= numRings; r++) {
        const ringRadius = (maxRadius / numRings) * r;
        ctx.beginPath();
        for (let i = 0; i <= numSpokes; i++) {
          const rad = (i * (Math.PI * 2) / numSpokes) + angle;
          const x = Math.cos(rad) * ringRadius;
          const y = Math.sin(rad) * ringRadius;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = r % 2 === 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(59, 130, 246, 0.12)';
        ctx.lineWidth = 1.0;
        ctx.stroke();
      }

      ctx.restore();

      // 2. DRAW DYNAMIC NETWORK PARTICLES & WEBS
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        // Connect nearby nodes to form web grid
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            const alpha = (1 - dist / 150) * 0.35;
            ctx.strokeStyle = (i + j) % 2 === 0 
              ? `rgba(220, 38, 38, ${alpha})` 
              : `rgba(37, 99, 235, ${alpha})`;
            ctx.lineWidth = 1.0;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-90"
    />
  );
};
