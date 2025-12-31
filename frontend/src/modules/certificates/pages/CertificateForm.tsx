import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Upload, X, FileText } from 'lucide-react';
import api from '@/core/lib/api';
import { Button } from '@/core/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
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
import { SearchableSelect, SearchableSelectOption } from '@/core/components/ui/searchable-select';
import { useCertificate, useCertificates } from '../hooks/useCertificates';
import { useCertificateCategories } from '../hooks/useCertificates';
import { departmentService } from '@/modules/master-data';
import { userService } from '@/modules/users';
import {
    Certificate,
    CertificateFormData,
    CreateCertificateDTO,
    UpdateCertificateDTO,
    CertificateType,
} from '../types/certificate.types';
import { Department } from '@/core/lib/types';

const formSchema = z
    .object({
        certificateNumber: z.string().min(1, 'Certificate number is required'),
        certificateName: z.string().min(1, 'Certificate name is required'),
        categoryId: z.string().min(1, 'Category is required'),
        certificateType: z.string().min(1, 'Certificate type is required'),
        issuedDate: z.string().min(1, 'Issued date is required'),
        validityDate: z.string().min(1, 'Validity date is required'),
        issuerName: z.string().min(1, 'Issuer name is required'),
        documentUrl: z.string().optional(),
        personnelId: z.string().optional(),
        personnelName: z.string().optional(),
        equipmentId: z.string().optional(),
        equipmentName: z.string().optional(),
        departmentId: z.string().min(1, 'Department is required'),
        reminderDays: z.number().min(1, 'Reminder days must be at least 1').default(30),
        notes: z.string().optional(),
    })
    .refine(
        (data) => {
            // For personnel certificates: Either personnelId OR personnelName (not both)
            if (
                data.certificateType === 'PERSONNEL_LICENSE' ||
                data.certificateType === 'PERSONNEL_CERTIFICATE'
            ) {
                // Must have one but not both
                const hasPersonnelId = !!data.personnelId;
                const hasPersonnelName = !!data.personnelName;
                return (hasPersonnelId || hasPersonnelName) && !(hasPersonnelId && hasPersonnelName);
            }
            // For equipment certificates: equipmentName is required
            if (
                data.certificateType === 'EQUIPMENT_CALIBRATION' ||
                data.certificateType === 'EQUIPMENT_INSTALLATION' ||
                data.certificateType === 'EQUIPMENT_OPERATIONAL_PERMIT'
            ) {
                return !!data.equipmentName;
            }
            return true;
        },
        {
            message: 'Either select from list OR enter name manually (not both)',
            path: ['personnelName'],
        },
    )
    .refine(
        (data) => {
            // Validate equipment name is required for equipment certificates
            const equipmentTypes = [
                'EQUIPMENT_CALIBRATION',
                'EQUIPMENT_INSTALLATION',
                'EQUIPMENT_OPERATIONAL_PERMIT',
            ];
            if (equipmentTypes.includes(data.certificateType)) {
                return !!data.equipmentName;
            }
            return true;
        },
        {
            message: 'Equipment Name is required',
            path: ['equipmentName'],
        },
    );

type FormValues = z.infer<typeof formSchema>;

interface CertificateFormProps {
    certificate?: Certificate;
    mode: 'create' | 'edit';
}

