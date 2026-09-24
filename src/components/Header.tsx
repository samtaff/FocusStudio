import React, { useRef } from 'react';
import { 
  Copy, 
  HelpCircle, 
  Check,
  ArrowRight,
  Sun,
  Moon
} from 'lucide-react';

interface HeaderProps {
  onImportFile?: (file: File) => void;
  onExportPng?: () => void;
  onCopyClipboard: () => void;
  isExporting?: boolean;
  copied: boolean;
  onOpenShortcuts: () => void;
  hasImage: boolean;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onImportFile,
  onExportPng,
  onCopyClipboard,
  isExporting,
  copied,
  onOpenShortcuts,
  hasImage,
  isDarkMode = false,
  onToggleDarkMode,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportFile?.(file);
      e.target.value = '';
    }
  };

  return (
    <header className={`h-14 border-b transition-colors duration-200 px-4 md:px-6 flex items-center justify-between select-none z-30 shrink-0 ${
      isDarkMode
        ? 'border-[#2d2d2d] bg-[#212121]/95 backdrop-blur-xl text-white shadow-[0_1px_4px_rgba(0,0,0,0.4)]'
        : 'border-[#eeeeee] bg-white/70 backdrop-blur-xl text-[#000000] shadow-[0_1px_3px_rgba(0,0,0,0.03)]'
    }`}>
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <img src="/logo_focus_studio.png" alt="Logo" className="w-7 h-7 rounded-full object-cover shadow-2xs" />
          <div className="flex items-center gap-2">
            <span className={`font-semibold tracking-tight text-sm font-sans ${isDarkMode ? 'text-white' : 'text-[#000000]'}`}>
              FOCUS STUDIO
            </span>
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
              isDarkMode ? 'bg-[#2f2f2f] text-[#aaaaaa]' : 'bg-[#eeeeee] text-[#666666]'
            }`}>
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
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all shadow-2xs group cursor-pointer ${
            isDarkMode 
              ? 'bg-[#2b2b2b] hover:bg-[#161616] text-[#b0b0b0] hover:text-white border border-[#383838]' 
              : 'bg-[#eeeeee]/80 hover:bg-[#000000] text-[#666666] hover:text-white'
          }`}
          title="Basculer vers FocusFrame (même onglet)"
        >
          <span className="tracking-tight">FocusFrame</span>
          <ArrowRight className="w-3 h-3 text-[#979797] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </a>

        {/* Center / Brand divider */}
        <div className={`h-4 w-px mx-1 hidden md:block ${isDarkMode ? 'bg-[#333333]' : 'bg-[#eeeeee]'}`} />
      </div>

      {/* Right Controls: Dark Mode Toggle, Copy, Shortcuts */}
      <div className="flex items-center gap-2">
        {/* Hidden File Input */}
        <input
          id="header-file-input"
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept="image/*,.heic,.heif"
          className="hidden"
        />

        {/* Dark Mode Toggle Switch (#212121) - Sans texte */}
        {onToggleDarkMode && (
          <button
            id="header-dark-mode-toggle"
            type="button"
            onClick={onToggleDarkMode}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-all cursor-pointer ${
              isDarkMode 
                ? 'bg-[#2e2e2e] hover:bg-[#383838] border border-[#404040] shadow-2xs' 
                : 'bg-[#eeeeee]/90 hover:bg-[#e4e4e4] border border-transparent'
            }`}
            title={isDarkMode ? "Désactiver le Dark Mode (revenir au mode clair)" : "Activer le Dark Mode (#212121)"}
            aria-label={isDarkMode ? "Mode clair" : "Mode sombre"}
          >
            {/* Sliding Switch Pill */}
            <div className={`w-7 h-4 rounded-full p-0.5 transition-colors relative flex items-center ${
              isDarkMode ? 'bg-[#0088cc]' : 'bg-[#cccccc]'
            }`}>
              <div className={`w-3 h-3 rounded-full bg-white shadow-xs transition-transform transform ${
                isDarkMode ? 'translate-x-3' : 'translate-x-0'
              }`} />
            </div>

            {isDarkMode ? (
              <Moon className="w-3.5 h-3.5 text-sky-400 fill-sky-400/20" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
            )}
          </button>
        )}

        {/* Copy to Clipboard */}
        <button
          id="header-copy-button"
          onClick={onCopyClipboard}
          disabled={!hasImage}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 cursor-pointer ${
            isDarkMode
              ? 'bg-[#2d2d2d] hover:bg-[#383838] text-white border border-[#3e3e3e]'
              : 'bg-[#eeeeee]/80 hover:bg-[#eeeeee] text-[#000000]'
          }`}
          title="Copier le visuel dans le presse-papier"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#0088cc]" />
              <span className="text-[#0088cc] font-semibold hidden md:inline">Copié !</span>
            </>
          ) : (
            <>
              <Copy className={`w-3.5 h-3.5 ${isDarkMode ? 'text-[#aaaaaa]' : 'text-[#666666]'}`} />
              <span className="hidden md:inline">Copier</span>
            </>
          )}
        </button>

        {/* Shortcuts / Help */}
        <button
          id="header-shortcuts-button"
          onClick={onOpenShortcuts}
          className={`p-1.5 rounded-full transition-colors cursor-pointer ${
            isDarkMode
              ? 'text-[#aaaaaa] hover:text-white hover:bg-[#2d2d2d]'
              : 'text-[#666666] hover:text-[#000000] hover:bg-[#eeeeee]'
          }`}
          title="Raccourcis clavier (?)"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
