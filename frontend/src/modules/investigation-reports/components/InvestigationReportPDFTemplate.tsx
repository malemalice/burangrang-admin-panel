import { format } from 'date-fns';
import {
  type InvestigationCause,
  type InvestigationReport,
  InvestigationCauseSectionEnum,
} from '../types/investigation-report.types';
import {
  IncidentSectionA,
  IncidentSectionB,
  IncidentSectionC,
  IncidentSectionD,
  IncidentSectionE,
  IncidentSectionF,
  PdfRow,
  PdfSectionTitle,
  pdfCell,
  pdfFormatRupiah,
} from './incident-readonly';

type GroupByTier = (
  causes: InvestigationCause[],
) => Record<string, Record<string, InvestigationCause[]>>;

const PdfHfacsMatrix = ({
  causes,
  groupByTier,
}: {
  causes: InvestigationCause[];
  groupByTier: GroupByTier;
}) => {
  const grouped = groupByTier(causes);
  return (
    <div style={{ marginBottom: 12 }}>
      {Object.entries(grouped).map(([tier1, tier2Groups]) => (
        <div key={tier1} style={{ marginBottom: 8 }}>
          <div
            style={{
              background: 'hsl(var(--muted))',
              borderRadius: 4,
              padding: '4px 10px',
              marginBottom: 6,
              fontWeight: 600,
              fontSize: 11,
            }}
          >
            {tier1}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {Object.entries(tier2Groups).map(([tier2, items]) => (
              <div
                key={tier2}
                style={{
                  flex: '1 1 45%',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  padding: '6px 8px',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 10, marginBottom: 4 }}>{tier2}</div>
                {items.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding: '2px 6px',
                      marginBottom: 2,
                      fontSize: 10,
                    }}
                  >
                    {c.causeName}
                    {c.customNotes && (
                      <em style={{ color: '#555' }}> — {c.customNotes}</em>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const InvestigationReportPDFTemplate = ({ report }: { report: InvestigationReport }) => {
  const incident = report.incident;
  const sumCost =
    (Number(report.cost?.medicalCost ?? 0) || 0) +
    (Number(report.cost?.lostTimeCost ?? 0) || 0) +
    (Number(report.cost?.damageCost ?? 0) || 0) +
    (Number(report.cost?.repairCost ?? 0) || 0) +
    (Number(report.cost?.compensationCost ?? 0) || 0) +
    (Number(report.cost?.otherCost ?? 0) || 0);

  const latentCauses = report.causes.filter(
    (c) => c.isSelected && c.section === InvestigationCauseSectionEnum.LATENT_FAILURE,
  );
  const activeCauses = report.causes.filter(
    (c) => c.isSelected && c.section === InvestigationCauseSectionEnum.ACTIVE_FAILURE,
  );

  const groupByTier = (causes: typeof latentCauses) =>
    causes.reduce<Record<string, Record<string, typeof causes>>>(
      (acc, c) => {
        if (!acc[c.tier1]) acc[c.tier1] = {};
        if (!acc[c.tier1][c.tier2]) acc[c.tier1][c.tier2] = [];
        acc[c.tier1][c.tier2].push(c);
        return acc;
      },
      {},
    );

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

      {incident && (
        <IncidentSectionA
          incident={incident}
          reportNumber={report.reportNumber}
          variant="pdf"
        />
      )}

      <PdfSectionTitle>
        A1/A2. Task & Equipment / Pekerjaan dan Peralatan
      </PdfSectionTitle>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
        <tbody>
          <PdfRow label="A1. Task Performed" value={report.taskBeingPerformed ?? '—'} />
          <PdfRow label="A2. Equipment Used" value={report.equipmentUsed ?? '—'} />
        </tbody>
      </table>

      {incident && (
        <>
          <IncidentSectionB incident={incident} variant="pdf" />
          <IncidentSectionC incident={incident} variant="pdf" />
          <IncidentSectionD incident={incident} variant="pdf" />
          <IncidentSectionE incident={incident} variant="pdf" />
          <IncidentSectionF incident={incident} variant="pdf" />
        </>
      )}

      <PdfSectionTitle>G. Estimation Cost / Estimasi Kerugian</PdfSectionTitle>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
        <tbody>
          <PdfRow label="Medical Cost" value={pdfFormatRupiah(report.cost?.medicalCost)} />
          <PdfRow label="Lost Time Cost" value={pdfFormatRupiah(report.cost?.lostTimeCost)} />
          <PdfRow label="Damage Cost" value={pdfFormatRupiah(report.cost?.damageCost)} />
          <PdfRow label="Repair Cost" value={pdfFormatRupiah(report.cost?.repairCost)} />
          <PdfRow label="Compensation Cost" value={pdfFormatRupiah(report.cost?.compensationCost)} />
          <PdfRow label="Other Cost" value={pdfFormatRupiah(report.cost?.otherCost)} />
          <PdfRow
            label="TOTAL"
            value={
              report.cost?.isNotYetKnown
                ? 'Rp. Not Yet Known (Belum diketahui)'
                : pdfFormatRupiah(sumCost)
            }
          />
        </tbody>
      </table>

      <PdfSectionTitle>
        H. Latent Failure / Kegagalan Terpendam (Indirect Cause)
      </PdfSectionTitle>
      {latentCauses.length === 0 ? (
        <p style={{ marginBottom: 12 }}>No causes selected.</p>
      ) : (
        <PdfHfacsMatrix causes={latentCauses} groupByTier={groupByTier} />
      )}

      <PdfSectionTitle>
        I. Active Failure / Kegagalan Aktif (Direct Cause)
      </PdfSectionTitle>
      {activeCauses.length === 0 ? (
        <p style={{ marginBottom: 12 }}>No causes selected.</p>
      ) : (
        <PdfHfacsMatrix causes={activeCauses} groupByTier={groupByTier} />
      )}

      <PdfSectionTitle>J. Remedial Action Plans / Rencana Tindakan Perbaikan</PdfSectionTitle>
      {report.actionPlans.length === 0 ? (
        <p style={{ marginBottom: 12 }}>No action plans.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
          <thead>
            <tr>
              <th style={pdfCell}>No</th>
              <th style={pdfCell}>Action Plan</th>
              <th style={pdfCell}>Responsible</th>
              <th style={pdfCell}>Target Date</th>
              <th style={pdfCell}>Verified</th>
            </tr>
          </thead>
          <tbody>
            {report.actionPlans.map((a, i) => (
              <tr key={a.id}>
                <td style={pdfCell}>{i + 1}</td>
                <td style={pdfCell}>{a.actionPlan}</td>
                <td style={pdfCell}>{a.responsiblePerson ?? '—'}</td>
                <td style={pdfCell}>
                  {a.targetDate
                    ? format(new Date(a.targetDate), 'dd MMM yyyy')
                    : a.targetDateNotes ?? 'TBD'}
                </td>
                <td style={pdfCell}>
                  {a.verificationDate
                    ? format(new Date(a.verificationDate), 'dd MMM yyyy')
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <PdfSectionTitle>K. Signatures / Tanda Tangan</PdfSectionTitle>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
        <thead>
          <tr>
            <th style={pdfCell}>Investigator Team (Tim Investigator)</th>
            <th style={pdfCell}>Name (Nama)</th>
            <th style={pdfCell}>Signature (Tanda tangan)</th>
            <th style={pdfCell}>Date (Tanggal)</th>
          </tr>
        </thead>
        <tbody>
          {report.signatories.map((s) => (
            <tr key={s.id}>
              <td style={pdfCell}>{s.roleName ?? '—'}</td>
              <td style={pdfCell}>{s.name ?? '—'}</td>
              <td style={{ ...pdfCell, minHeight: 48, height: 48 }}>{/* blank for physical signature */}</td>
              <td style={pdfCell}>
                {s.signedAt ? format(new Date(s.signedAt), 'dd MMM yyyy') : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <PdfSectionTitle>
        L. H&S Comments / Komentar Health and Safety
      </PdfSectionTitle>
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
        <span>BSJ/F/G-3-01 - Rev 0 - Rev date : 07/02/17</span>
        <span>{report.reportNumber}</span>
      </div>
    </div>
  );
};

export default InvestigationReportPDFTemplate;
