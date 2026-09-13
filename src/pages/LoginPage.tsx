import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X } from 'lucide-react';
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
  const { login, signup } = useAuth();

  const passwordRules = useMemo(() => validatePassword(password), [password]);
  const emailValid = email.length === 0 || isValidEmail(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }

    if (!passwordRules.valid) {
      setError(`Password must include: ${passwordRules.errors.join(', ')}.`);
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password, rememberMe);
      } else {
        await signup(email, password, rememberMe);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const ruleItem = (label: string, ok: boolean) => (
    <li className={`flex items-center text-xs ${ok ? 'text-green-700' : 'text-gray-600'}`}>
      {ok ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1 opacity-50" />}
      {label}
    </li>
  );

  return (
    <div className="holographic-bg min-h-screen flex flex-col items-center justify-center px-4">
      <div className="glass-effect p-8 w-full max-w-md animate-fadeIn">
        <div className="mb-6">
          <Link to="/" className="text-black flex items-center opacity-70 hover:opacity-100 transition-opacity">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Link>
        </div>

        <h1 className="text-2xl font-medium text-black text-center mb-2">ready when you are</h1>
        <p className="text-black text-center mb-8 opacity-70">your safe space, one convo at a time</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-black mb-1">email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`form-input ${!emailValid ? 'border-red-400' : ''}`}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
            {!emailValid && <p className="text-xs text-red-600 mt-1">Use a valid email format.</p>}
          </div>

          <div>
            <label className="block text-black mb-1">password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="password"
              required
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
            <ul className="mt-2 space-y-1 bg-white/40 rounded-lg p-3">
              {ruleItem('At least 8 characters', password.length >= 8)}
              {ruleItem('One lowercase letter', /[a-z]/.test(password))}
              {ruleItem('One uppercase letter', /[A-Z]/.test(password))}
              {ruleItem('One number', /[0-9]/.test(password))}
              {ruleItem('One special character', /[^A-Za-z0-9]/.test(password))}
            </ul>
          </div>

          <label className="flex items-center gap-2 text-sm text-black cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded"
            />
            Remember me on this device
          </label>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'log in' : 'sign up'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setIsLogin(false);
              setError('');
            }}
            className="text-black hover:underline text-sm"
            style={{ display: isLogin ? 'block' : 'none' }}
          >
            don't have an account? sign up
          </button>
          <button
            onClick={() => {
              setIsLogin(true);
              setError('');
            }}
            className="text-black hover:underline text-sm"
            style={{ display: isLogin ? 'none' : 'block' }}
          >
            already have an account? log in
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
