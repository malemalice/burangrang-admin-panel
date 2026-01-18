import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    ArrowDownCircle, 
    ArrowUpCircle, 
    RefreshCw, 
    Search,
    Calendar as CalendarIcon,
    Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/core/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import DataTable from '@/core/components/ui/data-table/DataTable';
import { useStockMovements } from '../hooks/useSafetyEquipments';
import { StockMovement, StockMovementSearchParams } from '../types/ppe-master-data.types';

interface StockMovementHistoryProps {
    safetyEquipmentId: string;
}

const StockMovementHistory = ({ safetyEquipmentId }: StockMovementHistoryProps) => {
    const { movements, totalMovements, isLoading, summary, fetchMovements } = useStockMovements();
    const [pageIndex, setPageIndex] = useState(0);
    const [limit, setLimit] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [movementType, setMovementType] = useState<string>('all');

    const loadMovements = useCallback(() => {
        const params: StockMovementSearchParams = {
            page: pageIndex + 1,
            limit,
            search: searchTerm || undefined,
            movementType: movementType === 'all' ? undefined : (movementType as any),
        };
        fetchMovements(safetyEquipmentId, params);
    }, [safetyEquipmentId, pageIndex, limit, searchTerm, movementType, fetchMovements]);

    useEffect(() => {
        loadMovements();
    }, [loadMovements]);

    const getMovementInfo = (movement: StockMovement) => {
        switch (movement.movementType) {
            case 'STOCK_IN':
                return {
                    icon: ArrowDownCircle,
                    colorClass: 'text-green-600 bg-green-50',
                    badgeClass: 'bg-green-100 text-green-800 border-0',
                    label: 'Stock In'
                };
            case 'WITHDRAWAL':
                return {
                    icon: ArrowUpCircle,
                    colorClass: 'text-blue-600 bg-blue-50',
                    badgeClass: 'bg-blue-100 text-blue-800 border-0',
                    label: 'Withdrawal'
                };
            case 'ADJUSTMENT':
                const isPositive = movement.quantity > 0;
                return {
                    icon: RefreshCw,
                    colorClass: isPositive ? 'text-yellow-600 bg-yellow-50' : 'text-red-600 bg-red-50',
                    badgeClass: isPositive ? 'bg-yellow-100 text-yellow-800 border-0' : 'bg-red-100 text-red-800 border-0',
                    label: `Adjustment (${movement.adjustmentType || (isPositive ? 'IN' : 'OUT')})`
                };
            default:
                return {
                    icon: RefreshCw,
                    colorClass: 'text-gray-600 bg-gray-50',
                    badgeClass: 'bg-gray-100 text-gray-800 border-0',
                    label: movement.movementType
                };
        }
    };

    const columns = useMemo(() => [
        {
            id: 'date',
            header: 'Date & Time',
            cell: (m: StockMovement) => (
                <div className="flex flex-col">
                    <span className="font-medium">{format(new Date(m.date), 'dd MMM yyyy')}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(m.date), 'HH:mm')}</span>
                </div>
            ),
        },
        {
            id: 'type',
            header: 'Movement Type',
            cell: (m: StockMovement) => {
                const info = getMovementInfo(m);
                const Icon = info.icon;
                return (
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-full ${info.colorClass}`}>
                            <Icon className="h-4 w-4" />
                        </div>
                        <Badge variant="outline" className={info.badgeClass}>
                            {info.label}
                        </Badge>
                    </div>
                );
            },
        },
        {
            id: 'reference',
            header: 'Reference',
            cell: (m: StockMovement) => (
                <div className="flex flex-col">
                    <span className="font-medium text-sm">{m.referenceCode || '-'}</span>
                    {m.metadata?.requestedForName && (
                        <span className="text-xs text-muted-foreground">For: {m.metadata.requestedForName}</span>
                    )}
                </div>
            ),
        },
        {
            id: 'quantity',
            header: 'Qty Change',
            cell: (m: StockMovement) => (
                <span className={`font-semibold ${m.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                </span>
            ),
        },
        {
            id: 'balance',
            header: 'Balance',
            cell: (m: StockMovement) => (
                <span className="font-medium">{m.runningBalance}</span>
            ),
        },
        {
            id: 'performedBy',
            header: 'Performed By',
            cell: (m: StockMovement) => (
                <span className="text-sm">{m.performedBy.name}</span>
            ),
        },
    ], []);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total In</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">+{summary?.totalIn || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Out</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">-{summary?.totalOut || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Current Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary?.currentStock || 0}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full space-y-2">
                    <label className="text-sm font-medium">Search</label>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by code, notes, or user..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="w-full md:w-[200px] space-y-2">
                    <label className="text-sm font-medium">Movement Type</label>
                    <Select value={movementType} onValueChange={setMovementType}>
                        <SelectTrigger>
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="STOCK_IN">Stock In</SelectItem>
                            <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
                            <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={loadMovements} variant="secondary">
                    <Filter className="mr-2 h-4 w-4" /> Apply Filters
                </Button>
            </div>

            <DataTable
                columns={columns}
                data={movements}
                isLoading={isLoading}
                pagination={{
                    pageIndex,
                    limit,
                    pageCount: Math.ceil(totalMovements / limit),
                    onPageChange: setPageIndex,
                    onPageSizeChange: setLimit,
                    total: totalMovements,
                }}
            />
        </div>
    );
};

export default StockMovementHistory;
