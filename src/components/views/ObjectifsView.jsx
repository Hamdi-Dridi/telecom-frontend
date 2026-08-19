import React, { useState } from 'react';
import { useKpiData } from '../../context/KpiDataContext.jsx';
import { useAppState } from '../../context/AppStateContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import ObjectifsRow from './objectifs/ObjectifsRow.jsx';
import GestionIndicateursModal from './objectifs/GestionIndicateursModal.jsx';

export default function ObjectifsView() {
  const { results, resultsLoading } = useKpiData();
  const { periods, periodIndex, region } = useAppState();
  const { isAdmin } = useAuth();
  const [mgmtOpen, setMgmtOpen] = useState(false);

  return (
    <div className="view active">
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h3>Objectifs par indicateur</h3>
            <div className="hint">
              Poids, objectif, réalisation, commentaire et validation sont modifiables directement dans le tableau —
              le taux de réalisation et le score se recalculent automatiquement (côté serveur).
            </div>
          </div>
          {isAdmin && (
            <button className="btn btn-ghost" style={{ whiteSpace: 'nowrap' }} onClick={() => setMgmtOpen(true)}>
              🗂️ Gestion des indicateurs
            </button>
          )}
        </div>
        <div className="hint" style={{ marginTop: 4 }}>{periods[periodIndex]} · {region}</div>

        {resultsLoading && results.length === 0 ? (
          <div className="hint" style={{ marginTop: 16 }}>Chargement…</div>
        ) : (
          <div className="table-scroll">
            <table className="obj-table wide-table">
              <thead>
                <tr>
                  <th>Domaine</th><th>Indicateur</th><th>Poids</th><th>Objectif</th><th>Réalisation</th>
                  <th>Taux Réalisation</th><th>Score</th><th>Statut</th><th>Commentaire</th><th>Validation</th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => <ObjectifsRow key={r.id} result={r} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <GestionIndicateursModal open={mgmtOpen} onClose={() => setMgmtOpen(false)} />
    </div>
  );
}
