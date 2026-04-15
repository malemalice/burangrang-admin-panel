import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Upload, X } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/core/components/ui/form';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Switch } from '@/core/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { RichEditor } from '@/core/components/ui/rich-editor';
import uploadService from '@/modules/uploads/services/uploadService';
import workClassificationService from '../services/workClassificationService';
import { WorkClassification } from '../types/work-classification.types';

const EMPTY_HTML = '<p></p>';

const attachmentSchema = z.object({
  fileUrl: z.string().min(1, 'File URL is required'),
  fileName: z.string().min(1, 'File name is required'),
  fileType: z.string().optional(),
  description: z.string().optional(),
  order: z.number().min(0),
});

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  description: z.string().optional(),
  safetyGuideline: z.string().optional(),
  isActive: z.boolean().default(true),
  attachments: z.array(attachmentSchema).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface WorkClassificationFormProps {
  classification?: WorkClassification;
  mode: 'create' | 'edit';
}

const WorkClassificationForm = ({ classification, mode }: WorkClassificationFormProps) => {
  const navigate = useNavigate();
  const [documentsCategoryId, setDocumentsCategoryId] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      safetyGuideline: EMPTY_HTML,
      isActive: true,
      attachments: [],
    },
  });

  const {
    fields: attachmentFields,
    append: appendAttachment,
    remove: removeAttachment,
  } = useFieldArray({
    control: form.control,
    name: 'attachments',
  });

  useEffect(() => {
    const loadCategory = async () => {
      try {
        const category = await uploadService.getCategoryByName('work-permit-documents');
        if (category) {
          setDocumentsCategoryId(category.id);
        } else {
          toast.error('File category for work permit documents not found');
        }
      } catch (e) {
        console.error(e);
        toast.error('Failed to resolve upload category');
      }
    };
    loadCategory();
  }, []);

  useEffect(() => {
    if (classification) {
      form.reset({
        name: classification.name,
        code: classification.code,
        description: classification.description || '',
        safetyGuideline: classification.safetyGuideline?.trim()
          ? classification.safetyGuideline
          : EMPTY_HTML,
        isActive: classification.isActive,
        attachments:
          classification.attachments?.map((a, i) => ({
            fileUrl: a.fileUrl,
            fileName: a.fileName,
            fileType: a.fileType,
            description: a.description ?? '',
            order: a.order ?? i,
          })) ?? [],
      });
    }
  }, [classification, form]);

  const handleAttachmentUpload = async (file: File) => {
    if (!documentsCategoryId) {
      toast.error('File category not found. Please refresh the page.');
      return;
    }
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
    ];
    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowedExt = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
    if (!validTypes.includes(file.type) && (!ext || !allowedExt.includes(ext))) {
      toast.error('Invalid file type. Please upload PDF, DOC, DOCX, or image files.');
      return;
    }
    try {
      const response = await uploadService.uploadFile(file, documentsCategoryId, false);
      const fileUrl =
        response.downloadUrl ||
        (response.isPublic
          ? uploadService.getPublicFileUrl(response.id)
          : uploadService.getPrivateFileUrl(response.accessToken || response.id));
      appendAttachment({
        fileUrl,
        fileName: file.name,
        fileType: file.type,
        description: '',
        order: attachmentFields.length,
      });
      toast.success('Attachment uploaded');
    } catch (error: unknown) {
      console.error('Error uploading attachment:', error);
      const message =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || 'Failed to upload file');
    }
  };

  const onSubmit = async (data: FormValues) => {
    const safetyGuideline =
      !data.safetyGuideline ||
      data.safetyGuideline === EMPTY_HTML ||
      data.safetyGuideline === '<p></p>'
        ? undefined
        : data.safetyGuideline;

    const rawAttachments = data.attachments ?? [];
    const attachmentPayload =
      rawAttachments.length > 0
        ? rawAttachments.map((a, i) => ({
            fileUrl: a.fileUrl,
            fileName: a.fileName,
            fileType: a.fileType,
            description: a.description?.trim() ? a.description : undefined,
            order: i,
          }))
        : mode === 'edit'
          ? []
          : undefined;

    const payload = {
      name: data.name,
      code: data.code,
      description: data.description || undefined,
      safetyGuideline,
      isActive: data.isActive,
      ...(attachmentPayload !== undefined ? { attachments: attachmentPayload } : {}),
    };

    try {
      if (mode === 'create') {
        await workClassificationService.createWorkClassification(payload);
        toast.success('Work classification created successfully');
      } else {
        await workClassificationService.updateWorkClassification(classification!.id, payload);
        toast.success('Work classification updated successfully');
      }
      navigate('/master/work-classifications');
    } catch (error: unknown) {
      console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} work classification:`, error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : `Failed to ${mode === 'create' ? 'create' : 'update'} work classification`;
      toast.error(errorMessage);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'Create' : 'Edit'} work classification
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Classification name" {...field} />
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
                      <Input placeholder="Unique code" {...field} />
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
                    <Textarea placeholder="Short description" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="safetyGuideline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Safety guidelines</FormLabel>
                  <FormControl>
                    <RichEditor
                      value={field.value || EMPTY_HTML}
                      onChange={field.onChange}
                      pageLayout
                      enablePdfExport
                    />
                  </FormControl>
                  <FormDescription>
                    Rich text with tables; merge or split cells from the table toolbar when a table
                    is selected. Page breaks in the editor are visual guides only (the document still
                    grows with content); use Preview PDF to see the exact paginated output.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">Attached documents</CardTitle>
                  <CardDescription>Reference files for this classification (PDF, Word, or images)</CardDescription>
                </div>
                <div>
                  <input
                    type="file"
                    id="wc-attachment-upload"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleAttachmentUpload(file);
                      e.target.value = '';
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('wc-attachment-upload')?.click()}
                    disabled={!documentsCategoryId}
                  >
                    <Upload className="mr-2 h-4 w-4" /> Upload
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {attachmentFields.map((field, index) => (
                  <div key={field.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {form.watch(`attachments.${index}.fileName`)}
                      </p>
                      <FormField
                        control={form.control}
                        name={`attachments.${index}.description`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Description (optional)" className="mt-1" {...f} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-destructive hover:text-destructive"
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Inactive classifications may be hidden from selection lists
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/master/work-classifications')}
              >
                Cancel
              </Button>
              <Button type="submit">
                {mode === 'create' ? 'Create' : 'Save changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default WorkClassificationForm;
