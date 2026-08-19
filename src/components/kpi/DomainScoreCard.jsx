import React from 'react';
import RingGauge from '../charts/RingGauge.jsx';
import { STATUS_HEX } from './KpiCard.jsx';

const DEFAULT_THRESHOLD = { greenMin: 100, orangeMin: 80 };

/** entry: {domain, avg, count} from overview.domain_scores (API). */
export default function DomainScoreCard({ entry }) {
  const { domain, avg, count } = entry;
  let statut = 'green';
  if (avg < 100 * (DEFAULT_THRESHOLD.orangeMin / 100)) statut = 'red';
  else if (avg < 100 * (DEFAULT_THRESHOLD.greenMin / 100)) statut = 'orange';
  const color = STATUS_HEX[statut];

  return (
    <div className="domain-score-card">
      <RingGauge pct={Math.min(avg, 100)} color={color} size={64} stroke={7} baseClass="ds-ring">{avg}%</RingGauge>
      <div className="ds-name">{domain}</div>
      <div className="ds-count">{count} indicateurs</div>
    </div>
  );
}
