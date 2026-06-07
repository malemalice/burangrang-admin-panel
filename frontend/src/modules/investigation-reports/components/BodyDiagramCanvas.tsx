import { useEffect, useRef, useState } from 'react';
import { Button } from '@/core/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { cn } from '@/core/lib/utils';
import uploadService from '@/modules/uploads/services/uploadService';
import { toast } from 'sonner';

interface BodyDiagramCanvasProps {
  value?: string | null;
  onChange?: (url: string | null) => void;
  readOnly?: boolean;
  uploadCategoryId?: string | null;
}

const STROKE_COLORS = [
  { hex: '#ef4444', label: 'Red' },
  { hex: '#1a1a1a', label: 'Black' },
  { hex: '#3b82f6', label: 'Blue' },
];

const BG_IMAGE_SRC = '/images/placeholder_body_injuries.png';

const BodyDiagramCanvas = ({
  value,
  onChange,
  readOnly = false,
  uploadCategoryId,
}: BodyDiagramCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgImgRef = useRef<HTMLImageElement | null>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const isDrawingRef = useRef(false);
  const hasUnsavedStrokeRef = useRef(false);
  const skipNextValueReloadRef = useRef(false);

  const [strokeColor, setStrokeColor] = useState(STROKE_COLORS[0].hex);
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hasContent, setHasContent] = useState(!!value);

  const getCtx = () => canvasRef.current?.getContext('2d') ?? null;

  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    if (bgImgRef.current) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(bgImgRef.current, 0, 0);
    }
  };

  const loadAnnotation = (url: string, ctx: CanvasRenderingContext2D, bgDrawn: boolean) => {
    const annotImg = new Image();
    annotImg.crossOrigin = 'anonymous';
    annotImg.onload = () => {
      if (!bgDrawn) drawBackground(ctx);
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(annotImg, 0, 0, canvasRef.current!.width, canvasRef.current!.height);
    };
    annotImg.src = url;
  };

  // Load background image on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || readOnly) return;

    const img = new Image();
    img.onload = () => {
      bgImgRef.current = img;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      drawBackground(ctx);
      if (value) {
        loadAnnotation(value, ctx, true);
      }
    };
    img.src = BG_IMAGE_SRC;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly]);

  // Reload annotation when value changes externally
  useEffect(() => {
    if (skipNextValueReloadRef.current) {
      skipNextValueReloadRef.current = false;
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas || readOnly || !bgImgRef.current) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground(ctx);
    if (value) {
      loadAnnotation(value, ctx, true);
      setHasContent(true);
    } else {
      setHasContent(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const applyCtxSettings = (ctx: CanvasRenderingContext2D) => {
    ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
    ctx.strokeStyle = isEraser ? 'rgba(0,0,0,1)' : strokeColor;
    ctx.lineWidth = isEraser ? strokeWidth * 3 : strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (readOnly) return;
    e.preventDefault();
    const ctx = getCtx();
    if (!ctx) return;
    isDrawingRef.current = true;
    const pos = getCanvasPos(e);
    lastPosRef.current = pos;
    applyCtxSettings(ctx);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current || readOnly) return;
    e.preventDefault();
    const ctx = getCtx();
    if (!ctx || !lastPosRef.current) return;
    const pos = getCanvasPos(e);
    applyCtxSettings(ctx);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPosRef.current = pos;
    hasUnsavedStrokeRef.current = true;
    setHasContent(true);
  };

  const handlePointerUp = (e?: React.MouseEvent | React.TouchEvent) => {
    e?.preventDefault();
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    if (hasUnsavedStrokeRef.current) {
      hasUnsavedStrokeRef.current = false;
      handleUpload();
    }
  };

  const handleUpload = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !uploadCategoryId) return;
    setIsUploading(true);
    try {
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
      );
      const file = new File([blob], `body-diagram-${Date.now()}.png`, { type: 'image/png' });
      const res = await uploadService.uploadFile(file, uploadCategoryId, true);
      const url = uploadService.getPublicFileUrl(res.id);
      skipNextValueReloadRef.current = true;
      onChange?.(url);
    } catch {
      toast.error('Failed to save body diagram. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground(ctx);
    setHasContent(false);
    onChange?.(null);
  };

  if (readOnly) {
    if (value) {
      return (
        <img
          src={value}
          alt="Body diagram annotation / Diagram tubuh"
          className="max-w-sm rounded border border-border"
        />
      );
    }
    return (
      <div className="relative inline-block">
        <img
          src={BG_IMAGE_SRC}
          alt="Body diagram placeholder"
          className="max-w-sm opacity-40"
        />
        <p className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground bg-transparent">
          No diagram drawn / Tidak ada diagram
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          {STROKE_COLORS.map((c) => (
            <button
              key={c.hex}
              type="button"
              title={c.label}
              onClick={() => { setStrokeColor(c.hex); setIsEraser(false); }}
              className={cn(
                'h-6 w-6 rounded-full border-2 transition-transform',
                strokeColor === c.hex && !isEraser
                  ? 'border-foreground scale-110 shadow'
                  : 'border-transparent',
              )}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>

        <Select
          value={String(strokeWidth)}
          onValueChange={(v) => setStrokeWidth(Number(v))}
        >
          <SelectTrigger className="h-7 w-24 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">Thin</SelectItem>
            <SelectItem value="4">Medium</SelectItem>
            <SelectItem value="8">Thick</SelectItem>
          </SelectContent>
        </Select>

        <Button
          type="button"
          size="sm"
          variant={isEraser ? 'secondary' : 'outline'}
          className="h-7 text-xs"
          onClick={() => setIsEraser((prev) => !prev)}
        >
          Eraser
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 text-xs text-destructive hover:text-destructive"
          disabled={!hasContent}
          onClick={handleClear}
        >
          Clear
        </Button>

        {isUploading && (
          <span className="text-xs text-muted-foreground">Saving…</span>
        )}
      </div>

      {/* Canvas */}
      <div
        className="border border-border rounded-md overflow-hidden bg-white inline-block"
        style={{ touchAction: 'none', maxWidth: '100%' }}
      >
        <canvas
          ref={canvasRef}
          className="block"
          style={{ maxWidth: '100%', cursor: isEraser ? 'cell' : 'crosshair' }}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Draw on the body diagram to mark injured areas. / Gambar pada diagram tubuh untuk menandai bagian yang cedera.
      </p>
    </div>
  );
};

export default BodyDiagramCanvas;
