'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SentimentSparklineProps {
  data: { date: string; score: number }[];
  width?: number;
  height?: number;
  className?: string;
}

export function SentimentSparkline({ data, width = 80, height = 24, className }: SentimentSparklineProps) {
  if (data.length < 2) return null;

  const scores = data.map((d) => d.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;
  const trend = scores[scores.length - 1] - scores[0];

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.score - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  const strokeColor = trend > 5 ? '#22C55E' : trend < -5 ? '#EF4444' : '#D97706';

  return (
    <svg
      width={width}
      height={height}
      className={cn('inline-block', className)}
      viewBox={`0 0 ${width} ${height}`}
    >
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      {data.length > 0 && (
        <circle
          cx={(data.length - 1) / (data.length - 1) * width}
          cy={height - ((scores[scores.length - 1] - min) / range) * (height - 4) - 2}
          r={2}
          fill={strokeColor}
        />
      )}
    </svg>
  );
}
