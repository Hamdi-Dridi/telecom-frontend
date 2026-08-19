import React, { useEffect, useState } from 'react';
import LineChart from '../charts/LineChart.jsx';
import { kpiApi } from '../../api/kpi.js';
import { useAppState } from '../../context/AppStateContext.jsx';

const DOMAINS_ORDER = ['Commercial', 'Technique', 'Stratégique', 'Financier'];

export default function HistoriqueView() {
  const { region } = useAppState();
  const [mode, setMode] = useState('monthly'); // 'monthly' | 'yearly'
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const isYearly = mode === 'yearly';

  useEffect(() => {
    if (!region) return;
    let cancelled = false;
    (async () => {
      try {
        setError('');
        const result = await kpiApi.history(region, mode);
        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled) setError(e.message || "Impossible de charger l'historique.");
      }
    })();
    return () => { cancelled = true; };
  }, [region, mode]);

  return (
    <div className="view active">
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h3>Évolution du score régional</h3>
            <div className="hint">
              {isYearly ? 'Score moyen par année, toutes années confondues.' : 'Tendance mensuelle, tous les mois enregistrés.'}
            </div>
          </div>
          <div className="mgmt-tabs">
            <button className={mode === 'monthly' ? 'active' : ''} onClick={() => setMode('monthly')}>Par mois</button>
            <button className={mode === 'yearly' ? 'active' : ''} onClick={() => setMode('yearly')}>Toutes les années</button>
          </div>
        </div>
        {error && <div className="auth-error show">{error}</div>}
        {data && <LineChart labels={data.score_series.labels} values={data.score_series.values} w={700} h={220} color="#7C6FEA" />}
      </div>

      <div className="card">
        <h3>Tendance par domaine</h3>
        <div className="hint">
          {isYearly ? 'Moyenne annuelle des indicateurs de chaque domaine.' : 'Moyenne des indicateurs de chaque domaine, mois par mois.'}
        </div>
        {data && (
          <div className="hist-grid">
            {DOMAINS_ORDER.filter(d => data.domain_series[d]).map(domainName => {
              const series = data.domain_series[domainName];
              const last = series.values[series.values.length - 1] ?? 0;
              return (
                <div className="hist-mini" key={domainName}>
                  <div className="lbl">{domainName} — {isYearly ? 'moyenne' : 'dernier point'} {last.toFixed(1)}%</div>
                  <LineChart labels={series.labels} values={series.values} w={320} h={150} color="#2FD3C4" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
