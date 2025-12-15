import PageHeader from '@/core/components/ui/PageHeader';
import AreaForm from './AreaForm';

const CreateAreaPage = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Area"
        subtitle="Add a new area to the extensive master data system"
      />

      <div className="max-w-4xl mx-auto">
        <AreaForm mode="create" />
      </div>
    </div>
  );
};

export default CreateAreaPage;
