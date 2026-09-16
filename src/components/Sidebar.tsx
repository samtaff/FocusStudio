import React from 'react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Layers, 
  Sliders, 
  Maximize2, 
  ScanSearch, 
  Sparkles, 
  AlignHorizontalJustifyCenter,
  Download,
  ClipboardCopy,
  Check,
  Palette,
  Square,
  Hash,
  FileDown
} from 'lucide-react';
import { FocusZone, DetectedElement, GlobalStyleSettings } from '../types';
import { BASE_COLOR } from '../utils/canvasRenderer';

interface SidebarProps {
  focuses: FocusZone[];
  selectedFocus: FocusZone | null;
  onSelectFocus: (id: string | null) => void;
  onAddFocus: () => void;
  onUpdateFocus: (updated: Partial<FocusZone>) => void;
  onDeleteFocus: (id: string) => void;
  onDuplicateFocus: (id: string) => void;
  onCenterFocusHorizontally: (id: string) => void;
  detectedElements: DetectedElement[];
  isDetecting: boolean;
  onTriggerDetection: () => void;
  onApplyDetectedElement: (el: DetectedElement) => void;
  compDimensions: { width: number; height: number };
  globalStyles: GlobalStyleSettings;
  onUpdateGlobalStyles: (updated: Partial<GlobalStyleSettings>) => void;
  onExportPng: () => void;
  onCopyClipboard: () => void;
  isExporting: boolean;
  copied: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  focuses,
  selectedFocus,
  onSelectFocus,
  onAddFocus,
  onUpdateFocus,
  onDeleteFocus,
  onDuplicateFocus,
  onCenterFocusHorizontally,
  detectedElements,
  isDetecting,
  onTriggerDetection,
  onApplyDetectedElement,
  compDimensions,
  globalStyles,
  onUpdateGlobalStyles,
  onExportPng,
  onCopyClipboard,
  isExporting,
  copied,
}) => {
  return (
    <aside className="w-84 border-l border-slate-800 bg-[#0d1424] flex flex-col h-full overflow-y-auto select-none shrink-0 z-20 text-slate-300 text-xs">
      {/* Top Action: + Ajouter un focus */}
      <div className="p-4 border-b border-slate-800/80 bg-[#0b1120] flex flex-col gap-2.5">
        <button
          id="sidebar-add-focus-btn"
          onClick={onAddFocus}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#25465F] hover:bg-[#2e5573] text-white font-bold text-xs tracking-wide shadow-md transition-all border border-sky-400/30 active:scale-[0.99]"
        >
          <Plus className="w-4 h-4 text-sky-300" />
          <span>+ Ajouter un focus</span>
        </button>

        {/* Composition Dimensions Badge */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-900/80 px-2.5 py-1.5 rounded-md border border-slate-800">
          <span>Dimensions finales :</span>
          <span className="font-mono text-sky-400 font-semibold">
            {compDimensions.width} × {compDimensions.height} px
            {compDimensions.height === 490 && (
              <span className="text-[10px] text-emerald-400 font-sans ml-1">(max 490px)</span>
            )}
          </span>
        </div>
      </div>

      {/* Selected Focus Properties */}
      {selectedFocus ? (
        <div className="p-4 flex flex-col gap-4 border-b border-slate-800 bg-[#0f172a]/50">
          {/* Header of properties */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-400" />
              <span className="font-bold text-white text-xs uppercase tracking-wider">
                Propriétés du Focus
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                id="sidebar-duplicate-focus-btn"
                onClick={() => onDuplicateFocus(selectedFocus.id)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Dupliquer (Ctrl+D)"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                id="sidebar-delete-focus-btn"
                onClick={() => onDeleteFocus(selectedFocus.id)}
                className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
                title="Supprimer (Suppr)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Label Name */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-slate-400">Nom du focus</label>
            <input
              type="text"
              id="focus-name-input"
              value={selectedFocus.name}
              onChange={(e) => onUpdateFocus({ name: e.target.value })}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-md text-white focus:outline-none focus:border-sky-500 font-medium text-xs"
              placeholder="Ex: Empreintes"
            />
          </div>

          {/* 1. Dimensions: Largeur & Hauteur */}
          <div className="flex flex-col gap-2 pt-1 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 text-xs">Dimensions</span>
              <button
                onClick={() => onCenterFocusHorizontally(selectedFocus.id)}
                className="flex items-center gap-1 text-[10px] text-sky-400 hover:text-sky-300 bg-sky-950/40 hover:bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800/40 transition-colors"
                title="Centrer le focus par rapport au smartphone (débordement symétrique)"
              >
                <AlignHorizontalJustifyCenter className="w-3 h-3" />
                <span>Centrer sur smartphone</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Largeur</span>
                  <span className="font-mono text-slate-200">{Math.round(selectedFocus.width)} px</span>
                </div>
                <input
                  type="number"
                  id="focus-width-input"
                  min="40"
                  max="800"
                  value={Math.round(selectedFocus.width)}
                  onChange={(e) => onUpdateFocus({ width: Math.max(20, Number(e.target.value)) })}
                  className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-md text-white font-mono text-xs focus:outline-none focus:border-sky-500"
                />
                <input
                  type="range"
                  min="60"
                  max="450"
                  step="2"
                  value={Math.round(selectedFocus.width)}
                  onChange={(e) => onUpdateFocus({ width: Number(e.target.value) })}
                  className="accent-[#25465F] h-1.5 bg-slate-700 rounded-lg cursor-pointer mt-0.5"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Hauteur</span>
                  <span className="font-mono text-slate-200">{Math.round(selectedFocus.height)} px</span>
                </div>
                <input
                  type="number"
                  id="focus-height-input"
                  min="20"
                  max="400"
                  value={Math.round(selectedFocus.height)}
                  onChange={(e) => onUpdateFocus({ height: Math.max(15, Number(e.target.value)) })}
                  className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-md text-white font-mono text-xs focus:outline-none focus:border-sky-500"
                />
                <input
                  type="range"
                  min="25"
                  max="200"
                  step="2"
                  value={Math.round(selectedFocus.height)}
                  onChange={(e) => onUpdateFocus({ height: Number(e.target.value) })}
                  className="accent-[#25465F] h-1.5 bg-slate-700 rounded-lg cursor-pointer mt-0.5"
                />
              </div>
            </div>

            {/* Quick dimension presets */}
            <div className="flex items-center gap-1 mt-0.5">
              <button
                onClick={() => onUpdateFocus({ width: 280, height: 60 })}
                className="flex-1 text-[10px] py-1 px-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 text-center transition-colors"
                title="Format type procédure débordant"
              >
                Modèle (280 × 60)
              </button>
              <button
                onClick={() => onUpdateFocus({ width: 240, height: 50 })}
                className="flex-1 text-[10px] py-1 px-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-center transition-colors"
                title="Format standard compact"
              >
                Standard (240 × 50)
              </button>
            </div>
          </div>

          {/* 2. Arrondis & Relief */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
            <div className="flex justify-between items-center text-[11px]">
              <span className="font-semibold text-slate-200">Arrondis des coins</span>
              <span className="font-mono text-sky-400 font-bold">{selectedFocus.borderRadius ?? 14} px</span>
            </div>
            <input
              type="range"
              id="focus-borderradius-slider"
              min="0"
              max="30"
              step="1"
              value={selectedFocus.borderRadius ?? 14}
              onChange={(e) => onUpdateFocus({ borderRadius: parseInt(e.target.value) })}
              className="accent-[#25465F] h-1.5 bg-slate-700 rounded-lg cursor-pointer"
            />

            {/* Shadow toggle */}
            <div className="flex items-center justify-between pt-1">
              <label htmlFor="shadow-toggle" className="text-slate-400 text-[11px] cursor-pointer">
                Ombre portée (relief sous le focus)
              </label>
              <input
                id="shadow-toggle"
                type="checkbox"
                checked={selectedFocus.hasShadow !== false}
                onChange={(e) => onUpdateFocus({ hasShadow: e.target.checked })}
                className="rounded bg-slate-800 border-slate-700 text-[#25465F] focus:ring-0 cursor-pointer"
              />
            </div>
          </div>

          {/* 3. Contour (Épaisseur & Couleur) */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
            <div className="flex justify-between items-center text-[11px]">
              <span className="font-semibold text-slate-200">Contour</span>
              <span className="font-mono text-slate-200">{selectedFocus.borderWidth} pt</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                id="focus-borderwidth-slider"
                min="1"
                max="6"
                step="0.5"
                value={selectedFocus.borderWidth}
                onChange={(e) => onUpdateFocus({ borderWidth: parseFloat(e.target.value) })}
                className="flex-1 accent-[#25465F] h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 font-mono w-7 text-right">
                {selectedFocus.borderWidth} pt
              </span>
            </div>

            <div className="flex items-center justify-between mt-1">
              <span className="text-slate-400 text-[11px]">Couleur du contour</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="focus-bordercolor-picker"
                  value={selectedFocus.borderColor || BASE_COLOR}
                  onChange={(e) => onUpdateFocus({ borderColor: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer border border-slate-700 bg-transparent p-0"
                />
                <button
                  onClick={() => onUpdateFocus({ borderColor: BASE_COLOR })}
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${
                    selectedFocus.borderColor === BASE_COLOR
                      ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                  title="Couleur officielle #25465F"
                >
                  #25465F
                </button>
              </div>
            </div>
          </div>

          {/* 4. Pastille d'étape numérotée (Requirement 2) */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-sky-400" />
                <span className="font-semibold text-slate-200">Pastille d'étape</span>
              </div>
              <input
                type="checkbox"
                checked={selectedFocus.showStepBadge !== false}
                onChange={(e) => onUpdateFocus({ showStepBadge: e.target.checked })}
                className="rounded bg-slate-800 border-slate-700 text-[#25465F] focus:ring-0 cursor-pointer"
                title="Afficher la pastille avec le numéro de l'étape"
              />
            </div>

            {selectedFocus.showStepBadge !== false && (
              <div className="space-y-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Numéro de l'étape</span>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={selectedFocus.stepNumber ?? 1}
                    onChange={(e) => onUpdateFocus({ stepNumber: parseInt(e.target.value) || 1 })}
                    className="w-14 px-2 py-0.5 bg-slate-950 border border-slate-700 rounded text-center text-white font-bold font-mono text-xs"
                  />
                </div>

                {/* Odd = Left, Even = Right Rule Indicator */}
                <div className="flex flex-col gap-1 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Position du badge :</span>
                    <span className="font-semibold text-sky-400">
                      {(selectedFocus.stepNumber ?? 1) % 2 !== 0 ? 'Gauche (Impair)' : 'Droite (Pair)'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 mt-1">
                    <button
                      onClick={() => onUpdateFocus({ badgePosition: 'auto' })}
                      className={`text-[10px] py-1 rounded border transition-colors ${
                        selectedFocus.badgePosition === 'auto'
                          ? 'bg-[#25465F] text-white border-sky-400 font-bold'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                      title="Règle automatique : impairs à gauche, pairs à droite"
                    >
                      Auto (imp/pair)
                    </button>
                    <button
                      onClick={() => onUpdateFocus({ badgePosition: 'left' })}
                      className={`text-[10px] py-1 rounded border transition-colors ${
                        selectedFocus.badgePosition === 'left'
                          ? 'bg-[#25465F] text-white border-sky-400 font-bold'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      Gauche
                    </button>
                    <button
                      onClick={() => onUpdateFocus({ badgePosition: 'right' })}
                      className={`text-[10px] py-1 rounded border transition-colors ${
                        selectedFocus.badgePosition === 'right'
                          ? 'bg-[#25465F] text-white border-sky-400 font-bold'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      Droite
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 5. Agrandissement (Zoom) */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/80">
            <div className="flex justify-between items-center text-[11px]">
              <span className="font-semibold text-slate-200">Agrandissement (Zoom)</span>
              <span className="font-mono font-bold text-sky-400 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-800/50">
                {selectedFocus.zoom.toFixed(2)}×
              </span>
            </div>
            <input
              type="range"
              id="focus-zoom-slider"
              min="1.0"
              max="3.5"
              step="0.05"
              value={selectedFocus.zoom}
              onChange={(e) => onUpdateFocus({ zoom: parseFloat(e.target.value) })}
              className="accent-[#25465F] h-1.5 bg-slate-700 rounded-lg cursor-pointer"
            />
            <div className="flex items-center justify-between gap-1 mt-0.5">
              {[1.2, 1.4, 1.6, 2.0, 2.5].map((preset) => (
                <button
                  key={preset}
                  onClick={() => onUpdateFocus({ zoom: preset })}
                  className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                    Math.abs(selectedFocus.zoom - preset) < 0.05
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-bold'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {preset}×
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 border-b border-slate-800 text-center text-slate-500 bg-slate-900/30">
          <p className="text-xs">Aucun focus sélectionné.</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Cliquez sur un rectangle ou sur "+ Ajouter un focus" ci-dessus.
          </p>
        </div>
      )}

      {/* Global Colors & Background Tint */}
      <div className="p-4 border-b border-slate-800 bg-[#0a101d]">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Palette className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-semibold text-slate-200 text-xs">
            Teinte d'arrière-plan
          </span>
        </div>

        <div className="space-y-2 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Couleur du voile</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={globalStyles.bgTintColor}
                onChange={(e) => onUpdateGlobalStyles({ bgTintColor: e.target.value })}
                className="w-5 h-5 rounded cursor-pointer border border-slate-700 bg-transparent p-0"
              />
              <span className="font-mono text-[10px] text-slate-300">{globalStyles.bgTintColor}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-slate-400">
              <span>Opacité du filtre</span>
              <span className="font-mono text-slate-200">
                {Math.round(globalStyles.bgTintOpacity * 100)} %
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="0.9"
              step="0.05"
              value={globalStyles.bgTintOpacity}
              onChange={(e) => onUpdateGlobalStyles({ bgTintOpacity: parseFloat(e.target.value) })}
              className="accent-[#25465F] h-1.5 bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Focus List */}
      <div className="p-4 border-b border-slate-800 flex-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-semibold text-slate-200 text-xs">
              Liste des focus ({focuses.length})
            </span>
          </div>
        </div>

        {focuses.length === 0 ? (
          <div className="p-3 text-center rounded-lg border border-dashed border-slate-800 text-slate-500 text-[11px]">
            Aucun focus actif.
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
            {focuses.map((f, index) => {
              const isSelected = f.id === selectedFocus?.id;
              return (
                <div
                  key={f.id}
                  onClick={() => onSelectFocus(f.id)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-[#25465F]/40 border-sky-400/50 text-white shadow-sm'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/80 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="w-4 h-4 rounded bg-[#25465F] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                      {f.stepNumber ?? index + 1}
                    </span>
                    <span className="font-medium truncate text-xs">{f.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 shrink-0">
                    <span>{f.zoom.toFixed(1)}×</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Options d'exportation (Requirement 6) */}
      <div className="p-4 bg-[#090e18] border-t border-slate-800 flex flex-col gap-2.5 mt-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <FileDown className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-bold text-white text-xs uppercase tracking-wider">
              Options d'exportation
            </span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
            PNG Transparent
          </span>
        </div>

        {/* Resolution Scale Selector */}
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Résolution :</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onUpdateGlobalStyles({ exportScale: 1 })}
              className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                globalStyles.exportScale === 1
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 font-bold'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              1× (490px)
            </button>
            <button
              onClick={() => onUpdateGlobalStyles({ exportScale: 2 })}
              className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                globalStyles.exportScale === 2
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 font-bold'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Haute résolution Retina (980px)"
            >
              2× Retina
            </button>
          </div>
        </div>

        {/* Primary Export Button */}
        <button
          id="sidebar-export-png-btn"
          onClick={onExportPng}
          disabled={isExporting}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#25465F] hover:bg-[#2e5573] text-white font-bold text-xs tracking-wide shadow-lg border border-sky-400/40 transition-all active:scale-[0.99]"
        >
          <Download className="w-4 h-4 text-sky-300" />
          <span>{isExporting ? 'Génération...' : 'Exporter PNG (avec transparence)'}</span>
        </button>

        {/* Copy to Clipboard */}
        <button
          onClick={onCopyClipboard}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Image copiée dans le presse-papier !</span>
            </>
          ) : (
            <>
              <ClipboardCopy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copier le visuel PNG</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
