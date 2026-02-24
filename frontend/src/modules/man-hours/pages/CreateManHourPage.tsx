import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import ManHourForm from './ManHourForm';

export default function CreateManHourPage() {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Create Man Hour"
        subtitle="Add a new man hour record"
        actions={
          <Button variant="outline" onClick={() => navigate('/man-hours')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Man Hours
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <ManHourForm mode="create" />
      </div>
    </>
  );
}
