import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useAppState } from '../context/AppStateContext.jsx';
import logo from '../assets/logo.png';

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
      <button type="button" className="input-toggle" onClick={() => setVisible(v => !v)} aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
        <EyeIcon off={visible} />
      </button>
    </div>
  );
}

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
      <div className="auth-card">
        <div className="auth-brand">
          <img className="brand-mark" src={logo} alt="Tunisie Telecom" />
          <div className="brand-text">
            <div className="t1">Telecom Performance Analytics</div>
          </div>
        </div>

        {panel === 'login' && (
          <form className="auth-panel active" onSubmit={handleLogin}>
            <h2>Connexion</h2>
            <div className="sub">Accédez à votre tableau de bord.</div>
            {loginError && <div className="auth-error show">{loginError}</div>}
            {loginInfo && <div className="auth-info show">{loginInfo}</div>}

            <label htmlFor="loginEmail">Adresse e-mail</label>
            <div className="input-group">
              <span className="input-ic"><MailIcon /></span>
              <input type="email" id="loginEmail" placeholder="vous@exemple.tn"
                value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
            </div>

            <label htmlFor="loginPassword">Mot de passe</label>
            <PasswordField id="loginPassword" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />

            <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
              {submitting ? 'Connexion…' : <>Se connecter <span className="auth-submit-arrow">→</span></>}
            </button>
            <div className="auth-switch">
              Pas encore de compte ? <a onClick={() => switchTo('signup')}>Créer un compte</a>
            </div>
          </form>
        )}

        {panel === 'signup' && (
          <form className="auth-panel active" onSubmit={handleSignup}>
            <h2>Créer un compte</h2>
            <div className="sub">Votre compte sera activé après validation par un administrateur.</div>
            {signupError && <div className="auth-error show">{signupError}</div>}

            <div className="auth-row2">
              <div>
                <label htmlFor="signupFirstName">Prénom</label>
                <input type="text" id="signupFirstName" placeholder="Prénom"
                  value={signupFirstName} onChange={e => setSignupFirstName(e.target.value)} />
              </div>
              <div>
                <label htmlFor="signupLastName">Nom</label>
                <input type="text" id="signupLastName" placeholder="Nom"
                  value={signupLastName} onChange={e => setSignupLastName(e.target.value)} />
              </div>
            </div>

            <label htmlFor="signupEmail">Adresse e-mail</label>
            <div className="input-group">
              <span className="input-ic"><MailIcon /></span>
              <input type="email" id="signupEmail" placeholder="vous@exemple.tn"
                value={signupEmail} onChange={e => setSignupEmail(e.target.value)} />
            </div>

            <label htmlFor="signupRegion">Site / Région</label>
            <select id="signupRegion" value={signupRegion} onChange={e => setSignupRegion(e.target.value)}>
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            <div className="auth-row2">
              <div>
                <label htmlFor="signupPassword">Mot de passe</label>
                <PasswordField id="signupPassword" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} />
              </div>
              <div>
                <label htmlFor="signupConfirm">Confirmer</label>
                <PasswordField id="signupConfirm" value={signupConfirm} onChange={e => setSignupConfirm(e.target.value)} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
              {submitting ? 'Création…' : <>Créer mon compte <span className="auth-submit-arrow">→</span></>}
            </button>
            <div className="auth-switch">
              Déjà un compte ? <a onClick={() => switchTo('login')}>Se connecter</a>
            </div>
          </form>
        )}

        {panel === 'pending' && (
          <div className="auth-panel active">
            <h2>Compte créé ✓</h2>
            <div className="sub" style={{ marginBottom: 4 }}>
              Votre compte <b>{pendingEmail}</b> a été créé avec succès et est en attente d'approbation par un administrateur.
              Vous recevrez l'accès dès qu'un rôle (Manager ou Administrateur) vous aura été attribué.
            </div>
            <button type="button" className="btn btn-ghost auth-submit" style={{ marginTop: 16 }} onClick={() => switchTo('login')}>
              Retour à la connexion
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
