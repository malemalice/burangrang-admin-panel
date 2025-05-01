import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  user: { name: string; role: string } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = () => {
      // In a real app, check token validity from localStorage or cookies
      const token = localStorage.getItem('auth_token');
      if (token) {
        setIsAuthenticated(true);
        setUser({ name: 'Admin User', role: 'Administrator' });
      } else if (location.pathname !== '/login') {
        // Redirect to login if not authenticated and not already on login page
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate, location.pathname]);

  const login = async (email: string, password: string): Promise<boolean> => {
    // For demo purposes, any credentials work, but in a real app you'd validate credentials
    // with a server-side API
    if (email && password) {
      // Save a dummy token
      localStorage.setItem('auth_token', 'dummy_token');
      setIsAuthenticated(true);
      setUser({ name: 'Admin User', role: 'Administrator' });
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated && location.pathname !== '/login') {
      navigate('/login');
    }
  }, [isAuthenticated, navigate, location]);

  return isAuthenticated ? <>{children}</> : null;
}; 