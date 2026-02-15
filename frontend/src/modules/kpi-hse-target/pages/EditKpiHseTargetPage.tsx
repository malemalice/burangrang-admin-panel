import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import PageHeader from '@/core/components/ui/PageHeader';
import KpiHseTargetForm from './KpiHseTargetForm';
import kpiHseTargetService from '../services/kpiHseTargetService';
import { HseTarget } from '../types/kpi-hse-target.types';

export default function EditKpiHseTargetPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [hseTarget, setHseTarget] = useState<HseTarget | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHseTarget = async () => {
      if (!id) {
        navigate('/dashboard/kpi-hse-target');
        return;
      }
      try {
        const data = await kpiHseTargetService.getHseTarget(id);
        setHseTarget(data);
      } catch (error) {
        console.error('Failed to fetch HSE target:', error);
        toast.error('Failed to load HSE target');
        navigate('/dashboard/kpi-hse-target');
      } finally {
        setIsLoading(false);
      }
    };
    fetchHseTarget();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hseTarget) {
    return null;
  }

  return (
    <>
      <PageHeader
        title="Edit HSE Target"
        subtitle={`Editing: ${hseTarget.type} - ${hseTarget.code} (${hseTarget.year})`}
      />
      <KpiHseTargetForm hseTarget={hseTarget} mode="edit" />
    </>
  );
}
