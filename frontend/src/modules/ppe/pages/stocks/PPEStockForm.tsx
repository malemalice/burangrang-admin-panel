import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/core/components/ui/form';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { DateTimePicker } from '@/core/components/ui/datetime-picker';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/core/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { SearchableSelect } from '@/core/components/ui/searchable-select';
import { Switch } from '@/core/components/ui/switch';
import ppeService from '../../services/ppeService';
import safetyEquipmentService from '../../services/safetyEquipmentService';
import {
    CreatePPEStockDTO,
    UpdatePPEStockDTO,
    CreatePPEStockItemDTO,
    PPEStock,
} from '../../types/ppe.types';
import { SafetyEquipment, SafetyEquipmentCategory } from '../../types/ppe-master-data.types';

const stockItemSchema = z.object({
    id: z.string().optional(),
    safetyEquipmentId: z.string().optional(),
    equipmentName: z.string().optional(),
    equipmentType: z.string().optional(),
    equipmentSize: z.string().optional(),
    expiryDate: z.string().optional(),
    initialQuantity: z.number().min(1, 'Quantity must be at least 1'),
    order: z.number().optional(),
}).refine(
    (data) => data.safetyEquipmentId || data.equipmentName,
    {
        message: 'Either select equipment from master data or enter equipment name',
        path: ['equipmentName'],
    }
);

const formSchema = z.object({
    receivedDate: z.string().min(1, 'Received date is required'),
    notes: z.string().optional(),
    isActive: z.boolean().optional().default(true),
    items: z.array(stockItemSchema).min(1, 'At least one item is required'),
});

type FormValues = z.infer<typeof formSchema>;

interface PPEStockFormProps {
    stock?: PPEStock;
    mode: 'create' | 'edit';
}

