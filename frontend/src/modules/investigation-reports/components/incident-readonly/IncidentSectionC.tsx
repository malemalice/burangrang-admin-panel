import type { Incident } from '@/modules/incidents/types/incident.types';
import SectionShell, { type SectionVariant } from './SectionShell';
import { pdfCell } from './pdf-shared';

interface Props {
  incident: Incident;
  variant?: SectionVariant;
}

const IncidentSectionC = ({ incident, variant = 'card' }: Props) => {
  const rows = (incident.injuredPersons ?? []).slice(0, 8);

  if (variant === 'pdf') {
    return (
      <SectionShell variant="pdf" title="C. Injured Person Details / Rincian Korban">
        {rows.length === 0 ? (
          <p style={{ marginBottom: 12 }}>No injured person during this incident.</p>
        ) : (
          <table
            style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}
          >
            <thead>
              <tr>
                <th style={pdfCell}>No</th>
                <th style={pdfCell}>Name (Nama)</th>
                <th style={pdfCell}>Gender (Jenis Kelamin)</th>
                <th style={pdfCell}>Position / Department / Section (Posisi / jabatan / bagian)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p, i) => (
                <tr key={p.id}>
                  <td style={pdfCell}>{i + 1}</td>
                  <td style={pdfCell}>{p.injuredPersonName ?? '—'}</td>
                  <td style={pdfCell}>{p.gender ?? '—'}</td>
                  <td style={pdfCell}>
                    {(p.position ?? '—') + ' / ' + (p.department?.name ?? '—')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionShell>
    );
  }

  return (
    <SectionShell
      variant={variant}
      title="C. Injured Person Details / Rincian Korban"
    >
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No injured person during this incident.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2">No</th>
                <th className="text-left p-2">Name / Nama</th>
                <th className="text-left p-2">Gender / Jenis Kelamin</th>
                <th className="text-left p-2">Position / Jabatan</th>
                <th className="text-left p-2">Department / Bagian</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p, i) => (
                <tr key={p.id} className="border-t">
                  <td className="p-2">{i + 1}</td>
                  <td className="p-2">{p.injuredPersonName ?? '—'}</td>
                  <td className="p-2">{p.gender ?? '—'}</td>
                  <td className="p-2">{p.position ?? '—'}</td>
                  <td className="p-2">{p.department?.name ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionShell>
  );
};

export default IncidentSectionC;
