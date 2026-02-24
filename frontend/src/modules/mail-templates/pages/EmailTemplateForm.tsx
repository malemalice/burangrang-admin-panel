import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/core/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/core/components/ui/form';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import emailTemplateService from '../services/emailTemplateService';
import { CreateEmailTemplateDTO, UpdateEmailTemplateDTO, EmailTemplate } from '../types/email-template.types';
import { Switch } from '@/core/components/ui/switch';

const formSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface EmailTemplateFormProps {
  template?: EmailTemplate | null;
  mode: 'create' | 'edit';
}

const EmailTemplateForm = ({ template, mode }: EmailTemplateFormProps) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      name: '',
      subject: '',
      body: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (template) {
      form.reset({
        code: template.code,
        name: template.name,
        subject: template.subject,
        body: template.body,
        isActive: template.status === 'active',
      });
    }
  }, [template]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      if (mode === 'create') {
        const payload: CreateEmailTemplateDTO = {
          code: data.code,
          name: data.name,
          subjectTemplate: data.subject,
          bodyTemplate: data.body,
          isActive: data.isActive,
        };
        await emailTemplateService.createEmailTemplate(payload);
        toast.success('Email template created successfully');
      } else if (template) {
        const payload: UpdateEmailTemplateDTO = {
          name: data.name,
          subjectTemplate: data.subject,
          bodyTemplate: data.body,
          isActive: data.isActive,
        };
        await emailTemplateService.updateEmailTemplate(template.id, payload);
        toast.success('Email template updated successfully');
      }
      navigate('/mail-templates');
    } catch (error: any) {
      console.error('Error saving template:', error);
      const message = error?.message || `Failed to ${mode} template`;
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Create' : 'Edit'} Email Template</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="unique_code" {...field} disabled={mode === 'edit'} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Template name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Email subject (supports handlebars)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Body <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Textarea placeholder="Email body (supports handlebars)" className="min-h-[200px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => navigate('/mail-templates')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {mode === 'create' ? 'Create' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default EmailTemplateForm;


