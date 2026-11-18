import React, { useState, useRef, useEffect } from 'react';
import { 
  Square, 
  Eye, 
  EyeOff,
  Maximize2,
  Plus,
  Minus,
  Trash2,
  Copy,
  Droplet,
  GripVertical,
  Triangle,
  Undo2,
  Redo2,
  RotateCcw,
  Download,
  Loader2,
  X,
  Hash,
  MousePointer2
} from 'lucide-react';
import { 
  FocusZone, 
  BlurZone, 
  MaskShape, 
  TriangleShape, 
  CalloutVignette 
} from '../types';

export type ToolType = 'select' | 'focus' | 'blur' | 'mask' | 'triangle' | 'callout' | 'zoom';
export type MenuType = 'focus' | 'callout' | 'blur' | 'mask' | 'triangle' | null;

interface VerticalToolPaletteProps {
  // Focus Zones
  focuses: FocusZone[];
  selectedFocus: FocusZone | null;
  onSelectFocus?: (id: string) => void;
  onAddFocus: (orientation?: 'horizontal' | 'vertical') => void;
  onDeleteFocus?: () => void;
  onDeleteFocusWithId?: (id: string) => void;
  onDuplicateFocus?: (id: string) => void;
  onUpdateFocus?: (id: string, updated: Partial<FocusZone>) => void;
  onRenumberFocuses?: () => void;
  onHoverFocus?: (id: string | null) => void;

  // Active Tool
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;

  // Blur Zones
  blurZones?: BlurZone[];
  selectedBlurId?: string | null;
  onSelectBlur?: (id: string | null) => void;
  onAddBlur: () => void;
  onDeleteBlur?: (id: string) => void;
  onDuplicateBlur?: (id: string) => void;
  onUpdateBlur?: (id: string, updated: Partial<BlurZone>) => void;

  // Mask Shapes
  maskShapes?: MaskShape[];
  selectedMaskId?: string | null;
  onSelectMask?: (id: string | null) => void;
  onAddMask: () => void;
  onDeleteMask?: (id: string) => void;
  onDuplicateMask?: (id: string) => void;
  onUpdateMask?: (id: string, updated: Partial<MaskShape>) => void;

  // Triangles
  triangles?: TriangleShape[];
  selectedTriangleId?: string | null;
  onSelectTriangle?: (id: string | null) => void;
  onAddTriangle?: () => void;
  onDeleteTriangle?: (id: string) => void;
  onDuplicateTriangle?: (id: string) => void;
  onUpdateTriangle?: (id: string, updated: Partial<TriangleShape>) => void;

  // Callout Vignette
  calloutVignette?: CalloutVignette | null;
  hasCallout?: boolean;
  onToggleCallout?: () => void;
  onUpdateCallout?: (updated: Partial<CalloutVignette>) => void;

  // Pan, Workspace & Handles
  isPanMode?: boolean;
  onTogglePanMode?: () => void;
  isDetecting?: boolean;
  showDetection?: boolean;
  onToggleDetection?: () => void;
  showHandles: boolean;
  onToggleHandles: () => void;
  onCenterWorkspace?: () => void;
  onResetShapes?: () => void;
  onToggleMiniWidget?: () => void;

  // Undo / Redo
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;

  // Preview & Export
  isPreviewMode?: boolean;
  onTogglePreview?: () => void;
  onExportClick?: () => void;
  isExporting?: boolean;
  isDarkMode?: boolean;
}

interface ExtraAction {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  className?: string;
}

