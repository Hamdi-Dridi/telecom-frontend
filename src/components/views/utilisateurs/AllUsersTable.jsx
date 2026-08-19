import React from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';

export default function AllUsersTable({ onAdd, onEdit }) {
  const { users, currentUser, toggleSuspend, deleteUserForever, updateUserFields } = useAuth();
  const others = users.filter(u => u.status !== 'pending');
  const activeAdmins = users.filter(u => u.role === 'admin' && u.status === 'active');

  async function handleSuspend(u) {
    if (currentUser && currentUser.id === u.id) { alert('Vous ne pouvez pas suspendre votre propre compte.'); return; }
    try { await toggleSuspend(u.id); } catch (e) { alert(e.message); }
  }

  async function handleDemote(u) {
    if (currentUser && currentUser.id === u.id) { alert('Vous ne pouvez pas rétrograder votre propre compte.'); return; }
    if (activeAdmins.length <= 1) { alert("Impossible de rétrograder le dernier administrateur actif."); return; }
    if (window.confirm(`« ${u.firstName} ${u.lastName} » perdra ses droits d'administrateur et deviendra Manager.`)) {
      try { await updateUserFields(u.id, { role: 'manager' }); } catch (e) { alert(e.message); }
    }
  }

  async function handleDelete(u) {
    if (currentUser && currentUser.id === u.id) { alert('Vous ne pouvez pas supprimer votre propre compte.'); return; }
    if (u.role === 'admin' && activeAdmins.length <= 1) { alert("Impossible de supprimer le dernier administrateur actif."); return; }
    if (window.confirm(`« ${u.firstName} ${u.lastName} » sera définitivement supprimé.`)) {
      try { await deleteUserForever(u.id); } catch (e) { alert(e.message); }
    }
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h3>Tous les utilisateurs</h3>
          <div className="hint">Gérez les comptes actifs : modification, changement de rôle, suspension ou suppression.</div>
        </div>
        <button className="btn btn-primary" style={{ whiteSpace: 'nowrap' }} onClick={onAdd}>+ Ajouter un utilisateur</button>
      </div>
      <table className="obj-table mgmt-table">
        <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Site</th><th>Statut</th><th>Actions</th></tr></thead>
        <tbody>
          {others.map(u => {
            const isYou = currentUser?.id === u.id;
            return (
              <tr key={u.id}>
                <td>{u.firstName} {u.lastName}{isYou && <span className="you-tag">VOUS</span>}</td>
                <td>{u.email}</td>
                <td><span className={`role-tag ${u.role}`}>{u.role === 'admin' ? 'Administrateur' : 'Manager'}</span></td>
                <td>{u.region || '—'}</td>
                <td><span className={`status-dot ${u.status}`} />{u.status === 'active' ? 'Actif' : 'Suspendu'}</td>
                <td>
                  <div className="mgmt-actions">
                    <button className="mgmt-btn" onClick={() => onEdit(u)}>Modifier</button>
                    {u.role === 'admin' ? (
                      <button className="mgmt-btn" onClick={() => handleDemote(u)}>Rétrograder en Manager</button>
                    ) : (
                      <button className={`mgmt-btn ${u.status === 'active' ? 'danger' : 'restore'}`} onClick={() => handleSuspend(u)}>
                        {u.status === 'active' ? 'Suspendre' : 'Réactiver'}
                      </button>
                    )}
                    <button className="mgmt-btn danger" onClick={() => handleDelete(u)}>Supprimer</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
