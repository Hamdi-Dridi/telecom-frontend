import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useAppState } from '../context/AppStateContext.jsx';
import logo from '../assets/logo.png';

/* ── SVG Icons ──────────────────────────────────────────────────── */
function MailIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2.5" y="4.5" width="15" height="11" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3.5 5.5l6.5 5 6.5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4.5" y="9" width="11" height="8" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6.5 9V6.5a3.5 3.5 0 0 1 7 0V9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3.5 17c0-3.314 2.91-6 6.5-6s6.5 2.686 6.5 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 2.5C10 2.5 7.5 6 7.5 10s2.5 7.5 2.5 7.5M10 2.5C10 2.5 12.5 6 12.5 10S10 17.5 10 17.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.5 10h15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function EyeIcon({ off }) {
  return off ? (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.5 10S5.5 4.5 10 4.5 17.5 10 17.5 10 14.5 15.5 10 15.5 2.5 10 2.5 10Z" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="10" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3 3l14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.5 10S5.5 4.5 10 4.5 17.5 10 17.5 10 14.5 15.5 10 15.5 2.5 10 2.5 10Z" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="10" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

/* ── Password field with show/hide toggle ───────────────────────── */
function PasswordField({ id, value, onChange, placeholder = '••••••••' }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="input-group">
      <span className="input-ic"><LockIcon /></span>
      <input
        type={visible ? 'text' : 'password'}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
      <button
        type="button"
        className="input-toggle"
        onClick={() => setVisible(v => !v)}
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
      >
        <EyeIcon off={visible} />
      </button>
    </div>
  );
}

/* ── Left decorative panel ──────────────────────────────────────── */
function AuthLeftPanel() {
  return (
    <div className="auth-left">
      {/* Ambient blobs */}
      <div className="auth-left-blob auth-left-blob--a" />
      <div className="auth-left-blob auth-left-blob--b" />
      <div className="auth-left-blob auth-left-blob--c" />

      {/* Brand */}
      <div className="auth-left-brand">
        <img src={logo} alt="Tunisie Telecom" className="auth-left-logo" />
        <span className="auth-left-title">Telecom Performance Analytics</span>
      </div>

      {/* Tagline */}
      <div className="auth-left-tagline">
        Pilotez la qualité réseau<br />de <strong>Tunisie Telecom</strong> en temps réel.
      </div>

      {/* Feature pills */}
      <div className="auth-left-features">
        {[
          { icon: '📊', label: 'Tableaux de bord en temps réel' },
          { icon: '📍', label: 'Suivi régional & multi-sites' },
          { icon: '🎯', label: 'Objectifs KPI automatisés' },
          { icon: '📄', label: 'Rapports PDF professionnels' },
        ].map(f => (
          <div key={f.label} className="auth-left-pill">
            <span>{f.icon}</span>
            <span>{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Auth Screen ───────────────────────────────────────────── */
export default function AuthScreen() {
  const { login, signup } = useAuth();
  const { regions } = useAppState();
  const [panel, setPanel] = useState('login'); // 'login' | 'signup' | 'pending'

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginInfo, setLoginInfo] = useState('');

  const [signupFirstName, setSignupFirstName] = useState('');
  const [signupLastName, setSignupLastName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupRegion, setSignupRegion] = useState(regions[0] || 'Grand Tunis');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [signupError, setSignupError] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function switchTo(p) {
    setPanel(p);
    setLoginError(''); setLoginInfo(''); setSignupError('');
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError(''); setLoginInfo('');
    if (!loginEmail || !loginPassword) {
      setLoginError('Merci de renseigner votre e-mail et votre mot de passe.');
      return;
    }
    setSubmitting(true);
    const result = await login(loginEmail, loginPassword);
    setSubmitting(false);
    if (!result.ok) {
      if (result.reason === 'pending') setLoginInfo("Votre compte est en attente d'approbation par un administrateur.");
      else if (result.reason === 'suspended') setLoginError('Votre compte a été suspendu. Contactez un administrateur.');
      else setLoginError(result.message || 'E-mail ou mot de passe incorrect.');
      return;
    }
    setLoginEmail(''); setLoginPassword('');
  }

  async function handleSignup(e) {
    e.preventDefault();
    setSignupError('');
    if (!signupFirstName || !signupLastName || !signupEmail || !signupPassword) {
      setSignupError('Merci de remplir tous les champs obligatoires.'); return;
    }
    if (!/^\S+@\S+\.\S+$/.test(signupEmail)) { setSignupError('Adresse e-mail invalide.'); return; }
    if (signupPassword.length < 6) { setSignupError('Le mot de passe doit contenir au moins 6 caractères.'); return; }
    if (signupPassword !== signupConfirm) { setSignupError('Les mots de passe ne correspondent pas.'); return; }
    setSubmitting(true);
    const result = await signup({
      firstName: signupFirstName, lastName: signupLastName, email: signupEmail,
      password: signupPassword, region: signupRegion,
    });
    setSubmitting(false);
    if (!result.ok) { setSignupError(result.message || 'Un compte existe déjà avec cet e-mail.'); return; }
    setPendingEmail(signupEmail);
    setSignupFirstName(''); setSignupLastName(''); setSignupEmail('');
    setSignupPassword(''); setSignupConfirm('');
    switchTo('pending');
  }

  return (
    <div className="auth-screen open">
      <div className="auth-shell">
        {/* ── Left decorative panel ── */}
        <AuthLeftPanel />

        {/* ── Right form panel ── */}
        <div className="auth-right">

          {/* Mobile-only brand (left panel hidden on small screens) */}
          <div className="auth-right-mobile-brand">
            <img src={logo} alt="Tunisie Telecom" style={{ height: 28 }} />
            <span>Telecom Performance Analytics</span>
          </div>

          {/* ── Login form ── */}
          {panel === 'login' && (
            <form className="auth-panel active" onSubmit={handleLogin}>
              <div className="auth-form-header">
                <div className="auth-form-icon">
                  <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
                    <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6"/>
                    <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <h2>Bon retour</h2>
                  <div className="auth-form-sub">Connectez-vous à votre espace analytique.</div>
                </div>
              </div>

              {loginError && <div className="auth-error show">{loginError}</div>}
              {loginInfo  && <div className="auth-info show">{loginInfo}</div>}

              <div className="auth-field">
                <label htmlFor="loginEmail">Adresse e-mail</label>
                <div className="input-group">
                  <span className="input-ic"><MailIcon /></span>
                  <input type="email" id="loginEmail" placeholder="vous@exemple.tn"
                    value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="loginPassword">Mot de passe</label>
                <PasswordField id="loginPassword" value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)} />
              </div>

              <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
                {submitting
                  ? <><span className="auth-spinner" />Connexion…</>
                  : <>Se connecter <span className="auth-submit-arrow">→</span></>}
              </button>

              <div className="auth-divider"><span>Pas encore de compte ?</span></div>
              <button type="button" className="auth-switch-btn" onClick={() => switchTo('signup')}>
                Créer un compte
              </button>
            </form>
          )}

          {/* ── Sign-up form ── */}
          {panel === 'signup' && (
            <form className="auth-panel active" onSubmit={handleSignup}>
              <div className="auth-form-header">
                <div className="auth-form-icon auth-form-icon--teal">
                  <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
                    <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6"/>
                    <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                    <path d="M19 5v4M17 7h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <h2>Créer un compte</h2>
                  <div className="auth-form-sub">Votre accès sera activé après validation.</div>
                </div>
              </div>

              {signupError && <div className="auth-error show">{signupError}</div>}

              <div className="auth-row2">
                <div className="auth-field">
                  <label htmlFor="signupFirstName">Prénom</label>
                  <div className="input-group">
                    <span className="input-ic"><UserIcon /></span>
                    <input type="text" id="signupFirstName" placeholder="Prénom"
                      value={signupFirstName} onChange={e => setSignupFirstName(e.target.value)} />
                  </div>
                </div>
                <div className="auth-field">
                  <label htmlFor="signupLastName">Nom</label>
                  <div className="input-group">
                    <span className="input-ic"><UserIcon /></span>
                    <input type="text" id="signupLastName" placeholder="Nom"
                      value={signupLastName} onChange={e => setSignupLastName(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="signupEmail">Adresse e-mail</label>
                <div className="input-group">
                  <span className="input-ic"><MailIcon /></span>
                  <input type="email" id="signupEmail" placeholder="vous@exemple.tn"
                    value={signupEmail} onChange={e => setSignupEmail(e.target.value)} />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="signupRegion">Site / Région</label>
                <div className="input-group">
                  <span className="input-ic"><GlobeIcon /></span>
                  <select id="signupRegion" value={signupRegion}
                    onChange={e => setSignupRegion(e.target.value)}
                    style={{ paddingLeft: 40 }}>
                    {regions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div className="auth-row2">
                <div className="auth-field">
                  <label htmlFor="signupPassword">Mot de passe</label>
                  <PasswordField id="signupPassword" value={signupPassword}
                    onChange={e => setSignupPassword(e.target.value)} />
                </div>
                <div className="auth-field">
                  <label htmlFor="signupConfirm">Confirmer</label>
                  <PasswordField id="signupConfirm" value={signupConfirm}
                    onChange={e => setSignupConfirm(e.target.value)} />
                </div>
              </div>

              <button type="submit" className="btn btn-primary auth-submit auth-submit--teal" disabled={submitting}>
                {submitting
                  ? <><span className="auth-spinner" />Création…</>
                  : <>Créer mon compte <span className="auth-submit-arrow">→</span></>}
              </button>

              <div className="auth-divider"><span>Déjà un compte ?</span></div>
              <button type="button" className="auth-switch-btn" onClick={() => switchTo('login')}>
                Se connecter
              </button>
            </form>
          )}

          {/* ── Pending confirmation ── */}
          {panel === 'pending' && (
            <div className="auth-panel active auth-pending">
              <div className="auth-pending-icon">✓</div>
              <h2>Compte créé avec succès</h2>
              <div className="auth-form-sub" style={{ marginTop: 8 }}>
                Votre compte <strong>{pendingEmail}</strong> est en attente d'approbation par un administrateur.
                Vous recevrez l'accès dès qu'un rôle vous aura été attribué.
              </div>
              <button type="button" className="btn btn-ghost auth-submit"
                style={{ marginTop: 24 }} onClick={() => switchTo('login')}>
                ← Retour à la connexion
              </button>
            </div>
          )}

          <div className="auth-right-footer">
            © {new Date().getFullYear()} Tunisie Telecom — Tous droits réservés
          </div>
        </div>
      </div>
    </div>
  );
}
