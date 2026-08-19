import React, { useEffect, useState } from 'react';
import Sparkline from '../charts/Sparkline.jsx';
import { kpiApi } from '../../api/kpi.js';
import { unwrapList } from '../../api/client.js';
import { STATUS_HEX, STATUS_LABEL } from './KpiCard.jsx';
import { useAppState } from '../../context/AppStateContext.jsx';

/** row: one entry from overview.kpis — {kpi_id, domain, group, name, weight,
 *  realisation, objectif, taux, score, statut, statut_label, comment, validation}. */
export default function KpiDetailModal({ row, onClose }) {
  const { periods, region } = useAppState();
  const [series, setSeries] = useState(null);

  useEffect(() => {
    if (!row) { setSeries(null); return; }
    let cancelled = false;
    (async () => {
      try {
        // No period filter → every period for this region, so we can chart
        // the trend and compute min/max across the whole history.
        const data = await kpiApi.listResults(null, region, false);
        if (cancelled) return;
        const rows = unwrapList(data).filter(r => r.kpi === row.kpi_id);
        setSeries(rows.map(r => r.realisation));
      } catch (e) {
        if (!cancelled) setSeries([]);
      }
    })();
    return () => { cancelled = true; };
  }, [row, region]);

  if (!row) return null;

  const color = STATUS_HEX[row.statut] || STATUS_HEX.green;
  const statusLabel = STATUS_LABEL[row.statut] || row.statut_label;
  const min = series && series.length ? Math.min(...series) : null;
  const max = series && series.length ? Math.max(...series) : null;

  return (
    <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="path">{row.domain} · {row.group}</div>
        <h3>{row.name}</h3>
        <div className="big-value" style={{ color }}>{row.score}% <span className="big-value-label">Score</span></div>
        {series ? <Sparkline values={series} w={400} h={60} color={color} /> : <div className="hint">Chargement de la tendance…</div>}
        <div className="stat-row"><span>Réalisation</span><span className="mono">{row.realisation}</span></div>
        <div className="stat-row"><span>Objectif</span><span className="mono">{row.objectif}</span></div>
        <div className="stat-row"><span>Taux de réalisation</span><span className="mono">{row.taux}%</span></div>
        <div className="stat-row"><span>Poids</span><span className="mono">{row.weight}%</span></div>
        <div className="stat-row"><span>Score (Poids × Taux)</span><span className="mono" style={{ color, fontWeight: 700 }}>{row.score}%</span></div>
        <div className="stat-row"><span>Statut</span><span className={`badge ${row.statut}`}>{statusLabel}</span></div>
        {min != null && <div className="stat-row"><span>Min (période)</span><span className="mono">{min}</span></div>}
        {max != null && <div className="stat-row"><span>Max (période)</span><span className="mono">{max}</span></div>}
      </div>
    </div>
  );
}
