import React, { useState } from 'react';
import PlanTab from './PlanTab.jsx';
import ExistingTab from './ExistingTab.jsx';

export default function GestionIndicateursModal({ open, onClose }) {
  const [tab, setTab] = useState('plan'); // 'plan' | 'existing'

  if (!open) return null;

  return (
    <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal-big">
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="path">Objectifs</div>
        <h3>Gestion des indicateurs</h3>
        <div className="hint">Planifiez de nouveaux objectifs pour les prochains mois et les sites concernés, ou gérez les indicateurs existants.</div>

        <div className="mgmt-tabs">
          <button className={tab === 'plan' ? 'active' : ''} onClick={() => setTab('plan')}>Planifier un objectif</button>
          <button className={tab === 'existing' ? 'active' : ''} onClick={() => setTab('existing')}>Indicateurs existants</button>
        </div>

        {tab === 'plan' ? <PlanTab /> : <ExistingTab />}
      </div>
    </div>
  );
}
