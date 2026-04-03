import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import PageHeader from '@/core/components/ui/PageHeader';
import companyService from '../../services/companyService';
import { CompanyDTO } from '../../types/master-data.types';
import CompanyForm from './CompanyForm';

const EditCompanyPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<CompanyDTO | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCompany = async () => {
      if (!id) return;

      try {
        const data = await companyService.getCompany(id);
        setCompany(data);
      } catch (error) {
        console.error('Error fetching company:', error);
        toast.error('Failed to load company data');
        navigate('/master/companies');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompany();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Company" subtitle={`Edit company: ${company?.name}`} />

      <div className="mx-auto max-w-4xl">
        <CompanyForm company={company} mode="edit" />
      </div>
    </div>
  );
};

export default EditCompanyPage;
