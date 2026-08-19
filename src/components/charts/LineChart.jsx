import React from 'react';

export default function LineChart({ labels, values, w = 700, h = 220, color = '#7C6FEA', suffix = '%' }) {
  if (!values || values.length === 0) return null;
  const padL = 34, padR = 14, padT = 14, padB = 26;
  const innerW = w - padL - padR, innerH = h - padT - padB;
  const rawMin = Math.min(...values), rawMax = Math.max(...values);
  const range = (rawMax - rawMin) || 1;
  const niceMin = Math.max(0, Math.floor(rawMin - range * 0.15));
  const niceMax = Math.ceil(rawMax + range * 0.15);
  const span = (niceMax - niceMin) || 1;

  const pts = values.map((v, i) => {
    const x = padL + (values.length === 1 ? innerW / 2 : (i / (values.length - 1)) * innerW);
    const y = padT + innerH - ((v - niceMin) / span) * innerH;
    return [x, y];
  });
  const line = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const area = `${line} L ${pts[pts.length - 1][0].toFixed(1)},${(padT + innerH).toFixed(1)} L ${pts[0][0].toFixed(1)},${(padT + innerH).toFixed(1)} Z`;

  const ticks = 4;
  const gridLines = [];
  for (let t = 0; t <= ticks; t++) {
    const val = niceMin + (span * t / ticks);
    const y = padT + innerH - (t / ticks) * innerH;
    gridLines.push(
      <line key={`g${t}`} x1={padL} y1={y.toFixed(1)} x2={w - padR} y2={y.toFixed(1)} stroke="var(--line)" strokeWidth="1" />
    );
    gridLines.push(
      <text key={`t${t}`} x={(padL - 6).toFixed(1)} y={(y + 3).toFixed(1)} textAnchor="end" fontSize="9" fill="#9A9EB5" fontFamily="'IBM Plex Mono',monospace">
        {Math.round(val)}
      </text>
    );
  }

  const maxLabels = 9;
  const step = Math.max(1, Math.ceil(labels.length / maxLabels));
  const xLabels = labels.map((lb, i) => {
    if (i % step !== 0 && i !== labels.length - 1) return null;
    return (
      <text key={`x${i}`} x={pts[i][0].toFixed(1)} y={h - 8} textAnchor="middle" fontSize="9" fill="#9A9EB5">{lb}</text>
    );
  });

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: h }}>
      {gridLines}
      <path d={area} fill={color} opacity="0.10" />
      <path d={line} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={`d${i}`} cx={p[0].toFixed(1)} cy={p[1].toFixed(1)} r="3.4" fill={color}>
          <title>{labels[i]} : {values[i].toFixed(1)}{suffix}</title>
        </circle>
      ))}
      {xLabels}
    </svg>
  );
}
