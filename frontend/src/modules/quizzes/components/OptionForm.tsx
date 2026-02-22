import { useEffect } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Checkbox } from '@/core/components/ui/checkbox';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/core/components/ui/form';
import { Trash2, Plus } from 'lucide-react';

interface OptionFormProps {
  questionIndex: number;
}

const OptionForm = ({ questionIndex }: OptionFormProps) => {
  const { control, watch, formState } = useFormContext();
  const questionType = watch(`questions.${questionIndex}.questionType`);
  const questionErrors = formState.errors.questions?.[questionIndex] as
    | { options?: { message?: string; root?: { message?: string } } }
    | undefined;
  const optionsError =
    questionErrors?.options?.root?.message ?? questionErrors?.options?.message;

  const { fields, append, remove } = useFieldArray({
    control,
    name: `questions.${questionIndex}.options`,
  });

  // Auto-create 2 options for TRUE_FALSE
  useEffect(() => {
    if (questionType === 'TRUE_FALSE' && fields.length === 0) {
      append({ optionText: 'True', isCorrect: false, order: 0 });
      append({ optionText: 'False', isCorrect: false, order: 1 });
    }
  }, [questionType, fields.length, append]);

  // Only show options for MULTIPLE_CHOICE and TRUE_FALSE
  if (questionType !== 'MULTIPLE_CHOICE' && questionType !== 'TRUE_FALSE') {
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between">
          <FormLabel className="text-base font-medium">Answer options</FormLabel>
          {questionType === 'MULTIPLE_CHOICE' && (
            <Button
              type="button"
              variant="default"
              onClick={() => append({ optionText: '', isCorrect: false, order: fields.length })}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Option
            </Button>
          )}
        </div>
        {questionType === 'MULTIPLE_CHOICE' && (
          <p className="text-sm text-muted-foreground mt-2">
            Add at least two options and mark the correct one(s).
          </p>
        )}
      </div>

      {optionsError && (
        <p className="text-sm text-destructive font-medium">{optionsError}</p>
      )}

      {questionType === 'MULTIPLE_CHOICE' && fields.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed border-muted-foreground/30 rounded-lg bg-muted/20 dark:bg-muted/10">
          <Plus className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No options yet — click <strong>Add Option</strong> to add answers.</p>
        </div>
      ) : (
        fields.map((field, optionIndex) => (
          <div key={field.id} className="flex items-start gap-3 p-4 border rounded-lg bg-muted/20 dark:bg-muted/10">
            <div className="flex-1 space-y-2">
              <FormField
                control={control}
                name={`questions.${questionIndex}.options.${optionIndex}.optionText`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Option text" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`questions.${questionIndex}.options.${optionIndex}.isCorrect`}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal">
                        Correct answer
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            {questionType === 'MULTIPLE_CHOICE' && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => remove(optionIndex)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remove
              </Button>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default OptionForm;
