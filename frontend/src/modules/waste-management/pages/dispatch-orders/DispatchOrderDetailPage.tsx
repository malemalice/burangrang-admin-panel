import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { FileEdit, ArrowLeft, FileDown, FileText, Image } from 'lucide-react';
import api from '@/core/lib/api';
import { usePDF } from 'react-to-pdf';

import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Separator } from '@/core/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/core/components/ui/table';
import { Loader2 } from 'lucide-react';

import { dispatchOrderService } from '../../services/wasteManagementService';
import { DispatchOrder } from '../../types/waste-management.types';
import { DispatchOrderPDFTemplate } from '../../components/DispatchOrderPDFTemplate';

export default function DispatchOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dispatchOrder, setDispatchOrder] = useState<DispatchOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toPDF, targetRef } = usePDF({
    filename: dispatchOrder
      ? `${dispatchOrder.dispatchCode}-${format(new Date(), 'yyyyMMdd-HHmmss')}.pdf`
      : 'dispatch-order.pdf',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;
        const response = await dispatchOrderService.getById(id);
        const data = response.data as DispatchOrder;
        setDispatchOrder(data);
      } catch (error) {
        toast.error('Failed to fetch dispatch order');
        navigate('/waste-management/dispatch-orders');
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
    if (dispatchOrder && searchParams.get('print') === 'true') {
      // Small delay to ensure render is complete before printing
      setTimeout(() => {
        handleExportPDF();
        // Remove print param from URL
        searchParams.delete('print');
        setSearchParams(searchParams, { replace: true });
      }, 500);
    }
  }, [dispatchOrder, searchParams, setSearchParams]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!dispatchOrder) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/waste-management/dispatch-orders')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dispatch Orders
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportPDF}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={() => navigate(`/waste-management/dispatch-orders/${id}/edit`)}>
            <FileEdit className="h-4 w-4 mr-2" />
            Edit Order
          </Button>
        </div>
      </div>

      {/* PDF Template - Hidden from screen, only used for PDF export */}
      {dispatchOrder && (
        <div
          ref={targetRef}
          style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '210mm' }}
          aria-hidden="true"
        >
          <DispatchOrderPDFTemplate dispatchOrder={dispatchOrder} />
        </div>
      )}

      {/* Screen View - Card Format */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">Dispatch Order: {dispatchOrder.dispatchCode}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Created on {format(new Date(dispatchOrder.createdAt), 'dd MMM yyyy')}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Dispatch Code</p>
              <p className="font-mono">{dispatchOrder.dispatchCode}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Dispatch Date</p>
              <p>{format(new Date(dispatchOrder.dispatchDate), 'dd MMM yyyy, HH:mm')}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Quantity</p>
              <p className="font-semibold">{dispatchOrder.quantity.toLocaleString('id-ID')}</p>
            </div>
            {dispatchOrder.memo && (
              <div className="space-y-2 md:col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Memo</p>
                <p className="whitespace-pre-wrap">{dispatchOrder.memo}</p>
              </div>
            )}
            {dispatchOrder.attachments && dispatchOrder.attachments.length > 0 && (
              <div className="space-y-2 md:col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Attachments</p>
                <ul className="space-y-2">
                  {dispatchOrder.attachments
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((att) => {
                      const label = att.fileName ?? att.fileUrl.split('/').pop() ?? 'File';
                      const isPdf = label.toLowerCase().endsWith('.pdf') || att.fileUrl.toLowerCase().includes('pdf');
                      const href = att.fileUrl.startsWith('http') ? att.fileUrl : `${api.defaults.baseURL ?? ''}${att.fileUrl.startsWith('/') ? '' : '/'}${att.fileUrl}`;
                      return (
                        <li key={att.id ?? att.fileUrl}>
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-primary hover:underline"
                          >
                            {isPdf ? (
                              <FileText className="h-4 w-4 shrink-0" />
                            ) : (
                              <Image className="h-4 w-4 shrink-0" />
                            )}
                            {label}
                          </a>
                        </li>
                      );
                    })}
                </ul>
              </div>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Ordered By</p>
              <p>
                {dispatchOrder.orderer
                  ? `${dispatchOrder.orderer.firstName} ${dispatchOrder.orderer.lastName}`
                  : 'N/A'}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Created By</p>
              <p>
                {dispatchOrder.creator
                  ? `${dispatchOrder.creator.firstName} ${dispatchOrder.creator.lastName}`
                  : 'N/A'}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Created At</p>
              <p>{format(new Date(dispatchOrder.createdAt), 'dd MMM yyyy, HH:mm')}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
              <p>{format(new Date(dispatchOrder.updatedAt), 'dd MMM yyyy, HH:mm')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
