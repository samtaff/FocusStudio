import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  Copy, 
  Check, 
  Download, 
  Eye,
  Move
} from 'lucide-react';
import { 
  FocusZone, 
  LoadedImage, 
  GlobalStyleSettings,
  AnnotationArrow,
  BlurZone,
  MaskShape,
  TriangleShape,
  CalloutVignette
} from '../types';
import { 
  drawComposition, 
  calculateExportBounds 
} from '../utils/canvasRenderer';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: LoadedImage | null;
  focuses: FocusZone[];
  arrows: AnnotationArrow[];
  globalStyles: GlobalStyleSettings;
  blurZones: BlurZone[];
  maskShapes: MaskShape[];
  triangles: TriangleShape[];
  calloutVignette: CalloutVignette | null;
  onCopyClipboard: () => void;
  onExportPng: () => void;
  copied: boolean;
  isDarkMode?: boolean;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  image,
  focuses,
  arrows,
  globalStyles,
  blurZones,
  maskShapes,
  triangles,
  calloutVignette,
  onCopyClipboard,
  onExportPng,
  copied,
  isDarkMode = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Pan and Zoom states
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; panX: number; panY: number }>({
    mouseX: 0,
    mouseY: 0,
    panX: 0,
    panY: 0,
  });

  // Calculate composition export bounds
  const activeArrows = useMemo(() => arrows.filter((a) => a.visible), [arrows]);
  const bounds = useMemo(() => {
    return calculateExportBounds(
      image,
      focuses,
      activeArrows,
      16,
      globalStyles.workspaceWidth,
      blurZones,
      maskShapes,
      triangles,
      calloutVignette
    );
  }, [image, focuses, activeArrows, globalStyles.workspaceWidth, blurZones, maskShapes, triangles, calloutVignette]);

  // Fit calculation to display full visual comfortably inside the modal viewport
  const fitToView = useCallback(() => {
    if (!containerRef.current || bounds.exportWidth <= 0 || bounds.exportHeight <= 0) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }
    const rect = containerRef.current.getBoundingClientRect();
    const availableW = Math.max(60, rect.width - 60);
    const availableH = Math.max(60, rect.height - 70);
    const scaleX = availableW / bounds.exportWidth;
    const scaleY = availableH / bounds.exportHeight;
    const fitScale = Math.min(scaleX, scaleY, 1.4);
    const roundedFit = Math.max(0.25, Math.min(3, Math.round(fitScale * 100) / 100));
    setZoom(roundedFit);
    setPan({ x: 0, y: 0 });
  }, [bounds.exportWidth, bounds.exportHeight]);

  // Initial fit when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        fitToView();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, fitToView]);

  // Render high-res visual on canvas whenever relevant state changes
  useEffect(() => {
    if (!isOpen || !canvasRef.current || !image) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Render at 2x resolution for crisp zoom inspection
    const internalScale = 2;
    const w = bounds.exportWidth * internalScale;
    const h = bounds.exportHeight * internalScale;

    canvas.width = w;
    canvas.height = h;
    canvas.style.width = `${bounds.exportWidth}px`;
    canvas.style.height = `${bounds.exportHeight}px`;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.scale(internalScale, internalScale);
    ctx.translate(bounds.offsetX, bounds.offsetY);

    drawComposition(ctx, image, focuses, {
      interactive: false,
      globalStyles,
      arrows: activeArrows,
      showGuides: false,
      showRulers: false,
      skipClear: true,
      blurZones,
      maskShapes,
      triangles,
      calloutVignette,
      previewMode: true,
    });

    ctx.restore();
  }, [isOpen, image, focuses, activeArrows, globalStyles, bounds, blurZones, maskShapes, triangles, calloutVignette]);

  // Wheel zoom handler centered around cursor position
  useEffect(() => {
    if (!isOpen) return;
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - rect.width / 2;
      const mouseY = e.clientY - rect.top - rect.height / 2;

      const delta = e.deltaY < 0 ? 1.15 : 0.87;
      setZoom((prevZoom) => {
        const nextZoom = Math.max(0.2, Math.min(5, Math.round(prevZoom * delta * 100) / 100));
        const factor = nextZoom / prevZoom;
        setPan((prevPan) => ({
          x: mouseX - (mouseX - prevPan.x) * factor,
          y: mouseY - (mouseY - prevPan.y) * factor,
        }));
        return nextZoom;
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [isOpen]);

  // Keyboard navigation inside modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoom((z) => Math.min(5, Math.round(z * 1.25 * 100) / 100));
        return;
      }
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setZoom((z) => Math.max(0.2, Math.round((z / 1.25) * 100) / 100));
        return;
      }
      if (e.key === '0') {
        e.preventDefault();
        fitToView();
        return;
      }
      if (e.key === '1') {
        e.preventDefault();
        setZoom(1);
        setPan({ x: 0, y: 0 });
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, fitToView]);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // left click only
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;
    setPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* 
        Container Div holding all elements:
        Glassmorphism with low opacity, refined backdrop-blur, elegant borders and shadows
      */}
      <div 
        className={`relative flex flex-col w-full max-w-3xl h-[84vh] max-h-[780px] rounded-3xl overflow-hidden transition-all backdrop-blur-2xl border ${
          isDarkMode
            ? 'bg-[#181818]/45 border-white/15 text-white shadow-[0_25px_60px_-10px_rgba(0,0,0,0.7)]'
            : 'bg-white/45 border-white/70 text-[#111111] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.18)]'
        }`}
      >
        {/* 
          Header: 100% Fully Responsive Layout
          Doesn't wrap awkwardly or overflow on mobile / tablet / small widths
        */}
        <div className={`flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b shrink-0 transition-colors backdrop-blur-md ${
          isDarkMode ? 'border-white/10 bg-white/[0.03]' : 'border-black/[0.06] bg-white/30'
        }`}>
          {/* Left Title & Specs (collapses/truncates cleanly) */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#0088cc]/15 flex items-center justify-center text-[#0088cc] shrink-0">
              <Eye className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h3 className="font-semibold text-xs sm:text-sm tracking-tight truncate">
                  Aperçu du visuel
                </h3>
                <span className={`text-[9px] sm:text-[10px] uppercase font-bold px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 ${
                  isDarkMode ? 'bg-white/10 text-[#aaaaaa]' : 'bg-black/5 text-[#666666]'
                }`}>
                  Net
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-[#777777] dark:text-[#999999] font-mono mt-0.5 truncate">
                <span>{bounds.exportWidth} × {bounds.exportHeight} px</span>
                <span>•</span>
                <span>{focuses.length} focus</span>
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Quick Copy Button */}
            <button
              onClick={onCopyClipboard}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-2xs cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : isDarkMode
                    ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                    : 'bg-black/5 hover:bg-black/10 text-[#111111] border border-black/5'
              }`}
              title="Copier l'image dans le presse-papier"
            >
              {copied ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copié !' : 'Copier'}</span>
            </button>

            {/* Direct Export PNG Button */}
            <button
              onClick={onExportPng}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#0088cc] hover:bg-[#0077b3] text-white transition-all shadow-2xs cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              title="Télécharger l'image PNG finale"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Télécharger</span>
            </button>

            <div className={`w-px h-5 mx-0.5 ${isDarkMode ? 'bg-white/15' : 'bg-black/10'}`} />

            {/* Close Button */}
            <button
              onClick={onClose}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                isDarkMode 
                  ? 'text-[#aaaaaa] hover:text-white hover:bg-white/10' 
                  : 'text-[#666666] hover:text-black hover:bg-black/5'
              }`}
              title="Fermer la prévisualisation (Échap)"
            >
              <X className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          </div>
        </div>

        {/* 
          Viewport Area:
          Frosted glassmorphism background with low opacity
        */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`flex-1 relative overflow-hidden flex items-center justify-center transition-colors backdrop-blur-md ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          } ${
            isDarkMode ? 'bg-black/25' : 'bg-white/20'
          }`}
        >
          {/* Pan & Zoom Transform Layer */}
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.05s ease-out',
            }}
            className="flex items-center justify-center pointer-events-none"
          >
            {/* 
              Visual Card:
              Strictly pure white background by default, no damier
            */}
            <div className="relative rounded-xl overflow-hidden bg-white shadow-[0_15px_45px_rgba(0,0,0,0.18)] border border-black/5">
              <canvas
                ref={canvasRef}
                className="block max-w-none"
                style={{ imageRendering: 'auto' }}
              />
            </div>
          </div>

          {/* 
            Floating Ergonomic Zoom Dock:
            Frosted Glassmorphism pill placed gracefully at the bottom of the viewport
            Does not cramp the header and remains 100% accessible on any screen
          */}
          <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-xl border shadow-lg transition-all ${
            isDarkMode
              ? 'bg-[#1e1e1e]/75 border-white/15 text-white'
              : 'bg-white/80 border-black/10 text-[#111111]'
          }`}>
            {/* Zoom Out Button */}
            <button
              onClick={() => setZoom((z) => Math.max(0.2, Math.round((z / 1.25) * 100) / 100))}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                isDarkMode ? 'hover:bg-white/10 text-[#cccccc]' : 'hover:bg-black/5 text-[#555555]'
              }`}
              title="Zoom arrière (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            {/* Continuous Zoom Slider on larger displays */}
            <input
              type="range"
              min="0.25"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="hidden sm:inline-block w-16 md:w-24 h-1.5 accent-[#0088cc] cursor-pointer mx-1"
              title="Niveau de zoom"
            />

            {/* Zoom In Button */}
            <button
              onClick={() => setZoom((z) => Math.min(5, Math.round(z * 1.25 * 100) / 100))}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                isDarkMode ? 'hover:bg-white/10 text-[#cccccc]' : 'hover:bg-black/5 text-[#555555]'
              }`}
              title="Zoom avant (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <div className={`w-px h-4 mx-0.5 ${isDarkMode ? 'bg-white/15' : 'bg-black/10'}`} />

            {/* Percentage Display / 100% Button */}
            <button
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className={`px-2 py-0.5 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
                Math.abs(zoom - 1) < 0.05
                  ? 'bg-[#0088cc] text-white'
                  : isDarkMode
                    ? 'hover:bg-white/10 text-[#aaaaaa]'
                    : 'hover:bg-black/5 text-[#666666]'
              }`}
              title="Taille réelle 100% (Touche 1)"
            >
              {Math.round(zoom * 100)}%
            </button>

            {/* Fit to View Button */}
            <button
              onClick={fitToView}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                isDarkMode ? 'hover:bg-white/10 text-[#cccccc]' : 'hover:bg-black/5 text-[#555555]'
              }`}
              title="Ajuster à l'écran (Touche 0)"
            >
              <Maximize2 className="w-3 h-3" />
              <span className="hidden md:inline">Ajuster</span>
            </button>

            {/* Reset Center Button */}
            <button
              onClick={() => setPan({ x: 0, y: 0 })}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                isDarkMode ? 'hover:bg-white/10 text-[#aaaaaa]' : 'hover:bg-black/5 text-[#666666]'
              }`}
              title="Recentrer"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Bottom Status / Navigation Hints */}
        <div className={`px-4 sm:px-6 py-2 border-t shrink-0 flex items-center justify-between text-[10px] sm:text-[11px] transition-colors backdrop-blur-md ${
          isDarkMode 
            ? 'border-white/10 bg-white/[0.02] text-[#888888]' 
            : 'border-black/[0.06] bg-white/30 text-[#777777]'
        }`}>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 truncate">
            <div className="flex items-center gap-1.5 shrink-0">
              <Move className="w-3 h-3 text-[#0088cc]" />
              <span>Glisser pour déplacer</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline truncate">Molette pour zoomer</span>
          </div>

          <div className="flex items-center gap-2 font-mono shrink-0">
            <span>(Échap pour fermer)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
