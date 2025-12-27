import { format } from 'date-fns';
import { Inspection } from '../types/inspection.types';

interface InspectionDetailsCardProps {
  inspection: Inspection;
}

export const InspectionDetailsCard = ({ inspection }: InspectionDetailsCardProps) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-3">Inspection Details</h3>
      </div>
      
      {inspection.description && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Description</p>
          <p className="text-sm">{inspection.description}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Area</p>
          <p className="text-sm">{inspection.area?.name || 'N/A'}</p>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Inspection Date</p>
          <p className="text-sm">
            {inspection.inspectionDate 
              ? format(new Date(inspection.inspectionDate), 'dd MMM yyyy') 
              : 'N/A'}
          </p>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Created By</p>
          <p className="text-sm">
            {inspection.creator 
              ? `${inspection.creator.firstName} ${inspection.creator.lastName}` 
              : inspection.createdBy || 'N/A'}
          </p>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Created At</p>
          <p className="text-sm">{format(new Date(inspection.createdAt), 'dd MMM yyyy')}</p>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Last Updated</p>
          <p className="text-sm">{format(new Date(inspection.updatedAt), 'dd MMM yyyy')}</p>
        </div>
        {inspection.inspectors && inspection.inspectors.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Inspectors</p>
            <p className="text-sm">
              {inspection.inspectors.map(insp => 
                insp.inspector ? `${insp.inspector.firstName} ${insp.inspector.lastName}` : ''
              ).filter(Boolean).join(', ') || 'N/A'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

