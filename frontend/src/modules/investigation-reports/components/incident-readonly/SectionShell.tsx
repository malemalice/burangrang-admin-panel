import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { PdfSectionTitle } from './pdf-shared';

export type SectionVariant = 'card' | 'plain' | 'pdf';

interface SectionShellProps {
  variant: SectionVariant;
  title: string;
  headerExtra?: ReactNode;
  children: ReactNode;
}

/**
 * Wraps section content based on the rendering surface.
 * - 'card' (form/detail page): shadcn Card with header
 * - 'plain': just children (caller provides its own wrapper)
 * - 'pdf': inline-styled heading suitable for react-to-pdf capture
 */
const SectionShell = ({
  variant,
  title,
  headerExtra,
  children,
}: SectionShellProps) => {
  if (variant === 'pdf') {
    return (
      <>
        <PdfSectionTitle>{title}</PdfSectionTitle>
        {children}
      </>
    );
  }
  if (variant === 'plain') {
    return <>{children}</>;
  }
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle>{title}</CardTitle>
          {headerExtra}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};

export default SectionShell;
