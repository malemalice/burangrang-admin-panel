import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const { isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

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
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('An error occurred during login');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn(
      "flex min-h-screen",
      isDark ? "bg-gray-900" : "bg-slate-50"
    )}>
      {/* Left side with welcome message */}
      <div className="hidden md:flex md:w-1/2 bg-admin-primary text-white p-10 flex-col justify-between">
        <div className="mt-16">
          <h1 className="text-4xl font-bold mb-6">Welcome</h1>
          <p className="text-lg mb-6">
            to Office Nexus System - the world's leading open-source
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
            )}>Office Nexus</h2>
            <p className={cn(
              "text-sm mt-1",
              isDark ? "text-gray-400" : "text-slate-600"
            )}>made by your company</p>
          </div>

          {/* Demo credentials alert */}
          <Alert className={cn(
            "mb-6 border",
            isDark ? "bg-blue-900/20 border-blue-800 text-blue-300" : "bg-blue-50 border-blue-100"
          )}>
            <Info className={isDark ? "h-4 w-4 text-blue-400" : "h-4 w-4 text-blue-500"} />
            <AlertDescription className={cn(
              "text-sm", 
              isDark ? "text-blue-300" : "text-blue-700"
            )}>
              <strong>Email:</strong> admin@example.com<br />
              <strong>Password:</strong> password
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
                <Label htmlFor="email" className={isDark ? "text-gray-300" : ""}>* Email</Label>
                <Input 
                  id="email"
                  type="email"
                  placeholder="example@adminjs.co"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className={isDark ? "bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" : ""}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className={isDark ? "text-gray-300" : ""}>* Password</Label>
                <Input 
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className={isDark ? "bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" : ""}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-admin-primary hover:bg-admin-primary/90"
                disabled={isLoading}
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