import { Checkbox } from '@/core/components/ui/checkbox';
import { Label } from '@/core/components/ui/label';
import {
  InjuredBodyPartEnum,
  TypeOfInjuryEnum,
  MechanismOfInjuryEnum,
  IncidentClassificationEnum,
  type Incident,
} from '@/modules/incidents/types/incident.types';
import SectionShell, { type SectionVariant } from './SectionShell';
import BodyDiagramCanvas from '../BodyDiagramCanvas';

interface Props {
  incident: Incident;
  variant?: SectionVariant;
  bodyDiagramUrl?: string | null;
  bodyPartsSummary?: string[];
  injuryTypesSummary?: string[];
  mechanismsSummary?: string[];
}

// PRD §B1 — HEAD and NECK collapse into a single "Head / Neck" choice.
const BODY_PART_ROWS: Array<{
  values: InjuredBodyPartEnum[];
  en: string;
  id: string;
}> = [
  { values: [InjuredBodyPartEnum.HEAD, InjuredBodyPartEnum.NECK], en: 'Head / Neck', id: 'Kepala / Leher' },
  { values: [InjuredBodyPartEnum.ARM], en: 'Arms', id: 'Lengan' },
  { values: [InjuredBodyPartEnum.HAND], en: 'Hands', id: 'Tangan' },
  { values: [InjuredBodyPartEnum.BACK], en: 'Back', id: 'Punggung' },
  { values: [InjuredBodyPartEnum.CHEST], en: 'Chest', id: 'Dada' },
  { values: [InjuredBodyPartEnum.ABDOMENT], en: 'Abdomen', id: 'Perut' },
  { values: [InjuredBodyPartEnum.FEET], en: 'Feet', id: 'Telapak kaki' },
  { values: [InjuredBodyPartEnum.LEG], en: 'Legs', id: 'Kaki' },
  { values: [InjuredBodyPartEnum.SKIN], en: 'Skin', id: 'Kulit' },
  { values: [InjuredBodyPartEnum.EYE], en: 'Eyes', id: 'Mata' },
  { values: [InjuredBodyPartEnum.INTERNAL_ORGAN], en: 'Internal Organs', id: 'Organ dalam' },
  { values: [InjuredBodyPartEnum.SHOULDER], en: 'Shoulder', id: 'Pundak' },
  { values: [InjuredBodyPartEnum.OTHER], en: 'Other', id: 'Lainnya' },
];

const TYPE_OF_INJURY_ROWS: Array<{ value: TypeOfInjuryEnum; en: string; id: string }> = [
  { value: TypeOfInjuryEnum.DERMATITIS, en: 'Dermatitis', id: 'Peradangan kulit' },
  { value: TypeOfInjuryEnum.PARALYSIS, en: 'Paralysis', id: 'Kelumpuhan' },
  { value: TypeOfInjuryEnum.AMPUTATION, en: 'Amputation', id: 'Terpotongnya anggota tubuh' },
  { value: TypeOfInjuryEnum.CRUSH, en: 'Crush', id: 'Remuk' },
  { value: TypeOfInjuryEnum.BURN, en: 'Burn', id: 'Luka Bakar' },
  { value: TypeOfInjuryEnum.CONCUSSION, en: 'Concussion', id: 'Gegar' },
  { value: TypeOfInjuryEnum.FRACTURE, en: 'Fracture', id: 'Patah tulang' },
  { value: TypeOfInjuryEnum.LACERATION, en: 'Laceration', id: 'Luka sobek' },
  { value: TypeOfInjuryEnum.SPRAIN, en: 'Sprain / Strain', id: 'Keseleo' },
  { value: TypeOfInjuryEnum.BRUISE, en: 'Bruising', id: 'Memar' },
  { value: TypeOfInjuryEnum.ABRASION, en: 'Abrasion', id: 'Luka lecet' },
  { value: TypeOfInjuryEnum.OTHER, en: 'Other', id: 'Lainnya' },
];

