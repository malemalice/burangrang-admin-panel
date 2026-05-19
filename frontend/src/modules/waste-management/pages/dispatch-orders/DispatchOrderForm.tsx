import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import { Loader2, Paperclip, Trash2, FileText, Image } from 'lucide-react';
import { DateTimePicker } from '@/core/components/ui/datetime-picker';

import { dispatchOrderService } from '../../services/wasteManagementService';
import { CreateDispatchOrderData, DispatchOrder, UpdateDispatchOrderData } from '../../types/waste-management.types';
import uploadService from '@/modules/uploads/services/uploadService';

const ALLOWED_ATTACHMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_ATTACHMENTS = 10;

type AttachmentListItem =
  | { type: 'existing'; id: string; fileUrl: string; fileName?: string; order: number }
  | { type: 'new'; key: string; file: File; fileName: string; order: number };

const formSchema = z.object({
  dispatchDate: z.string().min(1, 'Date is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be positive'),
  memo: z.string().optional(),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface DispatchOrderFormProps {
  mode: 'create' | 'edit';
}

export default function DispatchOrderForm({ mode }: DispatchOrderFormProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [attachmentList, setAttachmentList] = useState<AttachmentListItem[]>([]);
  const [fileCategory, setFileCategory] = useState<{ id: string } | null>(null);
  /** Set in edit mode only — document number is server-generated and cannot be edited */
  const [documentNumber, setDocumentNumber] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dispatchDate: new Date().toISOString().split('T')[0],
      quantity: 0,
      memo: '',
      isActive: true,
    },
  });

  useEffect(() => {
    const loadCategory = async () => {
      const cat = await uploadService.getCategoryByName('dispatch-order-attachments');
      if (cat) setFileCategory({ id: cat.id });
    };
    loadCategory();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (mode === 'edit' && id) {
        setLoading(true);
        try {
          const response = await dispatchOrderService.getById(id);
          const data = response.data as DispatchOrder;
          setDocumentNumber(data.dispatchCode);
          form.reset({
            dispatchDate: new Date(data.dispatchDate).toISOString().split('T')[0],
            quantity: data.quantity,
            memo: data.memo || '',
            isActive: data.isActive,
          });
          const attachments = (data.attachments ?? []).slice().sort((a, b) => a.order - b.order);
          setAttachmentList(
            attachments.map((a) => ({
              type: 'existing' as const,
              id: a.id ?? '',
              fileUrl: a.fileUrl,
              fileName: a.fileName,
              order: a.order,
            })),
          );
        } catch (error) {
          toast.error('Failed to fetch data');
          navigate('/waste-management/dispatch-orders');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [id, mode, navigate, form]);

  const handleAttachmentFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const next: AttachmentListItem[] = [];
    let order = attachmentList.length;
    Array.from(files).forEach((file) => {
      if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
        toast.error(`Invalid type for ${file.name}. Use PDF or images only.`);
        return;
      }
      if (file.size > MAX_ATTACHMENT_SIZE) {
        toast.error(`${file.name} exceeds 10MB`);
        return;
      }
      if (attachmentList.length + next.length >= MAX_ATTACHMENTS) {
        toast.error(`Maximum ${MAX_ATTACHMENTS} attachments allowed`);
        return;
      }
      next.push({
        type: 'new',
        key: `new-${Date.now()}-${Math.random()}`,
        file,
        fileName: file.name,
        order: order++,
      });
    });
    if (next.length) setAttachmentList((prev) => [...prev, ...next]);
    e.target.value = '';
  }, [attachmentList.length]);

  const removeAttachment = useCallback((index: number) => {
    setAttachmentList((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.map((item, i) => ({ ...item, order: i }));
    });
  }, []);

  const buildAttachmentsPayload = useCallback(async (): Promise<{ fileUrl: string; fileName?: string; order: number }[]> => {
    if (!attachmentList.length) return [];
    if (attachmentList.some((a) => a.type === 'new') && !fileCategory) {
      toast.error('Upload category not available. Please refresh and try again.');
      throw new Error('File category not loaded');
    }
    const result: { fileUrl: string; fileName?: string; order: number }[] = [];
    for (let i = 0; i < attachmentList.length; i++) {
      const item = attachmentList[i];
      if (item.type === 'existing') {
        result.push({
          fileUrl: item.fileUrl,
          fileName: item.fileName,
          order: i,
        });
      } else {
        const res = await uploadService.uploadFile(item.file, fileCategory!.id, true);
        const fileUrl = uploadService.getPublicFileUrl(res.id);
        result.push({ fileUrl, fileName: item.fileName, order: i });
      }
    }
    return result;
  }, [attachmentList, fileCategory]);

  const onSubmit = async (data: FormValues) => {
    setSaving(true);
    try {
      const attachments = await buildAttachmentsPayload();
      if (mode === 'create') {
        const submitData: CreateDispatchOrderData = {
          dispatchDate: new Date(data.dispatchDate).toISOString(),
          quantity: data.quantity,
          memo: data.memo,
          isActive: data.isActive,
          ...(attachments.length ? { attachments } : {}),
        };
        await dispatchOrderService.create(submitData);
        toast.success('Vendor collection tracking created successfully');
      } else if (id) {
        const submitData: UpdateDispatchOrderData = {
          dispatchDate: new Date(data.dispatchDate).toISOString(),
          quantity: data.quantity,
          memo: data.memo,
          isActive: data.isActive,
          attachments,
        };
        await dispatchOrderService.update(id, submitData);
        toast.success('Vendor collection tracking updated successfully');
      }
      navigate('/waste-management/dispatch-orders');
    } catch (error: any) {
      if (error?.message !== 'File category not loaded') {
        toast.error(error.response?.data?.message || 'Operation failed');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Create' : 'Edit'} Order</CardTitle>
        <CardDescription>
          {mode === 'create'
            ? 'A unique document number (e.g. DO-2026-0001) is assigned automatically when you save.'
            : 'Enter dispatch order information'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mode === 'edit' && documentNumber && (
                <div className="space-y-2 md:col-span-2">
                  <p className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Document number
                  </p>
                  <p className="font-mono text-sm rounded-md border border-input bg-muted/50 px-3 py-2">{documentNumber}</p>
                  <p className="text-xs text-muted-foreground">This value is set by the system and cannot be changed.</p>
                </div>
              )}
              <FormField
                control={form.control}
                name="dispatchDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dispatch Date *</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        type="date"
                        value={field.value}
                        onChange={field.onChange}
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
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity (kg) *</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="any" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="memo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Memo</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter memo or description" className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Attachments</FormLabel>
              <p className="text-sm text-muted-foreground">PDF and images only, max 10MB each, up to {MAX_ATTACHMENTS} files</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/jpeg,image/png,image/gif,image/webp"
                multiple
                className="hidden"
                onChange={handleAttachmentFileChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={attachmentList.length >= MAX_ATTACHMENTS}
              >
                <Paperclip className="mr-2 h-4 w-4" />
                Add attachment(s)
              </Button>
              {attachmentList.length > 0 && (
                <ul className="mt-2 space-y-2 rounded-md border p-3">
                  {attachmentList.map((item, index) => (
                    <li
                      key={item.type === 'existing' ? item.id : item.key}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="flex items-center gap-2 truncate">
                        {item.type === 'new' && item.file.type === 'application/pdf' ? (
                          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <Image className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        {item.type === 'existing' ? (item.fileName ?? item.fileUrl.split('/').pop() ?? 'File') : item.fileName}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => removeAttachment(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => navigate('/waste-management/dispatch-orders')}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'create' ? 'Create Order' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
