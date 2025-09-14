import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import DepartmentForm from './DepartmentForm';
import departmentService from '../../services/departmentService';
import { Department } from '@/core/lib/types';

const EditDepartmentPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [department, setDepartment] = useState<Department | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDepartment = async () => {
      try {
        if (!id) return;
        const data = await departmentService.getDepartment(id);
        setDepartment(data);
      } catch (error) {
        toast.error('Failed to fetch department');
        navigate('/master/departments');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDepartment();
  }, [id, navigate]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!department) {
    return null;
  }

  return <DepartmentForm department={department} mode="edit" />;
};

export default EditDepartmentPage; 