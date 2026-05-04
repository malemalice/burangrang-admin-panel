import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';

import { InspectionItem } from '../types/inspection-item.types';
import { CreateInspectionItemDTO } from '../../types/inspection.types';
import inspectionItemsService from '../services/inspectionItemsService';
import InspectionItemForm from '../../components/InspectionItemForm';

const EditInspectionItemPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? '';
  const [item, setItem] = useState<InspectionItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const data = await inspectionItemsService.getById(id);
        setItem(data);
      } catch (error) {
        console.error('Failed to fetch Inspection Finding Monitoring:', error);
        toast.error('Failed to load Inspection Finding Monitoring');
        navigate(`/inspections/items${returnTo}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItem();
  }, [id, navigate, returnTo]);

  const handleSubmit = async (itemData?: CreateInspectionItemDTO) => {
    if (!id || !itemData) return;
    try {
      await inspectionItemsService.update(id, itemData);
      toast.success('Inspection Finding Monitoring updated successfully');
      navigate(`/inspections/items/${id}`, { state: { returnTo } });
    } catch (error) {
      console.error('Failed to update Inspection Finding Monitoring:', error);
      toast.error('Failed to update Inspection Finding Monitoring');
    }
  };

  const handleCancel = () => {
    navigate(`/inspections/items/${id}`, { state: { returnTo } });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!item) return null;

  return (
    <>
      <PageHeader
        title="Edit Inspection Finding Monitoring"
        subtitle="Update Inspection Finding Monitoring details"
        actions={
          <Button
            variant="outline"
            onClick={handleCancel}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Details
          </Button>
        }
      />

      <div className="max-w-4xl mx-auto">
        <InspectionItemForm
          initialItem={{
            id: item.id,
            areaId: item.areaId,
            status: item.status,
            riskCategoryId: item.riskCategoryId,
            riskId: item.riskId,
            assignedDepartmentId: item.assignedDepartmentId,
            assigneeId: item.assigneeId,
            description: item.description,
            followUpNotes: item.followUpNotes,
            findings: item.findings,
            dueDateAt: item.dueDateAt ? new Date(item.dueDateAt).toISOString().split('T')[0] : undefined,
            images: item.images?.map((img) => ({
              imageUrl: img.imageUrl,
              caption: img.caption,
              order: img.order,
              type: img.type,
            })),
            mitigation: item.mitigation
              ? {
                  eliminate: item.mitigation.eliminate,
                  eliminationControl: item.mitigation.eliminationControl,
                  substitutionControl: item.mitigation.substitutionControl,
                  engineeringControl: item.mitigation.engineeringControl,
                  administrationControl: item.mitigation.administrationControl,
                  personalProtectiveEquipment: item.mitigation.personalProtectiveEquipment,
                  transfer: item.mitigation.transfer,
                  accept: item.mitigation.accept,
                  legalAspect: item.mitigation.legalAspect,
                }
              : undefined,
            checklistResults: item.checklistResults?.map((r) => ({
              checklistItemId: r.checklistItemId,
              riskRate: r.riskRate,
              notes: r.notes,
            })),
          }}
          formMode="creator"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </>
  );
};

export default EditInspectionItemPage;
