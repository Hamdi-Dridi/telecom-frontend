import React from 'react';
import { useAppState } from '../../../context/AppStateContext.jsx';

export default function MonthlyTable({ rows }) {
  const { periods, periodIndex, region } = useAppState();

  return (
    <div className="card">
      <h3>Tableau mensuel des indicateurs</h3>
      <div className="hint">{periods[periodIndex]} · {region}</div>
      <div className="table-scroll">
        <table className="obj-table">
          <thead>
            <tr><th>Domaine</th><th>Indicateur</th><th>Réalisation</th><th>Objectif</th><th>Taux</th><th>Statut</th></tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.kpi_id}>
                <td>{r.domain}</td>
                <td>{r.name}</td>
                <td className="mono">{r.realisation}%</td>
                <td className="mono">{r.objectif}%</td>
                <td className="mono" style={{ fontWeight: 700 }}>{r.taux}%</td>
                <td><span className={`status-tag ${r.statut}`}>{r.statut_label}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
