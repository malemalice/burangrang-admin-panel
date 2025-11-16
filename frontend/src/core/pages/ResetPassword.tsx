import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Alert, AlertDescription } from "@/core/components/ui/alert";
import { useTheme } from '@/core/lib/theme';
import { themeColors, getContrastTextColor } from '@/core/lib/theme/colors';
import { cn } from '@/core/lib/utils';
import api from '@/core/lib/api';
import { toast } from 'sonner';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const { isDark, theme } = useTheme();
  const [newPassword, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const currentThemeColor = themeColors[theme]?.primary || '#6366f1';
  const textColor = getContrastTextColor(currentThemeColor);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing token');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!token) {
      setError('Invalid or missing token');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError('Please fill all fields');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const resp = await api.post('/auth/reset-password', { token, newPassword: newPassword });
      const message = resp?.data?.message || 'Password has been reset successfully';
      setInfoMessage(message);
      toast.success(message);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to reset password';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn(
      "flex min-h-screen items-center justify-center",
      isDark ? "bg-gray-900" : "bg-slate-50"
    )}>
      <div className={cn(
        "w-full max-w-md rounded-lg p-8 shadow",
        isDark ? "bg-gray-900" : "bg-white"
      )}>
        <div className="text-center mb-8">
          <h2 className={cn(
            "text-3xl font-bold",
            isDark ? "text-white" : "text-slate-900"
          )}>Reset Password</h2>
          <p className={cn(
            "text-sm mt-1",
            isDark ? "text-gray-400" : "text-slate-600"
          )}>Enter your new password</p>
        </div>

        {infoMessage && (
          <Alert className={cn(
            "mb-6 border",
            isDark ? "bg-emerald-900/20 border-emerald-800" : "bg-emerald-50 border-emerald-200"
          )}>
            <AlertDescription className={cn(
              "text-sm",
              isDark ? "text-emerald-300" : "text-emerald-700"
            )}>{infoMessage}</AlertDescription>
          </Alert>
        )}

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
                htmlFor="password"
                className={isDark ? "text-gray-300" : ""}
                style={{ color: isDark ? undefined : currentThemeColor }}
              >
                * New Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
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
            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className={isDark ? "text-gray-300" : ""}
                style={{ color: isDark ? undefined : currentThemeColor }}
              >
                * Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              disabled={isLoading || !token}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = currentThemeColor + 'E0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = currentThemeColor;
              }}
            >
              {isLoading ? 'Saving...' : 'Reset Password'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;

