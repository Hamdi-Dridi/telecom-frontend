import React from 'react';
import RingGauge from '../charts/RingGauge.jsx';

const STATUS_HEX = { red: '#EF5A6F', orange: '#F7A94A', green: '#2FC299' };
const STATUS_LABEL = { red: 'Sous obj.', orange: 'Approche', green: 'Atteint' };

/** row: {id/kpiId, name, domain, sub, weight, realisation, objectif, taux,
 *  score, statut} — already fully computed server-side by the Django API. */
export default function KpiCard({ row, onOpen, hidden = false }) {
  const fillPct = row.taux; // Score / Poids simplifies exactly to Taux
  const color = STATUS_HEX[row.statut] || STATUS_HEX.green;

  return (
    <div className={`kpi-card ${hidden ? 'hidden' : ''}`} onClick={() => onOpen(row.kpiId ?? row.id)}>
      <div className="kpi-head">
        <div className="kpi-name">{row.name}</div>
        <RingGauge pct={Math.min(fillPct, 100)} color={color} size={40} stroke={5}>{Math.round(fillPct)}%</RingGauge>
      </div>
      <div className="kpi-foot">
        <div className={`status-tag ${row.statut}`}>{STATUS_LABEL[row.statut] || row.statut}</div>
      </div>
      <div className="kpi-progress">
        <div className="kpi-progress-fill" style={{ width: `${Math.min(fillPct, 100)}%`, background: color }} />
      </div>
    </div>
  );
}

export { STATUS_HEX, STATUS_LABEL };
