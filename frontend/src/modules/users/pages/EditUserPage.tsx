import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import UserForm from './UserForm';
import userService from '../services/userService';
import { User } from '@/core/lib/types';

const EditUserPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (!userId) return;
        const data = await userService.getUserById(userId);
        setUser(data);
      } catch (error) {
        toast.error('Failed to fetch user');
        navigate('/users');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [userId, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading user details...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          User not found
        </h2>
        <p className="text-gray-600 mb-4">
          The user you're looking for doesn't exist or has been deleted.
        </p>
        <Button onClick={() => navigate('/users')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Edit User"
        subtitle={`Modify the details of "${user.name}"`}
        actions={
          <Button variant="outline" onClick={() => navigate('/users')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <UserForm user={user} mode="edit" />
      </div>
    </>
  );
};

export default EditUserPage; 