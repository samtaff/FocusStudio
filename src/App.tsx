import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  FocusZone, 
  LoadedImage, 
  DetectedElement, 
  GlobalStyleSettings,
  AnnotationArrow,
  UserGuide,
  BlurZone,
  MaskShape,
  TriangleShape
} from './types';
import { Header } from './components/Header';
import { CanvasWorkspace } from './components/CanvasWorkspace';
import { StudioSettingsPanel } from './components/StudioSettingsPanel';
import { ShortcutsModal } from './components/ShortcutsModal';
import { ToolType } from './components/VerticalToolPalette';
import { SAMPLE_PRESETS } from './utils/sampleImages';
import { detectInterfaceElements } from './utils/detection';
import { processImportedImageFile } from './utils/imageProcessor';
import { 
  drawComposition, 
  calculateCompositionBounds, 
  calculateExportBounds,
  BASE_COLOR 
} from './utils/canvasRenderer';

export default function App() {
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [focuses, setFocuses] = useState<FocusZone[]>([]);
  const [selectedFocusId, setSelectedFocusId] = useState<string | null>(null);

  // Blur Zones (Flou Gaussien sur n'importe quelle zone)
  const [blurZones, setBlurZones] = useState<BlurZone[]>([]);
  const [selectedBlurId, setSelectedBlurId] = useState<string | null>(null);

  // Mask Shapes (Formes bleues pour masquer des zones)
  const [maskShapes, setMaskShapes] = useState<MaskShape[]>([]);
  const [selectedMaskId, setSelectedMaskId] = useState<string | null>(null);

  // Triangle Shapes (Outil triangle 15x13px en #25465F ou blanc)
  const [triangles, setTriangles] = useState<TriangleShape[]>([]);
  const [selectedTriangleId, setSelectedTriangleId] = useState<string | null>(null);

  // Active Tool & Preview Mode
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);

  // Global styles (Container, tint, rules, handles, export scale)
  const [globalStyles, setGlobalStyles] = useState<GlobalStyleSettings>({
    bgTintColor: BASE_COLOR,
    bgTintOpacity: 0.50,
    exportScale: 1,
    workspaceWidth: 260,
    container: {
      borderRadius: 0, // Strictement droit, sans arrondis
      showShadow: false, // Pas d'ombre portée sur le screenshot
      shadowBlur: 0,
      borderWidth: 0,
      borderColor: 'transparent',
    },
    showRulers: true,
    showHandles: true,
    showGuides: true,
    previewHD: false,
  });

  // Panel width management (responsive)
  const [panelWidth, setPanelWidth] = useState<number>(340);

  // User manual guides (+ Repère H / V)
  const [userGuides, setUserGuides] = useState<UserGuide[]>([]);

  // Annotation Arrows
  const [arrows, setArrows] = useState<AnnotationArrow[]>([]);

  // Undo / Redo History
  const [history, setHistory] = useState<FocusZone[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isUndoRedoAction = useRef(false);

  // Detection
  const [detectedElements, setDetectedElements] = useState<DetectedElement[]>([]);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [showDetectedOverlay, setShowDetectedOverlay] = useState<boolean>(false);

  // UI state
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);

  // Push new state to history stack
  const recordHistory = useCallback((newFocuses: FocusZone[]) => {
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, newFocuses].slice(-30);
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 29));
  }, [historyIndex]);

  // Load an image from a Data URL
  const loadImageFromDataUrl = useCallback(async (dataUrl: string, name: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = dataUrl;
    });

    const origW = img.naturalWidth || img.width;
    const origH = img.naturalHeight || img.height;

    // Redimensionnement automatique : largeur max 180px, hauteur max 390px, homothétique
    const maxW = 180;
    const maxH = 390;
    const scaleFactor = Math.min(maxW / origW, maxH / origH);
    const displayW = Math.round(origW * scaleFactor);
    const displayH = Math.round(origH * scaleFactor);

    const loaded: LoadedImage = {
      name,
      element: img,
      dataUrl,
      originalWidth: origW,
      originalHeight: origH,
      displayWidth: displayW,
      displayHeight: displayH,
      scaleFactor,
    };

    setImage(loaded);

    // Initial default focus: 240 × 50 px, rounded corners 10px
    const bounds = calculateCompositionBounds(loaded, [], globalStyles.workspaceWidth);
    const defaultFocusW = 240;
    const defaultFocusH = 50;
    const phoneCenterX = bounds.bgX + bounds.bgWidth / 2;
    const defaultX = Math.round(phoneCenterX - defaultFocusW / 2);
    const defaultY = Math.round(bounds.bgY + bounds.bgHeight * 0.42);

    const initialFocus: FocusZone = {
      id: `focus-${Date.now()}`,
      name: 'Zone 1',
      x: defaultX,
      y: defaultY,
      width: defaultFocusW,
      height: defaultFocusH,
      zoom: 1.0,
      sourceOffsetX: 0,
      sourceOffsetY: 0,
      borderWidth: 2,
      borderColor: BASE_COLOR,
      borderRadius: 10,
      stepNumber: 1,
      showStepBadge: true,
      badgePosition: 'auto',
      badgeColor: BASE_COLOR,
    };

    setFocuses([initialFocus]);
    setSelectedFocusId(initialFocus.id);
    setHistory([[initialFocus]]);
    setHistoryIndex(0);

    // Trigger smart detection asynchronously
    detectInterfaceElements(img, scaleFactor)
      .then((elements) => setDetectedElements(elements))
      .catch((err) => console.error(err));
  }, [globalStyles.workspaceWidth]);

  // Load initial preset image on mount
  useEffect(() => {
    const preset = SAMPLE_PRESETS[0];
    if (preset) {
      preset.generate().then((dataUrl) => {
        loadImageFromDataUrl(dataUrl, preset.name);
      });
    }
  }, [loadImageFromDataUrl]);

  // Import local file with automatic HEIC/iPhone normalization
  const handleImportFile = async (file: File) => {
    try {
      const { dataUrl, name } = await processImportedImageFile(file);
      await loadImageFromDataUrl(dataUrl, name);
    } catch (err) {
      console.warn('Advanced image processing fallback:', err);
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          loadImageFromDataUrl(dataUrl, file.name);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Select sample preset
  const handleSelectSample = async (id: string) => {
    const preset = SAMPLE_PRESETS.find((p) => p.id === id);
    if (preset) {
      const dataUrl = await preset.generate();
      loadImageFromDataUrl(dataUrl, preset.name);
    }
  };

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      const newIndex = historyIndex - 1;
      const targetFocuses = history[newIndex];
      setHistoryIndex(newIndex);
      setFocuses(targetFocuses);
      if (targetFocuses.length > 0 && !targetFocuses.find((f) => f.id === selectedFocusId)) {
        setSelectedFocusId(targetFocuses[0].id);
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      const newIndex = historyIndex + 1;
      const targetFocuses = history[newIndex];
      setHistoryIndex(newIndex);
      setFocuses(targetFocuses);
      if (targetFocuses.length > 0 && !targetFocuses.find((f) => f.id === selectedFocusId)) {
        setSelectedFocusId(targetFocuses[0].id);
      }
    }
  };

  // Add Focus Zone: 240px × 50px, border-radius 10px
  const handleAddFocus = () => {
    const bounds = calculateCompositionBounds(image, focuses, globalStyles.workspaceWidth);
    const nextStep = focuses.length + 1;
    const defaultFocusW = 240;
    const defaultFocusH = 50;
    const phoneCenterX = bounds.bgX + bounds.bgWidth / 2;
    const posX = Math.round(phoneCenterX - defaultFocusW / 2);
    const posY = Math.round(bounds.bgY + 40 + (nextStep - 1) * 60);

    const newFocus: FocusZone = {
      id: `focus-${Date.now()}`,
      name: `Zone ${nextStep}`,
      x: posX,
      y: posY,
      width: defaultFocusW,
      height: defaultFocusH,
      zoom: 1.0,
      sourceOffsetX: 0,
      sourceOffsetY: 0,
      borderWidth: 2,
      borderColor: BASE_COLOR,
      borderRadius: 10,
      stepNumber: nextStep,
      showStepBadge: true,
      badgePosition: 'auto',
      badgeColor: BASE_COLOR,
    };

    const updated = [...focuses, newFocus];
    setFocuses(updated);
    setSelectedFocusId(newFocus.id);
    recordHistory(updated);
  };

  const handleAddFocusAt = (x: number, y: number, w = 240, h = 50, label?: string) => {
    const nextStep = focuses.length + 1;
    const newFocus: FocusZone = {
      id: `focus-${Date.now()}`,
      name: label || `Zone ${nextStep}`,
      x,
      y,
      width: w,
      height: h,
      zoom: 1.0,
      sourceOffsetX: 0,
      sourceOffsetY: 0,
      borderWidth: 2,
      borderColor: BASE_COLOR,
      borderRadius: 10,
      stepNumber: nextStep,
      showStepBadge: true,
      badgePosition: 'auto',
      badgeColor: BASE_COLOR,
    };

    const updated = [...focuses, newFocus];
    setFocuses(updated);
    setSelectedFocusId(newFocus.id);
    recordHistory(updated);
  };

  // Center Focus Horizontally on the screenshot (symmetrical overflow)
  const handleCenterFocusHorizontally = (id: string) => {
    const target = focuses.find((f) => f.id === id);
    if (!target) return;

    // Use current workspaceWidth to calculate exact composition bounds
    const bounds = calculateCompositionBounds(image, focuses, globalStyles.workspaceWidth);
    const phoneCenterX = bounds.bgX + bounds.bgWidth / 2;
    const newX = Math.round(phoneCenterX - target.width / 2);

    const updated = focuses.map((f) => {
      if (f.id === id) {
        return { ...f, x: newX };
      }
      return f;
    });

    setFocuses(updated);
    recordHistory(updated);
  };

  // Update selected focus
  const handleUpdateFocus = (updatedFields: Partial<FocusZone>) => {
    if (!selectedFocusId) return;
    const updated = focuses.map((f) => {
      if (f.id === selectedFocusId) {
        return { ...f, ...updatedFields };
      }
      return f;
    });
    setFocuses(updated);
    recordHistory(updated);
  };

  // Delete focus and auto-renumber sequentially
  const handleDeleteFocus = (id: string) => {
    const remaining = focuses.filter((f) => f.id !== id);
    const updated = remaining.map((f, i) => ({
      ...f,
      stepNumber: i + 1,
    }));
    setFocuses(updated);
    if (selectedFocusId === id) {
      setSelectedFocusId(updated[0]?.id || null);
    }
    recordHistory(updated);
  };

  // Renumber all focuses sequentially (1, 2, 3...) sorted from top to bottom
  const handleAutoRenumberFocuses = () => {
    if (focuses.length === 0) return;
    const sorted = [...focuses].sort((a, b) => a.y - b.y);
    const updated = sorted.map((f, idx) => ({
      ...f,
      stepNumber: idx + 1,
    }));
    setFocuses(updated);
    recordHistory(updated);
  };

  // Duplicate focus
  const handleDuplicateFocus = (id: string) => {
    const target = focuses.find((f) => f.id === id);
    if (!target) return;

    const nextStep = (target.stepNumber || focuses.length) + 1;

    const duplicated: FocusZone = {
      ...target,
      id: `focus-${Date.now()}`,
      name: `${target.name} (copie)`,
      x: target.x + 15,
      y: target.y + 15,
      stepNumber: nextStep,
    };

    const updated = [...focuses, duplicated];
    setFocuses(updated);
    setSelectedFocusId(duplicated.id);
    recordHistory(updated);
  };

  // Blur Zone Management
  const handleAddBlurZone = (x?: number, y?: number) => {
    const bounds = calculateCompositionBounds(image, focuses, globalStyles.workspaceWidth);
    const posX = x !== undefined ? x : bounds.bgX + 20;
    const posY = y !== undefined ? y : bounds.bgY + 60;
    const newBlur: BlurZone = {
      id: `blur-${Date.now()}`,
      name: `Flou ${blurZones.length + 1}`,
      x: posX,
      y: posY,
      width: 100,
      height: 40,
      blurRadius: 10,
    };
    setBlurZones((prev) => [...prev, newBlur]);
    setSelectedBlurId(newBlur.id);
  };

  const handleUpdateBlurZone = (id: string, updated: Partial<BlurZone>) => {
    setBlurZones((prev) => prev.map((b) => (b.id === id ? { ...b, ...updated } : b)));
  };

  const handleDeleteBlurZone = (id: string) => {
    setBlurZones((prev) => prev.filter((b) => b.id !== id));
    if (selectedBlurId === id) setSelectedBlurId(null);
  };

  // Mask Shape Management (Blue forms)
  const handleAddMaskShape = (x?: number, y?: number) => {
    const bounds = calculateCompositionBounds(image, focuses, globalStyles.workspaceWidth);
    const posX = x !== undefined ? x : bounds.bgX + 20;
    const posY = y !== undefined ? y : bounds.bgY + 120;
    const newMask: MaskShape = {
      id: `mask-${Date.now()}`,
      name: `Masque ${maskShapes.length + 1}`,
      x: posX,
      y: posY,
      width: 120,
      height: 35,
      color: '#25465F', // Corporate blue mask #25465F
      opacity: 1,
      borderRadius: 4,
    };
    setMaskShapes((prev) => [...prev, newMask]);
    setSelectedMaskId(newMask.id);
  };

  const handleUpdateMaskShape = (id: string, updated: Partial<MaskShape>) => {
    setMaskShapes((prev) => prev.map((m) => (m.id === id ? { ...m, ...updated } : m)));
  };

  const handleDeleteMaskShape = (id: string) => {
    setMaskShapes((prev) => prev.filter((m) => m.id !== id));
    if (selectedMaskId === id) setSelectedMaskId(null);
  };

  // Triangle Shape Management (15x13px, #25465F ou blanc)
  const handleAddTriangle = (x?: number, y?: number) => {
    const bounds = calculateCompositionBounds(image, focuses, globalStyles.workspaceWidth);
    const posX = x !== undefined ? x : Math.round(bounds.bgX + bounds.bgWidth / 2 - 7.5);
    const posY = y !== undefined ? y : Math.round(bounds.bgY + bounds.bgHeight * 0.5);
    const newTriangle: TriangleShape = {
      id: `triangle-${Date.now()}`,
      name: `Triangle ${triangles.length + 1}`,
      x: posX,
      y: posY,
      width: 15,
      height: 13,
      color: '#25465F',
      direction: 'down',
      opacity: 1,
    };
    setTriangles((prev) => [...prev, newTriangle]);
    setSelectedTriangleId(newTriangle.id);
  };

  const handleUpdateTriangle = (id: string, updated: Partial<TriangleShape>) => {
    setTriangles((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
  };

  const handleDeleteTriangle = (id: string) => {
    setTriangles((prev) => prev.filter((t) => t.id !== id));
    if (selectedTriangleId === id) setSelectedTriangleId(null);
  };

  // Add Horizontal Guide
  const handleAddGuideH = () => {
    const selected = focuses.find((f) => f.id === selectedFocusId);
    const bounds = calculateCompositionBounds(image, focuses, globalStyles.workspaceWidth);
    const pos = selected ? selected.y + selected.height / 2 : bounds.bgY + bounds.bgHeight / 2;
    setUserGuides((prev) => [
      ...prev,
      { id: `guide-h-${Date.now()}`, type: 'horizontal', position: pos }
    ]);
  };

  // Add Vertical Guide
  const handleAddGuideV = () => {
    const selected = focuses.find((f) => f.id === selectedFocusId);
    const bounds = calculateCompositionBounds(image, focuses, globalStyles.workspaceWidth);
    const pos = selected ? selected.x + selected.width / 2 : bounds.bgX + bounds.bgWidth / 2;
    setUserGuides((prev) => [
      ...prev,
      { id: `guide-v-${Date.now()}`, type: 'vertical', position: pos }
    ]);
  };

  // Reset to default settings
  const handleResetToDefaults = () => {
    setGlobalStyles({
      bgTintColor: BASE_COLOR,
      bgTintOpacity: 0.50,
      exportScale: 1,
      workspaceWidth: 440,
      container: {
        borderRadius: 0,
        showShadow: false,
        shadowBlur: 0,
        borderWidth: 0,
        borderColor: 'transparent',
      },
      showRulers: true,
      showHandles: true,
      showGuides: true,
      previewHD: false,
    });
    setUserGuides([]);
    setBlurZones([]);
    setMaskShapes([]);
    setIsPreviewMode(false);
  };

  // Export visual strictly as PNG with genuine alpha transparency
  const handleExportPng = () => {
    if (!image) return;
    setIsExporting(true);

    setTimeout(() => {
      try {
        const activeArrows = arrows.filter((a) => a.visible);
        const { exportWidth, exportHeight, offsetX, offsetY } = calculateExportBounds(
          image,
          focuses,
          activeArrows,
          16,
          globalStyles.workspaceWidth,
          blurZones,
          maskShapes,
          triangles
        );
        const scale = globalStyles.exportScale || 1;

        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = exportWidth * scale;
        exportCanvas.height = exportHeight * scale;
        const ctx = exportCanvas.getContext('2d');
        if (!ctx) return;

        if (scale !== 1) {
          ctx.scale(scale, scale);
        }

        ctx.save();
        ctx.translate(offsetX, offsetY);

        // Render pure visual: NO interactive handles, NO guides, NO rulers
        drawComposition(ctx, image, focuses, { 
          interactive: false,
          globalStyles,
          arrows: activeArrows,
          showGuides: false,
          showRulers: false,
          skipClear: true,
          blurZones,
          maskShapes,
          triangles,
          previewMode: true,
        });
        ctx.restore();

        exportCanvas.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          const cleanName = (image.name || 'procedure')
            .replace(/\.[^/.]+$/, '')
            .replace(/\s+/g, '-');
          link.download = `focus-${cleanName}-${Date.now()}.png`;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          setIsExporting(false);
        }, 'image/png');
      } catch (err) {
        console.error('Export failed:', err);
        setIsExporting(false);
      }
    }, 50);
  };

  // Copy PNG to Clipboard
  const handleCopyClipboard = async () => {
    if (!image) return;
    try {
      const activeArrows = arrows.filter((a) => a.visible);
      const { exportWidth, exportHeight, offsetX, offsetY } = calculateExportBounds(
        image,
        focuses,
        activeArrows,
        16,
        globalStyles.workspaceWidth,
        blurZones,
        maskShapes,
        triangles
      );
      const scale = globalStyles.exportScale || 1;

      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = exportWidth * scale;
      exportCanvas.height = exportHeight * scale;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) return;

      if (scale !== 1) {
        ctx.scale(scale, scale);
      }

      ctx.save();
      ctx.translate(offsetX, offsetY);

      drawComposition(ctx, image, focuses, { 
        interactive: false,
        globalStyles,
        arrows: activeArrows,
        showGuides: false,
        showRulers: false,
        skipClear: true,
        blurZones,
        maskShapes,
        triangles,
        previewMode: true,
      });
      ctx.restore();

      exportCanvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (e) {
          console.error('Failed to copy to clipboard', e);
        }
      }, 'image/png');
    } catch (err) {
      console.error(err);
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return;
      }

      // Undo: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Redo: Ctrl+Shift+Z / Cmd+Shift+Z / Ctrl+Y
      if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y')
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Export: Ctrl+E / Cmd+E
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handleExportPng();
        return;
      }

      // Duplicate: Ctrl+D / Cmd+D
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (selectedFocusId) {
          handleDuplicateFocus(selectedFocusId);
        }
        return;
      }

      // Delete: Delete or Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (selectedFocusId) {
          handleDeleteFocus(selectedFocusId);
        } else if (selectedBlurId) {
          handleDeleteBlurZone(selectedBlurId);
        } else if (selectedMaskId) {
          handleDeleteMaskShape(selectedMaskId);
        } else if (selectedTriangleId) {
          handleDeleteTriangle(selectedTriangleId);
        }
        return;
      }

      // Escape: Quitter la prévisualisation ou désélectionner
      if (e.key === 'Escape') {
        if (isPreviewMode) {
          setIsPreviewMode(false);
          return;
        }
        setSelectedFocusId(null);
        setSelectedBlurId(null);
        setSelectedMaskId(null);
        setSelectedTriangleId(null);
        setActiveTool('select');
        return;
      }

      // Add Focus: 'a' / 'A' (strictly without modifier keys to prevent unintended creation)
      if ((e.key === 'a' || e.key === 'A') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleAddFocus();
        return;
      }

      // Preview Mode Toggle: 'p' / 'P'
      if (e.key === 'p' || e.key === 'P') {
        setIsPreviewMode((prev) => !prev);
        return;
      }

      // Help: '?'
      if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen(true);
        return;
      }

      // Arrow keys to nudge selected focus
      if (selectedFocusId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const current = focuses.find((f) => f.id === selectedFocusId);
        if (!current) return;

        let dx = 0;
        let dy = 0;
        if (e.key === 'ArrowUp') dy = -step;
        if (e.key === 'ArrowDown') dy = step;
        if (e.key === 'ArrowLeft') dx = -step;
        if (e.key === 'ArrowRight') dx = step;

        handleUpdateFocus({
          x: current.x + dx,
          y: current.y + dy,
        });
      }
    };

    // Paste event: paste screenshot directly
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            handleImportFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('paste', handlePaste);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('paste', handlePaste);
    };
  }, [focuses, selectedFocusId, selectedBlurId, selectedMaskId, selectedTriangleId, isPreviewMode, historyIndex, history]);

  const selectedFocus = focuses.find((f) => f.id === selectedFocusId) || null;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gradient-to-br from-[#fdfbfb] to-[#ebedee] font-sans antialiased text-[#000000]">
      {/* Top Header */}
      <Header
        onImportFile={handleImportFile}
        onSelectSample={handleSelectSample}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onExportPng={handleExportPng}
        onCopyClipboard={handleCopyClipboard}
        isExporting={isExporting}
        copied={copied}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        hasImage={!!image}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex justify-center items-start p-4 md:p-5 lg:p-6 gap-5 lg:gap-6 overflow-hidden relative min-h-0">
        {/* Center Canvas */}
        <CanvasWorkspace
          image={image}
          focuses={focuses}
          selectedFocusId={selectedFocusId}
          onSelectFocus={setSelectedFocusId}
          onUpdateFocus={handleUpdateFocus}
          onAddFocus={handleAddFocus}
          onDeleteFocus={handleDeleteFocus}
          onAddFocusAt={handleAddFocusAt}
          blurZones={blurZones}
          selectedBlurId={selectedBlurId}
          onSelectBlur={setSelectedBlurId}
          onAddBlur={() => handleAddBlurZone()}
          onAddBlurAt={handleAddBlurZone}
          onUpdateBlur={handleUpdateBlurZone}
          onDeleteBlur={handleDeleteBlurZone}
          maskShapes={maskShapes}
          selectedMaskId={selectedMaskId}
          onSelectMask={setSelectedMaskId}
          onAddMask={() => handleAddMaskShape()}
          onAddMaskAt={handleAddMaskShape}
          onUpdateMask={handleUpdateMaskShape}
          onDeleteMask={handleDeleteMaskShape}
          triangles={triangles}
          selectedTriangleId={selectedTriangleId}
          onSelectTriangle={setSelectedTriangleId}
          onAddTriangle={() => handleAddTriangle()}
          onAddTriangleAt={handleAddTriangle}
          onUpdateTriangle={handleUpdateTriangle}
          onDeleteTriangle={handleDeleteTriangle}
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          isPreviewMode={isPreviewMode}
          onTogglePreview={() => setIsPreviewMode((prev) => !prev)}
          onFileDrop={handleImportFile}
          detectedElements={detectedElements}
          showDetectedOverlay={showDetectedOverlay}
          onSelectDetected={(el) => handleAddFocusAt(el.x, el.y, el.width, el.height, el.label)}
          globalStyles={globalStyles}
          onUpdateGlobalStyles={(updated) => setGlobalStyles((prev) => ({ ...prev, ...updated }))}
          arrows={arrows}
          onToggleArrow={() => {}}
          onUpdateArrow={() => {}}
          userGuides={userGuides}
          onAddGuideH={handleAddGuideH}
          onAddGuideV={handleAddGuideV}
          onImportClick={() => {
            const el = document.getElementById('header-import-button');
            el?.click();
          }}
        />

        {/* Right Studio Settings Accordion Panel */}
        <StudioSettingsPanel
          image={image}
          focuses={focuses}
          selectedFocus={selectedFocus}
          onSelectFocus={setSelectedFocusId}
          onAddFocus={handleAddFocus}
          onUpdateFocus={handleUpdateFocus}
          onDeleteFocus={handleDeleteFocus}
          onDuplicateFocus={handleDuplicateFocus}
          onCenterFocusHorizontally={handleCenterFocusHorizontally}
          onRenumberFocuses={handleAutoRenumberFocuses}
          globalStyles={globalStyles}
          onUpdateGlobalStyles={(updated) => setGlobalStyles((prev) => ({ ...prev, ...updated }))}
          blurZones={blurZones}
          selectedBlurId={selectedBlurId}
          onSelectBlur={setSelectedBlurId}
          onAddBlur={() => handleAddBlurZone()}
          onUpdateBlur={handleUpdateBlurZone}
          onDeleteBlur={handleDeleteBlurZone}
          maskShapes={maskShapes}
          selectedMaskId={selectedMaskId}
          onSelectMask={setSelectedMaskId}
          onAddMask={() => handleAddMaskShape()}
          onUpdateMask={handleUpdateMaskShape}
          onDeleteMask={handleDeleteMaskShape}
          triangles={triangles}
          selectedTriangleId={selectedTriangleId}
          onSelectTriangle={setSelectedTriangleId}
          onAddTriangle={() => handleAddTriangle()}
          onUpdateTriangle={handleUpdateTriangle}
          onDeleteTriangle={handleDeleteTriangle}
          onResetToDefaults={handleResetToDefaults}
          onExportPng={handleExportPng}
          onCopyClipboard={handleCopyClipboard}
          isExporting={isExporting}
          copied={copied}
          onImportFile={handleImportFile}
          onSelectSample={handleSelectSample}
          isPreviewMode={isPreviewMode}
          onTogglePreview={() => setIsPreviewMode((prev) => !prev)}
          panelWidth={panelWidth}
          onUpdatePanelWidth={setPanelWidth}
        />
      </div>

      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
