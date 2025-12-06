import { useEffect } from 'react';
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
import PageHeader from '@/core/components/ui/PageHeader';
import certificateCategoryService from '../services/certificateCategoryService';
import { CertificateCategory, CertificateType } from '../types/certificate.types';

const certificateTypeOptions: { value: CertificateType; label: string }[] = [
    { value: 'PERSONNEL_LICENSE', label: 'Personnel License' },
    { value: 'PERSONNEL_CERTIFICATE', label: 'Personnel Certificate' },
    { value: 'EQUIPMENT_CALIBRATION', label: 'Equipment Calibration' },
    { value: 'EQUIPMENT_INSTALLATION', label: 'Equipment Installation' },
    { value: 'EQUIPMENT_OPERATIONAL_PERMIT', label: 'Equipment Operational Permit' },
];

const formSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    code: z.string().min(1, 'Code is required'),
    certificateType: z.enum([
        'PERSONNEL_LICENSE',
        'PERSONNEL_CERTIFICATE',
        'EQUIPMENT_CALIBRATION',
        'EQUIPMENT_INSTALLATION',
        'EQUIPMENT_OPERATIONAL_PERMIT',
    ]),
    description: z.string().optional(),
    isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface CertificateCategoryFormProps {
    category?: CertificateCategory;
    mode: 'create' | 'edit';
}

const CertificateCategoryForm = ({ category, mode }: CertificateCategoryFormProps) => {
    const navigate = useNavigate();
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            code: '',
            certificateType: 'PERSONNEL_LICENSE',
            description: '',
            isActive: true,
        },
    });

    useEffect(() => {
        if (category) {
            form.reset({
                name: category.name,
                code: category.code,
                certificateType: category.certificateType,
                description: category.description || '',
                isActive: category.isActive,
            });
        }
    }, [category, form]);

    const onSubmit = async (data: FormValues) => {
        try {
            if (mode === 'create') {
                await certificateCategoryService.createCategory(data);
                toast.success('Certificate category created successfully');
            } else {
                await certificateCategoryService.updateCategory(category!.id, data);
                toast.success('Certificate category updated successfully');
            }
            navigate('/master/certificate-categories');
        } catch (error: any) {
            console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} category:`, error);
            const errorMessage =
                error.response?.data?.message ||
                `Failed to ${mode === 'create' ? 'create' : 'update'} certificate category`;
            toast.error(errorMessage);
        }
    };

    return (
        <>
            <PageHeader
                title={mode === 'create' ? 'Create Certificate Category' : 'Edit Certificate Category'}
                subtitle={
                    mode === 'create'
                        ? 'Add a new certificate category'
                        : 'Update certificate category information'
                }
            />
            <Card>
                <CardHeader>
                    <CardTitle>
                        {mode === 'create' ? 'Create' : 'Edit'} Certificate Category
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter category name" {...field} />
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
                                        <FormLabel>Code *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter category code" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="certificateType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Certificate Type *</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select certificate type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {certificateTypeOptions.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
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
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Enter category description"
                                                rows={4}
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
                                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel>Active Status</FormLabel>
                                            <div className="text-sm text-gray-500">
                                                Enable or disable this certificate category
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
                                    onClick={() => navigate('/master/certificate-categories')}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    {mode === 'create' ? 'Create Category' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </>
    );
};

export default CertificateCategoryForm;

