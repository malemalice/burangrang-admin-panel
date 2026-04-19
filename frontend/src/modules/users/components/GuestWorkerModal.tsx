import { useEffect, useState } from 'react';
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
import userService from '@/modules/users/services/userService';
import type { User } from '@/modules/users';

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

type FormValues = z.infer<typeof formSchema>;

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
}: GuestWorkerModalProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const resolvedTitle = title ?? 'Add new worker';
  const resolvedDescription =
    description ??
    (createMode === 'contractor'
      ? 'Create a new contractor worker with name and email. A random password is set; they can use Forgot password to set one.'
      : 'Create a new worker (Guest user) with name and email. A random password is set; they can use Forgot password to set one.');
  const resolvedSuccessToast =
    successToastMessage ?? 'Worker created. They can use Forgot password to set a password.';

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
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
        });
      } else {
        form.reset({
          firstName: '',
          lastName: '',
          email: '',
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
        const user = await userService.createWorkPermitWorker({
          email: data.email.trim(),
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
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
      <DialogContent className="sm:max-w-[425px]">
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