const PPEStockForm = ({ stock, mode }: PPEStockFormProps) => {
    const navigate = useNavigate();
    const [safetyEquipments, setSafetyEquipments] = useState<SafetyEquipment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [dataReady, setDataReady] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            receivedDate: new Date().toISOString().split('T')[0],
            notes: '',
            isActive: true,
            items: [
                {
                    safetyEquipmentId: '',
                    equipmentName: '',
                    equipmentType: '',
                    equipmentSize: '',
                    expiryDate: '',
                    initialQuantity: 1,
                    order: 1,
                },
            ],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'items',
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoadingData(true);

                // Fetch safety equipments (filter by PPE category)
                const equipmentsResponse = await safetyEquipmentService.getSafetyEquipments({
                    page: 1,
                    limit: 100,
                    filters: {
                        category: SafetyEquipmentCategory.PERSONAL_PROTECTIVE_EQUIPMENT,
                        isActive: true,
                    },
                });
                setSafetyEquipments(equipmentsResponse.data);
                setDataReady(true);
            } catch (error) {
                console.error('Error fetching form data:', error);
                toast.error('Failed to load form data');
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchData();
    }, []);

    // Set form data for edit mode after safetyEquipments are loaded
    useEffect(() => {
        if (stock && mode === 'edit' && dataReady && safetyEquipments.length > 0) {
            const formData = {
                receivedDate: stock.receivedDate.split('T')[0],
                notes: stock.notes || '',
                isActive: stock.isActive ?? true,
                items: stock.items?.map((item, index) => ({
                    id: item.id, // Include id for existing items
                    safetyEquipmentId: item.safetyEquipmentId ? String(item.safetyEquipmentId) : '',
                    equipmentName: item.equipmentName || '',
                    equipmentType: item.equipmentType || '',
                    equipmentSize: item.equipmentSize || '',
                    expiryDate: item.expiryDate ? item.expiryDate.split('T')[0] : '',
                    initialQuantity: item.initialQuantity,
                    order: index + 1,
                })) || [],
            };
            form.reset(formData);
        }
    }, [stock, mode, dataReady, safetyEquipments.length, form]);

    const handleEquipmentSelect = (itemIndex: number, equipmentId: string) => {
        const equipment = safetyEquipments.find((eq) => eq.id === equipmentId);
        if (equipment) {
            form.setValue(`items.${itemIndex}.safetyEquipmentId`, equipmentId);
            form.setValue(`items.${itemIndex}.equipmentName`, equipment.name);
            form.setValue(`items.${itemIndex}.equipmentType`, equipment.safetyEquipmentType?.name || '');
            form.setValue(`items.${itemIndex}.equipmentSize`, equipment.size || '');
        }
    };

    const handleRemoveEquipment = (itemIndex: number) => {
        form.setValue(`items.${itemIndex}.safetyEquipmentId`, '');
        form.setValue(`items.${itemIndex}.equipmentName`, '');
        form.setValue(`items.${itemIndex}.equipmentType`, '');
        form.setValue(`items.${itemIndex}.equipmentSize`, '');
    };

    const onSubmit = async (data: FormValues) => {
        setIsLoading(true);
        try {
            if (mode === 'create') {
                const createData: CreatePPEStockDTO = {
                    receivedDate: data.receivedDate,
                    notes: data.notes || undefined,
                    isActive: data.isActive,
                    items: data.items.map((item, index) => {
                        const itemData: CreatePPEStockItemDTO = {
                            safetyEquipmentId: item.safetyEquipmentId || undefined,
                            equipmentName: item.equipmentName || undefined,
                            equipmentType: item.equipmentType || undefined,
                            equipmentSize: item.equipmentSize || undefined,
                            expiryDate: item.expiryDate || undefined,
                            initialQuantity: item.initialQuantity,
                            order: index + 1,
                        };
                        return itemData;
                    }),
                };
                const createdStock = await ppeService.createStock(createData);
                toast.success('Stock created successfully');
                navigate(`/ppe/stocks/${createdStock.id}`);
            } else {
                const updateData: UpdatePPEStockDTO = {
                    receivedDate: data.receivedDate,
                    notes: data.notes || undefined,
                    isActive: data.isActive,
                    items: data.items.map((item, index) => ({
                        id: item.id, // Include id for existing items, omit for new items
                        safetyEquipmentId: item.safetyEquipmentId || undefined,
                        equipmentName: item.equipmentName || undefined,
                        equipmentType: item.equipmentType || undefined,
                        equipmentSize: item.equipmentSize || undefined,
                        expiryDate: item.expiryDate || undefined,
                        initialQuantity: item.initialQuantity,
                        order: index + 1,
                    })),
                };
                await ppeService.updateStock(stock!.id, updateData);
                toast.success('Stock updated successfully');
                navigate(`/ppe/stocks/${stock!.id}`);
            }
        } catch (error) {
            console.error('Error saving stock:', error);
            toast.error(`Failed to ${mode} stock`);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoadingData || !dataReady) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="text-center">Loading...</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{mode === 'create' ? 'Create' : 'Edit'} PPE Stock</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="receivedDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Received Date *</FormLabel>
                                        <FormControl>
                                            <DateTimePicker mode="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Enter notes (optional)"
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="isActive"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Active</FormLabel>
                                        <div className="text-sm text-muted-foreground">
                                            Stock entry will be available for withdrawals when active
                                        </div>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <FormLabel>Stock Items *</FormLabel>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        append({
                                            safetyEquipmentId: '',
                                            equipmentName: '',
                                            equipmentType: '',
                                            equipmentSize: '',
                                            expiryDate: '',
                                            initialQuantity: 1,
                                            order: fields.length + 1,
                                        })
                                    }
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Add Item
                                </Button>
                            </div>

                            {fields.map((field, index) => (
                                <Card key={field.id} className="p-4">
                                    <div className="flex items-start justify-between mb-4">
                                        <h4 className="font-medium">Item {index + 1}</h4>
                                        {fields.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => remove(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.safetyEquipmentId`}
                                            render={({ field }) => {
                                                const currentValue = field.value ? String(field.value) : '';
                                                const equipmentOptions = safetyEquipments.map((eq) => ({
                                                    value: eq.id,
                                                    label: `${eq.name} (${eq.code})`,
                                                }));
                                                return (
                                                    <FormItem>
                                                        <FormLabel>Equipment (from Master Data)</FormLabel>
                                                        <FormControl>
                                                            <SearchableSelect
                                                                key={`equipment-select-${index}-${dataReady ? 'ready' : 'loading'}`}
                                                                options={equipmentOptions}
                                                                value={currentValue}
                                                                onValueChange={(value) => {
                                                                    if (value === 'none') {
                                                                        field.onChange('');
                                                                        handleRemoveEquipment(index);
                                                                    } else {
                                                                        field.onChange(value);
                                                                        if (value) {
                                                                            handleEquipmentSelect(index, value);
                                                                        } else {
                                                                            handleRemoveEquipment(index);
                                                                        }
                                                                    }
                                                                }}
                                                                placeholder="Select equipment from master data (optional)"
                                                                searchPlaceholder="Search equipment..."
                                                                includeNone={true}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                );
                                            }}
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.equipmentName`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Equipment Name *</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Enter equipment name"
                                                                {...field}
                                                                disabled={!!form.watch(`items.${index}.safetyEquipmentId`)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.equipmentType`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Equipment Type</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Enter type"
                                                                {...field}
                                                                disabled={!!form.watch(`items.${index}.safetyEquipmentId`)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.equipmentSize`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Equipment Size</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Enter size"
                                                                {...field}
                                                                disabled={!!form.watch(`items.${index}.safetyEquipmentId`)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.expiryDate`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Expiry Date</FormLabel>
                                                        <FormControl>
                                                            <DateTimePicker
                                                                mode="date"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.initialQuantity`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Initial Quantity *</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                {...field}
                                                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        <div className="flex justify-end gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate('/ppe/stocks')}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Saving...' : mode === 'create' ? 'Create Stock' : 'Update Stock'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};

export default PPEStockForm;

