import React, { useState } from 'react';
import PendingUsersTable from './utilisateurs/PendingUsersTable.jsx';
import AllUsersTable from './utilisateurs/AllUsersTable.jsx';
import UserCreateModal from './utilisateurs/UserCreateModal.jsx';
import UserEditModal from './utilisateurs/UserEditModal.jsx';

export default function UtilisateursView() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);

  return (
    <div className="view active">
      <PendingUsersTable />
      <AllUsersTable onAdd={() => setCreateOpen(true)} onEdit={setEditUser} />
      <UserCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <UserEditModal user={editUser} onClose={() => setEditUser(null)} />
    </div>
  );
}
