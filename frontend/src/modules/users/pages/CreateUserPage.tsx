import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import UserForm from './UserForm';

const CreateUserPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Create User"
        subtitle="Add a new user to the system"
        actions={
          <Button variant="outline" onClick={() => navigate('/users')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <UserForm mode="create" />
      </div>
    </>
  );
};

export default CreateUserPage; 