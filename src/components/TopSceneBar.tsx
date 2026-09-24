import React from 'react';
import { 
  Eye, 
  Maximize2, 
  Ruler, 
  ZoomIn, 
  ZoomOut, 
  Plus,
  Trash2,
  Droplet,
  Square,
  Undo2,
  Redo2,
  Mouse
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
  isPanMode: boolean;
  onTogglePanMode: () => void;
  zoomLevel: number;
  onSetZoom: (level: number) => void;
  wheelMode?: 'pan' | 'zoom';
  onToggleWheelMode?: () => void;
  // Focus Zone options
  onAddFocus?: () => void;
  onDeleteFocus?: () => void;
  hasSelectedFocus?: boolean;
  // Preview Mode
  isPreviewMode: boolean;
  onTogglePreview: () => void;
  isCalloutMode?: boolean;
  onCenterWorkspace?: () => void;
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
  wheelMode = 'pan',
  onToggleWheelMode,
  onAddFocus,
  onDeleteFocus,
  hasSelectedFocus,
  isPreviewMode,
  onTogglePreview,
  isCalloutMode = false,
  onCenterWorkspace,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  isDarkMode = false,
}) => {
  const { showRulers, showHandles, previewHD } = globalStyles;

  return (
    <div className={`w-full backdrop-blur-xl rounded-2xl px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs select-none transition-colors duration-200 ${
      isDarkMode
        ? 'bg-[#282828]/95 border border-[#383838] text-[#cccccc] shadow-2xs'
        : 'bg-white/70 border border-[#eeeeee] text-[#666666] shadow-xs'
    }`}>
      {/* Left: Title + Undo/Redo Pills */}
      <div className="flex items-center gap-2">
        <span className={`font-semibold tracking-tight text-xs ${isDarkMode ? 'text-white' : 'text-[#000000]'}`}>
          Scène Studio
        </span>

        {/* Bouton Recentrer le plan de travail dans la div Scène Studio */}
        {onCenterWorkspace && (
          <button
            id="btn-scene-center"
            onClick={onCenterWorkspace}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98] ${
              isDarkMode
                ? 'bg-[#353535] hover:bg-[#404040] text-white border border-[#444444]'
                : 'bg-[#eeeeee]/80 hover:bg-[#eeeeee] text-[#000000]'
            }`}
            title="Recentrer le plan de travail (vue 100%, centrée)"
          >
            <Maximize2 className={`w-3.5 h-3.5 ${isDarkMode ? 'text-[#bbbbbb]' : 'text-[#666666]'}`} />
            <span>Recentrer</span>
          </button>
        )}

        {/* Undo / Redo Pills */}
        {(onUndo || onRedo) && (
          <div className={`flex items-center gap-0.5 p-0.5 rounded-full border ${
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

        {/* Bouton Prévisualisation mis en valeur */}
        <button
          id="btn-toggle-preview-mode"
          onClick={onTogglePreview}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
            isPreviewMode
              ? 'bg-[#0088cc] text-white shadow-xs'
              : isDarkMode
                ? 'bg-[#353535] text-[#dddddd] hover:bg-[#404040] border border-[#444444]'
                : 'bg-[#eeeeee]/80 text-[#000000] hover:bg-[#eeeeee]'
          }`}
          title="Prévisualiser le résultat final sans repères ni poignées"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{isPreviewMode ? 'Quitter Prévisualisation' : 'Prévisualisation'}</span>
        </button>
      </div>

      {/* Center Controls */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Poignées ON / OFF */}
        <button
          id="btn-toggle-handles"
          onClick={() => onUpdateGlobalStyles({ showHandles: !showHandles })}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
            showHandles 
              ? isDarkMode ? 'bg-white text-black font-semibold' : 'bg-[#000000] text-white' 
              : isDarkMode 
                ? 'bg-[#353535] text-[#aaaaaa] hover:text-white hover:bg-[#404040] border border-[#444444]'
                : 'bg-[#eeeeee]/80 text-[#666666] hover:text-[#000000] hover:bg-[#eeeeee]'
          }`}
          title="Afficher/masquer les poignées de redimensionnement"
        >
          <Maximize2 className="w-3 h-3" />
          <span>Poignées {showHandles ? 'ON' : 'OFF'}</span>
        </button>

        {/* Règles ON / OFF */}
        <button
          id="btn-toggle-rulers"
          onClick={() => onUpdateGlobalStyles({ showRulers: !showRulers })}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
            showRulers 
              ? 'bg-[#0088cc] text-white font-medium' 
              : isDarkMode
                ? 'bg-[#353535] text-[#aaaaaa] hover:text-white hover:bg-[#404040] border border-[#444444]'
                : 'bg-[#eeeeee]/80 text-[#666666] hover:text-[#000000] hover:bg-[#eeeeee]'
          }`}
          title="Afficher/masquer les règles de mesure en pixels"
        >
          <Ruler className="w-3.5 h-3.5" />
          <span>Règles {showRulers ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* Right: Wheel mode & Zoom controls */}
      <div className="flex items-center gap-1.5">
        {onToggleWheelMode && (
          <button
            id="btn-toggle-wheel-mode"
            type="button"
            onClick={onToggleWheelMode}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
              wheelMode === 'zoom'
                ? 'bg-[#0088cc] text-white shadow-2xs'
                : isDarkMode
                  ? 'bg-[#353535] text-[#aaaaaa] hover:text-white hover:bg-[#404040] border border-[#444444]'
                  : 'bg-[#eeeeee]/80 text-[#666666] hover:text-[#000000] hover:bg-[#eeeeee]'
            }`}
            title={
              wheelMode === 'zoom'
                ? "Mode Molette : ZOOM DIRECT (cliquez pour basculer en mode Déplacement)"
                : "Mode Molette : DÉPLACER LE PLAN (cliquez pour basculer en mode Zoom direct)"
            }
          >
            <Mouse className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Molette :</span>
            <span className="font-semibold">{wheelMode === 'zoom' ? 'Zoom' : 'Déplacer'}</span>
          </button>
        )}

        <div className={`flex items-center rounded-full p-0.5 text-[11px] ${
          isDarkMode ? 'bg-[#353535] border border-[#444444]' : 'bg-[#eeeeee]/80'
        }`}>
          <button
            onClick={() => onSetZoom(Math.max(0.25, Math.round((zoomLevel - 0.25) * 100) / 100))}
            className={`p-1 rounded-full transition-colors ${
              isDarkMode ? 'text-[#aaaaaa] hover:text-white' : 'text-[#666666] hover:text-[#000000]'
            }`}
            title="Zoom arrière (Alt + Clic ou Ctrl+-)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          {/* Saisie directe du niveau de zoom */}
          <div className="w-16 mx-0.5">
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
              isDarkMode ? 'text-[#aaaaaa] hover:text-white' : 'text-[#666666] hover:text-[#000000]'
            }`}
            title="Zoom avant (Clic ou Ctrl++)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bouton Réinitialiser le zoom 100% */}
        <button
          onClick={() => onSetZoom(1)}
          className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
            zoomLevel === 1 
              ? isDarkMode ? 'bg-white text-black font-semibold' : 'bg-[#000000] text-white' 
              : isDarkMode
                ? 'bg-[#353535] text-[#aaaaaa] hover:text-white hover:bg-[#404040] border border-[#444444]'
                : 'bg-[#eeeeee]/80 text-[#666666] hover:text-[#000000] hover:bg-[#eeeeee]'
          }`}
          title="Taille réelle (100%)"
        >
          100%
        </button>
      </div>
    </div>
  );
};
