import React, { useState } from 'react';
import { cn } from '@/core/lib/utils';
import { useAppBranding } from '@/modules/settings/hooks/useSettings';

export default function PdfAppHeader({
  className,
}: {
  className?: string;
}) {
  const { appName, logoLandscapeUrl } = useAppBranding();
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      {logoLandscapeUrl && !logoFailed ? (
        <img
          src={logoLandscapeUrl}
          alt={`${appName} logo`}
          className="h-10 w-auto object-contain"
          onError={() => setLogoFailed(true)}
        />
      ) : (
        <div className="text-xl font-bold text-gray-900">{appName}</div>
      )}
    </div>
  );
}

