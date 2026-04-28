import type { ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { cn } from '@/core/lib/utils';

export interface EmailTemplateBodyPreviewSectionProps {
  /** HTML string for the Preview tab (may include Handlebars placeholders). */
  html: string;
  /** Editor or read-only source (Code tab). */
  codeSlot: ReactNode;
  className?: string;
}

function previewSrcDoc(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;font:14px system-ui;color:#737373;display:flex;align-items:center;justify-content:center;min-height:200px">No content to preview</body></html>`;
  }
  return trimmed;
}

export function EmailTemplateBodyPreviewSection({
  html,
  codeSlot,
  className,
}: EmailTemplateBodyPreviewSectionProps) {
  return (
    <Tabs defaultValue="code" className={cn('w-full', className)}>
      <TabsList>
        <TabsTrigger value="code">Code</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
      </TabsList>
      <TabsContent value="code" className="mt-3">
        {codeSlot}
      </TabsContent>
      <TabsContent value="preview" className="mt-3">
        <iframe
          title="Email body preview"
          sandbox=""
          srcDoc={previewSrcDoc(html)}
          className="w-full min-h-[240px] rounded-md border bg-background"
        />
      </TabsContent>
    </Tabs>
  );
}
