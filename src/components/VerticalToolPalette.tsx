import React, { useState, useRef } from 'react';
import { 
  Square, 
  Eye, 
  Download, 
  Maximize2,
  Plus,
  Trash2,
  Droplet,
  GripVertical,
  Triangle,
  RotateCcw,
  Undo2,
  Redo2
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
  onSelectFocus?: (id: string) => void;
  onUpdateFocus?: (id: string, updated: Partial<FocusZone>) => void;
  onRenumberFocuses?: () => void;
  onHoverFocus?: (id: string | null) => void;
  onDeleteFocusWithId?: (id: string) => void;
  isPreviewMode?: boolean;
  onTogglePreview?: () => void;
  // Undo / Redo
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
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
  onSelectFocus,
  onUpdateFocus,
  onRenumberFocuses,
  onHoverFocus,
  onDeleteFocusWithId,
  isPreviewMode,
  onTogglePreview,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}) => {
  const [showZonesMenu, setShowZonesMenu] = useState(false);
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
      className="absolute bg-white/75 backdrop-blur-xl border border-white/80 rounded-full p-2 flex flex-col items-center gap-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.12)] ring-1 ring-[#979797]/20 z-50 select-none"
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

      {/* Top Zone Indicator & Integrated Popover (Rangé dans Z1) */}
      <div className="relative">
        <button 
          id="tool-zone-indicator"
          onClick={() => setShowZonesMenu((prev) => !prev)}
          className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs shadow-xs cursor-pointer transition-all ${
            showZonesMenu 
              ? 'bg-[#0088cc] text-white ring-2 ring-[#0088cc]/30' 
              : 'bg-[#000000] hover:bg-[#0088cc] active:scale-95 text-white'
          }`}
          title={`Zone ${activeZoneLabel} • Cliquer pour gérer les zones`}
        >
          {activeZoneLabel}
        </button>

        {/* Panneau rangé dans Z1 / Z2 */}
        {showZonesMenu && (
          <div className="absolute left-11 top-0 w-64 bg-white/95 backdrop-blur-xl border border-white/90 rounded-2xl p-2.5 shadow-[0_12px_36px_rgba(0,0,0,0.14)] ring-1 ring-[#979797]/15 z-50 text-xs">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#eeeeee] mb-2 gap-1.5">
              <span className="font-semibold text-[#000000] text-[11px] tracking-tight">
                Chiffres & Zones ({focuses.length})
              </span>
              <div className="flex items-center gap-1">
                {focuses.length > 1 && onRenumberFocuses && (
                  <button
                    type="button"
                    onClick={onRenumberFocuses}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#eeeeee] hover:bg-[#e0e0e0] text-[#000000] text-[9px] font-medium transition-all"
                    title="Renuméroter 1, 2, 3... du haut vers le bas"
                  >
                    <RotateCcw className="w-2.5 h-2.5 text-[#0088cc]" />
                    <span>Auto 1..N</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onAddFocus}
                  className="w-5 h-5 rounded-full bg-[#0088cc] hover:bg-[#0077b3] text-white flex items-center justify-center transition-all shadow-2xs hover:scale-105 active:scale-95"
                  title="Ajouter une zone"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-0.5">
              {focuses.length === 0 ? (
                <div className="text-[11px] text-[#979797] text-center py-2">
                  Aucune zone active
                </div>
              ) : (
                focuses.map((f, idx) => {
                  const isSelected = selectedFocus?.id === f.id;
                  const currentNum = f.stepNumber || idx + 1;
                  return (
                    <div
                      key={f.id}
                      onMouseEnter={() => onHoverFocus?.(f.id)}
                      onMouseLeave={() => onHoverFocus?.(null)}
                      className={`group flex items-center justify-between px-2 py-1.5 rounded-xl transition-all ${
                        isSelected 
                          ? 'bg-[#0088cc]/10 border border-[#0088cc]/30 text-[#000000]' 
                          : 'bg-[#eeeeee]/60 hover:bg-[#eeeeee] text-[#000000]'
                      }`}
                    >
                      {/* Contrôle du chiffre d'étape (Stepper - / + et saisie) */}
                      <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            if (onUpdateFocus) {
                              onUpdateFocus(f.id, { stepNumber: Math.max(1, currentNum - 1) });
                            }
                          }}
                          className="w-4 h-5 rounded bg-white hover:bg-[#e0e0e0] border border-[#d0d0d0] flex items-center justify-center text-[10px] font-bold text-[#333333] transition-colors"
                          title="Diminuer le chiffre"
                        >
                          -
                        </button>

                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={currentNum}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val >= 1 && onUpdateFocus) {
                              onUpdateFocus(f.id, { stepNumber: val });
                            }
                          }}
                          className={`w-6 h-5 rounded text-center text-[10px] font-bold outline-none transition-all ${
                            f.showStepBadge !== false
                              ? 'bg-[#25465F] text-white shadow-2xs'
                              : 'bg-[#cccccc] text-[#666666] line-through'
                          }`}
                          title="Chiffre d'étape (cliquer pour éditer)"
                        />

                        <button
                          type="button"
                          onClick={() => {
                            if (onUpdateFocus) {
                              onUpdateFocus(f.id, { stepNumber: currentNum + 1 });
                            }
                          }}
                          className="w-4 h-5 rounded bg-white hover:bg-[#e0e0e0] border border-[#d0d0d0] flex items-center justify-center text-[10px] font-bold text-[#333333] transition-colors"
                          title="Augmenter le chiffre"
                        >
                          +
                        </button>
                      </div>

                      {/* Titre / sélection de la zone */}
                      <button
                        type="button"
                        onClick={() => onSelectFocus?.(f.id)}
                        className="truncate text-[11px] font-medium mx-1.5 flex-1 text-left"
                        title={f.name || `Zone ${currentNum}`}
                      >
                        {f.name || `Zone ${currentNum}`}
                      </button>

                      {/* Actions rapides : pastille active et corbeille */}
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {/* Toggle Affichage Pastille */}
                        <button
                          type="button"
                          onClick={() => {
                            if (onUpdateFocus) {
                              onUpdateFocus(f.id, { showStepBadge: f.showStepBadge === false ? true : false });
                            }
                          }}
                          className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold transition-all ${
                            f.showStepBadge !== false
                              ? 'text-[#0088cc] hover:bg-[#0088cc]/20'
                              : 'text-[#979797] hover:bg-[#dddddd]'
                          }`}
                          title={f.showStepBadge !== false ? 'Pastille affichée (cliquer pour masquer)' : 'Pastille masquée (cliquer pour afficher)'}
                        >
                          {f.showStepBadge !== false ? '●' : '○'}
                        </button>

                        {/* Supprimer */}
                        {onDeleteFocusWithId && (
                          <button
                            type="button"
                            onClick={() => onDeleteFocusWithId(f.id)}
                            className="w-5 h-5 rounded flex items-center justify-center text-[#979797] hover:text-rose-600 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                            title="Supprimer cette zone"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

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

      {/* Boutons Annuler / Rétablir */}
      {(onUndo || onRedo) && (
        <>
          <div className="w-5 h-px bg-[#eeeeee] my-0.5" />
          <button
            id="tool-undo"
            onClick={onUndo}
            disabled={!canUndo}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              canUndo 
                ? 'text-[#666666] hover:text-[#000000] hover:bg-[#eeeeee]' 
                : 'text-[#979797] opacity-35 cursor-not-allowed'
            }`}
            title="Annuler l'action précédente (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            id="tool-redo"
            onClick={onRedo}
            disabled={!canRedo}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              canRedo 
                ? 'text-[#666666] hover:text-[#000000] hover:bg-[#eeeeee]' 
                : 'text-[#979797] opacity-35 cursor-not-allowed'
            }`}
            title="Rétablir l'action annulée (Ctrl+Y ou Ctrl+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </>
      )}

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
