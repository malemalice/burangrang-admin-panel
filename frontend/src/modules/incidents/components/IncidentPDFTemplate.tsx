import { format } from 'date-fns';
import PdfAppHeader from '@/core/components/pdf/PdfAppHeader';
import {
  PdfRow,
  PdfSectionTitle,
  pdfCell,
  pdfLabelCell,
} from '@/modules/investigation-reports/components/incident-readonly';
import type { Incident } from '../types/incident.types';
import { StopActivityEnum, TreatmentEnum, AbsenceEnum, LevelOfInjuryEnum, InjuredBodyPartEnum, TypeOfInjuryEnum, MechanismOfInjuryEnum } from '../types/incident.types';

const fmt = (v: string | undefined | null) => (v ? v.replace(/_/g, ' ') : '—');
const userName = (u?: { name?: string; firstName?: string; lastName?: string } | null) => {
  if (!u) return '—';
  if (u.name) return u.name;
  return [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || '—';
};

const IncidentPDFTemplate = ({ incident }: { incident: Incident }) => (
  <div
    className="bg-white p-8"
    style={{ fontFamily: 'Arial, sans-serif', fontSize: 11, color: '#000' }}
  >
    {/* Header */}
    <div className="mb-8 border-b-2 border-gray-800 pb-4">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Incident Report: {incident.code}
          </h1>
          <p className="text-sm text-gray-600 mb-1">
            Laporan Insiden &middot; Form: BSJ/F/H-3-3.5A
          </p>
          <p className="text-sm text-gray-600">
            Generated on {format(new Date(), 'dd MMM yyyy HH:mm')}
          </p>
        </div>
        <div className="shrink-0">
          <PdfAppHeader />
        </div>
      </div>
    </div>

    {/* A. Incident Details */}
    <PdfSectionTitle>A. Incident / Nearmiss Details &mdash; Detail Insiden / Nearmiss</PdfSectionTitle>
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
      <tbody>
        <PdfRow label="Code" value={incident.code} />
        <PdfRow label="Subject (Subjek)" value={incident.subject} />
        <PdfRow
          label="Incident Date & Time (Tanggal & Waktu)"
          value={format(new Date(incident.incidentDate), 'dd MMM yyyy HH:mm')}
        />
        <PdfRow label="Location / Room (Lokasi)" value={incident.room?.name ?? '—'} />
        <PdfRow label="Area" value={incident.area?.name ?? '—'} />
        <PdfRow label="Type of Hazard (Jenis Bahaya)" value={incident.riskCategory?.name ?? '—'} />
        <PdfRow label="Incident Type (Jenis Insiden)" value={fmt(incident.incidentType)} />
        <PdfRow label="Classification (Klasifikasi)" value={fmt(incident.incidentClassification)} />
        <PdfRow label="Priority (Prioritas)" value={fmt(incident.priority)} />
        <PdfRow label="Status" value={fmt(incident.status)} />
        {incident.description && (
          <PdfRow label="Description (Deskripsi)" value={incident.description} />
        )}
      </tbody>
    </table>

    {/* B. Action */}
    <PdfSectionTitle>B. Action &mdash; Tindakan</PdfSectionTitle>
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
      <tbody>
        {incident.dueDate && (
          <PdfRow
            label="Due Date"
            value={format(new Date(incident.dueDate), 'dd MMM yyyy')}
          />
        )}
        {incident.needToStopActivity !== StopActivityEnum.NOT_SPECIFIED && (
          <PdfRow
            label="Need to Stop Activity (Perlu Menghentikan Aktivitas)"
            value={fmt(incident.needToStopActivity)}
          />
        )}
        {incident.needToStopActivity === StopActivityEnum.YES && (
          <PdfRow
            label="Stop Scope (Lingkup Penghentian)"
            value={[
              incident.stopLocally ? 'Stop activity locally' : null,
              incident.stopWholeSchool ? 'Stop whole school activities' : null,
            ]
              .filter(Boolean)
              .join(', ') || '—'}
          />
        )}
        {incident.treatment !== TreatmentEnum.NOT_SPECIFIED && (
          <PdfRow label="Treatment (Penanganan)" value={fmt(incident.treatment)} />
        )}
        {incident.absence !== AbsenceEnum.NOT_SPECIFIED && (
          <PdfRow label="Absence (Absensi)" value={fmt(incident.absence)} />
        )}
        {incident.controlMeasure && (
          <PdfRow
            label="Action Taken Following Incident (Tindakan yang Dilakukan)"
            value={incident.controlMeasure}
          />
        )}
        {incident.expectedOutcome && (
          <PdfRow label="Expected Outcome (Hasil yang Diharapkan)" value={incident.expectedOutcome} />
        )}
        {incident.treatmentDescription && (
          <PdfRow label="Treatment Description (Deskripsi Penanganan)" value={incident.treatmentDescription} />
        )}
        {incident.resolution && (
          <PdfRow label="Resolution (Penyelesaian)" value={incident.resolution} />
        )}
        <PdfRow
          label="Need Further Investigation (Perlu Investigasi Lebih Lanjut)"
          value={incident.needFurtherInvestigation ? 'Yes' : 'No'}
        />
      </tbody>
    </table>

    {/* C. Person Involved */}
    {incident.injuredPersons && incident.injuredPersons.length > 0 && (
      <>
        <PdfSectionTitle>
          C. Person Involved at the Incident &mdash; Orang yang Terlibat dalam Kejadian
        </PdfSectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
          <thead>
            <tr>
              <th style={pdfCell}>No</th>
              <th style={pdfCell}>Name (Nama)</th>
              <th style={pdfCell}>Gender (Jenis Kelamin)</th>
              <th style={pdfCell}>Position / Dept (Jabatan / Dept)</th>
              <th style={pdfCell}>Level of Injury (Tingkat Cedera)</th>
              <th style={pdfCell}>Body Part (Bagian Tubuh)</th>
              <th style={pdfCell}>Type of Injury (Jenis Cedera)</th>
              <th style={pdfCell}>Mechanism (Mekanisme)</th>
            </tr>
          </thead>
          <tbody>
            {incident.injuredPersons.map((p, i) => (
              <tr key={p.id}>
                <td style={pdfCell}>{i + 1}</td>
                <td style={pdfCell}>{p.injuredPersonName ?? '—'}</td>
                <td style={pdfCell}>{p.gender ? fmt(p.gender) : '—'}</td>
                <td style={pdfCell}>
                  {[p.position, p.department?.name].filter(Boolean).join(' / ') || '—'}
                </td>
                <td style={pdfCell}>
                  {p.levelOfInjury !== LevelOfInjuryEnum.NOT_SPECIFIED ? fmt(p.levelOfInjury) : '—'}
                </td>
                <td style={pdfCell}>
                  {p.injuredBodyPart !== InjuredBodyPartEnum.NOT_SPECIFIED ? fmt(p.injuredBodyPart) : '—'}
                </td>
                <td style={pdfCell}>
                  {p.typeOfInjury !== TypeOfInjuryEnum.NOT_SPECIFIED ? fmt(p.typeOfInjury) : '—'}
                </td>
                <td style={pdfCell}>
                  {p.mechanismOfInjury !== MechanismOfInjuryEnum.NOT_SPECIFIED
                    ? fmt(p.mechanismOfInjury)
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    )}

    {/* D. Third Parties */}
    {incident.thirdParties && incident.thirdParties.length > 0 && (
      <>
        <PdfSectionTitle>
          D. Third Parties Involved &mdash; Pihak Ketiga yang Terlibat
        </PdfSectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
          <thead>
            <tr>
              <th style={pdfCell}>No</th>
              <th style={pdfCell}>Name (Nama)</th>
              <th style={pdfCell}>Gender (Jenis Kelamin)</th>
              <th style={pdfCell}>Company (Perusahaan)</th>
              <th style={pdfCell}>Position (Jabatan)</th>
            </tr>
          </thead>
          <tbody>
            {incident.thirdParties.map((tp, i) => (
              <tr key={tp.id}>
                <td style={pdfCell}>{i + 1}</td>
                <td style={pdfCell}>{tp.name}</td>
                <td style={pdfCell}>{tp.gender ? fmt(tp.gender) : '—'}</td>
                <td style={pdfCell}>{tp.company ?? '—'}</td>
                <td style={pdfCell}>{tp.position ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    )}

    {/* E. Assets / Equipment */}
    {incident.assets && incident.assets.length > 0 && (
      <>
        <PdfSectionTitle>
          E. Assets / Equipment Involved &mdash; Aset / Peralatan yang Terlibat
        </PdfSectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
          <thead>
            <tr>
              <th style={pdfCell}>No</th>
              <th style={pdfCell}>Asset Name (Nama Aset)</th>
              <th style={pdfCell}>Code (Kode)</th>
              <th style={pdfCell}>Brand (Merek)</th>
              <th style={pdfCell}>Quantity (Jumlah)</th>
            </tr>
          </thead>
          <tbody>
            {incident.assets.map((a, i) => (
              <tr key={a.id}>
                <td style={pdfCell}>{i + 1}</td>
                <td style={pdfCell}>{a.assetName}</td>
                <td style={pdfCell}>{a.assetCode ?? '—'}</td>
                <td style={pdfCell}>{a.brand ?? '—'}</td>
                <td style={pdfCell}>{a.quantity != null ? String(a.quantity) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    )}

    {/* F. Witness */}
    {incident.witnesses && incident.witnesses.length > 0 && (
      <>
        <PdfSectionTitle>F. Witness &mdash; Saksi</PdfSectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
          <thead>
            <tr>
              <th style={pdfCell}>No</th>
              <th style={pdfCell}>Name (Nama)</th>
              <th style={pdfCell}>Gender (Jenis Kelamin)</th>
              <th style={pdfCell}>Position (Jabatan)</th>
              <th style={pdfCell}>Department</th>
            </tr>
          </thead>
          <tbody>
            {incident.witnesses.map((w, i) => (
              <tr key={w.id}>
                <td style={pdfCell}>{i + 1}</td>
                <td style={pdfCell}>{w.witnessName ?? '—'}</td>
                <td style={pdfCell}>{w.gender ? fmt(w.gender) : '—'}</td>
                <td style={pdfCell}>{w.position ?? '—'}</td>
                <td style={pdfCell}>{w.department?.name ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    )}

    {/* G. Reporter */}
    <PdfSectionTitle>G. Reporter &mdash; Pelapor</PdfSectionTitle>
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
      <tbody>
        <PdfRow label="Requester (Pemohon)" value={userName(incident.requester)} />
        <PdfRow label="Reporter (Pelapor)" value={userName(incident.reporter)} />
        {incident.technician && (
          <PdfRow label="Technician (Teknisi)" value={userName(incident.technician)} />
        )}
        <PdfRow
          label="Assigned Department (Departemen yang Ditugaskan)"
          value={incident.assignedDepartment?.name ?? '—'}
        />
        {incident.assignee && (
          <PdfRow label="Assignee (Penanggung Jawab)" value={userName(incident.assignee)} />
        )}
      </tbody>
    </table>

    {/* Footer */}
    <div
      style={{
        marginTop: 24,
        paddingTop: 8,
        borderTop: '1px solid #999',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 9,
        color: '#555',
      }}
    >
      <span>BSJ/F/H-3-3.5A &mdash; Incident Report</span>
      <span>{incident.code}</span>
    </div>
  </div>
);

export default IncidentPDFTemplate;
