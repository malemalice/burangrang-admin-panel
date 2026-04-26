import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/core/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/core/components/ui/form';
import { Input } from '@/core/components/ui/input';
import { ModalCombobox } from '@/core/components/ui/modal-combobox';
import PageHeader from '@/core/components/ui/PageHeader';
import { SearchableSelect } from '@/core/components/ui/searchable-select';
import { useAuth } from '@/core/lib/auth';
import { usePermissions } from '@/core/hooks/usePermissions';
import userService from '@/modules/users/services/userService';
import companyService from '@/modules/master-data/services/companyService';
import type { CompanyDTO } from '@/modules/master-data/types/master-data.types';
import workPermitService from '@/modules/work-permits/services/workPermitService';
import type { MasterDataOption } from '@/modules/work-permits/types/work-permit.types';
import { createProfessionFromQuery } from '@/modules/work-permits/utils/professionHelpers';

function getAuthRoleName(role: { name: string } | string | undefined): string {
  if (!role) return '';
  return typeof role === 'string' ? role : role.name;
}

const CreateWorkPermitWorkerPage = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { hasPermission } = usePermissions();
  const [companyOptions, setCompanyOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [professions, setProfessions] = useState<MasterDataOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roleName = getAuthRoleName(authUser?.role);
  const isSuperAdmin = roleName === 'Super Admin';
  const defaultCompanyId = authUser?.companyId ?? '';

  const professionOptions = useMemo(
    () =>
      professions.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` })),
    [professions],
  );

  const handleCreateProfession = async (searchQuery: string) => {
    return createProfessionFromQuery(searchQuery, (newProf) => {
      setProfessions((prev) => [newProf, ...prev]);
    });
  };

  const formSchema = useMemo(
    () =>
      z
        .object({
          firstName: z.string().min(1, 'First name is required'),
          lastName: z.string().min(1, 'Last name is required'),
          email: z.string().min(1, 'Email is required').email('Invalid email'),
          professionId: z.string().min(1, 'Profession is required'),
          idNumber: z.string().optional(),
          companyId: z.string().optional(),
        })
        .superRefine((data, ctx) => {
          if (isSuperAdmin && (!data.companyId || data.companyId.length === 0)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Company is required',
              path: ['companyId'],
            });
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
      companyId: isSuperAdmin ? '' : defaultCompanyId,
    },
  });

  useEffect(() => {
    if (!isSuperAdmin) {
      form.setValue('companyId', defaultCompanyId);
    }
  }, [isSuperAdmin, defaultCompanyId, form]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await companyService.getCompanies({
          page: 1,
          limit: 500,
          options: true,
        });
        if (cancelled) return;
        setCompanyOptions(
          res.data.map((c: CompanyDTO) => ({
            value: c.id,
            label: c.name,
          })),
        );
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const master = await workPermitService.getMasterData();
        if (!cancelled) setProfessions(master.professions ?? []);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!hasPermission('user:create')) {
    return (
      <>
        <PageHeader
          title="Add worker"
          subtitle="Creates a Contractor user with work permit access"
          actions={
            <Button
              variant="outline"
              onClick={() => navigate('/work-permits/workers')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to workers
            </Button>
          }
        />
        <p className="px-4 py-8 text-center text-muted-foreground">
          You do not have permission to create users.
        </p>
      </>
    );
  }

  if (!isSuperAdmin && !authUser?.companyId) {
    return (
      <>
        <PageHeader
          title="Add worker"
          subtitle="Creates a Contractor user with work permit access"
          actions={
            <Button
              variant="outline"
              onClick={() => navigate('/work-permits/workers')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to workers
            </Button>
          }
        />
        <p className="px-4 py-8 text-center text-muted-foreground">
          You must be assigned to a company to create workers.
        </p>
      </>
    );
  }

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      await userService.createWorkPermitWorker({
        email: data.email.trim(),
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        professionId: data.professionId,
        ...(data.idNumber?.trim() ? { idNumber: data.idNumber.trim() } : {}),
        ...(isSuperAdmin && data.companyId
          ? { companyId: data.companyId }
          : {}),
      });
      toast.success('Worker created. They can use Forgot password to set a password.');
      navigate('/work-permits/workers');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to create worker';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Add worker"
        subtitle="Creates a Contractor user with work permit access for the selected company"
        actions={
          <Button
            variant="outline"
            onClick={() => navigate('/work-permits/workers')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to workers
          </Button>
        }
      />

      <div className="mx-auto max-w-4xl px-4 pb-8">
        <Card>
          <CardHeader>
            <CardTitle>Worker details</CardTitle>
            <CardDescription>
              A random password is assigned; the worker can use Forgot password on
              the login page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First name</FormLabel>
                        <FormControl>
                          <Input {...field} autoComplete="given-name" />
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
                        <FormLabel>Last name</FormLabel>
                        <FormControl>
                          <Input {...field} autoComplete="family-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          autoComplete="email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="professionId"
                  render={({ field: f }) => (
                    <FormItem>
                      <FormLabel>
                        Profession <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <ModalCombobox
                          options={professionOptions}
                          value={f.value}
                          onValueChange={f.onChange}
                          placeholder="Select profession"
                          searchPlaceholder="Search..."
                          onCreateNew={handleCreateProfession}
                          createNewText="Create new profession"
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
                        <Input placeholder="Worker ID number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isSuperAdmin && (
                  <FormField
                    control={form.control}
                    name="companyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <SearchableSelect
                            id="wpw-company"
                            options={companyOptions}
                            value={field.value ?? ''}
                            onValueChange={field.onChange}
                            placeholder="Select company"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {!isSuperAdmin && (
                  <p className="text-sm text-muted-foreground">
                    This worker will be linked to your company.
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={() => navigate('/work-permits/workers')}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create worker'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default CreateWorkPermitWorkerPage;
