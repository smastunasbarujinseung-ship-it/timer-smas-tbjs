import React, { useEffect, useState } from 'react';

interface FlagParticle {
  id: number;
  leftPercent: number;
  bottomPercent: number;
  scale: number;
  rotationDeg: number;
  durationSec: number;
  delaySec: number;
  driftX: number;
}

interface FlagCelebrationProps {
  active: boolean;
  onComplete?: () => void;
}

export const FlagCelebration: React.FC<FlagCelebrationProps> = ({ active, onComplete }) => {
  const [particles, setParticles] = useState<FlagParticle[]>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    // Generate 12 elegant ceremonial Indonesian flags distributed across the bottom width
    const generated: FlagParticle[] = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      leftPercent: 6 + (i * 8.2) + (Math.random() * 4 - 2),
      bottomPercent: -15 - Math.random() * 10,
      scale: 0.85 + Math.random() * 0.5,
      rotationDeg: -12 + Math.random() * 24,
      durationSec: 3.6 + Math.random() * 1.2,
      delaySec: Math.random() * 0.7,
      driftX: -30 + Math.random() * 60,
    }));

    setParticles(generated);

    const timer = setTimeout(() => {
      setParticles([]);
      if (onComplete) onComplete();
    }, 5200);

    return () => clearTimeout(timer);
  }, [active, onComplete]);

  if (!active || particles.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
      aria-hidden="true"
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute transform-gpu animate-float-flag opacity-0"
          style={{
            left: `${p.leftPercent}%`,
            bottom: `${p.bottomPercent}%`,
            animationDuration: `${p.durationSec}s`,
            animationDelay: `${p.delaySec}s`,
            animationTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)',
            transform: `scale(${p.scale}) rotate(${p.rotationDeg}deg)`,
          }}
        >
          {/* Realistic Indonesian Flag SVG with golden flagpole and silk wave shading */}
          <div className="relative shadow-xl rounded-sm filter drop-shadow-md">
            <svg
              width="135"
              height="90"
              viewBox="0 0 135 90"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="overflow-visible"
            >
              <defs>
                {/* Cloth Wave Light/Shadow Gradient */}
                <linearGradient id={`clothGradient-${p.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#000" stopOpacity="0.12" />
                  <stop offset="25%" stopColor="#fff" stopOpacity="0.22" />
                  <stop offset="50%" stopColor="#000" stopOpacity="0.15" />
                  <stop offset="75%" stopColor="#fff" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#000" stopOpacity="0.1" />
                </linearGradient>

                {/* Golden Flagpole Gradient */}
                <linearGradient id={`goldPole-${p.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#B38728" />
                  <stop offset="50%" stopColor="#FBF5B7" />
                  <stop offset="100%" stopColor="#AA771C" />
                </linearGradient>

                <filter id={`shadow-${p.id}`} x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.18" />
                </filter>
              </defs>

              {/* Gold Pole / Mast */}
              <rect x="0" y="-8" width="4" height="106" rx="2" fill={`url(#goldPole-${p.id})`} />
              {/* Gold Spearhead Finial at top */}
              <polygon points="2,-14 6,-8 -2,-8" fill={`url(#goldPole-${p.id})`} />

              {/* Flag Cloth (2:3 Standard Ratio, 120 x 80) */}
              <g filter={`url(#shadow-${p.id})`}>
                {/* Red Top Half: Pantone Red 032 C (#E70011) */}
                <rect x="4" y="0" width="120" height="40" fill="#E70011" rx="1" />
                {/* White Bottom Half: Pure Clean White (#FFFFFF) with subtle border */}
                <rect x="4" y="40" width="120" height="40" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="0.5" rx="1" />

                {/* Silk Wave Shading Overlay */}
                <rect
                  x="4"
                  y="0"
                  width="120"
                  height="80"
                  fill={`url(#clothGradient-${p.id})`}
                  style={{ mixBlendMode: 'multiply' }}
                />

                {/* Gold fringe at the hoist attachment */}
                <circle cx="2" cy="6" r="1.5" fill="#F59E0B" />
                <circle cx="2" cy="74" r="1.5" fill="#F59E0B" />
              </g>
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
};
