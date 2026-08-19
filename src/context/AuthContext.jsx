import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/auth.js';
import { unwrapList, getToken, setToken as persistToken, clearToken } from '../api/client.js';

/** The Django API returns snake_case (first_name, created_at...); role and
 *  region already come through as plain strings ('admin', 'Grand Tunis')
 *  thanks to SlugRelatedField on the backend. Normalizing here means every
 *  existing component (AllUsersTable, UserEditModal, Navbar...) keeps
 *  working against the exact camelCase shape it always has, unchanged. */
function normalizeUser(u) {
  if (!u) return u;
  return {
    id: u.id, firstName: u.first_name, lastName: u.last_name, email: u.email,
    role: u.role, region: u.region, status: u.status, createdAt: u.created_at,
  };
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [booting, setBooting] = useState(true);
  const [authError, setAuthError] = useState('');

  const refreshUsers = useCallback(async () => {
    try {
      const data = await authApi.listUsers();
      setUsers(unwrapList(data).map(normalizeUser));
    } catch (e) {
      // Non-admins get a 403 here — that's expected, just means no user list for them.
      setUsers([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = getToken();
      if (!token) { setBooting(false); return; }
      try {
        const me = await authApi.me();
        if (cancelled) return;
        setCurrentUser(normalizeUser(me));
        if (me.role === 'admin') await refreshUsers();
      } catch (e) {
        clearToken();
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshUsers]);

  const login = useCallback(async (email, password) => {
    setAuthError('');
    try {
      const data = await authApi.login(email, password);
      persistToken(data.token);
      const user = normalizeUser(data.user);
      setCurrentUser(user);
      if (user.role === 'admin') await refreshUsers();
      return { ok: true, user };
    } catch (e) {
      const reason = e.data?.reason || 'invalid';
      return { ok: false, reason, message: e.message };
    }
  }, [refreshUsers]);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch (e) { /* token may already be invalid — fine, clear locally anyway */ }
    clearToken();
    setCurrentUser(null);
    setUsers([]);
  }, []);

  const signup = useCallback(async ({ firstName, lastName, email, password, region }) => {
    try {
      await authApi.signup({ first_name: firstName, last_name: lastName, email, password, region });
      return { ok: true };
    } catch (e) {
      return { ok: false, message: e.message };
    }
  }, []);

  const createUserDirect = useCallback(async ({ firstName, lastName, email, password, region, role }) => {
    try {
      await authApi.createUser({ first_name: firstName, last_name: lastName, email, password, region, role });
      await refreshUsers();
      return { ok: true };
    } catch (e) {
      return { ok: false, message: e.message };
    }
  }, [refreshUsers]);

  const approveUser = useCallback(async (id, role) => {
    await authApi.approveUser(id, role);
    await refreshUsers();
  }, [refreshUsers]);

  const rejectUser = useCallback(async (id) => {
    await authApi.rejectUser(id);
    await refreshUsers();
  }, [refreshUsers]);

  const deleteUserForever = useCallback(async (id) => {
    await authApi.deleteUser(id);
    await refreshUsers();
  }, [refreshUsers]);

  const toggleSuspend = useCallback(async (id) => {
    await authApi.toggleSuspend(id);
    await refreshUsers();
  }, [refreshUsers]);

  const updateUserFields = useCallback(async (id, fields) => {
    const payload = {};
    if (fields.firstName !== undefined) payload.first_name = fields.firstName;
    if (fields.lastName !== undefined) payload.last_name = fields.lastName;
    if (fields.email !== undefined) payload.email = fields.email;
    if (fields.region !== undefined) payload.region = fields.region;
    if (fields.role !== undefined) payload.role = fields.role;
    await authApi.updateUser(id, payload);
    await refreshUsers();
    if (currentUser && currentUser.id === id) {
      const me = await authApi.me();
      setCurrentUser(normalizeUser(me));
    }
  }, [refreshUsers, currentUser]);

  const updateOwnProfile = useCallback(async ({ firstName, lastName, email, region, password }) => {
    const payload = { first_name: firstName, last_name: lastName, email, region };
    if (password) payload.password = password;
    const me = await authApi.updateMe(payload);
    const user = normalizeUser(me);
    setCurrentUser(user);
    return user;
  }, []);

  const roleLabel = useCallback((user) => {
    if (!user) return '';
    return user.role === 'admin' ? 'Administrateur' : user.role === 'viewer' ? 'Viewer' : 'Manager';
  }, []);

  const value = {
    users, currentUser, isAdmin: currentUser?.role === 'admin', booting, authError,
    login, logout, signup, createUserDirect,
    approveUser, rejectUser, deleteUserForever, toggleSuspend, updateUserFields, updateOwnProfile,
    roleLabel, refreshUsers,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
