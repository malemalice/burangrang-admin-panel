import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Pencil, FileText } from 'lucide-react';
import { format } from 'date-fns';

import PageHeader from '@/core/components/ui/PageHeader';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Separator } from '@/core/components/ui/separator';

import { waterQualityLabReportService } from '../../services/wasteManagementService';
import { WaterQualityLabReport } from '../../types/waste-management.types';

export default function DetailWaterQualityLabReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WaterQualityLabReport | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const response = await waterQualityLabReportService.getById(id);
        setData(response.data as WaterQualityLabReport);
      } catch (error) {
        console.error('Failed to fetch report:', error);
        toast.error('Failed to load report details');
        navigate('/waste-management/water-quality-lab-reports');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      <PageHeader
        title={`Report ${data.reportCode}`}
        subtitle="Water Quality Lab Report Details"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/waste-management/water-quality-lab-reports')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={() => navigate(`/waste-management/water-quality-lab-reports/${id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit Report
            </Button>
          </div>
        }
      />

      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">General Information</CardTitle>
              </div>
              <div className="flex gap-2">
                <Badge variant={data.isActive ? 'default' : 'secondary'}>
                  {data.isActive ? 'Active' : 'Inactive'}
                </Badge>
                <Badge variant="outline">
                  {data.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Treatment Plant</h4>
              <p className="font-medium">{data.treatmentPlant?.name || '-'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Report Date</h4>
              <p className="font-medium">{format(new Date(data.reportDate), 'PPP')}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Submitted By</h4>
              <p className="font-medium">{data.submitter ? `${data.submitter.firstName} ${data.submitter.lastName}` : '-'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Submitted At</h4>
              <p className="font-medium">{format(new Date(data.submittedAt), 'PPP')}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Report Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Summary</h4>
              <div className="bg-muted/30 p-4 rounded-md text-sm whitespace-pre-wrap">
                {data.summary || 'No summary provided.'}
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Recommendations</h4>
              <div className="bg-muted/30 p-4 rounded-md text-sm whitespace-pre-wrap">
                {data.recommendations || 'No recommendations provided.'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Analyst Signature</h4>
                <p className="font-medium">{data.analystSignature || '-'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Document</h4>
                {data.reportDocumentUrl ? (
                  <a
                    href={data.reportDocumentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-primary hover:underline"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Document
                  </a>
                ) : (
                  <p className="text-muted-foreground italic">No document attached</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
