/**
 * Work Permit module barrel exports
 * Following the TRD.md module structure template
 */

// Pages
export { default as WorkPermitsPage } from './pages/WorkPermitsPage';
export { default as CreateWorkPermitPage } from './pages/CreateWorkPermitPage';
export { default as EditWorkPermitPage } from './pages/EditWorkPermitPage';
export { default as WorkPermitDetailPage } from './pages/WorkPermitDetailPage';
export { default as WorkClassificationsPage } from './pages/WorkClassificationsPage';
export { default as CreateWorkClassificationPage } from './pages/CreateWorkClassificationPage';
export { default as EditWorkClassificationPage } from './pages/EditWorkClassificationPage';
export { default as WorkClassificationDetailPage } from './pages/WorkClassificationDetailPage';

// Routes
export { default as workPermitRoutes } from './routes/workPermitRoutes';

// Services
export { default as workPermitService } from './services/workPermitService';
export type { CreateWorkPermitDTO, UpdateWorkPermitDTO } from './services/workPermitService';
export { default as workClassificationService } from './services/workClassificationService';

// Types
export type {
  WorkPermit,
  WorkPermitStatus,
  WorkPermitClassification,
  WorkPermitEmployee,
  WorkPermitWorker,
  WorkPermitHeavyEquipment,
  WorkPermitTool,
  WorkPermitMaterial,
  WorkPermitMachine,
  WorkPermitRequiredCourse,
  WorkPermitHazard,
  WorkPermitAttachment,
  WorkPermitSupervisor,
  WorkPermitHseOfficer,
  WorkPermitSafetyEquipment,
  WorkPermitSearchParams,
  ApprovalTimelineItem,
  MasterDataOption,
  WorkClassificationMasterOption,
  GuestOption,
  WorkPermitMasterData,
} from './types/work-permit.types';
export type {
  WorkClassification,
  WorkClassificationDTO,
  WorkClassificationAttachment,
  CreateWorkClassificationDTO,
  UpdateWorkClassificationDTO,
  WorkClassificationSearchParams,
} from './types/work-classification.types';

// Hooks
export { useWorkPermits, useWorkPermit, useWorkPermitActions } from './hooks/useWorkPermits';
export { useWorkClassifications, useWorkClassification } from './hooks/useWorkClassifications';

// Utils
export { getWorkPermitStatusColor, getWorkPermitStatusType } from './utils/statusColors';

// Section layout (PRD A–F)
export { WorkPermitSection, WorkPermitSubsectionTitle } from './components/WorkPermitSection';
