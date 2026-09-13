import React, { useState, useEffect, ReactNode } from 'react';
import {
  clearSession,
  loadToken,
  persistToken,
} from '../utils/authStorage';
import { isValidEmail, validatePassword } from '../utils/validation';
import * as authService from '../services/authService';
import { AuthContext } from './authContextDefinition';

export interface User {
  email: string;
  id: string;
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = loadToken();
    if (!token) {
      setLoading(false);
      return;
    }
    authService.restoreSession(token)
      .then(({ user: restoredUser }) => setUser(restoredUser))
      .catch(() => clearSession())
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string, rememberMe = false) => {
    if (!isValidEmail(email)) {
      throw new Error('Enter a valid email address.');
    }
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      throw new Error(`Password must include: ${passwordCheck.errors.join(', ')}.`);
    }
    const result = await authService.login(email, password);
    persistToken(result.token, rememberMe);
    localStorage.setItem('vent_remembered_email', rememberMe ? email.trim().toLowerCase() : '');
    setUser(result.user);
  };

  const signup = async (email: string, password: string, rememberMe = false) => {
    if (!isValidEmail(email)) {
      throw new Error('Enter a valid email address.');
    }
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      throw new Error(`Password must include: ${passwordCheck.errors.join(', ')}.`);
    }
    const result = await authService.signup(email, password);
    persistToken(result.token, rememberMe);
    localStorage.setItem('vent_remembered_email', rememberMe ? email.trim().toLowerCase() : '');
    setUser(result.user);
  };

  const logout = async () => {
    const token = loadToken();
    if (token) await authService.logout(token);
    clearSession();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
