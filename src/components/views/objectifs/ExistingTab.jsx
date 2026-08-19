import React, { useState } from 'react';
import { useKpiData } from '../../../context/KpiDataContext.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';

const emptyDraft = { domain: '', sub: '', name: '', unit: '%', weight: '1', base: '' };

export default function ExistingTab() {
  const { kpis, setWeight, editKpi, createIndicator, deleteKpi, retireKpi, restoreKpi } = useKpiData();
  const { isAdmin } = useAuth();
  const [busyId, setBusyId] = useState(null);
  const [weightDrafts, setWeightDrafts] = useState({});

  // Inline full-row edit
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(emptyDraft);

  // Standalone "create new indicator" form
  const [creating, setCreating] = useState(false);
  const [newDraft, setNewDraft] = useState(emptyDraft);
  const [error, setError] = useState('');

  const existingDomains = [...new Set(kpis.map(k => k.domain))];
  const existingGroups = [...new Set(kpis.map(k => k.sub))];

  async function commitWeight(kpi) {
    const raw = weightDrafts[kpi.id];
    if (raw === undefined) return;
    const v = parseFloat(raw);
    if (isNaN(v) || v < 0 || v === kpi.weight) {
      setWeightDrafts(prev => { const next = { ...prev }; delete next[kpi.id]; return next; });
      return;
    }
    setBusyId(kpi.id);
    try { await setWeight(kpi.id, v); } finally { setBusyId(null); }
  }

  async function handleRetire(kpi) {
    setBusyId(kpi.id);
    try { await retireKpi(kpi.id); } finally { setBusyId(null); }
  }

  async function handleRestore(kpi) {
    setBusyId(kpi.id);
    try { await restoreKpi(kpi.id); } finally { setBusyId(null); }
  }

  async function handleDelete(kpi) {
    if (!window.confirm(`Supprimer définitivement « ${kpi.name} » ? Cette action efface aussi toutes ses valeurs enregistrées et ne peut pas être annulée. Si vous voulez juste le masquer sans perdre l'historique, utilisez plutôt « Retirer ».`)) return;
    setBusyId(kpi.id);
    try { await deleteKpi(kpi.id); } catch (e) { alert(e.message || 'Suppression impossible.'); } finally { setBusyId(null); }
  }

  function startEdit(kpi) {
    setEditingId(kpi.id);
    setEditDraft({ domain: kpi.domain, sub: kpi.sub, name: kpi.name, unit: kpi.unit || '%', weight: String(kpi.weight), base: '' });
    setError('');
  }

  async function commitEdit(kpi) {
    setError('');
    if (!editDraft.domain.trim() || !editDraft.sub.trim() || !editDraft.name.trim()) {
      setError('Domaine, sous-groupe et nom sont obligatoires.'); return;
    }
    const weight = parseFloat(editDraft.weight);
    setBusyId(kpi.id);
    try {
      await editKpi(kpi.id, {
        domain: editDraft.domain.trim(), sub: editDraft.sub.trim(), name: editDraft.name.trim(),
        unit: editDraft.unit.trim() || '%', weight: isNaN(weight) ? 1 : weight,
      });
      setEditingId(null);
    } catch (e) {
      setError(e.message || 'Modification impossible.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreate() {
    setError('');
    if (!newDraft.domain.trim() || !newDraft.sub.trim() || !newDraft.name.trim()) {
      setError('Domaine, sous-groupe et nom sont obligatoires.'); return;
    }
    const duplicate = kpis.some(k => k.domain.toLowerCase() === newDraft.domain.trim().toLowerCase()
      && k.sub.toLowerCase() === newDraft.sub.trim().toLowerCase()
      && k.name.toLowerCase() === newDraft.name.trim().toLowerCase());
    if (duplicate) { setError('Un indicateur avec ce nom existe déjà dans ce domaine / sous-groupe.'); return; }
    const weight = parseFloat(newDraft.weight);
    const base = newDraft.base === '' ? undefined : parseFloat(newDraft.base);
    setBusyId('new');
    try {
      await createIndicator({
        domain: newDraft.domain.trim(), sub: newDraft.sub.trim(), name: newDraft.name.trim(),
        unit: newDraft.unit.trim() || '%', weight: isNaN(weight) ? 1 : weight, base,
      });
      setNewDraft(emptyDraft);
      setCreating(false);
    } catch (e) {
      setError(e.message || 'Création impossible.');
    } finally {
      setBusyId(null);
    }
  }

  if (!isAdmin) {
    return (
      <div>
        <div className="hint" style={{ marginBottom: 14 }}>
          Seuls les administrateurs peuvent créer, modifier ou supprimer des indicateurs.
        </div>
        <table className="obj-table mgmt-table">
          <thead><tr><th>Domaine</th><th>Sous-groupe</th><th>Indicateur</th><th>Poids</th><th>Statut</th></tr></thead>
          <tbody>
            {kpis.map(k => (
              <tr key={k.id} style={{ opacity: k.isRetired ? 0.55 : 1 }}>
                <td>{k.domain}</td><td>{k.sub}</td><td>{k.name}</td><td className="mono">{k.weight}</td>
                <td>{k.isRetired ? <span className="retired-tag">Retiré</span> : <span className="badge green">Actif</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div>
      <div className="hint">
        Créez, modifiez ou supprimez des indicateurs directement ici. « Retirer » masque un indicateur sans perdre son
        historique (restaurable à tout moment) ; « Supprimer » l'efface définitivement, valeurs comprises.
      </div>

      {!creating ? (
        <button type="button" className="toggle-new-ind" onClick={() => { setCreating(true); setError(''); }}>
          + Créer un nouvel indicateur
        </button>
      ) : (
        <div className="new-indicator-fields show">
          <div>
            <label>Domaine</label>
            <input list="domain-suggestions" value={newDraft.domain} onChange={e => setNewDraft(d => ({ ...d, domain: e.target.value }))} placeholder="ex. Commercial" />
            <datalist id="domain-suggestions">{existingDomains.map(d => <option key={d} value={d} />)}</datalist>
          </div>
          <div>
            <label>Sous-groupe</label>
            <input list="group-suggestions" value={newDraft.sub} onChange={e => setNewDraft(d => ({ ...d, sub: e.target.value }))} placeholder="ex. Mobile" />
            <datalist id="group-suggestions">{existingGroups.map(g => <option key={g} value={g} />)}</datalist>
          </div>
          <div>
            <label>Nom de l'indicateur</label>
            <input type="text" value={newDraft.name} onChange={e => setNewDraft(d => ({ ...d, name: e.target.value }))} placeholder="ex. Taux de churn" />
          </div>
          <div>
            <label>Unité</label>
            <input type="text" value={newDraft.unit} onChange={e => setNewDraft(d => ({ ...d, unit: e.target.value }))} placeholder="%" />
          </div>
          <div>
            <label>Poids</label>
            <input type="number" min="0" max="100" step="1" value={newDraft.weight} onChange={e => setNewDraft(d => ({ ...d, weight: e.target.value }))} />
          </div>
          <div>
            <label>Valeur de départ (optionnel — mois/site actuels)</label>
            <input type="number" value={newDraft.base} onChange={e => setNewDraft(d => ({ ...d, base: e.target.value }))} placeholder="ex. 85" />
          </div>
          {error && <div className="field-error show">{error}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" disabled={busyId === 'new'} onClick={handleCreate}>
              {busyId === 'new' ? 'Création…' : 'Créer'}
            </button>
            <button className="btn btn-ghost" onClick={() => { setCreating(false); setNewDraft(emptyDraft); setError(''); }}>Annuler</button>
          </div>
        </div>
      )}

      <table className="obj-table mgmt-table">
        <thead>
          <tr><th>Domaine</th><th>Sous-groupe</th><th>Indicateur</th><th>Unité</th><th>Poids</th><th>Statut</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {kpis.map(k => (
            editingId === k.id ? (
              <tr key={k.id} className="editing-row" style={{ background: 'rgba(124,111,234,0.06)' }}>
                <td><input list="domain-suggestions" value={editDraft.domain} onChange={e => setEditDraft(d => ({ ...d, domain: e.target.value }))} /></td>
                <td><input list="group-suggestions" value={editDraft.sub} onChange={e => setEditDraft(d => ({ ...d, sub: e.target.value }))} /></td>
                <td><input type="text" value={editDraft.name} onChange={e => setEditDraft(d => ({ ...d, name: e.target.value }))} /></td>
                <td><input type="text" style={{ width: 50 }} value={editDraft.unit} onChange={e => setEditDraft(d => ({ ...d, unit: e.target.value }))} /></td>
                <td><input type="number" min="0" max="100" step="1" className="weight-input" value={editDraft.weight} onChange={e => setEditDraft(d => ({ ...d, weight: e.target.value }))} /></td>
                <td>{k.isRetired ? <span className="retired-tag">Retiré</span> : <span className="badge green">Actif</span>}</td>
                <td>
                  <div className="mgmt-actions">
                    <button className="mgmt-btn primary" disabled={busyId === k.id} onClick={() => commitEdit(k)}>Enregistrer</button>
                    <button className="mgmt-btn" disabled={busyId === k.id} onClick={() => { setEditingId(null); setError(''); }}>Annuler</button>
                  </div>
                </td>
              </tr>
            ) : (
              <tr key={k.id} style={{ opacity: k.isRetired ? 0.55 : (busyId === k.id ? 0.6 : 1) }}>
                <td>{k.domain}</td>
                <td>{k.sub}</td>
                <td>{k.name}{k.isCustom ? <span className="retired-tag"> (ajouté)</span> : null}</td>
                <td>{k.unit}</td>
                <td>
                  <input
                    type="number" min="0" max="100" step="1" className="weight-input"
                    value={weightDrafts[k.id] ?? k.weight}
                    onChange={e => setWeightDrafts(prev => ({ ...prev, [k.id]: e.target.value }))}
                    onBlur={() => commitWeight(k)}
                    onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
                  />
                </td>
                <td>
                  {k.isRetired
                    ? <span className="retired-tag">Retiré</span>
                    : <span className="badge green">Actif</span>}
                </td>
                <td>
                  <div className="mgmt-actions">
                    <button className="mgmt-btn primary" disabled={busyId === k.id} onClick={() => startEdit(k)}>Modifier</button>
                    {k.isRetired ? (
                      <button className="mgmt-btn restore" disabled={busyId === k.id} onClick={() => handleRestore(k)}>Restaurer</button>
                    ) : (
                      <button className="mgmt-btn danger" disabled={busyId === k.id} onClick={() => handleRetire(k)}>Retirer</button>
                    )}
                    <button className="mgmt-btn danger" disabled={busyId === k.id} onClick={() => handleDelete(k)}>Supprimer</button>
                  </div>
                </td>
              </tr>
            )
          ))}
        </tbody>
      </table>
      {editingId != null && error && <div className="field-error show" style={{ marginTop: 10 }}>{error}</div>}
      <datalist id="domain-suggestions">{existingDomains.map(d => <option key={d} value={d} />)}</datalist>
      <datalist id="group-suggestions">{existingGroups.map(g => <option key={g} value={g} />)}</datalist>
    </div>
  );
}
