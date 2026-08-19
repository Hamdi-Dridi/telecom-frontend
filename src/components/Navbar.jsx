import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useAppState } from '../context/AppStateContext.jsx';
import logo from '../assets/logo.png';

const TABS = [
  { key: 'overview', label: "Vue d'ensemble" },
  { key: 'historique', label: 'Historique' },
  { key: 'objectifs', label: 'Objectifs' },
  { key: 'export', label: 'Export' },
];

function initialsOf(name) {
  return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function Navbar({ activeView, onNavigate, onOpenSettings }) {
  const { currentUser, isAdmin, roleLabel, logout, users } = useAuth();
  const { periods, currentPeriodIndex, periodIndex, setPeriodIndex, region, setRegion, regions } = useAppState();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const pendingCount = users.filter(u => u.status === 'pending').length;
  const fullName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : '';

  useEffect(() => {
    function onDocClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const tabs = isAdmin ? [...TABS, { key: 'utilisateurs', label: 'Utilisateurs' }] : TABS;

  return (
    <div className="topnav">
      <div className="brand">
        <img className="brand-mark" src={logo} alt="Tunisie Telecom" />
        <div className="brand-text">
          <div className="t1">Telecom Performance Analytics</div>
        </div>
      </div>

      <div className="pill-nav">
        {tabs.map(t => (
          <button
            key={t.key}
            className={activeView === t.key ? 'active' : ''}
            onClick={() => onNavigate(t.key)}
          >
            {t.label}
            {t.key === 'utilisateurs' && pendingCount > 0 && (
              <span className="nav-badge" style={{ display: 'flex' }}>{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      <div className="nav-right">
        <select className="glass-select" value={periodIndex} onChange={e => setPeriodIndex(parseInt(e.target.value, 10))}>
          {periods.map((p, i) => {
            const tag = i === currentPeriodIndex ? ' (actuel)' : i > currentPeriodIndex ? ' (planifié)' : '';
            return <option key={p} value={i}>{p}{tag}</option>;
          })}
        </select>

        <select className="glass-select" value={region} onChange={e => setRegion(e.target.value)}>
          {regions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        <div className="user-menu" ref={dropdownRef}>
          <div className="avatar-btn" onClick={() => setDropdownOpen(o => !o)}>
            <div className="avatar-circle">{initialsOf(fullName || 'U')}</div>
            <div className="who">
              <span className="n">{fullName}</span>
              <span className="r">{roleLabel(currentUser)}</span>
            </div>
            <span>⌄</span>
          </div>

          {dropdownOpen && (
            <div className="avatar-dropdown open">
              <div className="ad-head">
                <div className="n">{fullName}</div>
                <div className="e">{currentUser?.email}</div>
                <span className={`role-tag ${currentUser?.role}`} style={{ marginTop: 6, display: 'inline-block' }}>
                  {roleLabel(currentUser)}
                </span>
              </div>
              <button className="ad-item" onClick={(e) => { e.stopPropagation(); setDropdownOpen(false); onOpenSettings(); }}>
                <span className="ic">⚙️</span> Paramètres
              </button>
              <button className="ad-item danger" onClick={(e) => { e.stopPropagation(); setDropdownOpen(false); logout(); }}>
                <span className="ic">⎋</span> Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
