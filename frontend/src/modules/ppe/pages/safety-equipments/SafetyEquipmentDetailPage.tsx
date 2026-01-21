import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, 
    Edit, 
    Shield, 
    Package, 
    Info,
    History
} from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import PageHeader from '@/core/components/ui/PageHeader';
import { useSafetyEquipment } from '../../hooks/useSafetyEquipments';
import StockMovementHistory from '../../components/StockMovementHistory';
import { SafetyEquipmentCategory } from '../../types/ppe-master-data.types';

const SafetyEquipmentDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { equipment, isLoading } = useSafetyEquipment(id || null);

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-[400px]">Loading...</div>;
    }

    if (!equipment) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <h2 className="text-xl font-semibold">Safety Equipment not found</h2>
                <Button onClick={() => navigate('/master/safety-equipments')}>Back to List</Button>
            </div>
        );
    }

    const getCategoryLabel = (category: SafetyEquipmentCategory) => {
        switch (category) {
            case SafetyEquipmentCategory.PERSONAL_PROTECTIVE_EQUIPMENT:
                return 'PPE';
            case SafetyEquipmentCategory.SAFETY_EQUIPMENT:
                return 'Safety';
            case SafetyEquipmentCategory.EMERGENCY_EQUIPMENT:
                return 'Emergency';
            default:
                return category;
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title={`${equipment.name} (${equipment.code})`}
                subtitle="View equipment details and stock movement history"
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => navigate('/master/safety-equipments')}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <Button onClick={() => navigate(`/master/safety-equipments/${equipment.id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </Button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Info className="h-5 w-5 text-blue-500" />
                                Equipment Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Category</label>
                                <div className="mt-1">
                                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-0">
                                        {getCategoryLabel(equipment.category)}
                                    </Badge>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Type</label>
                                <p className="text-base font-medium">{equipment.safetyEquipmentType?.name || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Size</label>
                                <p className="text-base font-medium">{equipment.size || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Status</label>
                                <div className="mt-1">
                                    <Badge variant="outline" className={equipment.isActive ? 'bg-green-100 text-green-800 border-0' : 'bg-gray-100 text-gray-800 border-0'}>
                                        {equipment.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                            </div>
                            <div className="pt-4 border-t">
                                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Current Stock</label>
                                <div className="mt-1 flex items-baseline gap-2">
                                    <span className="text-3xl font-bold">{equipment.currentStock || 0}</span>
                                    <span className="text-muted-foreground">units</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {equipment.description && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-semibold">Description</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {equipment.description}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="lg:col-span-2">
                    <Tabs defaultValue="history" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="history" className="flex items-center gap-2">
                                <History className="h-4 w-4" /> Movement History
                            </TabsTrigger>
                            <TabsTrigger value="details" className="flex items-center gap-2">
                                <Shield className="h-4 w-4" /> Technical Specs
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="history" className="mt-6">
                            <StockMovementHistory safetyEquipmentId={equipment.id} />
                        </TabsContent>
                        <TabsContent value="details" className="mt-6">
                            <Card>
                                <CardContent className="pt-6">
                                    <p className="text-muted-foreground text-center py-8">Technical specifications not available for this item.</p>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
};

export default SafetyEquipmentDetailPage;
