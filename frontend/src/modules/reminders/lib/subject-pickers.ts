/**
 * Pre-built `SubjectPickerConfig`s for use by module list pages that host a `RemindersSection`.
 *
 * Each picker pairs a `subjectType` string (persisted on the reminder) with an async loader
 * that returns selectable subjects. Adding a new pairing here makes that subject reusable
 * across any module that wants to file reminders under it.
 */
import { treatmentPlantService } from '@/modules/waste-management/services/wasteManagementService';
import roomService from '@/modules/master-data/services/roomService';
import type { SubjectPickerConfig } from '../components/reminders-section/RemindersSection';

export const treatmentPlantSubjectPicker: SubjectPickerConfig = {
  subjectType: 'treatment-plant',
  label: 'Treatment plant',
  async resolveOptions() {
    const res = await treatmentPlantService.getAll({ isActive: true, limit: 200 } as any);
    const list: any[] = (res as any)?.data?.data ?? (res as any)?.data ?? [];
    return list.map((p: any) => ({
      value: p.id,
      label: p.code ? `${p.code} — ${p.name}` : p.name,
    }));
  },
};

export const roomSubjectPicker: SubjectPickerConfig = {
  subjectType: 'room',
  label: 'Room',
  async resolveOptions() {
    const res = await roomService.getRooms({ isActive: true, limit: 200, options: true });
    return res.data.map((r) => ({
      value: r.id,
      label: r.code ? `${r.code} — ${r.name}` : r.name,
    }));
  },
};
