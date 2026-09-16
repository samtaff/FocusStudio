import React, { useState, useRef } from 'react';
import { Plus, Droplets, Target, X, Trash2, GripHorizontal } from 'lucide-react';
import { FocusZone } from '../types';

interface MiniZonesWidgetProps {
  focuses: FocusZone[];
  selectedFocusId: string | null;
  onSelectFocus: (id: string) => void;
  onDeleteFocus?: (id: string) => void;
  onHoverFocus?: (id: string | null) => void;
  onAddFocus: () => void;
  onClose?: () => void;
}

export const MiniZonesWidget: React.FC<MiniZonesWidgetProps> = ({
  focuses,
  selectedFocusId,
  onSelectFocus,
  onDeleteFocus,
  onHoverFocus,
  onAddFocus,
  onClose,
}) => {
  const [pos, setPos] = useState({ x: 90, y: 80 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: pos.x,
      startY: pos.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;
    setPos({
      x: Math.max(10, Math.min(window.innerWidth - 220, dragStartRef.current.startX + dx)),
      y: Math.max(10, Math.min(window.innerHeight - 250, dragStartRef.current.startY + dy)),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  return (
    <div 
      className="absolute bg-white/80 backdrop-blur-xl border border-white/80 rounded-2xl p-3 shadow-[0_10px_30px_rgba(0,0,0,0.08)] ring-1 ring-[#979797]/15 z-20 w-56 text-xs select-none"
      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
    >
      {/* Header with drag handle */}
      <div 
        className="flex items-center justify-between pb-2 border-b border-[#eeeeee] mb-2 cursor-move group"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="flex items-center gap-1.5 text-[#000000] font-semibold text-xs">
          <GripHorizontal className="w-3.5 h-3.5 text-[#979797] group-hover:text-[#000000] transition-colors" />
          <span>Zones ({focuses.length})</span>
        </div>
        {onClose && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-[#979797] hover:text-[#000000] p-1 rounded-full hover:bg-[#eeeeee] transition-colors"
            title="Fermer la liste"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Zones list */}
      <div className="flex flex-col gap-1 max-h-40 overflow-y-auto mb-2 pr-0.5">
        {focuses.length === 0 ? (
          <div className="text-[11px] text-[#979797] text-center py-2">
            Aucune zone active
          </div>
        ) : (
          focuses.map((f, index) => {
            const isSelected = f.id === selectedFocusId;
            return (
              <div
                key={f.id}
                onMouseEnter={() => onHoverFocus?.(f.id)}
                onMouseLeave={() => onHoverFocus?.(null)}
                className={`group flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl text-left transition-all ${
                  isSelected
                    ? 'bg-[#000000] text-white font-medium shadow-xs'
                    : 'bg-[#eeeeee]/60 hover:bg-[#eeeeee] text-[#000000]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectFocus(f.id)}
                  className="flex items-center gap-1.5 truncate flex-1 text-left"
                >
                  <Target className={`w-3 h-3 shrink-0 ${isSelected ? 'text-[#0088cc]' : 'text-[#666666]'}`} />
                  <span className="truncate text-[11px]">
                    {f.name || `Zone ${f.stepNumber || index + 1}`}
                  </span>
                </button>

                <div className="flex items-center gap-1 ml-1 shrink-0">
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-white/80 text-[#666666]'}`}>
                    {Math.round(f.width)}×{Math.round(f.height)}
                  </span>
                  {onDeleteFocus && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFocus(f.id);
                      }}
                      className={`p-1 rounded-full transition-opacity ${
                        isSelected 
                          ? 'opacity-100 hover:bg-white/20 text-rose-300 hover:text-rose-100' 
                          : 'opacity-0 group-hover:opacity-100 hover:bg-rose-50 text-[#979797] hover:text-rose-600'
                      }`}
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

      {/* Bottom Action buttons */}
      <div className="pt-2 border-t border-[#eeeeee]">
        <button
          id="mini-widget-add-focus"
          onClick={onAddFocus}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full bg-[#0088cc] hover:bg-[#0077b3] text-white font-medium text-xs shadow-xs transition-all active:scale-[0.98]"
          title="Ajouter une nouvelle zone de focus"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Ajouter une zone</span>
        </button>
      </div>
    </div>
  );
};
