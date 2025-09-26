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
import { Play, FileText, Youtube, Clock, ArrowLeft } from 'lucide-react';
import { useChapter } from '../hooks/useChapters';
import { useCourse } from '../hooks/useCourses';
import chapterService from '../services/chapterService';
import courseService from '../services/courseService';
import { ChapterFormData } from '../types/course.types';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  order: z.number().min(1, 'Order must be at least 1'),
  duration: z.number().min(0, 'Duration must be positive'),
  contentType: z.enum(['video', 'youtube', 'text']),
  contentUrl: z.string().optional(),
  youtubeVideoId: z.string().optional(),
  content: z.string().optional(),
  isFree: z.boolean(),
  isPublished: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface ChapterFormProps {
  mode: 'create' | 'edit';
  courseId: string;
}

const ChapterForm = ({ mode, courseId }: ChapterFormProps) => {
  const navigate = useNavigate();
  const { chapterId } = useParams<{ chapterId: string }>();
  const { chapter, isLoading: chapterLoading, fetchChapter } = useChapter(chapterId || null);
  const { course, fetchCourse } = useCourse(courseId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nextOrder, setNextOrder] = useState(1);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      order: 1,
      duration: 0,
      contentType: 'text',
      contentUrl: '',
      youtubeVideoId: '',
      content: '',
      isFree: false,
      isPublished: false,
    },
  });

  // Load course data
  useEffect(() => {
    if (courseId) {
      fetchCourse(courseId);
    }
  }, [courseId]);

  // Load chapter data for editing
  useEffect(() => {
    if (mode === 'edit' && chapterId) {
      fetchChapter(chapterId);
    }
  }, [mode, chapterId]);

  // Get next order number for new chapters
  useEffect(() => {
    if (course && mode === 'create') {
      const maxOrder = Math.max(...course.chapters.map(ch => ch.order), 0);
      setNextOrder(maxOrder + 1);
      form.setValue('order', maxOrder + 1);
    }
  }, [course, mode]);

  // Populate form when chapter data is loaded
  useEffect(() => {
    if (chapter && mode === 'edit') {
      form.reset({
        title: chapter.title,
        description: chapter.description || '',
        order: chapter.order,
        duration: chapter.duration,
        contentType: chapter.contentType,
        contentUrl: chapter.contentUrl || '',
        youtubeVideoId: chapter.youtubeVideoId || '',
        content: chapter.content || '',
        isFree: chapter.isFree,
        isPublished: chapter.isPublished,
      });
    }
  }, [chapter, mode]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);

      const chapterData: ChapterFormData = {
        ...data,
        courseId,
        contentUrl: data.contentUrl || undefined,
        youtubeVideoId: data.youtubeVideoId || undefined,
        content: data.content || undefined,
      };

      if (mode === 'create') {
        await chapterService.createChapter(chapterData);
        toast.success('Chapter created successfully');
      } else if (chapterId) {
        await chapterService.updateChapter(chapterId, chapterData);
        toast.success('Chapter updated successfully');
      }

      navigate(`/courses/${courseId}`);
    } catch (error) {
      console.error('Error saving chapter:', error);
      toast.error(`Failed to ${mode} chapter`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case 'video':
        return <Play className="h-4 w-4" />;
      case 'youtube':
        return <Youtube className="h-4 w-4" />;
      case 'text':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (chapterLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(`/courses/${courseId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {mode === 'create' ? 'Create New Chapter' : 'Edit Chapter'}
            </h1>
            <p className="text-gray-600">
              {mode === 'create' 
                ? 'Add a new chapter to your course' 
                : 'Update the chapter information'
              }
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate(`/courses/${courseId}`)}>
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
                    {getContentTypeIcon(form.watch('contentType'))}
                    Chapter Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chapter Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter chapter title" {...field} />
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
                            placeholder="Brief description of this chapter" 
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="order"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Order *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="1"
                              placeholder="1"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (minutes) *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="0"
                              placeholder="0"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Content Type Specific Fields */}
              <Card>
                <CardHeader>
                  <CardTitle>Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="contentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select content type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="text">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Text Content
                              </div>
                            </SelectItem>
                            <SelectItem value="video">
                              <div className="flex items-center gap-2">
                                <Play className="h-4 w-4" />
                                Video File
                              </div>
                            </SelectItem>
                            <SelectItem value="youtube">
                              <div className="flex items-center gap-2">
                                <Youtube className="h-4 w-4" />
                                YouTube Video
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch('contentType') === 'video' && (
                    <FormField
                      control={form.control}
                      name="contentUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Video URL</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://example.com/video.mp4" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {form.watch('contentType') === 'youtube' && (
                    <FormField
                      control={form.control}
                      name="youtubeVideoId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>YouTube Video ID</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="dQw4w9WgXcQ" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {form.watch('contentType') === 'text' && (
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Text Content</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter the text content for this chapter" 
                              rows={8}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Chapter Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Chapter Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="isFree"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Free Chapter</FormLabel>
                          <p className="text-sm text-gray-600">
                            Make this chapter available for free
                          </p>
                        </div>
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
                            Make this chapter visible to students
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Course Information */}
              {course && (
                <Card>
                  <CardHeader>
                    <CardTitle>Course</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="font-medium">{course.title}</h4>
                      <p className="text-sm text-gray-600">
                        {course.totalChapters} chapters • {courseService.formatDuration(course.totalDuration)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Duration Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Duration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {courseService.formatDuration(form.watch('duration') || 0)}
                    </div>
                    <p className="text-sm text-gray-600">
                      {form.watch('duration') || 0} minutes
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate(`/courses/${courseId}`)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Chapter' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ChapterForm;
