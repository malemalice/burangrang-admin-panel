import type { LucideIcon } from 'lucide-react';
import {
  Award,
  Bell,
  Droplet,
  FlaskConical,
  Scale,
  Thermometer,
} from 'lucide-react';

export interface EntityRegistryEntry {
  label: string;
  icon: LucideIcon;
  /**
   * How to deep-link this entity in the frontend.
   *   - `recordRoute`: route template for a specific record. `{entityId}` is replaced.
   *   - `listRoute`: route for the module's list page (used when no entityId).
   *   - `subjectQueryKey`: when a subject is set and no entityId, append `?key=subjectId`
   *     to listRoute so the list pre-filters by the subject.
   */
  recordRoute?: string;
  listRoute: string;
  subjectQueryKey?: Partial<Record<string, string>>;
}

export const ENTITY_REGISTRY: Record<string, EntityRegistryEntry> = {
  'monthly-flow-reports': {
    label: 'Monthly Flow Report',
    icon: Droplet,
    listRoute: '/waste-management/monthly-flow-reports',
    recordRoute: '/waste-management/monthly-flow-reports/{entityId}',
    subjectQueryKey: { 'treatment-plant': 'treatmentPlantId' },
  },
  'water-quality-lab-reports': {
    label: 'Water Quality Lab Report',
    icon: FlaskConical,
    listRoute: '/waste-management/water-quality-lab-reports',
    recordRoute: '/waste-management/water-quality-lab-reports/{entityId}',
    subjectQueryKey: { 'treatment-plant': 'treatmentPlantId' },
  },
  'weight-reports': {
    label: 'Weight Report',
    icon: Scale,
    listRoute: '/waste-management/weight-reports',
    recordRoute: '/waste-management/weight-reports/{entityId}',
    subjectQueryKey: { 'treatment-plant': 'treatmentPlantId' },
  },
  'environmental-measurements': {
    label: 'Environmental Measurement',
    icon: Thermometer,
    listRoute: '/environmental-measurements',
    recordRoute: '/environmental-measurements/{entityId}',
    subjectQueryKey: { room: 'roomId' },
  },
  't_certificates': {
    label: 'Certificate',
    icon: Award,
    listRoute: '/certificates',
    recordRoute: '/certificates/{entityId}',
  },
};

export const FALLBACK_ENTRY: EntityRegistryEntry = {
  label: 'Reminder',
  icon: Bell,
  listRoute: '/reminders',
};

export function getEntityEntry(entity: string | undefined): EntityRegistryEntry {
  if (!entity) return FALLBACK_ENTRY;
  return ENTITY_REGISTRY[entity] ?? FALLBACK_ENTRY;
}
