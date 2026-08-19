import React, { useRef, useState } from 'react';
import { useKpiData } from '../../../context/KpiDataContext.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { rowsToCSV } from '../../../utils/exportUtils.js';
import { readXlsx, xlsxSupported } from '../../../utils/xlsxLite.js';

export default function ImportPanel() {
  const { importFile } = useKpiData();
  const { currentUser } = useAuth();
  const canImport = currentUser?.role === 'admin' || currentUser?.role === 'manager';
  const fileRef = useRef(null);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(''); setSummary(null);

    const isLegacyXls = /\.xls$/i.test(file.name);
    const isXlsx = /\.xlsx$/i.test(file.name);
    if (isLegacyXls) {
      setError("Le format .xls (Excel 97-2003) n'est pas supporté — merci de ré-enregistrer le fichier au format .xlsx ou .csv.");
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    setBusy(true);
    try {
      let fileToSend = file;
      if (isXlsx) {
        // The Django backend only parses CSV — read the workbook here in
        // the browser (xlsxLite) and convert it to CSV client-side before
        // sending, so .xlsx uploads still reach /api/import/ and land in
        // the database exactly like a native CSV import would.
        if (!xlsxSupported()) {
          throw new Error('Votre navigateur ne supporte pas la lecture de fichiers Excel en local. Utilisez un fichier CSV, ou un navigateur à jour (Chrome, Edge, Firefox récents).');
        }
        const buf = await file.arrayBuffer();
        const rows = await readXlsx(buf);
        if (rows.length === 0) throw new Error('Le fichier Excel ne contient aucune ligne de données.');
        const csvText = rowsToCSV(rows);
        fileToSend = new File([csvText], file.name.replace(/\.xlsx$/i, '.csv'), { type: 'text/csv' });
      }
      const result = await importFile(fileToSend);
      setSummary(result);
    } catch (err) {
      setError(err.message || "Impossible d'importer ce fichier.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="card">
      <h3>Importer des données</h3>
      <div className="hint">
        Fichier CSV ou Excel (.xlsx) avec au minimum les colonnes <b>Indicateur</b> et <b>Réalisation</b>
        (<b>Objectif</b>, <b>Domaine</b>, <b>Sous-groupe</b> et <b>Poids</b> sont optionnelles). Un indicateur
        déjà connu (même nom) est mis à jour ; un nom inconnu est <b>automatiquement enregistré comme nouvel
        indicateur</b>. Téléchargez le modèle si besoin.
      </div>
      {!canImport ? (
        <div className="hint" style={{ marginTop: 10 }}>
          Seuls les managers et les administrateurs peuvent importer des données.
        </div>
      ) : (
        <>
          <div style={{ marginTop: 16 }}>
            <input ref={fileRef} type="file" accept=".csv,.xlsx" onChange={handleFile} disabled={busy} />
          </div>
          {busy && <div className="hint" style={{ marginTop: 10 }}>Import en cours…</div>}
          {error && <div className="field-error show" style={{ marginTop: 10 }}>{error}</div>}
          {summary && (
            <div className="auth-info show" style={{ marginTop: 10 }}>
              {summary.updated} mis à jour, {summary.created} nouveau(x) indicateur(s) enregistré(s), {summary.skipped} ligne(s) ignorée(s) sur {summary.total} lue(s).
            </div>
          )}
        </>
      )}
    </div>
  );
}
