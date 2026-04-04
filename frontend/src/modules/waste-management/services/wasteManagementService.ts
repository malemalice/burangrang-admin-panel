import api from '@/core/lib/api';
import {
  TreatmentPlant, CreateTreatmentPlantData, UpdateTreatmentPlantData, TreatmentPlantFilters,
  WaterQualityParameter, CreateWaterQualityParameterData, UpdateWaterQualityParameterData, WaterQualityParameterFilters,
  WasteType, CreateWasteTypeData, UpdateWasteTypeData, WasteTypeFilters,
  WasteSource, CreateWasteSourceData, UpdateWasteSourceData, WasteSourceFilters,
  StorageLocation, CreateStorageLocationData, UpdateStorageLocationData, StorageLocationFilters,
  MonthlyFlowReport, CreateMonthlyFlowReportData, UpdateMonthlyFlowReportData, MonthlyFlowReportFilters,
  WaterQualityLabReport, CreateWaterQualityLabReportData, UpdateWaterQualityLabReportData, WaterQualityLabReportFilters,
  WeightReport, CreateWeightReportData, UpdateWeightReportData, WeightReportFilters,
  DispatchOrder, CreateDispatchOrderData, UpdateDispatchOrderData, DispatchOrderFilters,
  PaginatedResponse,
} from '../types/waste-management.types';

// Treatment Plants Service
export const treatmentPlantService = {
  getAll: (params?: TreatmentPlantFilters) => api.get<PaginatedResponse<TreatmentPlant>>('/treatment-plants', { params }),
  getById: (id: string) => api.get<TreatmentPlant>(`/treatment-plants/${id}`),
  create: (data: CreateTreatmentPlantData) => api.post<TreatmentPlant>('/treatment-plants', data),
  update: (id: string, data: UpdateTreatmentPlantData) => api.patch<TreatmentPlant>(`/treatment-plants/${id}`, data),
  delete: (id: string) => api.delete(`/treatment-plants/${id}`),
};

// Water Quality Parameters Service
export const waterQualityParameterService = {
  getAll: (params?: WaterQualityParameterFilters) => api.get<PaginatedResponse<WaterQualityParameter>>('/water-quality-parameters', { params }),
  getById: (id: string) => api.get<WaterQualityParameter>(`/water-quality-parameters/${id}`),
  create: (data: CreateWaterQualityParameterData) => api.post<WaterQualityParameter>('/water-quality-parameters', data),
  update: (id: string, data: UpdateWaterQualityParameterData) => api.patch<WaterQualityParameter>(`/water-quality-parameters/${id}`, data),
  delete: (id: string) => api.delete(`/water-quality-parameters/${id}`),
};

// Waste Types Service
export const wasteTypeService = {
  getAll: (params?: WasteTypeFilters) => api.get<PaginatedResponse<WasteType>>('/waste-types', { params }),
  getById: (id: string) => api.get<WasteType>(`/waste-types/${id}`),
  create: (data: CreateWasteTypeData) => api.post<WasteType>('/waste-types', data),
  update: (id: string, data: UpdateWasteTypeData) => api.patch<WasteType>(`/waste-types/${id}`, data),
  delete: (id: string) => api.delete(`/waste-types/${id}`),
};

// Waste Sources Service
export const wasteSourceService = {
  getAll: (params?: WasteSourceFilters) => api.get<PaginatedResponse<WasteSource>>('/waste-sources', { params }),
  getById: (id: string) => api.get<WasteSource>(`/waste-sources/${id}`),
  create: (data: CreateWasteSourceData) => api.post<WasteSource>('/waste-sources', data),
  update: (id: string, data: UpdateWasteSourceData) => api.patch<WasteSource>(`/waste-sources/${id}`, data),
  delete: (id: string) => api.delete(`/waste-sources/${id}`),
};

// Storage Locations Service
export const storageLocationService = {
  getAll: (params?: StorageLocationFilters) => api.get<PaginatedResponse<StorageLocation>>('/storage-locations', { params }),
  getById: (id: string) => api.get<StorageLocation>(`/storage-locations/${id}`),
  create: (data: CreateStorageLocationData) => api.post<StorageLocation>('/storage-locations', data),
  update: (id: string, data: UpdateStorageLocationData) => api.patch<StorageLocation>(`/storage-locations/${id}`, data),
  delete: (id: string) => api.delete(`/storage-locations/${id}`),
};

// Monthly Flow Reports Service
export const monthlyFlowReportService = {
  getAll: (params?: MonthlyFlowReportFilters) => api.get<PaginatedResponse<MonthlyFlowReport>>('/monthly-flow-reports', { params }),
  getById: (id: string) => api.get<MonthlyFlowReport>(`/monthly-flow-reports/${id}`),
  create: (data: CreateMonthlyFlowReportData) => api.post<MonthlyFlowReport>('/monthly-flow-reports', data),
  update: (id: string, data: UpdateMonthlyFlowReportData) => api.patch<MonthlyFlowReport>(`/monthly-flow-reports/${id}`, data),
  delete: (id: string) => api.delete(`/monthly-flow-reports/${id}`),
};

// Water Quality Lab Reports Service
export const waterQualityLabReportService = {
  getAll: (params?: WaterQualityLabReportFilters) => api.get<PaginatedResponse<WaterQualityLabReport>>('/water-quality-lab-reports', { params }),
  getById: (id: string) => api.get<WaterQualityLabReport>(`/water-quality-lab-reports/${id}`),
  create: (data: CreateWaterQualityLabReportData) => api.post<WaterQualityLabReport>('/water-quality-lab-reports', data),
  update: (id: string, data: UpdateWaterQualityLabReportData) => api.patch<WaterQualityLabReport>(`/water-quality-lab-reports/${id}`, data),
  delete: (id: string) => api.delete(`/water-quality-lab-reports/${id}`),
};

// Weight Reports Service
export const weightReportService = {
  getAll: (params?: WeightReportFilters) => api.get<PaginatedResponse<WeightReport>>('/weight-reports', { params }),
  getById: (id: string) => api.get<WeightReport>(`/weight-reports/${id}`),
  create: (data: CreateWeightReportData) => api.post<WeightReport>('/weight-reports', data),
  update: (id: string, data: UpdateWeightReportData) => api.patch<WeightReport>(`/weight-reports/${id}`, data),
  delete: (id: string) => api.delete(`/weight-reports/${id}`),
  submit: (id: string) => api.patch<WeightReport>(`/weight-reports/${id}/submit`),
  requestApproval: (id: string) => api.patch<WeightReport>(`/weight-reports/${id}/request-approval`),
};

// Dispatch Orders Service
export const dispatchOrderService = {
  getAll: (params?: DispatchOrderFilters) => api.get<PaginatedResponse<DispatchOrder>>('/dispatch-orders', { params }),
  getById: (id: string) => api.get<DispatchOrder>(`/dispatch-orders/${id}`),
  create: (data: CreateDispatchOrderData) => api.post<DispatchOrder>('/dispatch-orders', data),
  update: (id: string, data: UpdateDispatchOrderData) => api.patch<DispatchOrder>(`/dispatch-orders/${id}`, data),
  delete: (id: string) => api.delete(`/dispatch-orders/${id}`),
};
