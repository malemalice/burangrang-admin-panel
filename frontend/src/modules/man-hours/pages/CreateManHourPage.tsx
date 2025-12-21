import PageHeader from '@/core/components/ui/PageHeader';
import ManHourForm from './ManHourForm';

export default function CreateManHourPage() {
  return (
    <>
      <PageHeader
        title="Create Man Hour"
        subtitle="Add a new man hour record"
      />
      <ManHourForm mode="create" />
    </>
  );
}
