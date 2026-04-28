import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useAppBranding } from '@/modules/settings/hooks/useSettings';
import { cn } from '@/core/lib/utils';

export type PublicAppModuleHeaderProps = {
  moduleTitle: string;
  moduleDescription?: string;
  /**
   * Large, high-contrast icon so users immediately see which public module they are on.
   * Pass a distinct Lucide icon per flow (e.g. work permit vs health declaration).
   */
  moduleIcon: LucideIcon;
  className?: string;
};

/**
 * Public token pages: app branding (from public /settings/app) + current module context.
 */
export function PublicAppModuleHeader({
  moduleTitle,
  moduleDescription,
  moduleIcon: ModuleIcon,
  className,
}: PublicAppModuleHeaderProps) {
  const { appName, logoLandscapeUrl, loginTagline } = useAppBranding();
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <header className={cn('border-b-2 border-primary/20 bg-muted/30', className)}>
      <div className="container mx-auto max-w-4xl px-4 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0 space-y-1">
            {logoLandscapeUrl && !logoFailed ? (
              <img
                src={logoLandscapeUrl}
                alt={appName}
                className="max-h-10 w-auto object-contain object-left"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <p className="text-lg font-semibold tracking-tight text-foreground">{appName}</p>
            )}
            {loginTagline ? (
              <p className="text-xs text-muted-foreground">{loginTagline}</p>
            ) : null}
          </div>
          <div className="flex min-w-0 max-w-lg items-start gap-3 sm:shrink-0">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-primary/40 bg-primary/10 text-primary shadow-sm"
              aria-hidden
            >
              <ModuleIcon className="h-7 w-7" strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1 space-y-1 text-left">
              <h2 className="text-balance text-lg font-bold leading-tight tracking-tight text-foreground">
                {moduleTitle}
              </h2>
              {moduleDescription ? (
                <p className="text-pretty text-sm text-muted-foreground">{moduleDescription}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
