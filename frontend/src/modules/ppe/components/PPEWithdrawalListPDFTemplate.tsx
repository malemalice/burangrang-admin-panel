import { format } from 'date-fns';
import { PPEWithdrawal, PPEWithdrawalStatus } from '../types/ppe.types';

interface PPEWithdrawalListPDFTemplateProps {
  withdrawals: PPEWithdrawal[];
  generatedAt?: Date;
}

const statusLabel: Record<PPEWithdrawalStatus, string> = {
  PENDING: 'Pending',
  WAITING_APPROVAL: 'Waiting Approval',
  APPROVED: 'Approved',
  COLLECTED: 'Collected',
  CANCELLED: 'Cancelled',
  REJECTED: 'Rejected',
};

export function PPEWithdrawalListPDFTemplate({
  withdrawals,
  generatedAt,
}: PPEWithdrawalListPDFTemplateProps) {
  const generated = generatedAt ?? new Date();

  return (
    <div className="bg-white p-8" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div
        className="mb-6 pb-4"
        style={{ borderBottom: '2px solid #111' }}
      >
        <p
          className="text-xs font-semibold text-gray-500 mb-1 tracking-widest uppercase"
          style={{ fontSize: '10px', color: '#888', letterSpacing: '1px', textTransform: 'uppercase' }}
        >
          Health, Safety &amp; Environment
        </p>
        <h1
          className="font-bold text-gray-900"
          style={{ fontSize: '20px', letterSpacing: '0.5px', color: '#111' }}
        >
          PPE WITHDRAWAL LIST
        </h1>
        <p style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>
          Generated: {format(generated, 'dd MMMM yyyy HH:mm')}
          &nbsp;&nbsp;|&nbsp;&nbsp;
          Total Records: {withdrawals.length}
        </p>
      </div>

      {/* Table */}
      {withdrawals.length > 0 ? (
        <table
          className="min-w-full"
          style={{ borderCollapse: 'collapse', border: '1px solid #ccc', width: '100%' }}
        >
          <thead>
            <tr style={{ background: '#e8e8e8' }}>
              {[
                { label: 'No.', width: '4%' },
                { label: 'Withdrawal Code', width: '18%' },
                { label: 'Date', width: '13%' },
                { label: 'Requested For', width: '18%' },
                { label: 'Department', width: '18%' },
                { label: 'Items', width: '10%' },
                { label: 'Status', width: '19%' },
              ].map((col) => (
                <th
                  key={col.label}
                  style={{
                    border: '1px solid #ccc',
                    padding: '6px 8px',
                    fontSize: '10px',
                    fontWeight: 700,
                    textAlign: 'left',
                    color: '#333',
                    width: col.width,
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {withdrawals.map((w, idx) => (
              <tr
                key={w.id}
                style={{ background: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}
              >
                <td style={{ border: '1px solid #ccc', padding: '5px 8px', fontSize: '11px', color: '#111' }}>
                  {idx + 1}
                </td>
                <td style={{ border: '1px solid #ccc', padding: '5px 8px', fontSize: '11px', fontWeight: 600, color: '#111' }}>
                  {w.withdrawalCode}
                </td>
                <td style={{ border: '1px solid #ccc', padding: '5px 8px', fontSize: '11px', color: '#111', whiteSpace: 'nowrap' }}>
                  {w.withdrawalDate
                    ? format(new Date(w.withdrawalDate), 'dd MMM yyyy')
                    : '—'}
                </td>
                <td style={{ border: '1px solid #ccc', padding: '5px 8px', fontSize: '11px', color: '#111', wordBreak: 'break-word' }}>
                  {w.requestedForName || '—'}
                </td>
                <td style={{ border: '1px solid #ccc', padding: '5px 8px', fontSize: '11px', color: '#111', wordBreak: 'break-word' }}>
                  {w.departmentName || w.departmentId || '—'}
                </td>
                <td style={{ border: '1px solid #ccc', padding: '5px 8px', fontSize: '11px', color: '#111', textAlign: 'center' }}>
                  {w.items?.length ?? 0}
                </td>
                <td style={{ border: '1px solid #ccc', padding: '5px 8px', fontSize: '11px', fontWeight: 600, color: '#111' }}>
                  {statusLabel[w.status] ?? w.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={{ fontSize: '12px', color: '#666' }}>No withdrawal records found.</p>
      )}

      {/* Footer */}
      <div
        className="mt-6 pt-3"
        style={{ borderTop: '1px solid #ccc', fontSize: '10px', color: '#888', textAlign: 'right' }}
      >
        Total: {withdrawals.length} record{withdrawals.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
