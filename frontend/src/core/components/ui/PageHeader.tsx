
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
  return (
    <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6", 
      children ? "mb-4" : "mb-6"
    )}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
      
      {children}
    </div>
  );
};

export default PageHeader;
