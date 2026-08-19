import React from 'react';
import RingGauge from '../../charts/RingGauge.jsx';

export default function OverviewHero({
  search, onSearchChange, globalScore, total, red, orange, green,
  hiddenStatuses, onToggleStatus,
}) {
  return (
    <>
      <div className="hero-glass">
        <div className="hero-title">
          <h1>Tableau de bord des Indicateurs Clés de Performance</h1>
          <div className="sub">Commercial · Technique · Stratégique · Financier</div>
          <div className="search">
            <span>🔎</span>
            <input type="text" placeholder="Rechercher un indicateur…" value={search} onChange={e => onSearchChange(e.target.value)} />
          </div>
        </div>
        <div className="vsep" />
        <div className="hero-score">
          <RingGauge pct={globalScore} color="#7C6FEA" size={78} stroke={8} baseClass="ring-mini">{globalScore}%</RingGauge>
          <div className="lbl">Score global</div>
        </div>
        <div className="hero-stat hero-stat-stack">
          <div className="stack-item">
            <div className="num">{total}</div><div className="lbl">Indicateurs</div>
          </div>
          <div className="stack-item stack-item-sm">
            <div className="num" style={{ color: 'var(--green)' }}>{green}</div><div className="lbl">Atteints</div>
          </div>
        </div>
        <div className="hero-stat"><div className="num" style={{ color: 'var(--red)' }}>{red}</div><div className="lbl">Sous objectif</div></div>
        <div className="hero-stat"><div className="num" style={{ color: '#B5690F' }}>{orange}</div><div className="lbl">En approche</div></div>
      </div>

      <div className="legend-bar">
        <div className={`legend-item ${hiddenStatuses.has('red') ? 'off' : ''}`} onClick={() => onToggleStatus('red')}>
          <span className="dot red" /> Sous objectif (&lt;80%)
        </div>
        <div className={`legend-item ${hiddenStatuses.has('orange') ? 'off' : ''}`} onClick={() => onToggleStatus('orange')}>
          <span className="dot orange" /> En approche (80–100%)
        </div>
        <div className={`legend-item ${hiddenStatuses.has('green') ? 'off' : ''}`} onClick={() => onToggleStatus('green')}>
          <span className="dot green" /> Atteint (≥100%)
        </div>
      </div>
    </>
  );
}
