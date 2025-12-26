import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from './api';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string | { name: string; [key: string]: any };
}

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper functions for last visited URL
const LAST_VISITED_URL_KEY = 'last_visited_url';
const saveLastVisitedUrl = (url: string) => {
  // Only save if it's not a login or reset-password page
  // Extract pathname from URL (handle both pathname and pathname+search formats)
  const pathname = url.split('?')[0];
  if (!['/login', '/reset-password'].includes(pathname)) {
    localStorage.setItem(LAST_VISITED_URL_KEY, url);
  }
};
const getLastVisitedUrl = (): string | null => {
  return localStorage.getItem(LAST_VISITED_URL_KEY);
};
const clearLastVisitedUrl = () => {
  localStorage.removeItem(LAST_VISITED_URL_KEY);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Track route changes and save last visited URL for authenticated users
  useEffect(() => {
    if (isAuthenticated && !['/login', '/reset-password'].includes(location.pathname)) {
      saveLastVisitedUrl(location.pathname + location.search);
    }
  }, [location.pathname, location.search, isAuthenticated]);

  // Check if user is already authenticated on mount and route changes
  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (accessToken && refreshToken) {
        try {
          // Only call the refresh endpoint if the token needs refreshing
          const result = await authApi.checkAndRefreshAuth();
          
          if (result) {
            setUser(result.user);
            setIsAuthenticated(true);
            
            // If we were on login page, redirect to last visited URL or dashboard
            if (location.pathname === '/login') {
              const lastUrl = getLastVisitedUrl();
              if (lastUrl) {
                clearLastVisitedUrl();
                navigate(lastUrl);
              } else {
                navigate('/');
              }
            }
          } else {
            // This shouldn't happen but handle it just in case
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            setIsAuthenticated(false);
            setUser(null);
            
            if (location.pathname !== '/login') {
              // Save current URL before redirecting
              saveLastVisitedUrl(location.pathname + location.search);
              navigate('/login');
            }
          }
        } catch (error) {
          console.error('[Auth] Auth check failed:', error);
          // If token refresh fails, clear auth state
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setIsAuthenticated(false);
          setUser(null);
          
          if (location.pathname !== '/login') {
            console.log('[Auth] Redirecting to login page after auth failure');
            // Save current URL before redirecting
            saveLastVisitedUrl(location.pathname + location.search);
            navigate('/login');
          }
        }
      } else if (!['/login', '/reset-password'].includes(location.pathname)) {
        console.log('[Auth] No tokens found, redirecting to login');
        // Save current URL before redirecting
        saveLastVisitedUrl(location.pathname + location.search);
        // Redirect to login if not authenticated and not already on login page
        navigate('/login');
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, [navigate, location.pathname]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { user } = await authApi.login(email, password);
      
      setIsAuthenticated(true);
      setUser(user);
      toast.success('Login successful!');
      
      // Redirect to last visited URL or dashboard
      const lastUrl = getLastVisitedUrl();
      if (lastUrl) {
        clearLastVisitedUrl();
        navigate(lastUrl);
      } else {
        navigate('/');
      }
      
      return true;
    } catch (error) {
      console.error('[Auth] Login error:', error);
      toast.error('Login failed. Please check your credentials.');
      return false;
    }
  };

  const logout = async () => {
    try {
      // Save current URL before logout
      if (isAuthenticated && !['/login', '/reset-password'].includes(location.pathname)) {
        saveLastVisitedUrl(location.pathname + location.search);
      }
      
      await authApi.logout();
      toast.info('You have been logged out.');
    } catch (error) {
      console.error('[Auth] Logout error:', error);
    } finally {
      // Clear auth state regardless of API success
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setIsAuthenticated(false);
      setUser(null);
      navigate('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, user, isLoading }}>
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
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !['/login', '/reset-password'].includes(location.pathname)) {
      console.log('[ProtectedRoute] Not authenticated, redirecting to login');
      // Save current URL before redirecting
      saveLastVisitedUrl(location.pathname + location.search);
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate, location]);

  // Show nothing while checking authentication
  if (isLoading) return null;
  
  return isAuthenticated ? <>{children}</> : null;
}; 