/**
 * High-fidelity sample smartphone and interface screenshots generated
 * purely in-memory via HTML Canvas for instant zero-dependency testing.
 */

export interface SamplePreset {
  id: string;
  name: string;
  category: string;
  description: string;
  generate: () => Promise<string>;
}

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'biometrics-lockscreen',
    name: 'Verrouillage écran et biométrie (Samsung)',
    category: 'Smartphone',
    description: 'Interface de paramètres de sécurité mobile avec menu Empreintes.',
    generate: async () => {
      const canvas = document.createElement('canvas');
      const w = 380;
      const h = 840;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Background
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(0, 0, w, h);

      // Status Bar
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillText('08:58', 20, 26);
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillText('📶 🔋95', w - 65, 26);

      // Top Title Bar
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
      ctx.fillText('‹   Verrouillage écran et biomé...', 16, 70);

      // White group card 1: Type de verrouillage
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(16, 95, w - 32, 380, 16);
      ctx.fill();

      const drawItem = (
        y: number,
        title: string,
        sub: string,
        checked = false
      ) => {
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 14px system-ui, sans-serif';
        ctx.fillText(title, 32, y);

        if (sub) {
          ctx.fillStyle = checked ? '#059669' : '#64748b';
          ctx.font = '12px system-ui, sans-serif';
          ctx.fillText(sub, 32, y + 18);
        }

        if (checked) {
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.arc(w - 44, y + 6, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText('✓', w - 44, y + 10);
          ctx.textAlign = 'left';
        }
      };

      drawItem(130, 'Code PIN', 'Sécurité moyenne à élevée');
      drawItem(195, 'Mot de passe', 'Sécurité élevée');
      drawItem(260, 'Modèle', 'Sécurité moyenne, Type de verrouillage actuel', true);
      drawItem(325, 'Glissement', 'Pas de sécurité');
      drawItem(390, 'Aucun', '');

      // Subheading: Données biométriques
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillText('Données biométriques', 24, 510);

      // White group card 2: Biométrie
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(16, 525, w - 32, 160, 16);
      ctx.fill();

      // Facial recognition
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.fillText('Reconnaissance faciale', 32, 560);
      ctx.fillStyle = '#0284c7';
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText('Enregistrez votre visage.', 32, 578);

      // Divider
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(32, 605);
      ctx.lineTo(w - 32, 605);
      ctx.stroke();

      // Empreintes (Target for focus!)
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.fillText('Empreintes', 32, 638);
      ctx.fillStyle = '#0284c7';
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText('Ajoutez vos empreintes.', 32, 658);

      // Bottom nav bar (Samsung 3 buttons)
      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('|||         ○         ‹', w / 2, h - 25);
      ctx.textAlign = 'left';

      return canvas.toDataURL('image/png');
    },
  },
  {
    id: 'mobile-settings',
    name: 'Paramètres Smartphone (Bluetooth & Réseau)',
    category: 'Smartphone',
    description: 'Interface de paramètres mobile avec bouton Bluetooth, Wi-Fi et bascules.',
    generate: async () => {
      const canvas = document.createElement('canvas');
      const w = 400;
      const h = 880;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, w, h);

      // Mobile Status Bar
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.fillText('09:41', 24, 28);

      // Battery & signal icons
      ctx.fillStyle = '#334155';
      ctx.fillRect(w - 65, 17, 20, 11);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(w - 67, 15, 24, 15);
      ctx.fillRect(w - 42, 19, 2, 7);
      // Wi-Fi arcs
      ctx.beginPath();
      ctx.arc(w - 85, 23, 7, Math.PI * 1.25, Math.PI * 1.75);
      ctx.stroke();

      // Top Navigation / Title
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
      ctx.fillText('Paramètres', 20, 78);

      // Search Bar
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.roundRect(20, 95, w - 40, 42, 10);
      ctx.fill();
      ctx.fillStyle = '#64748b';
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText('🔍 Rechercher dans les réglages...', 36, 121);

      // Section 1: Connexions
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillText('CONNEXIONS SANS FIL', 24, 168);

      const drawRow = (
        y: number,
        title: string,
        subtitle: string,
        iconBg: string,
        iconSymbol: string,
        hasToggle = false,
        toggleActive = false
      ) => {
        // Row background
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(20, y, w - 40, 58, 12);
        ctx.fill();
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Icon
        ctx.fillStyle = iconBg;
        ctx.beginPath();
        ctx.roundRect(32, y + 11, 36, 36, 8);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(iconSymbol, 50, y + 29);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';

        // Titles
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 14px system-ui, sans-serif';
        ctx.fillText(title, 80, y + 26);
        ctx.fillStyle = '#64748b';
        ctx.font = '12px system-ui, sans-serif';
        ctx.fillText(subtitle, 80, y + 44);

        if (hasToggle) {
          // Switch toggle
          const swX = w - 75;
          const swY = y + 16;
          ctx.fillStyle = toggleActive ? '#25465F' : '#cbd5e1';
          ctx.beginPath();
          ctx.roundRect(swX, swY, 44, 26, 13);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(toggleActive ? swX + 31 : swX + 13, swY + 13, 10, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Chevron
          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 14px system-ui, sans-serif';
          ctx.fillText('›', w - 44, y + 33);
        }
      };

      drawRow(180, 'Wi-Fi', 'Connecté : Livebox-742A', '#0284c7', '📶', true, true);
      drawRow(246, 'Bluetooth', 'Activé (3 appareils appairés)', '#25465F', 'ᛒ', true, true);
      drawRow(312, 'Données mobiles', '4G / 5G Illimité', '#10b981', '⚡', true, true);
      drawRow(378, 'Partage de connexion', 'Désactivé', '#f59e0b', '🔗', true, false);

      // Section 2: Sécurité & Système
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillText('SÉCURITÉ & ACCÈS', 24, 465);

      drawRow(478, 'Verrouillage de l\'écran', 'Face ID & Code PIN à 6 chiffres', '#6366f1', '🔒');
      drawRow(544, 'Confidentialité', 'Localisation autorisée pour 12 apps', '#8b5cf6', '🛡️');
      drawRow(610, 'Mises à jour logicielles', 'Version 18.3 disponible', '#ec4899', '⬇️');

      // Action Button at Bottom
      ctx.fillStyle = '#25465F';
      ctx.beginPath();
      ctx.roundRect(24, 700, w - 48, 52, 14);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Synchroniser les paramètres', w / 2, 732);
      ctx.textAlign = 'left';

      // Home Indicator
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.roundRect((w - 120) / 2, h - 14, 120, 5, 3);
      ctx.fill();

      return canvas.toDataURL('image/png');
    },
  },
  {
    id: 'mobile-banking',
    name: 'Validation Procédure Mobile (Code & Validation)',
    category: 'Smartphone',
    description: 'Écran de confirmation d\'opération avec bouton de validation et code de sécurité.',
    generate: async () => {
      const canvas = document.createElement('canvas');
      const w = 400;
      const h = 860;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      // Top Status Bar
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.fillText('14:20', 24, 28);

      // Header
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText('Authentification forte', 24, 75);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillText('Valider l\'opération', 24, 105);

      // Card container
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(20, 130, w - 40, 220, 16);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillText('Montant de la transaction', 40, 165);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 32px system-ui, sans-serif';
      ctx.fillText('450,00 €', 40, 205);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillText('Bénéficiaire : Atelier Mécanique Express', 40, 240);
      ctx.fillText('IBAN : FR76 3000 4012 3456 7890 1234 567', 40, 265);
      ctx.fillText('Date : 15 Septembre 2026 à 14:19', 40, 290);
      ctx.fillStyle = '#10b981';
      ctx.fillText('✓ Canal sécurisé certifié DSP2', 40, 320);

      // Security pin boxes
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.fillText('Entrez votre code secret à 6 chiffres :', 24, 385);

      const pinX = 24;
      const pinY = 405;
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(pinX + i * 58, pinY, 48, 54, 8);
        ctx.fill();
        ctx.strokeStyle = i === 3 ? '#38bdf8' : '#334155';
        ctx.lineWidth = 2;
        ctx.stroke();

        if (i < 3) {
          ctx.fillStyle = '#ffffff';
          ctx.font = '24px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('•', pinX + i * 58 + 24, pinY + 36);
          ctx.textAlign = 'left';
        }
      }

      // Primary Validate Button
      ctx.fillStyle = '#25465F';
      ctx.beginPath();
      ctx.roundRect(24, 500, w - 48, 54, 12);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Confirmer avec Pass Sécurité', w / 2, 534);
      ctx.textAlign = 'left';

      // Secondary Button
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(24, 570, w - 48, 48, 12);
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Annuler l\'opération', w / 2, 600);
      ctx.textAlign = 'left';

      // Technical footer info
      ctx.fillStyle = '#475569';
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Réf. Technique : PROC-SEC-89241', w / 2, 660);
      ctx.textAlign = 'left';

      return canvas.toDataURL('image/png');
    },
  },
  {
    id: 'web-dashboard',
    name: 'Interface Logicielle / Navigateur',
    category: 'Desktop / Web',
    description: 'Barre d\'action et tableau de bord avec options de configuration système.',
    generate: async () => {
      const canvas = document.createElement('canvas');
      const w = 640;
      const h = 720;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);

      // Window titlebar
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(0, 0, w, 40);
      // Window buttons
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(20, 20, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.arc(38, 20, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#10b981';
      ctx.beginPath(); ctx.arc(56, 20, 6, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = '#475569';
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText('Console d\'Administration — Paramètres Réseau', 80, 24);

      // Sidebar & Main layout
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 40, 180, h - 40);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.strokeRect(180, 40, 1, h - 40);

      const navItems = ['Vue d\'ensemble', 'Périphériques', 'Réseau & IP', 'Sécurité SSL', 'Journaux d\'événements'];
      navItems.forEach((item, index) => {
        const y = 60 + index * 42;
        if (index === 2) {
          ctx.fillStyle = '#25465F';
          ctx.beginPath();
          ctx.roundRect(12, y, 156, 36, 6);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 13px system-ui, sans-serif';
        } else {
          ctx.fillStyle = '#64748b';
          ctx.font = '13px system-ui, sans-serif';
        }
        ctx.fillText(item, 24, y + 23);
      });

      // Main content
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.fillText('Configuration Passerelle & DNS', 205, 80);

      // Row 1: IP Gateway
      ctx.fillStyle = '#64748b';
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText('Adresse IP de la passerelle principale', 205, 115);

      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(205, 125, 300, 38, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = '14px monospace';
      ctx.fillText('192.168.1.254', 218, 149);

      // Row 2: DHCP Mode
      ctx.fillStyle = '#64748b';
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText('Mode d\'attribution dynamique (DHCP v4/v6)', 205, 190);

      // Action Button
      ctx.fillStyle = '#25465F';
      ctx.beginPath();
      ctx.roundRect(205, 205, 180, 40, 6);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.fillText('Enregistrer l\'adresse IP', 222, 230);

      // Status Box
      ctx.fillStyle = '#f0fdf4';
      ctx.strokeStyle = '#86efac';
      ctx.beginPath();
      ctx.roundRect(205, 270, 400, 56, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#166534';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.fillText('Statut de la connexion : Actif & Opérationnel', 220, 294);
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText('Latence mesurée : 4 ms — Paquets perdus : 0 %', 220, 314);

      return canvas.toDataURL('image/png');
    },
  },
];
