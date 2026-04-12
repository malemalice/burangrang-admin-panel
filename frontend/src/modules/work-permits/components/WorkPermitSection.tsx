import type { ComponentProps, ReactNode } from 'react';
import { CardTitle } from '@/core/components/ui/card';
import { cn } from '@/core/lib/utils';

export interface WorkPermitSectionProps {
  /** Stable id for aria-labelledby (e.g. work-permit-section-b). */
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * Canonical PRD section shell (A–F): section title above nested cards; use
 * {@link WorkPermitSubsectionTitle} inside cards so hierarchy stays correct.
 */
export function WorkPermitSection({ id, title, description, children }: WorkPermitSectionProps) {
  return (
    <section aria-labelledby={id} className="space-y-4">
      <div className="space-y-1.5">
        <h2 id={id} className="text-xl font-semibold tracking-tight text-foreground break-words">
          {title}
        </h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

/** Card title at subsection scale (below PRD section h2). */
export function WorkPermitSubsectionTitle({
  className,
  ...props
}: ComponentProps<typeof CardTitle>) {
  return (
    <CardTitle
      className={cn('text-base font-semibold leading-snug tracking-normal', className)}
      {...props}
    />
  );
}
