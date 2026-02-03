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
}).superRefine((data, ctx) => {
    // Validate requestedFor or requestedForName
    if (!data.requestedFor && !data.requestedForName) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Either select a user or enter a name',
            path: ['requestedFor'],
        });
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Either select a user or enter a name',
            path: ['requestedForName'],
        });
    }

    // Validate jobPositionId or jobPositionName
    if (!data.jobPositionId && !data.jobPositionName) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Either select a job position or enter a job position name',
            path: ['jobPositionId'],
        });
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Either select a job position or enter a job position name',
            path: ['jobPositionName'],
        });
    }

    // Validate items - ensure all items have stockItemId
    data.items.forEach((item, index) => {
        if (!item.stockItemId) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Stock item is required',
                path: ['items', index, 'stockItemId'],
            });
        }
    });
});

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
                    departmentService.getDepartments({ page: 1, limit: 100, options: true }),
                    jobPositionService.getAll({ page: 1, limit: 100, options: true }),
                    userService.getUsers({ page: 1, limit: 100, options: true }),
                    ppeService.getAvailableStockItems({
                        page: 1,
                        limit: 1000,
                        availableOnly: true,
                        status: PPEStockStatus.AVAILABLE,
                        groupBySafetyEquipment: true,
                        includeExpired: true,
                    }),
                ]);

                setWithdrawalLetterCategoryId(categoryId);
                setDepartments(deptsRes.data);
                setJobPositions(positionsRes.data);
                setUsers(usersRes.data);

                // For edit mode, include existing withdrawal items in available options
                // This ensures previously selected items appear in the dropdown
                let finalStockItems = stockItemsRes.data;
                if (withdrawal && mode === 'edit' && withdrawal.items) {
                    const existingItemIds = new Set(stockItemsRes.data.map(si => si.id));
                    const existingWithdrawalItems: PPEStockItem[] = [];

                    for (const item of withdrawal.items) {
                        if (!existingItemIds.has(item.stockItemId)) {
                            existingWithdrawalItems.push({
                                id: item.stockItemId,
                                stockId: '',
                                equipmentName: item.stockItemEquipmentName || 'Unknown',
                                equipmentType: item.stockItemEquipmentType || null,
                                equipmentSize: item.stockItemEquipmentSize || null,
                                currentQuantity: item.requestedQuantity,
                                initialQuantity: 0,
                                reservedQuantity: 0,
                                status: PPEStockStatus.AVAILABLE,
                                order: item.order,
                                createdAt: '',
                                updatedAt: '',
                            });
                        }
                    }

                    finalStockItems = [...stockItemsRes.data, ...existingWithdrawalItems];
                }
                setAvailableStockItems(finalStockItems);

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

        // Validate file type (PDF, DOC, DOCX only)
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Invalid file type. Please upload PDF, DOC, or DOCX files only.');
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
            // Use downloadUrl if available, otherwise construct URL based on isPublic and accessToken
            let fileUrl: string;
            if (response.data.downloadUrl) {
                // downloadUrl is already a path like /uploads/public/:id or /uploads/private/:token
                fileUrl = response.data.downloadUrl;
            } else if (response.data.accessToken) {
                // For private files, use accessToken
                fileUrl = `/uploads/private/${response.data.accessToken}`;
            } else if (response.data.id) {
                // For public files or fallback, use file ID
                fileUrl = `/uploads/public/${response.data.id}`;
            } else {
                throw new Error('No file URL, accessToken, or ID returned from upload');
            }
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
            const stockItem = availableStockItems.find((si) => si.id === item.stockItemId);
            if (!stockItem) {
                toast.error(`Stock item not found`);
                return;
            }

            // For grouped items, validate against total quantity
            const maxQty = stockItem.isGrouped ? stockItem.currentQuantity : getMaxQuantity(item.stockItemId);
            if (item.requestedQuantity > maxQty) {
                toast.error(`Requested quantity exceeds available stock for selected item`);
                return;
            }
        }

        setIsLoading(true);
        try {
            // Process items - for grouped items, we need to fetch individual stock items
            const processedItems: CreatePPEWithdrawalItemDTO[] = [];

            for (let index = 0; index < data.items.length; index++) {
                const item = data.items[index];
                const stockItem = availableStockItems.find((si) => si.id === item.stockItemId);

                if (stockItem?.isGrouped && stockItem.stockItemIds && stockItem.stockItemIds.length > 0) {
                    // For grouped items, fetch individual stock items and select appropriate ones
                    const individualItemsRes = await ppeService.getAvailableStockItems({
                        page: 1,
                        limit: 1000,
                        availableOnly: true,
                        includeExpired: true,
                        groupBySafetyEquipment: false,
                    });

                    // Filter items that belong to this safety equipment
                    const matchingItems = individualItemsRes.data.filter((si) =>
                        stockItem.stockItemIds?.includes(si.id) &&
                        si.currentQuantity > 0 &&
                        (si.status === PPEStockStatus.AVAILABLE || si.status === PPEStockStatus.EXPIRED)
                    );

                    // Sort by expiry date (earliest first) to use FIFO
                    matchingItems.sort((a, b) => {
                        if (!a.expiryDate && !b.expiryDate) return 0;
                        if (!a.expiryDate) return 1;
                        if (!b.expiryDate) return -1;
                        return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
                    });

                    // Distribute quantity across items
                    let remainingQty = item.requestedQuantity;
                    for (const individualItem of matchingItems) {
                        if (remainingQty <= 0) break;

                        const qtyToUse = Math.min(remainingQty, individualItem.currentQuantity - individualItem.reservedQuantity);
                        if (qtyToUse > 0) {
                            processedItems.push({
                                stockItemId: individualItem.id,
                                requestedQuantity: qtyToUse,
                                order: index + 1,
                            });
                            remainingQty -= qtyToUse;
                        }
                    }

                    if (remainingQty > 0) {
                        toast.error(`Insufficient stock for ${stockItem.equipmentName}`);
                        setIsLoading(false);
                        return;
                    }
                } else {
                    // Regular item, use as is
                    processedItems.push({
                        stockItemId: item.stockItemId,
                        requestedQuantity: item.requestedQuantity,
                        order: index + 1,
                    });
                }
            }

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
                    items: processedItems,
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
                    items: processedItems,
                };
                await ppeService.updateWithdrawal(withdrawal!.id, updateData);
                toast.success('Withdrawal updated successfully');
                navigate(`/ppe/withdrawals/${withdrawal!.id}`);
            }
        } catch (error: any) {
            console.error('Error saving withdrawal:', error);
            const errorMessage = error.response?.data?.message || `Failed to ${mode} withdrawal`;
            toast.error(errorMessage);
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

                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Either select a user OR enter a name manually</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="requestedFor"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Requested For (User) *</FormLabel>
                                        <FormControl>
                                            <SearchableSelect
                                                options={users.map((user) => ({
                                                    value: user.id,
                                                    label: `${user.name} (${user.email})`,
                                                }))}
                                                value={field.value || ''}
                                                onValueChange={(value) => {
                                                    const actualValue = value === 'none' ? '' : value;
                                                    field.onChange(actualValue);
                                                    if (actualValue) {
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
                                        <FormLabel>Requested For (Name) *</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter name if not a user"
                                                {...field}
                                                disabled={!!requestedForValue && requestedForValue !== 'none'}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Either select a job position OR enter a name manually</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="jobPositionId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Job Position *</FormLabel>
                                        <FormControl>
                                            <SearchableSelect
                                                options={jobPositions.map((pos) => ({
                                                    value: pos.id,
                                                    label: pos.name,
                                                }))}
                                                value={field.value || ''}
                                                onValueChange={(value) => {
                                                    const actualValue = value === 'none' ? '' : value;
                                                    field.onChange(actualValue);
                                                    if (actualValue) {
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
                                        <FormLabel>Job Position Name *</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter job position if not from master data"
                                                {...field}
                                                disabled={!!jobPositionIdValue && jobPositionIdValue !== 'none'}
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
                                                        accept=".pdf,.doc,.docx"
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
                                        Upload PDF, DOC, or DOCX files only (max 10MB)
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
                                                                {...(maxQty > 0 ? { max: maxQty } : {})}
                                                                {...field}
                                                                onChange={(e) => {
                                                                    const value = parseInt(e.target.value) || 1;
                                                                    // Only apply max constraint if stock item is selected
                                                                    if (maxQty > 0) {
                                                                        field.onChange(Math.min(value, maxQty));
                                                                    } else {
                                                                        field.onChange(Math.max(1, value));
                                                                    }
                                                                }}
                                                            />
                                                        </FormControl>
                                                        {selectedStockItemId && maxQty > 0 && (
                                                            <p className="text-sm text-muted-foreground">
                                                                Maximum available: {maxQty}
                                                            </p>
                                                        )}
                                                        {!selectedStockItemId && (
                                                            <p className="text-sm text-yellow-600">
                                                                Please select a stock item first
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

