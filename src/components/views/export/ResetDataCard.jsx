import React, { useState } from 'react';
import { useKpiData } from '../../../context/KpiDataContext.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';

export default function ResetDataCard() {
  const { resetData } = useKpiData();
  const { isAdmin } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirm() {
    setBusy(true); setError('');
    try {
      await resetData();
      setConfirming(false);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (e) {
      setError(e.message || 'Impossible de réinitialiser les données.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ borderColor: 'var(--red-soft)' }}>
      <h3>⚠️ Réinitialiser les données</h3>
      <div className="hint">
        Masque tous les indicateurs actuels — y compris ceux de démonstration — et efface objectifs,
        réalisations, poids, commentaires, validations et historique d'activité, pour repartir d'un
        tableau de bord vide, prêt à recevoir vos propres données importées. Les comptes utilisateurs
        ne sont pas concernés, vous resterez connecté(e).
      </div>
      {!isAdmin ? (
        <div className="hint" style={{ marginTop: 10 }}>Seuls les administrateurs peuvent réinitialiser les données.</div>
      ) : !confirming ? (
        <button className="btn btn-ghost" style={{ marginTop: 16, color: '#C22F45', borderColor: 'var(--red-soft)' }} onClick={() => setConfirming(true)}>
          🗑️ Réinitialiser les données
        </button>
      ) : (
        <div style={{ marginTop: 16 }}>
          <div className="auth-error show" style={{ marginBottom: 12 }}>
            Cette action est irréversible : tous les indicateurs (y compris ceux de démonstration) disparaîtront du tableau de bord.
          </div>
          {error && <div className="field-error show" style={{ marginBottom: 12 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" style={{ background: 'var(--red)' }} onClick={handleConfirm} disabled={busy}>
              {busy ? '…' : 'Oui, tout effacer'}
            </button>
            <button className="btn btn-ghost" onClick={() => setConfirming(false)} disabled={busy}>Annuler</button>
          </div>
        </div>
      )}
      {done && (
        <div className="auth-info show" style={{ marginTop: 12 }}>
          ✓ Données réinitialisées. Le tableau de bord est vide — importez un fichier pour le repeupler.
        </div>
      )}
    </div>
  );
}
