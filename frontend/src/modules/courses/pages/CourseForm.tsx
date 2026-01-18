import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/core/components/ui/button';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/core/components/ui/form';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Checkbox } from '@/core/components/ui/checkbox';
import { BookOpen } from 'lucide-react';
import { useCourse } from '../hooks/useCourses';
import courseService from '../services/courseService';
import { CourseFormData } from '../types/course.types';
import { userService } from '@/modules/users';
import { ImageUpload, uploadService } from '@/modules/uploads';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  thumbnailUrl: z.string().optional().or(z.literal('')),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  language: z.string().min(1, 'Language is required'),
  instructorId: z.string().optional(),
  status: z.enum(['draft', 'published']),
  categoryIds: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CourseFormProps {
  mode: 'create' | 'edit';
}

const CourseForm = ({ mode }: CourseFormProps) => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const { course, isLoading: courseLoading, fetchCourse } = useCourse(courseId || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [instructors, setInstructors] = useState<{ id: string; name: string }[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [originalThumbnailUrl, setOriginalThumbnailUrl] = useState<string>('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      thumbnailUrl: '',
      difficulty: 'beginner',
      language: 'en',
      instructorId: '',
      status: 'draft',
      categoryIds: [],
    },
  });

  // Load instructors
  useEffect(() => {
    const loadData = async () => {
      try {
        const instructorsResponse = await userService.getUsers({ page: 1, limit: 100 });
        setInstructors(
          instructorsResponse.data.map(user => ({
            id: user.id,
            name: user.name
          }))
        );
      } catch (error) {
        console.error('Failed to load instructors:', error);
        toast.error('Failed to load instructors');
      }
    };

    loadData();
  }, []);

  // Load course data for editing
  useEffect(() => {
    if (mode === 'edit' && courseId) {
      fetchCourse(courseId);
    }
  }, [mode, courseId, fetchCourse]);

  // Populate form when course data is loaded
  useEffect(() => {
    if (course && mode === 'edit') {
      const selectedCats = course.categories || [];
      const thumbnailUrl = course.thumbnailUrl || '';
      
      form.reset({
        title: course.title,
        slug: course.slug,
        description: course.description || '',
        thumbnailUrl: thumbnailUrl,
        difficulty: course.difficulty,
        language: course.language,
        instructorId: course.instructorId || '',
        status: course.status === 'published' ? 'published' : 'draft',
        categoryIds: selectedCats.map(cat => cat.id),
      });
      
      setOriginalThumbnailUrl(thumbnailUrl);
    }
  }, [course, mode, form]);

  const generateSlug = (title: string) => {
    return courseService.generateSlug(title);
  };

  const handleTitleChange = (title: string) => {
    form.setValue('title', title);
    if (mode === 'create') {
      const slug = generateSlug(title);
      form.setValue('slug', slug);
    }
  };


  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);

      let thumbnailUrl = data.thumbnailUrl;

      // If there's a new file to upload (for new course or changed thumbnail)
      if (thumbnailFile) {
        try {
          // Get category for course materials
          const category = await uploadService.getCategoryByName('course-materials');
          if (!category) {
            throw new Error('File category "course-materials" not found');
          }

          // Upload the file
          const uploadResponse = await uploadService.uploadFile(
            thumbnailFile,
            category.id,
            true, // isPublic
          );

          // Get the public URL
          thumbnailUrl = uploadService.getPublicFileUrl(uploadResponse.id);
        } catch (error: any) {
          console.error('Error uploading thumbnail:', error);
          const errorMessage = error.response?.data?.message || 'Failed to upload thumbnail';
          toast.error(errorMessage);
          return;
        }
      } else if (mode === 'edit' && !thumbnailUrl && originalThumbnailUrl) {
        // If thumbnail was removed, keep it empty
        thumbnailUrl = '';
      }

      const courseData = {
        title: data.title,
        slug: data.slug,
        description: data.description,
        thumbnailUrl: thumbnailUrl,
        difficulty: data.difficulty,
        language: data.language,
        instructorId: data.instructorId || undefined,
        status: data.status,
        categoryIds: data.categoryIds && data.categoryIds.length > 0 ? data.categoryIds : undefined,
        isPublished: data.status === 'published',
      };

      if (mode === 'create') {
        await courseService.createCourse(courseData);
        toast.success('Course created successfully');
      } else if (courseId) {
        await courseService.updateCourse(courseId, courseData);
        toast.success('Course updated successfully');
      }

      navigate('/courses');
    } catch (error: any) {
      console.error('Error saving course:', error);
      const errorMessage = error.response?.data?.message || `Failed to ${mode} course`;
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (courseLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {mode === 'create' ? 'Create New Course' : 'Edit Course'}
          </h1>
          <p className="text-gray-600">
            {mode === 'create' 
              ? 'Fill in the details to create a new course' 
              : 'Update the course information'
            }
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/courses')}>
          Cancel
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Course Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Title *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter course title" 
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              handleTitleChange(e.target.value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug *</FormLabel>
                        <FormControl>
                          <Input placeholder="course-slug" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Detailed course description" 
                            rows={4}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="thumbnailUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Thumbnail Image</FormLabel>
                        <FormControl>
                          <ImageUpload
                            value={field.value || ''}
                            onChange={(value) => {
                              field.onChange(value || '');
                              // If value is cleared, clear the file too
                              if (!value) {
                                setThumbnailFile(null);
                              }
                            }}
                            categoryName="course-materials"
                            isPublic={true}
                            maxSize={5 * 1024 * 1024} // 5MB for course thumbnails
                            allowedTypes={['image/jpeg', 'image/png', 'image/gif', 'image/webp']}
                            placeholder="Upload course thumbnail image"
                            disabled={isSubmitting}
                            entityId={courseId || null}
                            onFileSelect={(file) => {
                              setThumbnailFile(file);
                              // For preview mode, set base64 as value
                              if (file && !courseId) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  const result = reader.result as string;
                                  field.onChange(result);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Course Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Course Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="instructorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instructor</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select instructor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {instructors.map(instructor => (
                              <SelectItem key={instructor.id} value={instructor.id}>
                                {instructor.name}
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
                    name="difficulty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Difficulty</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="id">Indonesian</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant={field.value === 'draft' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => field.onChange('draft')}
                            >
                              Draft
                            </Button>
                            <Button
                              type="button"
                              variant={field.value === 'published' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => field.onChange('published')}
                            >
                              Published
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate('/courses')}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Course' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default CourseForm;
