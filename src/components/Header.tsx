import React, { useRef } from 'react';
import { 
  Copy, 
  HelpCircle, 
  Check,
  ArrowRight,
  Sun,
  Moon
} from 'lucide-react';

import { AppTheme } from '../types';

interface HeaderProps {
  onImportFile?: (file: File) => void;
  onExportPng?: () => void;
  onCopyClipboard: () => void;
  isExporting?: boolean;
  copied: boolean;
  onOpenShortcuts: () => void;
  hasImage: boolean;
  theme?: AppTheme;
  onSelectTheme?: (theme: AppTheme) => void;
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
  theme,
  onSelectTheme,
  isDarkMode = false,
  onToggleDarkMode,
}) => {
  const activeTheme: AppTheme = theme || (isDarkMode ? 'dark' : 'light');
  const isGta6 = activeTheme === 'gta6';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportFile?.(file);
      e.target.value = '';
    }
  };

  return (
    <header className={`gta6-header relative h-14 border-b transition-colors duration-200 px-3 sm:px-4 md:px-6 flex items-center justify-between select-none z-30 shrink-0 ${
      isGta6
        ? 'border-[#ff3e9d]/50 bg-[#361856]/80 backdrop-blur-xl text-white'
        : isDarkMode
          ? 'border-[#2d2d2d] bg-[#212121]/95 backdrop-blur-xl text-white shadow-[0_1px_4px_rgba(0,0,0,0.4)]'
          : 'border-[#eeeeee] bg-white/70 backdrop-blur-xl text-[#000000] shadow-[0_1px_3px_rgba(0,0,0,0.03)]'
    }`}>
      {/* Subtle neon gradient hairline along bottom edge in GTA 6 theme */}
      {isGta6 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[1.5px] opacity-85"
          style={{
            background: 'linear-gradient(90deg, rgba(44,229,229,0.2) 0%, rgba(44,229,229,0.85) 28%, rgba(255,62,157,0.95) 60%, rgba(255,140,66,0.8) 85%, rgba(255,62,157,0.2) 100%)',
          }}
        />
      )}
      {/* Brand & Logo */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <img src="/logo_focus_studio.png" alt="Logo" className={`w-7 h-7 rounded-full object-cover shadow-2xs ${isGta6 ? 'ring-1 ring-[#ff3e9d]/60' : ''}`} />
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className={`font-semibold tracking-tight text-xs sm:text-sm font-sans truncate ${isDarkMode ? 'text-white' : 'text-[#000000]'}`}>
              FOCUS STUDIO
            </span>
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
              isGta6
                ? 'bg-gradient-to-r from-[#ff3e9d]/30 to-[#ff8c42]/30 text-[#ffb8dc] border border-[#ff3e9d]/45'
                : isDarkMode
                  ? 'bg-[#2f2f2f] text-[#aaaaaa]'
                  : 'bg-[#eeeeee] text-[#666666]'
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

        {/* Theme Selector (Clair / Sombre / GTA 6 Néon) */}
        {(onSelectTheme || onToggleDarkMode) && (
          <div
            className={`flex items-center gap-0.5 p-0.5 rounded-full border transition-all ${
              isGta6
                ? 'bg-[#1d0e36]/90 border-[#2ce5e5]/35 shadow-[0_0_12px_rgba(255,62,157,0.2)]'
                : isDarkMode
                  ? 'bg-[#2a2a2a] border-[#3d3d3d]'
                  : 'bg-[#eeeeee]/90 border-transparent'
            }`}
            role="group"
            aria-label="Sélecteur de thème"
          >
            <button
              id="header-theme-light"
              type="button"
              onClick={() => (onSelectTheme ? onSelectTheme('light') : onToggleDarkMode?.())}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                activeTheme === 'light'
                  ? 'bg-white text-amber-500 shadow-2xs'
                  : isDarkMode
                    ? 'text-[#aaaaaa] hover:text-white hover:bg-white/10'
                    : 'text-[#666666] hover:text-black'
              }`}
              title="Thème Clair"
              aria-label="Thème Clair"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>

            <button
              id="header-theme-dark"
              type="button"
              onClick={() => (onSelectTheme ? onSelectTheme('dark') : onToggleDarkMode?.())}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                activeTheme === 'dark'
                  ? 'bg-[#0088cc] text-white shadow-2xs'
                  : isDarkMode
                    ? 'text-[#aaaaaa] hover:text-white hover:bg-white/10'
                    : 'text-[#666666] hover:text-black hover:bg-white/60'
              }`}
              title="Thème Sombre"
              aria-label="Thème Sombre"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>

            <button
              id="header-theme-gta6"
              type="button"
              onClick={() => (onSelectTheme ? onSelectTheme('gta6') : onToggleDarkMode?.())}
              className={`px-2 py-1 rounded-full text-[10px] font-black tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                activeTheme === 'gta6'
                  ? 'bg-gradient-to-r from-[#ff3e9d] via-[#ff6b6b] to-[#ff8c42] text-white shadow-[0_0_10px_rgba(255,62,157,0.55)]'
                  : isDarkMode
                    ? 'text-[#f472b6] hover:text-white hover:bg-white/10'
                    : 'text-[#c026d3] hover:bg-white/70'
              }`}
              title="Thème GTA 6 (Vice City Néon)"
              aria-label="Thème GTA 6"
            >
              <span>VI</span>
            </button>
          </div>
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
