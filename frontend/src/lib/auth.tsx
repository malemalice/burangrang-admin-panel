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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is already authenticated on mount and route changes
  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      
      console.log('[Auth] Checking authentication state:', { 
        hasAccessToken: !!accessToken, 
        hasRefreshToken: !!refreshToken,
        currentPath: location.pathname,
        isAccessTokenValid: authApi.hasValidAccessToken()
      });
      
      if (accessToken && refreshToken) {
        try {
          // Only call the refresh endpoint if the token needs refreshing
          const result = await authApi.checkAndRefreshAuth();
          
          if (result) {
            console.log('[Auth] Auth check successful, user:', result.user);
            setUser(result.user);
            setIsAuthenticated(true);
            
            // If we were on login page, redirect to dashboard
            if (location.pathname === '/login') {
              console.log('[Auth] Redirecting from login to dashboard');
              navigate('/');
            }
          } else {
            console.log('[Auth] Auth check returned no user, logging out');
            // This shouldn't happen but handle it just in case
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            setIsAuthenticated(false);
            setUser(null);
            
            if (location.pathname !== '/login') {
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
            navigate('/login');
          }
        }
      } else if (location.pathname !== '/login') {
        console.log('[Auth] No tokens found, redirecting to login');
        // Redirect to login if not authenticated and not already on login page
        navigate('/login');
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, [navigate, location.pathname]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('[Auth] Attempting login for:', email);
      const { user } = await authApi.login(email, password);
      
      console.log('[Auth] Login successful:', user);
      setIsAuthenticated(true);
      setUser(user);
      toast.success('Login successful!');
      return true;
    } catch (error) {
      console.error('[Auth] Login error:', error);
      toast.error('Login failed. Please check your credentials.');
      return false;
    }
  };

  const logout = async () => {
    try {
      console.log('[Auth] Logging out');
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
    if (!isLoading && !isAuthenticated && location.pathname !== '/login') {
      console.log('[ProtectedRoute] Not authenticated, redirecting to login');
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate, location]);

  // Show nothing while checking authentication
  if (isLoading) return null;
  
  return isAuthenticated ? <>{children}</> : null;
}; 