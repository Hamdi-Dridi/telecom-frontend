import React, { useState } from 'react';
import { useKpiData } from '../../../context/KpiDataContext.jsx';
import { useAppState } from '../../../context/AppStateContext.jsx';

const DOMAINS = ['Commercial', 'Technique', 'Stratégique', 'Financier'];

export default function PlanTab() {
  const { kpis, addCustomKpi, addPlan, removePlan, plans } = useKpiData();
  const { periodObjects, periodIndex, currentRegionId, regionObjects, addPeriod, nextAvailablePeriodLabel } = useAppState();

  const activeKpis = kpis.filter(k => !k.isRetired);

  const [creatingNew, setCreatingNew] = useState(false);
  const [selectedKpiId, setSelectedKpiId] = useState(activeKpis[0]?.id || '');
  const [target, setTargetVal] = useState('100');
  const [newDomain, setNewDomain] = useState('Commercial');
  const [newSub, setNewSub] = useState('');
  const [newName, setNewName] = useState('');
  const [newBase, setNewBase] = useState('');
  const [newWeight, setNewWeight] = useState('');
  const [monthIds, setMonthIds] = useState(() => new Set(periodObjects[periodIndex] ? [periodObjects[periodIndex].id] : []));
  const [wantsNewMonth, setWantsNewMonth] = useState(false);
  const [siteIds, setSiteIds] = useState(() => new Set(currentRegionId != null ? [currentRegionId] : []));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function toggleMonth(id) {
    setMonthIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }
  function toggleSite(id) {
    setSiteIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  async function handleSubmit() {
    setError('');
    const targetVal = parseFloat(target);
    if (isNaN(targetVal) || targetVal <= 0) { setError('Merci de renseigner un objectif cible valide.'); return; }
    if (monthIds.size === 0 && !wantsNewMonth) { setError('Sélectionnez au moins un mois.'); return; }
    if (siteIds.size === 0) { setError('Sélectionnez au moins un site.'); return; }

    setSubmitting(true);
    try {
      let kpiId;
      if (creatingNew) {
        const weight = parseFloat(newWeight) || 1;
        const base = parseFloat(newBase);
        if (!newSub || !newName || isNaN(base)) {
          setError('Merci de renseigner le sous-groupe, le nom et la valeur de base du nouvel indicateur.'); return;
        }
        const duplicate = activeKpis.some(k => k.domain === newDomain && k.sub.toLowerCase() === newSub.toLowerCase() && k.name.toLowerCase() === newName.toLowerCase());
        if (duplicate) { setError('Un indicateur avec ce nom existe déjà dans ce domaine / sous-groupe.'); return; }
        kpiId = await addCustomKpi({ domain: newDomain, sub: newSub, name: newName, base, target: targetVal, weight });
        setNewSub(''); setNewName(''); setNewBase(''); setNewWeight('');
      } else {
        if (!selectedKpiId) { setError('Sélectionnez un indicateur.'); return; }
        kpiId = selectedKpiId;
      }

      const monthIdList = [...monthIds];
      if (wantsNewMonth && nextAvailablePeriodLabel) {
        const newPeriod = await addPeriod(nextAvailablePeriodLabel);
        if (newPeriod) monthIdList.push(newPeriod.id);
      }

      await addPlan({ kpiId, target: targetVal, months: monthIdList, sites: [...siteIds] });
      setTargetVal('100');
      setWantsNewMonth(false);
    } catch (e) {
      setError(e.message || 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemovePlan(id) {
    try { await removePlan(id); } catch (e) { alert(e.message); }
  }

  return (
    <div>
      <div className="plan-form">
        <div className="row">
          <div>
            <label>Indicateur</label>
            <select value={selectedKpiId} onChange={e => setSelectedKpiId(e.target.value)} disabled={creatingNew}>
              {activeKpis.map(k => <option key={k.id} value={k.id}>{k.domain} · {k.sub} · {k.name}</option>)}
            </select>
          </div>
          <div>
            <label>Objectif cible</label>
            <input type="number" value={target} onChange={e => setTargetVal(e.target.value)} placeholder="100" />
          </div>
        </div>

        <button type="button" className="toggle-new-ind" onClick={() => setCreatingNew(v => !v)}>
          {creatingNew ? '← Choisir un indicateur existant à la place' : "+ Créer un nouvel indicateur au lieu d'en choisir un existant"}
        </button>

        {creatingNew && (
          <div className="new-indicator-fields show">
            <div>
              <label>Domaine</label>
              <select value={newDomain} onChange={e => setNewDomain(e.target.value)}>
                {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label>Sous-groupe</label>
              <input type="text" value={newSub} onChange={e => setNewSub(e.target.value)} placeholder="ex. Mobile" />
            </div>
            <div>
              <label>Nom de l'indicateur</label>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="ex. Taux de churn" />
            </div>
            <div>
              <label>Valeur de base</label>
              <input type="number" value={newBase} onChange={e => setNewBase(e.target.value)} placeholder="ex. 85" />
            </div>
            <div>
              <label>Poids</label>
              <input type="number" min="0" max="100" step="1" value={newWeight} onChange={e => setNewWeight(e.target.value)} placeholder="ex. 20" />
            </div>
          </div>
        )}

        <label>Mois concernés</label>
        <div className="check-chips" style={{ marginBottom: 14 }}>
          {periodObjects.map(p => (
            <label key={p.id} className={`check-chip ${monthIds.has(p.id) ? 'checked' : ''}`}>
              <input type="checkbox" checked={monthIds.has(p.id)} onChange={() => toggleMonth(p.id)} /> {p.label}
            </label>
          ))}
          {nextAvailablePeriodLabel && (
            <label className={`check-chip new-month-chip ${wantsNewMonth ? 'checked' : ''}`} title="Ce mois n'existe pas encore — le sélectionner l'ajoutera au calendrier.">
              <input type="checkbox" checked={wantsNewMonth} onChange={() => setWantsNewMonth(v => !v)} /> + {nextAvailablePeriodLabel} <span className="mono" style={{ fontSize: 9.5 }}>(nouveau)</span>
            </label>
          )}
          {periodObjects.length === 0 && !nextAvailablePeriodLabel && (
            <div className="hint">
              Aucune période disponible — un administrateur doit d'abord en créer une (menu Admin Django → KPI → Périodes) avant de pouvoir planifier un objectif.
            </div>
          )}
        </div>

        <label>Sites concernés</label>
        <div className="check-chips" style={{ marginBottom: 16 }}>
          {regionObjects.map(r => (
            <label key={r.id} className={`check-chip ${siteIds.has(r.id) ? 'checked' : ''}`}>
              <input type="checkbox" checked={siteIds.has(r.id)} onChange={() => toggleSite(r.id)} /> {r.name}
            </label>
          ))}
          {regionObjects.length === 0 && (
            <div className="hint">
              Aucune région disponible — un administrateur doit d'abord en créer une (menu Admin Django → KPI → Régions) avant de pouvoir planifier un objectif.
            </div>
          )}
        </div>

        {error && <div className="field-error show">{error}</div>}
        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Ajout en cours…' : "Ajouter l'objectif planifié"}
        </button>
      </div>

      <h3 style={{ fontSize: 13 }}>Objectifs planifiés</h3>
      {plans.length === 0 ? (
        <div className="empty-state" style={{ padding: 20 }}>Aucun objectif planifié pour le moment.</div>
      ) : (
        <table className="plan-list-table">
          <thead><tr><th>Indicateur</th><th>Mois</th><th>Site</th><th>Objectif</th><th /></tr></thead>
          <tbody>
            {[...plans].reverse().map(p => (
              <tr key={p.id}>
                <td>{p.kpi_name}</td>
                <td>{p.periods.map(pid => periodObjects.find(po => po.id === pid)?.label || pid).join(', ')}</td>
                <td>{p.regions.map(rid => regionObjects.find(ro => ro.id === rid)?.name || rid).join(', ')}</td>
                <td className="mono">{p.target}</td>
                <td><button className="mgmt-btn danger" onClick={() => handleRemovePlan(p.id)}>Supprimer</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
