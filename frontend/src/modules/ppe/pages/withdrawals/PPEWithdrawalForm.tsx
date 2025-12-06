import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Trash2, Upload, X, FileText } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import api from '@/core/lib/api';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { SearchableSelect } from '@/core/components/ui/searchable-select';
import ppeService from '../../services/ppeService';
import { departmentService, jobPositionService, type Department, type JobPosition } from '@/modules/master-data';
import { userService, type User } from '@/modules/users';
import {
    CreatePPEWithdrawalDTO,
    UpdatePPEWithdrawalDTO,
    CreatePPEWithdrawalItemDTO,
    PPEWithdrawal,
    PPEStockItem,
    PPEStockStatus,
} from '../../types/ppe.types';

const withdrawalItemSchema = z.object({
    stockItemId: z.string().min(1, 'Stock item is required'),
    requestedQuantity: z.number().min(1, 'Quantity must be at least 1'),
    order: z.number().optional(),
});

const formSchema = z.object({
    withdrawalDate: z.string().min(1, 'Withdrawal date is required'),
    requestedFor: z.string().optional(),
    requestedForName: z.string().optional(),
    departmentId: z.string().min(1, 'Department is required'),
    jobPositionId: z.string().optional(),
    jobPositionName: z.string().optional(),
    withdrawalLetterUrl: z.string().optional(),
    notes: z.string().optional(),
    items: z.array(withdrawalItemSchema).min(1, 'At least one item is required'),
}).refine(
    (data) => data.requestedFor || data.requestedForName,
    {
        message: 'Either select a user or enter a name',
        path: ['requestedForName'],
    }
).refine(
    (data) => {
        // Validate quantity doesn't exceed available stock
        return true; // Will be validated in onSubmit
    }
);

type FormValues = z.infer<typeof formSchema>;

interface PPEWithdrawalFormProps {
    withdrawal?: PPEWithdrawal;
    mode: 'create' | 'edit';
}

