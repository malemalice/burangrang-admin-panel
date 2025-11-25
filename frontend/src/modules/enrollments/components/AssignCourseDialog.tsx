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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Button } from '@/core/components/ui/button';
import { Checkbox } from '@/core/components/ui/checkbox';
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
  isRequired: z.boolean().default(false),
  notes: z.string().optional(),
  sendEmail: z.boolean().default(true),
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
      isRequired: false,
      notes: '',
      sendEmail: true,
    },
  });

  // Fetch courses and users when dialog opens
  useEffect(() => {
    if (open) {
      setIsLoadingOptions(true);
      Promise.all([
        courseService.getCourses({ page: 1, limit: 100, isPublished: true }),
        userService.getUsers({ page: 1, limit: 100 }),
      ])
        .then(([coursesResponse, usersResponse]) => {
          setCourses(coursesResponse.data);
          setUsers(usersResponse.data);
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
        isRequired: Boolean(data.isRequired ?? false),
        sendEmail: Boolean(data.sendEmail ?? true),
        // Only include optional fields if they have valid values
        ...(dueDateISO && { dueDate: dueDateISO }),
        ...(data.notes && data.notes.trim() !== '' && { notes: data.notes.trim() }),
      };

      await assignCourse(assignData);
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error assigning course:', error);
      console.error('Error response:', error?.response?.data);

      // Extract error message from validation errors
      // NestJS ValidationPipe returns errors in format:
      // { message: ['field must be...', 'field should not be...'], error: 'Bad Request', statusCode: 400 }
      let errorMessage = 'Failed to assign course';

      if (error?.response?.data) {
        const errorData = error.response.data;

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
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoadingOptions}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoadingOptions}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
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
                    <Input
                      type="datetime-local"
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
              name="isRequired"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Required Enrollment</FormLabel>
                    <FormDescription>
                      Mark this enrollment as required for the user
                    </FormDescription>
                  </div>
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

            <FormField
              control={form.control}
              name="sendEmail"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Send Email Notification</FormLabel>
                    <FormDescription>
                      Send email notification to the user about this assignment
                    </FormDescription>
                  </div>
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
