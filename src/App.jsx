import React, { useState } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { useAppState } from './context/AppStateContext.jsx';
import AuthScreen from './components/AuthScreen.jsx';
import Navbar from './components/Navbar.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import OverviewView from './components/views/OverviewView.jsx';
import HistoriqueView from './components/views/HistoriqueView.jsx';
import ObjectifsView from './components/views/ObjectifsView.jsx';
import UtilisateursView from './components/views/UtilisateursView.jsx';
import ExportView from './components/views/ExportView.jsx';

function BootScreen({ children }) {
  return (
    <div className="shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="card" style={{ maxWidth: 420 }}>{children}</div>
    </div>
  );
}

export default function App() {
  const { currentUser, booting } = useAuth();
  const { loading, error } = useAppState();
  const [activeView, setActiveView] = useState('overview');
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (booting) {
    return <BootScreen><div className="hint">Chargement de la session…</div></BootScreen>;
  }

  if (!currentUser) return <AuthScreen />;

  if (loading) {
    return <BootScreen><div className="hint">Chargement des données…</div></BootScreen>;
  }

  if (error) {
    return <BootScreen><div className="auth-error show">{error}</div></BootScreen>;
  }

  function handleNavigate(view) {
    if (view === 'utilisateurs' && currentUser.role !== 'admin') { setActiveView('overview'); return; }
    setActiveView(view);
  }

  let content;
  switch (activeView) {
    case 'overview': content = <OverviewView onNavigate={handleNavigate} />; break;
    case 'historique': content = <HistoriqueView />; break;
    case 'objectifs': content = <ObjectifsView />; break;
    case 'utilisateurs': content = <UtilisateursView />; break;
    case 'export': content = <ExportView />; break;
    default: content = <OverviewView onNavigate={handleNavigate} />;
  }

  return (
    <div className="shell">
      <Navbar activeView={activeView} onNavigate={handleNavigate} onOpenSettings={() => setSettingsOpen(true)} />

      {content}

      <footer>
        <div>—</div>
      </footer>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
