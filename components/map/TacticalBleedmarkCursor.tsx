'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface TacticalBleedmarkCursorProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isDotHovered?: boolean;
}

export const TacticalBleedmarkCursor: React.FC<TacticalBleedmarkCursorProps> = ({
  containerRef,
  isDotHovered = false,
}) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isPressed, setIsPressed] = useState(false);
  const [clickKey, setClickKey] = useState(0);
  const [isClickAnimating, setIsClickAnimating] = useState(false);
  const animTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerClickAnimation = useCallback(() => {
    setClickKey((prev) => prev + 1);
    setIsClickAnimating(true);
    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    animTimeoutRef.current = setTimeout(() => {
      setIsClickAnimating(false);
    }, 280);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isInside = false;

    const onPointerMove = (e: PointerEvent) => {
      if (!cursorRef.current || !container) return;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Hide custom cursor when hovering over standard clickable controls (buttons, links, popups)
      const target = e.target as HTMLElement | null;
      const isOverControl = target?.closest('button, a, select, input, [role="button"], .warroom-click-popup');

      if (isOverControl) {
        cursorRef.current.style.opacity = '0';
        return;
      }

      if (!isInside) {
        isInside = true;
      }
      cursorRef.current.style.opacity = '1';
      cursorRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('button, a, select, input, [role="button"], .warroom-click-popup')) {
        return;
      }
      setIsPressed(true);
      triggerClickAnimation();
    };

    const onPointerUp = () => {
      setIsPressed(false);
    };

    const onPointerEnter = () => {
      isInside = true;
      if (cursorRef.current) {
        cursorRef.current.style.opacity = '1';
      }
    };

    const onPointerLeave = () => {
      isInside = false;
      setIsPressed(false);
      if (cursorRef.current) {
        cursorRef.current.style.opacity = '0';
      }
    };

    container.addEventListener('pointermove', onPointerMove, { passive: true });
    container.addEventListener('pointerdown', onPointerDown, { passive: true });
    container.addEventListener('pointerenter', onPointerEnter);
    container.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointerenter', onPointerEnter);
      container.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('pointerup', onPointerUp);
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    };
  }, [containerRef, triggerClickAnimation]);

  return (
    <div
      ref={cursorRef}
      className="absolute top-0 left-0 pointer-events-none z-30 opacity-0 will-change-transform"
      style={{
        transform: 'translate3d(-100px, -100px, 0)',
        transition: 'opacity 0.12s ease-out',
      }}
      aria-hidden="true"
    >
      {/* Centered positioning wrapper */}
      <div className="relative -top-5 -left-5 w-10 h-10 flex items-center justify-center">
        {/* Click Shockwave Ring */}
        {clickKey > 0 && (
          <div
            key={clickKey}
            className="warroom-bleedmark-shockwave"
          />
        )}

        {/* Tactical Crosshair SVG with Square Bleedmark Borders */}
        <svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-10 h-10 select-none overflow-visible"
        >
          <defs>
            <filter id="warroom-bleed-shadow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="#000000" floodOpacity="0.9" />
            </filter>
            <filter id="warroom-bleed-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#ffffff" floodOpacity="0.95" />
            </filter>
          </defs>

          {/* Center White Crosshair Reticle (Fixed Center Point at 20, 20) — Middle One Only */}
          <g
            filter={isPressed || isClickAnimating ? 'url(#warroom-bleed-glow)' : 'url(#warroom-bleed-shadow)'}
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeLinecap="round"
            className={`transition-transform duration-150 ease-out origin-center ${
              isPressed
                ? 'scale-[0.82]'
                : isClickAnimating
                ? 'warroom-anim-click-bleed'
                : 'scale-100'
            }`}
          >
            {/* Horizontal arms with center gap */}
            <line x1="12" y1="20" x2="16.5" y2="20" />
            <line x1="23.5" y1="20" x2="28" y2="20" />
            {/* Vertical arms with center gap */}
            <line x1="20" y1="12" x2="20" y2="16.5" />
            <line x1="20" y1="23.5" x2="20" y2="28" />
            {/* Center targeting pip */}
            <circle
              cx="20"
              cy="20"
              r="1.25"
              fill={isDotHovered ? '#00f0ff' : '#ffffff'}
              stroke="none"
            />
          </g>
        </svg>
      </div>
    </div>
  );
};
