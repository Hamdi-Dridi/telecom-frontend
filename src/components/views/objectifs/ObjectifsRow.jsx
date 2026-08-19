import React, { useState } from 'react';
import { useKpiData } from '../../../context/KpiDataContext.jsx';

/** result: one row from useKpiData().results — already has id (the
 *  KPIResult PK), kpiId, name, domain, sub, weight, realisation, objectif,
 *  taux, score, statut, statutLabel, comment, validation — all computed
 *  server-side. Edits PATCH straight to the API. */
export default function ObjectifsRow({ result }) {
  const { updateResult, setWeight } = useKpiData();

  const [weightDraft, setWeightDraft] = useState(result.weight);
  const [targetDraft, setTargetDraft] = useState(result.objectif);
  const [realisationDraft, setRealisationDraft] = useState(result.realisation);
  const [commentDraft, setCommentDraft] = useState(result.comment);
  const [busy, setBusy] = useState(false);

  async function commitWeight() {
    const v = parseFloat(weightDraft);
    if (isNaN(v) || v < 0 || v === result.weight) { setWeightDraft(result.weight); return; }
    setBusy(true);
    try { await setWeight(result.kpiId, v); } finally { setBusy(false); }
  }

  async function commitTarget() {
    const v = parseFloat(targetDraft);
    if (isNaN(v) || v <= 0 || v === result.objectif) { setTargetDraft(result.objectif); return; }
    setBusy(true);
    try { await updateResult(result.id, { objectif: v }); } finally { setBusy(false); }
  }

  async function commitRealisation() {
    const v = parseFloat(realisationDraft);
    if (isNaN(v) || v === result.realisation) { setRealisationDraft(result.realisation); return; }
    setBusy(true);
    try { await updateResult(result.id, { realisation: v }); } finally { setBusy(false); }
  }

  async function commitComment() {
    if (commentDraft === result.comment) return;
    await updateResult(result.id, { comment: commentDraft });
  }

  async function commitValidation(value) {
    await updateResult(result.id, { validation: value });
  }

  return (
    <tr style={busy ? { opacity: 0.6 } : undefined}>
      <td>{result.domain}</td>
      <td>{result.name}</td>
      <td className="weight-cell">
        <input
          type="number" min="0" max="100" step="1" className="weight-input"
          value={weightDraft} onChange={e => setWeightDraft(e.target.value)}
          onBlur={commitWeight} onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
          title="Poids (%) utilisé dans le calcul du score pondéré"
        />
        <span className="unit-suffix">%</span>
      </td>
      <td>
        <input
          type="number" min="1" step="0.1" className="target-input"
          value={targetDraft} onChange={e => setTargetDraft(e.target.value)}
          onBlur={commitTarget} onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
        />
      </td>
      <td>
        <input
          type="number" step="0.1" className="realisation-input"
          value={realisationDraft} onChange={e => setRealisationDraft(e.target.value)}
          onBlur={commitRealisation} onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
          title="Valeur réalisée mesurée (variable brute, pas un pourcentage)"
        />
      </td>
      <td className="mono taux-cell" style={{ fontWeight: 700 }}>{result.taux}%</td>
      <td className="mono score-cell">{result.score}</td>
      <td><span className={`badge ${result.statut}`}>{result.statutLabel}</span></td>
      <td>
        <input
          type="text" className="comment-input" placeholder="Ajouter un commentaire…"
          value={commentDraft} onChange={e => setCommentDraft(e.target.value)}
          onBlur={commitComment} onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
        />
      </td>
      <td>
        <select
          className={`validation-select ${result.validation}`}
          value={result.validation}
          onChange={e => commitValidation(e.target.value)}
        >
          <option value="pending">En attente</option>
          <option value="validated">Validé</option>
        </select>
      </td>
    </tr>
  );
}
