/**
 * Waste Management module barrel exports
 */

// Routes
export { default as wasteManagementRoutes } from './routes/wasteManagementRoutes';

// Services
export {
  treatmentPlantService,
  waterQualityParameterService,
  wasteTypeService,
  wasteSourceService,
  storageLocationService,
  monthlyFlowReportService,
  waterQualityLabReportService,
  weightReportService,
  dispatchOrderService,
} from './services/wasteManagementService';

// Types
export type {
  // Common
  PaginatedResponse,
  PaginationParams,
  
  // Enums
  WasteTypeEnum,
  ReportStatusEnum,
  MonthEnum,
  GeneralStatusEnum,
  
  // Treatment Plant
  TreatmentPlant,
  CreateTreatmentPlantData,
  UpdateTreatmentPlantData,
  TreatmentPlantFilters,
  
  // Water Quality Parameter
  WaterQualityParameter,
  CreateWaterQualityParameterData,
  UpdateWaterQualityParameterData,
  WaterQualityParameterFilters,
  
  // Waste Type
  WasteType,
  CreateWasteTypeData,
  UpdateWasteTypeData,
  WasteTypeFilters,
  
  // Waste Source
  WasteSource,
  CreateWasteSourceData,
  UpdateWasteSourceData,
  WasteSourceFilters,
  
  // Storage Location
  StorageLocation,
  CreateStorageLocationData,
  UpdateStorageLocationData,
  StorageLocationFilters,
  
  // Monthly Flow Report
  MonthlyFlowReport,
  CreateMonthlyFlowReportData,
  UpdateMonthlyFlowReportData,
  MonthlyFlowReportFilters,
  
  // Water Quality Lab Report
  WaterQualityLabReport,
  CreateWaterQualityLabReportData,
  UpdateWaterQualityLabReportData,
  WaterQualityLabReportFilters,
  
  // Weight Report
  WeightReport,
  WeightReportItem,
  CreateWeightReportData,
  CreateWeightReportItemData,
  UpdateWeightReportData,
  WeightReportFilters,
  
  // Dispatch Order
  DispatchOrder,
  CreateDispatchOrderData,
  UpdateDispatchOrderData,
  DispatchOrderFilters,
} from './types/waste-management.types';
