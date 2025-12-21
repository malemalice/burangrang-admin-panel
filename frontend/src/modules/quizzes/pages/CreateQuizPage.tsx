import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Form } from '@/core/components/ui/form';
import { Card, CardContent } from '@/core/components/ui/card';
import PageHeader from '@/core/components/ui/PageHeader';
import QuizForm from '../components/QuizForm';
import { useQuizzes } from '../hooks/useQuizzes';
import { CreateQuizDTO, CreateQuizQuestionDTO } from '../types/quiz.types';

const questionSchema = z.object({
  questionType: z.enum(['MULTIPLE_CHOICE', 'ESSAY', 'TRUE_FALSE']),
  questionText: z.string().min(1, 'Question text is required'),
  explanation: z.string().optional(),
  mediaUrl: z.string().optional(),
  mediaType: z.string().optional(),
  points: z.coerce.number().min(0).default(1),
  order: z.coerce.number().min(0),
  options: z.array(z.object({
    optionText: z.string(), // Allow empty for ESSAY questions
    isCorrect: z.boolean(),
    order: z.coerce.number().min(0),
  })).optional(),
}).refine((data) => {
  // Only validate options for MULTIPLE_CHOICE and TRUE_FALSE
  if (data.questionType === 'MULTIPLE_CHOICE' || data.questionType === 'TRUE_FALSE') {
    if (!data.options || data.options.length < 2) {
      return false;
    }
    // Check that all options have text
    return data.options.every(opt => opt.optionText && opt.optionText.trim().length > 0);
  }
  return true;
}, {
  message: 'Multiple choice and true/false questions require at least 2 options with text',
  path: ['options'],
});

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  instructions: z.string().optional(),
  entity: z.enum(['COURSE', 'CHAPTER']).optional(),
  entityId: z.string().optional(),
  duration: z.coerce.number().min(1).optional(),
  passingScore: z.coerce.number().min(0).max(100).default(75),
  maxAttempts: z.coerce.number().min(1).optional(),
  shuffleQuestions: z.boolean().default(false),
  shuffleOptions: z.boolean().default(false),
  showCorrectAnswer: z.boolean().default(true),
  isPublished: z.boolean().default(false),
  questions: z.array(questionSchema).min(1, 'At least one question is required'),
}).refine((data) => {
  // Entity can be undefined (standalone), COURSE, or CHAPTER
  if (data.entity && !data.entityId) {
    return false;
  }
  if (!data.entity && data.entityId) {
    return false;
  }
  return true;
}, {
  message: 'Entity and entityId must both be set or both be empty',
  path: ['entityId'],
});

type FormValues = z.infer<typeof formSchema>;

const CreateQuizPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { createQuiz } = useQuizzes();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Store File objects for question media files using fieldId as key
  const [questionMediaFiles, setQuestionMediaFiles] = useState<Record<string, File | null>>({});
  // Track fieldId for each question index (updated when callback is called)
  const [questionFieldIds, setQuestionFieldIds] = useState<string[]>([]);

  // Get entity and entityId from URL params (for binding from course/chapter pages)
  const entityParam = searchParams.get('entity');
  const entityIdParam = searchParams.get('entityId') || undefined;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      instructions: '',
      entity: (entityParam === 'COURSE' || entityParam === 'CHAPTER' ? entityParam : undefined) as 'COURSE' | 'CHAPTER' | undefined,
      entityId: entityIdParam || undefined,
      duration: undefined,
      passingScore: 75,
      maxAttempts: undefined,
      shuffleQuestions: false,
      shuffleOptions: false,
      showCorrectAnswer: true,
      isPublished: false,
      questions: [],
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);

      // Upload media files before submitting (if there are File objects to upload)
      const uploadService = (await import('@/modules/uploads/services/uploadService')).default;
      const uploadedQuestions = await Promise.all(
        data.questions.map(async (q, index) => {
          let mediaUrl = q.mediaUrl;
          // Get fieldId for this question index (falls back to checking by index if not tracked)
          const fieldId = questionFieldIds[index] || String(index);
          const mediaFile = questionMediaFiles[fieldId];

          // If there's a File object to upload, upload it directly
          if (mediaFile) {
            try {
              // Get category
              const category = await uploadService.getCategoryByName('course-materials');
              if (!category) {
                throw new Error('File category "course-materials" not found');
              }

              // Upload the file
              const uploadResponse = await uploadService.uploadFile(
                mediaFile,
                category.id,
                true, // isPublic
              );

              // Get the public URL
              mediaUrl = uploadService.getPublicFileUrl(uploadResponse.id);
            } catch (error: any) {
              console.error('Error uploading media file:', error);
              const errorMessage = error.response?.data?.message || 'Failed to upload media file';
              toast.error(errorMessage);
              throw error;
            }
          } else if (mediaUrl && mediaUrl.startsWith('data:')) {
            // Fallback: If mediaUrl is base64 but no File object, try to convert and upload
            try {
              const response = await fetch(mediaUrl);
              const blob = await response.blob();
              const file = new File([blob], `question-media-${Date.now()}`, { type: q.mediaType || blob.type });

              const category = await uploadService.getCategoryByName('course-materials');
              if (category) {
                const uploadResponse = await uploadService.uploadFile(file, category.id, true);
                mediaUrl = uploadService.getPublicFileUrl(uploadResponse.id);
              }
            } catch (error) {
              console.error('Failed to upload media file:', error);
              toast.error('Failed to upload media file. Please try again.');
              throw error;
            }
          }

          return {
            questionType: q.questionType,
            questionText: q.questionText,
            explanation: q.explanation || undefined,
            mediaUrl: mediaUrl || undefined,
            mediaType: q.mediaType || undefined,
            points: q.points,
            order: q.order,
            options: q.options?.map((opt, optIndex) => ({
              optionText: opt.optionText,
              isCorrect: opt.isCorrect,
              order: optIndex,
            })),
          };
        })
      );

      const quizData: CreateQuizDTO = {
        title: data.title,
        description: data.description || undefined,
        instructions: data.instructions || undefined,
        entity: data.entity || undefined,
        entityId: data.entityId || undefined,
        duration: data.duration || undefined,
        passingScore: data.passingScore,
        maxAttempts: data.maxAttempts || undefined,
        shuffleQuestions: data.shuffleQuestions,
        shuffleOptions: data.shuffleOptions,
        showCorrectAnswer: data.showCorrectAnswer,
        isPublished: data.isPublished,
        questions: uploadedQuestions as CreateQuizQuestionDTO[],
      };

      const newQuiz = await createQuiz(quizData);
      toast.success(data.isPublished ? 'Quiz created and published successfully' : 'Quiz saved as draft successfully');
      navigate(`/quizzes/${newQuiz.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create quiz';
      console.error('Error creating quiz:', error);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onError = (errors: any) => {
    console.error('Form validation errors:', errors);

    // Check for specific field errors
    if (errors.title) {
      toast.error(errors.title.message || 'Title is required');
      return;
    }
    if (errors.questions) {
      toast.error(errors.questions.message || 'At least one question is required');
      return;
    }
    if (errors.entityId) {
      toast.error(errors.entityId.message || 'Please select a course or chapter');
      return;
    }

    // Get first error message
    const firstError = Object.values(errors)[0] as any;
    if (firstError?.message) {
      toast.error(firstError.message);
    } else {
      toast.error('Please fill in all required fields correctly');
    }
  };

  return (
    <>
      <PageHeader
        title="Create Quiz"
        subtitle="Create a new quiz with questions and options"
        actions={
          <Button variant="outline" onClick={() => navigate('/quizzes')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Quizzes
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
            <QuizForm
              mode="create"
              entity={entityParam}
              entityId={entityIdParam}
              onQuestionMediaFileSelect={(questionIndex, file, fieldId) => {
                // Update fieldId tracking for this index
                setQuestionFieldIds((prev) => {
                  const updated = [...prev];
                  updated[questionIndex] = fieldId;
                  return updated;
                });
                // Store file by fieldId
                setQuestionMediaFiles((prev) => ({
                  ...prev,
                  [fieldId]: file,
                }));
              }}
            />

            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/quizzes')}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      form.setValue('isPublished', false);
                      const isValid = await form.trigger();
                      if (isValid) {
                        form.handleSubmit(onSubmit, onError)();
                      } else {
                        onError(form.formState.errors);
                      }
                    }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : 'Save as Draft'}
                  </Button>
                  <Button
                    type="button"
                    onClick={async () => {
                      form.setValue('isPublished', true);
                      const isValid = await form.trigger();
                      if (isValid) {
                        form.handleSubmit(onSubmit, onError)();
                      } else {
                        onError(form.formState.errors);
                      }
                    }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating...' : 'Create & Publish'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    </>
  );
};

export default CreateQuizPage;
