'use client';

import React, { useState, useEffect } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number; // ms per character (optional, auto-calculated if omitted)
  delay?: number; // start delay in ms
  cursor?: boolean;
  className?: string;
  cursorClassName?: string;
  onComplete?: () => void;
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'p' | 'div';
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed,
  delay = 0,
  cursor = true,
  className = '',
  cursorClassName = 'w-1.5 h-3 bg-accent-cyan',
  onComplete,
  as: Component = 'span',
}) => {
  const [displayedCount, setDisplayedCount] = useState(0);
  const [isTyping, setIsTyping] = useState(true);

  // Auto-calculate speed so longer paragraphs don't take forever but still feel cinematic
  const charSpeed =
    speed ?? Math.max(5, Math.min(18, Math.floor(1000 / (text?.length || 1))));

  useEffect(() => {
    if (!text) {
      setDisplayedCount(0);
      setIsTyping(false);
      return;
    }

    setDisplayedCount(0);
    setIsTyping(true);

    let count = 0;
    let intervalId: NodeJS.Timeout | null = null;

    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        count += 1;
        setDisplayedCount(count);
        if (count >= text.length) {
          if (intervalId) clearInterval(intervalId);
          setIsTyping(false);
          onComplete?.();
        }
      }, charSpeed);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, charSpeed, delay, onComplete]);

  const displayedText = text ? text.slice(0, displayedCount) : '';

  const handleInstantComplete = () => {
    if (isTyping && text) {
      setDisplayedCount(text.length);
      setIsTyping(false);
      onComplete?.();
    }
  };

  return (
    <Component className={className} onClick={handleInstantComplete}>
      {displayedText}
      {cursor && isTyping && (
        <span
          className={`inline-block ml-0.5 align-middle animate-pulse ${cursorClassName}`}
          aria-hidden="true"
        />
      )}
    </Component>
  );
};
