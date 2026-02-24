import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Form } from '@/core/components/ui/form';
import { Card, CardContent } from '@/core/components/ui/card';
import PageHeader from '@/core/components/ui/PageHeader';
import QuizForm from '../components/QuizForm';
import { useQuiz } from '../hooks/useQuizzes';
import { UpdateQuizDTO, CreateQuizQuestionDTO } from '../types/quiz.types';
import quizService from '../services/quizService';

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
}).refine((data) => {
  if (data.questionType === 'MULTIPLE_CHOICE' || data.questionType === 'TRUE_FALSE') {
    if (!data.options || data.options.length < 2) return true;
    return data.options.some(opt => opt.isCorrect === true);
  }
  return true;
}, {
  message: 'Each multiple choice or true/false question must have at least one option marked as Correct Answer',
  path: ['options'],
});

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().or(z.literal('')),
  instructions: z.string().optional().or(z.literal('')),
  entity: z.enum(['COURSE', 'CHAPTER']).optional(),
  entityId: z.preprocess(
    (val) => val === null || val === '' ? undefined : val,
    z.string().optional()
  ),
  duration: z.coerce.number().min(1).optional().nullable(),
  passingScore: z.coerce.number().min(0).max(100).default(75),
  maxAttempts: z.coerce.number().min(1).optional().nullable(),
  shuffleQuestions: z.boolean().default(false),
  shuffleOptions: z.boolean().default(false),
  showCorrectAnswer: z.boolean().default(true),
  isPublished: z.boolean().default(false),
  questions: z.array(questionSchema).min(1, 'At least one question is required'),
}).refine((data) => {
  const entityValue = data.entity;
  // Check if entity is set (not undefined)
  const hasEntity = entityValue !== undefined;
  if (hasEntity && !data.entityId) {
    return false;
  }
  if (!hasEntity && data.entityId && data.entityId !== '') {
    return false;
  }
  return true;
}, {
  message: 'Entity and entityId must both be set or both be empty',
  path: ['entityId'],
});

type FormValues = z.infer<typeof formSchema>;

const EditQuizPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { quiz, isLoading, fetchQuiz } = useQuiz(id || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Store File objects for question media files using fieldId as key
  const [questionMediaFiles, setQuestionMediaFiles] = useState<Record<string, File | null>>({});
  // Track fieldId for each question index
  const [questionFieldIds, setQuestionFieldIds] = useState<string[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      instructions: '',
      entity: undefined,
      entityId: undefined,
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

  useEffect(() => {
    if (id) {
      fetchQuiz(id);
    }
  }, [id, fetchQuiz]);

  useEffect(() => {
    if (quiz) {
      form.reset({
        title: quiz.title,
        description: quiz.description || '',
        instructions: quiz.instructions || '',
        entity: quiz.entity || undefined,
        entityId: quiz.entityId || undefined, // Convert null to undefined
        duration: quiz.duration,
        passingScore: quiz.passingScore,
        maxAttempts: quiz.maxAttempts,
        shuffleQuestions: quiz.shuffleQuestions,
        shuffleOptions: quiz.shuffleOptions,
        showCorrectAnswer: quiz.showCorrectAnswer,
        isPublished: quiz.isPublished,
        questions: quiz.questions?.map((q) => ({
          questionType: q.questionType,
          questionText: q.questionText,
          explanation: q.explanation || '',
          mediaUrl: q.mediaUrl || '',
          mediaType: q.mediaType || '',
          points: q.points,
          order: q.order,
          options: q.options?.map((opt) => ({
            optionText: opt.optionText,
            isCorrect: opt.isCorrect,
            order: opt.order,
          })),
        })) || [],
      });
      // Clear question media files when quiz is loaded (existing media already has URLs)
      setQuestionMediaFiles({});
    }
  }, [quiz, form]);

  const onSubmit = async (data: FormValues) => {
    if (!id) return;

    try {
      setIsSubmitting(true);

      // Helper to convert entity value - return null for standalone instead of undefined
      const getEntityValue = (): 'COURSE' | 'CHAPTER' | null | undefined => {
        const entityValue = data.entity;
        if (entityValue === undefined || entityValue === null) {
          // Return null explicitly for standalone (so backend knows to clear entity)
          // Only return undefined if we're not updating entity at all
          return null; // Explicitly set to null for standalone
        }
        // Type guard: check if it's a valid entity value
        if (entityValue === 'COURSE' || entityValue === 'CHAPTER') {
          return entityValue;
        }
        // Empty string or other invalid values - treat as standalone
        return null;
      };

      // Upload media files before submitting (if there are File objects to upload)
      const uploadService = (await import('@/modules/uploads/services/uploadService')).default;
      const uploadedQuestions = await Promise.all(
        data.questions.map(async (q, index) => {
          let mediaUrl = q.mediaUrl;
          // Get fieldId for this question index (falls back to index as string if not tracked)
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
            explanation: q.explanation && q.explanation.trim() !== '' ? q.explanation : undefined,
            mediaUrl: mediaUrl && mediaUrl.trim() !== '' ? mediaUrl : undefined,
            mediaType: q.mediaType && q.mediaType.trim() !== '' ? q.mediaType : undefined,
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

      const quizData: UpdateQuizDTO = {
        title: data.title,
        description: data.description && data.description.trim() !== '' ? data.description : undefined,
        instructions: data.instructions && data.instructions.trim() !== '' ? data.instructions : undefined,
        entity: getEntityValue(),
        entityId: data.entityId && data.entityId.trim() !== '' ? data.entityId : null, // Set to null for standalone
        duration: data.duration != null && data.duration > 0 ? data.duration : null,
        passingScore: data.passingScore,
        maxAttempts: data.maxAttempts != null && data.maxAttempts > 0 ? data.maxAttempts : null,
        shuffleQuestions: data.shuffleQuestions,
        shuffleOptions: data.shuffleOptions,
        showCorrectAnswer: data.showCorrectAnswer,
        isPublished: data.isPublished,
        questions: uploadedQuestions as CreateQuizQuestionDTO[],
      };

      await quizService.updateQuiz(id, quizData);
      toast.success('Quiz updated successfully');
      navigate(`/quizzes/${id}`);
    } catch (error) {
      console.error('Error updating quiz:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update quiz';
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
      if (Array.isArray(errors.questions)) {
        const optionError = errors.questions.find(
          (q: any) => q?.options?.root?.message ?? q?.options?.message
        );
        const message = optionError?.options?.root?.message ?? optionError?.options?.message;
        if (message) {
          toast.error(message);
          return;
        }
      }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading quiz details...</span>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Quiz not found
        </h2>
        <p className="text-gray-600 mb-4">
          The quiz you're looking for doesn't exist or has been deleted.
        </p>
        <Button onClick={() => navigate('/quizzes')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Quizzes
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Edit Quiz"
        subtitle={`Update quiz information, questions, and settings for "${quiz.title}"`}
        actions={
          <Button variant="outline" onClick={() => navigate(`/quizzes/${id}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Details
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
            <QuizForm
              mode="edit"
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
                    onClick={() => navigate(`/quizzes/${id}`)}
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
                    {isSubmitting ? 'Updating...' : 'Update & Publish'}
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

export default EditQuizPage;