const PPEWithdrawalForm = ({ withdrawal, mode }: PPEWithdrawalFormProps) => {
    const navigate = useNavigate();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [jobPositions, setJobPositions] = useState<JobPosition[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [availableStockItems, setAvailableStockItems] = useState<PPEStockItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [dataReady, setDataReady] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
    const [withdrawalLetterCategoryId, setWithdrawalLetterCategoryId] = useState<string | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            withdrawalDate: new Date().toISOString().split('T')[0],
            requestedFor: '',
            requestedForName: '',
            departmentId: '',
            jobPositionId: '',
            jobPositionName: '',
            withdrawalLetterUrl: '',
            notes: '',
            items: [
                {
                    stockItemId: '',
                    requestedQuantity: 1,
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

                // Fetch file category ID for withdrawal letter
                let categoryId: string | null = null;
                try {
                    const categoriesRes = await api.get<Array<{ id: string; name: string }>>('/uploads/categories');
                    const category = categoriesRes.data.find(
                        (cat) => cat.name === 'ppe-withdrawal-letter'
                    );
                    if (category) {
                        categoryId = category.id;
                    }
                } catch (error) {
                    console.error('Failed to fetch file categories:', error);
                }

                // Fetch departments, job positions, users, and available stock items
                const [deptsRes, positionsRes, usersRes, stockItemsRes] = await Promise.all([
                    departmentService.getDepartments({ page: 1, limit: 100 }),
                    jobPositionService.getAll({ page: 1, limit: 100 }),
                    userService.getUsers({ page: 1, limit: 100 }),
                    ppeService.getAvailableStockItems({
                        page: 1,
                        limit: 1000,
                        availableOnly: true,
                        status: PPEStockStatus.AVAILABLE,
                    }),
                ]);

                setWithdrawalLetterCategoryId(categoryId);
                setDepartments(deptsRes.data);
                setJobPositions(positionsRes.data);
                setUsers(usersRes.data);
                setAvailableStockItems(stockItemsRes.data);

                // Set form data for edit mode
                if (withdrawal && mode === 'edit') {
                    form.reset({
                        withdrawalDate: withdrawal.withdrawalDate.split('T')[0],
                        requestedFor: withdrawal.requestedFor || '',
                        requestedForName: withdrawal.requestedForName || '',
                        departmentId: withdrawal.departmentId,
                        jobPositionId: withdrawal.jobPositionId || '',
                        jobPositionName: withdrawal.jobPositionName || '',
                        withdrawalLetterUrl: withdrawal.withdrawalLetterUrl || '',
                        notes: withdrawal.notes || '',
                        items: withdrawal.items?.map((item, index) => ({
                            stockItemId: item.stockItemId,
                            requestedQuantity: item.requestedQuantity,
                            order: index + 1,
                        })) || [],
                    });
                    if (withdrawal.withdrawalLetterUrl) {
                        setUploadedFileName('Withdrawal Letter');
                    }
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
    }, [withdrawal, mode, form]);

    const getStockItemLabel = (stockItem: PPEStockItem) => {
        const name = stockItem.equipmentName || 'Unknown';
        const type = stockItem.equipmentType ? ` (${stockItem.equipmentType})` : '';
        const size = stockItem.equipmentSize ? ` - ${stockItem.equipmentSize}` : '';
        const available = ` - Available: ${stockItem.currentQuantity}`;
        return `${name}${type}${size}${available}`;
    };

    const getMaxQuantity = (stockItemId: string) => {
        const stockItem = availableStockItems.find((item) => item.id === stockItemId);
        return stockItem?.currentQuantity || 0;
    };

    const handleFileUpload = async (file: File) => {
        if (!file) return;

        // Validate file type (PDF, DOC, DOCX, images)
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'image/jpg',
        ];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Invalid file type. Please upload PDF, DOC, DOCX, or image files.');
            return;
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            toast.error('File size exceeds 10MB limit.');
            return;
        }

        if (!withdrawalLetterCategoryId) {
            toast.error('File category not found. Please refresh the page.');
            return;
        }

        setUploadingFile(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('categoryId', withdrawalLetterCategoryId);
            formData.append('isPublic', 'false');

            const response = await api.post('/uploads/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // Get the file URL from response
            const fileUrl = response.data.publicUrl || response.data.privateUrl || response.data.id;
            form.setValue('withdrawalLetterUrl', fileUrl);
            setUploadedFileName(file.name);
            toast.success('File uploaded successfully');
        } catch (error: any) {
            console.error('Error uploading file:', error);
            const errorMessage = error.response?.data?.message || 'Failed to upload file';
            toast.error(errorMessage);
        } finally {
            setUploadingFile(false);
        }
    };

    const handleFileRemove = () => {
        form.setValue('withdrawalLetterUrl', '');
        setUploadedFileName(null);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileUpload(file);
        }
    };

    const onSubmit = async (data: FormValues) => {
        // Validate quantities don't exceed available stock
        for (const item of data.items) {
            const maxQty = getMaxQuantity(item.stockItemId);
            if (item.requestedQuantity > maxQty) {
                toast.error(`Requested quantity exceeds available stock for selected item`);
                return;
            }
        }

        setIsLoading(true);
        try {
            if (mode === 'create') {
                const createData: CreatePPEWithdrawalDTO = {
                    withdrawalDate: data.withdrawalDate,
                    requestedFor: data.requestedFor || undefined,
                    requestedForName: data.requestedForName || undefined,
                    departmentId: data.departmentId,
                    jobPositionId: data.jobPositionId || undefined,
                    jobPositionName: data.jobPositionName || undefined,
                    withdrawalLetterUrl: data.withdrawalLetterUrl || undefined,
                    notes: data.notes || undefined,
                    items: data.items.map((item, index) => {
                        const itemData: CreatePPEWithdrawalItemDTO = {
                            stockItemId: item.stockItemId,
                            requestedQuantity: item.requestedQuantity,
                            order: index + 1,
                        };
                        return itemData;
                    }),
                };
                const createdWithdrawal = await ppeService.createWithdrawal(createData);
                toast.success('Withdrawal created successfully');
                navigate(`/ppe/withdrawals/${createdWithdrawal.id}`);
            } else {
                const updateData: CreatePPEWithdrawalDTO = {
                    withdrawalDate: data.withdrawalDate,
                    requestedFor: data.requestedFor || undefined,
                    requestedForName: data.requestedForName || undefined,
                    departmentId: data.departmentId,
                    jobPositionId: data.jobPositionId || undefined,
                    jobPositionName: data.jobPositionName || undefined,
                    withdrawalLetterUrl: data.withdrawalLetterUrl || undefined,
                    notes: data.notes || undefined,
                    items: data.items.map((item, index) => ({
                        stockItemId: item.stockItemId,
                        requestedQuantity: item.requestedQuantity,
                        order: index + 1,
                    })),
                };
                await ppeService.updateWithdrawal(withdrawal!.id, updateData);
                toast.success('Withdrawal updated successfully');
                navigate(`/ppe/withdrawals/${withdrawal!.id}`);
            }
        } catch (error) {
            console.error('Error saving withdrawal:', error);
            toast.error(`Failed to ${mode} withdrawal`);
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

    const requestedForValue = form.watch('requestedFor');
    const jobPositionIdValue = form.watch('jobPositionId');

    return (
        <Card>
            <CardHeader>
                <CardTitle>{mode === 'create' ? 'Create' : 'Edit'} PPE Withdrawal</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="withdrawalDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Withdrawal Date *</FormLabel>
                                        <FormControl>
                                            <DateTimePicker mode="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="departmentId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Department *</FormLabel>
                                        <FormControl>
                                            <SearchableSelect
                                                options={departments.map((dept) => ({
                                                    value: dept.id,
                                                    label: dept.name,
                                                }))}
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                placeholder="Select department"
                                                searchPlaceholder="Search departments..."
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="requestedFor"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Requested For (User)</FormLabel>
                                        <FormControl>
                                            <SearchableSelect
                                                options={users.map((user) => ({
                                                    value: user.id,
                                                    label: `${user.name} (${user.email})`,
                                                }))}
                                                value={field.value || ''}
                                                onValueChange={(value) => {
                                                    field.onChange(value);
                                                    if (value) {
                                                        form.setValue('requestedForName', '');
                                                    }
                                                }}
                                                placeholder="Select user (optional)"
                                                searchPlaceholder="Search users..."
                                                includeNone={true}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="requestedForName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Requested For (Name)</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter name if not a user"
                                                {...field}
                                                disabled={!!requestedForValue}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="jobPositionId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Job Position</FormLabel>
                                        <FormControl>
                                            <SearchableSelect
                                                options={jobPositions.map((pos) => ({
                                                    value: pos.id,
                                                    label: pos.name,
                                                }))}
                                                value={field.value || ''}
                                                onValueChange={(value) => {
                                                    field.onChange(value);
                                                    if (value) {
                                                        form.setValue('jobPositionName', '');
                                                    }
                                                }}
                                                placeholder="Select job position (optional)"
                                                searchPlaceholder="Search job positions..."
                                                includeNone={true}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="jobPositionName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Job Position Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter job position if not from master data"
                                                {...field}
                                                disabled={!!jobPositionIdValue}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="withdrawalLetterUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Withdrawal Letter</FormLabel>
                                    <FormControl>
                                        <div className="space-y-2">
                                            {uploadedFileName ? (
                                                <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-gray-600" />
                                                        <span className="text-sm font-medium">{uploadedFileName}</span>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={handleFileRemove}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="file"
                                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                        onChange={handleFileInputChange}
                                                        disabled={uploadingFile}
                                                        className="cursor-pointer"
                                                    />
                                                    {uploadingFile && (
                                                        <span className="text-sm text-muted-foreground">Uploading...</span>
                                                    )}
                                                </div>
                                            )}
                                            <input type="hidden" {...field} />
                                        </div>
                                    </FormControl>
                                    <p className="text-sm text-muted-foreground">
                                        Upload PDF, DOC, DOCX, or image files (max 10MB)
                                    </p>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <FormLabel>Withdrawal Items *</FormLabel>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        append({
                                            stockItemId: '',
                                            requestedQuantity: 1,
                                            order: fields.length + 1,
                                        })
                                    }
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Add Item
                                </Button>
                            </div>

                            {fields.map((field, index) => {
                                const selectedStockItemId = form.watch(`items.${index}.stockItemId`);
                                const maxQty = selectedStockItemId ? getMaxQuantity(selectedStockItemId) : 0;

                                return (
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
                                                name={`items.${index}.stockItemId`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Stock Item *</FormLabel>
                                                        <FormControl>
                                                            <SearchableSelect
                                                                options={availableStockItems.map((item) => ({
                                                                    value: item.id,
                                                                    label: getStockItemLabel(item),
                                                                }))}
                                                                value={field.value}
                                                                onValueChange={field.onChange}
                                                                placeholder="Select stock item"
                                                                searchPlaceholder="Search stock items..."
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.requestedQuantity`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Requested Quantity *</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                max={maxQty}
                                                                {...field}
                                                                onChange={(e) => {
                                                                    const value = parseInt(e.target.value) || 1;
                                                                    field.onChange(Math.min(value, maxQty));
                                                                }}
                                                            />
                                                        </FormControl>
                                                        {selectedStockItemId && (
                                                            <p className="text-sm text-muted-foreground">
                                                                Maximum available: {maxQty}
                                                            </p>
                                                        )}
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>

                        <div className="flex justify-end gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate('/ppe/withdrawals')}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Saving...' : mode === 'create' ? 'Create Withdrawal' : 'Update Withdrawal'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};

export default PPEWithdrawalForm;

