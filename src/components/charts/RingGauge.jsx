import React from 'react';

/** Circular progress ring. pct is clamped 0-100 for the arc fill.
 *  baseClass picks which CSS variant to use: 'ring-icon' (KPI cards, 40px),
 *  'ds-ring' (domain score cards, 64px), or 'ring-mini' (hero score, 78px). */
export default function RingGauge({ pct, color = '#7C6FEA', size = 40, stroke = 5, baseClass = 'ring-icon', children }) {
  const clamped = Math.max(0, Math.min(pct, 100));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamped / 100);
  const center = size / 2;

  return (
    <div className={baseClass} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
        <circle cx={center} cy={center} r={r} fill="none" stroke="rgba(154,158,181,0.2)" strokeWidth={stroke} />
        <circle
          cx={center} cy={center} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
        />
      </svg>
      <div className="ctr">{children}</div>
    </div>
  );
}
