import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { FileEdit, ArrowLeft, FileDown } from 'lucide-react';
import { usePDF } from 'react-to-pdf';

import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Separator } from '@/core/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/core/components/ui/table';
import { Loader2 } from 'lucide-react';

import { dispatchOrderService } from '../../services/wasteManagementService';
import { DispatchOrder, GeneralStatusEnum } from '../../types/waste-management.types';

export default function DispatchOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dispatchOrder, setDispatchOrder] = useState<DispatchOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toPDF, targetRef } = usePDF({ filename: 'dispatch-order.pdf' });

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

  const getStatusBadge = (status: GeneralStatusEnum) => {
    const statusMap: Record<GeneralStatusEnum, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      [GeneralStatusEnum.SCHEDULED]: { label: 'Scheduled', variant: 'outline' },
      [GeneralStatusEnum.DRAFT]: { label: 'Draft', variant: 'secondary' },
      [GeneralStatusEnum.OPEN]: { label: 'Open', variant: 'default' },
      [GeneralStatusEnum.WAITING_APPROVAL]: { label: 'Waiting Verification', variant: 'secondary' },
      [GeneralStatusEnum.DONE]: { label: 'Done', variant: 'default' },
      [GeneralStatusEnum.REJECTED]: { label: 'Rejected', variant: 'destructive' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'outline' };

    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

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

      <div ref={targetRef}>
        {/* PDF Header - Formal Format */}
        <div className="bg-white p-8 space-y-6">
          {/* Header Section */}
          <div className="text-center border-b-2 border-foreground pb-4">
            <h1 className="text-3xl font-bold uppercase tracking-wide mb-2">
              Surat Perintah Jalan
            </h1>
            <p className="text-sm text-muted-foreground">DISPATCH ORDER</p>
          </div>

          {/* Document Information */}
          <div className="mt-6 space-y-4">
            <Table>
              <TableBody>
                <TableRow>
                  <TableHead className="w-1/3 bg-muted/50 font-semibold">Nomor Dokumen</TableHead>
                  <TableCell>{dispatchOrder.dispatchCode}</TableCell>
                </TableRow>
                <TableRow>
                  <TableHead className="w-1/3 bg-muted/50 font-semibold">Tanggal</TableHead>
                  <TableCell>{format(new Date(dispatchOrder.dispatchDate), 'dd MMMM yyyy')}</TableCell>
                </TableRow>
                <TableRow>
                  <TableHead className="w-1/3 bg-muted/50 font-semibold">Status</TableHead>
                  <TableCell className="align-middle">{getStatusBadge(dispatchOrder.status)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <Separator className="my-6" />

          {/* Order Details */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold uppercase border-b border-border pb-2">
              Informasi Order
            </h2>
            <Table>
              <TableBody>
                <TableRow>
                  <TableHead className="w-1/3 bg-muted/50 font-semibold">Kode Dispatch</TableHead>
                  <TableCell className="font-mono">{dispatchOrder.dispatchCode}</TableCell>
                </TableRow>
                <TableRow>
                  <TableHead className="w-1/3 bg-muted/50 font-semibold">Tanggal Dispatch</TableHead>
                  <TableCell>{format(new Date(dispatchOrder.dispatchDate), 'dd MMMM yyyy, HH:mm')}</TableCell>
                </TableRow>
                <TableRow>
                  <TableHead className="w-1/3 bg-muted/50 font-semibold">Jumlah (Quantity)</TableHead>
                  <TableCell className="font-semibold">{dispatchOrder.quantity.toLocaleString('id-ID')}</TableCell>
                </TableRow>
                {dispatchOrder.memo && (
                  <TableRow>
                    <TableHead className="w-1/3 bg-muted/50 font-semibold">Keterangan</TableHead>
                    <TableCell className="whitespace-pre-wrap">{dispatchOrder.memo}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <Separator className="my-6" />

          {/* Personnel Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold uppercase border-b border-border pb-2">
              Informasi Personil
            </h2>
            <Table>
              <TableBody>
                <TableRow>
                  <TableHead className="w-1/3 bg-muted/50 font-semibold">Dipesan Oleh</TableHead>
                  <TableCell>
                    {dispatchOrder.orderer
                      ? `${dispatchOrder.orderer.firstName} ${dispatchOrder.orderer.lastName}`
                      : 'N/A'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableHead className="w-1/3 bg-muted/50 font-semibold">Dibuat Oleh</TableHead>
                  <TableCell>
                    {dispatchOrder.creator
                      ? `${dispatchOrder.creator.firstName} ${dispatchOrder.creator.lastName}`
                      : 'N/A'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableHead className="w-1/3 bg-muted/50 font-semibold">Tanggal Dibuat</TableHead>
                  <TableCell>{format(new Date(dispatchOrder.createdAt), 'dd MMMM yyyy, HH:mm')}</TableCell>
                </TableRow>
                <TableRow>
                  <TableHead className="w-1/3 bg-muted/50 font-semibold">Terakhir Diupdate</TableHead>
                  <TableCell>{format(new Date(dispatchOrder.updatedAt), 'dd MMMM yyyy, HH:mm')}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <Separator className="my-6" />

          {/* Signature Section */}
          <div className="mt-8 space-y-6">
            <div className="grid grid-cols-2 gap-8">
              <div className="text-center">
                <div className="border-t-2 border-foreground mt-16 pt-2">
                  <p className="text-sm font-semibold">Yang Memesan</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {dispatchOrder.orderer
                      ? `${dispatchOrder.orderer.firstName} ${dispatchOrder.orderer.lastName}`
                      : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t-2 border-foreground mt-16 pt-2">
                  <p className="text-sm font-semibold">Mengetahui</p>
                  <p className="text-xs text-muted-foreground mt-2">Manager</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-4 border-t border-border text-center text-xs text-muted-foreground">
            <p>Dokumen ini dicetak pada: {format(new Date(), 'dd MMMM yyyy, HH:mm')}</p>
            <p className="mt-1">Halaman 1 dari 1</p>
          </div>
        </div>
      </div>

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
            <div className="flex items-center gap-3">
              {getStatusBadge(dispatchOrder.status)}
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
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              {getStatusBadge(dispatchOrder.status)}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Active Status</p>
              <Badge variant={dispatchOrder.isActive ? 'default' : 'secondary'}>
                {dispatchOrder.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            {dispatchOrder.memo && (
              <div className="space-y-2 md:col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Memo</p>
                <p className="whitespace-pre-wrap">{dispatchOrder.memo}</p>
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
