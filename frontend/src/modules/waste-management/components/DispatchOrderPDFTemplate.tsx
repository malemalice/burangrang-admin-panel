import { format } from 'date-fns';
import { Badge } from '@/core/components/ui/badge';
import { Separator } from '@/core/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/core/components/ui/table';
import { DispatchOrder, GeneralStatusEnum } from '../types/waste-management.types';

interface DispatchOrderPDFTemplateProps {
  dispatchOrder: DispatchOrder;
}

export function DispatchOrderPDFTemplate({ dispatchOrder }: DispatchOrderPDFTemplateProps) {
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

  return (
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
  );
}
