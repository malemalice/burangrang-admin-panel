/**
 * Inspections Module
 * 
 * This module handles inspection recording and management,
 * including creation, editing, and tracking of inspections
 * with associated inspection items, images, and inspectors.
 */

export * from './pages';
export { default as InspectionForm } from './components/InspectionForm';
export { default as inspectionsService } from './services/inspectionsService';
export type { 
  Inspection, 
  InspectionItem, 
  InspectionImage, 
  InspectionInspector,
  CreateInspectionDTO, 
  UpdateInspectionDTO 
} from './types/inspection.types';
export { default as inspectionsRoutes } from './routes/inspectionsRoutes';

