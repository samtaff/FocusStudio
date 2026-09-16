import React, { useState, useRef } from 'react';
import { 
  Square, 
  Hand, 
  Eye, 
  Download, 
  Maximize2,
  Plus,
  Trash2,
  Droplet,
  ZoomIn,
  GripVertical,
  Triangle
} from 'lucide-react';
import { FocusZone } from '../types';

export type ToolType = 'select' | 'focus' | 'blur' | 'mask' | 'triangle' | 'zoom' | 'pan';

interface VerticalToolPaletteProps {
  focuses: FocusZone[];
  selectedFocus: FocusZone | null;
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  onAddFocus: () => void;
  onDeleteFocus?: () => void;
  onAddBlur: () => void;
  onAddMask: () => void;
  onAddTriangle?: () => void;
  isPanMode: boolean;
  onTogglePanMode: () => void;
  isDetecting: boolean;
  showDetection: boolean;
  onToggleDetection: () => void;
  showHandles: boolean;
  onToggleHandles: () => void;
  onExportClick: () => void;
  onCenterWorkspace?: () => void;
  onToggleMiniWidget?: () => void;
  isPreviewMode?: boolean;
  onTogglePreview?: () => void;
}

export const VerticalToolPalette: React.FC<VerticalToolPaletteProps> = ({
  focuses,
  selectedFocus,
  activeTool,
  onSelectTool,
  onAddFocus,
  onDeleteFocus,
  onAddBlur,
  onAddMask,
  onAddTriangle,
  isPanMode,
  onTogglePanMode,
  showHandles,
  onToggleHandles,
  onExportClick,
  onCenterWorkspace,
  onToggleMiniWidget,
  isPreviewMode,
  onTogglePreview,
}) => {
  // Draggable position with local storage memory
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('tool_palette_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return { x: 24, y: 96 };
  });

  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    dragOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const newX = Math.max(10, Math.min(window.innerWidth - 60, e.clientX - dragOffsetRef.current.x));
    const newY = Math.max(10, Math.min(window.innerHeight - 300, e.clientY - dragOffsetRef.current.y));
    const newPos = { x: newX, y: newY };
    setPosition(newPos);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        localStorage.setItem('tool_palette_pos', JSON.stringify(position));
      } catch {
        // Ignore
      }
    }
  };

  const activeZoneLabel = selectedFocus 
    ? `Z${selectedFocus.stepNumber || 1}` 
    : (focuses.length > 0 ? `Z${focuses[0].stepNumber || 1}` : 'Z1');

  return (
    <div 
      className="absolute bg-white/75 backdrop-blur-xl border border-white/80 rounded-full p-2 flex flex-col items-center gap-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] ring-1 ring-[#979797]/15 z-30 select-none"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      {/* Drag handle */}
      <div 
        className="w-8 h-4 flex items-center justify-center cursor-move text-[#979797] hover:text-[#000000] transition-colors"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        title="Glisser pour déplacer la barre d'outils"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </div>

      {/* Top Zone Indicator */}
      <button 
        id="tool-zone-indicator"
        onClick={onToggleMiniWidget}
        className="w-8 h-8 rounded-full bg-[#000000] hover:bg-[#0088cc] active:scale-95 text-white flex items-center justify-center font-semibold text-xs shadow-xs cursor-pointer transition-all"
        title={`Zone ${activeZoneLabel} • Cliquer pour ouvrir la petite fenêtre des zones`}
      >
        {activeZoneLabel}
      </button>

      <div className="w-5 h-px bg-[#eeeeee] my-0.5" />

      {/* Bouton + Ajouter Zone de Focus */}
      <button
        id="tool-add-focus"
        onClick={() => {
          onAddFocus();
          onSelectTool('select');
        }}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
          activeTool === 'focus' 
            ? 'bg-[#0088cc] text-white shadow-xs' 
            : 'text-[#666666] hover:text-[#000000] hover:bg-[#eeeeee]'
        }`}
        title="Ajouter une zone de focus (240×50 px, coins 10px)"
      >
        <Plus className="w-4 h-4 stroke-[2.5]" />
      </button>

      {/* Bouton - Supprimer le focus actif */}
      <button
        id="tool-delete-focus"
        onClick={onDeleteFocus}
        disabled={!selectedFocus}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
          selectedFocus 
            ? 'text-[#666666] hover:text-rose-600 hover:bg-rose-50' 
            : 'text-[#979797] opacity-40 cursor-not-allowed'
        }`}
        title={selectedFocus ? `Supprimer la zone sélectionnée (${selectedFocus.name})` : 'Sélectionnez une zone à supprimer'}
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="w-5 h-px bg-[#eeeeee] my-0.5" />

      {/* Outil Flou */}
      <button
        id="tool-add-blur"
        onClick={() => {
          onAddBlur();
          onSelectTool('select');
        }}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
          activeTool === 'blur' 
            ? 'bg-[#0088cc] text-white shadow-xs' 
            : 'text-[#666666] hover:text-[#000000] hover:bg-[#eeeeee]'
        }`}
        title="Créer une zone de flou efficace"
      >
        <Droplet className="w-4 h-4 stroke-[2]" />
      </button>

      {/* Outil Forme Masque Bleu #25465F */}
      <button
        id="tool-add-mask"
        onClick={() => {
          onAddMask();
          onSelectTool('select');
        }}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
          activeTool === 'mask' 
            ? 'bg-[#000000] text-white shadow-xs' 
            : 'text-[#666666] hover:bg-[#eeeeee]'
        }`}
        title="Créer une forme masque"
      >
        <div className="w-3.5 h-3.5 rounded-sm bg-[#25465F]" />
      </button>

      {/* Outil Triangle 15x13px */}
      {onAddTriangle && (
        <button
          id="tool-add-triangle"
          onClick={() => {
            onAddTriangle();
            onSelectTool('select');
          }}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            activeTool === 'triangle'
              ? 'bg-[#0088cc] text-white shadow-xs'
              : 'text-[#666666] hover:text-[#000000] hover:bg-[#eeeeee]'
          }`}
          title="Ajouter un triangle (15×13 px)"
        >
          <Triangle className="w-3.5 h-3.5 fill-current" />
        </button>
      )}

      <div className="w-5 h-px bg-[#eeeeee] my-0.5" />

      {/* Recentrer le plan de travail */}
      {onCenterWorkspace && (
        <button
          id="tool-center-workspace"
          onClick={onCenterWorkspace}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[#666666] hover:text-[#000000] hover:bg-[#eeeeee] transition-all"
          title="Recentrer le plan de travail (vue 100%, centrée)"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      )}

      {/* Outil Zoom */}
      <button
        id="tool-photoshop-zoom"
        onClick={() => onSelectTool(activeTool === 'zoom' ? 'select' : 'zoom')}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
          activeTool === 'zoom' 
            ? 'bg-[#000000] text-white shadow-xs' 
            : 'text-[#666666] hover:text-[#000000] hover:bg-[#eeeeee]'
        }`}
        title="Outil Zoom (Clic = Zoom avant, Alt+Clic = Zoom arrière)"
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      {/* Mode Pan (Main) */}
      <button
        id="tool-pan-hand"
        onClick={onTogglePanMode}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
          isPanMode 
            ? 'bg-[#0088cc] text-white shadow-xs' 
            : 'text-[#666666] hover:text-[#000000] hover:bg-[#eeeeee]'
        }`}
        title="Outil Main (Espace + Glisser pour déplacer la vue)"
      >
        <Hand className="w-4 h-4" />
      </button>

      {/* Sélection / Poignées de transformation */}
      <button
        id="tool-toggle-handles"
        onClick={onToggleHandles}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
          showHandles 
            ? 'text-[#000000] bg-[#eeeeee]' 
            : 'text-[#979797] hover:bg-[#eeeeee]'
        }`}
        title="Afficher/Masquer les poignées de sélection"
      >
        <Square className="w-4 h-4" />
      </button>

      <div className="w-5 h-px bg-[#eeeeee] my-0.5" />

      {/* Bouton Prévisualisation */}
      {onTogglePreview && (
        <button
          id="tool-preview-mode"
          onClick={onTogglePreview}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            isPreviewMode 
              ? 'bg-[#0088cc] text-white shadow-xs' 
              : 'text-[#666666] hover:text-[#0088cc] hover:bg-[#eeeeee]'
          }`}
          title="Prévisualisation du rendu final exporté"
        >
          <Eye className="w-4 h-4" />
        </button>
      )}

      {/* DERNIER ICÔNE DE LA BARRE D'OUTILS : EXPORTER EN PNG */}
      <button
        id="tool-export-png"
        onClick={onExportClick}
        className="w-8 h-8 rounded-full flex items-center justify-center text-[#666666] hover:text-[#0088cc] hover:bg-[#eeeeee] transition-all"
        title="Exporter en PNG (Haute Définition)"
      >
        <Download className="w-4 h-4" />
      </button>
    </div>
  );
};
