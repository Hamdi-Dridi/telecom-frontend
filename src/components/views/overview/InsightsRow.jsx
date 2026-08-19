import React from 'react';
import { STATUS_HEX } from '../../kpi/KpiCard.jsx';

function timeAgo(isoString) {
  const s = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (s < 60) return "à l'instant";
  const m = Math.floor(s / 60); if (m < 60) return m + ' min';
  const h = Math.floor(m / 60); if (h < 24) return h + ' h';
  const d = Math.floor(h / 24); return d + ' j';
}

function ValidationStatusCard({ validation }) {
  const { validated, pending, total } = validation;
  const pct = total > 0 ? Math.round((validated / total) * 100) : 0;
  return (
    <div className="card insight-card">
      <h3>Statut de validation</h3>
      {total > 0 ? (
        <>
          <div className="validation-bar"><div className="validation-fill" style={{ width: `${pct}%` }} /></div>
          <div className="validation-legend">
            <span><span className="dot green" />{validated} validé(s)</span>
            <span><span className="dot orange" />{pending} en attente</span>
          </div>
        </>
      ) : <div className="hint">Aucun indicateur actif ce mois-ci.</div>}
    </div>
  );
}

function TopBottomCard({ top, bottom }) {
  const Row = ({ item }) => (
    <div className="rank-row">
      <div className="rank-name">{item.name}<span className="rank-domain">{item.domain}</span></div>
      <div className="rank-val" style={{ color: STATUS_HEX[item.statut] }}>{Math.round(item.taux)}%</div>
    </div>
  );
  return (
    <>
      <div className="card insight-card">
        <h3>🏆 Top performing KPIs</h3>
        {top.length ? top.map(item => <Row key={item.kpi_id} item={item} />) : <div className="hint">Aucune donnée.</div>}
      </div>
      <div className="card insight-card">
        <h3>⚠️ Lowest performing KPIs</h3>
        {bottom.length ? bottom.map(item => <Row key={item.kpi_id} item={item} />) : <div className="hint">Aucune donnée.</div>}
      </div>
    </>
  );
}

function RecentUpdatesCard({ activity }) {
  const items = activity.slice(0, 6);
  return (
    <div className="card insight-card">
      <h3>🕓 Dernières mises à jour</h3>
      {items.length ? items.map(a => (
        <div className="activity-row" key={a.id}>
          <span className="activity-text">{a.text}</span>
          <span className="activity-time">{timeAgo(a.created_at)}</span>
        </div>
      )) : <div className="hint">Aucune activité récente.</div>}
    </div>
  );
}

export default function InsightsRow({ overview }) {
  return (
    <div className="insights-grid">
      <ValidationStatusCard validation={overview.validation} />
      <TopBottomCard top={overview.top_performing} bottom={overview.lowest_performing} />
      <RecentUpdatesCard activity={overview.recent_activity} />
    </div>
  );
}
