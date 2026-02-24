import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { FileEdit, ArrowLeft, FileDown, Loader2, Activity } from 'lucide-react';
import { usePDF } from 'react-to-pdf';

import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import PageHeader from '@/core/components/ui/PageHeader';
import { PermissionGuard } from '@/core/components/ui/PermissionGuard';

import environmentalMeasurementService from '../services/environmentalMeasurementService';
import { EnvironmentalMeasurement } from '../types/environmental-measurement.types';
import { EnvironmentalMeasurementPDFTemplate } from '../components/EnvironmentalMeasurementPDFTemplate';

export default function EnvironmentalMeasurementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [measurement, setMeasurement] = useState<EnvironmentalMeasurement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const baseFilename = measurement
    ? `environmental-measurement-${measurement.id}-${format(new Date(measurement.date), 'yyyyMMdd')}`
    : 'environmental-measurement';
  const { toPDF, targetRef } = usePDF({
    filename: `${baseFilename}-${format(new Date(), 'yyyyMMdd-HHmmss')}.pdf`,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;
        const data = await environmentalMeasurementService.getMeasurement(id);
        setMeasurement(data);
      } catch (error) {
        toast.error('Failed to fetch environmental measurement');
        navigate(-1);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleExportPDF = async () => {
    try {
      await toPDF();
      toast.success('PDF exported successfully');
    } catch (error) {
      toast.error('Failed to export PDF');
    }
  };

  useEffect(() => {
    if (measurement && searchParams.get('print') === 'true') {
      const timer = setTimeout(async () => {
        try {
          await toPDF();
          toast.success('PDF exported successfully');
        } catch {
          toast.error('Failed to export PDF');
        }
        searchParams.delete('print');
        setSearchParams(searchParams, { replace: true });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [measurement, searchParams, setSearchParams, toPDF]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!measurement) {
    return (
      <div className="text-center py-12">
        <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Environmental measurement not found</h3>
        <p className="text-muted-foreground mb-4">
          The record you're looking for doesn't exist or has been deleted.
        </p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to List
        </Button>
      </div>
    );
  }

  const roomLabel = measurement.room
    ? `${measurement.room.name} (${measurement.room.code})`
    : '-';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Environmental Measurement"
        subtitle={format(new Date(measurement.date), 'PPP')}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <FileDown className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <PermissionGuard permission="environmental-measurement:update">
              <Button size="sm" onClick={() => navigate(`/environmental-measurements/${id}/edit`)}>
                <FileEdit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </PermissionGuard>
          </div>
        }
      />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* PDF Template - hidden, used for export only */}
        <div
          ref={targetRef}
          style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '210mm' }}
          aria-hidden="true"
        >
          <EnvironmentalMeasurementPDFTemplate measurement={measurement} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Measurement Details</CardTitle>
            <CardDescription>Date, room, and measurement values</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Date</p>
                <p>{format(new Date(measurement.date), 'dd MMM yyyy')}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Room</p>
                <p>{roomLabel}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Lighting (lux)</p>
                <p>{measurement.lighting ?? '-'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Noise (dB)</p>
                <p>{measurement.noise ?? '-'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Humidity (%)</p>
                <p>{measurement.humidity ?? '-'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Temperature (°C)</p>
                <p>{measurement.temperature ?? '-'}</p>
              </div>
              {measurement.remarks && (
                <div className="space-y-2 md:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Remarks</p>
                  <p className="whitespace-pre-wrap">{measurement.remarks}</p>
                </div>
              )}
            </div>
            {measurement.creator && (
              <div className="pt-4 border-t text-sm text-muted-foreground">
                Recorded by: {measurement.creator.firstName} {measurement.creator.lastName}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
