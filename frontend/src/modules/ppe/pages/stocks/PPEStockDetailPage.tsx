import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Edit, Package, Calendar } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import PageHeader from '@/core/components/ui/PageHeader';
import { usePPEStock } from '../../hooks/usePPE';
import { PPEStockStatus } from '../../types/ppe.types';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/core/components/ui/table';

const PPEStockDetailPage = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { stock, isLoading } = usePPEStock(id || null);

    const getStatusBadge = (status: PPEStockStatus) => {
        const statusConfig = {
            [PPEStockStatus.AVAILABLE]: { label: 'Available', variant: 'default' as const },
            [PPEStockStatus.RESERVED]: { label: 'Reserved', variant: 'secondary' as const },
            [PPEStockStatus.ISSUED]: { label: 'Issued', variant: 'outline' as const },
            [PPEStockStatus.EXPIRED]: { label: 'Expired', variant: 'destructive' as const },
            [PPEStockStatus.DISPOSED]: { label: 'Disposed', variant: 'destructive' as const },
        };

        const config = statusConfig[status] || { label: status, variant: 'outline' as const };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    if (isLoading) {
        return (
            <div className="container mx-auto py-10">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading stock details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!stock) {
        return (
            <div className="container mx-auto py-10">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <p className="text-gray-600">Stock not found</p>
                        <Button
                            variant="outline"
                            onClick={() => navigate('/ppe/stocks')}
                            className="mt-4"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Stocks
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <PageHeader
                title={`Stock: ${stock.stockCode}`}
                subtitle="PO/PR code, received date, and line items"
                actions={
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => navigate('/ppe/stocks')}
                            disabled={isLoading}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Stocks
                        </Button>
                        <Button
                            onClick={() => navigate(`/ppe/stocks/${id}/edit`)}
                            disabled={isLoading}
                        >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Stock
                        </Button>
                    </div>
                }
            />

            <div className="container mx-auto py-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Stock Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">PO/PR Code</h3>
                                <p className="mt-1 font-medium">{stock.stockCode}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Received Date</h3>
                                <p className="mt-1 flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {new Date(stock.receivedDate).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                                <div className="mt-1">
                                    <Badge
                                        variant="outline"
                                        className={`${stock.isActive
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                            } border-0`}
                                    >
                                        {stock.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                            </div>
                            {stock.notes && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                                    <p className="mt-1">{stock.notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Additional Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Created At</h3>
                                <p className="mt-1">
                                    {new Date(stock.createdAt).toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                                <p className="mt-1">
                                    {new Date(stock.updatedAt).toLocaleString()}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Stock Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stock.items && stock.items.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Equipment Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Size</TableHead>
                                        <TableHead>Expiry Date</TableHead>
                                        <TableHead>Initial Qty</TableHead>
                                        <TableHead>Current Qty</TableHead>
                                        <TableHead>Reserved Qty</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stock.items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">
                                                {item.equipmentName || '-'}
                                            </TableCell>
                                            <TableCell>{item.equipmentType || '-'}</TableCell>
                                            <TableCell>{item.equipmentSize || '-'}</TableCell>
                                            <TableCell>
                                                {item.expiryDate
                                                    ? new Date(item.expiryDate).toLocaleDateString()
                                                    : '-'}
                                            </TableCell>
                                            <TableCell>{item.initialQuantity}</TableCell>
                                            <TableCell>{item.currentQuantity}</TableCell>
                                            <TableCell>{item.reservedQuantity}</TableCell>
                                            <TableCell>{getStatusBadge(item.status)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-center text-gray-500 py-8">No items found</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export default PPEStockDetailPage;

