import React, { createContext, useContext, useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { authApi, validateEmbedToken, getEmbedSession } from './api';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyId?: string | null;
  role: string | { name: string; [key: string]: unknown };
  permissions?: string[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  user: User | null;
  isLoading: boolean;
  /** True when URL had a valid embed_token; allows showing login form instead of redirect. */
  isEmbedContext: boolean;
  /** True when embed token was invalid and we are inside an iframe (show error). */
  embedUnauthorized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper functions for last visited URL
const LAST_VISITED_URL_KEY = 'last_visited_url';

/** Paths that must not trigger login redirect when unauthenticated */
export const isAuthExemptPath = (pathname: string) =>
  ['/login', '/reset-password'].includes(pathname) ||
  pathname.startsWith('/health-screenings/public/') ||
  pathname.startsWith('/work-permits/public/');

const saveLastVisitedUrl = (url: string) => {
  // Extract pathname from URL (handle both pathname and pathname+search formats)
  const pathname = url.split('?')[0];
  if (!isAuthExemptPath(pathname)) {
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
  const [isEmbedContext, setIsEmbedContext] = useState<boolean>(false);
  const [embedUnauthorized, setEmbedUnauthorized] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const embedTokenFromUrl = searchParams.get('embed_token');

  // Track route changes and save last visited URL for authenticated users
  useEffect(() => {
    if (isAuthenticated && !isAuthExemptPath(location.pathname)) {
      saveLastVisitedUrl(location.pathname + location.search);
    }
  }, [location.pathname, location.search, isAuthenticated]);

  // Check if user is already authenticated on mount and route changes; validate embed token if present
  useEffect(() => {
    const checkAuth = async () => {
      setEmbedUnauthorized(false);
      setIsEmbedContext(false);

      let hadValidEmbedToken = false;

      if (embedTokenFromUrl) {
        try {
          const valid = await validateEmbedToken(embedTokenFromUrl);
          if (!valid) {
            const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
            setEmbedUnauthorized(isInIframe);
            if (!isInIframe && !isAuthExemptPath(location.pathname)) {
              saveLastVisitedUrl(location.pathname + location.search);
              navigate('/login');
            }
            setIsLoading(false);
            return;
          }
          hadValidEmbedToken = true;
          setIsEmbedContext(true);
        } catch {
          const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
          setEmbedUnauthorized(isInIframe);
          if (!isInIframe && !isAuthExemptPath(location.pathname)) {
            saveLastVisitedUrl(location.pathname + location.search);
            navigate('/login');
          }
          setIsLoading(false);
          return;
        }
      }

      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');

      if (accessToken && refreshToken) {
        try {
          const result = await authApi.checkAndRefreshAuth();

          if (result) {
            setUser(result.user);
            setIsAuthenticated(true);

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
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            setIsAuthenticated(false);
            setUser(null);

            if (!isAuthExemptPath(location.pathname)) {
              saveLastVisitedUrl(location.pathname + location.search);
              navigate('/login');
            }
          }
        } catch (error) {
          console.error('[Auth] Auth check failed:', error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setIsAuthenticated(false);
          setUser(null);

          if (!isAuthExemptPath(location.pathname)) {
            saveLastVisitedUrl(location.pathname + location.search);
            navigate('/login');
          }
        }
      } else {
        // No JWT - for embed context, exchange embed token for session (seamless access)
        if (hadValidEmbedToken && embedTokenFromUrl) {
          try {
            const { user: embedUser } = await getEmbedSession(embedTokenFromUrl);
            setUser(embedUser as User);
            setIsAuthenticated(true);
          } catch {
            const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
            setEmbedUnauthorized(isInIframe);
            if (!isInIframe && !isAuthExemptPath(location.pathname)) {
              saveLastVisitedUrl(location.pathname + location.search);
              navigate('/login');
            }
          }
        } else if (!isAuthExemptPath(location.pathname)) {
          console.log('[Auth] No tokens found, redirecting to login');
          saveLastVisitedUrl(location.pathname + location.search);
          navigate('/login');
        }
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [navigate, location.pathname, location.search, embedTokenFromUrl]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { user } = await authApi.login(email, password);

      setIsAuthenticated(true);
      setUser(user);
      toast.success('Login successful!');

      const lastUrl = getLastVisitedUrl();
      const search = location.search || '';
      const preserveEmbed = isEmbedContext && search;

      if (lastUrl) {
        clearLastVisitedUrl();
        navigate(preserveEmbed ? `${lastUrl}${lastUrl.includes('?') ? '&' : '?'}${search.slice(1)}` : lastUrl);
      } else {
        navigate(preserveEmbed ? `/${search}` : '/');
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
      if (isAuthenticated && !isAuthExemptPath(location.pathname)) {
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
    <AuthContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        user,
        isLoading,
        isEmbedContext,
        embedUnauthorized,
      }}
    >
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
  const { isAuthenticated, isLoading, isEmbedContext, embedUnauthorized } = useAuth();
  const location = useLocation();

  const isExempt = isAuthExemptPath(location.pathname);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (embedUnauthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-center text-muted-foreground">Embed not authorized</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (isExempt) return <>{children}</>;
    saveLastVisitedUrl(location.pathname + location.search);
    const next = isEmbedContext && location.search ? `/login${location.search}` : '/login';
    return <Navigate to={next} replace />;
  }

  return <>{children}</>;
}; 