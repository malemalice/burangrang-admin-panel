import { useFieldArray, useFormContext } from 'react-hook-form';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Checkbox } from '@/core/components/ui/checkbox';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/core/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Separator } from '@/core/components/ui/separator';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import QuestionForm from './QuestionForm';
import { useEffect, useState } from 'react';
import { courseService, chapterService } from '@/modules/courses';

interface QuizFormProps {
  mode: 'create' | 'edit';
  entity?: string;
  entityId?: string;
}

const QuizForm = ({ mode, entity, entityId }: QuizFormProps) => {
  const { control, watch, setValue } = useFormContext();
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [chapters, setChapters] = useState<{ id: string; title: string; courseId: string }[]>([]);
  const selectedEntity = watch('entity');
  const selectedEntityId = watch('entityId');

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'questions',
  });

  // Load courses and chapters for entity selection
  useEffect(() => {
    const loadData = async () => {
      try {
        const coursesResponse = await courseService.getCourses({ page: 1, limit: 100 });
        setCourses(coursesResponse.data.map(c => ({ id: c.id, title: c.title })));

        if (selectedEntity === 'COURSE' && selectedEntityId) {
          // Load chapters for selected course
          try {
            const chaptersResponse = await chapterService.getChapters({ page: 1, limit: 100, courseId: selectedEntityId });
            setChapters(chaptersResponse.data.map(ch => ({ id: ch.id, title: ch.title, courseId: ch.courseId })));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load chapters';
            toast.error(errorMessage);
          }
        } else if (selectedEntity === 'CHAPTER') {
          // Load all chapters for chapter selection
          try {
            const chaptersResponse = await chapterService.getChapters({ page: 1, limit: 1000 });
            setChapters(chaptersResponse.data.map(ch => ({ id: ch.id, title: ch.title, courseId: ch.courseId })));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load chapters';
            toast.error(errorMessage);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load courses or chapters';
        toast.error(errorMessage);
      }
    };

    loadData();
  }, [selectedEntity, selectedEntityId]);

  // Set initial entity values if provided
  useEffect(() => {
    if (entity && entityId) {
      setValue('entity', entity);
      setValue('entityId', entityId);
    }
  }, [entity, entityId, setValue]);

  return (
    <div className="space-y-6">
      {/* Basic Info Section */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quiz Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter quiz title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter quiz description"
                    className="min-h-[100px]"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="instructions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instructions</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter instructions for students"
                    className="min-h-[80px]"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Entity Binding Section */}
      <Card>
        <CardHeader>
          <CardTitle>Quiz Binding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={control}
            name="entity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bind to</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    if (!value) {
                      setValue('entityId', undefined);
                    }
                  }}
                  value={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Standalone (No binding)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="COURSE">Course</SelectItem>
                    <SelectItem value="CHAPTER">Chapter</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedEntity === 'COURSE' && (
            <FormField
              control={control}
              name="entityId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Course</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
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
          )}

          {selectedEntity === 'CHAPTER' && (
            <FormField
              control={control}
              name="entityId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Chapter</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a chapter" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {chapters.map((chapter) => (
                        <SelectItem key={chapter.id} value={chapter.id}>
                          {chapter.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </CardContent>
      </Card>

      {/* Settings Section */}
      <Card>
        <CardHeader>
          <CardTitle>Quiz Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Optional"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="passingScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Passing Score (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 75)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="maxAttempts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Attempts</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Unlimited if empty"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <FormField
              control={control}
              name="shuffleQuestions"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Shuffle Questions</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Randomize question order for each attempt
                    </div>
                  </div>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="shuffleOptions"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Shuffle Options</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Randomize option order for each question
                    </div>
                  </div>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="showCorrectAnswer"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Show Correct Answer</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Display correct answers after submission
                    </div>
                  </div>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Questions Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Questions</CardTitle>
          <Button
            type="button"
            variant="outline"
            onClick={() => append({
              questionType: 'MULTIPLE_CHOICE',
              questionText: '',
              points: 1,
              order: fields.length,
              options: [],
            })}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Question
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No questions added yet. Click "Add Question" to get started.
            </div>
          ) : (
            fields.map((field, index) => (
              <QuestionForm
                key={field.id}
                questionIndex={index}
                onRemove={() => remove(index)}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizForm;
