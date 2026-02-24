import PageHeader from '@/core/components/ui/PageHeader';
import KpiHseTargetForm from './KpiHseTargetForm';

export default function CreateKpiHseTargetPage() {
  return (
    <>
      <PageHeader title="Create HSE Target" subtitle="Add a new HSE target" />
      <KpiHseTargetForm mode="create" />
    </>
  );
}
