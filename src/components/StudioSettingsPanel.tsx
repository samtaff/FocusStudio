import React, { useState } from 'react';
import { 
  RotateCcw, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Copy, 
  AlignHorizontalJustifyCenter, 
  Download, 
  ClipboardCopy, 
  Check, 
  UploadCloud, 
  Droplet,
  Square,
  Sparkles,
  Eye,
  Image as ImageIcon,
  Triangle,
  Layers
} from 'lucide-react';
import { 
  FocusZone, 
  LoadedImage, 
  GlobalStyleSettings, 
  BlurZone,
  MaskShape,
  TriangleShape
} from '../types';
import { BASE_COLOR } from '../utils/canvasRenderer';
import { SAMPLE_PRESETS } from '../utils/sampleImages';
import { NumericInput } from './NumericInput';

interface StudioSettingsPanelProps {
  image: LoadedImage | null;
  focuses: FocusZone[];
  selectedFocus: FocusZone | null;
  onSelectFocus: (id: string | null) => void;
  onAddFocus: () => void;
  onUpdateFocus: (updated: Partial<FocusZone>) => void;
  onDeleteFocus: (id: string) => void;
  onDuplicateFocus: (id: string) => void;
  onCenterFocusHorizontally: (id: string) => void;
  onRenumberFocuses?: () => void;
  globalStyles: GlobalStyleSettings;
  onUpdateGlobalStyles: (updated: Partial<GlobalStyleSettings>) => void;
  // Blur Zones
  blurZones: BlurZone[];
  selectedBlurId: string | null;
  onSelectBlur: (id: string | null) => void;
  onAddBlur: () => void;
  onUpdateBlur: (id: string, updated: Partial<BlurZone>) => void;
  onDeleteBlur: (id: string) => void;
  // Mask Shapes (Blue forms)
  maskShapes: MaskShape[];
  selectedMaskId: string | null;
  onSelectMask: (id: string | null) => void;
  onAddMask: () => void;
  onUpdateMask: (id: string, updated: Partial<MaskShape>) => void;
  onDeleteMask: (id: string) => void;
  // Triangle Shapes (15x13px)
  triangles?: TriangleShape[];
  selectedTriangleId?: string | null;
  onSelectTriangle?: (id: string | null) => void;
  onAddTriangle?: () => void;
  onUpdateTriangle?: (id: string, updated: Partial<TriangleShape>) => void;
  onDeleteTriangle?: (id: string) => void;
  // Actions
  onResetToDefaults: () => void;
  onExportPng: () => void;
  onCopyClipboard: () => void;
  isExporting: boolean;
  copied: boolean;
  onImportFile: (file: File) => void;
  onSelectSample: (id: string) => void;
  isPreviewMode?: boolean;
  onTogglePreview?: () => void;
  panelWidth?: number;
  onUpdatePanelWidth?: (width: number) => void;
}