interface RadialToolOptionsProps {
  isOpen: boolean;
  dirX: number;
  dirY?: number;
  extraX?: number;
  isHorizontal?: boolean;
  onAdd: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  canAdd?: boolean;
  canDuplicate?: boolean;
  canDelete?: boolean;
  addTitle?: string;
  duplicateTitle?: string;
  deleteTitle?: string;
  pillContent?: React.ReactNode;
  extraAction?: ExtraAction;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

/**
 * Menu radial circulaire inspiré de Uiverse.io par Lucaasbre
 * Déploie des pastilles satellites circulaires animées :
 * - Option A : "+" (Ajouter)
 * - Option B : Dupliquer
 * - Option C : Pastille capsule (si fournie, ex: Z1 pour gérer/masquer le numéro)
 * - Option D : Poubelle (Supprimer)
 */
const RadialToolOptions: React.FC<RadialToolOptionsProps> = ({
  isOpen,
  dirX,
  dirY = 1,
  extraX = 0,
  isHorizontal = false,
  onAdd,
  onDuplicate,
  onDelete,
  canAdd = true,
  canDuplicate = true,
  canDelete = true,
  addTitle = "Ajouter (+)",
  duplicateTitle = "Dupliquer",
  deleteTitle = "Supprimer",
  pillContent,
  extraAction,
  onMouseEnter,
  onMouseLeave,
}) => {
  if (!isOpen) return null;

  const shiftX = (base: number) => `${dirX * (base + extraX)}px`;

  // Mode barre horizontale (très petite largeur d'écran) : déploiement vers le haut ou le bas
  if (isHorizontal) {
    return (
      <div
        className="absolute inset-0 pointer-events-none z-50 select-none"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <button
          type="button"
          title={!canAdd ? "Aucun élément actif" : addTitle}
          disabled={!canAdd}
          onClick={(e) => {
            e.stopPropagation();
            e.currentTarget.blur();
            if (canAdd) onAdd();
          }}
          className={`uiverse-radial-option pointer-events-auto ${!canAdd ? 'opacity-40 cursor-not-allowed' : ''}`}
          style={{
            ['--target-x' as string]: '-40px',
            ['--target-y' as string]: `${dirY * -44}px`,
          }}
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
        </button>

        <button
          type="button"
          title={duplicateTitle}
          disabled={!canDuplicate}
          onClick={(e) => {
            e.stopPropagation();
            e.currentTarget.blur();
            if (canDuplicate) onDuplicate();
          }}
          className={`uiverse-radial-option pointer-events-auto ${!canDuplicate ? 'opacity-40 cursor-not-allowed' : ''}`}
          style={{
            ['--target-x' as string]: '0px',
            ['--target-y' as string]: `${dirY * -52}px`,
          }}
        >
          <Copy className="w-3.5 h-3.5 stroke-[2.2]" />
        </button>

        <button
          type="button"
          title={deleteTitle}
          disabled={!canDelete}
          onClick={(e) => {
            e.stopPropagation();
            e.currentTarget.blur();
            if (canDelete) onDelete();
          }}
          className={`uiverse-radial-option pointer-events-auto ${!canDelete ? 'opacity-40 cursor-not-allowed' : ''}`}
          style={{
            ['--target-x' as string]: '40px',
            ['--target-y' as string]: `${dirY * -44}px`,
          }}
        >
          <Trash2 className="w-3.5 h-3.5 stroke-[2.2] text-rose-400 hover:text-rose-300" />
        </button>

        {extraAction && (
          <button
            type="button"
            title={extraAction.title}
            onClick={(e) => {
              e.stopPropagation();
              e.currentTarget.blur();
              extraAction.onClick();
            }}
            className={`uiverse-radial-option pointer-events-auto text-[#0088cc] hover:text-white ${extraAction.className || ''}`}
            style={{
              ['--target-x' as string]: '78px',
              ['--target-y' as string]: `${dirY * -44}px`,
            }}
          >
            {extraAction.icon}
          </button>
        )}

        {pillContent}
      </div>
    );
  }

  // Si un pillContent est fourni (ex: Pastille d'étape pour Z1)
  if (pillContent) {
    return (
      <div 
        className="absolute inset-0 pointer-events-none z-50 select-none"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* Option A: Ajouter (+) */}
        <button
          type="button"
          title={!canAdd ? "Aucune zone active" : addTitle}
          disabled={!canAdd}
          onClick={(e) => {
            e.stopPropagation();
            e.currentTarget.blur();
            if (canAdd) onAdd();
          }}
          className={`uiverse-radial-option pointer-events-auto ${
            !canAdd ? 'opacity-40 cursor-not-allowed' : ''
          }`}
          style={{
            ['--target-x' as string]: shiftX(34),
            ['--target-y' as string]: '-42px',
          }}
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Option B: Dupliquer */}
        <button
          type="button"
          title={duplicateTitle}
          disabled={!canDuplicate}
          onClick={(e) => {
            e.stopPropagation();
            e.currentTarget.blur();
            if (canDuplicate) onDuplicate();
          }}
          className={`uiverse-radial-option pointer-events-auto ${
            !canDuplicate ? 'opacity-40 cursor-not-allowed' : ''
          }`}
          style={{
            ['--target-x' as string]: shiftX(78),
            ['--target-y' as string]: '-42px',
          }}
        >
          <Copy className="w-3.5 h-3.5 stroke-[2.2]" />
        </button>

        {/* Option C: Capsule Pill (ex: Gérer & Masquer numéro de pastille) */}
        {pillContent}

        {/* Option D: Supprimer (Poubelle) */}
        <button
          type="button"
          title={deleteTitle}
          disabled={!canDelete}
          onClick={(e) => {
            e.stopPropagation();
            e.currentTarget.blur();
            if (canDelete) onDelete();
          }}
          className={`uiverse-radial-option pointer-events-auto ${
            !canDelete ? 'opacity-40 cursor-not-allowed' : ''
          }`}
          style={{
            ['--target-x' as string]: shiftX(extraAction ? 34 : 42),
            ['--target-y' as string]: '42px',
          }}
        >
          <Trash2 className="w-3.5 h-3.5 stroke-[2.2] text-rose-400 hover:text-rose-300" />
        </button>

        {/* Option E: Action supplémentaire (ex: Renuméroter 1..N) */}
        {extraAction && (
          <button
            type="button"
            title={extraAction.title}
            onClick={(e) => {
              e.stopPropagation();
              e.currentTarget.blur();
              extraAction.onClick();
            }}
            className={`uiverse-radial-option pointer-events-auto text-[#0088cc] hover:text-white ${extraAction.className || ''}`}
            style={{
              ['--target-x' as string]: shiftX(78),
              ['--target-y' as string]: '42px',
            }}
          >
            {extraAction.icon}
          </button>
        )}
      </div>
    );
  }

  return (
    <div 
      className="absolute inset-0 pointer-events-none z-50 select-none"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Option A: Ajouter (+) */}
      <button
        type="button"
        title={!canAdd ? "Aucun élément actif" : addTitle}
        disabled={!canAdd}
        onClick={(e) => {
          e.stopPropagation();
          e.currentTarget.blur();
          if (canAdd) onAdd();
        }}
        className={`uiverse-radial-option pointer-events-auto ${
          !canAdd ? 'opacity-40 cursor-not-allowed' : ''
        }`}
        style={{
          ['--target-x' as string]: shiftX(42),
          ['--target-y' as string]: '-38px',
        }}
      >
        <Plus className="w-4 h-4 stroke-[2.5]" />
      </button>

      {/* Option B: Dupliquer */}
      <button
        type="button"
        title={duplicateTitle}
        disabled={!canDuplicate}
        onClick={(e) => {
          e.stopPropagation();
          e.currentTarget.blur();
          if (canDuplicate) onDuplicate();
        }}
        className={`uiverse-radial-option pointer-events-auto ${
          !canDuplicate ? 'opacity-40 cursor-not-allowed' : ''
        }`}
        style={{
          ['--target-x' as string]: shiftX(54),
          ['--target-y' as string]: '0px',
        }}
      >
        <Copy className="w-3.5 h-3.5 stroke-[2.2]" />
      </button>

      {/* Option C: Supprimer (Poubelle) */}
      <button
        type="button"
        title={deleteTitle}
        disabled={!canDelete}
        onClick={(e) => {
          e.stopPropagation();
          e.currentTarget.blur();
          if (canDelete) onDelete();
        }}
        className={`uiverse-radial-option pointer-events-auto ${
          !canDelete ? 'opacity-40 cursor-not-allowed' : ''
        }`}
        style={{
          ['--target-x' as string]: shiftX(42),
          ['--target-y' as string]: '38px',
        }}
      >
        <Trash2 className="w-3.5 h-3.5 stroke-[2.2] text-rose-400 hover:text-rose-300" />
      </button>
    </div>
  );
};

