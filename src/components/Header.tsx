import React, { useRef } from 'react';
import { 
  Download, 
  Upload, 
  Copy, 
  HelpCircle, 
  Check,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface HeaderProps {
  onImportFile: (file: File) => void;
  onExportPng: () => void;
  onCopyClipboard: () => void;
  isExporting: boolean;
  copied: boolean;
  onOpenShortcuts: () => void;
  hasImage: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onImportFile,
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
          <img src="/logo_focus_studio.png" alt="Logo" className="w-7 h-7 rounded-full object-cover" />          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#000000] tracking-tight text-sm font-sans">
              FOCUS STUDIO
            </span>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#eeeeee] text-[#666666]">
              PRO
            </span>
          </div>
        </div>

        {/* Bouton de switch vers FocusFrame (même onglet) */}
        <a
          id="btn-switch-focusframe"
          href="https://focusframe-eight.vercel.app/"
          target="_self"
          onClick={(e) => {
            // Naviguer sur le même onglet, y compris si l'application est dans une iframe
            e.preventDefault();
            try {
              window.top ? (window.top.location.href = 'https://focusframe-eight.vercel.app/') : (window.location.href = 'https://focusframe-eight.vercel.app/');
            } catch {
              window.location.href = 'https://focusframe-eight.vercel.app/';
            }
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#eeeeee]/80 hover:bg-[#000000] text-[#666666] hover:text-white transition-all shadow-2xs group cursor-pointer"
          title="Basculer vers FocusFrame (même onglet)"
        >
          <span className="tracking-tight">FocusFrame</span>
          <ArrowRight className="w-3 h-3 text-[#979797] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </a>

        {/* Center / Brand divider */}
        <div className="h-4 w-px bg-[#eeeeee] mx-1 hidden md:block" />
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
