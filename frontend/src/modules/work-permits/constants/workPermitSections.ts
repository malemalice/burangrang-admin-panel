/** PRD Section A–F labels (BSJ/F.5/H&S Policy 05 — digital work permit). */
export const WORK_PERMIT_SECTIONS = {
  A: 'A. Work Classification',
  B: 'B. Work and Personnel Data',
  C: 'C. Material, Tools and Equipment',
  D: 'D. Occupational Health & Safety',
  E: 'E. Safety Equipment',
  F: 'F. VALIDASI & EVALUASI IJIN KERJA / VALIDATION & EVALUATION OF PERMIT',
} as const;

/** Subsection titles under Section A. */
export const WORK_PERMIT_SECTION_A_SUB = {
  classifications: 'Classifications',
} as const;

/** Subsection titles used under Section B (same PRD block). */
export const WORK_PERMIT_SECTION_B_SUB = {
  projectSchedule: 'Project and schedule',
  workDescription: 'Work description',
  workers: 'Workers',
  employees: 'Employees',
  professions: 'Professions',
  supervisors: 'Supervisors',
  hseOfficers: 'HSE officers',
} as const;

/** Subsection titles under Section C (PRD order: Tools → Machines → Materials → Heavy Equipment). */
export const WORK_PERMIT_SECTION_C_SUB = {
  tools: 'Tools',
  machines: 'Machines',
  materials: 'Materials',
  heavyEquipment: 'Heavy equipment',
} as const;

/** Subsection titles under Section D / E (single-card blocks). */
export const WORK_PERMIT_SECTION_D_SUB = {
  hazards: 'Hazards',
} as const;

export const WORK_PERMIT_SECTION_E_SUB = {
  selectedEquipment: 'Selected equipment',
} as const;

/** Subsection titles under Section F (PRD blocks + app-specific). */
export const WORK_PERMIT_SECTION_F_SUB = {
  initialPermitGrant: 'Initial permit grant',
  permitExtension: 'Permit extension',
  approvalTimeline: 'Approval timeline',
  workResultVerification: 'Work result verification',
  courseVerification: 'Course verification',
  requiredCourses: 'Required courses',
  attachments: 'Attachments',
} as const;
