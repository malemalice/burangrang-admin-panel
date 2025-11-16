import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import emailTemplateService from '../services/emailTemplateService';
import {
  EmailTemplate,
  PaginatedResponse,
  EmailTemplateSearchParams,
  CreateEmailTemplateDTO,
  UpdateEmailTemplateDTO,
} from '../types/email-template.types';

export const useEmailTemplates = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [totalTemplates, setTotalTemplates] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmailTemplates = async (params: EmailTemplateSearchParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response: PaginatedResponse<EmailTemplate> = await emailTemplateService.getEmailTemplates(params);
      setTemplates(response.data);
      setTotalTemplates(response.meta.total);
      setCurrentPage(params.page);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch email templates';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const createEmailTemplate = async (data: CreateEmailTemplateDTO) => {
    try {
      const created = await emailTemplateService.createEmailTemplate(data);
      setTemplates(prev => [created, ...prev]);
      setTotalTemplates(prev => prev + 1);
      toast.success('Email template created successfully');
      return created;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create email template';
      toast.error(errorMessage);
      throw err;
    }
  };

  const updateEmailTemplate = async (id: string, data: UpdateEmailTemplateDTO) => {
    try {
      const updated = await emailTemplateService.updateEmailTemplate(id, data);
      setTemplates(prev => prev.map(t => (t.id === id ? updated : t)));
      toast.success('Email template updated successfully');
      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update email template';
      toast.error(errorMessage);
      throw err;
    }
  };

  const toggleEmailTemplate = async (id: string) => {
    try {
      const toggled = await emailTemplateService.toggleEmailTemplate(id);
      setTemplates(prev => prev.map(t => (t.id === id ? toggled : t)));
      toast.success(`Template ${toggled.status === 'active' ? 'activated' : 'deactivated'}`);
      return toggled;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle email template';
      toast.error(errorMessage);
      throw err;
    }
  };

  const deleteEmailTemplate = async (id: string) => {
    try {
      await emailTemplateService.deleteEmailTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
      setTotalTemplates(prev => prev - 1);
      toast.success('Email template deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete email template';
      toast.error(errorMessage);
      throw err;
    }
  };

  return {
    templates,
    totalTemplates,
    currentPage,
    isLoading,
    error,
    fetchEmailTemplates,
    createEmailTemplate,
    updateEmailTemplate,
    toggleEmailTemplate,
    deleteEmailTemplate,
  };
};

export const useEmailTemplate = (id: string | null = null) => {
  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmailTemplate = async (templateId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await emailTemplateService.getEmailTemplateById(templateId);
      setTemplate(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch email template';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchEmailTemplate(id);
    }
  }, [id]);

  return {
    template,
    isLoading,
    error,
    fetchEmailTemplate,
    setTemplate,
  };
};


