import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import PageHeader from '@/core/components/ui/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { useAuth } from '@/core/lib/auth';
import api from '@/core/lib/api';
import { toast } from 'sonner';
import { User, Lock, Mail, Building2, Briefcase, Shield, ChevronDown, ChevronUp } from 'lucide-react';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Passwords do not match',
  path: ['confirmNewPassword'],
});

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

interface ProfileUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive?: boolean;
  role?: { name: string } | string;
  office?: { id: string; name: string } | null;
  department?: { id: string; name: string; code?: string } | null;
  jobPosition?: { id: string; name: string } | null;
  createdAt?: string;
  lastLoginAt?: string | null;
}

const Profile = () => {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoadingProfile(true);
        const { data } = await api.get<ProfileUser>('/users/me');
        setProfile(data);
      } catch {
        if (authUser) {
          setProfile({
            id: authUser.id,
            email: authUser.email,
            firstName: authUser.firstName,
            lastName: authUser.lastName,
            role: authUser.role,
          });
        }
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [authUser]);

  const roleName = profile?.role
    ? typeof profile.role === 'object' && profile.role !== null && 'name' in profile.role
      ? (profile.role as { name: string }).name
      : String(profile.role)
    : '—';

  const fullName = profile
    ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.email
    : '—';

  const onChangePassword = async (values: ChangePasswordFormValues) => {
    try {
      setChangingPassword(true);
      await api.post('/users/me/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success('Password changed successfully');
      reset();
      setShowChangePassword(false);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to change password. Check your current password.';
      toast.error(message);
    } finally {
      setChangingPassword(false);
    }
  };

  if (loadingProfile && !profile) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader title="Profile" />
        <div className="h-32 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Profile"
        subtitle="View your account details and change your password"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Your attributes
          </CardTitle>
          <CardDescription>Account and organization information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <p className="text-sm font-medium">{profile?.email ?? '—'}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Full name
              </Label>
              <p className="text-sm font-medium">{fullName}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Role
              </Label>
              <p className="text-sm font-medium">{roleName}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Office
              </Label>
              <p className="text-sm font-medium">{profile?.office?.name ?? '—'}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Department
              </Label>
              <p className="text-sm font-medium">
                {profile?.department
                  ? `${profile.department.name}${profile.department.code ? ` (${profile.department.code})` : ''}`
                  : '—'}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Job position
              </Label>
              <p className="text-sm font-medium">{profile?.jobPosition?.name ?? '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setShowChangePassword((v) => !v)}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change password
              </CardTitle>
              <CardDescription>
                {showChangePassword
                  ? 'Update your password. Use at least 6 characters for the new password.'
                  : 'Click to expand and update your password.'}
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={showChangePassword ? 'Collapse' : 'Expand'}
              onClick={(e) => {
                e.stopPropagation();
                setShowChangePassword((v) => !v);
              }}
            >
              {showChangePassword ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        {showChangePassword && (
          <CardContent>
            <form onSubmit={handleSubmit(onChangePassword)} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-1 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    {...register('currentPassword')}
                    className={errors.currentPassword ? 'border-destructive' : ''}
                  />
                  {errors.currentPassword && (
                    <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    autoComplete="new-password"
                    {...register('newPassword')}
                    className={errors.newPassword ? 'border-destructive' : ''}
                  />
                  {errors.newPassword && (
                    <p className="text-sm text-destructive">{errors.newPassword.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmNewPassword">Confirm new password</Label>
                  <Input
                    id="confirmNewPassword"
                    type="password"
                    autoComplete="new-password"
                    {...register('confirmNewPassword')}
                    className={errors.confirmNewPassword ? 'border-destructive' : ''}
                  />
                  {errors.confirmNewPassword && (
                    <p className="text-sm text-destructive">{errors.confirmNewPassword.message}</p>
                  )}
                </div>
              </div>
              <Button type="submit" disabled={changingPassword}>
                {changingPassword ? 'Changing…' : 'Change password'}
              </Button>
            </form>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default Profile;
