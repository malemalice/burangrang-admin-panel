/**
 * Work Permit module barrel exports
 * Following the TRD.md module structure template
 */

// Pages
export { default as WorkPermitsPage } from './pages/WorkPermitsPage';
export { default as CreateWorkPermitPage } from './pages/CreateWorkPermitPage';
export { default as EditWorkPermitPage } from './pages/EditWorkPermitPage';
export { default as WorkPermitDetailPage } from './pages/WorkPermitDetailPage';

// Routes
export { default as workPermitRoutes } from './routes/workPermitRoutes';

// Services
export { default as workPermitService } from './services/workPermitService';
export type { CreateWorkPermitDTO, UpdateWorkPermitDTO } from './services/workPermitService';

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
  WorkPermitProfession,
  WorkPermitRequiredCourse,
  WorkPermitHazard,
  WorkPermitAttachment,
  WorkPermitSupervisor,
  WorkPermitHseOfficer,
  WorkPermitSafetyEquipment,
  WorkPermitSearchParams,
  ApprovalTimelineItem,
  MasterDataOption,
  GuestOption,
  WorkPermitMasterData,
} from './types/work-permit.types';

// Hooks
export { useWorkPermits, useWorkPermit, useWorkPermitActions } from './hooks/useWorkPermits';

// Utils
export { getWorkPermitStatusColor, getWorkPermitStatusType } from './utils/statusColors';
