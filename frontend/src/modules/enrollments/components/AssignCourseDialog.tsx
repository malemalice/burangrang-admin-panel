import { useState, useEffect } from 'react';
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
  FormDescription,
} from '@/core/components/ui/form';
import { ModalCombobox, ModalComboboxOption } from '@/core/components/ui/modal-combobox';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { DateTimePicker } from '@/core/components/ui/datetime-picker';
import { Button } from '@/core/components/ui/button';
import { useEnrollments } from '../hooks/useEnrollments';
import { AssignEnrollmentDTO } from '../types/enrollment.types';
import courseService from '@/modules/courses/services/courseService';
import userService from '@/modules/users/services/userService';
import { Course } from '@/modules/courses/types/course.types';
import { User } from '@/core/lib/types';

const formSchema = z.object({
  userId: z.string().min(1, 'User is required'),
  courseId: z.string().min(1, 'Course is required'),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AssignCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const AssignCourseDialog = ({ open, onOpenChange, onSuccess }: AssignCourseDialogProps) => {
  const { assignCourse } = useEnrollments();
  const [isLoading, setIsLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: '',
      courseId: '',
      dueDate: '',
      notes: '',
    },
  });

  const fetchAllUsersForOptions = async (): Promise<User[]> => {
    const pageSize = 200;
    const firstPage = await userService.getUsers({ page: 1, limit: pageSize, options: true });

    const usersMap = new Map<string, User>();
    firstPage.data.forEach((user) => {
      usersMap.set(user.id, user);
    });

    const totalPages = Math.max(1, firstPage.meta.totalPages || 1);

    for (let page = 2; page <= totalPages; page += 1) {
      const response = await userService.getUsers({ page, limit: pageSize, options: true });
      response.data.forEach((user) => {
        usersMap.set(user.id, user);
      });
    }

    return Array.from(usersMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    );
  };

  // Fetch courses and users when dialog opens
  useEffect(() => {
    if (open) {
      setIsLoadingOptions(true);
      Promise.all([
        courseService.getCourses({ page: 1, limit: 100, status: 'published', options: true }),
        fetchAllUsersForOptions(),
      ])
        .then(([coursesResponse, usersResponse]) => {
          setCourses(coursesResponse.data);
          setUsers(usersResponse);
        })
        .catch((error) => {
          console.error('Failed to fetch options:', error);
          toast.error('Failed to load courses or users');
        })
        .finally(() => {
          setIsLoadingOptions(false);
        });
    } else {
      // Reset form when dialog closes
      form.reset();
    }
  }, [open, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);

      // Convert datetime-local format to ISO string
      // Only process if dueDate has a valid value (not empty string)
      let dueDateISO: string | undefined = undefined;
      if (data.dueDate && data.dueDate.trim() !== '') {
        // datetime-local format: "YYYY-MM-DDTHH:mm"
        // Convert to ISO 8601 format: "YYYY-MM-DDTHH:mm:ss.sssZ"
        const localDate = new Date(data.dueDate);
        if (!isNaN(localDate.getTime())) {
          dueDateISO = localDate.toISOString();
        }
      }

      // Build assign data object with required fields
      // Use conditional property spread to avoid sending undefined/empty fields
      const assignData: AssignEnrollmentDTO = {
        userId: data.userId.trim(),
        courseId: data.courseId.trim(),
        isRequired: true,
        sendEmail: true,
        // Only include optional fields if they have valid values
        ...(dueDateISO && { dueDate: dueDateISO }),
        ...(data.notes && data.notes.trim() !== '' && { notes: data.notes.trim() }),
      };

      await assignCourse(assignData);
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: unknown) {
      console.error('Error assigning course:', error);

      type ApiErrorPayload = {
        message?: string | string[] | Record<string, string | string[]>;
        error?: string;
      };

      type ApiError = {
        response?: {
          data?: ApiErrorPayload;
        };
        message?: string;
      };

      const apiError = error as ApiError;
      console.error('Error response:', apiError.response?.data);

      // Extract error message from validation errors
      // NestJS ValidationPipe returns errors in format:
      // { message: ['field must be...', 'field should not be...'], error: 'Bad Request', statusCode: 400 }
      let errorMessage = 'Failed to assign course';

      if (apiError.response?.data) {
        const errorData = apiError.response.data;

        // Handle array of validation messages
        if (Array.isArray(errorData.message)) {
          // Format validation errors: "field1: constraint1, field2: constraint2"
          const formattedMessages = errorData.message.map((msg: string) => {
            // Try to extract field name and constraint from message
            // Format: "property should not exist" or "property must be a string"
            return msg;
          });
          errorMessage = formattedMessages.join('. ');
        }
        // Handle single string message
        else if (typeof errorData.message === 'string') {
          errorMessage = errorData.message;
        }
        // Handle error object with nested messages
        else if (errorData.message && typeof errorData.message === 'object') {
          const messages: string[] = [];
          Object.keys(errorData.message).forEach((key) => {
            const fieldErrors = Array.isArray(errorData.message[key])
              ? errorData.message[key]
              : [errorData.message[key]];
            fieldErrors.forEach((err: string) => {
              messages.push(`${key}: ${err}`);
            });
          });
          errorMessage = messages.join('. ');
        }
        // Fallback to error field
        else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } else if (apiError.message) {
        errorMessage = apiError.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const userOptions: ModalComboboxOption[] = users.map((user) => ({
    value: user.id,
    label: `${user.name} (${user.email})`,
  }));

  const courseOptions: ModalComboboxOption[] = courses.map((course) => ({
    value: course.id,
    label: course.title,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Assign Course</DialogTitle>
          <DialogDescription>
            Assign a course to a user. The user will receive a notification and email (if enabled).
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User *</FormLabel>
                  <FormControl>
                    <ModalCombobox
                      options={userOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select a user"
                      searchPlaceholder="Search user..."
                      disabled={isLoadingOptions}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="courseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course *</FormLabel>
                  <FormControl>
                    <ModalCombobox
                      options={courseOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select a course"
                      searchPlaceholder="Search course..."
                      disabled={isLoadingOptions}
                    />
                  </FormControl>
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
                      placeholder="Optional notes or instructions for the user"
                      {...field}
                    />
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
              <Button type="submit" disabled={isLoading || isLoadingOptions}>
                {isLoading ? 'Assigning...' : 'Assign Course'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AssignCourseDialog;
