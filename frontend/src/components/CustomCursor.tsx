import React, { useEffect, useState } from 'react';

export const CustomCursor: React.FC = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [trail, setTrail] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setHidden(false);
    };

    const handleMouseLeave = () => {
      setHidden(true);
    };

    const handleMouseEnter = () => {
      setHidden(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, []);

  // Smooth trail interpolation
  useEffect(() => {
    let animFrameId: number;
    const updateTrail = () => {
      setTrail((prev) => {
        const dx = position.x - prev.x;
        const dy = position.y - prev.y;
        // Ease speed factor (0.15 for smooth lag)
        return {
          x: prev.x + dx * 0.15,
          y: prev.y + dy * 0.15,
        };
      });
      animFrameId = requestAnimationFrame(updateTrail);
    };
    animFrameId = requestAnimationFrame(updateTrail);
    return () => cancelAnimationFrame(animFrameId);
  }, [position]);

  // Hook hover states on clickable elements
  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isClickable = 
        target.tagName === 'BUTTON' || 
        target.tagName === 'A' || 
        target.closest('a') || 
        target.closest('button') || 
        target.classList.contains('clickable');
      
      setHovered(!!isClickable);
    };

    window.addEventListener('mouseover', handleMouseOver);
    return () => window.removeEventListener('mouseover', handleMouseOver);
  }, []);

  useEffect(() => {
    // Add custom cursor class to document body to hide native cursor
    if (!hidden) {
      document.body.classList.add('custom-cursor-enabled');
    } else {
      document.body.classList.remove('custom-cursor-enabled');
    }
    return () => document.body.classList.remove('custom-cursor-enabled');
  }, [hidden]);

  if (hidden) return null;

  return (
    <>
      {/* Central dot */}
      <div
        className="fixed top-0 left-0 w-2 h-2 bg-primary rounded-full pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 transition-transform duration-100 ease-out"
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
      />
      {/* Trailing Outer Ring */}
      <div
        className={`fixed top-0 left-0 w-8 h-8 border border-secondary rounded-full pointer-events-none z-[9998] -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
          hovered ? 'scale-150 bg-secondary/10 border-primary' : 'scale-100'
        }`}
        style={{ left: `${trail.x}px`, top: `${trail.y}px` }}
      />
    </>
  );
};
