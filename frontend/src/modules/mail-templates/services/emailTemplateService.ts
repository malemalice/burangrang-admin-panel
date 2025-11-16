import api from '@/core/lib/api';
import {
  EmailTemplate,
  EmailTemplateDTO,
  PaginatedResponse,
  PaginationParams,
  CreateEmailTemplateDTO,
  UpdateEmailTemplateDTO,
} from '../types/email-template.types';

// DTO -> Model
const mapEmailTemplateDtoToModel = (dto: EmailTemplateDTO): EmailTemplate => {
  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    subject: dto.subjectTemplate,
    body: dto.bodyTemplate,
    status: dto.isActive ? 'active' : 'inactive',
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
};

// Model -> Update DTO
const mapModelToUpdateDto = (model: Partial<EmailTemplate>): UpdateEmailTemplateDTO => {
  return {
    name: model.name,
    subjectTemplate: model.subject,
    bodyTemplate: model.body,
    isActive: model.status ? model.status === 'active' : undefined,
  };
};

const emailTemplateService = {
  // GET all templates with pagination and filters
  getEmailTemplates: async (params: PaginationParams): Promise<PaginatedResponse<EmailTemplate>> => {
    try {
      const queryParams = new URLSearchParams({
        page: params.page.toString(),
        limit: params.limit.toString(),
      });

      if (params.sortBy) {
        queryParams.append('sortBy', params.sortBy);
        queryParams.append('sortOrder', params.sortOrder || 'asc');
      }
      if (params.search) {
        queryParams.append('search', params.search);
      }
      if (params.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, String(value));
          }
        });
      }

      const response = await api.get(`/mail/templates?${queryParams.toString()}`);
      return {
        data: response.data.data.map(mapEmailTemplateDtoToModel),
        meta: response.data.meta,
      };
    } catch (error) {
      console.error('Error fetching email templates:', error);
      throw error;
    }
  },

  // GET single template
  getEmailTemplateById: async (id: string): Promise<EmailTemplate> => {
    try {
      const response = await api.get(`/mail/templates/${id}`);
      return mapEmailTemplateDtoToModel(response.data as EmailTemplateDTO);
    } catch (error) {
      console.error(`Error fetching email template ${id}:`, error);
      throw error;
    }
  },

  // CREATE template
  createEmailTemplate: async (data: CreateEmailTemplateDTO): Promise<EmailTemplate> => {
    try {
      const response = await api.post('/mail/templates', data);
      return mapEmailTemplateDtoToModel(response.data as EmailTemplateDTO);
    } catch (error: any) {
      console.error('Error creating email template:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create email template';
      throw new Error(errorMessage);
    }
  },

  // UPDATE template
  updateEmailTemplate: async (id: string, data: UpdateEmailTemplateDTO): Promise<EmailTemplate> => {
    try {
      const response = await api.patch(`/mail/templates/${id}`, data);
      return mapEmailTemplateDtoToModel(response.data as EmailTemplateDTO);
    } catch (error: any) {
      console.error(`Error updating email template ${id}:`, error);
      const errorMessage = error.response?.data?.message || 'Failed to update email template';
      throw new Error(errorMessage);
    }
  },

  // TOGGLE active state
  toggleEmailTemplate: async (id: string): Promise<EmailTemplate> => {
    try {
      const response = await api.patch(`/mail/templates/${id}/toggle`);
      return mapEmailTemplateDtoToModel(response.data as EmailTemplateDTO);
    } catch (error: any) {
      console.error(`Error toggling email template ${id}:`, error);
      const errorMessage = error.response?.data?.message || 'Failed to toggle email template';
      throw new Error(errorMessage);
    }
  },

  // DELETE template
  deleteEmailTemplate: async (id: string): Promise<void> => {
    try {
      await api.delete(`/mail/templates/${id}`);
    } catch (error: any) {
      console.error(`Error deleting email template ${id}:`, error);
      const errorMessage = error.response?.data?.message || 'Failed to delete email template';
      throw new Error(errorMessage);
    }
  },
};

export default emailTemplateService;


