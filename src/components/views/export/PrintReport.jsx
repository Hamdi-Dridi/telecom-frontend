import React from 'react';
import { createPortal } from 'react-dom';
import { useKpiData } from '../../../context/KpiDataContext.jsx';
import { useAppState } from '../../../context/AppStateContext.jsx';
import logo from '../../../assets/logo.png';

const KNOWN_DOMAINS_ORDER = ['Commercial', 'Technique', 'Stratégique', 'Financier'];

export default function PrintReport() {
  const { overview } = useKpiData();
  const { periods, periodIndex, region } = useAppState();

  const now = new Date();
  const genDate = now.toLocaleDateString('fr-FR') + ' à ' + now.toLocaleTimeString('fr-FR');

  if (!overview) return null;

  const rows = overview.kpis || [];
  const { total, red, orange, green, global_score } = overview.stats;
  const validation = overview.validation || { validated: 0, total: 0 };

  // Known domains first (for a consistent report layout), then any others
  // present in the data — a hardcoded 4-domain list would silently drop
  // indicators filed under a domain someone typed in manually.
  const domainsInData = [...new Set(rows.map(r => r.domain))];
  const domainOrder = [
    ...KNOWN_DOMAINS_ORDER.filter(d => domainsInData.includes(d)),
    ...domainsInData.filter(d => !KNOWN_DOMAINS_ORDER.includes(d)).sort(),
  ];

  // Rendered via a portal straight onto <body>, as a SIBLING of .shell —
  // not a descendant. The print stylesheet hides .shell entirely
  // (display:none) and shows only #printReport; a hidden ancestor hides
  // all descendants regardless of their own display value, so nesting
  // this inside .shell (as it was before) meant the printed page/PDF
  // came out completely blank no matter what CSS was applied to it.
  return createPortal(
    <div id="printReport">
      <div className="pr-confidential">Usage interne — Confidentiel</div>
      <div className="pr-cover">
        <div className="pr-brand">
          <img className="pr-mark" src={logo} alt="" style={{ width: 30, height: 30, objectFit: 'contain' }} />
          <div className="pr-brand-text">
            <div className="n1">Telecom Performance Analytics</div>
            <div className="n2">Rapport de performance</div>
          </div>
        </div>
        <div className="pr-meta">
          <div>Généré le <b>{genDate}</b></div>
          <div>Période : <b>{periods[periodIndex]}</b></div>
          <div>Région : <b>{region}</b></div>
        </div>
      </div>

      <div className="pr-title">
        <h1>Rapport des indicateurs clés de performance</h1>
        <div className="sub">{domainOrder.join(' · ')}</div>
      </div>

      <div className="pr-summary">
        <div className="pr-sum-card score"><div className="lbl">Score global</div><div className="val">{global_score}%</div></div>
        <div className="pr-sum-card"><div className="lbl">Indicateurs</div><div className="val">{total}</div></div>
        <div className="pr-sum-card green"><div className="lbl">Atteints</div><div className="val">{green}</div></div>
        <div className="pr-sum-card orange"><div className="lbl">En approche</div><div className="val">{orange}</div></div>
        <div className="pr-sum-card red"><div className="lbl">Sous objectif</div><div className="val">{red}</div></div>
        <div className="pr-sum-card"><div className="lbl">Validés</div><div className="val">{validation.validated}/{validation.total}</div></div>
      </div>

      {domainOrder.map(domainName => {
        const domainRows = rows.filter(r => r.domain === domainName);
        if (domainRows.length === 0) return null;
        return (
          <div className="pr-domain" key={domainName}>
            <div className="pr-domain-head">
              <h2>{domainName}</h2>
              <span className="cnt">{domainRows.length} indicateurs</span>
            </div>
            <table className="pr-table">
              <thead>
                <tr><th>Sous-groupe</th><th>Indicateur</th><th>Réalisation</th><th>Objectif</th><th>Taux</th><th>Statut</th></tr>
              </thead>
              <tbody>
                {domainRows.map(r => (
                  <tr key={r.kpi_id}>
                    <td>{r.group}</td>
                    <td>{r.name}</td>
                    <td className="num">{r.realisation.toFixed(1)}</td>
                    <td className="num">{r.objectif.toFixed(0)}</td>
                    <td className="num">{r.taux.toFixed(1)}%</td>
                    <td><span className={`pr-status ${r.statut}`}>{r.statut_label}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      <div className="pr-pagefoot">
        <div>Telecom Performance Analytics — Usage interne</div>
        <div>{genDate}</div>
      </div>
    </div>,
    document.body
  );
}
