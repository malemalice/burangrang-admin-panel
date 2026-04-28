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
import { Label } from '@/core/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/core/components/ui/radio-group';
import companyService from '@/modules/master-data/services/companyService';
import type { CompanyDTO } from '@/modules/master-data/types/master-data.types';
import userService from '@/modules/users/services/userService';
import type { User } from '@/core/lib/types';
import type { CompanyOption, MasterDataOption } from '../types/work-permit.types';
import { createProfessionFromQuery } from '@/modules/work-permits/utils/professionHelpers';

function suggestCompanyCodeFromQuery(query: string): string {
  const cleaned = query.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return cleaned.slice(0, 32) || 'COMPANY';
}

export interface AddApplicantWithCompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (user: User) => void;
  initialName?: string;
  /** Super Admin must assign company (existing or new). Others use backend requester company. */
  isSuperAdmin: boolean;
  /** Companies loaded for the permit form (vendor list). */
  companies: CompanyOption[];
  /** Default company when selecting existing (e.g. permit companyId). */
  permitCompanyId?: string;
  onCompanyCreated: (company: CompanyDTO) => void;
  professions: MasterDataOption[];
  onProfessionCreated?: (profession: MasterDataOption) => void;
  canCreateCompany: boolean;
}

const AddApplicantWithCompanyModal = ({
  open,
  onOpenChange,
  onSuccess,
  initialName = '',
  isSuperAdmin,
  companies,
  permitCompanyId = '',
  onCompanyCreated,
  professions,
  onProfessionCreated,
  canCreateCompany,
}: AddApplicantWithCompanyModalProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const companyOptions = useMemo(
    () =>
      companies.map((c) => ({
        value: c.id,
        label: c.phone ? `${c.name} · ${c.phone}` : c.name,
      })),
    [companies],
  );

  const professionOptions = useMemo(
    () => professions.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` })),
    [professions],
  );

  const formSchema = useMemo(
    () =>
      z
        .object({
          firstName: z.string().min(1, 'First name is required'),
          lastName: z.string().min(1, 'Last name is required'),
          email: z.string().min(1, 'Email is required').email('Invalid email address'),
          professionId: z.string().min(1, 'Profession is required'),
          idNumber: z.string().optional(),
          companyMode: z.enum(['existing', 'new']),
          companyId: z.string().optional(),
          newCompanyName: z.string().optional(),
          newCompanyCode: z.string().optional(),
          newCompanyAddress: z.string().optional(),
          newCompanyContactPerson: z.string().optional(),
          newCompanyPhone: z.string().optional(),
          newCompanyEmail: z.union([z.string().email('Invalid email address'), z.literal('')]).optional(),
        })
        .superRefine((data, ctx) => {
          if (!isSuperAdmin) return;
          if (data.companyMode === 'existing') {
            if (!data.companyId?.trim()) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Company is required',
                path: ['companyId'],
              });
            }
          } else {
            if (!data.newCompanyName?.trim()) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Company name is required',
                path: ['newCompanyName'],
              });
            }
            if (!data.newCompanyCode?.trim()) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Company code is required',
                path: ['newCompanyCode'],
              });
            }
          }
        }),
    [isSuperAdmin],
  );

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      professionId: '',
      idNumber: '',
      companyMode: 'existing',
      companyId: '',
      newCompanyName: '',
      newCompanyCode: '',
      newCompanyAddress: '',
      newCompanyContactPerson: '',
      newCompanyPhone: '',
      newCompanyEmail: '',
    },
  });

  useEffect(() => {
    if (!open) return;

    const trimmed = initialName.trim();
    let firstName = '';
    let lastName = '';
    if (trimmed) {
      const parts = trimmed.split(/\s+/);
      firstName = parts[0] ?? '';
      lastName = parts.slice(1).join(' ') ?? '';
    }

    const defaultCompanyId = permitCompanyId?.trim() || '';

    form.reset({
      firstName,
      lastName,
      email: '',
      professionId: '',
      idNumber: '',
      companyMode: 'existing',
      companyId: defaultCompanyId,
      newCompanyName: '',
      newCompanyCode: '',
      newCompanyAddress: '',
      newCompanyContactPerson: '',
      newCompanyPhone: '',
      newCompanyEmail: '',
    });
  }, [open, initialName, permitCompanyId, form]);

  const companyMode = form.watch('companyMode');

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);

      let resolvedCompanyId: string | undefined;

      if (isSuperAdmin) {
        if (data.companyMode === 'new') {
          const created = await companyService.createCompany({
            name: data.newCompanyName!.trim(),
            code: data.newCompanyCode!.trim(),
            address: data.newCompanyAddress?.trim() || undefined,
            contactPerson: data.newCompanyContactPerson?.trim() || undefined,
            phone: data.newCompanyPhone?.trim() || undefined,
            email: data.newCompanyEmail?.trim() || undefined,
            isActive: true,
          });
          onCompanyCreated(created);
          resolvedCompanyId = created.id;
          toast.success('Company created');
        } else {
          resolvedCompanyId = data.companyId!.trim();
        }

        const user = await userService.createWorkPermitWorker({
          email: data.email.trim(),
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          professionId: data.professionId.trim(),
          companyId: resolvedCompanyId,
          ...(data.idNumber?.trim() ? { idNumber: data.idNumber.trim() } : {}),
        });
        toast.success('Applicant created');
        onSuccess(user);
        onOpenChange(false);
        return;
      }

      const user = await userService.createWorkPermitWorker({
        email: data.email.trim(),
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        professionId: data.professionId.trim(),
        ...(data.idNumber?.trim() ? { idNumber: data.idNumber.trim() } : {}),
      });
      toast.success('Applicant created');
      onSuccess(user);
      onOpenChange(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create applicant';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add contractor applicant</DialogTitle>
          <DialogDescription>
            Create a new contractor user to use as applicant. A random password is set; they can use Forgot
            password when needed.
          </DialogDescription>
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
                    <Input type="email" placeholder="email@example.com" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <FormField
              control={form.control}
              name="idNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID number</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional ID number" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isSuperAdmin ? (
              <div className="space-y-3 rounded-md border p-3">
                <p className="text-sm font-medium">Company</p>
                <FormField
                  control={form.control}
                  name="companyMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(v) => {
                            field.onChange(v);
                            form.clearErrors(['companyId', 'newCompanyName', 'newCompanyCode']);
                          }}
                          value={field.value}
                          className="flex flex-col gap-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="existing" id="applicant-company-existing" />
                            <Label htmlFor="applicant-company-existing" className="font-normal">
                              Select existing company
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="new" id="applicant-company-new" />
                            <Label htmlFor="applicant-company-new" className="font-normal">
                              Create new company
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />

                {companyMode === 'existing' && (
                  <FormField
                    control={form.control}
                    name="companyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Company <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <ModalCombobox
                            options={companyOptions}
                            value={field.value ?? ''}
                            onValueChange={field.onChange}
                            placeholder="Select company"
                            searchPlaceholder="Search company..."
                            emptyText="No company found"
                            {...(canCreateCompany
                              ? {
                                  createNewText: 'Use name for new company',
                                  onCreateNew: (query: string) => {
                                    const q = query.trim();
                                    if (!q) return;
                                    form.setValue('companyMode', 'new');
                                    form.setValue('newCompanyName', q);
                                    form.setValue('newCompanyCode', suggestCompanyCodeFromQuery(q));
                                    return Promise.resolve();
                                  },
                                }
                              : {})}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {companyMode === 'new' && (
                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="newCompanyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Company name <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Company name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="newCompanyCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Company code <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Unique code" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="newCompanyAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Optional" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="newCompanyContactPerson"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact person</FormLabel>
                            <FormControl>
                              <Input placeholder="Optional" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="newCompanyPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="Optional" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="newCompanyEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Optional" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground rounded-md border p-3">
                The applicant will be registered under your organization&apos;s company (per system rules).
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create applicant'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddApplicantWithCompanyModal;
