import React, { useEffect, useState } from 'react';
import LineChart from '../../charts/LineChart.jsx';
import { kpiApi } from '../../../api/kpi.js';
import { useAppState } from '../../../context/AppStateContext.jsx';

function periodShortLabel(label) {
  const abbr = { Janvier: 'Jan', Février: 'Fév', Mars: 'Mar', Avril: 'Avr', Mai: 'Mai', Juin: 'Juin', Juillet: 'Juil', Août: 'Août', Septembre: 'Sept', Octobre: 'Oct', Novembre: 'Nov', Décembre: 'Déc' };
  const [month, year] = label.split(' ');
  return (abbr[month] || month.slice(0, 4)) + ' ' + year.slice(2);
}

export default function RecentTrendCard({ onViewHistory }) {
  const { periods, periodIndex, region } = useAppState();
  const [series, setSeries] = useState(null);

  useEffect(() => {
    if (!region) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await kpiApi.history(region, 'monthly');
        if (cancelled) return;
        const span = Math.min(8, periodIndex + 1);
        const startIdx = Math.max(0, periodIndex - span + 1);
        setSeries({
          labels: data.score_series.labels.slice(startIdx, periodIndex + 1).map(periodShortLabel),
          values: data.score_series.values.slice(startIdx, periodIndex + 1),
        });
      } catch (e) {
        if (!cancelled) setSeries({ labels: [], values: [] });
      }
    })();
    return () => { cancelled = true; };
  }, [region, periodIndex]);

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h3>Évolution du score</h3>
          <div className="hint">{region} · jusqu'à {periods[periodIndex]}</div>
        </div>
        <button className="btn btn-ghost" style={{ whiteSpace: 'nowrap' }} onClick={onViewHistory}>📈 Voir l'historique complet</button>
      </div>
      {series ? <LineChart labels={series.labels} values={series.values} w={1100} h={180} color="#7C6FEA" /> : <div className="hint">Chargement…</div>}
    </div>
  );
}
