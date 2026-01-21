
import { ReactNode } from "react";
import { Button } from "@/core/components/ui/button";
import { cn } from "@/core/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
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
        <div className="flex-shrink-0">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
        </div>

        {/* Right side: Actions and Tabs */}
        {hasRightContent && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
            {actions && <div className="flex items-center gap-2">{actions}</div>}
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
