import React, { useMemo, useState } from 'react';
import { ArrowLeft, Check, LockKeyhole, Sparkles, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { loadRememberedEmail } from '../utils/authStorage';
import { isValidEmail, validatePassword } from '../utils/validation';

const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState(loadRememberedEmail);
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, signup, loginWithGoogle } = useAuth();
  const passwordRules = useMemo(() => validatePassword(password), [password]);
  const emailValid = email.length === 0 || isValidEmail(email);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    if (!isValidEmail(email)) return setError('Enter a valid email address.');
    if (!passwordRules.valid) return setError(`Password must include: ${passwordRules.errors.join(', ')}.`);
    setLoading(true);
    try { if (isLogin) await login(email, password, rememberMe); else await signup(email, password, rememberMe); navigate('/dashboard'); }
    catch (err) { setError(err instanceof Error ? err.message : 'An error occurred. Please try again.'); }
    finally { setLoading(false); }
  };

  const ruleItem = (label: string, valid: boolean) => <li className={valid ? 'rule-valid' : ''} key={label}>{valid ? <Check size={13} /> : <X size={13} />}{label}</li>;

  return (
    <main className="auth-shell">
      <div className="auth-aside"><Link to="/" className="brand-mark"><span className="brand-mark-icon"><Sparkles size={16} /></span><span>VENT 0.2</span></Link><div className="auth-aside-copy"><p className="eyebrow"><span className="eyebrow-dot" /> A private pause</p><h1>Arrive as you are.</h1><p>There is no right way to begin. A sentence, a feeling, or simply a quiet moment is enough.</p></div><div className="auth-aside-footer"><LockKeyhole size={15} /> Your account keeps your space yours.</div></div>
      <section className="auth-panel"><Link to="/" className="back-link"><ArrowLeft size={16} /> Back to home</Link><div className="auth-form-wrap"><p className="section-kicker">{isLogin ? 'Welcome back' : 'A fresh start'}</p><h2>{isLogin ? 'Good to see you.' : 'Make space for yourself.'}</h2><p className="auth-subtitle">{isLogin ? 'Pick up wherever you left off.' : 'Create a private account in a minute.'}</p>{error && <div className="auth-error" role="alert">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form"><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={!emailValid ? 'input-error' : ''} placeholder="you@example.com" autoComplete="email" required /></label>{!emailValid && <span className="field-error">Use a valid email format.</span>}<label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" autoComplete={isLogin ? 'current-password' : 'new-password'} required /></label>{!isLogin && <ul className="password-rules">{ruleItem('8+ characters', password.length >= 8)}{ruleItem('Lowercase letter', /[a-z]/.test(password))}{ruleItem('Uppercase letter', /[A-Z]/.test(password))}{ruleItem('Number', /[0-9]/.test(password))}{ruleItem('Special character', /[^A-Za-z0-9]/.test(password))}</ul>}<label className="remember-row"><input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} /> Remember me on this device</label><button type="submit" className="primary-action auth-submit" disabled={loading}>{loading ? 'Please wait...' : isLogin ? 'Log in' : 'Create account'}</button></form>
        <div className="auth-divider"><span>or</span></div><button type="button" onClick={() => void loginWithGoogle()} className="google-action"><svg className="google-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.35 12.23c0-.72-.06-1.41-.18-2.08H12v3.94h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.2 2.91-7.25Z"/><path fill="#34A853" d="M12 21.7c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.93-3.31.93-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.7Z"/><path fill="#FBBC05" d="M6.54 13.79A5.84 5.84 0 0 1 6.23 12c0-.62.11-1.23.31-1.79V7.68H3.3A9.74 9.74 0 0 0 2.26 12c0 1.57.38 3.05 1.04 4.32l3.24-2.53Z"/><path fill="#EA4335" d="M12 6.18c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.27 14.63 2.3 12 2.3a9.74 9.74 0 0 0-8.7 5.38l3.24 2.53c.77-2.31 2.92-4.03 5.46-4.03Z"/></svg> Continue with Google</button><p className="auth-switch">{isLogin ? "Don't have an account?" : 'Already have an account?'} <button type="button" onClick={() => { setIsLogin(!isLogin); setError(''); }}>{isLogin ? 'Sign up' : 'Log in'}</button></p></div></section>
    </main>
  );
};

export default LoginPage;
