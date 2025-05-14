import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import userService from '@/services/userService';
import type { User } from '@/lib/types';

const UserDetailPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchUser = async () => {
        if (!userId) {
        setError('User ID is required');
        setLoading(false);
        return;
        }
        
      try {
        setLoading(true);
        setError(null);
        const userData = await userService.getUserById(userId);
        setUser(userData);
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Failed to load user data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const handleDelete = async () => {
    if (!userId) return;

    try {
      setDeleting(true);
      await userService.deleteUser(userId);
      toast.success('User deleted successfully');
      navigate('/users');
    } catch (err: any) {
      console.error('Error deleting user:', err);
      toast.error(err.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">User Details</h1>
          <Button variant="outline" onClick={() => navigate('/users')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
        </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              {error || 'User not found'}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Details</h1>
        <div className="space-x-4">
            <Button variant="outline" onClick={() => navigate('/users')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
            </Button>
          <Button variant="outline" onClick={() => navigate(`/users/${userId}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit User
            </Button>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete User
            </Button>
          </div>
      </div>

        <Card>
          <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>View user details and permissions</CardDescription>
          </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-500">Name</Label>
              <div className="text-base">{user.name}</div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-500">Email</Label>
              <div className="text-base">{user.email}</div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-500">Role</Label>
              <div className="text-base">{user.role}</div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-500">Office</Label>
              <div className="text-base">{user.office}</div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-500">Department</Label>
              <div className="text-base">{user.department || '-'}</div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-500">Job Position</Label>
              <div className="text-base">{user.position || '-'}</div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-500">Status</Label>
              <div>
                <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                  {user.status}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-500">Last Login</Label>
              <div className="text-base">
                {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-500">Created At</Label>
              <div className="text-base">
                {new Date(user.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-500">Updated At</Label>
              <div className="text-base">
                {new Date(user.updatedAt).toLocaleString()}
            </div>
            </div>
              </div>
          </CardContent>
        </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserDetailPage; 
