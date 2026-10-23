import React from 'react';
import { 
  Eye, 
  Maximize2, 
  Ruler, 
  Magnet,
  Grid,
  ZoomIn, 
  ZoomOut, 
  Plus,
  Trash2,
  Droplet,
  Square,
  Undo2,
  Redo2,
  RotateCcw,
  Move
} from 'lucide-react';
import { GlobalStyleSettings } from '../types';
import { NumericInput } from './NumericInput';

interface TopSceneBarProps {
  screenWidth?: number;
  screenHeight?: number;
  globalStyles: GlobalStyleSettings;
  onUpdateGlobalStyles: (updated: Partial<GlobalStyleSettings>) => void;
  onAddGuideH: () => void;
  onAddGuideV: () => void;
  isPanMode?: boolean;
  onTogglePanMode?: () => void;
  zoomLevel: number;
  onSetZoom: (level: number) => void;
  // Focus Zone options
  onAddFocus?: () => void;
  onDeleteFocus?: () => void;
  hasSelectedFocus?: boolean;
  // Preview Mode
  isPreviewMode: boolean;
  onTogglePreview: () => void;
  isCalloutMode?: boolean;
  onCenterWorkspace?: () => void;
  onResetShapes?: () => void;
  // Undo / Redo
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  isDarkMode?: boolean;
}

