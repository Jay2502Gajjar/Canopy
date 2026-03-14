'use client';

import React, { useEffect, useRef, useState } from 'react';

interface FadeInOnScrollProps {
  children: React.ReactNode;
  className?: string;
  delay?: number; // stagger delay in ms
  direction?: 'up' | 'left' | 'right';
  once?: boolean; // only animate once (default true)
}

export function FadeInOnScroll({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  once = true,
}: FadeInOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  const translateMap = {
    up: 'translateY(32px)',
    left: 'translateX(-32px)',
    right: 'translateX(32px)',
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translate(0)' : translateMap[direction],
        transition: `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
}

/**
 * A container that staggers its children with fade-in-from-bottom.
 * Wrap a grid or flex container with this and each direct child gets delayed.
 */
export function StaggerContainer({
  children,
  className = '',
  staggerMs = 80,
  direction = 'up' as 'up' | 'left' | 'right',
}: {
  children: React.ReactNode;
  className?: string;
  staggerMs?: number;
  direction?: 'up' | 'left' | 'right';
}) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, i) => (
        <FadeInOnScroll delay={i * staggerMs} direction={direction}>
          {child}
        </FadeInOnScroll>
      ))}
    </div>
  );
}
