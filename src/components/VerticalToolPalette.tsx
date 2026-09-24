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
  Hash
} from 'lucide-react';
import { 
  FocusZone, 
  BlurZone, 
  MaskShape, 
  TriangleShape, 
  CalloutVignette 
} from '../types';

export type ToolType = 'select' | 'focus' | 'blur' | 'mask' | 'triangle' | 'callout' | 'zoom' | 'pan';
export type MenuType = 'focus' | 'callout' | 'blur' | 'mask' | 'triangle' | null;

interface VerticalToolPaletteProps {
  // Focus Zones
  focuses: FocusZone[];
  selectedFocus: FocusZone | null;
  onSelectFocus?: (id: string) => void;
  onAddFocus: () => void;
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
  isPanMode: boolean;
  onTogglePanMode: () => void;
  isDetecting?: boolean;
  showDetection?: boolean;
  onToggleDetection?: () => void;
  showHandles: boolean;
  onToggleHandles: () => void;
  onCenterWorkspace?: () => void;
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
  onAdd: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
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
  onAdd,
  onDuplicate,
  onDelete,
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
          title={addTitle}
          onClick={(e) => {
            e.stopPropagation();
            e.currentTarget.blur();
            onAdd();
          }}
          className="uiverse-radial-option pointer-events-auto"
          style={{
            ['--target-x' as string]: `${dirX * 34}px`,
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
            ['--target-x' as string]: `${dirX * 78}px`,
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
            ['--target-x' as string]: `${extraAction ? dirX * 34 : dirX * 42}px`,
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
              ['--target-x' as string]: `${dirX * 78}px`,
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
        title={addTitle}
        onClick={(e) => {
          e.stopPropagation();
          e.currentTarget.blur();
          onAdd();
        }}
        className="uiverse-radial-option pointer-events-auto"
        style={{
          ['--target-x' as string]: `${dirX * 42}px`,
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
          ['--target-x' as string]: `${dirX * 54}px`,
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
          ['--target-x' as string]: `${dirX * 42}px`,
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
  showHandles,
  onToggleHandles,
  onCenterWorkspace,
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
      onSelectTool('select');
    }, 280);
  };

  const closeMenu = () => {
    if (menuLeaveTimerRef.current) {
      window.clearTimeout(menuLeaveTimerRef.current);
      menuLeaveTimerRef.current = null;
    }
    setActiveMenu(null);
    onSelectTool('select');
  };

  // Position flottante (fixe, déplaçable librement dans toute la fenêtre)
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('tool_palette_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return {
            x: Math.max(10, Math.min(window.innerWidth - 60, parsed.x)),
            y: Math.max(10, Math.min(window.innerHeight - 300, parsed.y)),
          };
        }
      }
    } catch {
      // Fallback
    }
    return { x: 24, y: 100 };
  });

  const paletteRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // Gestion du déplacement libre
  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('.uiverse-radial-option')) {
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
    const maxX = Math.max(10, window.innerWidth - 56);
    const maxY = Math.max(10, window.innerHeight - 100);
    const newX = Math.max(8, Math.min(maxX, e.clientX - dragOffsetRef.current.x));
    const newY = Math.max(8, Math.min(maxY, e.clientY - dragOffsetRef.current.y));
    setPosition({ x: newX, y: newY });
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

  // Détection du redimensionnement de l'écran
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => ({
        x: Math.max(8, Math.min(window.innerWidth - 56, prev.x)),
        y: Math.max(8, Math.min(window.innerHeight - 100, prev.y)),
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Détermine si le menu radial doit s'étendre vers la gauche si la barre est près du bord droit
  const isNearRightEdge = position.x > (window.innerWidth - 120);
  const dirX = isNearRightEdge ? -1 : 1;

  const toggleMenu = (menu: MenuType) => {
    if (menuLeaveTimerRef.current) {
      window.clearTimeout(menuLeaveTimerRef.current);
      menuLeaveTimerRef.current = null;
    }
    // Assure toujours que l'outil actif repasse en 'select' pour éviter que la souris ne reste collée sur dupliquer
    onSelectTool('select');
    setActiveMenu((prev) => (prev === menu ? null : menu));
  };

  const targetFocus = selectedFocus || (focuses.length > 0 ? focuses[0] : null);
  const currentStepNumber = targetFocus?.stepNumber ?? 1;

  const handleStepNumberChange = (num: number) => {
    const safeNum = Math.max(1, Math.min(99, Math.round(num)));
    if (targetFocus && onUpdateFocus) {
      onUpdateFocus(targetFocus.id, { stepNumber: safeNum });
    }
  };

  const activeZoneLabel = selectedFocus 
    ? `Z${selectedFocus.stepNumber || 1}` 
    : (focuses.length > 0 ? `Z${focuses[0].stepNumber || 1}` : 'Z1');

  // Éléments actuellement sélectionnés
  const currentBlur = blurZones.find((b) => b.id === selectedBlurId) || (blurZones.length > 0 ? blurZones[0] : null);
  const currentMask = maskShapes.find((m) => m.id === selectedMaskId) || (maskShapes.length > 0 ? maskShapes[0] : null);
  const currentTriangle = triangles.find((t) => t.id === selectedTriangleId) || (triangles.length > 0 ? triangles[0] : null);

  return (
    <div 
      ref={paletteRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onMouseEnter={handleMenuMouseEnter}
      onMouseLeave={handleMenuMouseLeave}
      className={`fixed z-50 backdrop-blur-2xl rounded-full px-1.5 py-2 flex flex-col items-center gap-1 transition-colors select-none ${
        isDarkMode
          ? 'bg-[#262626]/90 hover:bg-[#2c2c2c]/95 border border-[#3e3e3e] shadow-[0_12px_40px_rgba(0,0,0,0.65)] ring-1 ring-white/10'
          : 'bg-white/35 hover:bg-white/45 border border-white/50 shadow-[0_12px_40px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.04]'
      }`}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      {/* Poignée de déplacement (drag handle) */}
      <div 
        className={`w-7 h-3.5 flex items-center justify-center cursor-grab active:cursor-grabbing rounded-full transition-colors mb-0.5 ${
          isDarkMode
            ? 'text-[#aaaaaa] hover:text-white hover:bg-white/10'
            : 'text-[#666666] hover:text-[#000000] hover:bg-white/30'
        }`}
        title="Glisser pour déplacer la barre d'outils n'importe où"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </div>

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
          onClick={() => toggleMenu('focus')}
          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer transition-all relative ${
            activeMenu === 'focus' 
              ? 'bg-[#0088cc] text-white ring-2 ring-[#0088cc]/30 scale-105' 
              : activeTool === 'focus'
                ? 'bg-[#0088cc] text-white'
                : isDarkMode
                  ? 'bg-[#353535] hover:bg-[#0088cc] text-white border border-[#484848]'
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
          addTitle="Ajouter une zone de focus (+)"
          duplicateTitle="Dupliquer la zone de focus active"
          deleteTitle="Supprimer la zone de focus active"
          canDuplicate={focuses.length > 0}
          canDelete={focuses.length > 0}
          pillContent={
            <div
              className="uiverse-radial-pill pointer-events-auto flex items-center gap-1 px-1.5"
              style={{
                ['--target-x' as string]: `${dirX * 72}px`,
                ['--target-y' as string]: '0px',
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
                title="Diminuer le numéro (-1)"
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
              <input
                type="text"
                value={currentStepNumber}
                title="Numéro de pastille (cliquer pour éditer, ou molette pour ajuster)"
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
                className={`w-7 h-5 text-center text-xs font-black bg-white/10 hover:bg-white/20 focus:bg-white/25 rounded text-white focus:outline-none focus:ring-1 focus:ring-sky-400 select-all transition-all ${
                  targetFocus?.showStepBadge === false ? 'line-through opacity-45' : ''
                }`}
              />

              {/* Bouton Plus (+) */}
              <button
                type="button"
                title="Augmenter le numéro (+1)"
                disabled={currentStepNumber >= 99}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStepNumberChange(currentStepNumber + 1);
                }}
                className="w-5 h-5 rounded-full flex items-center justify-center text-white/90 hover:text-white hover:bg-white/15 disabled:opacity-25 disabled:cursor-not-allowed transition-all text-xs font-bold"
              >
                <Plus className="w-3 h-3 stroke-[2.5]" />
              </button>
            </div>
          }
          extraAction={focuses.length > 1 && onRenumberFocuses ? {
            icon: <RotateCcw className="w-3.5 h-3.5 stroke-[2.2]" />,
            title: "Renuméroter 1..N automatiquement toutes les étapes",
            onClick: onRenumberFocuses,
          } : undefined}
          onAdd={() => {
            onAddFocus();
            onSelectTool('select');
          }}
          onDuplicate={() => {
            const targetId = selectedFocus ? selectedFocus.id : (focuses[0] ? focuses[0].id : null);
            if (targetId && onDuplicateFocus) {
              onDuplicateFocus(targetId);
            }
            onSelectTool('select');
          }}
          onDelete={() => {
            const targetId = selectedFocus ? selectedFocus.id : (focuses[0] ? focuses[0].id : null);
            if (targetId) {
              if (onDeleteFocusWithId) onDeleteFocusWithId(targetId);
              else onDeleteFocus?.();
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
            onClick={() => toggleMenu('callout')}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all relative ${
              activeMenu === 'callout'
                ? 'bg-[#0088cc] text-white ring-2 ring-[#0088cc]/30 scale-105'
                : hasCallout || activeTool === 'callout'
                  ? 'bg-[#0088cc] text-white shadow-xs'
                  : 'text-[#666666] hover:text-[#000000] hover:bg-white/40'
            }`}
            title="Vignette Callout (Zoom) • Menu radial"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
            addTitle={hasCallout ? "Vignette déjà activée" : "Activer la vignette Callout (+)"}
            duplicateTitle="Réinitialiser la disposition Callout"
            deleteTitle="Supprimer / Désactiver la vignette Callout"
            canDuplicate={hasCallout}
            canDelete={hasCallout}
            onAdd={() => {
              if (!hasCallout) onToggleCallout();
              onSelectTool('select');
            }}
            onDuplicate={() => {
              if (onUpdateCallout) {
                onUpdateCallout({
                  width: 100,
                  height: 100,
                  gap: 5,
                  alignBottom: true,
                  shape: 'rounded',
                  borderRadius: 10,
                  showBorder: true,
                  borderWidth: 2,
                  borderColor: '#ffffff',
                  showShadow: true,
                  shadowBlur: 14,
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
          onClick={() => toggleMenu('blur')}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all relative cursor-pointer ${
            activeMenu === 'blur'
              ? 'bg-[#0088cc] text-white ring-2 ring-[#0088cc]/30 scale-105'
              : activeTool === 'blur'
                ? 'bg-[#0088cc] text-white shadow-xs'
                : isDarkMode
                  ? 'text-[#e5e5e5] hover:text-white hover:bg-white/15'
                  : 'text-[#666666] hover:text-[#000000] hover:bg-white/40'
          }`}
          title={`Outil Flou (${blurZones.length}) • Menu radial (Ajouter / Dupliquer / Supprimer)`}
        >
          <Droplet className="w-4 h-4 stroke-[2]" />
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
          addTitle="Ajouter une zone de flou (+)"
          duplicateTitle="Dupliquer la zone de flou active"
          deleteTitle="Supprimer la zone de flou active"
          canDuplicate={blurZones.length > 0}
          canDelete={blurZones.length > 0}
          onAdd={() => {
            onAddBlur();
            onSelectTool('select');
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
          }}
          onDelete={() => {
            if (currentBlur && onDeleteBlur) {
              onDeleteBlur(currentBlur.id);
            } else if (blurZones[0] && onDeleteBlur) {
              onDeleteBlur(blurZones[0].id);
            }
            onSelectTool('select');
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
          onClick={() => toggleMenu('mask')}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all relative cursor-pointer ${
            activeMenu === 'mask'
              ? 'bg-[#0088cc] text-white ring-2 ring-[#0088cc]/30 scale-105'
              : activeTool === 'mask'
                ? isDarkMode ? 'bg-[#0088cc] text-white shadow-xs' : 'bg-[#000000] text-white shadow-xs'
                : isDarkMode
                  ? 'text-[#e5e5e5] hover:text-white hover:bg-white/15'
                  : 'text-[#666666] hover:bg-white/40'
          }`}
          title={`Forme Masque (${maskShapes.length}) • Menu radial (Ajouter / Dupliquer / Supprimer)`}
        >
          <div className={`w-3.5 h-3.5 rounded-sm transition-colors ${
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
          addTitle="Ajouter un masque (+)"
          duplicateTitle="Dupliquer le masque actif"
          deleteTitle="Supprimer le masque actif"
          canDuplicate={maskShapes.length > 0}
          canDelete={maskShapes.length > 0}
          onAdd={() => {
            onAddMask();
            onSelectTool('select');
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
          }}
          onDelete={() => {
            if (currentMask && onDeleteMask) {
              onDeleteMask(currentMask.id);
            } else if (maskShapes[0] && onDeleteMask) {
              onDeleteMask(maskShapes[0].id);
            }
            onSelectTool('select');
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
            onClick={() => toggleMenu('triangle')}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all relative cursor-pointer ${
              activeMenu === 'triangle'
                ? 'bg-[#0088cc] text-white ring-2 ring-[#0088cc]/30 scale-105'
                : activeTool === 'triangle'
                  ? 'bg-[#0088cc] text-white shadow-xs'
                  : isDarkMode
                    ? 'text-[#e5e5e5] hover:text-white hover:bg-white/15'
                    : 'text-[#666666] hover:text-[#000000] hover:bg-white/40'
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
            addTitle="Ajouter un triangle (+)"
            duplicateTitle="Dupliquer le triangle actif"
            deleteTitle="Supprimer le triangle actif"
            canDuplicate={triangles.length > 0}
            canDelete={triangles.length > 0}
            onAdd={() => {
              onAddTriangle();
              onSelectTool('select');
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
            }}
            onDelete={() => {
              if (currentTriangle && onDeleteTriangle) {
                onDeleteTriangle(currentTriangle.id);
              } else if (triangles[0] && onDeleteTriangle) {
                onDeleteTriangle(triangles[0].id);
              }
              onSelectTool('select');
            }}
            onMouseEnter={handleMenuMouseEnter}
            onMouseLeave={handleMenuMouseLeave}
          />
        </div>
      )}

      <div className={`w-5 h-px my-0.5 ${isDarkMode ? 'bg-white/20' : 'bg-black/10'}`} />

      {/* ========================================================= */}
      {/* 6. OUTILS DE CONTRÔLE (Recentrer, Poignées, Undo, Redo)    */}
      {/* ========================================================= */}
      {onCenterWorkspace && (
        <button
          id="tool-center-workspace"
          onClick={onCenterWorkspace}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isDarkMode
              ? 'text-[#e5e5e5] hover:text-white hover:bg-white/15'
              : 'text-[#666666] hover:text-[#000000] hover:bg-white/40'
          }`}
          title="Recentrer le plan de travail (vue 100%, centrée)"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      )}

      {/* Sélection / Poignées de transformation */}
      <button
        id="tool-toggle-handles"
        onClick={onToggleHandles}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
          showHandles 
            ? isDarkMode ? 'text-white bg-white/25 shadow-xs border border-white/20' : 'text-[#000000] bg-white/60 shadow-xs' 
            : isDarkMode ? 'text-[#888888] hover:text-[#e5e5e5] hover:bg-white/15' : 'text-[#979797] hover:bg-white/40'
        }`}
        title="Afficher/Masquer les poignées de sélection"
      >
        <Square className="w-4 h-4" />
      </button>

      {/* Boutons Annuler / Rétablir */}
      {(onUndo || onRedo) && (
        <>
          <div className={`w-5 h-px my-0.5 ${isDarkMode ? 'bg-white/20' : 'bg-black/10'}`} />
          <button
            id="tool-undo"
            onClick={onUndo}
            disabled={!canUndo}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              canUndo 
                ? isDarkMode ? 'text-[#e5e5e5] hover:text-white hover:bg-white/15 cursor-pointer' : 'text-[#666666] hover:text-[#000000] hover:bg-white/40 cursor-pointer' 
                : isDarkMode ? 'text-[#555555] opacity-35 cursor-not-allowed' : 'text-[#979797] opacity-35 cursor-not-allowed'
            }`}
            title="Annuler (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            id="tool-redo"
            onClick={onRedo}
            disabled={!canRedo}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              canRedo 
                ? isDarkMode ? 'text-[#e5e5e5] hover:text-white hover:bg-white/15 cursor-pointer' : 'text-[#666666] hover:text-[#000000] hover:bg-white/40 cursor-pointer' 
                : isDarkMode ? 'text-[#555555] opacity-35 cursor-not-allowed' : 'text-[#979797] opacity-35 cursor-not-allowed'
            }`}
            title="Rétablir (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Prévisualisation */}
      {onTogglePreview && (
        <>
          <div className={`w-5 h-px my-0.5 ${isDarkMode ? 'bg-white/20' : 'bg-black/10'}`} />
          <button
            id="tool-preview-mode"
            onClick={onTogglePreview}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isPreviewMode 
                ? 'bg-[#0088cc] text-white shadow-xs' 
                : isDarkMode
                  ? 'text-[#e5e5e5] hover:text-[#38bdf8] hover:bg-white/15'
                  : 'text-[#666666] hover:text-[#0088cc] hover:bg-white/40'
            }`}
            title="Prévisualisation du rendu final exporté"
          >
            <Eye className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Exportation PNG direct */}
      {onExportClick && (
        <>
          <div className={`w-5 h-px my-0.5 ${isDarkMode ? 'bg-white/20' : 'bg-black/10'}`} />
          <button
            id="tool-export"
            onClick={onExportClick}
            disabled={isExporting}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isExporting 
                ? 'bg-[#0088cc] text-white opacity-80 cursor-wait' 
                : isDarkMode
                  ? 'bg-[#0088cc]/25 text-[#38bdf8] hover:bg-[#0088cc] hover:text-white border border-[#0088cc]/50 shadow-xs hover:scale-105 active:scale-95 cursor-pointer'
                  : 'text-[#0088cc] hover:bg-[#0088cc] hover:text-white bg-white/50 shadow-xs hover:scale-105 active:scale-95 cursor-pointer'
            }`}
            title="Exporter l'image en PNG (Ctrl + E)"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Download className="w-4 h-4 stroke-[2.2]" />
            )}
          </button>
        </>
      )}
    </div>
  );
};