export const StudioSettingsPanel: React.FC<StudioSettingsPanelProps> = ({
  image,
  focuses,
  selectedFocus,
  onSelectFocus,
  onAddFocus,
  onUpdateFocus,
  onDeleteFocus,
  onDuplicateFocus,
  onCenterFocusHorizontally,
  onRenumberFocuses,
  globalStyles,
  onUpdateGlobalStyles,
  blurZones,
  selectedBlurId,
  onSelectBlur,
  onAddBlur,
  onUpdateBlur,
  onDeleteBlur,
  maskShapes,
  selectedMaskId,
  onSelectMask,
  onAddMask,
  onUpdateMask,
  onDeleteMask,
  triangles = [],
  selectedTriangleId = null,
  onSelectTriangle,
  onAddTriangle,
  onUpdateTriangle,
  onDeleteTriangle,
  onResetToDefaults,
  onExportPng,
  onCopyClipboard,
  isExporting,
  copied,
  onImportFile,
  onSelectSample,
  isPreviewMode,
  onTogglePreview,
  panelWidth = 340,
  onUpdatePanelWidth,
}) => {
  // Requirement: Toutes les sections doivent être fermées par défaut et se déplier SEULEMENT au clic !
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    capture: false,
    workspace: false,
    focus: false,
    blur: false,
    mask: false,
    triangle: false,
    export: false,
  });

  const isResizingRef = React.useRef(false);
  const startXRef = React.useRef(0);
  const startWidthRef = React.useRef(panelWidth);

  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = panelWidth;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleResizePointerMove = (e: React.PointerEvent) => {
    if (!isResizingRef.current || !onUpdatePanelWidth) return;
    const delta = startXRef.current - e.clientX;
    const newWidth = Math.min(520, Math.max(260, Math.round(startWidthRef.current + delta)));
    onUpdatePanelWidth(newWidth);
  };

  const handleResizePointerUp = (e: React.PointerEvent) => {
    isResizingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const clipImageInputRef = React.useRef<HTMLInputElement>(null);

  const activeBlur = blurZones.find((b) => b.id === selectedBlurId) || null;
  const activeMask = maskShapes.find((m) => m.id === selectedMaskId) || null;
  const activeTriangle = triangles.find((t) => t.id === selectedTriangleId) || null;

  return (
    <aside
      className="relative bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-[#979797]/15 flex flex-col h-fit max-h-[calc(100vh-7rem)] overflow-y-auto select-none shrink-0 z-20 text-[#000000] text-xs self-start max-w-[calc(100vw-2rem)]"
      style={{ width: `${panelWidth}px` }}
    >
      {/* Draggable resize splitter on the left edge */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2.5 -ml-1 cursor-col-resize hover:bg-[#0088cc]/20 transition-colors z-30 group flex items-center justify-center"
        title="Glisser pour redimensionner la largeur du panneau"
        onPointerDown={handleResizePointerDown}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerUp}
      >
        <div className="w-1 h-8 rounded-full bg-[#979797]/30 group-hover:bg-[#0088cc] transition-colors" />
      </div>

      {/* Panel Header */}
      <div className="p-4 border-b border-[#eeeeee] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#000000] inline-block" />
            <h2 className="font-semibold text-[#000000] text-xs tracking-tight">
              Paramètres du Studio
            </h2>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 ml-4">
            <span className="text-[11px] text-[#666666]">Largeur :</span>
            {[300, 340, 420].map((w) => (
              <button
                key={w}
                onClick={() => onUpdatePanelWidth?.(w)}
                className={`text-[9px] px-1.5 py-0.5 rounded-full transition-all ${
                  panelWidth === w
                    ? 'bg-[#000000] text-white font-semibold'
                    : 'bg-[#eeeeee] text-[#666666] hover:text-[#000000]'
                }`}
              >
                {w}px
              </button>
            ))}
          </div>
        </div>

        <button
          id="btn-studio-reset"
          onClick={onResetToDefaults}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#eeeeee]/80 hover:bg-[#eeeeee] text-[#000000] text-[11px] font-medium transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
          title="Réinitialiser tous les réglages par défaut"
        >
          <RotateCcw className="w-3 h-3 text-[#666666]" />
          <span>Réinitialiser</span>
        </button>
      </div>

      {/* Accordion Sections - All folded by default */}
      <div className="flex-1 divide-y divide-[#eeeeee]">
        
        {/* 1. CAPTURE SOURCE */}
        <div className="flex flex-col">
          <button
            onClick={() => toggleSection('capture')}
            className="w-full px-4 py-3.5 flex items-center justify-between font-semibold text-[#000000] hover:bg-[#eeeeee]/40 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-[11px] tracking-wide uppercase">1. Capture Source</span>
              {image && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#eeeeee] text-[#666666] font-mono font-medium">
                  {image.displayWidth} × {image.displayHeight}px
                </span>
              )}
            </div>
            {openSections.capture ? <ChevronDown className="w-4 h-4 text-[#979797]" /> : <ChevronRight className="w-4 h-4 text-[#979797]" />}
          </button>

          {openSections.capture && (
            <div className="px-4 pb-4 pt-1 flex flex-col gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/heic,image/heif,.heic,.heif,image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onImportFile(file);
                }}
              />

              <button
                id="btn-upload-file-panel"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-full bg-[#eeeeee]/80 hover:bg-[#eeeeee] text-[#000000] font-medium text-xs transition-all hover:scale-[1.01] active:scale-[0.98]"
              >
                <UploadCloud className="w-4 h-4 text-[#0088cc]" />
                <span>Importer mon screenshot</span>
              </button>

              {/* Redimensionnement automatique explicite */}
              <div className="p-3 rounded-2xl bg-[#eeeeee]/50 border border-white text-[11px] text-[#000000] flex flex-col gap-0.5">
                <span className="font-semibold text-xs">Redimensionnement homothétique automatique :</span>
                <span className="text-[#666666] text-[10px]">
                  Largeur max 180 px • Hauteur max 390 px • Coins droits sans arrondi (0 px)
                </span>
              </div>

              {/* Teinte d'arrière-plan du screenshot */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-[#eeeeee]">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#666666] font-medium">Teinte de l'arrière-plan</span>
                  <span className="font-mono text-[#000000] font-semibold">
                    {Math.round((globalStyles.bgTintOpacity ?? 0.5) * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={globalStyles.bgTintColor || BASE_COLOR}
                    onChange={(e) => onUpdateGlobalStyles({ bgTintColor: e.target.value })}
                    className="w-7 h-7 rounded-full border border-[#979797]/40 cursor-pointer p-0.5 bg-white shadow-2xs"
                  />
                  <input
                    type="range"
                    min="0.10"
                    max="0.85"
                    step="0.05"
                    value={globalStyles.bgTintOpacity ?? 0.5}
                    onChange={(e) => onUpdateGlobalStyles({ bgTintOpacity: parseFloat(e.target.value) })}
                    className="flex-1 accent-[#0088cc]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. ZONE DE TRAVAIL & SCREENSHOT */}
        <div className="flex flex-col">
          <button
            onClick={() => toggleSection('workspace')}
            className="w-full px-4 py-3.5 flex items-center justify-between font-semibold text-[#000000] hover:bg-[#eeeeee]/40 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-[11px] tracking-wide uppercase">2. Zone de travail & Screenshot</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#eeeeee] text-[#666666] font-mono font-medium">
                {globalStyles.workspaceWidth || 440}px
              </span>
            </div>
            {openSections.workspace ? <ChevronDown className="w-4 h-4 text-[#979797]" /> : <ChevronRight className="w-4 h-4 text-[#979797]" />}
          </button>

          {openSections.workspace && (
            <div className="px-4 pb-4 pt-1 flex flex-col gap-3">
              {/* Largeur zone de travail (jusqu'à 500px max, damier Photoshop) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#666666] font-medium">Largeur zone de travail (damier Photoshop)</span>
                  <span className="font-mono font-semibold text-[#000000]">
                    Max 500 px
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24">
                    <NumericInput
                      value={globalStyles.workspaceWidth || 260}
                      onChange={(w) => onUpdateGlobalStyles({ workspaceWidth: Math.min(500, Math.max(200, w)) })}
                      min={200}
                      max={500}
                      unit="px"
                    />
                  </div>
                  <input
                    type="range"
                    min="200"
                    max="500"
                    step="10"
                    value={globalStyles.workspaceWidth || 260}
                    onChange={(e) => onUpdateGlobalStyles({
                      workspaceWidth: parseInt(e.target.value),
                    })}
                    className="flex-1 accent-[#0088cc]"
                  />
                </div>
                <div className="flex gap-1.5 mt-1">
                  {[260, 360, 440].map((w) => (
                    <button
                      key={w}
                      onClick={() => onUpdateGlobalStyles({ workspaceWidth: w })}
                      className={`flex-1 py-1 px-2 rounded-full text-[10px] font-semibold transition-all ${
                        (globalStyles.workspaceWidth || 260) === w
                          ? 'bg-[#000000] text-white shadow-xs'
                          : 'bg-[#eeeeee]/80 text-[#666666] hover:bg-[#eeeeee] hover:text-[#000000]'
                      }`}
                    >
                      {w}px
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. ZONES DE FOCUS */}
        <div className="flex flex-col">
          <div className="w-full px-4 py-3.5 flex items-center justify-between font-semibold text-[#000000] hover:bg-[#eeeeee]/40 transition-colors">
            <button
              onClick={() => toggleSection('focus')}
              className="flex items-center gap-2 text-left"
            >
              <span className="text-[11px] tracking-wide uppercase">3. Zones de Focus</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#eeeeee] text-[#666666] font-mono font-medium">
                {focuses.length} zone{focuses.length > 1 ? 's' : ''}
              </span>
            </button>

            <div className="flex items-center gap-1.5">
              {focuses.length > 1 && onRenumberFocuses && (
                <button
                  id="btn-renumber-focuses"
                  onClick={onRenumberFocuses}
                  className="px-2 py-1 rounded-full bg-[#eeeeee] hover:bg-[#e0e0e0] text-[#000000] text-[10px] font-medium flex items-center gap-1 transition-all"
                  title="Renuméroter automatiquement toutes les zones (1, 2, 3...) du haut vers le bas"
                >
                  <RotateCcw className="w-2.5 h-2.5 text-[#0088cc]" />
                  <span>Auto 1,2,3...</span>
                </button>
              )}
              <button
                id="btn-add-focus-nouveau"
                onClick={onAddFocus}
                className="px-2.5 py-1 rounded-full bg-[#0088cc] hover:bg-[#0077b3] text-white text-[10px] font-medium flex items-center gap-1 transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
                title="Ajouter une nouvelle zone de focus"
              >
                <Plus className="w-3 h-3" />
                <span>+ Nouveau</span>
              </button>
              <button onClick={() => toggleSection('focus')}>
                {openSections.focus ? <ChevronDown className="w-4 h-4 text-[#979797]" /> : <ChevronRight className="w-4 h-4 text-[#979797]" />}
              </button>
            </div>
          </div>

          {openSections.focus && (
            <div className="px-4 pb-4 pt-1 flex flex-col gap-3">
              {/* Focus List Selector and quick delete */}
              {selectedFocus && (
                <div className="flex justify-end">
                  <button
                    id="btn-delete-focus-direct"
                    onClick={() => onDeleteFocus(selectedFocus.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#eeeeee]/80 hover:bg-rose-50 text-[#666666] hover:text-rose-600 font-medium text-[11px] transition-all"
                    title="Supprimer la zone sélectionnée"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Supprimer</span>
                  </button>
                </div>
              )}

              {/* Focus List Selector */}
              {focuses.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {focuses.map((f, idx) => (
                    <button
                      key={f.id}
                      onClick={() => onSelectFocus(f.id)}
                      className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                        selectedFocus?.id === f.id
                          ? 'bg-[#0088cc] text-white shadow-2xs font-semibold'
                          : 'bg-[#eeeeee]/80 text-[#666666] hover:bg-[#eeeeee] hover:text-[#000000]'
                      }`}
                    >
                      Zone {f.stepNumber || idx + 1}
                    </button>
                  ))}
                </div>
              )}

              {selectedFocus ? (
                <>
                  {/* Pastille d'étape (en tête des paramètres Zone Focus) */}
                  <div className="flex flex-col gap-2 p-2.5 bg-[#eeeeee]/40 rounded-2xl border border-white">
                    <div className="flex items-center justify-between text-[11px]">
                      <div>
                        <span className="text-[#000000] font-semibold block">Pastille d'étape</span>
                        <span className="text-[10px] text-[#666666]">Centrée sur la bordure du screen • Dépasse de 15 px au-dessus de la zone focus</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedFocus.showStepBadge !== false}
                          onChange={(e) => onUpdateFocus({ showStepBadge: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-[#eeeeee] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#979797]/30 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#0088cc]" />
                      </label>
                    </div>

                    {selectedFocus.showStepBadge !== false && (
                      <div className="flex flex-col gap-2 pt-1 border-t border-white/60">
                        {/* Numéro d'étape et renumérotation */}
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="text-[#666666] font-medium">Numéro :</span>
                            <div className="w-14">
                              <NumericInput
                                value={selectedFocus.stepNumber ?? 1}
                                onChange={(val) => onUpdateFocus({ stepNumber: Math.max(1, Math.round(val)) })}
                                min={1}
                                max={99}
                              />
                            </div>
                          </div>

                          {focuses.length > 1 && onRenumberFocuses && (
                            <button
                              type="button"
                              onClick={onRenumberFocuses}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-white hover:bg-[#eeeeee] border border-[#eeeeee] text-[#0088cc] font-medium transition-colors"
                              title="Renuméroter toutes les étapes de haut en bas (1, 2, 3...)"
                            >
                              Renuméroter 1..{focuses.length}
                            </button>
                          )}
                        </div>

                        {/* Règle automatique Pair / Impair */}
                        <div className="flex flex-col gap-1.5 pt-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-[#666666]">Position automatique :</span>
                            <span className="font-semibold text-[#0088cc]">
                              {(selectedFocus.stepNumber ?? 1) % 2 !== 0 ? '← Impair (Bord gauche screen)' : 'Pair (Bord droit screen) →'}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-1">
                            <button
                              type="button"
                              onClick={() => onUpdateFocus({ badgePosition: 'auto' })}
                              className={`py-1 px-1 rounded-lg text-[10px] font-medium text-center transition-all ${
                                (selectedFocus.badgePosition || 'auto') === 'auto'
                                  ? 'bg-[#000000] text-white shadow-2xs font-semibold'
                                  : 'bg-white text-[#666666] hover:text-[#000000] border border-[#eeeeee]'
                              }`}
                              title="Règle automatique : impair = bordure gauche du screen, pair = bordure droite du screen"
                            >
                              Auto (pair/impair)
                            </button>
                            <button
                              type="button"
                              onClick={() => onUpdateFocus({ badgePosition: 'left' })}
                              className={`py-1 px-1 rounded-lg text-[10px] font-medium text-center transition-all ${
                                selectedFocus.badgePosition === 'left'
                                  ? 'bg-[#000000] text-white shadow-2xs font-semibold'
                                  : 'bg-white text-[#666666] hover:text-[#000000] border border-[#eeeeee]'
                              }`}
                              title="Forcer sur la bordure gauche du screen"
                            >
                              Bord gauche
                            </button>
                            <button
                              type="button"
                              onClick={() => onUpdateFocus({ badgePosition: 'right' })}
                              className={`py-1 px-1 rounded-lg text-[10px] font-medium text-center transition-all ${
                                selectedFocus.badgePosition === 'right'
                                  ? 'bg-[#000000] text-white shadow-2xs font-semibold'
                                  : 'bg-white text-[#666666] hover:text-[#000000] border border-[#eeeeee]'
                              }`}
                              title="Forcer sur la bordure droite du screen"
                            >
                              Bord droit
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Focus Header & Name */}
                  <div className="flex items-center justify-between pt-1">
                    <input
                      type="text"
                      value={selectedFocus.name}
                      onChange={(e) => onUpdateFocus({ name: e.target.value })}
                      className="font-semibold text-[#000000] bg-transparent border-b border-dashed border-[#979797]/40 hover:border-[#979797] focus:border-[#0088cc] outline-none pb-0.5 text-xs flex-1 mr-2"
                      placeholder="Nom de l'élément..."
                    />
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onDuplicateFocus(selectedFocus.id)}
                        className="p-1.5 rounded-full text-[#666666] hover:text-[#000000] hover:bg-[#eeeeee] transition-colors"
                        title="Dupliquer le focus"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteFocus(selectedFocus.id)}
                        className="p-1.5 rounded-full text-[#666666] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Supprimer ce focus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Dimensions : Largeur & Hauteur saisissables au pavé numérique */}
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] text-[#666666] font-medium">Largeur</label>
                          <button
                            onClick={() => onUpdateFocus({ width: 240 })}
                            className="text-[9px] text-[#0088cc] hover:underline font-semibold"
                          >
                            240px
                          </button>
                        </div>
                        <NumericInput
                          value={Math.round(selectedFocus.width)}
                          onChange={(val) => onUpdateFocus({ width: Math.max(40, val) })}
                          min={40}
                          max={500}
                          unit="px"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] text-[#666666] font-medium">Hauteur</label>
                          <button
                            onClick={() => onUpdateFocus({ height: 50 })}
                            className="text-[9px] text-[#0088cc] hover:underline font-semibold"
                          >
                            50px
                          </button>
                        </div>
                        <NumericInput
                          value={Math.round(selectedFocus.height)}
                          onChange={(val) => onUpdateFocus({ height: Math.max(20, val) })}
                          min={20}
                          max={400}
                          unit="px"
                        />
                      </div>
                    </div>

                    {/* Presets rapides de largeur pour les pas/étapes */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] text-[#666666]">Largeur pas :</span>
                      {[240, 260].map((pw) => (
                        <button
                          key={pw}
                          onClick={() => onUpdateFocus({ width: pw })}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                            Math.round(selectedFocus.width) === pw
                              ? 'bg-[#000000] text-white'
                              : 'bg-[#eeeeee]/80 text-[#666666] hover:bg-[#eeeeee]'
                          }`}
                        >
                          {pw}px
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          const targetW = globalStyles.workspaceWidth || 260;
                          onUpdateFocus({ width: Math.max(100, targetW - 20) });
                        }}
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#eeeeee]/80 text-[#0088cc] hover:bg-[#eeeeee]"
                        title="Ajuster la largeur au screenshot/zone de travail"
                      >
                        Auto (responsive)
                      </button>
                    </div>
                  </div>

                  {/* Arrondis de la zone (défaut 10px) */}
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-[#eeeeee]">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#666666] font-medium">Arrondis de la zone</span>
                      <div className="w-18">
                        <NumericInput
                          value={selectedFocus.borderRadius ?? 10}
                          onChange={(val) => onUpdateFocus({ borderRadius: Math.max(0, val) })}
                          min={0}
                          max={30}
                          unit="px"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="28"
                        step="1"
                        value={selectedFocus.borderRadius ?? 10}
                        onChange={(e) => onUpdateFocus({ borderRadius: parseInt(e.target.value) })}
                        className="flex-1 accent-[#0088cc]"
                      />
                      <div className="flex gap-1">
                        {[0, 10, 16].map((rad) => (
                          <button
                            key={rad}
                            onClick={() => onUpdateFocus({ borderRadius: rad })}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                              (selectedFocus.borderRadius ?? 10) === rad
                                ? 'bg-[#000000] text-white shadow-2xs'
                                : 'bg-[#eeeeee]/80 text-[#666666] hover:bg-[#eeeeee] hover:text-[#000000]'
                            }`}
                          >
                            {rad}px
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Contour & Couleur */}
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-[#eeeeee]">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#666666] font-medium">Contour & Couleur</span>
                      <div className="w-16">
                        <NumericInput
                          value={selectedFocus.borderWidth ?? 2}
                          onChange={(val) => onUpdateFocus({ borderWidth: Math.max(1, Math.min(8, val)) })}
                          min={1}
                          max={8}
                          unit="pt"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={selectedFocus.borderColor || BASE_COLOR}
                        onChange={(e) => onUpdateFocus({ borderColor: e.target.value })}
                        className="w-7 h-7 rounded-full border border-[#979797]/40 cursor-pointer p-0.5 bg-white shadow-2xs"
                        title="Couleur du contour"
                      />
                      <input
                        type="range"
                        min="1"
                        max="6"
                        step="1"
                        value={selectedFocus.borderWidth ?? 2}
                        onChange={(e) => onUpdateFocus({ borderWidth: parseInt(e.target.value) })}
                        className="flex-1 accent-[#0088cc]"
                      />
                      <span className="font-mono text-[10px] text-[#666666] uppercase">
                        {selectedFocus.borderColor || BASE_COLOR}
                      </span>
                    </div>
                  </div>

                  {/* Grossissement Zoom (exprimé en pixels, homotétique) */}
                  {(() => {
                    const currentZoom = selectedFocus.zoom || 1.0;
                    const focusW = Math.round(selectedFocus.width);
                    const zoomPx = Math.round(focusW * currentZoom);
                    return (
                      <div className="flex flex-col gap-2 pt-2 border-t border-[#eeeeee]">
                        <div className="flex items-center justify-between text-[11px]">
                          <div>
                            <span className="text-[#666666] font-medium block">Grossissement (Zoom)</span>
                            <span className="text-[10px] text-[#979797]">Homotétique : {zoomPx} px ({currentZoom.toFixed(2)}×)</span>
                          </div>
                          <div className="w-20">
                            <NumericInput
                              value={zoomPx}
                              onChange={(val) => {
                                const newPx = Math.max(focusW, val);
                                onUpdateFocus({ zoom: Math.max(1.0, newPx / focusW) });
                              }}
                              min={focusW}
                              max={focusW * 3}
                              unit="px"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min={focusW}
                            max={Math.round(focusW * 2.5)}
                            step="2"
                            value={zoomPx}
                            onChange={(e) => {
                              const newPx = parseFloat(e.target.value);
                              onUpdateFocus({ zoom: Math.max(1.0, newPx / focusW) });
                            }}
                            className="flex-1 accent-[#0088cc]"
                          />
                        </div>

                        {/* Presets rapides de zoom en pixel */}
                        <div className="flex gap-1 flex-wrap">
                          {[
                            { label: `${focusW}px (1:1)`, factor: 1.0, title: 'Taille originale (défaut = largeur zone focus)' },
                            { label: `${Math.round(focusW * 1.2)}px`, factor: 1.2, title: '+20% d\'agrandissement' },
                            { label: `${Math.round(focusW * 1.4)}px`, factor: 1.4, title: '+40% d\'agrandissement' },
                            { label: `${Math.round(focusW * 1.8)}px`, factor: 1.8, title: '+80% d\'agrandissement' },
                            { label: `${Math.round(focusW * 2.0)}px`, factor: 2.0, title: '2× agrandissement' },
                          ].map((p) => (
                            <button
                              key={p.factor}
                              type="button"
                              onClick={() => onUpdateFocus({ zoom: p.factor })}
                              title={p.title}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                                Math.abs(currentZoom - p.factor) < 0.05
                                  ? 'bg-[#000000] text-white shadow-2xs'
                                  : 'bg-[#eeeeee]/80 text-[#666666] hover:bg-[#eeeeee] hover:text-[#000000]'
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </>
              ) : (
                <div className="text-center py-4 text-[#666666]">
                  <p className="text-[11px]">Aucun focus sélectionné</p>
                  <button
                    onClick={onAddFocus}
                    className="mt-2 text-[#0088cc] hover:underline font-medium text-[11px]"
                  >
                    + Créer un focus
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. FLOU GAUSSIEN (Pour n'importe quelle zone) */}
        <div className="flex flex-col">
          <div className="w-full px-4 py-3.5 flex items-center justify-between font-semibold text-[#000000] hover:bg-[#eeeeee]/40 transition-colors">
            <button
              onClick={() => toggleSection('blur')}
              className="flex items-center gap-2 text-left"
            >
              <Droplet className="w-3.5 h-3.5 text-[#0088cc]" />
              <span className="text-[11px] tracking-wide uppercase">4. Flou Gaussien</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#eeeeee] text-[#666666] font-mono font-medium">
                {blurZones.length}
              </span>
            </button>

            <div className="flex items-center gap-1.5">
              <button
                onClick={onAddBlur}
                className="px-2.5 py-1 rounded-full bg-[#0088cc] hover:bg-[#0077b3] text-white text-[10px] font-medium flex items-center gap-1 transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
                title="Ajouter une zone de flou"
              >
                <Plus className="w-3 h-3" />
                <span>+ Flou</span>
              </button>
              <button onClick={() => toggleSection('blur')}>
                {openSections.blur ? <ChevronDown className="w-4 h-4 text-[#979797]" /> : <ChevronRight className="w-4 h-4 text-[#979797]" />}
              </button>
            </div>
          </div>

          {openSections.blur && (
            <div className="px-4 pb-4 pt-1 flex flex-col gap-3">
              <div className="flex gap-2">
                <button
                  onClick={onAddBlur}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-[#0088cc] hover:bg-[#0077b3] text-white font-medium text-xs shadow-2xs transition-all hover:scale-[1.01] active:scale-[0.98]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter une zone de flou</span>
                </button>
                {activeBlur && (
                  <button
                    onClick={() => onDeleteBlur(activeBlur.id)}
                    className="p-2 rounded-full bg-[#eeeeee]/80 hover:bg-rose-50 text-[#666666] hover:text-rose-600 transition-colors"
                    title="Supprimer la zone de flou"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {blurZones.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {blurZones.map((b, idx) => (
                    <button
                      key={b.id}
                      onClick={() => onSelectBlur(b.id)}
                      className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                        selectedBlurId === b.id
                          ? 'bg-[#0088cc] text-white shadow-2xs font-semibold'
                          : 'bg-[#eeeeee]/80 text-[#666666] hover:bg-[#eeeeee] hover:text-[#000000]'
                      }`}
                    >
                      {b.name || `Flou ${idx + 1}`}
                    </button>
                  ))}
                </div>
              )}

              {activeBlur ? (
                <div className="flex flex-col gap-2.5 p-3 rounded-2xl bg-[#eeeeee]/50 border border-white">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-[#000000] text-xs">{activeBlur.name}</span>
                    <button
                      onClick={() => onDeleteBlur(activeBlur.id)}
                      className="text-[#666666] hover:text-rose-600 text-[10px] font-medium transition-colors"
                    >
                      Supprimer
                    </button>
                  </div>

                  {/* Rayon de flou gaussien */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#666666]">Rayon de flou</span>
                      <div className="w-16">
                        <NumericInput
                          value={activeBlur.blurRadius}
                          onChange={(r) => onUpdateBlur(activeBlur.id, { blurRadius: Math.max(2, r) })}
                          min={2}
                          max={40}
                          unit="px"
                        />
                      </div>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="30"
                      value={activeBlur.blurRadius}
                      onChange={(e) => onUpdateBlur(activeBlur.id, { blurRadius: parseInt(e.target.value) })}
                      className="accent-[#0088cc]"
                    />
                  </div>

                  {/* Dimensions du flou */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[10px] text-[#666666]">Largeur</label>
                      <NumericInput
                        value={Math.round(activeBlur.width)}
                        onChange={(w) => onUpdateBlur(activeBlur.id, { width: Math.max(20, w) })}
                        min={20}
                        max={500}
                        unit="px"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#666666]">Hauteur</label>
                      <NumericInput
                        value={Math.round(activeBlur.height)}
                        onChange={(h) => onUpdateBlur(activeBlur.id, { height: Math.max(10, h) })}
                        min={10}
                        max={400}
                        unit="px"
                      />
                    </div>
                  </div>

                  {/* Arrondis des angles de la forme (Flou) */}
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-[#eeeeee]">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#666666] font-medium">Angles de la forme (arrondi)</span>
                      <div className="w-18">
                        <NumericInput
                          value={activeBlur.borderRadius ?? 4}
                          onChange={(r) => onUpdateBlur(activeBlur.id, { borderRadius: Math.max(0, r) })}
                          min={0}
                          max={40}
                          unit="px"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="30"
                        value={activeBlur.borderRadius ?? 4}
                        onChange={(e) => onUpdateBlur(activeBlur.id, { borderRadius: parseInt(e.target.value) })}
                        className="flex-1 accent-[#0088cc]"
                      />
                    </div>
                    {/* Presets rapides d'angles */}
                    <div className="flex gap-1.5 mt-0.5">
                      {[
                        { label: 'Droit (0px)', val: 0 },
                        { label: '4px', val: 4 },
                        { label: '8px', val: 8 },
                        { label: '16px', val: 16 },
                      ].map((preset) => (
                        <button
                          key={preset.val}
                          onClick={() => onUpdateBlur(activeBlur.id, { borderRadius: preset.val })}
                          className={`flex-1 py-1 px-1.5 rounded-full text-[10px] font-medium transition-all ${
                            (activeBlur.borderRadius ?? 4) === preset.val
                              ? 'bg-[#000000] text-white shadow-2xs font-semibold'
                              : 'bg-[#eeeeee]/80 text-[#666666] hover:bg-[#eeeeee] hover:text-[#000000]'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-[#666666] text-center py-2">
                  Cliquez sur "Ajouter une zone de flou" pour anonymiser des parties du screenshot.
                </p>
              )}
            </div>
          )}
        </div>

        {/* 5. FORME BLEUE DE MASQUAGE (#25465F) */}
        <div className="flex flex-col">
          <div className="w-full px-4 py-3.5 flex items-center justify-between font-semibold text-[#000000] hover:bg-[#eeeeee]/40 transition-colors">
            <button
              onClick={() => toggleSection('mask')}
              className="flex items-center gap-2 text-left"
            >
              <div className="w-3.5 h-3.5 rounded-sm bg-[#25465F] inline-block" />
              <span className="text-[11px] tracking-wide uppercase">5. Forme Bleue (#25465F)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#eeeeee] text-[#666666] font-mono font-medium">
                {maskShapes.length}
              </span>
            </button>

            <div className="flex items-center gap-1.5">
              <button
                onClick={onAddMask}
                className="px-2.5 py-1 rounded-full bg-[#000000] hover:bg-[#333333] text-white text-[10px] font-medium flex items-center gap-1 transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
                title="Ajouter une forme bleue"
              >
                <Plus className="w-3 h-3" />
                <span>+ Forme</span>
              </button>
              <button onClick={() => toggleSection('mask')}>
                {openSections.mask ? <ChevronDown className="w-4 h-4 text-[#979797]" /> : <ChevronRight className="w-4 h-4 text-[#979797]" />}
              </button>
            </div>
          </div>

          {openSections.mask && (
            <div className="px-4 pb-4 pt-1 flex flex-col gap-3">
              <div className="flex gap-2">
                <button
                  onClick={onAddMask}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-[#000000] hover:bg-[#333333] text-white font-medium text-xs shadow-2xs transition-all hover:scale-[1.01] active:scale-[0.98]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter une forme bleue</span>
                </button>
                {activeMask && (
                  <button
                    onClick={() => onDeleteMask(activeMask.id)}
                    className="p-2 rounded-full bg-[#eeeeee]/80 hover:bg-rose-50 text-[#666666] hover:text-rose-600 transition-colors"
                    title="Supprimer la forme bleue"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {maskShapes.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {maskShapes.map((m, idx) => (
                    <button
                      key={m.id}
                      onClick={() => onSelectMask(m.id)}
                      className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                        selectedMaskId === m.id
                          ? 'bg-[#000000] text-white shadow-2xs font-semibold'
                          : 'bg-[#eeeeee]/80 text-[#666666] hover:bg-[#eeeeee] hover:text-[#000000]'
                      }`}
                    >
                      {m.name || `Masque ${idx + 1}`}
                    </button>
                  ))}
                </div>
              )}

              {activeMask ? (
                <div className="flex flex-col gap-3 p-3 rounded-2xl bg-[#eeeeee]/50 border border-white">
                  <div className="flex justify-between items-center">
                    <input
                      type="text"
                      value={activeMask.name}
                      onChange={(e) => onUpdateMask(activeMask.id, { name: e.target.value })}
                      className="font-semibold text-[#000000] bg-transparent border-b border-dashed border-[#979797]/40 hover:border-[#979797] focus:border-[#0088cc] outline-none pb-0.5 text-xs flex-1 mr-2"
                      placeholder="Nom de la forme..."
                    />
                    <button
                      onClick={() => onDeleteMask(activeMask.id)}
                      className="text-[#666666] hover:text-rose-600 text-[10px] font-medium transition-colors"
                    >
                      Supprimer
                    </button>
                  </div>

                  {/* Option de couleur de fond */}
                  <div className="flex flex-col gap-1.5 pt-1 border-t border-[#eeeeee]">
                    <label className="text-[10px] text-[#666666] font-medium">Couleur de fond & Opacité</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={activeMask.color || '#25465F'}
                        onChange={(e) => onUpdateMask(activeMask.id, { color: e.target.value })}
                        className="w-7 h-7 rounded-full border border-[#979797]/40 cursor-pointer p-0.5 bg-white shadow-2xs"
                      />
                      {/* Presets rapides de couleur */}
                      <div className="flex gap-1.5">
                        {[
                          { name: 'Navy #25465F', val: '#25465F' },
                          { name: 'Blanc #ffffff', val: '#ffffff' },
                          { name: 'Bleu ciel', val: '#0088cc' },
                          { name: 'Gris ardoise', val: '#666666' },
                          { name: 'Noir doux', val: '#000000' },
                        ].map((c) => (
                          <button
                            key={c.val}
                            onClick={() => onUpdateMask(activeMask.id, { color: c.val })}
                            className={`w-5 h-5 rounded-full border transition-transform ${
                              (activeMask.color || '#25465F').toLowerCase() === c.val.toLowerCase()
                                ? 'scale-110 ring-2 ring-[#0088cc] border-white'
                                : 'border-[#979797]/40 hover:scale-105'
                            }`}
                            style={{ backgroundColor: c.val }}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex-1 flex flex-col gap-0.5">
                        <div className="flex justify-between text-[10px] text-[#666666]">
                          <span>Opacité</span>
                          <span>{Math.round((activeMask.opacity ?? 1) * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="1.0"
                          step="0.05"
                          value={activeMask.opacity ?? 1}
                          onChange={(e) => onUpdateMask(activeMask.id, { opacity: parseFloat(e.target.value) })}
                          className="accent-[#0088cc]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Option de Contour (Bordure) */}
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-[#eeeeee]">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-[#666666] font-medium">Contour de la forme</span>
                      <span className="text-[#979797]">{activeMask.borderWidth || 0}px</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-[#666666]">Épaisseur</label>
                        <NumericInput
                          value={activeMask.borderWidth ?? 0}
                          onChange={(w) => onUpdateMask(activeMask.id, { borderWidth: Math.max(0, w) })}
                          min={0}
                          max={10}
                          unit="px"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-[#666666]">Couleur contour</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={activeMask.borderColor || '#25465F'}
                            onChange={(e) => onUpdateMask(activeMask.id, { borderColor: e.target.value })}
                            className="w-6 h-6 rounded-full border border-[#979797]/40 cursor-pointer p-0 shadow-2xs"
                          />
                          <button
                            onClick={() => onUpdateMask(activeMask.id, { borderColor: '#ffffff' })}
                            className="text-[9px] px-2 py-0.5 border border-[#eeeeee] rounded-full bg-white hover:bg-[#eeeeee] text-[#000000]"
                          >
                            Blanc
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <label className="text-[9px] text-[#666666]">Style :</label>
                      {(['solid', 'dashed', 'dotted'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => onUpdateMask(activeMask.id, { borderStyle: st })}
                          className={`text-[9px] px-2.5 py-0.5 rounded-full capitalize transition-all ${
                            (activeMask.borderStyle || 'solid') === st
                              ? 'bg-[#000000] text-white font-medium shadow-2xs'
                              : 'bg-[#eeeeee]/80 text-[#666666] hover:bg-[#eeeeee] hover:text-[#000000]'
                          }`}
                        >
                          {st === 'solid' ? 'Plein' : st === 'dashed' ? 'Tirets' : 'Points'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dimensions & Arrondis */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#eeeeee]">
                    <div>
                      <label className="text-[10px] text-[#666666]">Largeur</label>
                      <NumericInput
                        value={Math.round(activeMask.width)}
                        onChange={(w) => onUpdateMask(activeMask.id, { width: Math.max(10, w) })}
                        min={10}
                        max={500}
                        unit="px"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#666666]">Hauteur</label>
                      <NumericInput
                        value={Math.round(activeMask.height)}
                        onChange={(h) => onUpdateMask(activeMask.id, { height: Math.max(10, h) })}
                        min={10}
                        max={400}
                        unit="px"
                      />
                    </div>
                  </div>

                  {/* Arrondis des angles de la forme (Masque / Forme Bleue) */}
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-[#eeeeee]">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#666666] font-medium">Angles de la forme (arrondi)</span>
                      <div className="w-18">
                        <NumericInput
                          value={activeMask.borderRadius ?? 4}
                          onChange={(r) => onUpdateMask(activeMask.id, { borderRadius: Math.max(0, r) })}
                          min={0}
                          max={40}
                          unit="px"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="30"
                        value={activeMask.borderRadius ?? 4}
                        onChange={(e) => onUpdateMask(activeMask.id, { borderRadius: parseInt(e.target.value) })}
                        className="flex-1 accent-[#0088cc]"
                      />
                    </div>
                    {/* Presets rapides d'angles */}
                    <div className="flex gap-1.5 mt-0.5">
                      {[
                        { label: 'Droit (0px)', val: 0 },
                        { label: '4px', val: 4 },
                        { label: '8px', val: 8 },
                        { label: '16px', val: 16 },
                      ].map((preset) => (
                        <button
                          key={preset.val}
                          onClick={() => onUpdateMask(activeMask.id, { borderRadius: preset.val })}
                          className={`flex-1 py-1 px-1.5 rounded-full text-[10px] font-medium transition-all ${
                            (activeMask.borderRadius ?? 4) === preset.val
                              ? 'bg-[#000000] text-white shadow-2xs font-semibold'
                              : 'bg-[#eeeeee]/80 text-[#666666] hover:bg-[#eeeeee] hover:text-[#000000]'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Option Masque d'écrêtage avec un autre screenshot */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-[#eeeeee]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#000000] font-semibold flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#0088cc]" />
                        <span>Masque d'écrêtage (2ᵉ screenshot)</span>
                      </span>
                      {activeMask.clipImage && (
                        <button
                          onClick={() => onUpdateMask(activeMask.id, { clipImage: undefined })}
                          className="text-[9px] text-[#666666] hover:text-rose-600 hover:underline transition-colors"
                        >
                          Détacher
                        </button>
                      )}
                    </div>

                    <input
                      ref={clipImageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const dataUrl = event.target?.result as string;
                          const img = new Image();
                          img.crossOrigin = 'anonymous';
                          img.onload = () => {
                            onUpdateMask(activeMask.id, {
                              clipImage: {
                                dataUrl,
                                name: file.name,
                                element: img,
                                scale: 1,
                                offsetX: 0,
                                offsetY: 0,
                              },
                            });
                          };
                          img.src = dataUrl;
                        };
                        reader.readAsDataURL(file);
                        e.target.value = '';
                      }}
                    />

                    {activeMask.clipImage ? (
                      <div className="flex flex-col gap-2 bg-white/70 p-2.5 rounded-2xl border border-white">
                        <div className="flex items-center gap-2">
                          <img
                            src={activeMask.clipImage.dataUrl}
                            alt="Screenshot écrêté"
                            className="w-10 h-10 object-cover rounded-xl border border-[#eeeeee]"
                          />
                          <div className="flex-1 truncate">
                            <span className="text-[10px] font-medium text-[#000000] block truncate">
                              {activeMask.clipImage.name}
                            </span>
                            <span className="text-[9px] text-[#0088cc]">Écrêté dans le rectangle</span>
                          </div>
                        </div>

                        {/* Échelle de l'image écrêtée */}
                        <div className="flex items-center justify-between text-[9px] text-[#666666] pt-1">
                          <span>Échelle de l'image</span>
                          <span>{Math.round((activeMask.clipImage.scale || 1) * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.4"
                          max="2.5"
                          step="0.05"
                          value={activeMask.clipImage.scale || 1}
                          onChange={(e) => {
                            const sc = parseFloat(e.target.value);
                            onUpdateMask(activeMask.id, {
                              clipImage: {
                                ...activeMask.clipImage!,
                                scale: sc,
                              },
                            });
                          }}
                          className="accent-[#0088cc]"
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => clipImageInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-[#eeeeee]/80 hover:bg-[#eeeeee] text-[#000000] font-medium text-[10px] transition-all hover:scale-[1.01] active:scale-[0.98]"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-[#0088cc]" />
                        <span>Importer un autre screenshot pour l'écrêter</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-[#666666] text-center py-2">
                  Ajoutez un rectangle bleu pour masquer des données, appliquer une couleur personnalisée ou insérer un second screenshot en masque d'écrêtage.
                </p>
              )}
            </div>
          )}
        </div>

        {/* 6. OUTIL TRIANGLE (15x13px) */}
        <div className="flex flex-col">
          <div className="w-full px-4 py-3.5 flex items-center justify-between font-semibold text-[#000000] hover:bg-[#eeeeee]/40 transition-colors">
            <button
              onClick={() => toggleSection('triangle')}
              className="flex items-center gap-2 text-left"
            >
              <Triangle className="w-3.5 h-3.5 text-[#0088cc]" />
              <span className="text-[11px] tracking-wide uppercase">6. Triangles (15×13px)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#eeeeee] text-[#666666] font-mono font-medium">
                {triangles.length}
              </span>
            </button>

            <div className="flex items-center gap-1.5">
              {onAddTriangle && (
                <button
                  onClick={onAddTriangle}
                  className="px-2.5 py-1 rounded-full bg-[#000000] hover:bg-[#333333] text-white text-[10px] font-medium flex items-center gap-1 transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
                  title="Ajouter un triangle 15x13px"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Triangle</span>
                </button>
              )}
              <button onClick={() => toggleSection('triangle')}>
                {openSections.triangle ? <ChevronDown className="w-4 h-4 text-[#979797]" /> : <ChevronRight className="w-4 h-4 text-[#979797]" />}
              </button>
            </div>
          </div>

          {openSections.triangle && (
            <div className="px-4 pb-4 pt-1 flex flex-col gap-3">
              <div className="flex gap-2">
                {onAddTriangle && (
                  <button
                    onClick={onAddTriangle}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-[#000000] hover:bg-[#333333] text-white font-medium text-xs shadow-2xs transition-all hover:scale-[1.01] active:scale-[0.98]"
                  >
                    <Triangle className="w-3.5 h-3.5" />
                    <span>Ajouter un triangle (15×13px)</span>
                  </button>
                )}
                {activeTriangle && onDeleteTriangle && (
                  <button
                    onClick={() => onDeleteTriangle(activeTriangle.id)}
                    className="p-2 rounded-full bg-[#eeeeee]/80 hover:bg-rose-50 text-[#666666] hover:text-rose-600 transition-colors"
                    title="Supprimer le triangle"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {triangles.length > 0 && onSelectTriangle && (
                <div className="flex gap-1.5 flex-wrap">
                  {triangles.map((t, idx) => (
                    <button
                      key={t.id}
                      onClick={() => onSelectTriangle(t.id)}
                      className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                        selectedTriangleId === t.id
                          ? 'bg-[#000000] text-white shadow-2xs font-semibold'
                          : 'bg-[#eeeeee]/80 text-[#666666] hover:bg-[#eeeeee] hover:text-[#000000]'
                      }`}
                    >
                      {t.name || `Triangle ${idx + 1}`}
                    </button>
                  ))}
                </div>
              )}

              {activeTriangle && onUpdateTriangle ? (
                <div className="flex flex-col gap-2.5 p-3 rounded-2xl bg-[#eeeeee]/50 border border-white">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-[#000000] text-xs">{activeTriangle.name}</span>
                    {onDeleteTriangle && (
                      <button
                        onClick={() => onDeleteTriangle(activeTriangle.id)}
                        className="text-[#666666] hover:text-rose-600 text-[10px] font-medium transition-colors"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>

                  {/* Choix couleur (#25465F ou Blanc) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-[#666666] font-medium">Couleur (#25465F ou Blanc)</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onUpdateTriangle(activeTriangle.id, { color: '#25465F' })}
                        className={`flex-1 py-1.5 px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          (activeTriangle.color || '#25465F').toLowerCase() === '#25465f'
                            ? 'bg-[#25465F] text-white shadow-2xs ring-2 ring-[#0088cc]'
                            : 'bg-white text-[#666666] border border-[#eeeeee] hover:bg-[#eeeeee]'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-[#25465F] inline-block border border-white" />
                        <span>#25465F</span>
                      </button>

                      <button
                        onClick={() => onUpdateTriangle(activeTriangle.id, { color: '#ffffff' })}
                        className={`flex-1 py-1.5 px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          activeTriangle.color?.toLowerCase() === '#ffffff'
                            ? 'bg-[#000000] text-white shadow-2xs ring-2 ring-[#0088cc]'
                            : 'bg-white text-[#666666] border border-[#eeeeee] hover:bg-[#eeeeee]'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-white inline-block border border-[#979797]/40" />
                        <span>Blanc</span>
                      </button>
                    </div>
                  </div>

                  {/* Orientation */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-[#666666] font-medium">Orientation de la pointe</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: 'down', label: 'Bas ↓' },
                        { id: 'up', label: 'Haut ↑' },
                        { id: 'left', label: 'Gauche ←' },
                        { id: 'right', label: 'Droite →' },
                      ].map((dir) => (
                        <button
                          key={dir.id}
                          onClick={() => onUpdateTriangle(activeTriangle.id, { direction: dir.id as any })}
                          className={`py-1 text-[10px] rounded-full text-center transition-all ${
                            (activeTriangle.direction || 'down') === dir.id
                              ? 'bg-[#000000] text-white font-semibold shadow-2xs'
                              : 'bg-white text-[#666666] border border-[#eeeeee] hover:bg-[#eeeeee]'
                          }`}
                        >
                          {dir.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dimensions : Fixe 15x13px avec possibilité de micro-ajustement */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-[#666666]">Largeur</span>
                        <button
                          onClick={() => onUpdateTriangle(activeTriangle.id, { width: 15 })}
                          className="text-[9px] text-[#0088cc] hover:underline font-semibold"
                        >
                          15px
                        </button>
                      </div>
                      <NumericInput
                        value={activeTriangle.width || 15}
                        onChange={(w) => onUpdateTriangle(activeTriangle.id, { width: Math.max(5, w) })}
                        min={5}
                        max={100}
                        unit="px"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-[#666666]">Hauteur</span>
                        <button
                          onClick={() => onUpdateTriangle(activeTriangle.id, { height: 13 })}
                          className="text-[9px] text-[#0088cc] hover:underline font-semibold"
                        >
                          13px
                        </button>
                      </div>
                      <NumericInput
                        value={activeTriangle.height || 13}
                        onChange={(h) => onUpdateTriangle(activeTriangle.id, { height: Math.max(5, h) })}
                        min={5}
                        max={100}
                        unit="px"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-[#666666] text-center py-2">
                  Cliquez sur "Ajouter un triangle" pour poser une flèche indicatrice compacte de 15×13px en #25465F ou blanc.
                </p>
              )}
            </div>
          )}
        </div>

        {/* 7. OPTIONS D'EXPORTATION (PNG AVEC TRANSPARENCE) */}
        <div className="flex flex-col">
          <div className="w-full px-4 py-3.5 flex items-center justify-between font-semibold text-[#000000] hover:bg-[#eeeeee]/40 transition-colors">
            <button
              onClick={() => toggleSection('export')}
              className="text-[11px] tracking-wide uppercase text-left"
            >
              7. Options d'Exportation
            </button>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((scale) => (
                <button
                  key={scale}
                  onClick={() => onUpdateGlobalStyles({ exportScale: scale as 1 | 2 | 3 })}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                    globalStyles.exportScale === scale
                      ? 'bg-[#000000] text-white shadow-2xs'
                      : 'bg-[#eeeeee]/80 text-[#666666] hover:bg-[#eeeeee] hover:text-[#000000]'
                  }`}
                >
                  {scale === 1 ? '1x' : scale === 2 ? '2x (HD)' : '3x (4K)'}
                </button>
              ))}
            </div>
          </div>

          {openSections.export && (
            <div className="px-4 pb-4 pt-1 flex flex-col gap-2.5">
              {/* Badge PNG avec transparence garantie */}
              <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-white/70 border border-white text-[#000000] text-[11px]">
                <Check className="w-4 h-4 text-[#0088cc] shrink-0" />
                <div className="flex flex-col">
                  <span className="font-semibold text-[#000000]">Format PNG avec transparence</span>
                  <span className="text-[10px] text-[#666666]">Fond transparent exporté proprement (canal alpha pur)</span>
                </div>
              </div>

              {/* Bouton Prévisualisation direct */}
              {onTogglePreview && (
                <button
                  onClick={onTogglePreview}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-xs font-semibold transition-all ${
                    isPreviewMode
                      ? 'bg-[#0088cc] text-white shadow-2xs'
                      : 'bg-[#eeeeee]/80 hover:bg-[#eeeeee] text-[#000000]'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  <span>{isPreviewMode ? 'Quitter la prévisualisation' : 'Mode Prévisualisation (Aperçu net)'}</span>
                </button>
              )}

              {/* Télécharger PNG */}
              <button
                id="btn-export-transparent-png"
                onClick={onExportPng}
                disabled={isExporting || !image}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full font-bold text-xs shadow-sm transition-all ${
                  isExporting || !image
                    ? 'bg-[#eeeeee] text-[#979797] cursor-not-allowed'
                    : 'bg-[#000000] hover:bg-[#222222] text-white hover:scale-[1.01] active:scale-[0.98]'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>
                  {isExporting ? 'Exportation en cours...' : `Télécharger PNG (${globalStyles.exportScale}x Transparent)`}
                </span>
              </button>

              {/* Copier dans le presse-papier */}
              <button
                id="btn-copy-clipboard-panel"
                onClick={onCopyClipboard}
                disabled={!image}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-full bg-[#eeeeee]/80 hover:bg-[#eeeeee] text-[#000000] font-medium text-xs transition-all hover:scale-[1.01] active:scale-[0.98]"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#0088cc]" />
                    <span className="text-[#0088cc] font-bold">Copié dans le presse-papier !</span>
                  </>
                ) : (
                  <>
                    <ClipboardCopy className="w-3.5 h-3.5 text-[#666666]" />
                    <span>Copier dans le presse-papier</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

      </div>
    </aside>
  );
};