const MECHANISM_ROWS: Array<{ value: MechanismOfInjuryEnum; en: string; id: string }> = [
  { value: MechanismOfInjuryEnum.STRUCK_BY, en: 'Struck by', id: 'Ditabrak' },
  { value: MechanismOfInjuryEnum.CHEMICAL, en: 'Chemicals', id: 'Bahan Kimia' },
  { value: MechanismOfInjuryEnum.ELECTRICITY, en: 'Electricity', id: 'Listrik' },
  { value: MechanismOfInjuryEnum.FLYING_OBJECT, en: 'Flying object', id: 'Objek berterbangan' },
  { value: MechanismOfInjuryEnum.SHARP_OBJECTS, en: 'Sharp objects', id: 'Benda Tajam' },
  { value: MechanismOfInjuryEnum.FAILING_OBJECT, en: 'Falling Object', id: 'Objek jatuh' },
  { value: MechanismOfInjuryEnum.VEHICLES, en: 'Vehicles', id: 'Kendaraan' },
  { value: MechanismOfInjuryEnum.HAND_TOOLS, en: 'Hand Tools', id: 'Perkakas tangan' },
  { value: MechanismOfInjuryEnum.HEAT_COLD, en: 'Heat / Cold', id: 'Panas / Dingin' },
  { value: MechanismOfInjuryEnum.TRIP, en: 'Trip / Slip / Fall', id: 'Tersandung/Tergelincir/Terjatuh' },
  { value: MechanismOfInjuryEnum.MECHINARY, en: 'Machinery', id: 'Mesin' },
  { value: MechanismOfInjuryEnum.FALL_FROM_HEIGHT, en: 'Fall from Height', id: 'Jatuh dari ketinggian' },
  { value: MechanismOfInjuryEnum.MANUAL_HANDLING, en: 'Manual Handling', id: 'Pengangkatan manual' },
  { value: MechanismOfInjuryEnum.OTHER, en: 'Other', id: 'Lainnya' },
];

const LEVEL_OF_INJURY_ROWS: Array<{
  value: IncidentClassificationEnum;
  en: string;
  id: string;
}> = [
  { value: IncidentClassificationEnum.MINOR, en: 'Minor (first aid only)', id: 'Dapat diselesaikan dengan P3K' },
  { value: IncidentClassificationEnum.MAJOR, en: 'Major (hospital treatment required)', id: 'Perlu penanganan medis di RS' },
  { value: IncidentClassificationEnum.FATALITY, en: 'Fatality (loss of life)', id: 'Kehilangan nyawa' },
];

