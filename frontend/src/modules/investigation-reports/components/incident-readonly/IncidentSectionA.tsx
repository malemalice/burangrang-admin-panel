import { format } from 'date-fns';
import { ExternalLink } from 'lucide-react';
import { Label } from '@/core/components/ui/label';
import type { Incident } from '@/modules/incidents/types/incident.types';
import SectionShell, { type SectionVariant } from './SectionShell';
import { pdfCell, pdfLabelCell, PdfRow } from './pdf-shared';

interface Props {
  incident: Incident;
  reportNumber?: string | null;
  variant?: SectionVariant;
}

const fmtDate = (d?: Date | string | null) =>
  d ? format(new Date(d), 'dd MMM yyyy') : '—';
const fmtTime = (d?: Date | string | null) =>
  d ? format(new Date(d), 'HH:mm') : '—';

const IncidentSectionA = ({ incident, reportNumber, variant = 'card' }: Props) => {
  const reportNumberText = reportNumber ?? '— Auto-generated on create —';

  if (variant === 'pdf') {
    return (
      <SectionShell variant="pdf" title="A. Accident Details / Rincian Kecelakaan">
        <table
          style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}
        >
          <tbody>
            <PdfRow label="Report Number / Nomor Laporan" value={reportNumberText} />
            <PdfRow label="Incident Code / Kode Insiden" value={incident.code} />
            <PdfRow
              label="Accident Location / Lokasi Kecelakaan"
              value={incident.area?.name ?? '—'}
            />
            <PdfRow
              label="Accident Date / Tanggal Kecelakaan"
              value={fmtDate(incident.incidentDate)}
            />
            <PdfRow
              label="Incident Time / Waktu Kejadian"
              value={fmtTime(incident.incidentDate)}
            />
            <PdfRow
              label="Report Date / Tanggal Laporan"
              value={fmtDate(incident.createdAt)}
            />
            <PdfRow
              label="Report Time / Waktu Laporan"
              value={fmtTime(incident.createdAt)}
            />
            <PdfRow
              label="Description / Deskripsi Kejadian"
              value={incident.description ?? '—'}
            />
          </tbody>
        </table>
        {!!incident.images && incident.images.length > 0 && (
          <>
            <p style={{ fontWeight: 600, margin: '8px 0 4px' }}>
              A4. Images / Sketch (Gambar/Sketsa kejadian)
            </p>
            <table
              style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}
            >
              <tbody>
                {incident.images.map((img) => (
                  <tr key={img.id}>
                    <td style={pdfLabelCell}>{img.caption ?? '—'}</td>
                    <td style={pdfCell}>
                      <img
                        src={img.imageUrl}
                        alt={img.caption ?? 'incident'}
                        style={{ maxHeight: 200, maxWidth: '100%', objectFit: 'contain' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </SectionShell>
    );
  }

  const headerExtra =
    variant === 'card' ? (
      <a
        href={`/incidents/${incident.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-sm text-primary hover:underline shrink-0"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        View Incident
      </a>
    ) : undefined;

  return (
    <SectionShell
      variant={variant}
      title="A. Accident Details / Rincian Kecelakaan"
      headerExtra={headerExtra}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <KV label="Report Number" value={reportNumberText} />
          <KV label="Incident Code" value={incident.code} />
          <KV label="Accident Location" value={incident.area?.name ?? '—'} />
          <KV label="Accident Date" value={fmtDate(incident.incidentDate)} />
          <KV label="Incident Time" value={fmtTime(incident.incidentDate)} />
          <KV label="Report Date" value={fmtDate(incident.createdAt)} />
          <KV label="Report Time" value={fmtTime(incident.createdAt)} />
          <div className="md:col-span-2">
            <Label className="text-muted-foreground">
              Description of Incident / Deskripsi Kejadian
            </Label>
            <p className="text-sm whitespace-pre-line">
              {incident.description ?? '—'}
            </p>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            A4. Images / Sketch (Gambar/Sketsa kejadian)
          </p>
          {!incident.images || incident.images.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No images attached to this incident.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {incident.images.map((img) => (
                <a
                  key={img.id}
                  href={img.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-md border overflow-hidden bg-muted"
                >
                  <img
                    src={img.imageUrl}
                    alt={img.caption ?? 'incident'}
                    className="w-full h-32 object-cover"
                  />
                  {img.caption && (
                    <p className="px-2 py-1 text-xs text-muted-foreground truncate">
                      {img.caption}
                    </p>
                  )}
                </a>
              ))}
            </div>
          )}
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

export default IncidentSectionA;
