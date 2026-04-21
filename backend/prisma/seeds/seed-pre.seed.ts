import { PrismaClient } from '@prisma/client';

/**
 * Legacy reference data formerly in `backend/seed-pre.md`.
 *
 * - Professions: implemented as Prisma upserts (used by work permit master seed).
 * - Work classifications: kept as SQL comments only — canonical codes live in
 *   `work-classifications.seed.ts` (HW, ELEC, OTHERS, …) and tie into risk templates.
 *   The SQL below used alternate code sets (e.g. HOT_WORK vs HW); do not paste blindly.
 * - `safety_items_master` / `violations_master`: no matching Prisma models in this repo;
 *   raw SQL kept in comments for manual / future use.
 */

const PROFESSION_ROWS: Array<{ code: string; name: string; description?: string }> = [
  { code: 'ENGINEER', name: 'Engineer', description: 'Site/Project engineer' },
  { code: 'SURVEYOR', name: 'Surveyor', description: 'Area surveyor' },
  { code: 'PIC_BSJ', name: 'PIC BSJ', description: 'PIC BSJ (on-site contact)' },
  {
    code: 'HEAVY_EQUIPMENT_OPERATOR',
    name: 'Heavy Equipment Operator',
    description: 'Heavy equipment operator',
  },
  { code: 'RIGGER', name: 'Rigger', description: 'Rigger' },
  { code: 'ELECTRIC_TECH', name: 'Electric Technician', description: 'Electric Technician' },
  { code: 'MECHANIC', name: 'Mechanic', description: 'Mechanic' },
  { code: 'VENDOR_SUPERVISOR', name: 'Vendor Supervisor', description: 'Vendor Supervisor' },
  { code: 'VENDOR_HSE', name: 'Vendor HSE Personnel', description: 'Vendor HSE Personnel' },
  { code: 'BSJ_HSE_OFFICER', name: 'BSJ HSE Officer', description: 'BSJ HSE Officer' },
  { code: 'CIVIL_WORKER', name: 'Civil Worker', description: 'Civil worker' },
  { code: 'CARPENTER', name: 'Carpenter', description: 'Carpenter' },
  { code: 'WELDER', name: 'Welder', description: 'Welder' },
  { code: 'FITTER', name: 'Fitter', description: 'Fitter' },
  { code: 'HELPER', name: 'Helper', description: 'Helper' },
  { code: 'OTHER', name: 'Other', description: 'Other' },
  // Kept from earlier work-permits seed for sample data compatibility (distinct codes)
  { code: 'ELEC-TECH', name: 'Electrician', description: 'Electrical technician' },
  { code: 'PLUMBER', name: 'Plumber', description: 'Plumbing specialist' },
  { code: 'CRANE-OP', name: 'Crane Operator', description: 'Crane operation specialist' },
  { code: 'SAFETY', name: 'Safety Officer', description: 'Safety and health officer' },
  { code: 'SUPER', name: 'Supervisor', description: 'Work supervisor' },
];

export async function seedPreProfessions(prisma: PrismaClient) {
  console.log('🌱 Seeding professions (legacy seed-pre list + work-permit samples)...');

  for (const row of PROFESSION_ROWS) {
    await prisma.profession.upsert({
      where: { code: row.code },
      update: { name: row.name, description: row.description ?? null },
      create: {
        code: row.code,
        name: row.name,
        description: row.description ?? null,
      },
    });
  }

  console.log(`✅ Upserted ${PROFESSION_ROWS.length} professions`);
}

/*
 * --- Reference only: work classifications (not applied; conflicts with seedWorkClassifications) ---
 *
 * INSERT INTO m_work_classification (code, name, description) VALUES
 * ('HOT_WORK', 'Hot Work', 'Welding, cutting, grinding, uses open flame or heat.'),
 * ...
 *
 * INSERT INTO m_work_classification (code, name, description, created_at) VALUES
 * ('GENERAL_WORKS', 'GENERAL WORKS', '...'),
 * ...
 *
 * --- Reference only: tables not in Prisma schema ---
 *
 * INSERT INTO safety_items_master (code, name, category, description) VALUES ...
 * INSERT INTO violations_master (code, title, severity, description) VALUES ...
 */
