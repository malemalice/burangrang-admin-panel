import PageHeader from '@/core/components/ui/PageHeader';
import { Button } from '@/core/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StorageLocationForm from './StorageLocationForm';

export default function CreateStorageLocationPage() { 
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Create Storage Location" 
        subtitle="Add a new storage location"
        actions={
          <Button variant="outline" onClick={() => navigate('/waste-management/storage-locations')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <StorageLocationForm mode="create" />
      </div>
    </div>
  );
}
