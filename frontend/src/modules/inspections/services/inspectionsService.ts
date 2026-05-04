import { Inspection, CreateInspectionDTO, UpdateInspectionDTO, CreateInspectionItemDTO, UpdateInspectionItemDTO, CreateInspectionImageDTO, UpdateInspectionImageDTO, CreateInspectionInspectorDTO, UpdateInspectionInspectorDTO, InspectionItem, InspectionImage, InspectionInspector, InspectionChecklistResult } from '../types/inspection.types';
import { PaginatedResponse, PaginationParams } from '@/core/lib/types';
import api from '@/core/lib/api';

const inspectionsService = {
  getAll: async (params: PaginationParams & {
    search?: string;
    code?: string;
    isActive?: boolean;
    areaId?: string;
    status?: string;
  }): Promise<PaginatedResponse<Inspection>> => {
    const response = await api.get('/inspections', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Inspection> => {
    const response = await api.get(`/inspections/${id}`);
    return response.data;
  },

  create: async (data: CreateInspectionDTO): Promise<Inspection> => {
    const response = await api.post('/inspections', data);
    return response.data;
  },

  update: async (id: string, data: UpdateInspectionDTO): Promise<Inspection> => {
    const response = await api.patch(`/inspections/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/inspections/${id}`);
  },

  // Inspection Items endpoints
  getItems: async (inspectionId: string, params: PaginationParams): Promise<PaginatedResponse<InspectionItem>> => {
    const response = await api.get(`/inspections/${inspectionId}/items`, { params });
    return response.data;
  },

  getItemById: async (inspectionId: string, itemId: string): Promise<InspectionItem> => {
    const response = await api.get(`/inspections/${inspectionId}/items/${itemId}`);
    return response.data;
  },

  createItem: async (inspectionId: string, data: CreateInspectionItemDTO): Promise<InspectionItem> => {
    const response = await api.post(`/inspections/${inspectionId}/items`, data);
    return response.data;
  },

  updateItem: async (inspectionId: string, itemId: string, data: UpdateInspectionItemDTO): Promise<InspectionItem> => {
    const response = await api.patch(`/inspections/${inspectionId}/items/${itemId}`, data);
    return response.data;
  },

  deleteItem: async (inspectionId: string, itemId: string): Promise<void> => {
    await api.delete(`/inspections/${inspectionId}/items/${itemId}`);
  },

  // Inspection Images endpoints
  getImages: async (inspectionId: string, itemId: string): Promise<InspectionImage[]> => {
    const response = await api.get(`/inspections/${inspectionId}/items/${itemId}/images`);
    return response.data;
  },

  getImageById: async (inspectionId: string, itemId: string, imageId: string): Promise<InspectionImage> => {
    const response = await api.get(`/inspections/${inspectionId}/items/${itemId}/images/${imageId}`);
    return response.data;
  },

  createImage: async (inspectionId: string, itemId: string, data: CreateInspectionImageDTO): Promise<InspectionImage> => {
    const response = await api.post(`/inspections/${inspectionId}/items/${itemId}/images`, data);
    return response.data;
  },

  updateImage: async (inspectionId: string, itemId: string, imageId: string, data: UpdateInspectionImageDTO): Promise<InspectionImage> => {
    const response = await api.patch(`/inspections/${inspectionId}/items/${itemId}/images/${imageId}`, data);
    return response.data;
  },

  deleteImage: async (inspectionId: string, itemId: string, imageId: string): Promise<void> => {
    await api.delete(`/inspections/${inspectionId}/items/${itemId}/images/${imageId}`);
  },

  // Inspection Inspectors endpoints
  getInspectors: async (inspectionId: string): Promise<InspectionInspector[]> => {
    const response = await api.get(`/inspections/${inspectionId}/inspectors`);
    return response.data;
  },

  getInspectorById: async (inspectionId: string, inspectorId: string): Promise<InspectionInspector> => {
    const response = await api.get(`/inspections/${inspectionId}/inspectors/${inspectorId}`);
    return response.data;
  },

  createInspector: async (inspectionId: string, data: CreateInspectionInspectorDTO): Promise<InspectionInspector> => {
    const response = await api.post(`/inspections/${inspectionId}/inspectors`, data);
    return response.data;
  },

  updateInspector: async (inspectionId: string, inspectorId: string, data: UpdateInspectionInspectorDTO): Promise<InspectionInspector> => {
    const response = await api.patch(`/inspections/${inspectionId}/inspectors/${inspectorId}`, data);
    return response.data;
  },

  deleteInspector: async (inspectionId: string, inspectorId: string): Promise<void> => {
    await api.delete(`/inspections/${inspectionId}/inspectors/${inspectorId}`);
  },
};

export default inspectionsService;

