import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '+ ou A', desc: 'Ajouter un nouveau focus (240 × 50 px)' },
    { key: 'V', desc: 'Basculer orientation Verticale (50 × 240 px) / Horizontale' },
    { key: 'Suppr / Retour arrière', desc: 'Supprimer le focus sélectionné' },
    { key: 'Ctrl + D / ⌘D', desc: 'Dupliquer le focus sélectionné' },
    { key: 'Flèches directionnelles', desc: 'Déplacer le focus de 1 px' },
    { key: 'Shift + Flèches', desc: 'Déplacer le focus de 10 px' },
    { key: 'Alt + Glisser / Double-clic', desc: 'Décaler le screenshot dans le focus (recadrage)' },
    { key: 'Alt + Flèches', desc: 'Ajuster le décalage interne (1 px, 10 px avec Shift)' },
    { key: 'Ctrl + Z / ⌘Z', desc: 'Annuler la dernière action' },
    { key: 'Ctrl + Shift + Z / ⌘Y', desc: 'Rétablir la dernière action' },
    { key: 'Ctrl + V / ⌘V', desc: "Coller une capture d'écran directement" },
    { key: 'Espace + Glisser', desc: 'Déplacer la vue (Pan)' },
    { key: 'Échap', desc: 'Désélectionner le focus en cours' },
    { key: "Double-clic sur l'image", desc: 'Créer un focus instantané à cet endroit' },
    { key: 'Ctrl + E / ⌘E', desc: 'Exporter le visuel en PNG transparent' },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white/90 dark:bg-[#212121]/95 backdrop-blur-2xl border border-white/60 dark:border-[#383838] rounded-3xl shadow-2xl max-w-md w-full p-6 text-[#000000] dark:text-white transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-[#eeeeee] dark:border-[#333333]">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-[#0088cc]" />
            <h3 className="font-semibold text-sm tracking-tight text-[#000000] dark:text-white">Raccourcis clavier</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#666666] dark:text-[#aaaaaa] hover:text-[#000000] dark:hover:text-white hover:bg-[#eeeeee] dark:hover:bg-[#333333] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-[#eeeeee]/60 dark:border-[#333333] last:border-0">
              <span className="text-[#666666] dark:text-[#bbbbbb]">{s.desc}</span>
              <kbd className="px-2.5 py-0.5 rounded-full bg-[#eeeeee] dark:bg-[#333333] border border-white dark:border-[#444444] text-[11px] font-mono font-medium text-[#000000] dark:text-white shadow-2xs whitespace-nowrap">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-3 border-t border-[#eeeeee] dark:border-[#333333] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#000000] dark:bg-white hover:bg-[#222222] dark:hover:bg-[#e0e0e0] text-white dark:text-black text-xs font-semibold shadow-2xs transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
