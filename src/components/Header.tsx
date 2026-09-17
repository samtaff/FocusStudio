import React, { useRef } from 'react';
import { 
  Download, 
  Upload, 
  Undo2, 
  Redo2, 
  Copy, 
  HelpCircle, 
  Check,
  Smartphone,
  Layers,
  Sparkles
} from 'lucide-react';
import { SAMPLE_PRESETS } from '../utils/sampleImages';

interface HeaderProps {
  onImportFile: (file: File) => void;
  onSelectSample: (presetId: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onExportPng: () => void;
  onCopyClipboard: () => void;
  isExporting: boolean;
  copied: boolean;
  onOpenShortcuts: () => void;
  hasImage: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onImportFile,
  onSelectSample,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onExportPng,
  onCopyClipboard,
  isExporting,
  copied,
  onOpenShortcuts,
  hasImage,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportFile(file);
      e.target.value = '';
    }
  };

  return (
    <header className="h-14 border-b border-[#eeeeee] bg-white/70 backdrop-blur-xl px-4 md:px-6 flex items-center justify-between select-none z-30 shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#000000] flex items-center justify-center shadow-xs">
            <span className="text-white font-bold text-xs tracking-tighter">F</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#000000] tracking-tight text-sm font-sans">
              Focus Studio
            </span>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#eeeeee] text-[#666666]">
              PRO
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-[#eeeeee] mx-2 hidden md:block" />

        {/* Preset Selector Dropdown */}
        <div className="hidden sm:flex items-center gap-1.5">
          <div className="relative group">
            <button
              id="header-sample-button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-[#666666] hover:text-[#000000] bg-[#eeeeee]/80 hover:bg-[#eeeeee] transition-all"
              title="Charger un exemple de capture d'écran"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#666666]" />
              <span>Modèles d'écran</span>
            </button>

            <div className="absolute top-full left-0 mt-2 w-64 bg-white/95 backdrop-blur-xl border border-[#eeeeee] rounded-2xl shadow-xl py-2 hidden group-hover:block z-50 ring-1 ring-[#979797]/15">
              <div className="px-3.5 py-1 text-[10px] font-bold text-[#979797] uppercase tracking-wider">
                Exemples prêts à l'emploi
              </div>
              {SAMPLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => onSelectSample(preset.id)}
                  className="w-full px-3.5 py-2 text-left hover:bg-[#eeeeee]/60 flex flex-col transition-colors"
                >
                  <span className="text-xs font-semibold text-[#000000]">
                    {preset.name}
                  </span>
                  <span className="text-[10px] text-[#666666] truncate">
                    {preset.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Center Controls: Undo / Redo */}
      <div className="flex items-center gap-1 bg-[#eeeeee]/80 p-0.5 rounded-full border border-[#eeeeee]">
        <button
          id="btn-undo"
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-1.5 rounded-full transition-all ${
            canUndo 
              ? 'text-[#000000] hover:bg-white shadow-2xs' 
              : 'text-[#979797] cursor-not-allowed opacity-50'
          }`}
          title="Annuler (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>

        <button
          id="btn-redo"
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-1.5 rounded-full transition-all ${
            canRedo 
              ? 'text-[#000000] hover:bg-white shadow-2xs' 
              : 'text-[#979797] cursor-not-allowed opacity-50'
          }`}
          title="Rétablir (Ctrl+Y ou Ctrl+Shift+Z)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right Controls: Import, Copy, Export */}
      <div className="flex items-center gap-2">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept="image/*,.heic,.heif"
          className="hidden"
        />

        {/* Import Image */}
        <button
          id="header-import-button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#eeeeee]/80 hover:bg-[#eeeeee] text-[#000000] text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
          title="Importer votre capture d'écran"
        >
          <Upload className="w-3.5 h-3.5 text-[#0088cc]" />
          <span className="hidden sm:inline">Importer</span>
        </button>

        {/* Copy to Clipboard */}
        <button
          id="header-copy-button"
          onClick={onCopyClipboard}
          disabled={!hasImage}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#eeeeee]/80 hover:bg-[#eeeeee] text-[#000000] text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
          title="Copier le visuel dans le presse-papier"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#0088cc]" />
              <span className="text-[#0088cc] font-semibold hidden md:inline">Copié !</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-[#666666]" />
              <span className="hidden md:inline">Copier</span>
            </>
          )}
        </button>

        {/* Primary Export Button */}
        <button
          id="header-export-button"
          onClick={onExportPng}
          disabled={!hasImage || isExporting}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#0088cc] hover:bg-[#0077b3] text-white text-xs font-semibold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
          title="Télécharger le fichier PNG transparent"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isExporting ? 'Exportation...' : 'Télécharger PNG'}</span>
        </button>

        {/* Shortcuts / Help */}
        <button
          id="header-shortcuts-button"
          onClick={onOpenShortcuts}
          className="p-1.5 text-[#666666] hover:text-[#000000] rounded-full hover:bg-[#eeeeee] transition-colors"
          title="Raccourcis clavier (?)"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
