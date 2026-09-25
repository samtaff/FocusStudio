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
  Layers,
  Search,
  Maximize2,
  Sun,
  Moon,
  Move,
  Crosshair,
  Grid,
  Shield,
  LayoutGrid,
  Link,
  Unlink,
  Split
} from 'lucide-react';
import { 
  FocusZone, 
  LoadedImage, 
  GlobalStyleSettings, 
  BlurZone,
  MaskShape,
  TriangleShape,
  CalloutVignette
} from '../types';
import { BASE_COLOR, calculateCompositionBounds } from '../utils/canvasRenderer';
import { SAMPLE_PRESETS } from '../utils/sampleImages';
import { NumericInput } from './NumericInput';

interface StudioSettingsPanelProps {
  image: LoadedImage | null;
  focuses: FocusZone[];
  selectedFocus: FocusZone | null;
  onSelectFocus: (id: string | null) => void;
  onAddFocus: (orientation?: 'horizontal' | 'vertical') => void;
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
  onSplitMaskMultiplier?: (id: string) => void;
  // Triangle Shapes (15x13px)
  triangles?: TriangleShape[];
  selectedTriangleId?: string | null;
  onSelectTriangle?: (id: string | null) => void;
  onAddTriangle?: () => void;
  onUpdateTriangle?: (id: string, updated: Partial<TriangleShape>) => void;
  onDeleteTriangle?: (id: string) => void;
  // Callout / Vignette zoom détaché
  calloutVignette?: CalloutVignette | null;
  onUpdateCallout?: (updated: Partial<CalloutVignette>) => void;
  onToggleCallout?: () => void;
  // Actions
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onCenterWorkspace?: () => void;
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
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  // Sequential numbering across screenshot imports
  sequentialImportNumbering?: boolean;
  onToggleSequentialImportNumbering?: () => void;
  nextSequentialStep?: number;
  onChangeNextSequentialStep?: (step: number) => void;
  onResetSequentialCounter?: () => void;
  // Internal screenshot framing
  internalFramingFocusId?: string | null;
  onToggleInternalFraming?: (id: string | null) => void;
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
  internalFramingFocusId = null,
  onToggleInternalFraming,
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
  onSplitMaskMultiplier,
  triangles = [],
  selectedTriangleId = null,
  onSelectTriangle,
  onAddTriangle,
  onUpdateTriangle,
  onDeleteTriangle,
  calloutVignette,
  onUpdateCallout,
  onToggleCallout,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onCenterWorkspace,
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
  isDarkMode = false,
  onToggleDarkMode,
  sequentialImportNumbering = true,
  onToggleSequentialImportNumbering,
  nextSequentialStep = 1,
  onChangeNextSequentialStep,
  onResetSequentialCounter,
}) => {
  // Requirement: Toutes les sections doivent être fermées par défaut et se déplier SEULEMENT au clic !
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    capture: false,
    workspace: false,
    focus: false,
    blur: false,
    mask: false,
    triangle: false,
    callout: false,
    export: false,
  });

  // Requirement: La div "ombre portée" doit être repliée par défaut et dépliable au clic
  const [isShadowExpanded, setIsShadowExpanded] = useState<boolean>(false);

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
  const [isMaskGapsLinked, setIsMaskGapsLinked] = useState<boolean>(true);

  const activeBlur = blurZones.find((b) => b.id === selectedBlurId) || null;
  const activeMask = maskShapes.find((m) => m.id === selectedMaskId) || null;
  const activeTriangle = triangles.find((t) => t.id === selectedTriangleId) || null;

  return (
    <aside
      className={`relative backdrop-blur-xl rounded-3xl flex flex-col h-fit max-h-[calc(100vh-7rem)] overflow-y-auto select-none shrink-0 z-20 text-xs self-start max-w-[calc(100vw-2rem)] transition-colors duration-200 ${
        isDarkMode
          ? 'bg-[#212121]/95 border border-[#333333] shadow-[0_8px_30px_rgba(0,0,0,0.4)] ring-1 ring-white/10 text-white'
          : 'bg-white/70 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-[#979797]/15 text-[#000000]'
      }`}
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
        <div className={`w-1 h-8 rounded-full transition-colors ${
          isDarkMode ? 'bg-white/20 group-hover:bg-[#0088cc]' : 'bg-[#979797]/30 group-hover:bg-[#0088cc]'
        }`} />
      </div>

      {/* Panel Header */}
      <div className={`p-4 border-b flex items-center justify-between transition-colors ${
        isDarkMode ? 'border-[#333333]' : 'border-[#eeeeee]'
      }`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full inline-block ${isDarkMode ? 'bg-[#0088cc]' : 'bg-[#000000]'}`} />
          <h2 className={`font-semibold text-xs tracking-tight ${isDarkMode ? 'text-white' : 'text-[#000000]'}`}>
            Paramètres du Studio
          </h2>
        </div>

        <button
          id="btn-studio-reset"
          onClick={onResetToDefaults}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
            isDarkMode
              ? 'bg-[#333333] hover:bg-[#3e3e3e] text-white border border-[#444444]'
              : 'bg-[#eeeeee]/80 hover:bg-[#eeeeee] text-[#000000]'
          }`}
          title="Réinitialiser tous les réglages par défaut"
        >
          <RotateCcw className={`w-3 h-3 ${isDarkMode ? 'text-[#bbbbbb]' : 'text-[#666666]'}`} />
          <span>Réinitialiser</span>
        </button>
      </div>

      {/* Accordion Sections - All folded by default */}
      <div className={`flex-1 divide-y transition-colors ${
        isDarkMode ? 'divide-[#303030]' : 'divide-[#eeeeee]'
      }`}>
        
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

              {/* Suite logique des pastilles à l'import */}
              <div className={`p-3 rounded-2xl border transition-colors flex flex-col gap-2 ${
                isDarkMode ? 'bg-[#2a2a2a] border-[#383838]' : 'bg-[#eeeeee]/60 border-white'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-semibold ${isDarkMode ? 'text-white' : 'text-[#000000]'}`}>
                      Suite logique à l'import
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      sequentialImportNumbering
                        ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                        : isDarkMode ? 'bg-[#383838] text-[#888888]' : 'bg-[#e0e0e0] text-[#777777]'
                    }`}>
                      {sequentialImportNumbering ? 'Activée' : 'Désactivée'}
                    </span>
                  </div>

                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sequentialImportNumbering}
                      onChange={onToggleSequentialImportNumbering}
                      className="sr-only peer"
                    />
                    <div className={`w-8 h-4 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#979797]/30 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#0088cc] ${
                      isDarkMode ? 'bg-[#444444]' : 'bg-[#d0d0d0]'
                    }`} />
                  </label>
                </div>

                <p className={`text-[10px] leading-relaxed ${isDarkMode ? 'text-[#aaaaaa]' : 'text-[#666666]'}`}>
                  Incrémente automatiquement le numéro de la première pastille à chaque nouvel import dans la session (Étape 1, 2, 3...).
                </p>

                {sequentialImportNumbering && (
                  <div className={`pt-2 border-t flex items-center justify-between text-[11px] ${
                    isDarkMode ? 'border-[#383838]' : 'border-white/80'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className={isDarkMode ? 'text-[#aaaaaa]' : 'text-[#666666]'}>Prochaine pastille :</span>
                      <div className="w-16">
                        <NumericInput
                          value={nextSequentialStep}
                          onChange={(val) => onChangeNextSequentialStep?.(Math.max(1, Math.round(val)))}
                          min={1}
                          max={99}
                        />
                      </div>
                    </div>

                    {onResetSequentialCounter && (
                      <button
                        type="button"
                        onClick={onResetSequentialCounter}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all cursor-pointer ${
                          isDarkMode
                            ? 'bg-[#383838] hover:bg-[#444444] text-[#cccccc] hover:text-white'
                            : 'bg-white hover:bg-white/80 text-[#555555] hover:text-black border border-[#d6d6d6]'
                        }`}
                        title="Réinitialiser la suite à l'étape 1"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>Recommencer à 1</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

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
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#666666] font-medium">Teinte de l'arrière-plan</span>
                    {calloutVignette?.enabled && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 font-medium">
                        Masquée en Callout
                      </span>
                    )}
                  </div>
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
                {globalStyles.workspaceWidth || 260}px
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
              <button
                id="btn-add-focus-nouveau"
                onClick={onAddFocus}
                className="w-6 h-6 rounded-full bg-[#0088cc] hover:bg-[#0077b3] text-white flex items-center justify-center transition-all shadow-2xs hover:scale-105 active:scale-95"
                title="Ajouter une nouvelle zone de focus"
              >
                <Plus className="w-3.5 h-3.5" />
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
                          : isDarkMode
                            ? 'bg-[#333333] border border-[#484848] text-[#e0e0e0] hover:bg-[#404040] hover:text-white'
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

                        {sequentialImportNumbering && (
                          <div className="flex items-center justify-between text-[10px] text-[#666666] dark:text-[#aaaaaa] pt-0.5">
                            <span>Suite logique active</span>
                            <span className="font-semibold text-[#0088cc]">Prochain import débutera à #{nextSequentialStep}</span>
                          </div>
                        )}

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
                      className="font-semibold text-[#000000] dark:text-white bg-white dark:bg-[#333333] border border-[#d6d6d6] dark:border-[#4d4d4d] rounded-full px-3 py-1 hover:border-[#979797] focus:border-[#0088cc] focus:ring-1 focus:ring-[#0088cc] outline-none text-xs flex-1 mr-2 transition-colors shadow-2xs"
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

                  {/* Orientation de la zone : Horizontale (240x50) ou Verticale (50x240) */}
                  {(() => {
                    const isVertical = selectedFocus.orientation === 'vertical' || selectedFocus.height > selectedFocus.width;
                    const bounds = calculateCompositionBounds(image, focuses, globalStyles.workspaceWidth);
                    const phoneCenterX = bounds.bgX + bounds.bgWidth / 2;

                    return (
                      <div className="flex flex-col gap-2 pt-1 border-t border-[#eeeeee]">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#666666] font-medium">Orientation de la zone</span>
                          <span className="text-[10px] text-[#0088cc] font-semibold">
                            {isVertical ? 'Verticale (50 × 240 px)' : 'Horizontale (240 × 50 px)'}
                          </span>
                        </div>

                        {/* Toggle Horizontale / Verticale */}
                        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#eeeeee]/70 rounded-xl">
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateFocus({
                                orientation: 'horizontal',
                                width: 240,
                                height: 50,
                                x: Math.round(phoneCenterX - 240 / 2),
                              });
                            }}
                            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                              !isVertical
                                ? 'bg-[#0088cc] text-white shadow-2xs'
                                : 'text-[#666666] hover:text-[#000000] hover:bg-white/50'
                            }`}
                          >
                            <span className="inline-block w-4 h-2 border border-current rounded-xs" />
                            <span>Horizontale (240×50)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              // Magnétiser par défaut le centre de la zone sur le bord gauche du screenshot original
                              onUpdateFocus({
                                orientation: 'vertical',
                                width: 50,
                                height: 240,
                                x: Math.round(bounds.bgX - 50 / 2),
                                zoom: 1.2,
                              });
                            }}
                            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                              isVertical
                                ? 'bg-[#0088cc] text-white shadow-2xs'
                                : 'text-[#666666] hover:text-[#000000] hover:bg-white/50'
                            }`}
                          >
                            <span className="inline-block w-2 h-4 border border-current rounded-xs" />
                            <span>Verticale (50×240)</span>
                          </button>
                        </div>

                        {/* Magnétisme bords screenshot pour zone verticale */}
                        {isVertical && (
                          <div className="flex flex-col gap-1.5 p-2.5 bg-sky-50/90 dark:bg-sky-950/40 rounded-xl border border-sky-200/80">
                            <div className="flex items-center justify-between text-[11px] text-sky-900 dark:text-sky-300 font-semibold">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#0088cc] animate-pulse" />
                                Magnétisme bords screenshot (centré) :
                              </span>
                              <span className="text-[9px] text-sky-600 font-normal">Clic ou glisser</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1 pt-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  onUpdateFocus({ x: Math.round(bounds.bgX - selectedFocus.width / 2) });
                                }}
                                className="px-2 py-1.5 bg-white dark:bg-[#252525] hover:bg-sky-100/80 text-[#25465F] dark:text-sky-200 rounded-lg text-[10px] font-bold border border-sky-200 transition-all flex items-center justify-center gap-1 shadow-2xs active:scale-95"
                                title="Centrer la zone focus sur le bord gauche du screenshot original"
                              >
                                ⇤ Bord gauche
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onUpdateFocus({ x: Math.round(phoneCenterX - selectedFocus.width / 2) });
                                }}
                                className="px-2 py-1.5 bg-white dark:bg-[#252525] hover:bg-sky-100/80 text-[#25465F] dark:text-sky-200 rounded-lg text-[10px] font-bold border border-sky-200 transition-all flex items-center justify-center gap-1 shadow-2xs active:scale-95"
                                title="Centrer horizontalement sur le screenshot"
                              >
                                ↔ Centre
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onUpdateFocus({ x: Math.round(bounds.bgX + bounds.bgWidth - selectedFocus.width / 2) });
                                }}
                                className="px-2 py-1.5 bg-white dark:bg-[#252525] hover:bg-sky-100/80 text-[#25465F] dark:text-sky-200 rounded-lg text-[10px] font-bold border border-sky-200 transition-all flex items-center justify-center gap-1 shadow-2xs active:scale-95"
                                title="Centrer la zone focus sur le bord droit du screenshot original"
                              >
                                Bord droit ⇥
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Dimensions : Largeur & Hauteur saisissables au pavé numérique */}
                  {(() => {
                    const isVertical = selectedFocus.orientation === 'vertical' || selectedFocus.height > selectedFocus.width;
                    return (
                      <div className="flex flex-col gap-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] text-[#666666] font-medium">Largeur</label>
                              <button
                                onClick={() => onUpdateFocus({ width: isVertical ? 50 : 240 })}
                                className="text-[9px] text-[#0088cc] hover:underline font-semibold"
                              >
                                {isVertical ? '50px' : '240px'}
                              </button>
                            </div>
                            <NumericInput
                              value={Math.round(selectedFocus.width)}
                              onChange={(val) => onUpdateFocus({ width: Math.max(30, val) })}
                              min={30}
                              max={500}
                              unit="px"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] text-[#666666] font-medium">Hauteur</label>
                              <button
                                onClick={() => onUpdateFocus({ height: isVertical ? 240 : 50 })}
                                className="text-[9px] text-[#0088cc] hover:underline font-semibold"
                              >
                                {isVertical ? '240px' : '50px'}
                              </button>
                            </div>
                            <NumericInput
                              value={Math.round(selectedFocus.height)}
                              onChange={(val) => onUpdateFocus({ height: Math.max(20, val) })}
                              min={20}
                              max={500}
                              unit="px"
                            />
                          </div>
                        </div>

                        {/* Presets rapides de dimensions selon l'orientation */}
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span className="text-[10px] text-[#666666]">Presets :</span>
                          {isVertical ? (
                            <>
                              {[
                                { label: '50 × 240', w: 50, h: 240 },
                                { label: '50 × 300', w: 50, h: 300 },
                                { label: '60 × 240', w: 60, h: 240 },
                              ].map((p) => (
                                <button
                                  key={p.label}
                                  onClick={() => onUpdateFocus({ width: p.w, height: p.h })}
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                                    Math.round(selectedFocus.width) === p.w && Math.round(selectedFocus.height) === p.h
                                      ? 'bg-[#000000] text-white'
                                      : 'bg-[#eeeeee]/80 text-[#666666] hover:bg-[#eeeeee]'
                                  }`}
                                >
                                  {p.label}
                                </button>
                              ))}
                            </>
                          ) : (
                            <>
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
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })()}

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
                    const bounds = calculateCompositionBounds(image, focuses, globalStyles.workspaceWidth);
                    const bgWidth = bounds.bgWidth > 0 ? bounds.bgWidth : 180;
                    const focusW = Math.round(selectedFocus.width);
                    const isVertical = selectedFocus.orientation === 'vertical' || selectedFocus.height > selectedFocus.width;
                    
                    // En mode horizontal (240x50), le zoom par défaut aligne la largeur du screenshot sur celle de la zone focus (240 / 180 = 1.33x).
                    // En mode vertical (50x240), la largeur de la zone (50px) étant inférieure au screenshot (180px),
                    // le zoom par défaut est de 1.2x (ou 1.0x minimum) pour préserver un grossissement valide >= 1.0x.
                    const defaultZoom = isVertical
                      ? 1.2
                      : Math.max(1.0, Number((focusW / bgWidth).toFixed(3)));
                    
                    const currentZoom = Math.max(1.0, selectedFocus.zoom || defaultZoom);
                    const zoomPx = Math.round(bgWidth * currentZoom);

                    // Bornes valides pour le curseur (min < max toujours garanti, en mode horizontal comme en vertical)
                    const minPx = Math.round(bgWidth); // 1.0x (180px)
                    const maxPx = Math.max(Math.round(bgWidth * 3.5), Math.round(focusW * 2.5)); // min 630px

                    const presets = isVertical
                      ? [
                          { label: '1.0× (180px)', factor: 1.0, title: 'Taille originale (100%)' },
                          { label: `1.2× (${Math.round(bgWidth * 1.2)}px)`, factor: 1.2, title: 'Zoom par défaut (+20%)' },
                          { label: `1.4× (${Math.round(bgWidth * 1.4)}px)`, factor: 1.4, title: '+40% d\'agrandissement' },
                          { label: `1.8× (${Math.round(bgWidth * 1.8)}px)`, factor: 1.8, title: '+80% d\'agrandissement' },
                          { label: `2.0× (${Math.round(bgWidth * 2.0)}px)`, factor: 2.0, title: '2× agrandissement' },
                        ]
                      : [
                          { label: `Défaut (${focusW}px)`, factor: defaultZoom, title: `Par défaut : largeur screenshot (${focusW}px) = largeur zone focus (${focusW}px)` },
                          { label: `+20% (${Math.round(focusW * 1.2)}px)`, factor: Number((defaultZoom * 1.2).toFixed(3)), title: '+20% d\'agrandissement' },
                          { label: `+40% (${Math.round(focusW * 1.4)}px)`, factor: Number((defaultZoom * 1.4).toFixed(3)), title: '+40% d\'agrandissement' },
                          { label: `+80% (${Math.round(focusW * 1.8)}px)`, factor: Number((defaultZoom * 1.8).toFixed(3)), title: '+80% d\'agrandissement' },
                          { label: `2× (${Math.round(focusW * 2.0)}px)`, factor: Number((defaultZoom * 2.0).toFixed(3)), title: '2× agrandissement' },
                        ];

                    return (
                      <div className="flex flex-col gap-2 pt-2 border-t border-[#eeeeee]">
                        <div className="flex items-center justify-between text-[11px]">
                          <div>
                            <span className="text-[#666666] font-medium block">Grossissement (Zoom)</span>
                            <span className="text-[10px] text-[#979797]">Largeur screenshot : {zoomPx} px ({currentZoom.toFixed(2)}×)</span>
                          </div>
                          <div className="w-20">
                            <NumericInput
                              value={zoomPx}
                              onChange={(val) => {
                                const clamped = Math.max(minPx, Math.min(maxPx, val));
                                onUpdateFocus({ zoom: Math.max(1.0, Number((clamped / bgWidth).toFixed(3))) });
                              }}
                              min={minPx}
                              max={maxPx}
                              unit="px"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min={minPx}
                            max={maxPx}
                            step="2"
                            value={zoomPx}
                            onChange={(e) => {
                              const newPx = parseFloat(e.target.value);
                              onUpdateFocus({ zoom: Math.max(1.0, Number((newPx / bgWidth).toFixed(3))) });
                            }}
                            className="flex-1 accent-[#0088cc]"
                          />
                        </div>

                        {/* Presets rapides de zoom en pixel */}
                        <div className="flex gap-1 flex-wrap">
                          {presets.map((p) => (
                            <button
                              key={p.factor}
                              type="button"
                              onClick={() => onUpdateFocus({ zoom: p.factor })}
                              title={p.title}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                                Math.abs(currentZoom - p.factor) < 0.05
                                  ? 'bg-[#0088cc] text-white shadow-2xs'
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

                  {/* Cadrage interne du screenshot (sans altérer l'image d'origine) */}
                  <div className="flex flex-col gap-2.5 pt-2.5 border-t border-[#eeeeee]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Move className="w-3.5 h-3.5 text-[#0088cc]" />
                        <span className="text-[#333333] font-semibold text-[11px]">
                          Cadrage interne du screenshot
                        </span>
                      </div>
                      {((selectedFocus.sourceOffsetX || 0) !== 0 || (selectedFocus.sourceOffsetY || 0) !== 0) && (
                        <button
                          type="button"
                          onClick={() => onUpdateFocus({ sourceOffsetX: 0, sourceOffsetY: 0 })}
                          className="text-[10px] text-[#0088cc] hover:underline font-medium"
                        >
                          Recentrer
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-[#888888] leading-tight">
                      Déplace la capture à l'intérieur de cette zone sans modifier la position du screenshot original.
                    </p>

                    {/* Bouton d'activation du mode recadrage direct */}
                    <button
                      type="button"
                      onClick={() => onToggleInternalFraming?.(selectedFocus.id)}
                      className={`w-full py-1.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-[11px] font-semibold transition-all ${
                        internalFramingFocusId === selectedFocus.id
                          ? 'bg-[#25465F] text-white border-[#25465F] shadow-sm'
                          : 'bg-white hover:bg-sky-50 text-[#25465F] border-sky-200'
                      }`}
                    >
                      <Crosshair className={`w-3.5 h-3.5 ${internalFramingFocusId === selectedFocus.id ? 'animate-pulse text-sky-300' : 'text-[#0088cc]'}`} />
                      <span>
                        {internalFramingFocusId === selectedFocus.id
                          ? 'Recadrage actif (Glisser / Flèches)'
                          : 'Ajuster à la souris (ou Alt + Glisser)'}
                      </span>
                    </button>

                    {/* Saisie numérique Décalage X et Y */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-[10px] text-[#666666]">
                          <span>Décalage X</span>
                          <span className="font-mono">{Math.round(selectedFocus.sourceOffsetX || 0)} px</span>
                        </div>
                        <NumericInput
                          value={Math.round(selectedFocus.sourceOffsetX || 0)}
                          onChange={(val) => onUpdateFocus({ sourceOffsetX: val })}
                          min={-800}
                          max={800}
                          unit="px"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-[10px] text-[#666666]">
                          <span>Décalage Y</span>
                          <span className="font-mono">{Math.round(selectedFocus.sourceOffsetY || 0)} px</span>
                        </div>
                        <NumericInput
                          value={Math.round(selectedFocus.sourceOffsetY || 0)}
                          onChange={(val) => onUpdateFocus({ sourceOffsetY: val })}
                          min={-800}
                          max={800}
                          unit="px"
                        />
                      </div>
                    </div>

                    {/* Micro-ajustements rapides au pas de ±5px */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-[#888888]">Micro-ajustement (±5px) :</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onUpdateFocus({ sourceOffsetX: (selectedFocus.sourceOffsetX || 0) - 5 })}
                          className="w-6 h-6 rounded-md bg-[#f4f4f4] hover:bg-slate-200 text-[#333333] text-[11px] font-bold flex items-center justify-center transition-colors"
                          title="Décaler vers la gauche de 5px"
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateFocus({ sourceOffsetY: (selectedFocus.sourceOffsetY || 0) - 5 })}
                          className="w-6 h-6 rounded-md bg-[#f4f4f4] hover:bg-slate-200 text-[#333333] text-[11px] font-bold flex items-center justify-center transition-colors"
                          title="Décaler vers le haut de 5px"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateFocus({ sourceOffsetY: (selectedFocus.sourceOffsetY || 0) + 5 })}
                          className="w-6 h-6 rounded-md bg-[#f4f4f4] hover:bg-slate-200 text-[#333333] text-[11px] font-bold flex items-center justify-center transition-colors"
                          title="Décaler vers le bas de 5px"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateFocus({ sourceOffsetX: (selectedFocus.sourceOffsetX || 0) + 5 })}
                          className="w-6 h-6 rounded-md bg-[#f4f4f4] hover:bg-slate-200 text-[#333333] text-[11px] font-bold flex items-center justify-center transition-colors"
                          title="Décaler vers la droite de 5px"
                        >
                          →
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Ombre Portée (Photoshop : opacité 30%, angle 90°, distance 2px, taille 2px, #25465F) */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-[#eeeeee]">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#666666] font-medium">Ombre portée</span>
                        <span className="text-[10px] text-[#979797] font-mono">30%, 90°, 2px, 2px</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedFocus.hasShadow !== false}
                          onChange={(e) => onUpdateFocus({ hasShadow: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-[#eeeeee] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#979797]/30 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#0088cc]" />
                      </label>
                    </div>

                    {selectedFocus.hasShadow !== false && (
                      <div className="grid grid-cols-2 gap-2 bg-[#eeeeee]/40 p-2 rounded-xl text-[10px]">
                        <div>
                          <span className="text-[#666666] block">Opacité : {Math.round((selectedFocus.shadowOpacity ?? 0.30) * 100)}%</span>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={selectedFocus.shadowOpacity ?? 0.30}
                            onChange={(e) => onUpdateFocus({ shadowOpacity: parseFloat(e.target.value) })}
                            className="w-full accent-[#0088cc]"
                          />
                        </div>
                        <div>
                          <span className="text-[#666666] block">Angle : {selectedFocus.shadowAngle ?? 90}°</span>
                          <input
                            type="range"
                            min="0"
                            max="360"
                            step="5"
                            value={selectedFocus.shadowAngle ?? 90}
                            onChange={(e) => onUpdateFocus({ shadowAngle: parseInt(e.target.value) })}
                            className="w-full accent-[#0088cc]"
                          />
                        </div>
                        <div>
                          <span className="text-[#666666] block">Distance : {selectedFocus.shadowDistance ?? 2}px</span>
                          <input
                            type="range"
                            min="0"
                            max="20"
                            step="1"
                            value={selectedFocus.shadowDistance ?? 2}
                            onChange={(e) => onUpdateFocus({ shadowDistance: parseInt(e.target.value), shadowOffsetY: parseInt(e.target.value) })}
                            className="w-full accent-[#0088cc]"
                          />
                        </div>
                        <div>
                          <span className="text-[#666666] block">Taille (Flou) : {selectedFocus.shadowSize ?? 2}px</span>
                          <input
                            type="range"
                            min="0"
                            max="20"
                            step="1"
                            value={selectedFocus.shadowSize ?? 2}
                            onChange={(e) => onUpdateFocus({ shadowSize: parseInt(e.target.value), shadowBlur: parseInt(e.target.value) })}
                            className="w-full accent-[#0088cc]"
                          />
                        </div>
                        <div className="col-span-2 flex items-center justify-between pt-1 border-t border-white/60">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={selectedFocus.shadowColor || '#25465F'}
                              onChange={(e) => onUpdateFocus({ shadowColor: e.target.value })}
                              className="w-5 h-5 rounded-full border border-[#979797]/40 cursor-pointer p-0 bg-white"
                            />
                            <span className="font-mono text-[9px] uppercase text-[#666666]">{selectedFocus.shadowColor || '#25465F'}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onUpdateFocus({
                              shadowOpacity: 0.30,
                              shadowAngle: 90,
                              shadowDistance: 2,
                              shadowSize: 2,
                              shadowBlur: 2,
                              shadowOffsetY: 2,
                              shadowColor: '#25465F',
                              hasShadow: true,
                            })}
                            className="px-2 py-0.5 rounded-full bg-white hover:bg-[#e0e0e0] text-[#0088cc] font-medium text-[9px] transition-colors"
                            title="Réinitialiser l'ombre aux réglages Photoshop demandés (30%, 90°, 2px, 2px, #25465F)"
                          >
                            Réinitialiser (30%, 90°, 2px)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-5 text-[#666666] flex flex-col items-center gap-2">
                  <p className="text-[11px]">Aucun focus sélectionné</p>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => onAddFocus('horizontal')}
                      className="px-3 py-1.5 rounded-xl bg-white border border-[#eeeeee] hover:border-[#0088cc] text-[#0088cc] hover:bg-sky-50 font-semibold text-[11px] transition-all shadow-2xs flex items-center gap-1.5"
                    >
                      <span className="inline-block w-3.5 h-2 border border-current rounded-xs" />
                      <span>+ Focus horizontal (240×50)</span>
                    </button>
                    <button
                      onClick={() => onAddFocus('vertical')}
                      className="px-3 py-1.5 rounded-xl bg-white border border-[#eeeeee] hover:border-[#0088cc] text-[#0088cc] hover:bg-sky-50 font-semibold text-[11px] transition-all shadow-2xs flex items-center gap-1.5"
                    >
                      <span className="inline-block w-2 h-3.5 border border-current rounded-xs" />
                      <span>+ Focus vertical (50×240)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. ZONES DE FLOU & CONFIDENTIALITÉ (Toujours sous toutes les autres formes) */}
        <div className="flex flex-col">
          <div className="w-full px-4 py-3.5 flex items-center justify-between font-semibold text-[#000000] hover:bg-[#eeeeee]/40 transition-colors">
            <button
              onClick={() => toggleSection('blur')}
              className="flex items-center gap-2 text-left"
            >
              <Droplet className="w-3.5 h-3.5 text-[#0088cc]" />
              <span className="text-[11px] tracking-wide uppercase">4. Flou & Confidentialité</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#eeeeee] text-[#666666] font-mono font-medium">
                {blurZones.length}
              </span>
            </button>

            <div className="flex items-center gap-1.5">
              <button
                onClick={onAddBlur}
                className="w-6 h-6 rounded-full bg-[#0088cc] hover:bg-[#0077b3] text-white flex items-center justify-center transition-all shadow-2xs hover:scale-105 active:scale-95"
                title="Ajouter une zone de flou"
              >
                <Plus className="w-3.5 h-3.5" />
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
                          : isDarkMode
                            ? 'bg-[#333333] border border-[#484848] text-[#e0e0e0] hover:bg-[#404040] hover:text-white'
                            : 'bg-[#eeeeee]/80 text-[#666666] hover:bg-[#eeeeee] hover:text-[#000000]'
                      }`}
                    >
                      {b.name || `Flou ${idx + 1}`}
                    </button>
                  ))}
                </div>
              )}

              {activeBlur ? (
                <div className="flex flex-col gap-3 p-3.5 rounded-2xl bg-[#eeeeee]/50 border border-white">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-[#0088cc]" />
                      <span className="font-semibold text-[#000000] text-xs">{activeBlur.name}</span>
                    </div>
                    <button
                      onClick={() => onDeleteBlur(activeBlur.id)}
                      className="text-[#666666] hover:text-rose-600 text-[10px] font-medium transition-colors"
                    >
                      Supprimer
                    </button>
                  </div>

                  {/* 1. Sélecteur de Type de Flou (Dépoli, Gaussien, Mosaïque, Fumé) */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase font-semibold text-[#666666] tracking-wider">
                      Style de rendu
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { 
                          id: 'frosted', 
                          label: 'Dépoli', 
                          desc: 'Verre givré laiteux', 
                          icon: <Sparkles className="w-3.5 h-3.5" /> 
                        },
                        { 
                          id: 'gaussian', 
                          label: 'Gaussien', 
                          desc: 'Optique doux', 
                          icon: <Droplet className="w-3.5 h-3.5" /> 
                        },
                        { 
                          id: 'pixelate', 
                          label: 'Mosaïque', 
                          desc: 'Pixellisé net', 
                          icon: <Grid className="w-3.5 h-3.5" /> 
                        },
                        { 
                          id: 'smoked', 
                          label: 'Fumé', 
                          desc: 'Sombre discret', 
                          icon: <Layers className="w-3.5 h-3.5" /> 
                        },
                      ].map((style) => {
                        const isCurrent = (activeBlur.blurType || 'frosted') === style.id;
                        return (
                          <button
                            key={style.id}
                            onClick={() => onUpdateBlur(activeBlur.id, { blurType: style.id as any })}
                            className={`flex flex-col items-start p-2 rounded-xl border text-left transition-all ${
                              isCurrent
                                ? 'bg-[#0088cc] border-[#0088cc] text-white shadow-2xs'
                                : 'bg-white border-[#e5e5e5] text-[#333333] hover:border-[#cccccc]'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 font-semibold text-xs">
                              {style.icon}
                              <span>{style.label}</span>
                            </div>
                            <span className={`text-[10px] mt-0.5 ${isCurrent ? 'text-white/80' : 'text-[#888888]'}`}>
                              {style.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Intensité du flou / Taille mosaïque */}
                  <div className="flex flex-col gap-1 pt-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#666666] font-medium">
                        {(activeBlur.blurType || 'frosted') === 'pixelate' ? 'Taille des pavés (pixels)' : 'Intensité du flou'}
                      </span>
                      <div className="w-16">
                        <NumericInput
                          value={activeBlur.blurRadius}
                          onChange={(r) => onUpdateBlur(activeBlur.id, { blurRadius: Math.max(2, r) })}
                          min={2}
                          max={50}
                          unit="px"
                        />
                      </div>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="45"
                      value={activeBlur.blurRadius}
                      onChange={(e) => onUpdateBlur(activeBlur.id, { blurRadius: parseInt(e.target.value) })}
                      className="accent-[#0088cc]"
                    />
                  </div>

                  {/* 3. Opacité du flou (10% à 100%) */}
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-[#eeeeee]">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#666666] font-medium">Opacité du flou</span>
                      <div className="w-16">
                        <NumericInput
                          value={Math.round((activeBlur.opacity ?? 1.0) * 100)}
                          onChange={(val) => onUpdateBlur(activeBlur.id, { opacity: Math.max(0.1, Math.min(1, val / 100)) })}
                          min={10}
                          max={100}
                          unit="%"
                        />
                      </div>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={Math.round((activeBlur.opacity ?? 1.0) * 100)}
                      onChange={(e) => onUpdateBlur(activeBlur.id, { opacity: parseInt(e.target.value) / 100 })}
                      className="accent-[#0088cc]"
                    />
                    {/* Presets rapides d'opacité */}
                    <div className="flex gap-1.5">
                      {[
                        { label: '30%', val: 0.3 },
                        { label: '50%', val: 0.5 },
                        { label: '80%', val: 0.8 },
                        { label: '100%', val: 1.0 },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          onClick={() => onUpdateBlur(activeBlur.id, { opacity: preset.val })}
                          className={`flex-1 py-1 rounded-full text-[10px] font-medium transition-all ${
                            Math.abs((activeBlur.opacity ?? 1.0) - preset.val) < 0.05
                              ? 'bg-[#0088cc] text-white shadow-2xs font-semibold'
                              : 'bg-white border border-[#e5e5e5] text-[#666666] hover:text-[#000000]'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. Dimensions du flou */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#eeeeee]">
                    <div>
                      <label className="text-[10px] text-[#666666] font-medium">Largeur</label>
                      <NumericInput
                        value={Math.round(activeBlur.width)}
                        onChange={(w) => onUpdateBlur(activeBlur.id, { width: Math.max(15, w) })}
                        min={15}
                        max={800}
                        unit="px"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#666666] font-medium">Hauteur</label>
                      <NumericInput
                        value={Math.round(activeBlur.height)}
                        onChange={(h) => onUpdateBlur(activeBlur.id, { height: Math.max(10, h) })}
                        min={10}
                        max={600}
                        unit="px"
                      />
                    </div>
                  </div>

                  {/* 5. Arrondis des angles de la forme (Flou) */}
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
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={activeBlur.borderRadius ?? 4}
                      onChange={(e) => onUpdateBlur(activeBlur.id, { borderRadius: parseInt(e.target.value) })}
                      className="accent-[#0088cc]"
                    />
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
                              : 'bg-white border border-[#e5e5e5] text-[#666666] hover:text-[#000000]'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Note d'information de superposition */}
                  <div className="p-2 rounded-xl bg-sky-50/80 border border-sky-100 flex items-center gap-1.5 text-[10px] text-sky-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0088cc] shrink-0" />
                    <span>Les flous restent toujours situés <b>en dessous</b> des zones de focus, formes et vignettes.</span>
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
                className="w-6 h-6 rounded-full bg-[#25465F] hover:bg-[#1a3245] text-white flex items-center justify-center transition-all shadow-2xs hover:scale-105 active:scale-95"
                title="Ajouter une forme bleue"
              >
                <Plus className="w-3.5 h-3.5" />
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
                      className="font-semibold text-[#000000] dark:text-white bg-white dark:bg-[#333333] border border-[#d6d6d6] dark:border-[#4d4d4d] rounded-full px-3 py-1 hover:border-[#979797] focus:border-[#0088cc] focus:ring-1 focus:ring-[#0088cc] outline-none text-xs flex-1 mr-2 transition-colors shadow-2xs"
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

                  {/* Multiplicateur de forme (Répétition / Grille & Espacements) */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-[#eeeeee]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <LayoutGrid className="w-3.5 h-3.5 text-[#0088cc]" />
                        <span className="text-[10px] text-[#000000] font-semibold">
                          Multiplicateur de forme
                        </span>
                        {activeMask.multiplier?.enabled && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#0088cc] text-white font-mono font-bold">
                            {(activeMask.multiplier.cols || 2) * (activeMask.multiplier.rows || 2)}×
                          </span>
                        )}
                      </div>

                      {/* Bouton Toggle Multiplier */}
                      <button
                        onClick={() => {
                          const isCurrentlyEnabled = Boolean(activeMask.multiplier?.enabled);
                          if (isCurrentlyEnabled) {
                            onUpdateMask(activeMask.id, {
                              multiplier: undefined,
                            });
                          } else {
                            onUpdateMask(activeMask.id, {
                              multiplier: {
                                enabled: true,
                                cols: 2,
                                rows: 2,
                                gapX: 10,
                                gapY: 10,
                              },
                            });
                          }
                        }}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                          activeMask.multiplier?.enabled
                            ? 'bg-[#0088cc] text-white shadow-2xs'
                            : 'bg-white border border-[#cccccc] text-[#444444] hover:bg-[#f5f5f5]'
                        }`}
                      >
                        {activeMask.multiplier?.enabled ? 'Actif' : 'Multiplier'}
                      </button>
                    </div>

                    {!activeMask.multiplier?.enabled ? (
                      <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-[#e5e5e5]">
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] font-semibold text-[#111111]">Multiplier la forme en 4</span>
                          <span className="text-[9px] text-[#777777]">Grille 2×2 avec espacement ajustable</span>
                        </div>
                        <button
                          onClick={() => {
                            onUpdateMask(activeMask.id, {
                              multiplier: {
                                enabled: true,
                                cols: 2,
                                rows: 2,
                                gapX: 10,
                                gapY: 10,
                              },
                            });
                          }}
                          className="px-3 py-1.5 rounded-full bg-[#000000] hover:bg-[#25465F] text-white text-[10px] font-semibold transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98] shrink-0"
                        >
                          Multiplier en 4
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2.5 p-2.5 rounded-xl bg-white border border-[#e5e5e5]">
                        {/* Presets rapides de disposition (Grille 2x2, Ligne 4x1, Colonne 1x4) */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] uppercase font-bold text-[#777777] tracking-wider">
                            Disposition (Total : {(activeMask.multiplier.cols || 2) * (activeMask.multiplier.rows || 2)} formes)
                          </span>
                          <div className="grid grid-cols-3 gap-1">
                            {[
                              { label: 'Grille 2×2 (4)', cols: 2, rows: 2 },
                              { label: 'Ligne 4×1 (4)', cols: 4, rows: 1 },
                              { label: 'Colonne 1×4 (4)', cols: 1, rows: 4 },
                            ].map((preset) => {
                              const isMatch =
                                (activeMask.multiplier?.cols || 2) === preset.cols &&
                                (activeMask.multiplier?.rows || 2) === preset.rows;
                              return (
                                <button
                                  key={preset.label}
                                  onClick={() => {
                                    onUpdateMask(activeMask.id, {
                                      multiplier: {
                                        ...activeMask.multiplier!,
                                        enabled: true,
                                        cols: preset.cols,
                                        rows: preset.rows,
                                      },
                                    });
                                  }}
                                  className={`py-1 px-1.5 rounded-lg text-[9px] font-medium transition-all text-center ${
                                    isMatch
                                      ? 'bg-[#0088cc] text-white font-semibold shadow-2xs'
                                      : 'bg-[#f4f4f4] hover:bg-[#e8e8e8] text-[#555555]'
                                  }`}
                                >
                                  {preset.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Colonnes & Lignes personnalisées */}
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#f0f0f0]">
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[9px] text-[#666666] font-medium">Colonnes (H)</label>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  const currentCols = activeMask.multiplier?.cols || 2;
                                  if (currentCols > 1) {
                                    onUpdateMask(activeMask.id, {
                                      multiplier: { ...activeMask.multiplier!, cols: currentCols - 1 },
                                    });
                                  }
                                }}
                                className="w-6 h-6 rounded-md bg-[#eeeeee] hover:bg-[#dddddd] text-[#333333] font-bold text-xs flex items-center justify-center transition-colors"
                              >
                                -
                              </button>
                              <div className="flex-1">
                                <NumericInput
                                  value={activeMask.multiplier.cols || 2}
                                  onChange={(c) => {
                                    onUpdateMask(activeMask.id, {
                                      multiplier: { ...activeMask.multiplier!, cols: Math.max(1, Math.min(8, c)) },
                                    });
                                  }}
                                  min={1}
                                  max={8}
                                  unit="col"
                                />
                              </div>
                              <button
                                onClick={() => {
                                  const currentCols = activeMask.multiplier?.cols || 2;
                                  if (currentCols < 8) {
                                    onUpdateMask(activeMask.id, {
                                      multiplier: { ...activeMask.multiplier!, cols: currentCols + 1 },
                                    });
                                  }
                                }}
                                className="w-6 h-6 rounded-md bg-[#eeeeee] hover:bg-[#dddddd] text-[#333333] font-bold text-xs flex items-center justify-center transition-colors"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-col gap-0.5">
                            <label className="text-[9px] text-[#666666] font-medium">Lignes (V)</label>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  const currentRows = activeMask.multiplier?.rows || 2;
                                  if (currentRows > 1) {
                                    onUpdateMask(activeMask.id, {
                                      multiplier: { ...activeMask.multiplier!, rows: currentRows - 1 },
                                    });
                                  }
                                }}
                                className="w-6 h-6 rounded-md bg-[#eeeeee] hover:bg-[#dddddd] text-[#333333] font-bold text-xs flex items-center justify-center transition-colors"
                              >
                                -
                              </button>
                              <div className="flex-1">
                                <NumericInput
                                  value={activeMask.multiplier.rows || 2}
                                  onChange={(r) => {
                                    onUpdateMask(activeMask.id, {
                                      multiplier: { ...activeMask.multiplier!, rows: Math.max(1, Math.min(8, r)) },
                                    });
                                  }}
                                  min={1}
                                  max={8}
                                  unit="lig"
                                />
                              </div>
                              <button
                                onClick={() => {
                                  const currentRows = activeMask.multiplier?.rows || 2;
                                  if (currentRows < 8) {
                                    onUpdateMask(activeMask.id, {
                                      multiplier: { ...activeMask.multiplier!, rows: currentRows + 1 },
                                    });
                                  }
                                }}
                                className="w-6 h-6 rounded-md bg-[#eeeeee] hover:bg-[#dddddd] text-[#333333] font-bold text-xs flex items-center justify-center transition-colors"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Gestion des espacements (Gaps) */}
                        <div className="flex flex-col gap-2 pt-1 border-t border-[#f0f0f0]">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] uppercase font-bold text-[#777777] tracking-wider">
                              Espacements entre formes
                            </span>
                            <button
                              onClick={() => setIsMaskGapsLinked(!isMaskGapsLinked)}
                              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] transition-colors ${
                                isMaskGapsLinked ? 'bg-sky-100 text-[#0088cc] font-semibold' : 'text-[#888888] hover:text-[#333333]'
                              }`}
                              title={isMaskGapsLinked ? 'Espacements H & V liés' : 'Espacements H & V indépendants'}
                            >
                              {isMaskGapsLinked ? <Link className="w-2.5 h-2.5" /> : <Unlink className="w-2.5 h-2.5" />}
                              <span>{isMaskGapsLinked ? 'Liés' : 'Indépendants'}</span>
                            </button>
                          </div>

                          {/* Espacement Horizontal */}
                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-[#666666]">Espacement horizontal</span>
                              <div className="w-16">
                                <NumericInput
                                  value={activeMask.multiplier.gapX ?? 10}
                                  onChange={(gx) => {
                                    const val = Math.max(0, Math.min(150, gx));
                                    onUpdateMask(activeMask.id, {
                                      multiplier: {
                                        ...activeMask.multiplier!,
                                        gapX: val,
                                        ...(isMaskGapsLinked ? { gapY: val } : {}),
                                      },
                                    });
                                  }}
                                  min={0}
                                  max={150}
                                  unit="px"
                                />
                              </div>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="60"
                              value={activeMask.multiplier.gapX ?? 10}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                onUpdateMask(activeMask.id, {
                                  multiplier: {
                                    ...activeMask.multiplier!,
                                    gapX: val,
                                    ...(isMaskGapsLinked ? { gapY: val } : {}),
                                  },
                                });
                              }}
                              className="accent-[#0088cc]"
                            />
                          </div>

                          {/* Espacement Vertical */}
                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-[#666666]">Espacement vertical</span>
                              <div className="w-16">
                                <NumericInput
                                  value={activeMask.multiplier.gapY ?? 10}
                                  onChange={(gy) => {
                                    const val = Math.max(0, Math.min(150, gy));
                                    onUpdateMask(activeMask.id, {
                                      multiplier: {
                                        ...activeMask.multiplier!,
                                        gapY: val,
                                        ...(isMaskGapsLinked ? { gapX: val } : {}),
                                      },
                                    });
                                  }}
                                  min={0}
                                  max={150}
                                  unit="px"
                                />
                              </div>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="60"
                              value={activeMask.multiplier.gapY ?? 10}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                onUpdateMask(activeMask.id, {
                                  multiplier: {
                                    ...activeMask.multiplier!,
                                    gapY: val,
                                    ...(isMaskGapsLinked ? { gapX: val } : {}),
                                  },
                                });
                              }}
                              className="accent-[#0088cc]"
                            />
                          </div>

                          {/* Presets rapides d'espacement */}
                          <div className="flex gap-1 pt-0.5">
                            {[
                              { label: '0px', val: 0 },
                              { label: '6px', val: 6 },
                              { label: '10px', val: 10 },
                              { label: '16px', val: 16 },
                              { label: '24px', val: 24 },
                            ].map((preset) => (
                              <button
                                key={preset.label}
                                onClick={() => {
                                  onUpdateMask(activeMask.id, {
                                    multiplier: {
                                      ...activeMask.multiplier!,
                                      gapX: preset.val,
                                      gapY: preset.val,
                                    },
                                  });
                                }}
                                className={`flex-1 py-1 rounded text-[9px] font-medium transition-all ${
                                  (activeMask.multiplier?.gapX ?? 10) === preset.val &&
                                  (activeMask.multiplier?.gapY ?? 10) === preset.val
                                    ? 'bg-[#000000] text-white font-semibold'
                                    : 'bg-[#eeeeee] hover:bg-[#dddddd] text-[#555555]'
                                }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Action : Éclater en formes indépendantes */}
                        {onSplitMaskMultiplier && (
                          <div className="pt-2 border-t border-[#f0f0f0]">
                            <button
                              onClick={() => onSplitMaskMultiplier(activeMask.id)}
                              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0088cc] text-[10px] font-semibold transition-colors border border-sky-200"
                              title="Convertir la grille en formes individuelles distinctes"
                            >
                              <Split className="w-3 h-3" />
                              <span>
                                Convertir en {(activeMask.multiplier.cols || 2) * (activeMask.multiplier.rows || 2)} formes distinctes
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
                  className="w-6 h-6 rounded-full bg-[#000000] hover:bg-[#333333] text-white flex items-center justify-center transition-all shadow-2xs hover:scale-105 active:scale-95"
                  title="Ajouter un triangle 15x13px"
                >
                  <Plus className="w-3.5 h-3.5" />
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

        {/* 7. CALLOUT / ZOOM DÉTACHÉ (VIGNETTE À 5PX DU SCREEN) */}
        <div className="flex flex-col">
          <div className="w-full px-4 py-3.5 flex items-center justify-between font-semibold text-[#000000] hover:bg-[#eeeeee]/40 transition-colors">
            <button
              onClick={() => toggleSection('callout')}
              className="flex items-center gap-2 text-left"
            >
              <Search className="w-3.5 h-3.5 text-[#0088cc]" />
              <span className="text-[11px] tracking-wide uppercase">7. Callout / Zoom Détaché</span>
              {calloutVignette?.enabled && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#0088cc]/10 text-[#0088cc] font-medium">
                  Actif (5px)
                </span>
              )}
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onToggleCallout}
                className={`w-9 h-5 rounded-full relative transition-colors p-0.5 ${
                  calloutVignette?.enabled ? 'bg-[#0088cc]' : 'bg-[#cccccc]'
                }`}
                title={calloutVignette?.enabled ? 'Désactiver la vignette' : 'Activer la vignette'}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    calloutVignette?.enabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              <button onClick={() => toggleSection('callout')}>
                {openSections.callout ? <ChevronDown className="w-4 h-4 text-[#979797]" /> : <ChevronRight className="w-4 h-4 text-[#979797]" />}
              </button>
            </div>
          </div>

          {openSections.callout && (
            <div className="px-4 pb-4 pt-1 flex flex-col gap-3">
              {calloutVignette?.enabled && onUpdateCallout && (
                <div className="flex flex-col gap-3 pt-1">
                  {/* Forme de la vignette (arrondis / cercle) */}
                  <div>
                    <span className="text-[10px] font-semibold text-[#666666] uppercase tracking-wider block mb-1.5">
                      Forme de la vignette
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onUpdateCallout({ shape: 'rounded', borderRadius: calloutVignette.borderRadius || 16 })}
                        className={`py-1.5 px-3 rounded-full text-xs font-medium border transition-all ${
                          calloutVignette.shape !== 'circle'
                            ? 'bg-[#000000] text-white border-[#000000]'
                            : 'bg-white text-[#666666] border-[#eeeeee] hover:bg-[#eeeeee]/50'
                        }`}
                      >
                        Rectangle arrondi
                      </button>
                      <button
                        onClick={() => onUpdateCallout({ shape: 'circle' })}
                        className={`py-1.5 px-3 rounded-full text-xs font-medium border transition-all ${
                          calloutVignette.shape === 'circle'
                            ? 'bg-[#000000] text-white border-[#000000]'
                            : 'bg-white text-[#666666] border-[#eeeeee] hover:bg-[#eeeeee]/50'
                        }`}
                      >
                        Cercle parfait
                      </button>
                    </div>
                  </div>

                  {/* Rayon des arrondis (si rectangle arrondi) */}
                  {calloutVignette.shape !== 'circle' && (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-[#666666] font-medium">Rayon des arrondis</span>
                        <div className="flex gap-1">
                          {[8, 12, 16, 20, 24].map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => onUpdateCallout({ borderRadius: r })}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition-all ${
                                (calloutVignette.borderRadius ?? 16) === r
                                  ? 'bg-[#0088cc] text-white'
                                  : 'bg-[#eeeeee] text-[#666666] hover:text-[#000000]'
                              }`}
                            >
                              {r}px
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20">
                          <NumericInput
                            value={calloutVignette.borderRadius ?? 16}
                            onChange={(r) => onUpdateCallout({ borderRadius: Math.max(0, Math.min(80, r)) })}
                            min={0}
                            max={80}
                            unit="px"
                          />
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="40"
                          value={calloutVignette.borderRadius ?? 16}
                          onChange={(e) => onUpdateCallout({ borderRadius: parseInt(e.target.value, 10) || 0 })}
                          onPointerUp={(e) => (e.target as HTMLElement).blur()}
                          className="accent-[#0088cc] flex-1 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  {/* Alignement au bas du screenshot (simplifié et placé après la forme) */}
                  <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#eeeeee]/40 border border-[#eeeeee]">
                    <div>
                      <span className="text-[10px] font-semibold text-[#000000] block">Alignement au bas du screenshot</span>
                      <span className="text-[9px] text-[#666666]">Calé sur l'ombre au bas du screenshot</span>
                    </div>
                    <button
                      onClick={() => {
                        const bounds = calculateCompositionBounds(image, focuses, globalStyles.workspaceWidth, calloutVignette);
                        const vigH = calloutVignette.height || calloutVignette.width || 100;
                        const shadowDist = (calloutVignette.showShadow !== false)
                          ? (calloutVignette.shadowDistance ?? calloutVignette.shadowOffsetY ?? 5)
                          : 0;
                        const targetY = bounds.bgY + bounds.bgHeight - vigH - shadowDist;
                        onUpdateCallout({
                          alignBottom: calloutVignette.alignBottom === false ? true : false,
                          offsetY: targetY,
                        });
                      }}
                      className={`px-3 py-1 rounded-full text-[10px] font-semibold transition-all ${
                        calloutVignette.alignBottom !== false
                          ? 'bg-[#0088cc] text-white shadow-2xs'
                          : 'bg-white text-[#666666] hover:text-[#000000] border border-[#eeeeee]'
                      }`}
                    >
                      {calloutVignette.alignBottom !== false ? '✓ Aligné au bas' : 'Manuel'}
                    </button>
                  </div>

                  {/* Taille de la vignette */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-[#666666]">Taille (L x H)</span>
                        <button
                          onClick={() => onUpdateCallout({ width: 100, height: 100 })}
                          className="text-[9px] text-[#0088cc] hover:underline font-medium"
                        >
                          100px
                        </button>
                      </div>
                      <NumericInput
                        value={calloutVignette.width || 100}
                        onChange={(w) => onUpdateCallout({ width: Math.max(30, w), height: Math.max(30, w) })}
                        min={30}
                        max={160}
                        unit="px"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-[#666666]">Écart au screen</span>
                        <button
                          onClick={() => onUpdateCallout({ gap: 5 })}
                          className="text-[9px] text-[#0088cc] hover:underline font-semibold"
                        >
                          5px fixe
                        </button>
                      </div>
                      <NumericInput
                        value={calloutVignette.gap ?? 5}
                        onChange={(g) => onUpdateCallout({ gap: Math.max(0, g) })}
                        min={0}
                        max={50}
                        unit="px"
                      />
                    </div>
                  </div>

                  {/* Zoom de la cible loupe (Saisie numérique directe + curseur de grossissement 1.0x à 5.0x) */}
                  <div className="p-2.5 rounded-2xl bg-[#eeeeee]/40 border border-[#eeeeee] flex flex-col gap-2">
                    {(() => {
                      const vigW = calloutVignette.width || 100;
                      const currentSrcW = calloutVignette.sourceWidth || 40;
                      const currentZoom = Math.round((vigW / currentSrcW) * 10) / 10;
                      const clampedZoom = Math.min(5, Math.max(1, currentZoom));

                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#ff007f] shadow-[0_0_6px_#ff007f] inline-block shrink-0" title="Cible loupe rose fluo sur la capture" />
                              <span className="text-[10px] font-semibold text-[#000000] dark:text-white">Cible loupe & zoom</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {/* Saisie directe du niveau de zoom */}
                              <div className="flex items-center bg-white border border-[#eeeeee] rounded-lg px-2 py-0.5 shadow-2xs">
                                <input
                                  type="number"
                                  min="1"
                                  max="5"
                                  step="0.1"
                                  value={clampedZoom}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (!isNaN(val) && val >= 0.5) {
                                      const safeVal = Math.min(5, Math.max(1, val));
                                      const newSrcW = Math.round((vigW / safeVal) * 10) / 10;
                                      onUpdateCallout({ sourceWidth: newSrcW, sourceHeight: newSrcW });
                                    }
                                  }}
                                  className="w-10 text-right text-[11px] font-mono font-bold text-[#0088cc] outline-none"
                                  title="Entrez la valeur exacte du grossissement (ex: 2.5)"
                                />
                                <span className="text-[10px] text-[#666666] font-bold ml-0.5">×</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between items-center text-[9px] text-[#666666] mb-1">
                              <span>Zone ciblée sur l'image</span>
                              <span className="font-mono text-[#0088cc] font-semibold">{currentSrcW} px</span>
                            </div>
                            <div className="relative flex items-center">
                              <input
                                type="range"
                                min="1"
                                max="5"
                                step="0.05"
                                value={clampedZoom}
                                onChange={(e) => {
                                  const newZoom = parseFloat(e.target.value);
                                  const newSrcW = Math.round((vigW / newZoom) * 10) / 10;
                                  onUpdateCallout({ sourceWidth: newSrcW, sourceHeight: newSrcW });
                                }}
                                onPointerUp={(e) => (e.target as HTMLElement).blur()}
                                className="accent-[#0088cc] w-full cursor-pointer"
                                title={`Zoom loupe : ${clampedZoom.toFixed(1)}×`}
                              />
                            </div>
                            <div className="flex justify-between text-[8px] text-[#979797] mt-0.5 font-mono">
                              <span>1.0× (large)</span>
                              <span>2.5×</span>
                              <span>3.5×</span>
                              <span>5.0× (serré)</span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Ombre portée derrière la vignette (Repliée par défaut, dépliable au clic) */}
                  <div className="rounded-2xl bg-[#eeeeee]/40 border border-[#eeeeee] overflow-hidden transition-all">
                    <button
                      type="button"
                      onClick={() => setIsShadowExpanded(!isShadowExpanded)}
                      className="w-full p-2.5 flex items-center justify-between text-left hover:bg-[#eeeeee]/70 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {isShadowExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-[#666666]" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-[#666666]" />
                        )}
                        <div>
                          <span className="text-[10px] font-semibold text-[#000000] block">Ombre portée</span>
                          <span className="text-[9px] text-[#666666]">
                            {calloutVignette.showShadow !== false ? 'Active (50%, 5px, 2px)' : 'Désactivée'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            const currentVal = calloutVignette.showShadow ?? true;
                            onUpdateCallout({ showShadow: !currentVal });
                          }}
                          className={`w-7 h-4 rounded-full relative transition-colors p-0.5 ${
                            (calloutVignette.showShadow ?? true) ? 'bg-[#0088cc]' : 'bg-[#cccccc]'
                          }`}
                          title={(calloutVignette.showShadow ?? true) ? 'Désactiver l\'ombre' : 'Activer l\'ombre'}
                        >
                          <div
                            className={`w-3 h-3 rounded-full bg-white transition-transform ${
                              (calloutVignette.showShadow ?? true) ? 'translate-x-3' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </button>

                    {isShadowExpanded && (calloutVignette.showShadow ?? true) && (
                      <div className="p-2.5 pt-1 border-t border-[#eeeeee] flex flex-col gap-2 bg-white/40">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => onUpdateCallout({
                              shadowOpacity: 0.50,
                              shadowDistance: 5,
                              shadowOffsetY: 5,
                              shadowSize: 2,
                              shadowBlur: 2,
                              showShadow: true,
                            })}
                            className="text-[9px] px-2 py-0.5 rounded-full bg-white border border-[#eeeeee] text-[#666666] hover:text-[#000000]"
                            title="Réinitialiser (50% / 5px / 2px)"
                          >
                            Défaut
                          </button>
                        </div>
                        <div>
                          <div className="flex justify-between items-center text-[9px] text-[#666666] mb-0.5">
                            <span>Opacité de l'ombre</span>
                            <span className="font-mono text-[#0088cc]">{Math.round((calloutVignette.shadowOpacity ?? 0.50) * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0.05"
                            max="1.0"
                            step="0.05"
                            value={calloutVignette.shadowOpacity ?? 0.50}
                            onChange={(e) => onUpdateCallout({ shadowOpacity: parseFloat(e.target.value) })}
                            className="accent-[#0088cc] w-full cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between items-center text-[9px] text-[#666666] mb-0.5">
                            <span>Distance de l'ombre</span>
                            <span className="font-mono text-[#0088cc]">{calloutVignette.shadowDistance ?? calloutVignette.shadowOffsetY ?? 5}px</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="25"
                            value={calloutVignette.shadowDistance ?? calloutVignette.shadowOffsetY ?? 5}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              onUpdateCallout({ shadowDistance: val, shadowOffsetY: val });
                            }}
                            className="accent-[#0088cc] w-full cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between items-center text-[9px] text-[#666666] mb-0.5">
                            <span>Taille de l'ombre</span>
                            <span className="font-mono text-[#0088cc]">{calloutVignette.shadowSize ?? calloutVignette.shadowBlur ?? 2}px</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="20"
                            value={calloutVignette.shadowSize ?? calloutVignette.shadowBlur ?? 2}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              onUpdateCallout({ shadowSize: val, shadowBlur: val });
                            }}
                            className="accent-[#0088cc] w-full cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 8. OPTIONS D'EXPORTATION (PNG AVEC TRANSPARENCE) */}
        <div className="flex flex-col">
          <button
            onClick={() => toggleSection('export')}
            className={`w-full px-4 py-3.5 flex items-center justify-between font-semibold transition-colors text-left ${
              isDarkMode ? 'text-white hover:bg-white/5' : 'text-[#000000] hover:bg-[#eeeeee]/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-[11px] tracking-wide uppercase">8. Options d'Exportation</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                isDarkMode ? 'bg-[#333333] text-[#aaaaaa]' : 'bg-[#eeeeee] text-[#666666]'
              }`}>
                {globalStyles.exportScale}×
              </span>
            </div>
            {openSections.export ? <ChevronDown className="w-4 h-4 text-[#979797]" /> : <ChevronRight className="w-4 h-4 text-[#979797]" />}
          </button>

          {openSections.export && (
            <div className="px-4 pb-4 pt-1 flex flex-col gap-2.5">
              {/* Choix de résolution d'export */}
              <div className="flex items-center justify-between text-[11px] pb-1 border-b border-[#eeeeee] dark:border-[#333333]">
                <span className={`font-medium ${isDarkMode ? 'text-[#aaaaaa]' : 'text-[#666666]'}`}>Résolution d'exportation :</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3].map((scale) => (
                    <button
                      key={scale}
                      onClick={() => onUpdateGlobalStyles({ exportScale: scale as 1 | 2 | 3 })}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all cursor-pointer ${
                        globalStyles.exportScale === scale
                          ? isDarkMode ? 'bg-white text-black font-bold shadow-2xs' : 'bg-[#000000] text-white shadow-2xs'
                          : isDarkMode ? 'bg-[#333333] text-[#aaaaaa] hover:bg-[#404040] hover:text-white' : 'bg-[#eeeeee]/80 text-[#666666] hover:bg-[#eeeeee] hover:text-[#000000]'
                      }`}
                    >
                      {scale === 1 ? '1x' : scale === 2 ? '2x (HD)' : '3x (4K)'}
                    </button>
                  ))}
                </div>
              </div>

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
                      : 'bg-[#eeeeee]/80 hover:bg-[#eeeeee] text-[#000000] dark:bg-[#333333] dark:hover:bg-[#3e3e3e] dark:text-white'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  <span>{isPreviewMode ? 'Fermer l\'aperçu' : 'Prévisualisation & Zoom (Aperçu net)'}</span>
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
