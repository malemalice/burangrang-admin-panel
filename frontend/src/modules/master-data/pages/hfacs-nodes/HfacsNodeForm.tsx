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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/core/components/ui/form';
import { Input } from '@/core/components/ui/input';
import { Switch } from '@/core/components/ui/switch';
import hfacsNodeService from '../../services/hfacsNodeService';
import type {
  HfacsNodeDTO,
  HfacsSection,
} from '../../types/master-data.types';

type Depth = 0 | 1 | 2;

const DEPTH_LABELS: Record<
  Depth,
  { title: string; codeHint: string; codeRequired: boolean }
> = {
  0: {
    title: 'Tier 1 (Category)',
    codeHint: 'Optional internal code',
    codeRequired: false,
  },
  1: {
    title: 'Tier 2 (Sub-category)',
    codeHint: 'Optional internal code',
    codeRequired: false,
  },
  2: {
    title: 'Item (Leaf cause)',
    codeHint: 'Stable code e.g. OC_001, DE_001 — required for items',
    codeRequired: true,
  },
};

const formSchema = z.object({
  labelEn: z.string().min(1, 'English label is required'),
  labelId: z.string().min(1, 'Indonesian label is required'),
  code: z.string().optional(),
  order: z.coerce.number().int().min(0).max(9999).default(0),
  isOther: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface HfacsNodeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  depth: Depth;
  section: HfacsSection;
  parentId?: string;
  initialData?: HfacsNodeDTO;
  onSuccess: () => void;
}

export default function HfacsNodeForm({
  open,
  onOpenChange,
  depth,
  section,
  parentId,
  initialData,
  onSuccess,
}: HfacsNodeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = !!initialData;
  const labels = DEPTH_LABELS[depth];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      labelEn: '',
      labelId: '',
      code: '',
      order: 0,
      isOther: false,
      isActive: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          labelEn: initialData.labelEn,
          labelId: initialData.labelId,
          code: initialData.code ?? '',
          order: initialData.order,
          isOther: initialData.isOther,
          isActive: initialData.isActive,
        });
      } else {
        form.reset({
          labelEn: '',
          labelId: '',
          code: '',
          order: 0,
          isOther: false,
          isActive: true,
        });
      }
    }
  }, [open, initialData, form]);

  const onSubmit = async (data: FormValues) => {
    if (labels.codeRequired && !data.code?.trim()) {
      form.setError('code', { message: 'Code is required for items' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        labelEn: data.labelEn,
        labelId: data.labelId,
        code: data.code?.trim() || undefined,
        order: data.order,
        isOther: data.isOther,
        isActive: data.isActive,
      };

      if (isEdit && initialData) {
        await hfacsNodeService.update(initialData.id, payload);
        toast.success(`${labels.title} updated successfully`);
      } else {
        await hfacsNodeService.create({
          ...payload,
          section,
          parentId,
        });
        toast.success(`${labels.title} created successfully`);
      }

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      const msg = error?.response?.data?.message;
      toast.error(
        Array.isArray(msg)
          ? msg.join(', ')
          : (msg ?? `Failed to save ${labels.title.toLowerCase()}`),
      );
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
              name="labelEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label (English) *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Long chain of command structure"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="labelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label (Indonesian) *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Rantai struktur komando terlalu panjang"
                      {...field}
                    />
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
                    <FormLabel>Code {labels.codeRequired && '*'}</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. OC_001" {...field} />
                    </FormControl>
                    <FormDescription>{labels.codeHint}</FormDescription>
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

            {depth === 2 && (
              <FormField
                control={form.control}
                name="isOther"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel>"Others" entry</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Shows a free-text input on the investigation form when
                        ticked
                      </p>
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
            )}

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>Active</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Visible in the investigation form when active
                    </p>
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

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEdit ? 'Save Changes' : `Add ${labels.title}`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
