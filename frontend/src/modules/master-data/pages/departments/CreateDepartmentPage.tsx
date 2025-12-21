import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import DepartmentForm from './DepartmentForm';

const CreateDepartmentPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Create Department"
        subtitle="Add a new department to the system"
        actions={
          <Button variant="outline" onClick={() => navigate('/master/departments')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Departments
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <DepartmentForm mode="create" />
      </div>
    </>
  );
};

export default CreateDepartmentPage; 