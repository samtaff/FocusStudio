import React from 'react';
import { 
  Plus, 
  ScanSearch, 
  Trash2, 
  Copy, 
  HelpCircle, 
  ZoomIn,
  Check
} from 'lucide-react';
import { FocusZone } from '../types';

interface FloatingToolbarProps {
  onAddFocus: () => void;
  selectedFocus: FocusZone | null;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  isDetecting: boolean;
  showDetection: boolean;
  onToggleDetection: () => void;
  showGuides: boolean;
  onToggleGuides: () => void;
  onOpenShortcuts: () => void;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  onAddFocus,
  selectedFocus,
  onDuplicate,
  onDelete,
  isDetecting,
  showDetection,
  onToggleDetection,
  showGuides,
  onToggleGuides,
  onOpenShortcuts,
}) => {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#0b1120]/90 backdrop-blur border border-slate-800/90 rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-xl shadow-black/40 z-20 text-xs select-none">
      {/* Add Focus button */}
      <button
        id="floating-add-focus-btn"
        onClick={onAddFocus}
        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#25465F] hover:bg-[#2d5372] text-white font-medium shadow-sm transition-all border border-sky-400/30 active:scale-95"
        title="Ajouter un focus 240 × 50 px (Touche + ou A)"
      >
        <Plus className="w-3.5 h-3.5 text-sky-300" />
        <span>+ Focus (240×50)</span>
      </button>

      {/* Repères / Smart Guides Toggle */}
      <button
        onClick={onToggleGuides}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all ${
          showGuides
            ? 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/50 shadow-sm'
            : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 border-slate-700/80'
        }`}
        title="Afficher/masquer les repères d'alignement discrets (style Illustrator/Photoshop)"
      >
        <span className="font-mono text-xs font-bold">⊞</span>
        <span className="hidden sm:inline">Repères</span>
      </button>

      {/* Detection Toggle button */}
      <button
        id="floating-detect-btn"
        onClick={onToggleDetection}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all ${
          showDetection
            ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 shadow-sm'
            : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/80'
        }`}
        title="Activer/désactiver l'assistance de détection d'interface"
      >
        <ScanSearch className="w-3.5 h-3.5 text-sky-400" />
        <span className="hidden sm:inline">
          {isDetecting ? 'Analyse...' : showDetection ? 'Détection active' : 'Détection'}
        </span>
      </button>

      <div className="w-px h-4 bg-slate-800 mx-0.5" />

      {/* Focus contextual actions (Duplicate, Delete) */}
      <button
        id="floating-duplicate-btn"
        onClick={() => selectedFocus && onDuplicate(selectedFocus.id)}
        disabled={!selectedFocus}
        className={`p-1.5 rounded-full border transition-colors ${
          selectedFocus
            ? 'text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border-slate-700'
            : 'text-slate-600 bg-slate-900/40 border-slate-800/30 cursor-not-allowed'
        }`}
        title="Dupliquer le focus (Ctrl+D)"
      >
        <Copy className="w-3.5 h-3.5" />
      </button>

      <button
        id="floating-delete-btn"
        onClick={() => selectedFocus && onDelete(selectedFocus.id)}
        disabled={!selectedFocus}
        className={`p-1.5 rounded-full border transition-colors ${
          selectedFocus
            ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border-rose-900/40'
            : 'text-slate-600 bg-slate-900/40 border-slate-800/30 cursor-not-allowed'
        }`}
        title="Supprimer le focus (Suppr / Retour arrière)"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      <div className="w-px h-4 bg-slate-800 mx-0.5" />

      {/* Shortcuts button */}
      <button
        id="floating-shortcuts-btn"
        onClick={onOpenShortcuts}
        className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors"
        title="Guide des raccourcis clavier (?)"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
