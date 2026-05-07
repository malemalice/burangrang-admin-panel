import { format } from 'date-fns';
import type { InvestigationReport } from '../types/investigation-report.types';

const cell: React.CSSProperties = {
  border: '1px solid #555',
  padding: 6,
  verticalAlign: 'top',
};
const labelCell: React.CSSProperties = {
  ...cell,
  background: '#f0f0f0',
  fontWeight: 600,
  width: 200,
};

const formatRupiah = (n?: number | null) =>
  n == null ? '—' : `Rp. ${Number(n).toLocaleString('id-ID')}`;

const InvestigationReportPDFTemplate = ({ report }: { report: InvestigationReport }) => {
  const incident = report.incident;
  const sumCost =
    (Number(report.cost?.medicalCost ?? 0) || 0) +
    (Number(report.cost?.lostTimeCost ?? 0) || 0) +
    (Number(report.cost?.damageCost ?? 0) || 0) +
    (Number(report.cost?.repairCost ?? 0) || 0) +
    (Number(report.cost?.compensationCost ?? 0) || 0) +
    (Number(report.cost?.otherCost ?? 0) || 0);

  const selectedCauses = report.causes.filter((c) => c.isSelected);

  return (
    <div
      style={{
        width: 800,
        padding: 24,
        fontFamily: 'Arial, sans-serif',
        fontSize: 11,
        color: '#000',
        background: '#fff',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 16, margin: 0 }}>
          ACCIDENT INVESTIGATION REPORT
        </h1>
        <h2 style={{ fontSize: 13, margin: '4px 0' }}>
          Laporan Investigasi Kecelakaan
        </h2>
        <p style={{ margin: 0, fontSize: 10 }}>
          Form: BSJ/F/H-3-3.5C/Rev1 — Report No: <strong>{report.reportNumber}</strong>
        </p>
      </div>

      {/* Section A */}
      <SectionTitle>A. Accident Details / Rincian Kecelakaan</SectionTitle>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
        <tbody>
          <Row label="Accident Location / Lokasi" value={incident?.area?.name ?? '—'} />
          <Row
            label="Accident Date / Tanggal Kecelakaan"
            value={incident ? format(new Date(incident.incidentDate), 'dd MMM yyyy') : '—'}
          />
          <Row
            label="Incident Time / Waktu Kejadian"
            value={incident ? format(new Date(incident.incidentDate), 'HH:mm') : '—'}
          />
          <Row
            label="Report Date / Tanggal Laporan"
            value={incident ? format(new Date(incident.createdAt), 'dd MMM yyyy') : '—'}
          />
          <Row label="Description / Deskripsi" value={incident?.description ?? '—'} />
          <Row label="A1. Task Performed" value={report.taskBeingPerformed ?? '—'} />
          <Row label="A2. Equipment Used" value={report.equipmentUsed ?? '—'} />
        </tbody>
      </table>

      {/* Section C — Injured Persons */}
      <SectionTitle>C. Injured Persons / Rincian Korban</SectionTitle>
      {!incident?.injuredPersons || incident.injuredPersons.length === 0 ? (
        <p style={{ marginBottom: 12 }}>No injured person during this incident.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
          <thead>
            <tr>
              <th style={cell}>No</th>
              <th style={cell}>Name</th>
              <th style={cell}>Gender</th>
              <th style={cell}>Position</th>
              <th style={cell}>Department</th>
            </tr>
          </thead>
          <tbody>
            {incident.injuredPersons.map((p, i) => (
              <tr key={p.id}>
                <td style={cell}>{i + 1}</td>
                <td style={cell}>{p.injuredPersonName ?? '—'}</td>
                <td style={cell}>{p.gender ?? '—'}</td>
                <td style={cell}>{p.position ?? '—'}</td>
                <td style={cell}>{p.department?.name ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Section F — Witnesses */}
      <SectionTitle>F. Witnesses / Saksi</SectionTitle>
      {!incident?.witnesses || incident.witnesses.length === 0 ? (
        <p style={{ marginBottom: 12 }}>No witnesses recorded.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
          <thead>
            <tr>
              <th style={cell}>No</th>
              <th style={cell}>Name</th>
              <th style={cell}>Gender</th>
              <th style={cell}>Position</th>
              <th style={cell}>Department</th>
            </tr>
          </thead>
          <tbody>
            {incident.witnesses.map((w, i) => (
              <tr key={w.id}>
                <td style={cell}>{i + 1}</td>
                <td style={cell}>{w.witnessName ?? '—'}</td>
                <td style={cell}>{w.gender ?? '—'}</td>
                <td style={cell}>{w.position ?? '—'}</td>
                <td style={cell}>{w.department?.name ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Section G */}
      <SectionTitle>G. Estimation Cost / Estimasi Kerugian</SectionTitle>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
        <tbody>
          <Row label="Medical Cost" value={formatRupiah(report.cost?.medicalCost)} />
          <Row label="Lost Time Cost" value={formatRupiah(report.cost?.lostTimeCost)} />
          <Row label="Damage Cost" value={formatRupiah(report.cost?.damageCost)} />
          <Row label="Repair Cost" value={formatRupiah(report.cost?.repairCost)} />
          <Row label="Compensation Cost" value={formatRupiah(report.cost?.compensationCost)} />
          <Row label="Other Cost" value={formatRupiah(report.cost?.otherCost)} />
          <Row
            label="TOTAL"
            value={
              report.cost?.isNotYetKnown
                ? 'Rp. Not Yet Known (Belum diketahui)'
                : formatRupiah(sumCost)
            }
          />
        </tbody>
      </table>

      {/* Sections H/I */}
      <SectionTitle>H/I. Causes (HFACS)</SectionTitle>
      {selectedCauses.length === 0 ? (
        <p style={{ marginBottom: 12 }}>No causes selected.</p>
      ) : (
        <ul style={{ marginBottom: 12, paddingLeft: 20 }}>
          {selectedCauses.map((c) => (
            <li key={c.id}>
              <strong>[{c.causeKey}]</strong> {c.causeName}
              {c.customNotes ? <em> — {c.customNotes}</em> : null}
            </li>
          ))}
        </ul>
      )}

      {/* Section J */}
      <SectionTitle>J. Remedial Action Plans</SectionTitle>
      {report.actionPlans.length === 0 ? (
        <p style={{ marginBottom: 12 }}>No action plans.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
          <thead>
            <tr>
              <th style={cell}>No</th>
              <th style={cell}>Action Plan</th>
              <th style={cell}>Responsible</th>
              <th style={cell}>Target Date</th>
              <th style={cell}>Verified</th>
            </tr>
          </thead>
          <tbody>
            {report.actionPlans.map((a, i) => (
              <tr key={a.id}>
                <td style={cell}>{i + 1}</td>
                <td style={cell}>{a.actionPlan}</td>
                <td style={cell}>{a.responsiblePerson ?? '—'}</td>
                <td style={cell}>
                  {a.targetDate
                    ? format(new Date(a.targetDate), 'dd MMM yyyy')
                    : a.targetDateNotes ?? 'TBD'}
                </td>
                <td style={cell}>
                  {a.verificationDate
                    ? format(new Date(a.verificationDate), 'dd MMM yyyy')
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Section K */}
      <SectionTitle>K. Signatures / Tanda Tangan</SectionTitle>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
        <thead>
          <tr>
            <th style={cell}>Role</th>
            <th style={cell}>Position</th>
            <th style={cell}>Name</th>
            <th style={cell}>Signature</th>
            <th style={cell}>Date</th>
          </tr>
        </thead>
        <tbody>
          {report.signatories.map((s) => (
            <tr key={s.id}>
              <td style={cell}>{s.signatoryRole.replace(/_/g, ' ')}</td>
              <td style={cell}>{s.roleName ?? '—'}</td>
              <td style={cell}>{s.name ?? '—'}</td>
              <td style={cell}>
                {s.signatureUrl ? (
                  <img
                    src={s.signatureUrl}
                    style={{ height: 40, maxWidth: 120, objectFit: 'contain' }}
                    alt="signature"
                  />
                ) : (
                  '—'
                )}
              </td>
              <td style={cell}>
                {s.signedAt ? format(new Date(s.signedAt), 'dd MMM yyyy') : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Section L */}
      <SectionTitle>L. H&S Comments / Komentar Health and Safety</SectionTitle>
      <p style={{ whiteSpace: 'pre-line', marginBottom: 8 }}>
        {report.hsComments ?? '—'}
      </p>
      <p style={{ marginBottom: 12 }}>
        Distribution:{' '}
        {[
          report.distributionSafetyCommittee && 'Safety Committee',
          report.distributionHeadOfBusinessOp && 'Head of Business Operation',
          report.distributionRelatedDepartment && 'Related Department',
        ]
          .filter(Boolean)
          .join(', ') || '—'}
      </p>
    </div>
  );
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3
    style={{
      fontSize: 12,
      margin: '10px 0 6px',
      paddingBottom: 2,
      borderBottom: '1px solid #999',
    }}
  >
    {children}
  </h3>
);

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <tr>
    <td style={labelCell}>{label}</td>
    <td style={cell}>{value}</td>
  </tr>
);

export default InvestigationReportPDFTemplate;
