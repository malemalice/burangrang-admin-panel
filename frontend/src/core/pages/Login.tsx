import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Alert, AlertDescription } from "@/core/components/ui/alert";
import { Info } from "lucide-react";
import { useAuth } from '@/core/lib/auth';
import { useTheme } from '@/core/lib/theme';
import { themeColors, getContrastTextColor } from '@/core/lib/theme/colors';
import { cn } from '@/core/lib/utils';
import { useAppName } from '@/modules/settings/hooks/useSettings';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const { isDark, theme } = useTheme();
  const { appName } = useAppName();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Get theme colors for dynamic styling
  const currentThemeColor = themeColors[theme]?.primary || '#6366f1';
  const textColor = getContrastTextColor(currentThemeColor);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Simple validation
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        navigate('/');
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError('An error occurred during login');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Skip rendering if auth state is still loading
  if (authLoading) {
    return null;
  }

  return (
    <div className={cn(
      "flex min-h-screen",
      isDark ? "bg-gray-900" : "bg-slate-50"
    )}>
      {/* Left side with welcome message */}
      <div
        className="hidden md:flex md:w-1/2 p-10 flex-col justify-between"
        style={{
          backgroundColor: currentThemeColor,
          color: textColor
        }}
      >
        <div className="mt-16">
          <h1 className="text-4xl font-bold mb-6">Welcome</h1>
          <p className="text-lg mb-6">
            to {appName} System - the world's leading open-source
            admin panel for your Node.js application that allows you to manage all your
            data in one place
          </p>
        </div>
        
        <div className="flex justify-center mb-12">
          {/* Simple illustration icons */}
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 w-24 border-2 border-white/50 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="5" />
                <path d="M3 21v-2a7 7 0 0 1 14 0v2" />
              </svg>
            </div>
            <div className="h-24 w-24 border-2 border-white/50 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M20.4 14.5L16 10 4 20" />
              </svg>
            </div>
            <div className="h-24 w-24 border-2 border-white/50 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Right side with login form */}
      <div className={cn(
        "w-full md:w-1/2 flex flex-col justify-center items-center p-8",
        isDark ? "bg-gray-900" : "bg-white"
      )}>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className={cn(
              "text-3xl font-bold",
              isDark ? "text-white" : "text-slate-900"
            )}>{appName}</h2>
            <p className={cn(
              "text-sm mt-1",
              isDark ? "text-gray-400" : "text-slate-600"
            )}>made by your company</p>
          </div>

          {/* Demo credentials alert */}
          <Alert className={cn(
            "mb-6 border",
            isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"
          )}>
            <Info
              className="h-4 w-4"
              style={{ color: currentThemeColor }}
            />
            <AlertDescription className={cn(
              "text-sm",
              isDark ? "text-gray-300" : "text-gray-700"
            )}>
              <strong>Email:</strong> admin@example.com<br />
              <strong>Password:</strong> admin123
            </AlertDescription>
          </Alert>

          {error && (
            <Alert className={cn(
              "mb-6 border",
              isDark ? "bg-red-900/20 border-red-800" : "bg-red-50 border-red-200"
            )}>
              <AlertDescription className={cn(
                "text-sm",
                isDark ? "text-red-300" : "text-red-700"
              )}>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className={isDark ? "text-gray-300" : ""}
                  style={{ color: isDark ? undefined : currentThemeColor }}
                >
                  * Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@adminjs.co"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className={isDark ? "bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" : ""}
                  style={{
                    borderColor: currentThemeColor + '40',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = currentThemeColor;
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${currentThemeColor}20`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = currentThemeColor + '40';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
              
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className={isDark ? "text-gray-300" : ""}
                  style={{ color: isDark ? undefined : currentThemeColor }}
                >
                  * Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className={isDark ? "bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" : ""}
                  style={{
                    borderColor: currentThemeColor + '40',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = currentThemeColor;
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${currentThemeColor}20`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = currentThemeColor + '40';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                style={{
                  backgroundColor: currentThemeColor,
                  color: textColor,
                }}
                disabled={isLoading}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = currentThemeColor + 'E0'; // Add opacity
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = currentThemeColor;
                }}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login; 