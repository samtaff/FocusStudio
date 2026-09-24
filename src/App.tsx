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
  TriangleShape,
  CalloutVignette
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

  // Callout / Zoom Détaché (Vignette à 5px du screen, zoomée sur une zone ou icône)
  const [calloutVignette, setCalloutVignette] = useState<CalloutVignette | null>(null);
  const [selectedCalloutPart, setSelectedCalloutPart] = useState<'source' | 'vignette' | null>(null);

  // Dark Mode State (#212121)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('focus_studio_dark_mode');
      if (saved !== null) return JSON.parse(saved);
      return false;
    } catch {
      return false;
    }
  });

  const handleToggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('focus_studio_dark_mode', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  // Mutually exclusive selection handlers so arrow keys and panels target the exact active object
  const handleSelectFocus = useCallback((id: string | null) => {
    setSelectedFocusId(id);
    if (id) {
      setSelectedBlurId(null);
      setSelectedMaskId(null);
      setSelectedTriangleId(null);
      setSelectedCalloutPart(null);
    }
  }, []);

  const handleSelectBlur = useCallback((id: string | null) => {
    setSelectedBlurId(id);
    if (id) {
      setSelectedFocusId(null);
      setSelectedMaskId(null);
      setSelectedTriangleId(null);
      setSelectedCalloutPart(null);
    }
  }, []);

  const handleSelectMask = useCallback((id: string | null) => {
    setSelectedMaskId(id);
    if (id) {
      setSelectedFocusId(null);
      setSelectedBlurId(null);
      setSelectedTriangleId(null);
      setSelectedCalloutPart(null);
    }
  }, []);

  const handleSelectTriangle = useCallback((id: string | null) => {
    setSelectedTriangleId(id);
    if (id) {
      setSelectedFocusId(null);
      setSelectedBlurId(null);
      setSelectedMaskId(null);
      setSelectedCalloutPart(null);
    }
  }, []);

  const handleSelectCalloutPart = useCallback((part: 'source' | 'vignette' | null) => {
    setSelectedCalloutPart(part);
    if (part) {
      setSelectedFocusId(null);
      setSelectedBlurId(null);
      setSelectedMaskId(null);
      setSelectedTriangleId(null);
    }
  }, []);

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
  const [resetWorkspaceTrigger, setResetWorkspaceTrigger] = useState<number>(0);

  const handleCenterWorkspace = useCallback(() => {
    setResetWorkspaceTrigger((prev) => prev + 1);
  }, []);

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

  // Option : Suite logique des pastilles lors de l'import de screenshots
  const [sequentialImportNumbering, setSequentialImportNumbering] = useState<boolean>(() => {
    const saved = localStorage.getItem('sequential_import_numbering');
    return saved !== null ? saved === 'true' : true;
  });
  const [sessionImportCount, setSessionImportCount] = useState<number>(0);
  const [nextSequentialStep, setNextSequentialStep] = useState<number>(1);

  const sequentialImportNumberingRef = useRef(sequentialImportNumbering);
  sequentialImportNumberingRef.current = sequentialImportNumbering;

  const nextSequentialStepRef = useRef(nextSequentialStep);
  nextSequentialStepRef.current = nextSequentialStep;

  const handleToggleSequentialImportNumbering = () => {
    setSequentialImportNumbering((prev) => {
      const next = !prev;
      localStorage.setItem('sequential_import_numbering', String(next));
      return next;
    });
  };

  const handleResetSequentialCounter = () => {
    setNextSequentialStep(1);
    setSessionImportCount(0);
  };

  // Load an image from a Data URL
  const loadImageFromDataUrl = useCallback(async (dataUrl: string, name: string, isUserImport: boolean = false) => {
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

    // Initial default focus: 240 × 50 px, zoom = screenshot width in zone focus (240px)
    const bounds = calculateCompositionBounds(loaded, [], globalStyles.workspaceWidth);
    const defaultFocusW = 240;
    const defaultFocusH = 50;
    const phoneCenterX = bounds.bgX + bounds.bgWidth / 2;
    const defaultX = Math.round(phoneCenterX - defaultFocusW / 2);
    const defaultY = Math.round(bounds.bgY + bounds.bgHeight * 0.42);
    const defaultZoom = bounds.bgWidth > 0 ? Number((defaultFocusW / bounds.bgWidth).toFixed(3)) : 1.0;

    let initialStepNumber = 1;
    if (isUserImport && sequentialImportNumberingRef.current) {
      initialStepNumber = nextSequentialStepRef.current;
      setNextSequentialStep(initialStepNumber + 1);
      setSessionImportCount((c) => c + 1);
    }

    const initialFocus: FocusZone = {
      id: `focus-${Date.now()}`,
      name: `Zone ${initialStepNumber}`,
      x: defaultX,
      y: defaultY,
      width: defaultFocusW,
      height: defaultFocusH,
      zoom: defaultZoom,
      sourceOffsetX: 0,
      sourceOffsetY: 0,
      borderWidth: 2,
      borderColor: BASE_COLOR,
      borderRadius: 10,
      stepNumber: initialStepNumber,
      showStepBadge: true,
      badgePosition: 'auto',
      badgeColor: BASE_COLOR,
      hasShadow: true,
      shadowColor: BASE_COLOR,
      shadowOpacity: 0.30,
      shadowAngle: 90,
      shadowDistance: 2,
      shadowSize: 2,
      shadowBlur: 2,
      shadowOffsetY: 2,
    };

    setFocuses([initialFocus]);
    handleSelectFocus(initialFocus.id);
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
      await loadImageFromDataUrl(dataUrl, name, true);
    } catch (err) {
      console.warn('Advanced image processing fallback:', err);
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          loadImageFromDataUrl(dataUrl, file.name, true);
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
      loadImageFromDataUrl(dataUrl, preset.name, true);
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

  // Add Focus Zone: default width = 240px, default zoom = screenshot width in focus zone (240px)
  const handleAddFocus = () => {
    const bounds = calculateCompositionBounds(image, focuses, globalStyles.workspaceWidth);
    const maxExisting = focuses.reduce((max, f) => Math.max(max, f.stepNumber || 0), 0);
    const nextStep = maxExisting > 0 ? maxExisting + 1 : focuses.length + 1;
    const defaultFocusW = 240;
    const defaultFocusH = 50;
    const phoneCenterX = bounds.bgX + bounds.bgWidth / 2;
    const posX = Math.round(phoneCenterX - defaultFocusW / 2);
    const posY = Math.round(bounds.bgY + 40 + (nextStep - 1) * 60);
    const defaultZoom = bounds.bgWidth > 0 ? Number((defaultFocusW / bounds.bgWidth).toFixed(3)) : 1.0;

    const newFocus: FocusZone = {
      id: `focus-${Date.now()}`,
      name: `Zone ${nextStep}`,
      x: posX,
      y: posY,
      width: defaultFocusW,
      height: defaultFocusH,
      zoom: defaultZoom,
      sourceOffsetX: 0,
      sourceOffsetY: 0,
      borderWidth: 2,
      borderColor: BASE_COLOR,
      borderRadius: 10,
      stepNumber: nextStep,
      showStepBadge: true,
      badgePosition: 'auto',
      badgeColor: BASE_COLOR,
      hasShadow: true,
      shadowColor: BASE_COLOR,
      shadowOpacity: 0.30,
      shadowAngle: 90,
      shadowDistance: 2,
      shadowSize: 2,
      shadowBlur: 2,
      shadowOffsetY: 2,
    };

    const updated = [...focuses, newFocus];
    setFocuses(updated);
    handleSelectFocus(newFocus.id);
    recordHistory(updated);

    if (sequentialImportNumberingRef.current) {
      setNextSequentialStep((prev) => Math.max(prev, nextStep + 1));
    }
  };

  const handleAddFocusAt = (x: number, y: number, w?: number, h = 50, label?: string) => {
    const bounds = calculateCompositionBounds(image, focuses, globalStyles.workspaceWidth);
    const maxExisting = focuses.reduce((max, f) => Math.max(max, f.stepNumber || 0), 0);
    const nextStep = maxExisting > 0 ? maxExisting + 1 : focuses.length + 1;
    const defaultFocusW = 240;
    const focusW = w !== undefined ? w : defaultFocusW;
    const defaultZoom = bounds.bgWidth > 0 ? Number((focusW / bounds.bgWidth).toFixed(3)) : 1.0;
    const newFocus: FocusZone = {
      id: `focus-${Date.now()}`,
      name: label || `Zone ${nextStep}`,
      x,
      y,
      width: focusW,
      height: h,
      zoom: defaultZoom,
      sourceOffsetX: 0,
      sourceOffsetY: 0,
      borderWidth: 2,
      borderColor: BASE_COLOR,
      borderRadius: 10,
      stepNumber: nextStep,
      showStepBadge: true,
      badgePosition: 'auto',
      badgeColor: BASE_COLOR,
      hasShadow: true,
      shadowColor: BASE_COLOR,
      shadowOpacity: 0.30,
      shadowAngle: 90,
      shadowDistance: 2,
      shadowSize: 2,
      shadowBlur: 2,
      shadowOffsetY: 2,
    };

    const updated = [...focuses, newFocus];
    setFocuses(updated);
    handleSelectFocus(newFocus.id);
    recordHistory(updated);

    if (sequentialImportNumberingRef.current) {
      setNextSequentialStep((prev) => Math.max(prev, nextStep + 1));
    }
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
    handleSelectBlur(newBlur.id);
  };

  const handleUpdateBlurZone = (id: string, updated: Partial<BlurZone>) => {
    setBlurZones((prev) => prev.map((b) => (b.id === id ? { ...b, ...updated } : b)));
  };

  const handleDeleteBlurZone = (id: string) => {
    setBlurZones((prev) => prev.filter((b) => b.id !== id));
    if (selectedBlurId === id) setSelectedBlurId(null);
  };

  const handleDuplicateBlurZone = (id: string) => {
    const target = blurZones.find((b) => b.id === id);
    if (!target) return;
    const duplicated: BlurZone = {
      ...target,
      id: `blur-${Date.now()}`,
      name: `${target.name} (copie)`,
      x: target.x + 15,
      y: target.y + 15,
    };
    setBlurZones((prev) => [...prev, duplicated]);
    handleSelectBlur(duplicated.id);
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
    handleSelectMask(newMask.id);
  };

  const handleUpdateMaskShape = (id: string, updated: Partial<MaskShape>) => {
    setMaskShapes((prev) => prev.map((m) => (m.id === id ? { ...m, ...updated } : m)));
  };

  const handleDeleteMaskShape = (id: string) => {
    setMaskShapes((prev) => prev.filter((m) => m.id !== id));
    if (selectedMaskId === id) setSelectedMaskId(null);
  };

  const handleDuplicateMaskShape = (id: string) => {
    const target = maskShapes.find((m) => m.id === id);
    if (!target) return;
    const duplicated: MaskShape = {
      ...target,
      id: `mask-${Date.now()}`,
      name: `${target.name} (copie)`,
      x: target.x + 15,
      y: target.y + 15,
    };
    setMaskShapes((prev) => [...prev, duplicated]);
    handleSelectMask(duplicated.id);
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
    handleSelectTriangle(newTriangle.id);
  };

  const handleUpdateTriangle = (id: string, updated: Partial<TriangleShape>) => {
    setTriangles((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
  };

  const handleDeleteTriangle = (id: string) => {
    setTriangles((prev) => prev.filter((t) => t.id !== id));
    if (selectedTriangleId === id) setSelectedTriangleId(null);
  };

  const handleDuplicateTriangle = (id: string) => {
    const target = triangles.find((t) => t.id === id);
    if (!target) return;
    const duplicated: TriangleShape = {
      ...target,
      id: `triangle-${Date.now()}`,
      name: `${target.name} (copie)`,
      x: target.x + 15,
      y: target.y + 15,
    };
    setTriangles((prev) => [...prev, duplicated]);
    handleSelectTriangle(duplicated.id);
  };

  // Callout / Vignette zoom détaché management
  const handleToggleCallout = () => {
    setCalloutVignette((prev) => {
      const willEnable = !prev?.enabled;
      if (!willEnable) {
        // Leaving Callout mode: return to select tool and restore focus selection
        setActiveTool('select');
        setSelectedCalloutPart(null);
        if (focuses.length > 0) {
          handleSelectFocus(focuses[0].id);
        }
        return { ...prev!, enabled: false };
      }

      // Entering Callout mode:
      // Zone focus disappears, background tint disappears,
      // width encompasses vignette + screenshot + 15px margin on each side,
      // vignette aligned to bottom of screenshot with 50% shadow, 5px distance, 2px size.
      handleSelectFocus(null);
      setSelectedCalloutPart('source');
      setActiveTool('callout');

      const vigW = prev?.width || 100;
      const vigH = prev?.height || vigW;
      const gap = prev?.gap ?? 5;
      const shadowDist = 5; // distance ombre portée 5px

      const bounds = calculateCompositionBounds(
        image,
        focuses,
        globalStyles.workspaceWidth,
        { enabled: true, width: vigW, height: vigH, gap } as CalloutVignette
      );

      // Alignement au bas du screenshot en référence à l'ombre portée (vigY + vigH + shadowDist = bgY + bgHeight)
      const alignedBottomY = bounds.bgY + bounds.bgHeight - vigH - shadowDist;

      if (prev) {
        return {
          ...prev,
          enabled: true,
          alignBottom: true,
          offsetY: alignedBottomY,
          width: prev.width || 100,
          height: prev.height || prev.width || 100,
          shadowDistance: 5,
          shadowSize: 2,
          shadowBlur: 2,
          shadowOffsetY: 5,
          shadowOpacity: 0.50,
        };
      }

      // Initialize default Callout Vignette (default 100px)
      return {
        id: `callout-${Date.now()}`,
        enabled: true,
        sourceX: Math.round(bounds.bgX + bounds.bgWidth * 0.25),
        sourceY: Math.round(bounds.bgY + bounds.bgHeight * 0.35),
        sourceWidth: 40,
        sourceHeight: 40,
        width: 100,
        height: 100,
        shape: 'rounded',
        borderRadius: 16,
        gap: 5, // Strict requirement: exactly 5px gap from screen border
        offsetY: alignedBottomY, // Aligned to bottom of screenshot
        alignBottom: true,
        borderWidth: 0,
        borderColor: 'transparent',
        showShadow: true,
        shadowDistance: 5,
        shadowSize: 2,
        shadowBlur: 2,
        shadowOffsetX: 0,
        shadowOffsetY: 5,
        shadowOpacity: 0.50,
      };
    });
  };

  const handleUpdateCallout = (updated: Partial<CalloutVignette>) => {
    setCalloutVignette((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...updated };

      // Lorsque je zoom je veux que le zoom s'effectue par le centre exact de la cible loupe
      if (
        updated.sourceWidth !== undefined &&
        updated.sourceX === undefined &&
        prev.sourceWidth &&
        prev.sourceWidth !== updated.sourceWidth
      ) {
        const oldW = prev.sourceWidth;
        const oldH = prev.sourceHeight || oldW;
        const centerX = prev.sourceCenterX ?? ((prev.sourceX ?? 0) + oldW / 2);
        const centerY = prev.sourceCenterY ?? ((prev.sourceY ?? 0) + oldH / 2);
        const newW = updated.sourceWidth;
        const newH = updated.sourceHeight ?? newW;

        next.sourceCenterX = centerX;
        next.sourceCenterY = centerY;
        next.sourceX = Math.round((centerX - newW / 2) * 10) / 10;
        next.sourceY = Math.round((centerY - newH / 2) * 10) / 10;
        next.sourceHeight = newH;
      } else if (updated.sourceX !== undefined || updated.sourceY !== undefined) {
        const curW = next.sourceWidth || prev.sourceWidth || 40;
        const curH = next.sourceHeight || prev.sourceHeight || curW;
        next.sourceCenterX = (next.sourceX ?? prev.sourceX ?? 0) + curW / 2;
        next.sourceCenterY = (next.sourceY ?? prev.sourceY ?? 0) + curH / 2;
      }

      return next;
    });
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
      workspaceWidth: 260,
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

  // Export visual strictly as PNG with genuine alpha transparency, prompting the user for destination folder
  const handleExportPng = async () => {
    if (!image) return;
    setIsExporting(true);

    const cleanName = (image.name || 'procedure')
      .replace(/\.[^/.]+$/, '')
      .replace(/\s+/g, '-');
    const filename = `focus-${cleanName}-${Date.now()}.png`;

    let fileHandle: any = null;

    // Direct user gesture: Open native file explorer dialog (Save As) if supported by the browser
    if ('showSaveFilePicker' in window) {
      try {
        fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: 'Image PNG (*.png)',
              accept: {
                'image/png': ['.png'],
              },
            },
          ],
        });
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          // User clicked Cancel in the file explorer dialog
          setIsExporting(false);
          return;
        }
        console.warn('showSaveFilePicker not permitted or unsupported, falling back to download:', err);
      }
    }

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
        triangles,
        calloutVignette
      );
      const scale = globalStyles.exportScale || 1;

      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = exportWidth * scale;
      exportCanvas.height = exportHeight * scale;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) {
        setIsExporting(false);
        return;
      }

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
        calloutVignette,
        previewMode: true,
      });
      ctx.restore();

      const blob = await new Promise<Blob | null>((resolve) => {
        exportCanvas.toBlob(resolve, 'image/png');
      });

      if (!blob) {
        setIsExporting(false);
        return;
      }

      // If user selected a location in the file explorer, write directly to that file
      if (fileHandle) {
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        setIsExporting(false);
        return;
      }

      // Fallback: standard automatic download trigger
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = filename;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setIsExporting(false);
    } catch (err) {
      console.error('Export failed:', err);
      setIsExporting(false);
    }
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
        triangles,
        calloutVignette
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
        calloutVignette,
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
        if (
          target.tagName === 'INPUT' &&
          (target as HTMLInputElement).type === 'range' &&
          ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) &&
          calloutVignette?.enabled
        ) {
          target.blur();
        } else {
          return;
        }
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

      // Arrow keys to nudge selected object (Photoshop style: 1px by default, 10px with Shift)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const step = e.shiftKey ? 10 : 1;
        let dx = 0;
        let dy = 0;
        if (e.key === 'ArrowUp') dy = -step;
        if (e.key === 'ArrowDown') dy = step;
        if (e.key === 'ArrowLeft') dx = -step;
        if (e.key === 'ArrowRight') dx = step;

        let handled = false;

        // En mode Callout, les flèches permettent de déplacer autant qu'on veut la "Cible loupe"
        if (calloutVignette && calloutVignette.enabled) {
          // Déplacement au demi-pixel près (0.5px par appui, 5px avec Shift)
          const calloutStep = e.shiftKey ? 5 : 0.5;
          let cdx = 0;
          let cdy = 0;
          if (e.key === 'ArrowUp') cdy = -calloutStep;
          if (e.key === 'ArrowDown') cdy = calloutStep;
          if (e.key === 'ArrowLeft') cdx = -calloutStep;
          if (e.key === 'ArrowRight') cdx = calloutStep;

          if (selectedCalloutPart === 'vignette') {
            handleUpdateCallout({
              offsetY: Math.round(((calloutVignette.offsetY ?? 0) + cdy) * 10) / 10,
              alignBottom: false,
            });
            handled = true;
          } else {
            // Déplacement libre au demi-pixel près de la Cible loupe
            handleUpdateCallout({
              sourceX: Math.round(((calloutVignette.sourceX ?? 0) + cdx) * 10) / 10,
              sourceY: Math.round(((calloutVignette.sourceY ?? 0) + cdy) * 10) / 10,
            });
            handled = true;
          }
        } else if (selectedFocusId) {
          const current = focuses.find((f) => f.id === selectedFocusId);
          if (current) {
            handleUpdateFocus({
              x: current.x + dx,
              y: current.y + dy,
            });
            handled = true;
          }
        } else if (selectedBlurId) {
          const current = blurZones.find((b) => b.id === selectedBlurId);
          if (current) {
            handleUpdateBlurZone(selectedBlurId, {
              x: current.x + dx,
              y: current.y + dy,
            });
            handled = true;
          }
        } else if (selectedMaskId) {
          const current = maskShapes.find((m) => m.id === selectedMaskId);
          if (current) {
            handleUpdateMaskShape(selectedMaskId, {
              x: current.x + dx,
              y: current.y + dy,
            });
            handled = true;
          }
        } else if (selectedTriangleId) {
          const current = triangles.find((t) => t.id === selectedTriangleId);
          if (current) {
            handleUpdateTriangle(selectedTriangleId, {
              x: current.x + dx,
              y: current.y + dy,
            });
            handled = true;
          }
        }

        if (handled) {
          e.preventDefault();
        }
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
  }, [
    focuses,
    blurZones,
    maskShapes,
    triangles,
    selectedFocusId,
    selectedBlurId,
    selectedMaskId,
    selectedTriangleId,
    isPreviewMode,
    historyIndex,
    history,
    calloutVignette,
    selectedCalloutPart,
  ]);

  const selectedFocus = focuses.find((f) => f.id === selectedFocusId) || null;

  return (
    <div className={`h-screen w-screen flex flex-col overflow-hidden font-sans antialiased transition-colors duration-200 ${
      isDarkMode 
        ? 'bg-[#212121] text-white' 
        : 'bg-gradient-to-br from-[#fdfbfb] to-[#ebedee] text-[#000000]'
    }`}>
      {/* Top Header */}
      <Header
        onImportFile={handleImportFile}
        onExportPng={handleExportPng}
        onCopyClipboard={handleCopyClipboard}
        isExporting={isExporting}
        copied={copied}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        hasImage={!!image}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex justify-center items-start p-4 md:p-5 lg:p-6 gap-5 lg:gap-6 overflow-hidden relative min-h-0">
        {/* Center Canvas */}
        <CanvasWorkspace
          image={image}
          focuses={focuses}
          selectedFocusId={selectedFocusId}
          onSelectFocus={handleSelectFocus}
          onUpdateFocus={handleUpdateFocus}
          onRenumberFocuses={handleAutoRenumberFocuses}
          onAddFocus={handleAddFocus}
          onDeleteFocus={handleDeleteFocus}
          onDuplicateFocus={handleDuplicateFocus}
          onAddFocusAt={handleAddFocusAt}
          blurZones={blurZones}
          selectedBlurId={selectedBlurId}
          onSelectBlur={handleSelectBlur}
          onAddBlur={() => handleAddBlurZone()}
          onAddBlurAt={handleAddBlurZone}
          onUpdateBlur={handleUpdateBlurZone}
          onDeleteBlur={handleDeleteBlurZone}
          onDuplicateBlur={handleDuplicateBlurZone}
          maskShapes={maskShapes}
          selectedMaskId={selectedMaskId}
          onSelectMask={handleSelectMask}
          onAddMask={() => handleAddMaskShape()}
          onAddMaskAt={handleAddMaskShape}
          onUpdateMask={handleUpdateMaskShape}
          onDeleteMask={handleDeleteMaskShape}
          onDuplicateMask={handleDuplicateMaskShape}
          triangles={triangles}
          selectedTriangleId={selectedTriangleId}
          onSelectTriangle={handleSelectTriangle}
          onAddTriangle={() => handleAddTriangle()}
          onAddTriangleAt={handleAddTriangle}
          onUpdateTriangle={handleUpdateTriangle}
          onDeleteTriangle={handleDeleteTriangle}
          onDuplicateTriangle={handleDuplicateTriangle}
          calloutVignette={calloutVignette}
          selectedCalloutPart={selectedCalloutPart}
          onSelectCalloutPart={handleSelectCalloutPart}
          onUpdateCallout={handleUpdateCallout}
          onToggleCallout={handleToggleCallout}
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
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          resetWorkspaceTrigger={resetWorkspaceTrigger}
          onCenterWorkspace={handleCenterWorkspace}
          onExportClick={handleExportPng}
          isExporting={isExporting}
          onImportClick={() => {
            const el = document.getElementById('header-file-input') || document.getElementById('header-import-button');
            el?.click();
          }}
          isDarkMode={isDarkMode}
        />

        {/* Right Studio Settings Accordion Panel */}
        <StudioSettingsPanel
          image={image}
          focuses={focuses}
          selectedFocus={selectedFocus}
          onSelectFocus={handleSelectFocus}
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
          onSelectBlur={handleSelectBlur}
          onAddBlur={() => handleAddBlurZone()}
          onUpdateBlur={handleUpdateBlurZone}
          onDeleteBlur={handleDeleteBlurZone}
          maskShapes={maskShapes}
          selectedMaskId={selectedMaskId}
          onSelectMask={handleSelectMask}
          onAddMask={() => handleAddMaskShape()}
          onUpdateMask={handleUpdateMaskShape}
          onDeleteMask={handleDeleteMaskShape}
          triangles={triangles}
          selectedTriangleId={selectedTriangleId}
          onSelectTriangle={handleSelectTriangle}
          onAddTriangle={() => handleAddTriangle()}
          onUpdateTriangle={handleUpdateTriangle}
          onDeleteTriangle={handleDeleteTriangle}
          calloutVignette={calloutVignette}
          onUpdateCallout={handleUpdateCallout}
          onToggleCallout={handleToggleCallout}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          onCenterWorkspace={handleCenterWorkspace}
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
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
          sequentialImportNumbering={sequentialImportNumbering}
          onToggleSequentialImportNumbering={handleToggleSequentialImportNumbering}
          nextSequentialStep={nextSequentialStep}
          onChangeNextSequentialStep={setNextSequentialStep}
          onResetSequentialCounter={handleResetSequentialCounter}
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
