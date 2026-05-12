import type { CSSProperties, ReactNode } from 'react';

export const pdfCell: CSSProperties = {
  border: '1px solid #555',
  padding: 6,
  verticalAlign: 'top',
};

export const pdfLabelCell: CSSProperties = {
  ...pdfCell,
  background: '#f0f0f0',
  fontWeight: 600,
  width: 200,
};

export const PdfSectionTitle = ({ children }: { children: ReactNode }) => (
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

export const PdfRow = ({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) => (
  <tr>
    <td style={pdfLabelCell}>{label}</td>
    <td style={pdfCell}>{value}</td>
  </tr>
);

export const pdfFormatRupiah = (n?: number | null): string =>
  n == null ? '—' : `Rp. ${Number(n).toLocaleString('id-ID')}`;
