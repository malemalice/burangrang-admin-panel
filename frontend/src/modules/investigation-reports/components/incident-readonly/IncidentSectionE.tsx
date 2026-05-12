import { Label } from '@/core/components/ui/label';
import {
  StopActivityEnum,
  type Incident,
} from '@/modules/incidents/types/incident.types';
import SectionShell, { type SectionVariant } from './SectionShell';
import { PdfRow } from './pdf-shared';

interface Props {
  incident: Incident;
  variant?: SectionVariant;
}

const STOP_LABEL: Record<StopActivityEnum, string> = {
  [StopActivityEnum.NOT_SPECIFIED]: 'Not Specified',
  [StopActivityEnum.YES]: 'Yes / Ya',
  [StopActivityEnum.NO]: 'No / Tidak',
};

const checkbox = (checked: boolean) => (checked ? '☒' : '☐');

const SUB_OPTIONS: { key: 'stopLocally' | 'stopWholeSchool'; en: string; id: string }[] = [
  {
    key: 'stopLocally',
    en: 'Stop activity locally related to the accident/incident/nearmiss',
    id: 'Hentikan aktivitas terkait kecelakaan/insiden/nearmiss',
  },
  {
    key: 'stopWholeSchool',
    en: 'Stop the whole school activities',
    id: 'Hentikan seluruh kegiatan sekolah',
  },
];

const IncidentSectionE = ({ incident, variant = 'card' }: Props) => {
  const need = STOP_LABEL[incident.needToStopActivity] ?? incident.needToStopActivity;
  const isYes = incident.needToStopActivity === StopActivityEnum.YES;
  const stopLocally = incident.stopLocally ?? false;
  const stopWholeSchool = incident.stopWholeSchool ?? false;
  const legacyDesc = incident.stopActivityDescription?.trim();
  const showLegacy = isYes && !stopLocally && !stopWholeSchool && !!legacyDesc;

  if (variant === 'pdf') {
    return (
      <SectionShell
        variant="pdf"
        title="E. Need to Stop Activity / Perlu menghentikan aktivitas"
      >
        <table
          style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}
        >
          <tbody>
            <PdfRow label="Need to Stop Activity" value={need} />
            {isYes && (
              <tr>
                <td style={{ padding: '4px 8px', fontWeight: 600, width: '30%', verticalAlign: 'top' }}>
                  If Yes / Jika Ya
                </td>
                <td style={{ padding: '4px 8px' }}>
                  {SUB_OPTIONS.map((opt) => (
                    <div key={opt.key}>
                      {checkbox(opt.key === 'stopLocally' ? stopLocally : stopWholeSchool)}{' '}
                      {opt.en} ({opt.id})
                    </div>
                  ))}
                  {showLegacy && (
                    <div style={{ marginTop: 4, fontStyle: 'italic' }}>{legacyDesc}</div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </SectionShell>
    );
  }

  return (
    <SectionShell
      variant={variant}
      title="E. Need to Stop Activity / Perlu menghentikan aktivitas"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <KV label="Need to Stop Activity" value={need} />
        {isYes && (
          <div className="md:col-span-2">
            <Label className="text-muted-foreground">If Yes / Jika Ya</Label>
            <ul className="mt-1 space-y-1">
              {SUB_OPTIONS.map((opt) => {
                const checked = opt.key === 'stopLocally' ? stopLocally : stopWholeSchool;
                return (
                  <li key={opt.key} className="flex items-start gap-2">
                    <span aria-hidden>{checkbox(checked)}</span>
                    <span>
                      {opt.en}
                      <span className="block text-xs text-muted-foreground">{opt.id}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
            {showLegacy && (
              <p className="mt-2 text-xs italic text-muted-foreground whitespace-pre-line">
                {legacyDesc}
              </p>
            )}
          </div>
        )}
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

export default IncidentSectionE;