const IncidentSectionB = ({
  incident,
  variant = 'card',
  bodyDiagramUrl,
  bodyPartsSummary,
  injuryTypesSummary,
  mechanismsSummary,
}: Props) => {
  const persons = incident.injuredPersons ?? [];
  const hasPersons = persons.length > 0;

  const bodyParts = bodyPartsSummary
    ? new Set<string>(bodyPartsSummary)
    : new Set<string>(persons.map((p) => p.injuredBodyPart));
  const typesOfInjury = injuryTypesSummary
    ? new Set<string>(injuryTypesSummary)
    : new Set<string>(persons.map((p) => p.typeOfInjury));
  const mechanisms = mechanismsSummary
    ? new Set<string>(mechanismsSummary)
    : new Set<string>(persons.map((p) => p.mechanismOfInjury));

  const hasData = bodyPartsSummary ? bodyPartsSummary.length > 0 || (injuryTypesSummary?.length ?? 0) > 0 || (mechanismsSummary?.length ?? 0) > 0 : hasPersons;

  const isBodyPartChecked = (row: typeof BODY_PART_ROWS[number]) =>
    row.values.some((v) => bodyParts.has(v));

  if (variant === 'pdf') {
    if (!hasData) {
      return (
        <SectionShell variant="pdf" title="B. Injury Details / Rincian Cidera">
          <p style={{ marginBottom: 12 }}>No injured person during this incident.</p>
        </SectionShell>
      );
    }
    const pdfList = (
      items: Array<{ label: string; checked: boolean }>,
    ) => (
      <ul style={{ margin: 0, paddingLeft: 18, columns: 2 }}>
        {items.map((it, i) => (
          <li key={i} style={{ marginBottom: 2 }}>
            {it.checked ? '☒' : '☐'} {it.label}
          </li>
        ))}
      </ul>
    );
    return (
      <SectionShell variant="pdf" title="B. Injury Details / Rincian Cidera">
        <p style={{ fontWeight: 600, margin: '4px 0' }}>B1. Body Part Injured</p>
        {pdfList(
          BODY_PART_ROWS.map((r) => ({
            label: `${r.en} / ${r.id}`,
            checked: isBodyPartChecked(r),
          })),
        )}
        {bodyDiagramUrl && (
          <>
            <p style={{ fontWeight: 600, margin: '8px 0 4px' }}>B1. Body Diagram / Diagram Tubuh</p>
            <img
              src={bodyDiagramUrl}
              alt="Body diagram"
              style={{ maxWidth: '100%', maxHeight: 320, border: '1px solid #ccc', display: 'block' }}
            />
          </>
        )}
        <p style={{ fontWeight: 600, margin: '8px 0 4px' }}>B2. Type of Injury</p>
        {pdfList(
          TYPE_OF_INJURY_ROWS.map((r) => ({
            label: `${r.en} / ${r.id}`,
            checked: typesOfInjury.has(r.value),
          })),
        )}
        <p style={{ fontWeight: 600, margin: '8px 0 4px' }}>B3. Mechanism of Injury</p>
        {pdfList(
          MECHANISM_ROWS.map((r) => ({
            label: `${r.en} / ${r.id}`,
            checked: mechanisms.has(r.value),
          })),
        )}
        <p style={{ fontWeight: 600, margin: '8px 0 4px' }}>B4. Level of Injury</p>
        {pdfList(
          LEVEL_OF_INJURY_ROWS.map((r) => ({
            label: `${r.en} / ${r.id}`,
            checked: incident.incidentClassification === r.value,
          })),
        )}
      </SectionShell>
    );
  }

  return (
    <SectionShell variant={variant} title="B. Injury Details / Rincian Cidera">
      {!hasData ? (
        <p className="text-sm text-muted-foreground">
          No injured person during this incident.
        </p>
      ) : (
        <div className="space-y-6">
          <BGroup
            label="B1. Body Part Injured / Bagian tubuh yang cidera"
            items={BODY_PART_ROWS.map((row) => ({
              key: row.en,
              en: row.en,
              id: row.id,
              checked: isBodyPartChecked(row),
            }))}
          />
          <BGroup
            label="B2. Type of Injury / Tipe Cidera"
            items={TYPE_OF_INJURY_ROWS.map((row) => ({
              key: row.value,
              en: row.en,
              id: row.id,
              checked: typesOfInjury.has(row.value),
            }))}
          />
          <BGroup
            label="B3. Mechanism of Injury / Mekanisme Cidera"
            items={MECHANISM_ROWS.map((row) => ({
              key: row.value,
              en: row.en,
              id: row.id,
              checked: mechanisms.has(row.value),
            }))}
          />
          <BGroup
            label="B4. Level of Injury / Tingkat Cedera"
            items={LEVEL_OF_INJURY_ROWS.map((row) => ({
              key: row.value,
              en: row.en,
              id: row.id,
              checked: incident.incidentClassification === row.value,
            }))}
          />
        </div>
      )}
      <div className="mt-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          B1. Body Diagram / Diagram Tubuh
        </p>
        <BodyDiagramCanvas value={bodyDiagramUrl} readOnly />
      </div>
    </SectionShell>
  );
};

interface BGroupProps {
  label: string;
  items: Array<{ key: string; en: string; id: string; checked: boolean }>;
}

const BGroup = ({ label, items }: BGroupProps) => (
  <div>
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
      {label}
    </p>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
      {items.map((it) => (
        <div key={it.key} className="flex items-start gap-2">
          <Checkbox checked={it.checked} disabled className="mt-0.5" />
          <Label className="text-sm font-normal leading-snug">
            <span>{it.en}</span>
            <span className="text-muted-foreground"> — {it.id}</span>
          </Label>
        </div>
      ))}
    </div>
  </div>
);

export default IncidentSectionB;
