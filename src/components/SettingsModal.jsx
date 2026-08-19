import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useAppState } from '../context/AppStateContext.jsx';

export default function SettingsModal({ open, onClose }) {
  const { currentUser, updateOwnProfile } = useAuth();
  const { regions, region, setRegion } = useAppState();

  const [firstName, setFirstName] = useState(currentUser?.firstName || '');
  const [lastName, setLastName] = useState(currentUser?.lastName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [profileRegion, setProfileRegion] = useState(currentUser?.region || regions[0]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [savedMsg, setSavedMsg] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  async function handleSave() {
    setError('');
    if (!firstName || !lastName || !email) { setError("Merci de renseigner le prénom, le nom et l'email."); return; }
    if (newPassword || confirmPassword) {
      if (newPassword.length < 6) { setError('Le nouveau mot de passe doit contenir au moins 6 caractères.'); return; }
      if (newPassword !== confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return; }
    }
    setSaving(true);
    try {
      await updateOwnProfile({ firstName, lastName, email, region: profileRegion, password: newPassword || undefined });
      if (profileRegion !== region) setRegion(profileRegion);
      setNewPassword(''); setConfirmPassword('');
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    } catch (e) {
      setError(e.message || 'Une erreur est survenue.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal-wide">
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="path">Compte</div>
        <h3>Paramètres</h3>
        <div className="settings-body">
          <div className="auth-row2">
            <div>
              <label>Prénom</label>
              <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} />
            </div>
            <div>
              <label>Nom</label>
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
          </div>
          <label>Adresse e-mail</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <label>Région par défaut</label>
          <select value={profileRegion} onChange={e => setProfileRegion(e.target.value)}>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <div className="auth-row2">
            <div>
              <label>Nouveau mot de passe</label>
              <input type="password" placeholder="Laisser vide pour ne pas changer"
                value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <div>
              <label>Confirmer</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
          </div>
          {error && <div className="field-error show">{error}</div>}
        </div>
        <div className="save-bar">
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
          {savedMsg && <span className="save-msg show">✓ Paramètres enregistrés</span>}
        </div>
      </div>
    </div>
  );
}
