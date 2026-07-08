import React, { useRef, useState } from 'react';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string; // Optional custom color like 'rgba(6, 182, 212, 0.15)'
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({ 
  children, 
  className = '', 
  glowColor = 'rgba(99, 102, 241, 0.15)' 
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isFocused, setIsFocused] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsFocused(true)}
      onMouseLeave={() => setIsFocused(false)}
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] dark:bg-white/[0.02] light:bg-black/[0.01] backdrop-blur-md p-6 transition-all duration-300 hover:border-white/20 ${className}`}
    >
      {isFocused && (
        <div
          className="pointer-events-none absolute -inset-px transition duration-300"
          style={{
            background: `radial-gradient(350px circle at ${coords.x}px ${coords.y}px, ${glowColor}, transparent 80%)`,
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
