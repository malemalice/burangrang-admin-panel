import { useFieldArray, useFormContext } from 'react-hook-form';
import { Button } from '@/core/components/ui/button';
import { Textarea } from '@/core/components/ui/textarea';
import { Input } from '@/core/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/core/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Trash2, Plus, Image as ImageIcon } from 'lucide-react';
import OptionForm from './OptionForm';
import { ImageUpload } from '@/modules/uploads';

interface QuestionFormProps {
  questionIndex: number;
  onRemove: () => void;
  onMediaFileSelect?: (file: File | null) => void;
}

const QuestionForm = ({ questionIndex, onRemove, onMediaFileSelect }: QuestionFormProps) => {
  const { control, watch, setValue } = useFormContext();
  const questionType = watch(`questions.${questionIndex}.questionType`);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Question {questionIndex + 1}</CardTitle>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name={`questions.${questionIndex}.questionType`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select question type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="MULTIPLE_CHOICE">Multiple Choice</SelectItem>
                  <SelectItem value="TRUE_FALSE">True/False</SelectItem>
                  <SelectItem value="ESSAY">Essay</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`questions.${questionIndex}.questionText`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question Text</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter your question here..."
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
          name={`questions.${questionIndex}.mediaUrl`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Media (Image/Video/Audio)</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <ImageUpload
                    value={field.value}
                    onChange={(url) => {
                      field.onChange(url);
                      // Determine mediaType from URL or file
                      if (url) {
                        // Try to determine from URL extension or file type
                        const urlLower = url.toLowerCase();
                        let mediaType = '';
                        if (urlLower.includes('.jpg') || urlLower.includes('.jpeg') || urlLower.includes('image/jpeg')) {
                          mediaType = 'image/jpeg';
                        } else if (urlLower.includes('.png') || urlLower.includes('image/png')) {
                          mediaType = 'image/png';
                        } else if (urlLower.includes('.gif') || urlLower.includes('image/gif')) {
                          mediaType = 'image/gif';
                        } else if (urlLower.includes('.webp') || urlLower.includes('image/webp')) {
                          mediaType = 'image/webp';
                        } else if (urlLower.includes('.mp4') || urlLower.includes('video/mp4')) {
                          mediaType = 'video/mp4';
                        } else if (urlLower.includes('.mp3') || urlLower.includes('audio/mpeg') || urlLower.includes('audio/mp3')) {
                          mediaType = 'audio/mpeg';
                        }
                        if (mediaType) {
                          setValue(`questions.${questionIndex}.mediaType`, mediaType);
                        }
                      } else {
                        setValue(`questions.${questionIndex}.mediaType`, '');
                      }
                    }}
                    onFileSelect={(file) => {
                      // Set mediaType when file is selected
                      if (file) {
                        setValue(`questions.${questionIndex}.mediaType`, file.type);
                      } else {
                        setValue(`questions.${questionIndex}.mediaType`, '');
                      }
                      // Call parent callback to store File object
                      if (onMediaFileSelect) {
                        onMediaFileSelect(file);
                      }
                    }}
                    categoryName="course-materials"
                    id={`file-upload-question-${questionIndex}`}
                    allowedTypes={[
                      'image/jpeg',
                      'image/png',
                      'image/gif',
                      'image/webp',
                      'video/mp4',
                      'audio/mpeg',
                      'audio/mp3',
                    ]}
                    placeholder="Upload file"
                    mediaType={watch(`questions.${questionIndex}.mediaType`)}
                  />
                  {field.value && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ImageIcon className="h-4 w-4" />
                      <span>{field.value}</span>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name={`questions.${questionIndex}.points`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Points</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name={`questions.${questionIndex}.order`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Order</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name={`questions.${questionIndex}.explanation`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Explanation (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Explanation shown after answering..."
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

        <OptionForm questionIndex={questionIndex} />
      </CardContent>
    </Card>
  );
};

export default QuestionForm;
