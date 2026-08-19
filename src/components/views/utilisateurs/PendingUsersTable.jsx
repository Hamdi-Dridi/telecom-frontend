import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';

export default function PendingUsersTable() {
  const { users, approveUser, rejectUser } = useAuth();
  const pending = users.filter(u => u.status === 'pending');
  const [roleChoice, setRoleChoice] = useState({});

  async function handleApprove(u) {
    try { await approveUser(u.id, roleChoice[u.id] || 'manager'); } catch (e) { alert(e.message); }
  }
  async function handleReject(u) {
    try { await rejectUser(u.id); } catch (e) { alert(e.message); }
  }

  return (
    <div className="card">
      <h3>Demandes en attente</h3>
      <div className="hint">Nouveaux comptes créés via la page d'inscription — approuvez-les et attribuez un rôle pour leur donner accès.</div>
      {pending.length === 0 ? (
        <div className="empty-state" style={{ padding: 24 }}>Aucune demande en attente.</div>
      ) : (
        <table className="obj-table mgmt-table">
          <thead><tr><th>Nom</th><th>Email</th><th>Site</th><th>Créé le</th><th>Attribuer un rôle</th></tr></thead>
          <tbody>
            {pending.map(u => (
              <tr key={u.id}>
                <td>{u.firstName} {u.lastName}</td>
                <td>{u.email}</td>
                <td>{u.region || '—'}</td>
                <td className="mono">{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
                <td>
                  <div className="approve-row">
                    <select value={roleChoice[u.id] || 'manager'} onChange={e => setRoleChoice(prev => ({ ...prev, [u.id]: e.target.value }))}>
                      <option value="manager">Manager</option>
                      <option value="admin">Administrateur</option>
                    </select>
                    <button className="mgmt-btn restore" onClick={() => handleApprove(u)}>Approuver</button>
                    <button className="mgmt-btn danger" onClick={() => handleReject(u)}>Refuser</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
