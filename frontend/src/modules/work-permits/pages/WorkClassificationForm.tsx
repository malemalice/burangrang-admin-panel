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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/core/components/ui/form';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Switch } from '@/core/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { RichEditor } from '@/core/components/ui/rich-editor';
import workClassificationService from '../services/workClassificationService';
import { WorkClassification } from '../types/work-classification.types';

const EMPTY_HTML = '<p></p>';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  description: z.string().optional(),
  safetyGuideline: z.string().optional(),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface WorkClassificationFormProps {
  classification?: WorkClassification;
  mode: 'create' | 'edit';
}

const WorkClassificationForm = ({ classification, mode }: WorkClassificationFormProps) => {
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      safetyGuideline: EMPTY_HTML,
      isActive: true,
    },
  });

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
      });
    }
  }, [classification, form]);

  const onSubmit = async (data: FormValues) => {
    const payload = {
      ...data,
      safetyGuideline:
        !data.safetyGuideline ||
        data.safetyGuideline === EMPTY_HTML ||
        data.safetyGuideline === '<p></p>'
          ? undefined
          : data.safetyGuideline,
      description: data.description || undefined,
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
