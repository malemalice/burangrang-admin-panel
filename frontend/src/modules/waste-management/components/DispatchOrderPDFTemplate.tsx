import { format } from 'date-fns';
import { Separator } from '@/core/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/core/components/ui/table';
import { DispatchOrder } from '../types/waste-management.types';

interface DispatchOrderPDFTemplateProps {
  dispatchOrder: DispatchOrder;
}

export function DispatchOrderPDFTemplate({ dispatchOrder }: DispatchOrderPDFTemplateProps) {
  return (
    <div className="bg-white p-8 space-y-6">
      {/* Header Section */}
      <div className="text-center border-b-2 border-foreground pb-4">
        <h1 className="text-3xl font-bold uppercase tracking-wide mb-2">
          Dispatch Order
        </h1>
        <p className="text-sm text-muted-foreground">WASTE DISPATCH ORDER</p>
      </div>

      {/* Document Information */}
      <div className="mt-6 space-y-4">
        <Table>
          <TableBody>
            <TableRow>
              <TableHead className="w-1/3 bg-muted/50 font-semibold">Document Number</TableHead>
              <TableCell>{dispatchOrder.dispatchCode}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="w-1/3 bg-muted/50 font-semibold">Date</TableHead>
              <TableCell>{format(new Date(dispatchOrder.dispatchDate), 'dd MMMM yyyy')}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <Separator className="my-6" />

      {/* Order Details */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold uppercase border-b border-border pb-2">
          Order Information
        </h2>
        <Table>
          <TableBody>
            <TableRow>
              <TableHead className="w-1/3 bg-muted/50 font-semibold">Dispatch Code</TableHead>
              <TableCell className="font-mono">{dispatchOrder.dispatchCode}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="w-1/3 bg-muted/50 font-semibold">Dispatch Date</TableHead>
              <TableCell>{format(new Date(dispatchOrder.dispatchDate), 'dd MMMM yyyy, HH:mm')}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="w-1/3 bg-muted/50 font-semibold">Quantity</TableHead>
              <TableCell className="font-semibold">{dispatchOrder.quantity.toLocaleString()}</TableCell>
            </TableRow>
            {dispatchOrder.memo && (
              <TableRow>
                <TableHead className="w-1/3 bg-muted/50 font-semibold">Memo</TableHead>
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
          Personnel Information
        </h2>
        <Table>
          <TableBody>
            <TableRow>
              <TableHead className="w-1/3 bg-muted/50 font-semibold">Ordered By</TableHead>
              <TableCell>
                {dispatchOrder.orderer
                  ? `${dispatchOrder.orderer.firstName} ${dispatchOrder.orderer.lastName}`
                  : 'N/A'}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="w-1/3 bg-muted/50 font-semibold">Created By</TableHead>
              <TableCell>
                {dispatchOrder.creator
                  ? `${dispatchOrder.creator.firstName} ${dispatchOrder.creator.lastName}`
                  : 'N/A'}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="w-1/3 bg-muted/50 font-semibold">Created At</TableHead>
              <TableCell>{format(new Date(dispatchOrder.createdAt), 'dd MMMM yyyy, HH:mm')}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="w-1/3 bg-muted/50 font-semibold">Last Updated</TableHead>
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
              <p className="text-sm font-semibold">Ordered By</p>
              <p className="text-xs text-muted-foreground mt-2">
                {dispatchOrder.orderer
                  ? `${dispatchOrder.orderer.firstName} ${dispatchOrder.orderer.lastName}`
                  : 'N/A'}
              </p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t-2 border-foreground mt-16 pt-2">
              <p className="text-sm font-semibold">Acknowledged By</p>
              <p className="text-xs text-muted-foreground mt-2">Manager</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-4 border-t border-border text-center text-xs text-muted-foreground">
        <p>Document printed on: {format(new Date(), 'dd MMMM yyyy, HH:mm')}</p>
        <p className="mt-1">Page 1 of 1</p>
      </div>
    </div>
  );
}