export const TopSceneBar: React.FC<TopSceneBarProps> = ({
  screenWidth,
  screenHeight,
  globalStyles,
  onUpdateGlobalStyles,
  onAddGuideH,
  onAddGuideV,
  isPanMode,
  onTogglePanMode,
  zoomLevel,
  onSetZoom,
  onAddFocus,
  onDeleteFocus,
  hasSelectedFocus,
  isPreviewMode,
  onTogglePreview,
  isCalloutMode = false,
  onCenterWorkspace,
  onResetShapes,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  isDarkMode = false,
}) => {
  const { showRulers, showHandles, previewHD } = globalStyles;
  const barRef = React.useRef<HTMLDivElement>(null);
  const [barWidth, setBarWidth] = React.useState<number>(900);

  React.useEffect(() => {
    if (!barRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setBarWidth(entry.contentRect.width);
      }
    });
    ro.observe(barRef.current);
    return () => ro.disconnect();
  }, []);

  const isCompact = barWidth < 960;
  const isNarrow = barWidth < 760;
  const isUltraNarrow = barWidth < 620;

  return (
    <div 
      ref={barRef}
      className={`w-full backdrop-blur-xl rounded-2xl px-2.5 py-1.5 flex flex-nowrap items-center justify-between gap-1.5 text-xs select-none transition-colors duration-200 overflow-x-auto no-scrollbar shrink-0 ${
        isDarkMode
          ? 'bg-[#282828]/95 border border-[#383838] text-[#cccccc] shadow-2xs'
          : 'bg-white/70 border border-[#eeeeee] text-[#666666] shadow-xs'
      }`}
    >
      {/* Left: Title + Undo/Redo Pills + Réinitialiser + Prévisualisation */}
      <div className="flex items-center gap-1 shrink-0">
        {!isNarrow && (
          <span className={`font-semibold tracking-tight text-xs whitespace-nowrap pr-1 ${isDarkMode ? 'text-white' : 'text-[#000000]'}`}>
            Scène Studio
          </span>
        )}

        {/* Undo / Redo Pills */}
        {(onUndo || onRedo) && (
          <div className={`flex items-center gap-0.5 p-0.5 rounded-full border shrink-0 ${
            isDarkMode 
              ? 'bg-[#353535] border-[#444444]' 
              : 'bg-[#eeeeee]/80 border-[#eeeeee]'
          }`}>
            <button
              id="btn-scene-undo"
              onClick={onUndo}
              disabled={!canUndo}
              className={`p-1.5 rounded-full transition-all ${
                canUndo 
                  ? isDarkMode 
                    ? 'text-white hover:bg-white/15 shadow-2xs' 
                    : 'text-[#000000] hover:bg-white shadow-2xs' 
                  : 'text-[#979797] cursor-not-allowed opacity-30'
              }`}
              title="Annuler (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>

            <button
              id="btn-scene-redo"
              onClick={onRedo}
              disabled={!canRedo}
              className={`p-1.5 rounded-full transition-all ${
                canRedo 
                  ? isDarkMode 
                    ? 'text-white hover:bg-white/15 shadow-2xs' 
                    : 'text-[#000000] hover:bg-white shadow-2xs' 
                  : 'text-[#979797] cursor-not-allowed opacity-30'
              }`}
              title="Rétablir (Ctrl+Y ou Ctrl+Shift+Z)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Bouton Réinitialiser */}
        {onResetShapes && (
          <button
            id="btn-scene-reset-shapes"
            onClick={onResetShapes}
            className={`flex items-center gap-1 rounded-full font-medium transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98] cursor-pointer border whitespace-nowrap shrink-0 ${
              isCompact ? 'p-1.5 text-xs' : 'px-2.5 py-1 text-[11px]'
            } ${
              isDarkMode
                ? 'bg-[#353535] text-[#dddddd] hover:bg-[#404040] hover:text-white border-[#444444]'
                : 'bg-[#eeeeee]/80 text-[#000000] hover:bg-[#eeeeee] border-transparent'
            }`}
            title="Réinitialiser toutes les formes et annotations du canevas"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
            {!isCompact && <span>Réinitialiser</span>}
          </button>
        )}

        {/* Bouton Prévisualisation mis en valeur */}
        <button
          id="btn-toggle-preview-mode"
          onClick={onTogglePreview}
          className={`flex items-center gap-1 rounded-full font-medium transition-all border whitespace-nowrap shrink-0 ${
            isNarrow ? 'p-1.5 text-xs' : isCompact ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1 text-[11px]'
          } ${
            isPreviewMode
              ? 'bg-[#0088cc] text-white border-[#0088cc] shadow-xs'
              : isDarkMode
                ? 'bg-[#353535] text-[#dddddd] hover:bg-[#404040] border-[#444444]'
                : 'bg-[#eeeeee]/80 text-[#000000] hover:bg-[#eeeeee] border-transparent'
          }`}
          title="Prévisualiser le résultat final sans repères ni poignées"
        >
          <Eye className="w-3.5 h-3.5" />
          {!isNarrow && (
            <span>
              {isPreviewMode 
                ? (isCompact ? 'Fermer' : 'Fermer Aperçu') 
                : (isCompact ? 'Aperçu' : 'Prévisualisation')}
            </span>
          )}
        </button>
      </div>

      {/* Center Controls (Handles, Rulers, Snap, Grid, Nudge) */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Poignées ON / OFF */}
        <button
          id="btn-toggle-handles"
          onClick={() => onUpdateGlobalStyles({ showHandles: !showHandles })}
          className={`flex items-center gap-1 rounded-full font-medium transition-all border whitespace-nowrap shrink-0 ${
            isCompact ? 'p-1.5 text-xs' : 'px-2 py-1 text-[11px]'
          } ${
            showHandles 
              ? 'bg-[#0088cc] border-[#0088cc] text-white font-medium shadow-xs' 
              : isDarkMode 
                ? 'bg-[#353535] text-[#e0e0e0] hover:text-white hover:bg-[#404040] border-[#444444]'
                : 'bg-[#eeeeee]/80 text-[#666666] hover:text-[#000000] hover:bg-[#eeeeee] border-transparent'
          }`}
          title={`Poignées de redimensionnement (${showHandles ? 'Actives - Cliquer pour masquer' : 'Masquées - Cliquer pour afficher'})`}
        >
          <Maximize2 className="w-3.5 h-3.5" />
          {!isCompact && <span>Poignées {showHandles ? 'ON' : 'OFF'}</span>}
        </button>

        {/* Règles ON / OFF */}
        <button
          id="btn-toggle-rulers"
          onClick={() => onUpdateGlobalStyles({ showRulers: !showRulers })}
          className={`flex items-center gap-1 rounded-full font-medium transition-all border whitespace-nowrap shrink-0 ${
            isCompact ? 'p-1.5 text-xs' : 'px-2 py-1 text-[11px]'
          } ${
            showRulers 
              ? 'bg-[#0088cc] border-[#0088cc] text-white font-medium shadow-xs' 
              : isDarkMode
                ? 'bg-[#353535] text-[#e0e0e0] hover:text-white hover:bg-[#404040] border-[#444444]'
                : 'bg-[#eeeeee]/80 text-[#666666] hover:text-[#000000] hover:bg-[#eeeeee] border-transparent'
          }`}
          title={`Règles graduées Photoshop (${showRulers ? 'Actives - Cliquer pour masquer' : 'Masquées - Cliquer pour afficher'})`}
        >
          <Ruler className="w-3.5 h-3.5" />
          {!isCompact && <span>Règles {showRulers ? 'ON' : 'OFF'}</span>}
        </button>

        {/* Magnétisme (Snap) ON / OFF */}
        <button
          id="btn-toggle-snap"
          onClick={() => onUpdateGlobalStyles({ snapToGuides: globalStyles.snapToGuides === false ? true : false })}
          className={`flex items-center gap-1 rounded-full font-medium transition-all border whitespace-nowrap shrink-0 ${
            isCompact ? 'p-1.5 text-xs' : 'px-2 py-1 text-[11px]'
          } ${
            globalStyles.snapToGuides !== false
              ? 'bg-[#0088cc] border-[#0088cc] text-white font-medium shadow-xs' 
              : isDarkMode
                ? 'bg-[#353535] text-[#e0e0e0] hover:text-white hover:bg-[#404040] border-[#444444]'
                : 'bg-[#eeeeee]/80 text-[#666666] hover:text-[#000000] hover:bg-[#eeeeee] border-transparent'
          }`}
          title={`Magnétisme Photoshop Snap (${globalStyles.snapToGuides !== false ? 'Actif - Cliquer pour désactiver' : 'Désactivé - Cliquer pour activer'})`}
        >
          <Magnet className="w-3.5 h-3.5" />
          {!isCompact && <span>Snap {globalStyles.snapToGuides !== false ? 'ON' : 'OFF'}</span>}
        </button>

        {/* Grille Photoshop ON / OFF */}
        <button
          id="btn-toggle-grid"
          onClick={() => onUpdateGlobalStyles({ showGrid: !globalStyles.showGrid })}
          className={`flex items-center gap-1 rounded-full font-medium transition-all border whitespace-nowrap shrink-0 ${
            isCompact ? 'p-1.5 text-xs' : 'px-2 py-1 text-[11px]'
          } ${
            globalStyles.showGrid
              ? 'bg-[#0088cc] border-[#0088cc] text-white font-medium shadow-xs' 
              : isDarkMode
                ? 'bg-[#353535] text-[#e0e0e0] hover:text-white hover:bg-[#404040] border-[#444444]'
                : 'bg-[#eeeeee]/80 text-[#666666] hover:text-[#000000] hover:bg-[#eeeeee] border-transparent'
          }`}
          title={`Grille de précision Photoshop (${globalStyles.showGrid ? 'Active - Cliquer pour masquer' : 'Masquée - Cliquer pour afficher'})`}
        >
          <Grid className="w-3.5 h-3.5" />
          {!isCompact && <span>Grille {globalStyles.showGrid ? 'ON' : 'OFF'}</span>}
        </button>

        {/* Pas de déplacement des flèches : responsive compact ou full */}
        {isNarrow ? (
          <button
            type="button"
            onClick={() => {
              const steps = [0.1, 0.5, 1, 5, 10];
              const curr = globalStyles.nudgeStep ?? 1;
              const nextIndex = (steps.indexOf(curr) + 1) % steps.length;
              onUpdateGlobalStyles({ nudgeStep: steps[nextIndex] });
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium border transition-all shrink-0 cursor-pointer ${
              isDarkMode
                ? 'bg-[#353535] border-[#444444] text-[#dddddd] hover:bg-[#404040]'
                : 'bg-[#eeeeee]/80 border-transparent text-[#666666] hover:bg-[#eeeeee]'
            }`}
            title={`Pas de déplacement au clavier : ${globalStyles.nudgeStep ?? 1}px. Cliquer pour changer (0.1, 0.5, 1, 5, 10px)`}
          >
            <Move className="w-3 h-3 text-[#0088cc] shrink-0" />
            <span className="font-mono font-bold text-[10px] text-[#0088cc]">{globalStyles.nudgeStep ?? 1}px</span>
          </button>
        ) : (
          <div 
            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-medium border transition-all shrink-0 ${
              isDarkMode
                ? 'bg-[#353535] border-[#444444] text-[#dddddd]'
                : 'bg-[#eeeeee]/80 border-transparent text-[#666666]'
            }`}
            title="Pas de déplacement avec les flèches du clavier. Raccourcis : Alt + Flèches = 0.1 px • Shift + Flèches = 10 px"
          >
            <Move className="w-3 h-3 text-[#0088cc] mr-0.5 shrink-0" />
            <span className="text-[10px] text-[#888888] font-medium mr-0.5">Pas:</span>
            {[0.1, 0.5, 1, 5, 10].map((step) => {
              const isSelected = (globalStyles.nudgeStep ?? 1) === step;
              return (
                <button
                  key={step}
                  type="button"
                  onClick={() => onUpdateGlobalStyles({ nudgeStep: step })}
                  className={`px-1 py-0.2 rounded-full font-mono text-[9.5px] font-semibold transition-all ${
                    isSelected
                      ? 'bg-[#0088cc] text-white shadow-2xs'
                      : isDarkMode
                        ? 'text-[#cccccc] hover:text-white hover:bg-white/10'
                        : 'text-[#666666] hover:text-[#000000] hover:bg-black/5'
                  }`}
                  title={`Régler le pas à ${step} px`}
                >
                  {step}
                </button>
              );
            })}
            <span className="text-[9px] text-[#888888] font-mono ml-0.5">px</span>
          </div>
        )}
      </div>

      {/* Right: Zoom controls & Recentrer - ALWAYS PINNED & NEVER CUT OFF */}
      <div className="flex items-center gap-1.5 shrink-0 ml-auto">
        <div className={`flex items-center rounded-full p-0.5 text-[11px] border shrink-0 ${
          isDarkMode ? 'bg-[#353535] border-[#444444]' : 'bg-[#eeeeee]/80 border-transparent'
        }`}>
          <button
            onClick={() => onSetZoom(Math.max(0.25, Math.round((zoomLevel - 0.25) * 100) / 100))}
            className={`p-1 rounded-full transition-colors ${
              isDarkMode ? 'text-[#e0e0e0] hover:text-white' : 'text-[#666666] hover:text-[#000000]'
            }`}
            title="Zoom arrière (Alt + Clic ou Ctrl+-)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          {/* Saisie directe du niveau de zoom */}
          <div className={`${isNarrow ? 'w-11' : 'w-13'} mx-0.5`}>
            <NumericInput
              value={Math.round(zoomLevel * 100)}
              onChange={(val) => {
                if (val >= 25 && val <= 500) {
                  onSetZoom(val / 100);
                }
              }}
              min={25}
              max={500}
              unit="%"
            />
          </div>

          <button
            onClick={() => onSetZoom(Math.min(5, Math.round((zoomLevel + 0.25) * 100) / 100))}
            className={`p-1 rounded-full transition-colors ${
              isDarkMode ? 'text-[#e0e0e0] hover:text-white' : 'text-[#666666] hover:text-[#000000]'
            }`}
            title="Zoom avant (Clic ou Ctrl++)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bouton Recentrer le plan de travail (vue 100%, centrée) */}
        <button
          id="btn-scene-center"
          onClick={onCenterWorkspace || (() => onSetZoom(1))}
          className={`flex items-center gap-1 rounded-full font-medium transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98] border whitespace-nowrap shrink-0 ${
            isNarrow ? 'p-1.5' : 'px-2.5 py-1 text-[11px]'
          } ${
            zoomLevel === 1 
              ? 'bg-[#0088cc] border-[#0088cc] text-white shadow-xs' 
              : isDarkMode
                ? 'bg-[#353535] text-[#e0e0e0] hover:text-white hover:bg-[#404040] border-[#444444]'
                : 'bg-[#eeeeee]/80 text-[#666666] hover:text-[#000000] hover:bg-[#eeeeee] border-transparent'
          }`}
          title="Recentrer le plan de travail (vue 100%, centrée)"
        >
          <Maximize2 className={`w-3 h-3 ${
            zoomLevel === 1 
              ? 'text-white' 
              : (isDarkMode ? 'text-[#e0e0e0]' : 'text-[#666666]')
          }`} />
          {!isNarrow && <span>Recentrer</span>}
        </button>
      </div>
    </div>
  );
};
