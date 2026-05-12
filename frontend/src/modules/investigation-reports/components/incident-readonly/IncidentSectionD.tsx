import { Label } from '@/core/components/ui/label';
import {
  TreatmentEnum,
  AbsenceEnum,
  type Incident,
} from '@/modules/incidents/types/incident.types';
import SectionShell, { type SectionVariant } from './SectionShell';
import { PdfRow } from './pdf-shared';

interface Props {
  incident: Incident;
  variant?: SectionVariant;
}

const TREATMENT_LABEL: Record<TreatmentEnum, string> = {
  [TreatmentEnum.NOT_SPECIFIED]: 'Not Specified',
  [TreatmentEnum.NO_TREATMENT]: 'None / Tidak ada',
  [TreatmentEnum.SELF]: 'Self / Sendiri',
  [TreatmentEnum.FIRST_AID]: 'First Aider / P3K',
  [TreatmentEnum.MEDICAL_TREATMENT]: 'Medical Treatment / Pengobatan medis',
  [TreatmentEnum.HEALTH_SERVICES]: 'Health Services (outpatient) / Pelayanan Kesehatan',
  [TreatmentEnum.HOSPITALIZATION]: 'Hospital (inpatient) / Rawat Inap',
  [TreatmentEnum.OTHER]: 'Others / Lainnya',
};

const ABSENCE_LABEL: Record<AbsenceEnum, string> = {
  [AbsenceEnum.NOT_SPECIFIED]: 'Not Specified',
  [AbsenceEnum.RETURNED_AFTER_TREATMENT]:
    'Returned to work/studies / Kembali bekerja setelah diberi tindakan',
  [AbsenceEnum.MORE_THAN_THREE_DAYS]: 'Likely more than 3 days / Lebih dari 3 hari',
  [AbsenceEnum.NOT_YET_KNOWN]: 'Not yet known / Belum diketahui',
};

const IncidentSectionD = ({ incident, variant = 'card' }: Props) => {
  const treatment = TREATMENT_LABEL[incident.treatment] ?? incident.treatment;
  const absence = ABSENCE_LABEL[incident.absence] ?? incident.absence;
  const description = incident.treatmentDescription ?? '—';

  if (variant === 'pdf') {
    return (
      <SectionShell
        variant="pdf"
        title="D. Action Following Incident / Tindakan yang dilakukan"
      >
        <table
          style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}
        >
          <tbody>
            <PdfRow label="D1. Treatment / Penanganan" value={treatment} />
            <PdfRow label="D2. Absence / Absen" value={absence} />
            <PdfRow
              label="D3. Treatment Description / Penanganan yang dilakukan"
              value={description}
            />
          </tbody>
        </table>
      </SectionShell>
    );
  }

  return (
    <SectionShell
      variant={variant}
      title="D. Action Following Incident / Tindakan yang dilakukan"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <KV label="D1. Treatment / Penanganan" value={treatment} />
        <KV label="D2. Absence / Absen" value={absence} />
        <div className="md:col-span-2">
          <Label className="text-muted-foreground">
            D3. Treatment Description / Jelaskan penanganan yang dilakukan
          </Label>
          <p className="text-sm whitespace-pre-line">{description}</p>
        </div>
      </div>
    </SectionShell>
  );
};

const KV = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <Label className="text-muted-foreground">{label}</Label>
    <p className="text-sm">{value}</p>
  </div>
);

export default IncidentSectionD;
