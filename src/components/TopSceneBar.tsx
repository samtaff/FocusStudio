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
  Square
} from 'lucide-react';
import { GlobalStyleSettings } from '../types';
import { NumericInput } from './NumericInput';

interface TopSceneBarProps {
  screenWidth: number;
  screenHeight: number;
  globalStyles: GlobalStyleSettings;
  onUpdateGlobalStyles: (updated: Partial<GlobalStyleSettings>) => void;
  onAddGuideH: () => void;
  onAddGuideV: () => void;
  isPanMode: boolean;
  onTogglePanMode: () => void;
  zoomLevel: number;
  onSetZoom: (level: number) => void;
  // Focus Zone options
  onAddFocus?: () => void;
  onDeleteFocus?: () => void;
  hasSelectedFocus?: boolean;
  // Preview Mode
  isPreviewMode: boolean;
  onTogglePreview: () => void;
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
}) => {
  const { showRulers, showHandles, previewHD } = globalStyles;

  return (
    <div className="w-full bg-white/70 backdrop-blur-xl border border-[#eeeeee] rounded-2xl px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 shadow-xs text-xs select-none">
      {/* Left: Title + Dimensions Badge */}
      <div className="flex items-center gap-2">
        <span className="font-semibold text-[#000000] tracking-tight text-xs">
          Scène Studio
        </span>
        <span className="px-2.5 py-0.5 rounded-full bg-[#eeeeee] text-[#666666] font-mono text-[11px] font-medium">
          {screenWidth} × {screenHeight} px
        </span>

        {/* Bouton Prévisualisation mis en valeur */}
        <button
          id="btn-toggle-preview-mode"
          onClick={onTogglePreview}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
            isPreviewMode
              ? 'bg-[#0088cc] text-white shadow-xs'
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
              ? 'bg-[#000000] text-white' 
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
              : 'bg-[#eeeeee]/80 text-[#666666] hover:text-[#000000] hover:bg-[#eeeeee]'
          }`}
          title="Afficher/masquer les règles de mesure en pixels"
        >
          <Ruler className="w-3.5 h-3.5" />
          <span>Règles {showRulers ? 'ON' : 'OFF'}</span>
        </button>

        {/* Réglage Zone de travail */}
        <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#eeeeee]/80 text-[11px]">
          <span className="text-[#666666] font-medium">Zone :</span>
          <div className="w-18">
            <NumericInput
              value={globalStyles.workspaceWidth || 260}
              onChange={(w) => onUpdateGlobalStyles({ workspaceWidth: Math.min(500, Math.max(200, w)) })}
              min={200}
              max={500}
              unit="px"
            />
          </div>
        </div>
      </div>

      {/* Right: Zoom controls */}
      <div className="flex items-center gap-1.5">
        <div className="flex items-center bg-[#eeeeee]/80 rounded-full p-0.5 text-[11px]">
          <button
            onClick={() => onSetZoom(Math.max(0.25, Math.round((zoomLevel - 0.25) * 100) / 100))}
            className="p-1 text-[#666666] hover:text-[#000000] rounded-full transition-colors"
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
            className="p-1 text-[#666666] hover:text-[#000000] rounded-full transition-colors"
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
              ? 'bg-[#000000] text-white' 
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
