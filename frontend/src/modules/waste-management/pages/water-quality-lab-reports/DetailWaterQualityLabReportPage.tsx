import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { usePDF } from 'react-to-pdf';
import { Loader2, ArrowLeft, Pencil, FileText, FileDown, Image } from 'lucide-react';
import { format } from 'date-fns';
import { buildPdfOptions, generateTableAwarePdf } from '@/core/lib/pdfExport';

import PageHeader from '@/core/components/ui/PageHeader';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Separator } from '@/core/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';

import { waterQualityLabReportService } from '../../services/wasteManagementService';
import {
  WaterQualityLabReport,
  WaterQualityLabReportResult,
  WaterQualityParameterCategoryEnum,
  WaterQualityLabReportCategoryEnum,
} from '../../types/waste-management.types';
import { WaterQualityLabReportPDFTemplate } from '../../components/WaterQualityLabReportPDFTemplate';

const WATER_LAB_REPORT_CATEGORY_LABELS: Record<WaterQualityLabReportCategoryEnum, string> = {
  [WaterQualityLabReportCategoryEnum.WASTEWATER]: 'Wastewater',
  [WaterQualityLabReportCategoryEnum.CLEAN_WATER]: 'Clean water',
  [WaterQualityLabReportCategoryEnum.SWIMMING_POOL_WATER]: 'Swimming pool water',
  [WaterQualityLabReportCategoryEnum.DRINKING_WATER]: 'Drinking water',
};

const CATEGORY_LABELS: Record<string, string> = {
  [WaterQualityParameterCategoryEnum.CHEMISTRY]: 'Chemistry',
  [WaterQualityParameterCategoryEnum.PHYSICS]: 'Physics',
  [WaterQualityParameterCategoryEnum.MICROBIOLOGY]: 'Microbiology',
};

function groupResultsByCategory(results: WaterQualityLabReportResult[]) {
  const groups: Record<string, WaterQualityLabReportResult[]> = {};
  for (const r of results) {
    const cat = r.parameter?.category ?? WaterQualityParameterCategoryEnum.CHEMISTRY;
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(r);
  }
  return groups;
}

export default function DetailWaterQualityLabReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WaterQualityLabReport | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const { targetRef } = usePDF(
    buildPdfOptions({
      filename: data
        ? `${data.reportCode}-${format(new Date(), 'yyyyMMdd-HHmmss')}.pdf`
        : 'water-quality-lab-report.pdf',
    }),
  );

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

  const handleExportPDF = async () => {
    if (!data) return;
    try {
      setIsExportingPDF(true);
      await new Promise((resolve) => setTimeout(resolve, 200));
      await generateTableAwarePdf(
        targetRef,
        buildPdfOptions({
          filename: `${data.reportCode}-${format(new Date(), 'yyyyMMdd-HHmmss')}.pdf`,
        }),
      );
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Failed to export PDF:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExportingPDF(false);
    }
  };

  if (!data) return null;

  return (
    <>
      <div
        ref={targetRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          width: '210mm',
        }}
        aria-hidden="true"
      >
        <WaterQualityLabReportPDFTemplate report={data} />
      </div>
      <PageHeader
        title={`Report ${data.reportCode}`}
        subtitle="Water Quality Lab Report Details"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button
              variant="outline"
              onClick={handleExportPDF}
              disabled={isExportingPDF}
            >
              {isExportingPDF ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="mr-2 h-4 w-4" />
              )}
              {isExportingPDF ? 'Preparing PDF…' : 'Export PDF'}
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
            <CardTitle className="text-xl">General Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Treatment Plant</h4>
              <p className="font-medium">{data.treatmentPlant?.name || '-'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Category</h4>
              <p className="font-medium">{data.category ? WATER_LAB_REPORT_CATEGORY_LABELS[data.category] : '-'}</p>
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

            <div className="pt-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Analyst Signature</h4>
              <p className="font-medium">{data.analystSignature || '-'}</p>
            </div>

            <div className="pt-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Documents</h4>
              {data.attachments && data.attachments.length > 0 ? (
                <ul className="space-y-2">
                  {data.attachments
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((att) => {
                      const isImage = /\.(jpe?g|png|gif|webp)$/i.test(att.fileName ?? '') || att.fileUrl.match(/\.(jpe?g|png|gif|webp)/i);
                      const label = att.fileName ?? att.fileUrl.split('/').pop() ?? 'Document';
                      return (
                        <li key={att.id} className="flex items-center gap-2">
                          {isImage ? (
                            <Image className="h-4 w-4 shrink-0 text-muted-foreground" />
                          ) : (
                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                          <a
                            href={att.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline truncate"
                          >
                            {label}
                          </a>
                        </li>
                      );
                    })}
                </ul>
              ) : (
                <p className="text-muted-foreground italic">No documents attached</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Results</CardTitle>
          </CardHeader>
          <CardContent>
            {data.labReportResults && data.labReportResults.length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupResultsByCategory(data.labReportResults)).map(([category, rows]) => (
                  <div key={category} className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      {CATEGORY_LABELS[category] ?? category}
                    </h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Parameter</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Regulatory Limit</TableHead>
                          <TableHead className="max-w-[200px]">Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">
                              {r.parameter?.name ?? r.parameterId}
                            </TableCell>
                            <TableCell>{r.resultValue}</TableCell>
                            <TableCell>{r.unit ?? r.parameter?.unit ?? '-'}</TableCell>
                            <TableCell>
                              {r.parameter?.regulatoryLimit ?? '-'}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                              {r.notes ?? '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground italic">No result values recorded.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
