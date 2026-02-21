
import { ReactNode } from "react";
import { Button } from "@/core/components/ui/button";
import { cn } from "@/core/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string | ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
}

const PageHeader = ({ title, subtitle, children, actions }: PageHeaderProps) => {
  const hasRightContent = actions || children;

  return (
    <div className={cn("flex flex-col gap-4 mb-6", 
      children ? "mb-4" : "mb-6"
    )}>
      {/* Main header row: Left (title/subtitle) and Right (actions/tabs) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left side: Title and Subtitle */}
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight break-words">{title}</h1>
          {subtitle != null && (
            <div className="text-muted-foreground mt-1 break-words min-w-0">
              {typeof subtitle === 'string' ? <p>{subtitle}</p> : subtitle}
            </div>
          )}
        </div>

        {/* Right side: Actions and Tabs */}
        {hasRightContent && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4 flex-shrink-0">
            {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
            {children && (
              <div className="flex-shrink-0">
                {children}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
