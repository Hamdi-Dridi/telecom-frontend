import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useAppState } from '../../../context/AppStateContext.jsx';

export default function UserEditModal({ user, onClose }) {
  const { users, updateUserFields } = useAuth();
  const { regions } = useAppState();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [region, setRegion] = useState(regions[0]);
  const [role, setRole] = useState('manager');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName); setLastName(user.lastName); setEmail(user.email);
      setRegion(user.region || regions[0]); setRole(user.role); setError('');
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null;

  const activeAdmins = users.filter(u => u.role === 'admin' && u.status === 'active');

  async function handleSave() {
    setError('');
    if (!firstName || !lastName || !email) { setError("Merci de renseigner le prénom, le nom et l'email."); return; }
    const dupe = users.find(u => u.id !== user.id && u.email.toLowerCase() === email.toLowerCase());
    if (dupe) { setError('Cet e-mail est déjà utilisé par un autre compte.'); return; }
    if (user.role === 'admin' && role !== 'admin' && activeAdmins.length <= 1) {
      setError("Impossible de retirer le rôle du dernier administrateur."); return;
    }
    try {
      await updateUserFields(user.id, { firstName, lastName, email, region, role });
      onClose();
    } catch (e) {
      setError(e.message || "Une erreur est survenue.");
    }
  }

  return (
    <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal-wide">
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="path">Utilisateurs</div>
        <h3>Modifier l'utilisateur</h3>
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
          {error && <div className="field-error show">{error}</div>}
        </div>
        <div className="save-bar">
          <button className="btn btn-primary" onClick={handleSave}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}
