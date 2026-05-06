import { createContext, useContext, useState, useEffect } from 'react';
import {
  getToken, saveToken, removeToken,
  getUserRole, getUserEmail, isTokenExpired
} from '../utils/tokenUtils';
import { ROLES, ROUTES } from '../utils/constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(getToken());
  const [role, setRole] = useState(getUserRole());
  const [email, setEmail] = useState(getUserEmail());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getToken();
    if (stored && !isTokenExpired()) {
      setToken(stored);
      setRole(getUserRole());
      setEmail(getUserEmail());
    } else {
      removeToken();
      setToken(null);
      setRole(null);
      setEmail(null);
    }
    setLoading(false);
  }, []);

  const login = (jwtToken) => {
    saveToken(jwtToken);
    setToken(jwtToken);
    setRole(getUserRole());
    setEmail(getUserEmail());
  };

  const logout = () => {
    removeToken();
    localStorage.removeItem('userId');
    localStorage.removeItem('providerId');
    setToken(null);
    setRole(null);
    setEmail(null);
    window.location.href = ROUTES.LOGIN;
  };

  const isAuthenticated = () => {
    return !!token && !isTokenExpired();
  };

  const isPatient = () => role === ROLES.PATIENT;
  const isProvider = () => role === ROLES.PROVIDER;
  const isAdmin = () => role === ROLES.ADMIN;

  return (
    <AuthContext.Provider value={{
      token, role, email, loading,
      login, logout,
      isAuthenticated,
      isPatient, isProvider, isAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
};
