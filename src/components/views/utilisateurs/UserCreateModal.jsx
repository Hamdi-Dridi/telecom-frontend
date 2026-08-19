import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useAppState } from '../../../context/AppStateContext.jsx';

export default function UserCreateModal({ open, onClose }) {
  const { createUserDirect } = useAuth();
  const { regions } = useAppState();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [region, setRegion] = useState(regions[0]);
  const [role, setRole] = useState('manager');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  function reset() {
    setFirstName(''); setLastName(''); setEmail(''); setRegion(regions[0]);
    setRole('manager'); setPassword(''); setConfirm(''); setError('');
  }

  async function handleSave() {
    setError('');
    if (!firstName || !lastName || !email || !password) { setError('Merci de remplir tous les champs obligatoires.'); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError('Adresse e-mail invalide.'); return; }
    if (password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return; }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
    const result = await createUserDirect({ firstName, lastName, email, password, region, role });
    if (!result.ok) { setError(result.message || 'Un compte existe déjà avec cet e-mail.'); return; }
    reset();
    onClose();
  }

  return (
    <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal-wide">
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="path">Utilisateurs</div>
        <h3>Ajouter un utilisateur</h3>
        <div className="hint" style={{ marginBottom: 16 }}>Le compte est créé directement actif, sans passer par l'inscription publique ni l'approbation.</div>
        <div className="settings-body">
          <div className="auth-row2">
            <div><label>Prénom</label><input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
            <div><label>Nom</label><input type="text" value={lastName} onChange={e => setLastName(e.target.value)} /></div>
          </div>
          <label>Adresse e-mail</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <label>Site / Région</label>
          <select value={region} onChange={e => setRegion(e.target.value)}>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <label>Rôle</label>
          <select value={role} onChange={e => setRole(e.target.value)}>
            <option value="manager">Manager</option>
            <option value="admin">Administrateur</option>
          </select>
          <div className="auth-row2">
            <div><label>Mot de passe</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} /></div>
            <div><label>Confirmer</label><input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} /></div>
          </div>
          {error && <div className="field-error show">{error}</div>}
        </div>
        <div className="save-bar">
          <button className="btn btn-primary" onClick={handleSave}>Créer le compte</button>
        </div>
      </div>
    </div>
  );
}
