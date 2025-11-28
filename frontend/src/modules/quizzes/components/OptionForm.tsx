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
  const { control, watch } = useFormContext();
  const questionType = watch(`questions.${questionIndex}.questionType`);

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
      <div className="flex items-center justify-between">
        <FormLabel>Options</FormLabel>
        {questionType === 'MULTIPLE_CHOICE' && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ optionText: '', isCorrect: false, order: fields.length })}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Option
          </Button>
        )}
      </div>

      {fields.map((field, optionIndex) => (
        <div key={field.id} className="flex items-start gap-3 p-4 border rounded-lg">
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
              variant="ghost"
              size="icon"
              onClick={() => remove(optionIndex)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};

export default OptionForm;
