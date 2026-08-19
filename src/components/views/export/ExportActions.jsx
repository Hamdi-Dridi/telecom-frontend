import React, { useState } from 'react';
import { useKpiData } from '../../../context/KpiDataContext.jsx';
import { useAppState } from '../../../context/AppStateContext.jsx';
import { kpiApi } from '../../../api/kpi.js';
import { api } from '../../../api/client.js';
import { downloadBlob, rowsToCSV } from '../../../utils/exportUtils.js';
import { downloadXlsx, xlsxSupported } from '../../../utils/xlsxLite.js';

function filenameFromDisposition(res, fallback) {
  const header = res.headers.get('content-disposition') || '';
  const match = header.match(/filename="?([^"]+)"?/);
  return match ? match[1] : fallback;
}

export default function ExportActions({ onPrint }) {
  const { results } = useKpiData();
  const { periods, periodIndex, currentPeriodId, region } = useAppState();
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  async function handleExportCSV() {
    setError(''); setBusy('csv');
    try {
      const res = await api.getRaw(kpiApi.exportCsvUrl(currentPeriodId, region));
      const blob = await res.blob();
      downloadBlob(blob, filenameFromDisposition(res, 'objectifs.csv'), 'text/csv;charset=utf-8;');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  }

  async function handleExportJSON() {
    setError(''); setBusy('json');
    try {
      const res = await api.getRaw(kpiApi.exportJsonUrl(currentPeriodId, region));
      const blob = await res.blob();
      downloadBlob(blob, filenameFromDisposition(res, 'objectifs.json'), 'application/json');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  }

  function handleTemplate() {
    const rows = results.map(r => ({
      Domaine: r.domain, 'Sous-groupe': r.sub, Indicateur: r.name,
      Réalisation: r.realisation, 'Objectif (%)': r.objectif,
    }));
    if (xlsxSupported()) {
      downloadXlsx(rows, 'modele_import_indicateurs.xlsx', 'Modèle');
    } else {
      downloadBlob(rowsToCSV(rows), 'modele_import_indicateurs.csv', 'text/csv;charset=utf-8;');
    }
  }

  return (
    <div className="card">
      <h3>Exporter les données</h3>
      <div className="hint">{periods[periodIndex]} · {region} · {results.length} indicateurs actifs</div>
      {error && <div className="auth-error show" style={{ marginTop: 10 }}>{error}</div>}
      <div className="mgmt-actions" style={{ marginTop: 16, flexWrap: 'wrap', gap: 10 }}>
        <button className="btn btn-primary" onClick={handleExportCSV} disabled={busy === 'csv'}>
          {busy === 'csv' ? '…' : '⬇️ Export CSV'}
        </button>
        <button className="btn btn-ghost" onClick={handleExportJSON} disabled={busy === 'json'}>
          {busy === 'json' ? '…' : '⬇️ Export JSON'}
        </button>
        <button className="btn btn-ghost" onClick={onPrint}>🖨️ Rapport PDF</button>
        <button className="btn btn-ghost" onClick={handleTemplate}>📄 Modèle Excel (import)</button>
      </div>
    </div>
  );
}
