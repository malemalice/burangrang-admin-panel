import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Edit, Trash2, ShieldCheck, Check, X } from 'lucide-react';
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
import userService, { UserDTO } from '@/services/userService';
import { User } from '@/lib/types';

const UserDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const userData = await userService.getUserById(id);
        if (!userData) {
          throw new Error('User not found');
        }
        setUser(userData);
      } catch (error: any) {
        console.error('Error fetching user:', error);
        const errorMessage = error.message || 'Failed to load user data';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    
    setIsDeleting(true);
    try {
      await userService.deleteUser(id);
      toast.success('User deleted successfully');
      navigate('/users');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      const errorMessage = error.message || 'Failed to delete user';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-red-500">{error || 'User not found'}</div>
        <Button variant="outline" onClick={() => navigate('/users')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="User Details"
        subtitle={`View details for ${user.name}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/users')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
            </Button>
            <Button onClick={() => navigate(`/users/${id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" /> Edit User
            </Button>
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete User
            </Button>
          </div>
        }
      />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>Basic information about the user</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{user.name}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Role</h4>
                <p className="mt-1">{user.role || 'No role assigned'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Office</h4>
                <p className="mt-1">{user.office || 'No office assigned'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                <div className="mt-1">
                  <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                    {user.status === 'active' ? (
                      <Check className="mr-1 h-3 w-3" />
                    ) : (
                      <X className="mr-1 h-3 w-3" />
                    )}
                    {user.status}
                  </Badge>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Last Login</h4>
                <p className="mt-1">{user.lastLogin || 'Never'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Additional account details</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Created At</h4>
              <p className="mt-1">{new Date(user.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Last Updated</h4>
              <p className="mt-1">{new Date(user.updatedAt).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone."
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        onConfirm={handleDelete}
        variant="destructive"
        icon={<Trash2 className="h-5 w-5 text-destructive" />}
      />
    </>
  );
};

export default UserDetailPage; 
