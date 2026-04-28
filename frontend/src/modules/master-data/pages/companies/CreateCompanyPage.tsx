import PageHeader from '@/core/components/ui/PageHeader';
import CompanyForm from './CompanyForm';

const CreateCompanyPage = () => {
  return (
    <div className="space-y-6">
      <PageHeader title="Create Company" subtitle="Add a new company to the master data system" />

      <div className="mx-auto max-w-4xl">
        <CompanyForm mode="create" />
      </div>
    </div>
  );
};

export default CreateCompanyPage;
