import type { Incident } from '@/modules/incidents/types/incident.types';
import SectionShell, { type SectionVariant } from './SectionShell';
import { pdfCell } from './pdf-shared';

interface Props {
  incident: Incident;
  variant?: SectionVariant;
}

const IncidentSectionF = ({ incident, variant = 'card' }: Props) => {
  const rows = (incident.witnesses ?? []).slice(0, 6);

  if (variant === 'pdf') {
    return (
      <SectionShell variant="pdf" title="F. Witnesses / Saksi">
        {rows.length === 0 ? (
          <p style={{ marginBottom: 12 }}>No witnesses recorded.</p>
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
              {rows.map((w, i) => (
                <tr key={w.id}>
                  <td style={pdfCell}>{i + 1}</td>
                  <td style={pdfCell}>{w.witnessName ?? '—'}</td>
                  <td style={pdfCell}>{w.gender ?? '—'}</td>
                  <td style={pdfCell}>
                    {(w.position ?? '—') + ' / ' + (w.department?.name ?? '—')}
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
    <SectionShell variant={variant} title="F. Witnesses / Saksi">
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No witnesses recorded.</p>
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
              {rows.map((w, i) => (
                <tr key={w.id} className="border-t">
                  <td className="p-2">{i + 1}</td>
                  <td className="p-2">{w.witnessName ?? '—'}</td>
                  <td className="p-2">{w.gender ?? '—'}</td>
                  <td className="p-2">{w.position ?? '—'}</td>
                  <td className="p-2">{w.department?.name ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionShell>
  );
};

export default IncidentSectionF;