export const VerticalToolPalette: React.FC<VerticalToolPaletteProps> = ({
  focuses,
  selectedFocus,
  onSelectFocus,
  onAddFocus,
  onDeleteFocus,
  onDeleteFocusWithId,
  onDuplicateFocus,
  onUpdateFocus,
  onRenumberFocuses,
  onHoverFocus,
  activeTool,
  onSelectTool,
  blurZones = [],
  selectedBlurId = null,
  onSelectBlur,
  onAddBlur,
  onDeleteBlur,
  onDuplicateBlur,
  onUpdateBlur,
  maskShapes = [],
  selectedMaskId = null,
  onSelectMask,
  onAddMask,
  onDeleteMask,
  onDuplicateMask,
  onUpdateMask,
  triangles = [],
  selectedTriangleId = null,
  onSelectTriangle,
  onAddTriangle,
  onDeleteTriangle,
  onDuplicateTriangle,
  onUpdateTriangle,
  calloutVignette,
  hasCallout,
  onToggleCallout,
  onUpdateCallout,
  isPanMode = false,
  onTogglePanMode,
  showHandles,
  onToggleHandles,
  onCenterWorkspace,
  onResetShapes,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  isPreviewMode,
  onTogglePreview,
  onExportClick,
  isExporting = false,
  isDarkMode = false,
}) => {
  // Menu radial ouvert ('focus' | 'callout' | 'blur' | 'mask' | 'triangle' | null)
  const [activeMenu, setActiveMenu] = useState<MenuType>(null);
  const [isTyping, setIsTyping] = useState(false);
  const menuLeaveTimerRef = useRef<number | null>(null);

  const handleMenuMouseEnter = () => {
    if (menuLeaveTimerRef.current) {
      window.clearTimeout(menuLeaveTimerRef.current);
      menuLeaveTimerRef.current = null;
    }
  };

  const handleMenuMouseLeave = () => {
    if (isTyping) return;
    if (menuLeaveTimerRef.current) {
      window.clearTimeout(menuLeaveTimerRef.current);
    }
    menuLeaveTimerRef.current = window.setTimeout(() => {
      setActiveMenu(null);
    }, 280);
  };

  const closeMenu = () => {
    if (menuLeaveTimerRef.current) {
      window.clearTimeout(menuLeaveTimerRef.current);
      menuLeaveTimerRef.current = null;
    }
    setActiveMenu(null);
  };

  // Taille de la fenêtre & résolution pour adapter la barre d'outils automatiquement
  const [viewport, setViewport] = useState<{ width: number; height: number }>(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1440,
    height: typeof window !== 'undefined' ? window.innerHeight : 900,
  }));

  const isHorizontal = viewport.width < 640;
  const isTwoCol = !isHorizontal && viewport.height < 560;
  const isCompact = !isHorizontal && !isTwoCol && (viewport.height < 760 || viewport.width < 1200);

  const btnSizeClass = isTwoCol ? 'w-7 h-7' : isCompact ? 'w-7 h-7' : 'w-8 h-8';
  const iconSizeClass = isTwoCol || isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4';

  const paletteRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const clampToViewport = (pos: { x: number; y: number }, vw = window.innerWidth, vh = window.innerHeight) => {
    const el = paletteRef.current;
    const estW = isHorizontal ? Math.min(vw - 16, 440) : isTwoCol ? 72 : isCompact ? 38 : 44;
    const estH = isHorizontal ? 48 : isTwoCol ? 250 : isCompact ? 395 : 495;
    const w = el && el.offsetWidth > 0 ? el.offsetWidth : estW;
    const h = el && el.offsetHeight > 0 ? el.offsetHeight : estH;
    const maxX = Math.max(8, vw - w - 8);
    const maxY = Math.max(8, vh - h - 8);
    return {
      x: Math.max(8, Math.min(maxX, pos.x)),
      y: Math.max(8, Math.min(maxY, pos.y)),
    };
  };

  // Position flottante (fixe, déplaçable librement et bornée à l'écran)
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1440;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 900;
    const defaultPos = vw < 640
      ? { x: 12, y: Math.max(70, vh - 68) }
      : { x: vw < 1024 ? 12 : 24, y: vh < 700 ? 68 : 100 };
    try {
      const saved = localStorage.getItem('tool_palette_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return {
            x: Math.max(8, Math.min(Math.max(8, vw - 60), parsed.x)),
            y: Math.max(8, Math.min(Math.max(8, vh - 260), parsed.y)),
          };
        }
      }
    } catch {
      // Fallback
    }
    return defaultPos;
  });

  // Gestion du déplacement libre
  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('.uiverse-radial-option') || target.closest('.uiverse-radial-pill')) {
      return;
    }

    isDraggingRef.current = true;
    dragOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    (paletteRef.current || target).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const clamped = clampToViewport({
      x: e.clientX - dragOffsetRef.current.x,
      y: e.clientY - dragOffsetRef.current.y,
    });
    setPosition(clamped);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        (paletteRef.current || (e.target as HTMLElement)).releasePointerCapture(e.pointerId);
        localStorage.setItem('tool_palette_pos', JSON.stringify(position));
      } catch {
        // Ignore
      }
    }
  };

  // Fermer les menus lors d'un clic en dehors et restaurer l'outil sélection
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Détection du redimensionnement de l'écran et de la taille réelle de la barre
  useEffect(() => {
    const syncViewportAndPosition = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setViewport({ width: vw, height: vh });
      setPosition((prev) => {
        const next = clampToViewport(prev, vw, vh);
        return next.x === prev.x && next.y === prev.y ? prev : next;
      });
    };

    syncViewportAndPosition();
    window.addEventListener('resize', syncViewportAndPosition);

    let ro: ResizeObserver | null = null;
    if (paletteRef.current && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        syncViewportAndPosition();
      });
      ro.observe(paletteRef.current);
    }

    return () => {
      window.removeEventListener('resize', syncViewportAndPosition);
      ro?.disconnect();
    };
  }, [isHorizontal, isTwoCol, isCompact]);

  // Détermine si le menu radial doit s'étendre vers la gauche/haut/bas selon les bords de l'écran
  const isNearRightEdge = position.x > (viewport.width - 140);
  const dirX = isNearRightEdge ? -1 : 1;
  const isNearTopEdge = position.y < 80;
  const dirY = isHorizontal && isNearTopEdge ? -1 : 1;
  const twoColExtraX = isTwoCol ? 32 : 0;

  const toggleMenu = (menu: MenuType) => {
    if (menuLeaveTimerRef.current) {
      window.clearTimeout(menuLeaveTimerRef.current);
      menuLeaveTimerRef.current = null;
    }
    const nextMenu = activeMenu === menu ? null : menu;
    setActiveMenu(nextMenu);
    // Opening or closing the radial options menus keeps the pointer in selection mode
    onSelectTool('select');
  };

  const targetFocus = selectedFocus || (focuses.length > 0 ? focuses[0] : null);
  const currentStepNumber = targetFocus?.stepNumber ?? 1;

  const handleStepNumberChange = (num: number) => {
    const safeNum = Math.max(1, Math.min(99, Math.round(num)));
    if (targetFocus && onUpdateFocus) {
      onUpdateFocus(targetFocus.id, { stepNumber: safeNum });
      if (onSelectFocus && targetFocus.id !== selectedFocus?.id) {
        onSelectFocus(targetFocus.id);
      }
    }
    onSelectTool('select');
  };

  const activeZoneLabel = selectedFocus 
    ? `Z${selectedFocus.stepNumber || 1}` 
    : (focuses.length > 0 ? `Z${focuses[0].stepNumber || 1}` : 'Z1');

  // Éléments actuellement sélectionnés
  const currentBlur = blurZones.find((b) => b.id === selectedBlurId) || (blurZones.length > 0 ? blurZones[0] : null);
  const currentMask = maskShapes.find((m) => m.id === selectedMaskId) || (maskShapes.length > 0 ? maskShapes[0] : null);
  const currentTriangle = triangles.find((t) => t.id === selectedTriangleId) || (triangles.length > 0 ? triangles[0] : null);

  const pillTargetX = isHorizontal
    ? (position.x < 100 ? '54px' : position.x > viewport.width - 160 ? '-54px' : '0px')
    : `${dirX * (72 + twoColExtraX)}px`;
  const pillTargetY = isHorizontal ? `${dirY * -90}px` : '0px';

  return (
    <div 
      ref={paletteRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onMouseEnter={handleMenuMouseEnter}
      onMouseLeave={handleMenuMouseLeave}
      className={`vertical-tool-palette fixed z-50 backdrop-blur-2xl transition-colors select-none ${
        isHorizontal
          ? 'rounded-2xl px-2 py-1.5 flex flex-row flex-wrap items-center justify-center gap-1 max-w-[calc(100vw-16px)]'
          : isTwoCol
            ? 'rounded-2xl px-1.5 py-1.5 grid grid-cols-2 place-items-center gap-1'
            : isCompact
              ? 'rounded-full px-1 py-1.5 flex flex-col items-center gap-0.5'
              : 'rounded-full px-1.5 py-2 flex flex-col items-center gap-1'
      } ${
        isDarkMode
          ? 'bg-black/30 hover:bg-black/40 border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.5)] ring-1 ring-white/5'
          : 'bg-white/35 hover:bg-white/45 border border-white/50 shadow-[0_12px_40px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.04]'
      }`}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      {/* Poignée de déplacement (drag handle) */}
      <div 
        className={`flex items-center justify-center cursor-grab active:cursor-grabbing rounded-full transition-colors ${
          isHorizontal
            ? 'w-4 h-7 mr-0.5'
            : isTwoCol
              ? 'col-span-2 w-full h-3.5 mb-0.5'
              : 'w-7 h-3.5 mb-0.5'
        } ${
          isDarkMode
            ? 'text-[#aaaaaa] hover:text-white hover:bg-white/10'
            : 'text-[#666666] hover:text-[#000000] hover:bg-white/30'
        }`}
        title="Glisser pour déplacer la barre d'outils n'importe où"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </div>

      {/* 0. OUTIL POINTEUR / SÉLECTION */}
      <button
        id="tool-select-pointer"
        type="button"
        data-palette-btn="true"
        onClick={() => {
          onSelectTool('select');
          closeMenu();
        }}
        className={`vertical-tool-btn ${btnSizeClass} rounded-full flex items-center justify-center transition-all relative cursor-pointer border-0 outline-none ${
          activeTool === 'select'
            ? 'is-active bg-[#0088cc] text-white shadow-xs scale-105 ring-2 ring-[#0088cc]/30'
            : isDarkMode
              ? 'bg-transparent text-[#cccccc] hover:text-white hover:bg-white/10'
              : 'bg-transparent text-[#666666] hover:text-[#000000] hover:bg-white/40'
        }`}
        title="Outil Pointeur / Sélection (Raccourci V ou Échap)"
      >
        <MousePointer2 className={`${iconSizeClass} stroke-[2.2]`} />
      </button>

      {/* ========================================================= */}
      {/* 1. OUTIL Z1 / ZONES DE FOCUS (Menu radial & Pill Pastille) */}
      {/* ========================================================= */}
      <div 
        className="relative"
        onMouseEnter={handleMenuMouseEnter}
        onMouseLeave={handleMenuMouseLeave}
      >
        <button 
          id="tool-zone-indicator"
          data-palette-btn="true"
          onClick={() => toggleMenu('focus')}
          className={`vertical-tool-btn ${btnSizeClass} rounded-full flex items-center justify-center font-bold ${isCompact || isTwoCol ? 'text-[11px]' : 'text-xs'} shadow-xs cursor-pointer transition-all relative border-0 outline-none ${
            activeMenu === 'focus' || activeTool === 'focus'
              ? 'is-active bg-[#0088cc] text-white ring-2 ring-[#0088cc]/30 scale-105' 
              : isDarkMode
                ? 'bg-transparent text-white/90 hover:text-white hover:bg-white/10'
                : 'bg-[#000000] hover:bg-[#0088cc] text-white'
          }`}
          title={`Zone ${activeZoneLabel} • Menu radial (Ajouter / Dupliquer / Pastille / Supprimer)`}
        >
          {activeZoneLabel}
          {focuses.length > 1 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#0088cc] text-white text-[9px] font-bold flex items-center justify-center ring-1 ring-white">
              {focuses.length}
            </span>
          )}
        </button>

        {/* Menu radial d'actions : Z1 Focus avec Pill Capsule Pastille */}
        <RadialToolOptions
          isOpen={activeMenu === 'focus'}
          dirX={dirX}
          dirY={dirY}
          extraX={twoColExtraX}
          isHorizontal={isHorizontal}
          canAdd={true}
          addTitle={focuses.length > 0 ? "Ajouter une autre zone de focus (+)" : "Ajouter une zone de focus (+)"}
          duplicateTitle="Dupliquer la zone de focus active"
          deleteTitle="Supprimer la zone de focus active"
          canDuplicate={focuses.length > 0}
          canDelete={focuses.length > 0}
          pillContent={
            focuses.length > 0 ? (
              <div
                className="uiverse-radial-pill pointer-events-auto flex items-center gap-1 px-1.5"
                style={{
                  ['--target-x' as string]: pillTargetX,
                  ['--target-y' as string]: pillTargetY,
                }}
                onWheel={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.deltaY < 0) {
                    handleStepNumberChange(currentStepNumber + 1);
                  } else {
                    handleStepNumberChange(currentStepNumber - 1);
                  }
                }}
              >
                {/* Checkbox / Toggle Masquer-Afficher */}
                <button
                  type="button"
                  title={targetFocus?.showStepBadge !== false ? "Masquer la pastille sur le visuel" : "Afficher la pastille sur le visuel"}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (targetFocus && onUpdateFocus) {
                      onUpdateFocus(targetFocus.id, { showStepBadge: targetFocus.showStepBadge === false });
                    }
                  }}
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    targetFocus?.showStepBadge !== false
                      ? 'text-sky-400 hover:text-sky-300 hover:bg-white/10'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/10 opacity-70'
                  }`}
                >
                  {targetFocus?.showStepBadge !== false ? (
                    <Eye className="w-3.5 h-3.5 stroke-[2.2]" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 stroke-[2.2] text-rose-400" />
                  )}
                </button>

                <div className="w-px h-3.5 bg-white/20" />

                {/* Bouton Moins (-) */}
                <button
                  type="button"
                  title="Diminuer le numéro d'étape (-1)"
                  disabled={currentStepNumber <= 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStepNumberChange(currentStepNumber - 1);
                  }}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white/90 hover:text-white hover:bg-white/15 disabled:opacity-25 disabled:cursor-not-allowed transition-all text-xs font-bold"
                >
                  <Minus className="w-3 h-3 stroke-[2.5]" />
                </button>

                {/* Champ Numéro de pastille (éditable directement) */}
                <div className="flex items-center gap-0.5 px-1 bg-white/10 hover:bg-white/20 focus-within:bg-white/25 rounded transition-all">
                  <span className="text-[10px] text-white/60 font-semibold select-none">N°</span>
                  <input
                    type="text"
                    value={currentStepNumber}
                    title="Numéro d'étape du badge (cliquer pour éditer, ou molette pour ajuster)"
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        handleStepNumberChange(val);
                      }
                    }}
                    onFocus={() => {
                      setIsTyping(true);
                      handleMenuMouseEnter();
                    }}
                    onBlur={() => setIsTyping(false)}
                    className={`w-5 h-5 text-center text-xs font-black bg-transparent text-white focus:outline-none select-all transition-all ${
                      targetFocus?.showStepBadge === false ? 'line-through opacity-45' : ''
                    }`}
                  />
                </div>

                {/* Bouton Plus (+) */}
                <button
                  type="button"
                  title="Augmenter le numéro d'étape (+1)"
                  disabled={currentStepNumber >= 99}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStepNumberChange(currentStepNumber + 1);
                  }}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white/90 hover:text-white hover:bg-white/15 disabled:opacity-25 disabled:cursor-not-allowed transition-all text-xs font-bold"
                >
                  <Plus className="w-3 h-3 stroke-[2.5]" />
                </button>

                <div className="w-px h-3.5 bg-white/20" />

                {/* Bouton Orientation (Horizontal 240x50 / Vertical 50x240) */}
                <button
                  type="button"
                  title={
                    targetFocus?.orientation === 'vertical' || (targetFocus && targetFocus.height > targetFocus.width)
                      ? "Zone verticale active (50x240px) • Cliquer pour passer en horizontale"
                      : "Zone horizontale active (240x50px) • Cliquer pour passer en verticale"
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    if (targetFocus && onUpdateFocus) {
                      const isV = targetFocus.orientation === 'vertical' || targetFocus.height > targetFocus.width;
                      if (isV) {
                        onUpdateFocus(targetFocus.id, {
                          orientation: 'horizontal',
                          width: 240,
                          height: 50,
                        });
                      } else {
                        onUpdateFocus(targetFocus.id, {
                          orientation: 'vertical',
                          width: 50,
                          height: 240,
                          zoom: 1.2,
                        });
                      }
                    }
                  }}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white/90 hover:text-white hover:bg-white/15 transition-all"
                >
                  {targetFocus?.orientation === 'vertical' || (targetFocus && targetFocus.height > targetFocus.width) ? (
                    <span className="w-1.5 h-3 border border-sky-300 bg-sky-400/40 rounded-2xs inline-block" />
                  ) : (
                    <span className="w-3 h-1.5 border border-white/80 rounded-2xs inline-block" />
                  )}
                </button>
              </div>
            ) : undefined
          }
          extraAction={focuses.length > 1 && onRenumberFocuses ? {
            icon: <RotateCcw className="w-3.5 h-3.5 stroke-[2.2]" />,
            title: "Renuméroter 1..N automatiquement toutes les étapes",
            onClick: onRenumberFocuses,
          } : undefined}
          onAdd={() => {
            onAddFocus(targetFocus?.orientation || 'horizontal');
            onSelectTool('select');
            closeMenu();
          }}
          onDuplicate={() => {
            const targetId = selectedFocus ? selectedFocus.id : (focuses[0] ? focuses[0].id : null);
            if (targetId && onDuplicateFocus) {
              onDuplicateFocus(targetId);
            }
            closeMenu();
          }}
          onDelete={() => {
            const targetId = selectedFocus ? selectedFocus.id : (focuses[0] ? focuses[0].id : null);
            if (targetId) {
              if (onDeleteFocusWithId) onDeleteFocusWithId(targetId);
              else onDeleteFocus?.();
            }
            if (focuses.length <= 1) {
              closeMenu();
            }
            onSelectTool('select');
          }}
          onMouseEnter={handleMenuMouseEnter}
          onMouseLeave={handleMenuMouseLeave}
        />
      </div>

      {/* ========================================================= */}
      {/* 2. OUTIL VIGNETTE CALLOUT (Menu radial)                   */}
      {/* ========================================================= */}
      {onToggleCallout && (
        <div 
          className="relative"
          onMouseEnter={handleMenuMouseEnter}
          onMouseLeave={handleMenuMouseLeave}
        >
          <button
            id="tool-toggle-callout"
            data-palette-btn="true"
            onClick={() => toggleMenu('callout')}
            className={`vertical-tool-btn ${btnSizeClass} rounded-full flex items-center justify-center transition-all relative border-0 outline-none ${
              activeMenu === 'callout' || hasCallout || activeTool === 'callout'
                ? 'is-active bg-[#0088cc] text-white ring-2 ring-[#0088cc]/30 scale-105'
                : isDarkMode
                  ? 'bg-transparent text-[#cccccc] hover:text-white hover:bg-white/10'
                  : 'bg-transparent text-[#666666] hover:text-[#000000] hover:bg-white/40'
            }`}
            title="Vignette Callout (Zoom) • Menu radial"
          >
            <svg className={iconSizeClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9.5" />
              <path d="m8.5 9 3.5 6 3.5-6" />
            </svg>
            {hasCallout && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-1 ring-white" />
            )}
          </button>

          {/* Menu radial d'actions : Callout */}
          <RadialToolOptions
            isOpen={activeMenu === 'callout'}
            dirX={dirX}
            dirY={dirY}
            extraX={twoColExtraX}
            isHorizontal={isHorizontal}
            addTitle={hasCallout ? "Vignette déjà activée" : "Activer la vignette Callout (+)"}
            duplicateTitle="Réinitialiser la disposition Callout"
            deleteTitle="Supprimer / Désactiver la vignette Callout"
            canDuplicate={hasCallout}
            canDelete={hasCallout}
            onAdd={() => {
              if (!hasCallout) onToggleCallout();
              onSelectTool('callout');
              closeMenu();
            }}
            onDuplicate={() => {
              if (onUpdateCallout) {
                onUpdateCallout({
                  width: 100,
                  height: 100,
                  gap: 5,
                  shape: 'rounded',
                  borderRadius: 39,
                  borderWidth: 0,
                  borderColor: 'transparent',
                  showShadow: true,
                  shadowDistance: 5,
                  shadowOffsetY: 5,
                  shadowBlur: 2,
                  shadowSize: 2,
                  shadowOpacity: 0.50,
                  sourceWidth: 27,
                  sourceHeight: 27,
                });
              }
              onSelectTool('select');
            }}
            onDelete={() => {
              if (hasCallout) onToggleCallout();
              onSelectTool('select');
            }}
            onMouseEnter={handleMenuMouseEnter}
            onMouseLeave={handleMenuMouseLeave}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. OUTIL FLOU (Menu radial)                               */}
      {/* ========================================================= */}
      <div 
        className="relative"
        onMouseEnter={handleMenuMouseEnter}
        onMouseLeave={handleMenuMouseLeave}
      >
        <button
          id="tool-add-blur"
          data-palette-btn="true"
          onClick={() => toggleMenu('blur')}
          className={`vertical-tool-btn ${btnSizeClass} rounded-full flex items-center justify-center transition-all relative cursor-pointer border-0 outline-none ${
            activeMenu === 'blur' || activeTool === 'blur'
              ? 'is-active bg-[#0088cc] text-white ring-2 ring-[#0088cc]/30 scale-105'
              : isDarkMode
                ? 'bg-transparent text-[#cccccc] hover:text-white hover:bg-white/10'
                : 'bg-transparent text-[#666666] hover:text-[#000000] hover:bg-white/40'
          }`}
          title={`Outil Flou (${blurZones.length}) • Menu radial (Ajouter / Dupliquer / Supprimer)`}
        >
          <Droplet className={`${iconSizeClass} stroke-[2]`} />
          {blurZones.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#0088cc] text-white text-[9px] font-bold flex items-center justify-center ring-1 ring-white">
              {blurZones.length}
            </span>
          )}
        </button>

        {/* Menu radial d'actions : Flou */}
        <RadialToolOptions
          isOpen={activeMenu === 'blur'}
          dirX={dirX}
          dirY={dirY}
          extraX={twoColExtraX}
          isHorizontal={isHorizontal}
          addTitle="Ajouter une zone de flou (+)"
          duplicateTitle="Dupliquer la zone de flou active"
          deleteTitle="Supprimer la zone de flou active"
          canDuplicate={blurZones.length > 0}
          canDelete={blurZones.length > 0}
          onAdd={() => {
            onAddBlur();
            onSelectTool('select');
            closeMenu();
          }}
          onDuplicate={() => {
            if (currentBlur && onDuplicateBlur) {
              onDuplicateBlur(currentBlur.id);
            } else if (blurZones[0] && onDuplicateBlur) {
              onDuplicateBlur(blurZones[0].id);
            } else {
              onAddBlur();
            }
            onSelectTool('select');
            closeMenu();
          }}
          onDelete={() => {
            if (currentBlur && onDeleteBlur) {
              onDeleteBlur(currentBlur.id);
            } else if (blurZones[0] && onDeleteBlur) {
              onDeleteBlur(blurZones[0].id);
            }
            closeMenu();
          }}
          onMouseEnter={handleMenuMouseEnter}
          onMouseLeave={handleMenuMouseLeave}
        />
      </div>

      {/* ========================================================= */}
      {/* 4. OUTIL MASQUE (Menu radial)                             */}
      {/* ========================================================= */}
      <div 
        className="relative"
        onMouseEnter={handleMenuMouseEnter}
        onMouseLeave={handleMenuMouseLeave}
      >
        <button
          id="tool-add-mask"
          data-palette-btn="true"
          onClick={() => toggleMenu('mask')}
          className={`vertical-tool-btn ${btnSizeClass} rounded-full flex items-center justify-center transition-all relative cursor-pointer border-0 outline-none ${
            activeMenu === 'mask' || activeTool === 'mask'
              ? 'is-active bg-[#0088cc] text-white ring-2 ring-[#0088cc]/30 scale-105'
              : isDarkMode
                ? 'bg-transparent text-[#cccccc] hover:text-white hover:bg-white/10'
                : 'bg-transparent text-[#666666] hover:bg-white/40'
          }`}
          title={`Forme Masque (${maskShapes.length}) • Menu radial (Ajouter / Dupliquer / Supprimer)`}
        >
          <div className={`${isCompact || isTwoCol ? 'w-3 h-3' : 'w-3.5 h-3.5'} rounded-sm transition-colors ${
            isDarkMode 
              ? 'bg-[#38bdf8] border border-white/60 shadow-xs' 
              : 'bg-[#25465F]'
          }`} />
          {maskShapes.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#0088cc] text-white text-[9px] font-bold flex items-center justify-center ring-1 ring-white">
              {maskShapes.length}
            </span>
          )}
        </button>

        {/* Menu radial d'actions : Masque */}
        <RadialToolOptions
          isOpen={activeMenu === 'mask'}
          dirX={dirX}
          dirY={dirY}
          extraX={twoColExtraX}
          isHorizontal={isHorizontal}
          addTitle="Ajouter un masque (+)"
          duplicateTitle="Dupliquer le masque actif"
          deleteTitle="Supprimer le masque actif"
          canDuplicate={maskShapes.length > 0}
          canDelete={maskShapes.length > 0}
          onAdd={() => {
            onAddMask();
            onSelectTool('select');
            closeMenu();
          }}
          onDuplicate={() => {
            if (currentMask && onDuplicateMask) {
              onDuplicateMask(currentMask.id);
            } else if (maskShapes[0] && onDuplicateMask) {
              onDuplicateMask(maskShapes[0].id);
            } else {
              onAddMask();
            }
            onSelectTool('select');
            closeMenu();
          }}
          onDelete={() => {
            if (currentMask && onDeleteMask) {
              onDeleteMask(currentMask.id);
            } else if (maskShapes[0] && onDeleteMask) {
              onDeleteMask(maskShapes[0].id);
            }
            closeMenu();
          }}
          onMouseEnter={handleMenuMouseEnter}
          onMouseLeave={handleMenuMouseLeave}
        />
      </div>

      {/* ========================================================= */}
      {/* 5. OUTIL TRIANGLE (Menu radial)                           */}
      {/* ========================================================= */}
      {onAddTriangle && (
        <div 
          className="relative"
          onMouseEnter={handleMenuMouseEnter}
          onMouseLeave={handleMenuMouseLeave}
        >
          <button
            id="tool-add-triangle"
            data-palette-btn="true"
            onClick={() => toggleMenu('triangle')}
            className={`vertical-tool-btn ${btnSizeClass} rounded-full flex items-center justify-center transition-all relative cursor-pointer border-0 outline-none ${
              activeMenu === 'triangle' || activeTool === 'triangle'
                ? 'is-active bg-[#0088cc] text-white ring-2 ring-[#0088cc]/30 scale-105'
                : isDarkMode
                  ? 'bg-transparent text-[#cccccc] hover:text-white hover:bg-white/10'
                  : 'bg-transparent text-[#666666] hover:text-[#000000] hover:bg-white/40'
            }`}
            title={`Outil Triangle (${triangles.length}) • Menu radial (Ajouter / Dupliquer / Supprimer)`}
          >
            <Triangle className="w-3.5 h-3.5 fill-current" />
            {triangles.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#0088cc] text-white text-[9px] font-bold flex items-center justify-center ring-1 ring-white">
                {triangles.length}
              </span>
            )}
          </button>

          {/* Menu radial d'actions : Triangle */}
          <RadialToolOptions
            isOpen={activeMenu === 'triangle'}
            dirX={dirX}
            dirY={dirY}
            extraX={twoColExtraX}
            isHorizontal={isHorizontal}
            addTitle="Ajouter un triangle (+)"
            duplicateTitle="Dupliquer le triangle actif"
            deleteTitle="Supprimer le triangle actif"
            canDuplicate={triangles.length > 0}
            canDelete={triangles.length > 0}
            onAdd={() => {
              onAddTriangle();
              onSelectTool('select');
              closeMenu();
            }}
            onDuplicate={() => {
              if (currentTriangle && onDuplicateTriangle) {
                onDuplicateTriangle(currentTriangle.id);
              } else if (triangles[0] && onDuplicateTriangle) {
                onDuplicateTriangle(triangles[0].id);
              } else {
                onAddTriangle();
              }
              onSelectTool('select');
              closeMenu();
            }}
            onDelete={() => {
              if (currentTriangle && onDeleteTriangle) {
                onDeleteTriangle(currentTriangle.id);
              } else if (triangles[0] && onDeleteTriangle) {
                onDeleteTriangle(triangles[0].id);
              }
              closeMenu();
            }}
            onMouseEnter={handleMenuMouseEnter}
            onMouseLeave={handleMenuMouseLeave}
          />
        </div>
      )}

      <div className={`${isHorizontal ? 'w-px h-5 mx-0.5' : isTwoCol ? 'col-span-2 w-full h-px my-0.5' : 'w-5 h-px my-0.5'} ${isDarkMode ? 'bg-white/20' : 'bg-black/10'}`} />

      {/* ========================================================= */}
      {/* 6. OUTILS DE CONTRÔLE (Poignées, Undo, Redo, Réinitialiser) */}
      {/* ========================================================= */}
      {/* Sélection / Poignées de transformation */}
      <button
        id="tool-toggle-handles"
        data-palette-btn="true"
        onClick={onToggleHandles}
        className={`vertical-tool-btn ${btnSizeClass} rounded-full flex items-center justify-center transition-all cursor-pointer border-0 outline-none ${
          showHandles 
            ? 'is-active bg-[#0088cc] text-white shadow-xs ring-2 ring-[#0088cc]/30 scale-105' 
            : isDarkMode 
              ? 'bg-transparent text-[#aaaaaa] hover:text-white hover:bg-white/10' 
              : 'bg-transparent text-[#979797] hover:bg-white/40'
        }`}
        title="Afficher/Masquer les poignées de sélection"
      >
        <Square className={iconSizeClass} />
      </button>

      {/* Boutons Annuler / Rétablir */}
      {(onUndo || onRedo) && (
        <>
          <div className={`${isHorizontal ? 'w-px h-5 mx-0.5' : isTwoCol ? 'col-span-2 w-full h-px my-0.5' : 'w-5 h-px my-0.5'} ${isDarkMode ? 'bg-white/20' : 'bg-black/10'}`} />
          <button
            id="tool-undo"
            data-palette-btn="true"
            onClick={onUndo}
            disabled={!canUndo}
            className={`vertical-tool-btn ${btnSizeClass} rounded-full flex items-center justify-center transition-all border-0 outline-none ${
              canUndo 
                ? isDarkMode ? 'bg-transparent text-[#cccccc] hover:text-white hover:bg-white/10 cursor-pointer' : 'bg-transparent text-[#666666] hover:text-[#000000] hover:bg-white/40 cursor-pointer' 
                : isDarkMode ? 'bg-transparent text-[#555555] opacity-30 cursor-not-allowed' : 'bg-transparent text-[#979797] opacity-30 cursor-not-allowed'
            }`}
            title="Annuler (Ctrl+Z)"
          >
            <Undo2 className={iconSizeClass} />
          </button>

          <button
            id="tool-redo"
            data-palette-btn="true"
            onClick={onRedo}
            disabled={!canRedo}
            className={`vertical-tool-btn ${btnSizeClass} rounded-full flex items-center justify-center transition-all border-0 outline-none ${
              canRedo 
                ? isDarkMode ? 'bg-transparent text-[#cccccc] hover:text-white hover:bg-white/10 cursor-pointer' : 'bg-transparent text-[#666666] hover:text-[#000000] hover:bg-white/40 cursor-pointer' 
                : isDarkMode ? 'bg-transparent text-[#555555] opacity-30 cursor-not-allowed' : 'bg-transparent text-[#979797] opacity-30 cursor-not-allowed'
            }`}
            title="Rétablir (Ctrl+Y)"
          >
            <Redo2 className={iconSizeClass} />
          </button>
        </>
      )}

      {/* Bouton Réinitialiser les formes */}
      {onResetShapes && (
        <button
          id="tool-reset-shapes"
          data-palette-btn="true"
          onClick={onResetShapes}
          className={`vertical-tool-btn ${btnSizeClass} rounded-full flex items-center justify-center transition-all cursor-pointer border-0 outline-none ${
            isDarkMode
              ? 'bg-transparent text-[#cccccc] hover:text-rose-400 hover:bg-white/10'
              : 'bg-transparent text-[#666666] hover:text-rose-600 hover:bg-white/40'
          }`}
          title="Réinitialiser (effacer toutes les formes et annotations)"
        >
          <RotateCcw className={`${iconSizeClass} text-rose-500`} />
        </button>
      )}

      {/* Bouton Recentrer - Placé au-dessus de l'outil Prévisualisation */}
      {onCenterWorkspace && (
        <>
          <div className={`${isHorizontal ? 'w-px h-5 mx-0.5' : isTwoCol ? 'col-span-2 w-full h-px my-0.5' : 'w-5 h-px my-0.5'} ${isDarkMode ? 'bg-white/20' : 'bg-black/10'}`} />
          <button
            id="tool-center-workspace"
            data-palette-btn="true"
            onClick={onCenterWorkspace}
            className={`vertical-tool-btn ${btnSizeClass} rounded-full flex items-center justify-center transition-all cursor-pointer border-0 outline-none ${
              isDarkMode
                ? 'bg-transparent text-[#cccccc] hover:text-white hover:bg-white/10'
                : 'bg-transparent text-[#666666] hover:text-[#000000] hover:bg-white/40'
            }`}
            title="Recentrer le plan de travail (vue 100%, centrée)"
          >
            <Maximize2 className={iconSizeClass} />
          </button>
        </>
      )}

      {/* Prévisualisation */}
      {onTogglePreview && (
        <>
          {!onCenterWorkspace && <div className={`${isHorizontal ? 'w-px h-5 mx-0.5' : isTwoCol ? 'col-span-2 w-full h-px my-0.5' : 'w-5 h-px my-0.5'} ${isDarkMode ? 'bg-white/20' : 'bg-black/10'}`} />}
          <button
            id="tool-preview-mode"
            data-palette-btn="true"
            onClick={onTogglePreview}
            className={`vertical-tool-btn ${btnSizeClass} rounded-full flex items-center justify-center transition-all cursor-pointer border-0 outline-none ${
              isPreviewMode 
                ? 'is-active bg-[#0088cc] text-white shadow-xs' 
                : isDarkMode
                  ? 'bg-transparent text-[#cccccc] hover:text-[#38bdf8] hover:bg-white/10'
                  : 'bg-transparent text-[#666666] hover:text-[#0088cc] hover:bg-white/40'
            }`}
            title="Prévisualisation du rendu final exporté"
          >
            <Eye className={iconSizeClass} />
          </button>
        </>
      )}

      {/* Exportation PNG direct */}
      {onExportClick && (
        <>
          <div className={`${isHorizontal ? 'w-px h-5 mx-0.5' : isTwoCol ? 'col-span-2 w-full h-px my-0.5' : 'w-5 h-px my-0.5'} ${isDarkMode ? 'bg-white/20' : 'bg-black/10'}`} />
          <button
            id="tool-export"
            data-palette-btn="true"
            onClick={onExportClick}
            disabled={isExporting}
            className={`vertical-tool-btn ${btnSizeClass} rounded-full flex items-center justify-center transition-all border-0 outline-none ${
              isExporting 
                ? 'is-active bg-[#0088cc] text-white opacity-80 cursor-wait' 
                : isDarkMode
                  ? 'bg-transparent text-[#38bdf8] hover:bg-white/10 hover:text-white cursor-pointer'
                  : 'bg-transparent text-[#0088cc] hover:bg-white/40 cursor-pointer'
            }`}
            title="Exporter l'image en PNG (Ctrl + E)"
          >
            {isExporting ? (
              <Loader2 className={`${iconSizeClass} animate-spin text-white`} />
            ) : (
              <Download className={`${iconSizeClass} stroke-[2.2]`} />
            )}
          </button>
        </>
      )}
    </div>
  );
};
