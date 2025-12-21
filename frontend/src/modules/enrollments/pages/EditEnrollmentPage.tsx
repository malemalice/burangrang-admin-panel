import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/core/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { DateTimePicker } from '@/core/components/ui/datetime-picker';
import PageHeader from '@/core/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import enrollmentService from '../services/enrollmentService';
import { useEnrollments } from '../hooks/useEnrollments';
import { Enrollment, EnrollmentStatus } from '../types/enrollment.types';

const formSchema = z.object({
  status: z.nativeEnum(EnrollmentStatus),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const EditEnrollmentPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateEnrollment } = useEnrollments();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: EnrollmentStatus.ACTIVE,
      dueDate: '',
      notes: '',
    },
  });

  useEffect(() => {
    const fetchEnrollment = async () => {
      if (!id) {
        toast.error('Enrollment ID is required');
        navigate('/enrollments');
        return;
      }

      try {
        setIsLoading(true);
        const data = await enrollmentService.getEnrollmentById(id);
        setEnrollment(data);

        // Set form values
        form.reset({
          status: data.status as EnrollmentStatus,
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString().slice(0, 16) : '',
          notes: data.notes || '',
        });
      } catch (error: any) {
        console.error('Error fetching enrollment:', error);
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to fetch enrollment';
        toast.error(errorMessage);
        navigate('/enrollments');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEnrollment();
  }, [id, navigate, form]);

  const onSubmit = async (data: FormValues) => {
    if (!id) return;

    try {
      setIsSubmitting(true);

      // Convert datetime-local format to ISO string
      let dueDateISO: string | undefined = undefined;
      if (data.dueDate && data.dueDate.trim() !== '') {
        const localDate = new Date(data.dueDate);
        if (!isNaN(localDate.getTime())) {
          dueDateISO = localDate.toISOString();
        }
      }

      const updateData = {
        status: data.status,
        ...(dueDateISO && { dueDate: dueDateISO }),
        ...(data.notes && data.notes.trim() !== '' && { notes: data.notes.trim() }),
      };

      await updateEnrollment(id, updateData);
      toast.success('Enrollment updated successfully');
      navigate(`/enrollments/${id}`);
    } catch (error: any) {
      console.error('Error updating enrollment:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update enrollment';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!enrollment) {
    return null;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Edit Enrollment"
        subtitle="Update enrollment information"
        actions={
          <Button
            variant="outline"
            onClick={() => navigate(`/enrollments/${id}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Enrollment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-y-2">
            <div className="text-sm text-muted-foreground">Course</div>
            <div className="font-medium">{enrollment.course?.title || 'Unknown Course'}</div>
          </div>
          <div className="mb-4 space-y-2">
            <div className="text-sm text-muted-foreground">User</div>
            <div className="font-medium">
              {enrollment.user ? `${enrollment.user.firstName} ${enrollment.user.lastName}` : 'Unknown User'}
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value as EnrollmentStatus)}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={EnrollmentStatus.INVITED}>
                          {enrollmentService.formatStatus(EnrollmentStatus.INVITED)}
                        </SelectItem>
                        <SelectItem value={EnrollmentStatus.ACTIVE}>
                          {enrollmentService.formatStatus(EnrollmentStatus.ACTIVE)}
                        </SelectItem>
                        <SelectItem value={EnrollmentStatus.COMPLETED}>
                          {enrollmentService.formatStatus(EnrollmentStatus.COMPLETED)}
                        </SelectItem>
                        <SelectItem value={EnrollmentStatus.CANCELLED}>
                          {enrollmentService.formatStatus(EnrollmentStatus.CANCELLED)}
                        </SelectItem>
                        <SelectItem value={EnrollmentStatus.EXPIRED}>
                          {enrollmentService.formatStatus(EnrollmentStatus.EXPIRED)}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        mode="datetime"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional deadline for course completion
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Optional notes or instructions"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/enrollments/${id}`)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Update Enrollment'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditEnrollmentPage;
