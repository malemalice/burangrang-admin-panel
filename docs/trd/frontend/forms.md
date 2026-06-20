> [← Frontend TRD Index](./index.md)
>
> *React Hook Form + Zod patterns: page-level shell with PageHeader/max-w-4xl wrapper, Card-based form component, cross-module option loading with `options: true`. Visual/layout standards live in [docs/design-system/form-layout.md](../../design-system/form-layout.md).*

## Form Component Patterns

Consistent form handling across all modules. **See [docs/design-system/form-layout.md](../../design-system/form-layout.md) for complete page structure, spacing, and layout standards.**

### Page-Level Structure (Create/Edit Page)

```typescript
// modules/[module-name]/pages/Create[Entity]Page.tsx or Edit[Entity]Page.tsx
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/core/components/ui/PageHeader';
import { Button } from '@/core/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { [Entity]Form } from './[Entity]Form';

const Create[Entity]Page = () => {
  const navigate = useNavigate();
  
  return (
    <>
      <PageHeader
        title="Create [Entity]"
        subtitle="Add a new [entity] to the system"
        actions={
          <Button variant="outline" onClick={() => navigate('/[entities]')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to [Entities]
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <[Entity]Form mode="create" />
      </div>
    </>
  );
};
```

### Form Component

```typescript
// modules/[module-name]/pages/[Entity]Form.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/core/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/core/components/ui/form';
import { Input } from '@/core/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import [moduleName]Service from '../services/[moduleName]Service';
import { Create[Entity]DTO, Update[Entity]DTO } from '../types/[moduleName].types';
import { SearchableSelect } from '@/core/components/ui/searchable-select';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  // ... other fields
});

type FormValues = z.infer<typeof formSchema>;

interface [Entity]FormProps {
  [entity]?: [Entity];
  mode: 'create' | 'edit';
}

const [Entity]Form = ({ [entity], mode }: [Entity]FormProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      // ... other defaults
    },
  });

  useEffect(() => {
    if ([entity]) {
      form.reset({
        name: [entity].name,
        email: [entity].email,
        // ... map other fields
      });
    }
    setIsLoading(false);
  }, [[entity]]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      if (mode === 'create') {
        await [moduleName]Service.create[Entity](data);
        toast.success('[Entity] created successfully');
      } else if ([entity]) {
        await [moduleName]Service.update[Entity]([entity].id, data);
        toast.success('[Entity] updated successfully');
      }
      navigate('/[entities]');
    } catch (error) {
      console.error('Error saving [entity]:', error);
      toast.error(`Failed to ${mode} [entity]`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Create' : 'Edit'} [Entity]</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* ... other form fields */}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => navigate('/[entities]')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {mode === 'create' ? 'Create' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
```

### Form Layout Quick Checklist
- [ ] PageHeader at page level (not inside form component)
- [ ] `max-w-4xl mx-auto` wrapper around form component
- [ ] Form component returns Card directly (no PageHeader inside)
- [ ] Two-column grid (`grid grid-cols-1 md:grid-cols-2 gap-6`) for related fields
- [ ] Consistent spacing (`space-y-6` for form, `gap-6` for grids, `gap-4` for buttons)
- [ ] Standardized loading/error states (see [docs/design-system/form-layout.md](../../design-system/form-layout.md) §State Patterns)
- [ ] Action buttons with `flex justify-end gap-4` at form bottom
- [ ] Cancel button uses `variant="outline"`, Submit uses primary button

## Cross-Module Data Dependencies

When forms need data from other modules:

```typescript
// In [Entity]Form.tsx - Loading options from other modules
useEffect(() => {
  const fetchOptions = async () => {
    try {
      setIsLoading(true);

      // Fetch options from other modules (options: true bypasses permission check for dropdown data)
      const [rolesResponse, officesResponse] = await Promise.all([
        roleService.getRoles({ page: 1, limit: 100, options: true }),
        officeService.getOffices({ page: 1, limit: 100, options: true })
      ]);

      setRoles(rolesResponse.data);
      setOffices(officesResponse.data);
    } catch (error) {
      console.error('Failed to load form options:', error);
      toast.error('Failed to load form options');
    } finally {
      setIsLoading(false);
    }
  };

  fetchOptions();
}, []);
```

For combobox fields **inside a Dialog**, use `ModalCombobox` (not `SearchableSelect`) — see [tables-dropdowns.md §3 Searchable Select/Combobox Inside Dialog](./tables-dropdowns.md).
