import { useFieldArray, useFormContext } from 'react-hook-form';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Checkbox } from '@/core/components/ui/checkbox';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/core/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Separator } from '@/core/components/ui/separator';
import { Badge } from '@/core/components/ui/badge';
import { Plus, ListOrdered } from 'lucide-react';
import { toast } from 'sonner';
import QuestionForm from './QuestionForm';
import { useEffect, useState } from 'react';
import { courseService, chapterService } from '@/modules/courses';

interface QuizFormProps {
  mode: 'create' | 'edit';
  entity?: string;
  entityId?: string;
  onQuestionMediaFileSelect?: (questionIndex: number, file: File | null, fieldId: string) => void;
  /** Hide LMS-only fields (entity binding, passing score) for health questionnaires */
  hideLmsFields?: boolean;
}

const QuizForm = ({ mode, entity, entityId, onQuestionMediaFileSelect, hideLmsFields }: QuizFormProps) => {
  const { control, watch, setValue } = useFormContext();
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [chapters, setChapters] = useState<{ id: string; title: string; courseId: string }[]>([]);
  const selectedEntity = watch('entity');
  const selectedEntityId = watch('entityId');
  const isPublished = watch('isPublished');

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'questions',
  });

  // Load courses and chapters for entity selection
  useEffect(() => {
    const loadData = async () => {
      try {
        // Always load courses for course selection
        const coursesResponse = await courseService.getCourses({ page: 1, limit: 100 });
        setCourses(coursesResponse.data.map(c => ({ id: c.id, title: c.title })));

        // Load chapters based on entity type
        if (selectedEntity === 'CHAPTER') {
          // Load all chapters immediately when CHAPTER is selected
          try {
            const chaptersResponse = await chapterService.getChapters({ page: 1, limit: 1000, isActive: true, options: true });
            setChapters(chaptersResponse.data.map(ch => ({ id: ch.id, title: ch.title, courseId: ch.courseId })));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load chapters';
            toast.error(errorMessage);
          }
        } else if (selectedEntity === 'COURSE' && selectedEntityId) {
          // Load chapters for selected course (if needed for reference)
          try {
            const chaptersResponse = await chapterService.getChapters({ page: 1, limit: 100, courseId: selectedEntityId, options: true });
            setChapters(chaptersResponse.data.map(ch => ({ id: ch.id, title: ch.title, courseId: ch.courseId })));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load chapters';
            toast.error(errorMessage);
          }
        } else {
          // Clear chapters when entity is empty or standalone
          setChapters([]);
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

      {hideLmsFields && (
        <Card>
          <CardHeader>
            <CardTitle>Health screening</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={control}
              name="isDefaultForHealthScreening"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={!!field.value}
                      onCheckedChange={(v) => field.onChange(v === true)}
                      disabled={!!selectedEntity || (mode === 'edit' && !isPublished)}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-medium cursor-pointer">
                      Default template for new health screenings
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Only one published standalone questionnaire can be the global default. Workers starting a declaration
                      without a specific template use this quiz.
                    </p>
                    {!!selectedEntity && (
                      <p className="text-sm text-amber-600 dark:text-amber-500">
                        Clear course/chapter binding (standalone only) to use this option.
                      </p>
                    )}
                    {!selectedEntity && mode === 'edit' && !isPublished && (
                      <p className="text-sm text-muted-foreground">
                        Publish this questionnaire first, then enable this option.
                      </p>
                    )}
                    {!selectedEntity && mode === 'create' && (
                      <p className="text-sm text-muted-foreground">
                        Use Create &amp; Publish if you set this as the default (drafts cannot be the default).
                      </p>
                    )}
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      )}

      {/* Entity Binding Section */}
      {!hideLmsFields && (
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
                    // Convert "STANDALONE" to undefined for form value
                    const entityValue = value === 'STANDALONE' ? undefined : value;
                    field.onChange(entityValue);
                    // Reset entityId when entity changes
                    if (value === 'STANDALONE' || !value) {
                      setValue('entityId', undefined);
                      setChapters([]);
                    } else {
                      // Clear entityId when switching between COURSE and CHAPTER
                      setValue('entityId', undefined);
                    }
                  }}
                  value={field.value || 'STANDALONE'}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Standalone (No binding)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="STANDALONE">Standalone</SelectItem>
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
      )}

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

            {!hideLmsFields && (
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
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          field.onChange(75);
                          return;
                        }
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue)) {
                          // Prevent input > 100
                          const clampedValue = Math.min(100, Math.max(0, numValue));
                          field.onChange(clampedValue);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            )}

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
      <Card className="border-l-4 border-l-primary bg-primary/5 dark:bg-primary/10">
        <CardHeader className="pb-4">
          <div className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ListOrdered className="h-5 w-5 text-primary" />
                Questions
              </CardTitle>
              {fields.length > 0 && (
                <Badge variant="secondary">
                  {fields.length} {fields.length === 1 ? 'question' : 'questions'}
                </Badge>
              )}
            </div>
            <Button
              type="button"
              variant="default"
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
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Add one or more questions. You can reorder and remove them anytime.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-muted-foreground/30 rounded-lg bg-muted/30 dark:bg-muted/20">
              <ListOrdered className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-muted-foreground">No questions yet</p>
              <p className="text-xs text-muted-foreground mt-1">Click <strong>Add Question</strong> above to add your first question.</p>
            </div>
          ) : (
            fields.map((field, index) => (
              <QuestionForm
                key={field.id}
                questionIndex={index}
                onRemove={() => remove(index)}
                onMediaFileSelect={(file) => {
                  if (onQuestionMediaFileSelect) {
                    // Use field.id as key to maintain correct mapping when questions are reordered
                    onQuestionMediaFileSelect(index, file, field.id);
                  }
                }}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizForm;
