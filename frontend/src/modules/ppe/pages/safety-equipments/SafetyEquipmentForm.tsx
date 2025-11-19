import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
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
import { Switch } from '@/core/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/core/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import safetyEquipmentService from '../../services/safetyEquipmentService';
import safetyEquipmentTypeService from '../../services/safetyEquipmentTypeService';
import {
    CreateSafetyEquipmentDTO,
    UpdateSafetyEquipmentDTO,
    SafetyEquipment,
    SafetyEquipmentType,
    SafetyEquipmentCategory,
} from '../../types/ppe-master-data.types';

const formSchema = z.object({
    name: z.string().min(1, 'Safety equipment name is required'),
    code: z.string().min(1, 'Safety equipment code is required'),
    safetyEquipmentTypeId: z.string().min(1, 'Safety equipment type is required'),
    size: z.string().optional(),
    description: z.string().optional(),
    category: z.nativeEnum(SafetyEquipmentCategory, {
        required_error: 'Category is required',
    }),
    isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface SafetyEquipmentFormProps {
    equipment?: SafetyEquipment;
    mode: 'create' | 'edit';
}

const SafetyEquipmentForm = ({ equipment, mode }: SafetyEquipmentFormProps) => {
    const navigate = useNavigate();
    const [safetyEquipmentTypes, setSafetyEquipmentTypes] = useState<SafetyEquipmentType[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [dataReady, setDataReady] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            code: '',
            safetyEquipmentTypeId: '',
            size: '',
            description: '',
            category: SafetyEquipmentCategory.PERSONAL_PROTECTIVE_EQUIPMENT,
            isActive: true,
        },
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoadingData(true);

                // Fetch safety equipment types
                const typesResponse = await safetyEquipmentTypeService.getSafetyEquipmentTypes({
                    page: 1,
                    limit: 100,
                    filters: { isActive: true },
                });
                setSafetyEquipmentTypes(typesResponse.data);

                // Set form data for edit mode
                if (equipment && mode === 'edit') {
                    form.reset({
                        name: equipment.name,
                        code: equipment.code,
                        safetyEquipmentTypeId: equipment.safetyEquipmentTypeId,
                        size: equipment.size || '',
                        description: equipment.description || '',
                        category: equipment.category,
                        isActive: equipment.isActive,
                    });
                }

                setDataReady(true);
            } catch (error) {
                console.error('Error fetching form data:', error);
                toast.error('Failed to load form data');
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchData();
    }, [equipment, mode, form]);

    const onSubmit = async (data: FormValues) => {
        setIsLoading(true);
        try {
            if (mode === 'create') {
                const createData: CreateSafetyEquipmentDTO = {
                    name: data.name,
                    code: data.code,
                    safetyEquipmentTypeId: data.safetyEquipmentTypeId,
                    size: data.size || undefined,
                    description: data.description || undefined,
                    category: data.category,
                    isActive: data.isActive,
                };
                await safetyEquipmentService.createSafetyEquipment(createData);
                toast.success('Safety equipment created successfully');
            } else {
                const updateData: UpdateSafetyEquipmentDTO = {
                    name: data.name,
                    code: data.code,
                    safetyEquipmentTypeId: data.safetyEquipmentTypeId,
                    size: data.size || undefined,
                    description: data.description || undefined,
                    category: data.category,
                    isActive: data.isActive,
                };
                await safetyEquipmentService.updateSafetyEquipment(equipment!.id, updateData);
                toast.success('Safety equipment updated successfully');
            }
            navigate('/master/safety-equipments');
        } catch (error) {
            console.error('Error saving safety equipment:', error);
            toast.error(`Failed to ${mode} safety equipment`);
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
                <CardTitle>{mode === 'create' ? 'Create' : 'Edit'} Safety Equipment</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Equipment Name *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter equipment name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Equipment Code *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter equipment code" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="safetyEquipmentTypeId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Equipment Type *</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select equipment type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {safetyEquipmentTypes.map((type) => (
                                                    <SelectItem key={type.id} value={type.id}>
                                                        {type.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category *</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value={SafetyEquipmentCategory.PERSONAL_PROTECTIVE_EQUIPMENT}>
                                                    Personal Protective Equipment
                                                </SelectItem>
                                                <SelectItem value={SafetyEquipmentCategory.SAFETY_EQUIPMENT}>
                                                    Safety Equipment
                                                </SelectItem>
                                                <SelectItem value={SafetyEquipmentCategory.EMERGENCY_EQUIPMENT}>
                                                    Emergency Equipment
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="size"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Size</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter size (e.g., M, L, 42, One Size)" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Enter description"
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
                                        <FormLabel className="text-base">Active Status</FormLabel>
                                        <div className="text-sm text-muted-foreground">
                                            Enable or disable this safety equipment
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

                        <div className="flex justify-end gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate('/master/safety-equipments')}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};

export default SafetyEquipmentForm;

