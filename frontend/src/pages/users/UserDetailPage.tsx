import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Edit, Trash2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import userService from '@/services/userService';
import { User } from '@/lib/types';

const UserDetailPage = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        if (!userId) {
          throw new Error('User ID is required');
        }
        
        const userData = await userService.getUserById(userId);
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        toast.error('Failed to load user data');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userId) {
      toast.error('User ID is required');
      return;
    }
    
    setIsDeleting(true);
    
    try {
      // Call the API to delete the user
      await userService.deleteUser(userId);
      
      toast.success(`User "${user?.name}" has been deleted`);
      setDeleteDialogOpen(false);
      navigate('/users');
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error('Failed to delete user. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Active', color: 'bg-green-100 text-green-800' },
      inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;

    return (
      <Badge variant="outline" className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <div className="h-8 w-8 rounded-full border-4 border-admin-primary/30 border-t-admin-primary animate-spin-slow" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px]">
        <h2 className="text-xl font-bold mb-2">User Not Found</h2>
        <p className="text-gray-500 mb-4">The user you're looking for doesn't exist or has been deleted.</p>
        <Button onClick={() => navigate('/users')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="User Details"
        subtitle={`View information for ${user.name}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/users')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
            </Button>
            <Button onClick={() => navigate(`/users/${userId}/edit`)}>
              <Edit className="mr-2 h-4 w-4" /> Edit User
            </Button>
            <Button variant="destructive" onClick={handleDeleteClick} disabled={isDeleting}>
              {isDeleting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </span>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </>
              )}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>User profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.avatar || ""} />
                <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-bold">{user.name}</h3>
                <p className="text-gray-500">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <ShieldCheck size={16} className="text-gray-500" />
                  <span>{user.role || 'User'}</span>
                  <span className="mx-2">•</span>
                  {getStatusBadge(user.status)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm font-medium text-gray-500">User ID</p>
                <p>{user.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <div>{getStatusBadge(user.status)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>System information about this user</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Last Login</p>
              <p>{user.lastLogin || 'Never'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Created At</p>
              <p>{user.createdAt || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Last Updated</p>
              <p>{user.updatedAt || 'Unknown'}</p>
            </div>
            {user.office && (
              <div>
                <p className="text-sm font-medium text-gray-500">Office</p>
                <p>{user.office}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete User"
        description={`Are you sure you want to delete ${user.name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
        icon={<Trash2 className="h-5 w-5 text-destructive" />}
      />
    </>
  );
};

export default UserDetailPage; 