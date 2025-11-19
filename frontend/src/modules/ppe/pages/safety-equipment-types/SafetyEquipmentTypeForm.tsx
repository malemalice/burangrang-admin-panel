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
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import safetyEquipmentTypeService from '../../services/safetyEquipmentTypeService';
import {
    CreateSafetyEquipmentTypeDTO,
    UpdateSafetyEquipmentTypeDTO,
    SafetyEquipmentType,
} from '../../types/ppe-master-data.types';

const formSchema = z.object({
    name: z.string().min(1, 'Safety equipment type name is required'),
    code: z.string().min(1, 'Safety equipment type code is required'),
    description: z.string().optional(),
    isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface SafetyEquipmentTypeFormProps {
    type?: SafetyEquipmentType;
    mode: 'create' | 'edit';
}

const SafetyEquipmentTypeForm = ({ type, mode }: SafetyEquipmentTypeFormProps) => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [dataReady, setDataReady] = useState(true);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            code: '',
            description: '',
            isActive: true,
        },
    });

    useEffect(() => {
        if (mode === 'edit' && type) {
            setIsLoadingData(true);
            form.reset({
                name: type.name,
                code: type.code,
                description: type.description || '',
                isActive: type.isActive,
            });
            setIsLoadingData(false);
            setDataReady(true);
        } else {
            setDataReady(true);
        }
    }, [type, mode, form]);

    const onSubmit = async (data: FormValues) => {
        setIsLoading(true);
        try {
            if (mode === 'create') {
                const createData: CreateSafetyEquipmentTypeDTO = {
                    name: data.name,
                    code: data.code,
                    description: data.description || undefined,
                    isActive: data.isActive,
                };
                await safetyEquipmentTypeService.createSafetyEquipmentType(createData);
                toast.success('Safety equipment type created successfully');
            } else {
                const updateData: UpdateSafetyEquipmentTypeDTO = {
                    name: data.name,
                    code: data.code,
                    description: data.description || undefined,
                    isActive: data.isActive,
                };
                await safetyEquipmentTypeService.updateSafetyEquipmentType(type!.id, updateData);
                toast.success('Safety equipment type updated successfully');
            }
            navigate('/master/safety-equipment-types');
        } catch (error) {
            console.error('Error saving safety equipment type:', error);
            toast.error(`Failed to ${mode} safety equipment type`);
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
                <CardTitle>{mode === 'create' ? 'Create' : 'Edit'} Safety Equipment Type</CardTitle>
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
                                        <FormLabel>Type Name *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter type name" {...field} />
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
                                        <FormLabel>Type Code *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter type code" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

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
                                            Enable or disable this safety equipment type
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
                                onClick={() => navigate('/master/safety-equipment-types')}
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

export default SafetyEquipmentTypeForm;

