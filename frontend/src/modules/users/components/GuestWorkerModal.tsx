import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Button } from '@/core/components/ui/button';
import { ModalCombobox } from '@/core/components/ui/modal-combobox';
import type { User } from '@/core/lib/types';
import userService from '@/modules/users/services/userService';
import type { MasterDataOption } from '@/modules/work-permits/types/work-permit.types';
import { createProfessionFromQuery } from '@/modules/work-permits/utils/professionHelpers';

export interface GuestWorkerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (user: User) => void;
  /** Pre-fill name when opened from "Create new" (e.g. search query); will set firstName or split into first/last */
  initialName?: string;
  title?: string;
  description?: string;
  successToastMessage?: string;
  submitButtonLabel?: string;
  /**
   * When `contractor`, creates a Contractor via POST /users/work-permit-worker (same as workers module).
   * When `guest` (default), creates Guest via POST /users/guest-worker.
   */
  createMode?: 'guest' | 'contractor';
  /** When createMode is contractor and the requester is Super Admin, permit/vendor company for the new user */
  permitCompanyId?: string;
  /** Must be true when using contractor mode from a Super Admin so we can require permitCompanyId */
  isSuperAdmin?: boolean;
  /** Master data professions; required for contractor mode UI */
  professions?: MasterDataOption[];
  /** Called when a new profession is created from the modal combobox (prepend to parent list) */
  onProfessionCreated?: (profession: MasterDataOption) => void;
}

const GuestWorkerModal = ({
  open,
  onOpenChange,
  onSuccess,
  initialName = '',
  title,
  description,
  successToastMessage,
  submitButtonLabel = 'Create worker',
  createMode = 'guest',
  permitCompanyId,
  isSuperAdmin = false,
  professions = [],
  onProfessionCreated,
}: GuestWorkerModalProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const formSchema = useMemo(
    () =>
      z
        .object({
          firstName: z.string().min(1, 'First name is required'),
          lastName: z.string().min(1, 'Last name is required'),
          email: z.string().min(1, 'Email is required').email('Invalid email address'),
          professionId: z.string().optional(),
          idNumber: z.string().optional(),
        })
        .superRefine((data, ctx) => {
          if (createMode === 'contractor' && (!data.professionId || !data.professionId.trim())) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Profession is required',
              path: ['professionId'],
            });
          }
        }),
    [createMode],
  );

  type FormValues = z.infer<typeof formSchema>;

  const professionOptions = useMemo(
    () => professions.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` })),
    [professions],
  );

  const resolvedTitle = title ?? 'Add new worker';
  const resolvedDescription =
    description ??
    (createMode === 'contractor'
      ? 'Create a new contractor worker with name, email, profession, and optional ID number. A random password is set; they can use Forgot password to set one.'
      : 'Create a new worker (Guest user) with name and email. A random password is set; they can use Forgot password to set one.');
  const resolvedSuccessToast =
    successToastMessage ?? 'Worker created. They can use Forgot password to set a password.';

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      professionId: '',
      idNumber: '',
    },
  });

  useEffect(() => {
    if (open) {
      const trimmed = initialName.trim();
      if (trimmed) {
        const parts = trimmed.split(/\s+/);
        form.reset({
          firstName: parts[0] ?? '',
          lastName: parts.slice(1).join(' ') ?? '',
          email: '',
          professionId: '',
          idNumber: '',
        });
      } else {
        form.reset({
          firstName: '',
          lastName: '',
          email: '',
          professionId: '',
          idNumber: '',
        });
      }
    }
  }, [open, initialName, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      if (createMode === 'contractor') {
        if (isSuperAdmin && (!permitCompanyId || !String(permitCompanyId).trim())) {
          toast.error('Select a company on the work permit before adding a worker.');
          return;
        }
        const idTrimmed = data.idNumber?.trim();
        const user = await userService.createWorkPermitWorker({
          email: data.email.trim(),
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          professionId: data.professionId?.trim(),
          ...(idTrimmed ? { idNumber: idTrimmed } : {}),
          ...(isSuperAdmin && permitCompanyId ? { companyId: permitCompanyId.trim() } : {}),
        });
        toast.success(resolvedSuccessToast);
        onSuccess(user);
        onOpenChange(false);
        return;
      }

      const user = await userService.createGuestWorker({
        email: data.email.trim(),
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
      });
      toast.success(resolvedSuccessToast);
      onSuccess(user);
      onOpenChange(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create worker';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{resolvedTitle}</DialogTitle>
          <DialogDescription>{resolvedDescription}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    First name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="First name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Last name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Last name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Email <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {createMode === 'contractor' && (
              <FormField
                control={form.control}
                name="professionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Profession <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <ModalCombobox
                        options={professionOptions}
                        value={field.value ?? ''}
                        onValueChange={field.onChange}
                        placeholder="Select profession"
                        searchPlaceholder="Search profession..."
                        emptyText="No profession found"
                        createNewText="Create new profession"
                        onCreateNew={async (query) =>
                          createProfessionFromQuery(query, (newProf) => {
                            onProfessionCreated?.(newProf);
                          })
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {createMode === 'contractor' && (
              <FormField
                control={form.control}
                name="idNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID number</FormLabel>
                    <FormControl>
                      <Input placeholder="Worker ID number" autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : submitButtonLabel}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default GuestWorkerModal;