const CertificateForm = ({ certificate, mode }: CertificateFormProps) => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { categories, fetchCategories } = useCertificateCategories();
    const { certificate: certificateData, isLoading: isLoadingCertificate } = useCertificate(
        mode === 'edit' ? id || null : null,
    );
    const { createCertificate, updateCertificate } = useCertificates();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [dataReady, setDataReady] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
    const [fileCategoryId, setFileCategoryId] = useState<string>('');

    const categoryOptions: SearchableSelectOption[] = categories.map((cat) => ({
        value: cat.id,
        label: cat.name,
    }));

    const departmentOptions: SearchableSelectOption[] = departments.map((dept) => ({
        value: dept.id,
        label: dept.name,
    }));

    const userOptions: SearchableSelectOption[] = users.map((user) => ({
        value: user.id,
        label: user.name,
    }));

    const certificateTypeOptions: { value: CertificateType; label: string }[] = [
        { value: 'PERSONNEL_LICENSE', label: 'Personnel License' },
        { value: 'PERSONNEL_CERTIFICATE', label: 'Personnel Certificate' },
        { value: 'EQUIPMENT_CALIBRATION', label: 'Equipment Calibration' },
        { value: 'EQUIPMENT_INSTALLATION', label: 'Equipment Installation' },
        { value: 'EQUIPMENT_OPERATIONAL_PERMIT', label: 'Equipment Operational Permit' },
    ];

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            certificateNumber: '',
            certificateName: '',
            categoryId: '',
            certificateType: 'PERSONNEL_LICENSE',
            issuedDate: new Date().toISOString().split('T')[0],
            validityDate: '',
            issuerName: '',
            documentUrl: '',
            personnelId: '',
            personnelName: '',
            equipmentId: '',
            equipmentName: '',
            departmentId: '',
            reminderDays: 30,
            notes: '',
        },
    });

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                setIsLoading(true);

                // Fetch file category ID for certificate documents
                let categoryId: string | null = null;
                try {
                    const categoriesRes = await api.get<Array<{ id: string; name: string }>>('/uploads/categories');
                    const category = categoriesRes.data.find(
                        (cat) => cat.name === 'certificate-documents'
                    );
                    if (category) {
                        categoryId = category.id;
                        setFileCategoryId(category.id);
                    } else {
                        console.error('File category "certificate-documents" not found');
                        toast.error('File category not found. Please contact administrator.');
                    }
                } catch (error) {
                    console.error('Failed to fetch file categories:', error);
                    toast.error('Failed to load file categories');
                }

                // Fetch categories, departments, and users in parallel
                const [deptsRes, usersRes] = await Promise.all([
                    departmentService.getDepartments({ page: 1, limit: 100 }),
                    userService.getUsers({ page: 1, limit: 100 }),
                ]);

                // Ensure categories are loaded (hook will auto-fetch, but we can also call it explicitly)
                if (categories.length === 0) {
                    await fetchCategories({ page: 1, limit: 100 });
                }

                setDepartments(deptsRes.data);
                setUsers(
                    usersRes.data.map((u) => ({
                        id: u.id,
                        name: u.name,
                    })),
                );
                setDataReady(true);
            } catch (error) {
                console.error('Failed to fetch options:', error);
                toast.error('Failed to load form options');
            } finally {
                setIsLoading(false);
            }
        };

        fetchOptions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount

    // Set form data for edit mode
    useEffect(() => {
        if (certificateData && mode === 'edit' && dataReady) {
            form.reset({
                certificateNumber: certificateData.certificateNumber,
                certificateName: certificateData.certificateName,
                categoryId: certificateData.categoryId,
                certificateType: certificateData.certificateType,
                issuedDate: certificateData.issuedDate.split('T')[0],
                validityDate: certificateData.validityDate.split('T')[0],
                issuerName: certificateData.issuerName,
                documentUrl: certificateData.documentUrl || '',
                personnelId: certificateData.personnelId || '',
                personnelName: certificateData.personnelName || '',
                equipmentId: certificateData.equipmentId || '',
                equipmentName: certificateData.equipmentName || '',
                departmentId: certificateData.departmentId,
                reminderDays: certificateData.reminderDays,
                notes: certificateData.notes || '',
            });

            // Set uploaded file name if documentUrl exists
            if (certificateData.documentUrl) {
                setUploadedFileName('Certificate Document');
            }
        }
    }, [certificateData, mode, dataReady, form]);

    const handleFileUpload = async (file: File) => {
        if (!file) return;

        // Validate file type (PDF, DOC, DOCX, images)
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
        ];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Invalid file type. Please upload PDF, DOC, DOCX, or image files.');
            return;
        }

        // Validate file size (max 50MB)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            toast.error('File size exceeds 50MB limit.');
            return;
        }

        if (!fileCategoryId) {
            toast.error('File category not found. Please refresh the page.');
            return;
        }

        setUploadingFile(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('categoryId', fileCategoryId);
            formData.append('isPublic', 'true');

            const response = await api.post('/uploads/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // Get the file URL from response
            const fileUrl = response.data.publicUrl || response.data.id;
            form.setValue('documentUrl', fileUrl);
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
        form.setValue('documentUrl', '');
        setUploadedFileName(null);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileUpload(file);
        }
    };

    const onSubmit = async (values: FormValues) => {
        try {
            setIsLoading(true);

            const certificateData: CreateCertificateDTO | UpdateCertificateDTO = {
                certificateNumber: values.certificateNumber,
                certificateName: values.certificateName,
                categoryId: values.categoryId,
                certificateType: values.certificateType as CertificateType,
                issuedDate: values.issuedDate,
                validityDate: values.validityDate,
                issuerName: values.issuerName,
                documentUrl: values.documentUrl || undefined,
                personnelId: values.personnelId || undefined,
                personnelName: values.personnelName || undefined,
                equipmentId: values.equipmentId || undefined,
                equipmentName: values.equipmentName || undefined,
                departmentId: values.departmentId,
                reminderDays: values.reminderDays,
                notes: values.notes || undefined,
            };

            if (mode === 'create') {
                await createCertificate(certificateData as CreateCertificateDTO);
                navigate('/certificates');
            } else if (id) {
                await updateCertificate(id, certificateData as UpdateCertificateDTO);
                navigate(`/certificates/${id}`);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            const errorMessage =
                error instanceof Error ? error.message : 'Failed to save certificate';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const certificateType = form.watch('certificateType');
    const isPersonnelCertificate =
        certificateType === 'PERSONNEL_LICENSE' || certificateType === 'PERSONNEL_CERTIFICATE';
    const isEquipmentCertificate =
        certificateType === 'EQUIPMENT_CALIBRATION' ||
        certificateType === 'EQUIPMENT_INSTALLATION' ||
        certificateType === 'EQUIPMENT_OPERATIONAL_PERMIT';

    if (isLoadingCertificate || !dataReady) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                    <span>Loading certificate details...</span>
                </div>
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="certificateNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Certificate Number *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter certificate number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="certificateName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Certificate Name *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter certificate name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="categoryId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category *</FormLabel>
                                        <FormControl>
                                            <SearchableSelect
                                                options={categoryOptions}
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                placeholder="Select category"
                                            />
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
                                name="issuedDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Issued Date *</FormLabel>
                                        <FormControl>
                                            <DateTimePicker
                                                mode="date"
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Select issued date"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="validityDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Validity Date *</FormLabel>
                                        <FormControl>
                                            <DateTimePicker
                                                mode="date"
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Select validity date"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="issuerName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Issuer Name *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter issuer name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="documentUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Document</FormLabel>
                                        <FormControl>
                                            <div className="space-y-2">
                                                <input
                                                    type="file"
                                                    id="document-upload"
                                                    className="hidden"
                                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                                                    onChange={handleFileInputChange}
                                                    disabled={uploadingFile}
                                                />
                                                {uploadedFileName ? (
                                                    <div className="flex items-center gap-2 p-3 border rounded-md bg-gray-50">
                                                        <FileText className="h-4 w-4 text-gray-500" />
                                                        <span className="text-sm font-medium flex-1">
                                                            {uploadedFileName}
                                                        </span>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={handleFileRemove}
                                                            disabled={uploadingFile}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <label htmlFor="document-upload" className="cursor-pointer">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            className="w-full"
                                                            disabled={uploadingFile}
                                                            onClick={() => {
                                                                document.getElementById('document-upload')?.click();
                                                            }}
                                                        >
                                                            {uploadingFile ? (
                                                                <>
                                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                                                                    Uploading...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Upload className="mr-2 h-4 w-4" />
                                                                    Upload Certificate Document
                                                                </>
                                                            )}
                                                        </Button>
                                                    </label>
                                                )}
                                                <input type="hidden" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormDescription>
                                            Upload PDF, DOC, DOCX, or image files (max 50MB)
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Personnel / Equipment Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField
                            control={form.control}
                            name="departmentId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Department *</FormLabel>
                                    <FormControl>
                                        <SearchableSelect
                                            options={departmentOptions}
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            placeholder="Select department"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {isPersonnelCertificate && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="personnelId"
                                    render={({ field }) => {
                                        const personnelNameValue = form.watch('personnelName');
                                        const isDisabled = !!personnelNameValue;

                                        return (
                                            <FormItem>
                                                <FormLabel>Personnel</FormLabel>
                                                <FormControl>
                                                    <div className={isDisabled ? 'opacity-50 pointer-events-none' : ''}>
                                                        <SearchableSelect
                                                            options={userOptions}
                                                            value={field.value}
                                                            onValueChange={(value) => {
                                                                field.onChange(value);
                                                                // Clear personnelName when selecting from list
                                                                if (value) {
                                                                    form.setValue('personnelName', '');
                                                                }
                                                            }}
                                                            placeholder="Select personnel from list"
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormDescription>
                                                    Select personnel from list OR enter name manually below (not both)
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        );
                                    }}
                                />

                                <FormField
                                    control={form.control}
                                    name="personnelName"
                                    render={({ field }) => {
                                        const personnelIdValue = form.watch('personnelId');
                                        const isDisabled = !!personnelIdValue;

                                        return (
                                            <FormItem>
                                                <FormLabel>Personnel Name (if not in list)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Enter personnel name"
                                                        {...field}
                                                        disabled={isDisabled}
                                                        onChange={(e) => {
                                                            field.onChange(e);
                                                            // Clear personnelId when entering name manually
                                                            if (e.target.value) {
                                                                form.setValue('personnelId', '');
                                                            }
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Enter personnel name if not available in the list above
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        );
                                    }}
                                />
                            </>
                        )}

                        {isEquipmentCertificate && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="equipmentId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Equipment ID</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter equipment ID" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Equipment ID from master data (optional)
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="equipmentName"
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
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Additional Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField
                            control={form.control}
                            name="reminderDays"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reminder Days</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="1"
                                            placeholder="30"
                                            {...field}
                                            onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Number of days before expiry to send reminder (default: 30)
                                    </FormDescription>
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
                                            placeholder="Enter any additional notes"
                                            rows={4}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/certificates')}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Saving...' : mode === 'create' ? 'Create Certificate' : 'Update Certificate'}
                    </Button>
                </div>
            </form>
        </Form>
    );
};

export default CertificateForm;

