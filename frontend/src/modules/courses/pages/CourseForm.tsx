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
import { Badge } from '@/core/components/ui/badge';
import { X, Plus, BookOpen, DollarSign } from 'lucide-react';
import { useCourse } from '../hooks/useCourses';
import { useCourseStats } from '../hooks/useCourses';
import courseService from '../services/courseService';
import { CourseFormData } from '../types/course.types';
import { userService } from '@/modules/users';
import { categoryService } from '@/modules/categories';
import { ImageUpload } from '@/modules/uploads';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  thumbnailUrl: z.string().optional().or(z.literal('')),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  language: z.string().min(1, 'Language is required'),
  instructorId: z.string().min(1, 'Instructor is required'),
  status: z.enum(['draft', 'review', 'published', 'archived']),
  price: z.number().min(0, 'Price must be positive').optional().nullable(),
  salePrice: z.number().min(0, 'Sale price must be positive').optional().nullable(),
  categoryIds: z.array(z.string()),
  isPublished: z.boolean(),
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
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<{ id: string; name: string }[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      shortDescription: '',
      thumbnailUrl: '',
      difficulty: 'beginner',
      language: 'en',
      instructorId: '',
      status: 'draft',
      price: null,
      salePrice: null,
      categoryIds: [],
      isPublished: false,
    },
  });

  // Load instructors and categories
  useEffect(() => {
    const loadData = async () => {
      try {
        const [instructorsResponse, categoriesResponse] = await Promise.all([
          userService.getUsers({ page: 1, limit: 100 }),
          categoryService.getCategories({ page: 1, limit: 100 })
        ]);

        setInstructors(
          instructorsResponse.data.map(user => ({
            id: user.id,
            name: user.name
          }))
        );
        setCategories(
          categoriesResponse.data.map(category => ({
            id: category.id,
            name: category.name
          }))
        );
      } catch (error) {
        console.error('Failed to load form data:', error);
        toast.error('Failed to load form data');
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
      setSelectedCategories(selectedCats);
      
      form.reset({
        title: course.title,
        slug: course.slug,
        description: course.description || '',
        shortDescription: course.shortDescription || '',
        thumbnailUrl: course.thumbnailUrl || '',
        difficulty: course.difficulty,
        language: course.language,
        instructorId: course.instructorId,
        status: course.status,
        price: course.price || null,
        salePrice: course.salePrice || null,
        categoryIds: selectedCats.map(cat => cat.id),
        isPublished: course.isPublished,
      });
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

  const handleCategoryToggle = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;

    const isSelected = selectedCategories.some(cat => cat.id === categoryId);
    
    if (isSelected) {
      setSelectedCategories(prev => prev.filter(cat => cat.id !== categoryId));
      form.setValue('categoryIds', form.getValues('categoryIds').filter(id => id !== categoryId));
    } else {
      setSelectedCategories(prev => [...prev, category]);
      form.setValue('categoryIds', [...form.getValues('categoryIds'), categoryId]);
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);

      const courseData = {
        title: data.title,
        slug: data.slug,
        description: data.description,
        shortDescription: data.shortDescription,
        thumbnailUrl: data.thumbnailUrl,
        difficulty: data.difficulty,
        language: data.language,
        instructorId: data.instructorId,
        status: data.status,
        price: data.price || undefined,
        salePrice: data.salePrice || undefined,
        categoryIds: data.categoryIds,
        isPublished: data.isPublished,
      };

      if (mode === 'create') {
        await courseService.createCourse(courseData);
        toast.success('Course created successfully');
      } else if (courseId) {
        await courseService.updateCourse(courseId, courseData);
        toast.success('Course updated successfully');
      }

      navigate('/courses');
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error(`Failed to ${mode} course`);
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
                    name="shortDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Short Description</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Brief description for course cards" 
                            {...field} 
                          />
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
                        <FormControl>
                          <ImageUpload
                            value={field.value || ''}
                            onChange={(value) => field.onChange(value || '')}
                            categoryName="course-materials"
                            isPublic={true}
                            maxSize={5 * 1024 * 1024} // 5MB for course thumbnails
                            allowedTypes={['image/jpeg', 'image/png', 'image/gif', 'image/webp']}
                            placeholder="Upload course thumbnail image"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Categories */}
              <Card>
                <CardHeader>
                  <CardTitle>Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Select categories for this course</p>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(category => (
                        <Badge
                          key={category.id}
                          variant={selectedCategories.some(cat => cat.id === category.id) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => handleCategoryToggle(category.id)}
                        >
                          {category.name}
                        </Badge>
                      ))}
                    </div>
                    {selectedCategories.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">Selected categories:</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedCategories.map(category => (
                            <Badge key={category.id} className="flex items-center gap-1">
                              {category.name}
                              <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => handleCategoryToggle(category.id)}
                              />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
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
                        <FormLabel>Instructor *</FormLabel>
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="review">Review</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isPublished"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Published</FormLabel>
                          <p className="text-sm text-gray-600">
                            Make this course visible to students
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Pricing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="salePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sale Price ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          />
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
