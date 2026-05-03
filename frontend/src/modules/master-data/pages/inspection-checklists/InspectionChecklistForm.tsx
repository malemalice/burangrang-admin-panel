import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/core/components/ui/dialog';
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
import inspectionChecklistService from '../../services/inspectionChecklistService';
import { InspectionChecklistDTO } from '../../types/master-data.types';

type Depth = 0 | 1 | 2;

const DEPTH_LABELS: Record<Depth, { title: string; namePlaceholder: string; codePlaceholder: string; codeHint: string }> = {
  0: {
    title: 'Checklist Template',
    namePlaceholder: 'e.g. Building Safety Weekly Checklist',
    codePlaceholder: 'e.g. BSW-001',
    codeHint: 'Unique template code',
  },
  1: {
    title: 'Category',
    namePlaceholder: 'e.g. Required Documents',
    codePlaceholder: 'e.g. 1',
    codeHint: 'Display number (1, 2, 3…)',
  },
  2: {
    title: 'Checklist Item',
    namePlaceholder: 'e.g. Work Permit',
    codePlaceholder: 'e.g. A',
    codeHint: 'Display letter (A, B, C…)',
  },
};

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().optional(),
  description: z.string().optional(),
  order: z.coerce.number().int().min(0).max(9999).default(0),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface InspectionChecklistFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  depth: Depth;
  parentId?: string;
  initialData?: InspectionChecklistDTO;
  onSuccess: () => void;
}

export default function InspectionChecklistForm({
  open,
  onOpenChange,
  depth,
  parentId,
  initialData,
  onSuccess,
}: InspectionChecklistFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = !!initialData;
  const labels = DEPTH_LABELS[depth];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      order: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          name: initialData.name,
          code: initialData.code ?? '',
          description: initialData.description ?? '',
          order: initialData.order,
          isActive: initialData.isActive,
        });
      } else {
        form.reset({ name: '', code: '', description: '', order: 0, isActive: true });
      }
    }
  }, [open, initialData, form]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: data.name,
        code: data.code || undefined,
        description: data.description || undefined,
        order: data.order,
        isActive: data.isActive,
      };

      if (isEdit && initialData) {
        await inspectionChecklistService.update(initialData.id, payload);
        toast.success(`${labels.title} updated successfully`);
      } else {
        await inspectionChecklistService.create({ ...payload, parentId });
        toast.success(`${labels.title} created successfully`);
      }

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      const msg = error?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : (msg ?? `Failed to save ${labels.title.toLowerCase()}`));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit' : 'Add'} {labels.title}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder={labels.namePlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code <span className="text-muted-foreground font-normal text-xs">({labels.codeHint})</span></FormLabel>
                    <FormControl>
                      <Input placeholder={labels.codePlaceholder} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={9999} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {depth === 0 && (
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Optional description" rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>Active</FormLabel>
                    <p className="text-xs text-muted-foreground">Whether this {labels.title.toLowerCase()} is visible and usable</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Save Changes' : `Add ${labels.title}`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
