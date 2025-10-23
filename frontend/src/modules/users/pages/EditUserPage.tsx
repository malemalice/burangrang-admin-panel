import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return <UserForm user={user} mode="edit" />;
};

export default EditUserPage; 