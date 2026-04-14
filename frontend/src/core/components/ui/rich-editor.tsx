import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import { Pagination } from 'tiptap-pagination-breaks';
import generatePDF, { Margin, Resolution, usePDF } from 'react-to-pdf';
import { cn } from '@/core/lib/utils';
import { Button } from '@/core/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Table2,
  Trash2,
  Columns2,
  Rows2,
  Merge,
  SplitSquareHorizontal,
  FileDown,
  Eye,
  Loader2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface RichEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  pageLayout?: boolean;
  enablePdfExport?: boolean;
}

const EMPTY_DOC = '<p></p>';

/** Matches editor content inset; pagination uses padding only (pageMargin 0) to avoid double top gap. */
const PAGE_CONTENT_INSET = 'px-[96px] pt-10 pb-16';

const PDF_BUILD_OPTIONS = {
  method: 'build' as const,
  resolution: Resolution.MEDIUM,
  page: {
    margin: Margin.NONE,
    format: 'a4' as const,
    orientation: 'portrait' as const,
  },
  canvas: {
    mimeType: 'image/png' as const,
    qualityRatio: 1,
    useCORS: true,
    logging: false,
  },
};

export function RichEditor({
  value,
  onChange,
  className,
  disabled,
  pageLayout,
  enablePdfExport,
}: RichEditorProps) {
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const pdfFilename = useMemo(() => {
    // Keep it simple/consistent; callers can rename after download if needed.
    return 'safety-guidelines.pdf';
  }, []);

  // Do not pass options to usePDF — its merge ignores per-call options when hook options exist.
  const { targetRef } = usePDF();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Table.configure({
        resizable: false,
        HTMLAttributes: {
          class: 'border-collapse table-fixed w-full border border-border',
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: 'border-b border-border',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-border bg-muted px-3 py-2 font-semibold text-left',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-border px-3 py-2 align-top',
        },
      }),
      ...(pageLayout
        ? [
            Pagination.configure({
              pageHeight: 1056,
              pageWidth: 816,
              // Use 0 here; content inset comes from Tailwind padding on `.ProseMirror` only.
              pageMargin: 0,
              label: 'Page',
              showPageNumber: true,
            }),
          ]
        : []),
    ],
    content: value || EMPTY_DOC,
    editable: !disabled,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_th]:border [&_th]:border-border',
          pageLayout
            ? `min-h-[1056px] rounded-sm bg-transparent shadow-none ${PAGE_CONTENT_INSET}`
            : 'min-h-[200px] px-4 py-3',
        ),
      },
    },
  });

  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [editor, disabled]);

  useEffect(() => {
    if (!editor) return;
    const next = value || EMPTY_DOC;
    if (next !== editor.getHTML()) {
      editor.commands.setContent(next, false);
    }
  }, [editor, value]);

  const pdfHtml = value || EMPTY_DOC;

  useEffect(() => {
    if (!enablePdfExport || !pdfOpen) {
      return undefined;
    }

    let cancelled = false;
    setPdfGenerating(true);
    setPdfError(null);

    void (async () => {
      try {
        await new Promise((r) => setTimeout(r, 200));
        const pdf = await generatePDF(targetRef, {
          ...PDF_BUILD_OPTIONS,
          filename: pdfFilename,
        });
        if (cancelled || !pdf) return;
        const url = URL.createObjectURL(pdf.output('blob'));
        setPdfPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      } catch (e) {
        if (!cancelled) {
          setPdfError(e instanceof Error ? e.message : 'Failed to generate PDF');
        }
      } finally {
        if (!cancelled) {
          setPdfGenerating(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      setPdfPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setPdfGenerating(false);
    };
  }, [enablePdfExport, pdfFilename, pdfOpen, targetRef, value]);

  const handleDownloadPdf = useCallback(() => {
    if (!pdfPreviewUrl) return;
    const a = document.createElement('a');
    a.href = pdfPreviewUrl;
    a.download = pdfFilename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [pdfFilename, pdfPreviewUrl]);

  if (!editor) {
    return null;
  }

  const tableActive = editor.isActive('table');

  return (
    <div
      className={cn(
        'rounded-md border border-input bg-background ring-offset-background',
        pageLayout && 'rich-editor-pageLayout',
        disabled && 'pointer-events-none opacity-60',
        className,
      )}
    >
      {enablePdfExport && (
        <div
          ref={targetRef}
          style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '210mm' }}
          aria-hidden="true"
        >
          <div className={cn('bg-background', PAGE_CONTENT_INSET)}>
            <div
              className="prose prose-sm max-w-none [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_th]:border [&_th]:border-border"
              // The HTML comes from our own editor, not arbitrary user HTML.
              dangerouslySetInnerHTML={{ __html: pdfHtml }}
            />
          </div>
        </div>
      )}

      {pageLayout && (
        <style>{`
          .rich-editor-pageLayout .ProseMirror {
            margin: 0 auto !important;
          }
          .rich-editor-pageLayout .page-break {
            height: 20px;
            width: 100%;
            border-top: 1px dashed hsl(var(--border));
            margin: 10px 0;
            position: relative;
          }
          .rich-editor-pageLayout .page-number {
            position: absolute;
            right: 0;
            top: -10px;
            font-size: 12px;
            color: hsl(var(--muted-foreground));
            background: hsl(var(--background));
            padding: 0 4px;
          }
        `}</style>
      )}

      <div
        className={cn(
          'flex flex-wrap items-center gap-1 border-b border-border bg-muted/40 p-2',
          pageLayout && 'sticky top-0 z-10',
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-muted' : ''}
          aria-pressed={editor.isActive('bold')}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-muted' : ''}
          aria-pressed={editor.isActive('italic')}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'bg-muted' : ''}
          aria-pressed={editor.isActive('strike')}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <span className="mx-1 w-px self-stretch bg-border" aria-hidden />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'bg-muted' : ''}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'bg-muted' : ''}
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        <span className="mx-1 w-px self-stretch bg-border" aria-hidden />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-muted' : ''}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-muted' : ''}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'bg-muted' : ''}
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive('codeBlock') ? 'bg-muted' : ''}
        >
          <Code className="h-4 w-4" />
        </Button>

        {enablePdfExport && (
          <div className="ml-auto flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPdfOpen(true)}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview PDF
            </Button>
          </div>
        )}
      </div>

      <div className={cn('flex flex-wrap gap-1 border-b border-border bg-muted/20 p-2', pageLayout && 'sticky top-[48px] z-10')}>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
        >
          <Table2 className="mr-1 h-4 w-4" />
          Table
        </Button>
        {tableActive && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              disabled={!editor.can().addColumnBefore()}
            >
              <Columns2 className="mr-1 h-3 w-3" />
              Col before
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              disabled={!editor.can().addColumnAfter()}
            >
              Col after
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().deleteColumn().run()}
              disabled={!editor.can().deleteColumn()}
            >
              Del col
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().addRowBefore().run()}
              disabled={!editor.can().addRowBefore()}
            >
              <Rows2 className="mr-1 h-3 w-3" />
              Row before
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().addRowAfter().run()}
              disabled={!editor.can().addRowAfter()}
            >
              Row after
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().deleteRow().run()}
              disabled={!editor.can().deleteRow()}
            >
              Del row
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().mergeCells().run()}
              disabled={!editor.can().mergeCells()}
            >
              <Merge className="mr-1 h-3 w-3" />
              Merge
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().splitCell().run()}
              disabled={!editor.can().splitCell()}
            >
              <SplitSquareHorizontal className="mr-1 h-3 w-3" />
              Split
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().deleteTable().run()}
              disabled={!editor.can().deleteTable()}
            >
              <Trash2 className="mr-1 h-3 w-3 text-destructive" />
              Del table
            </Button>
          </>
        )}
      </div>

      {editor && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 100 }}
          shouldShow={({ editor: ed }) => ed.isActive('table')}
        >
          <div className="flex flex-wrap gap-1 rounded-md border border-border bg-popover p-1 shadow-md">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => editor.chain().focus().mergeCells().run()}
              disabled={!editor.can().mergeCells()}
            >
              Merge cells
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => editor.chain().focus().splitCell().run()}
              disabled={!editor.can().splitCell()}
            >
              Split cell
            </Button>
          </div>
        </BubbleMenu>
      )}

      {pageLayout ? (
        <div
          className={cn(
            'h-[650px] overflow-y-auto p-4',
            // A Google Docs-like canvas
            'bg-muted/40',
            // Repeating fixed-height "paper" pages behind the editor
            // - page: 1056px height (Letter-ish)
            // - gap: 32px between pages
            // - width: 816px (Letter-ish)
            // Background is centered and repeats vertically.
            // We draw both page fill + 1px top/bottom borders.
            '[--pageWidth:816px] [--pageHeight:1056px] [--pageGap:32px]',
            'bg-[linear-gradient(to_bottom,hsl(var(--background))_0,var(--pageHeight),transparent_var(--pageHeight),transparent_calc(var(--pageHeight)+var(--pageGap))),linear-gradient(to_bottom,hsl(var(--border))_0,transparent_1px,transparent_calc(var(--pageHeight)-1px),hsl(var(--border))_calc(var(--pageHeight)-1px),hsl(var(--border))_var(--pageHeight),transparent_var(--pageHeight),transparent_calc(var(--pageHeight)+var(--pageGap)))]',
            'bg-[length:var(--pageWidth)_calc(var(--pageHeight)+var(--pageGap)),var(--pageWidth)_calc(var(--pageHeight)+var(--pageGap))] bg-[position:center_top,center_top] bg-repeat-y',
          )}
        >
          <EditorContent editor={editor} />
        </div>
      ) : (
        <EditorContent editor={editor} />
      )}

      {enablePdfExport && (
        <Dialog open={pdfOpen} onOpenChange={setPdfOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Safety guidelines PDF preview</DialogTitle>
            </DialogHeader>

            <div className="relative max-h-[70vh] min-h-[400px] overflow-hidden rounded-md border bg-muted/30">
              {pdfGenerating && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/80">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
                  <p className="text-sm text-muted-foreground">Generating PDF…</p>
                </div>
              )}
              {pdfError && (
                <div className="p-4 text-sm text-destructive" role="alert">
                  {pdfError}
                </div>
              )}
              {pdfPreviewUrl && (
                <iframe
                  title="Safety guidelines PDF preview"
                  src={pdfPreviewUrl}
                  className="h-[min(70vh,800px)] w-full min-h-[400px] border-0"
                />
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPdfOpen(false)}
              >
                Close
              </Button>
              <Button
                type="button"
                disabled={!pdfPreviewUrl || pdfGenerating || Boolean(pdfError)}
                onClick={handleDownloadPdf}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
