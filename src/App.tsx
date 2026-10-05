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
import { PreviewModal } from './components/PreviewModal';
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
  const [selectedFocusIds, setSelectedFocusIds] = useState<string[]>([]);
  const selectedFocusId = selectedFocusIds[0] || null;

  // Blur Zones (Flou Gaussien sur n'importe quelle zone)
  const [blurZones, setBlurZones] = useState<BlurZone[]>([]);
  const [selectedBlurIds, setSelectedBlurIds] = useState<string[]>([]);
  const selectedBlurId = selectedBlurIds[0] || null;

  // Mask Shapes (Formes bleues pour masquer des zones)
  const [maskShapes, setMaskShapes] = useState<MaskShape[]>([]);
  const [selectedMaskIds, setSelectedMaskIds] = useState<string[]>([]);
  const selectedMaskId = selectedMaskIds[0] || null;

  // Triangle Shapes (Outil triangle 15x13px en #25465F ou blanc)
  const [triangles, setTriangles] = useState<TriangleShape[]>([]);
  const [selectedTriangleIds, setSelectedTriangleIds] = useState<string[]>([]);
  const selectedTriangleId = selectedTriangleIds[0] || null;

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

  // Internal screenshot framing (recadrage du screenshot dans la zone focus sans altérer l'original)
  const [internalFramingFocusId, setInternalFramingFocusId] = useState<string | null>(null);

  const handleToggleInternalFraming = useCallback((id: string | null) => {
    setInternalFramingFocusId((prev) => (prev === id ? null : id));
  }, []);

  // Multi-selection enabled handlers
  const handleSelectFocus = useCallback((id: string | null, isMulti = false) => {
    if (!id) {
      setSelectedFocusIds([]);
      setInternalFramingFocusId(null);
      return;
    }
    if (isMulti) {
      setSelectedFocusIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    } else {
      setSelectedFocusIds([id]);
      setSelectedBlurIds([]);
      setSelectedMaskIds([]);
      setSelectedTriangleIds([]);
      setSelectedCalloutPart(null);
    }
  }, []);

  const handleSelectBlur = useCallback((id: string | null, isMulti = false) => {
    if (!id) {
      setSelectedBlurIds([]);
      return;
    }
    if (isMulti) {
      setSelectedBlurIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    } else {
      setSelectedBlurIds([id]);
      setSelectedFocusIds([]);
      setSelectedMaskIds([]);
      setSelectedTriangleIds([]);
      setSelectedCalloutPart(null);
      setInternalFramingFocusId(null);
    }
  }, []);

  const handleSelectMask = useCallback((id: string | null, isMulti = false) => {
    if (!id) {
      setSelectedMaskIds([]);
      return;
    }
    if (isMulti) {
      setSelectedMaskIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    } else {
      setSelectedMaskIds([id]);
      setSelectedFocusIds([]);
      setSelectedBlurIds([]);
      setSelectedTriangleIds([]);
      setSelectedCalloutPart(null);
      setInternalFramingFocusId(null);
    }
  }, []);

  const handleSelectTriangle = useCallback((id: string | null, isMulti = false) => {
    if (!id) {
      setSelectedTriangleIds([]);
      return;
    }
    if (isMulti) {
      setSelectedTriangleIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    } else {
      setSelectedTriangleIds([id]);
      setSelectedFocusIds([]);
      setSelectedBlurIds([]);
      setSelectedMaskIds([]);
      setSelectedCalloutPart(null);
      setInternalFramingFocusId(null);
    }
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedFocusIds([]);
    setSelectedBlurIds([]);
    setSelectedMaskIds([]);
    setSelectedTriangleIds([]);
    setSelectedCalloutPart(null);
    setInternalFramingFocusId(null);
  }, []);

  const handleSelectMultiple = useCallback((
    selection: { focusIds?: string[]; blurIds?: string[]; maskIds?: string[]; triangleIds?: string[] },
    isAdditive = false
  ) => {
    const fIds = selection.focusIds || [];
    const bIds = selection.blurIds || [];
    const mIds = selection.maskIds || [];
    const tIds = selection.triangleIds || [];

    if (isAdditive) {
      setSelectedFocusIds((prev) => Array.from(new Set([...prev, ...fIds])));
      setSelectedBlurIds((prev) => Array.from(new Set([...prev, ...bIds])));
      setSelectedMaskIds((prev) => Array.from(new Set([...prev, ...mIds])));
      setSelectedTriangleIds((prev) => Array.from(new Set([...prev, ...tIds])));
      setSelectedCalloutPart(null);
    } else {
      setSelectedFocusIds(fIds);
      setSelectedBlurIds(bIds);
      setSelectedMaskIds(mIds);
      setSelectedTriangleIds(tIds);
      setSelectedCalloutPart(null);
      setInternalFramingFocusId(null);
    }
  }, []);

  const handleSelectCalloutPart = useCallback((part: 'source' | 'vignette' | null) => {
    setSelectedCalloutPart(part);
    if (part) {
      setSelectedFocusIds([]);
      setSelectedBlurIds([]);
      setSelectedMaskIds([]);
      setSelectedTriangleIds([]);
      setInternalFramingFocusId(null);
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

  // Undo / Redo History: full scene snapshots (focuses, blurs, masks, triangles, callout, guides)
  const [history, setHistory] = useState<Array<{
    focuses: FocusZone[];
    blurZones: BlurZone[];
    maskShapes: MaskShape[];
    triangles: TriangleShape[];
    calloutVignette: CalloutVignette | null;
    userGuides: UserGuide[];
  }>>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isUndoRedoAction = useRef(false);
  const historyRef = useRef<Array<{
    focuses: FocusZone[];
    blurZones: BlurZone[];
    maskShapes: MaskShape[];
    triangles: TriangleShape[];
    calloutVignette: CalloutVignette | null;
    userGuides: UserGuide[];
  }>>([]);
  const historyIndexRef = useRef<number>(-1);
  const debounceRecordTimerRef = useRef<any>(null);

  // Synchronized state ref for instant snapshot access without stale closures
  const appStateRef = useRef<{
    focuses: FocusZone[];
    blurZones: BlurZone[];
    maskShapes: MaskShape[];
    triangles: TriangleShape[];
    calloutVignette: CalloutVignette | null;
    userGuides: UserGuide[];
  }>({
    focuses: [],
    blurZones: [],
    maskShapes: [],
    triangles: [],
    calloutVignette: null,
    userGuides: [],
  });

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

  // Deep clone helper to prevent object reference mutation across history snapshots
  const cloneSnapshot = <T,>(val: T): T => {
    try {
      return JSON.parse(JSON.stringify(val));
    } catch {
      return val;
    }
  };

  // Push new snapshot to history stack with deep cloning and duplicate prevention
  const recordHistory = useCallback((customSnapshot?: Partial<{
    focuses: FocusZone[];
    blurZones: BlurZone[];
    maskShapes: MaskShape[];
    triangles: TriangleShape[];
    calloutVignette: CalloutVignette | null;
    userGuides: UserGuide[];
  }>) => {
    if (isUndoRedoAction.current) return;

    if (debounceRecordTimerRef.current) {
      clearTimeout(debounceRecordTimerRef.current);
      debounceRecordTimerRef.current = null;
    }

    const nextFocuses = customSnapshot?.focuses !== undefined ? cloneSnapshot(customSnapshot.focuses) : cloneSnapshot(appStateRef.current.focuses);
    const nextBlurs = customSnapshot?.blurZones !== undefined ? cloneSnapshot(customSnapshot.blurZones) : cloneSnapshot(appStateRef.current.blurZones);
    const nextMasks = customSnapshot?.maskShapes !== undefined ? cloneSnapshot(customSnapshot.maskShapes) : cloneSnapshot(appStateRef.current.maskShapes);
    const nextTriangles = customSnapshot?.triangles !== undefined ? cloneSnapshot(customSnapshot.triangles) : cloneSnapshot(appStateRef.current.triangles);
    const nextCallout = customSnapshot?.calloutVignette !== undefined ? cloneSnapshot(customSnapshot.calloutVignette) : cloneSnapshot(appStateRef.current.calloutVignette);
    const nextGuides = customSnapshot?.userGuides !== undefined ? cloneSnapshot(customSnapshot.userGuides) : cloneSnapshot(appStateRef.current.userGuides);

    const currentSnapshot = {
      focuses: nextFocuses,
      blurZones: nextBlurs,
      maskShapes: nextMasks,
      triangles: nextTriangles,
      calloutVignette: nextCallout,
      userGuides: nextGuides,
    };

    // Update appStateRef synchronously
    appStateRef.current = {
      focuses: currentSnapshot.focuses,
      blurZones: currentSnapshot.blurZones,
      maskShapes: currentSnapshot.maskShapes,
      triangles: currentSnapshot.triangles,
      calloutVignette: currentSnapshot.calloutVignette,
      userGuides: currentSnapshot.userGuides,
    };

    const prevHistory = historyRef.current;
    const curIdx = historyIndexRef.current;

    // Check if new snapshot is identical to previous snapshot at curIdx to prevent useless duplicates
    if (curIdx >= 0 && prevHistory[curIdx]) {
      const lastSnap = prevHistory[curIdx];
      if (JSON.stringify(lastSnap) === JSON.stringify(currentSnapshot)) {
        return;
      }
    }

    const sliced = curIdx >= 0 ? prevHistory.slice(0, curIdx + 1) : [];
    const nextHistory = [...sliced, currentSnapshot].slice(-50);
    const nextIdx = nextHistory.length - 1;

    historyRef.current = nextHistory;
    historyIndexRef.current = nextIdx;
    setHistory(nextHistory);
    setHistoryIndex(nextIdx);
  }, []);

  // Debounced record history for continuous updates (e.g. typing, slider dragging)
  const scheduleDebouncedRecordHistory = useCallback(() => {
    if (isUndoRedoAction.current) return;
    if (debounceRecordTimerRef.current) {
      clearTimeout(debounceRecordTimerRef.current);
    }
    debounceRecordTimerRef.current = setTimeout(() => {
      recordHistory();
    }, 250);
  }, [recordHistory]);

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

    const initSnapshot = {
      focuses: [initialFocus],
      blurZones: [] as BlurZone[],
      maskShapes: [] as MaskShape[],
      triangles: [] as TriangleShape[],
      calloutVignette: null as CalloutVignette | null,
      userGuides: [] as UserGuide[],
    };

    appStateRef.current = cloneSnapshot(initSnapshot);

    setFocuses([initialFocus]);
    setBlurZones([]);
    setMaskShapes([]);
    setTriangles([]);
    setCalloutVignette(null);
    setUserGuides([]);
    handleSelectFocus(initialFocus.id);

    historyRef.current = [cloneSnapshot(initSnapshot)];
    historyIndexRef.current = 0;
    setHistory([cloneSnapshot(initSnapshot)]);
    setHistoryIndex(0);

    // Trigger smart detection asynchronously
    detectInterfaceElements(img, scaleFactor)
      .then((elements) => setDetectedElements(elements))
      .catch((err) => console.error(err));
  }, [globalStyles.workspaceWidth, handleSelectFocus]);

  // Keep appStateRef synchronized with current state
  useEffect(() => {
    appStateRef.current = {
      focuses,
      blurZones,
      maskShapes,
      triangles,
      calloutVignette,
      userGuides,
    };
  }, [focuses, blurZones, maskShapes, triangles, calloutVignette, userGuides]);

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
  const handleUndo = useCallback(() => {
    const curIdx = historyIndexRef.current;
    const prevHistory = historyRef.current;
    if (curIdx <= 0 || prevHistory.length === 0) return;

    if (debounceRecordTimerRef.current) {
      clearTimeout(debounceRecordTimerRef.current);
      debounceRecordTimerRef.current = null;
    }

    const targetIdx = curIdx - 1;
    const rawSnapshot = prevHistory[targetIdx];
    if (!rawSnapshot) return;

    const snapshot = cloneSnapshot(rawSnapshot);

    isUndoRedoAction.current = true;
    historyIndexRef.current = targetIdx;
    setHistoryIndex(targetIdx);

    appStateRef.current = {
      focuses: snapshot.focuses,
      blurZones: snapshot.blurZones,
      maskShapes: snapshot.maskShapes,
      triangles: snapshot.triangles,
      calloutVignette: snapshot.calloutVignette,
      userGuides: snapshot.userGuides,
    };

    setFocuses(snapshot.focuses);
    setBlurZones(snapshot.blurZones);
    setMaskShapes(snapshot.maskShapes);
    setTriangles(snapshot.triangles);
    setCalloutVignette(snapshot.calloutVignette);
    setUserGuides(snapshot.userGuides);

    if (snapshot.focuses.length > 0) {
      if (!snapshot.focuses.find((f) => f.id === selectedFocusId)) {
        setSelectedFocusIds([snapshot.focuses[0].id]);
      }
    } else {
      setSelectedFocusIds([]);
    }
    if (selectedBlurId && !snapshot.blurZones.find((b) => b.id === selectedBlurId)) {
      setSelectedBlurIds([]);
    }
    if (selectedMaskId && !snapshot.maskShapes.find((m) => m.id === selectedMaskId)) {
      setSelectedMaskIds([]);
    }
    if (selectedTriangleId && !snapshot.triangles.find((t) => t.id === selectedTriangleId)) {
      setSelectedTriangleIds([]);
    }

    setTimeout(() => {
      isUndoRedoAction.current = false;
    }, 80);
  }, [selectedFocusId, selectedBlurId, selectedMaskId, selectedTriangleId]);

  const handleRedo = useCallback(() => {
    const curIdx = historyIndexRef.current;
    const prevHistory = historyRef.current;
    if (curIdx < 0 || curIdx >= prevHistory.length - 1) return;

    if (debounceRecordTimerRef.current) {
      clearTimeout(debounceRecordTimerRef.current);
      debounceRecordTimerRef.current = null;
    }

    const targetIdx = curIdx + 1;
    const rawSnapshot = prevHistory[targetIdx];
    if (!rawSnapshot) return;

    const snapshot = cloneSnapshot(rawSnapshot);

    isUndoRedoAction.current = true;
    historyIndexRef.current = targetIdx;
    setHistoryIndex(targetIdx);

    appStateRef.current = {
      focuses: snapshot.focuses,
      blurZones: snapshot.blurZones,
      maskShapes: snapshot.maskShapes,
      triangles: snapshot.triangles,
      calloutVignette: snapshot.calloutVignette,
      userGuides: snapshot.userGuides,
    };

    setFocuses(snapshot.focuses);
    setBlurZones(snapshot.blurZones);
    setMaskShapes(snapshot.maskShapes);
    setTriangles(snapshot.triangles);
    setCalloutVignette(snapshot.calloutVignette);
    setUserGuides(snapshot.userGuides);

    if (snapshot.focuses.length > 0) {
      if (!snapshot.focuses.find((f) => f.id === selectedFocusId)) {
        setSelectedFocusIds([snapshot.focuses[0].id]);
      }
    } else {
      setSelectedFocusIds([]);
    }
    if (selectedBlurId && !snapshot.blurZones.find((b) => b.id === selectedBlurId)) {
      setSelectedBlurIds([]);
    }
    if (selectedMaskId && !snapshot.maskShapes.find((m) => m.id === selectedMaskId)) {
      setSelectedMaskIds([]);
    }
    if (selectedTriangleId && !snapshot.triangles.find((t) => t.id === selectedTriangleId)) {
      setSelectedTriangleIds([]);
    }

    setTimeout(() => {
      isUndoRedoAction.current = false;
    }, 80);
  }, [selectedFocusId, selectedBlurId, selectedMaskId, selectedTriangleId]);

  // Add Focus Zone:
  // - Horizontal par défaut : width = 240px, height = 50px
  // - Vertical (option demandée) : width = 50px, height = 240px, magnétisé sur le bord gauche du screenshot
  const handleAddFocus = (orientation: 'horizontal' | 'vertical' = 'horizontal') => {
    const bounds = calculateCompositionBounds(image, focuses, globalStyles.workspaceWidth);
    const maxExisting = focuses.reduce((max, f) => Math.max(max, f.stepNumber || 0), 0);
    const nextStep = maxExisting > 0 ? maxExisting + 1 : focuses.length + 1;
    
    const isVert = orientation === 'vertical';
    const defaultFocusW = isVert ? 50 : 240;
    const defaultFocusH = isVert ? 240 : 50;

    let posX = 0;
    let posY = 0;

    if (isVert) {
      // Pour une zone verticale : son CENTRE est magnétisé par défaut avec le bord gauche du screenshot
      // Si le bord gauche a déjà un focus vertical, magnétiser avec le bord droit
      const hasLeftVert = focuses.some(
        (f) => (f.orientation === 'vertical' || f.height > f.width) && Math.abs((f.x + f.width / 2) - bounds.bgX) < 20
      );
      posX = hasLeftVert ? Math.round(bounds.bgX + bounds.bgWidth - defaultFocusW / 2) : Math.round(bounds.bgX - defaultFocusW / 2);
      
      let candidateY = Math.round(bounds.bgY + 20 + ((nextStep - 1) % 4) * 30);
      while (focuses.some((f) => Math.abs(f.y - candidateY) < 30 && Math.abs(f.x - posX) < 30)) {
        candidateY += 35;
      }
      posY = candidateY;
    } else {
      const phoneCenterX = bounds.bgX + bounds.bgWidth / 2;
      posX = Math.round(phoneCenterX - defaultFocusW / 2);

      // Calcul intelligent de la position Y pour ne jamais chevaucher une zone existante
      let candidateY = Math.round(bounds.bgY + 40 + (nextStep - 1) * 60);
      while (focuses.some((f) => Math.abs(f.y - candidateY) < 40 && Math.abs(f.x - posX) < 40)) {
        candidateY += 60;
      }
      if (candidateY > bounds.bgY + bounds.bgHeight - 50) {
        candidateY = Math.round(bounds.bgY + 20 + ((focuses.length * 25) % 150));
      }
      posY = candidateY;
    }

    const defaultZoom = isVert
      ? 1.2
      : (bounds.bgWidth > 0 ? Number((defaultFocusW / bounds.bgWidth).toFixed(3)) : 1.0);

    const newFocus: FocusZone = {
      id: `focus-${Date.now()}`,
      name: `Zone ${nextStep}`,
      x: posX,
      y: posY,
      width: defaultFocusW,
      height: defaultFocusH,
      orientation: orientation,
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
    recordHistory({ focuses: updated });

    if (sequentialImportNumberingRef.current) {
      setNextSequentialStep((prev) => Math.max(prev, nextStep + 1));
    }
  };

  const handleAddFocusAt = (
    x: number, 
    y: number, 
    w?: number, 
    h?: number, 
    label?: string, 
    orientation?: 'horizontal' | 'vertical'
  ) => {
    const bounds = calculateCompositionBounds(image, focuses, globalStyles.workspaceWidth);
    const maxExisting = focuses.reduce((max, f) => Math.max(max, f.stepNumber || 0), 0);
    const nextStep = maxExisting > 0 ? maxExisting + 1 : focuses.length + 1;
    const isVert = orientation === 'vertical' || (h !== undefined && w !== undefined && h > w);
    const defaultFocusW = isVert ? 50 : 240;
    const defaultFocusH = isVert ? 240 : 50;
    const focusW = w !== undefined ? w : defaultFocusW;
    const focusH = h !== undefined ? h : defaultFocusH;
    const defaultZoom = isVert
      ? 1.2
      : (bounds.bgWidth > 0 ? Number((focusW / bounds.bgWidth).toFixed(3)) : 1.0);
    const newFocus: FocusZone = {
      id: `focus-${Date.now()}`,
      name: label || `Zone ${nextStep}`,
      x,
      y,
      width: focusW,
      height: focusH,
      orientation: orientation || (focusH > focusW ? 'vertical' : 'horizontal'),
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
    recordHistory({ focuses: updated });

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
    recordHistory({ focuses: updated });
  };

  // Update selected focus
  const handleUpdateFocus = (updatedFields: Partial<FocusZone>) => {
    if (!selectedFocusId) return;
    setFocuses((prev) => {
      const next = prev.map((f) => {
        if (f.id === selectedFocusId) {
          return { ...f, ...updatedFields };
        }
        return f;
      });
      appStateRef.current.focuses = next;
      return next;
    });
    scheduleDebouncedRecordHistory();
  };

  // Delete focus and auto-renumber sequentially
  const handleDeleteFocus = (id: string) => {
    const remaining = focuses.filter((f) => f.id !== id);
    const updated = remaining.map((f, i) => ({
      ...f,
      name: f.name.startsWith('Zone ') ? `Zone ${i + 1}` : f.name,
      stepNumber: i + 1,
    }));
    setFocuses(updated);
    if (selectedFocusId === id) {
      setSelectedFocusIds(updated[0]?.id ? [updated[0].id] : []);
    }
    recordHistory({ focuses: updated });
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
    recordHistory({ focuses: updated });
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
    setSelectedFocusIds([duplicated.id]);
    recordHistory({ focuses: updated });
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
      blurRadius: 12,
      blurType: 'gaussian',
      opacity: 1,
      borderRadius: 4,
      layer: 'above',
    };
    const updated = [...blurZones, newBlur];
    setBlurZones(updated);
    handleSelectBlur(newBlur.id);
    recordHistory({ blurZones: updated });
  };

  const handleUpdateBlurZone = (id: string, updated: Partial<BlurZone>) => {
    setBlurZones((prev) => {
      const next = prev.map((b) => (b.id === id ? { ...b, ...updated } : b));
      appStateRef.current.blurZones = next;
      return next;
    });
    scheduleDebouncedRecordHistory();
  };

  const handleDeleteBlurZone = (id: string) => {
    const updated = blurZones.filter((b) => b.id !== id);
    setBlurZones(updated);
    setSelectedBlurIds((prev) => prev.filter((x) => x !== id));
    recordHistory({ blurZones: updated });
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
    const updated = [...blurZones, duplicated];
    setBlurZones(updated);
    handleSelectBlur(duplicated.id);
    recordHistory({ blurZones: updated });
  };

  // Mask Shape Management (Blue forms: default 40x40px, rounded corners 10px, #25465F)
  const handleAddMaskShape = (x?: number, y?: number) => {
    const bounds = calculateCompositionBounds(image, focuses, globalStyles.workspaceWidth);
    const posX = x !== undefined ? x : bounds.bgX + 20;
    const posY = y !== undefined ? y : bounds.bgY + 120;
    const newMask: MaskShape = {
      id: `mask-${Date.now()}`,
      name: `Masque ${maskShapes.length + 1}`,
      x: posX,
      y: posY,
      width: 40,
      height: 40,
      color: '#25465F', // Corporate blue mask #25465F
      opacity: 1,
      borderRadius: 10,
    };
    const updated = [...maskShapes, newMask];
    setMaskShapes(updated);
    handleSelectMask(newMask.id);
    recordHistory({ maskShapes: updated });
  };

  const handleUpdateMaskShape = (id: string, updated: Partial<MaskShape>) => {
    setMaskShapes((prev) => {
      const next = prev.map((m) => (m.id === id ? { ...m, ...updated } : m));
      appStateRef.current.maskShapes = next;
      return next;
    });
    scheduleDebouncedRecordHistory();
  };

  const handleDeleteMaskShape = (id: string) => {
    const updated = maskShapes.filter((m) => m.id !== id);
    setMaskShapes(updated);
    setSelectedMaskIds((prev) => prev.filter((x) => x !== id));
    recordHistory({ maskShapes: updated });
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
    const updated = [...maskShapes, duplicated];
    setMaskShapes(updated);
    handleSelectMask(duplicated.id);
    recordHistory({ maskShapes: updated });
  };

  const handleSplitMaskMultiplier = (id: string) => {
    const target = maskShapes.find((m) => m.id === id);
    if (!target || !target.multiplier?.enabled) return;
    const cols = Math.max(1, target.multiplier.cols || 2);
    const rows = Math.max(1, target.multiplier.rows || 2);
    const gapX = target.multiplier.gapX ?? 10;
    const gapY = target.multiplier.gapY ?? 10;
    const newShapes: MaskShape[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const itemX = target.x + c * (target.width + gapX);
        const itemY = target.y + r * (target.height + gapY);
        newShapes.push({
          ...target,
          id: `mask-${Date.now()}-${r}-${c}`,
          name: `${target.name} (${r + 1},${c + 1})`,
          x: Math.round(itemX),
          y: Math.round(itemY),
          multiplier: undefined,
        });
      }
    }
    const updated = [...maskShapes.filter((m) => m.id !== id), ...newShapes];
    setMaskShapes(updated);
    if (newShapes[0]) handleSelectMask(newShapes[0].id);
    recordHistory({ maskShapes: updated });
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
    const updated = [...triangles, newTriangle];
    setTriangles(updated);
    handleSelectTriangle(newTriangle.id);
    recordHistory({ triangles: updated });
  };

  const handleUpdateTriangle = (id: string, updated: Partial<TriangleShape>) => {
    setTriangles((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, ...updated } : t));
      appStateRef.current.triangles = next;
      return next;
    });
    scheduleDebouncedRecordHistory();
  };

  const handleDeleteTriangle = (id: string) => {
    const updated = triangles.filter((t) => t.id !== id);
    setTriangles(updated);
    setSelectedTriangleIds((prev) => prev.filter((x) => x !== id));
    recordHistory({ triangles: updated });
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
    const updated = [...triangles, duplicated];
    setTriangles(updated);
    handleSelectTriangle(duplicated.id);
    recordHistory({ triangles: updated });
  };

  // Batch Multi-Selection Operations (Moving, Deleting, Duplicating across all element types together)
  const handleBatchMove = useCallback((
    dx: number,
    dy: number,
    snapshot?: {
      focuses?: Array<{ id: string; x: number; y: number }>;
      blurs?: Array<{ id: string; x: number; y: number }>;
      masks?: Array<{ id: string; x: number; y: number }>;
      triangles?: Array<{ id: string; x: number; y: number }>;
    }
  ) => {
    // 1. Snapshot-based move (used for smooth, non-accumulating mouse dragging)
    if (snapshot) {
      if (snapshot.focuses && snapshot.focuses.length > 0) {
        const snapMap = new Map(snapshot.focuses.map((f) => [f.id, f]));
        setFocuses((prev) => {
          const next = prev.map((f) => {
            const s = snapMap.get(f.id);
            return s ? { ...f, x: Math.round(s.x + dx), y: Math.round(s.y + dy) } : f;
          });
          appStateRef.current.focuses = next;
          return next;
        });
      }
      if (snapshot.blurs && snapshot.blurs.length > 0) {
        const snapMap = new Map(snapshot.blurs.map((b) => [b.id, b]));
        setBlurZones((prev) => {
          const next = prev.map((b) => {
            const s = snapMap.get(b.id);
            return s ? { ...b, x: Math.round(s.x + dx), y: Math.round(s.y + dy) } : b;
          });
          appStateRef.current.blurZones = next;
          return next;
        });
      }
      if (snapshot.masks && snapshot.masks.length > 0) {
        const snapMap = new Map(snapshot.masks.map((m) => [m.id, m]));
        setMaskShapes((prev) => {
          const next = prev.map((m) => {
            const s = snapMap.get(m.id);
            return s ? { ...m, x: Math.round(s.x + dx), y: Math.round(s.y + dy) } : m;
          });
          appStateRef.current.maskShapes = next;
          return next;
        });
      }
      if (snapshot.triangles && snapshot.triangles.length > 0) {
        const snapMap = new Map(snapshot.triangles.map((t) => [t.id, t]));
        setTriangles((prev) => {
          const next = prev.map((t) => {
            const s = snapMap.get(t.id);
            return s ? { ...t, x: Math.round(s.x + dx), y: Math.round(s.y + dy) } : t;
          });
          appStateRef.current.triangles = next;
          return next;
        });
      }
      return;
    }

    // 2. Incremental step delta fallback (used for keyboard arrow key nudges)
    if (dx === 0 && dy === 0) return;
    const fIds = selectedFocusIds.length > 0 ? selectedFocusIds : (selectedFocusId ? [selectedFocusId] : []);
    const bIds = selectedBlurIds.length > 0 ? selectedBlurIds : (selectedBlurId ? [selectedBlurId] : []);
    const mIds = selectedMaskIds.length > 0 ? selectedMaskIds : (selectedMaskId ? [selectedMaskId] : []);
    const tIds = selectedTriangleIds.length > 0 ? selectedTriangleIds : (selectedTriangleId ? [selectedTriangleId] : []);

    if (fIds.length > 0) {
      setFocuses((prev) => {
        const next = prev.map((f) => fIds.includes(f.id) ? { ...f, x: Math.round(f.x + dx), y: Math.round(f.y + dy) } : f);
        appStateRef.current.focuses = next;
        return next;
      });
    }
    if (bIds.length > 0) {
      setBlurZones((prev) => {
        const next = prev.map((b) => bIds.includes(b.id) ? { ...b, x: Math.round(b.x + dx), y: Math.round(b.y + dy) } : b);
        appStateRef.current.blurZones = next;
        return next;
      });
    }
    if (mIds.length > 0) {
      setMaskShapes((prev) => {
        const next = prev.map((m) => mIds.includes(m.id) ? { ...m, x: Math.round(m.x + dx), y: Math.round(m.y + dy) } : m);
        appStateRef.current.maskShapes = next;
        return next;
      });
    }
    if (tIds.length > 0) {
      setTriangles((prev) => {
        const next = prev.map((t) => tIds.includes(t.id) ? { ...t, x: Math.round(t.x + dx), y: Math.round(t.y + dy) } : t);
        appStateRef.current.triangles = next;
        return next;
      });
    }
  }, [selectedFocusIds, selectedFocusId, selectedBlurIds, selectedBlurId, selectedMaskIds, selectedMaskId, selectedTriangleIds, selectedTriangleId]);

  const handleBatchMoveEnd = useCallback(() => {
    recordHistory();
  }, [recordHistory]);

  const handleBatchDelete = useCallback(() => {
    const fIds = selectedFocusIds.length > 0 ? selectedFocusIds : (selectedFocusId ? [selectedFocusId] : []);
    const bIds = selectedBlurIds.length > 0 ? selectedBlurIds : (selectedBlurId ? [selectedBlurId] : []);
    const mIds = selectedMaskIds.length > 0 ? selectedMaskIds : (selectedMaskId ? [selectedMaskId] : []);
    const tIds = selectedTriangleIds.length > 0 ? selectedTriangleIds : (selectedTriangleId ? [selectedTriangleId] : []);

    let newFocuses = focuses;
    let newBlurs = blurZones;
    let newMasks = maskShapes;
    let newTriangles = triangles;

    if (fIds.length > 0) {
      const remaining = focuses.filter((f) => !fIds.includes(f.id));
      newFocuses = remaining.map((f, i) => ({
        ...f,
        name: f.name.startsWith('Zone ') ? `Zone ${i + 1}` : f.name,
        stepNumber: i + 1,
      }));
      setFocuses(newFocuses);
      setSelectedFocusIds([]);
    }
    if (bIds.length > 0) {
      newBlurs = blurZones.filter((b) => !bIds.includes(b.id));
      setBlurZones(newBlurs);
      setSelectedBlurIds([]);
    }
    if (mIds.length > 0) {
      newMasks = maskShapes.filter((m) => !mIds.includes(m.id));
      setMaskShapes(newMasks);
      setSelectedMaskIds([]);
    }
    if (tIds.length > 0) {
      newTriangles = triangles.filter((t) => !tIds.includes(t.id));
      setTriangles(newTriangles);
      setSelectedTriangleIds([]);
    }

    recordHistory({
      focuses: newFocuses,
      blurZones: newBlurs,
      maskShapes: newMasks,
      triangles: newTriangles,
    });
  }, [selectedFocusIds, selectedFocusId, selectedBlurIds, selectedBlurId, selectedMaskIds, selectedMaskId, selectedTriangleIds, selectedTriangleId, focuses, blurZones, maskShapes, triangles, recordHistory]);

  const handleBatchDuplicate = useCallback(() => {
    const fIds = selectedFocusIds.length > 0 ? selectedFocusIds : (selectedFocusId ? [selectedFocusId] : []);
    const bIds = selectedBlurIds.length > 0 ? selectedBlurIds : (selectedBlurId ? [selectedBlurId] : []);
    const mIds = selectedMaskIds.length > 0 ? selectedMaskIds : (selectedMaskId ? [selectedMaskId] : []);
    const tIds = selectedTriangleIds.length > 0 ? selectedTriangleIds : (selectedTriangleId ? [selectedTriangleId] : []);

    const newFocusIds: string[] = [];
    const newBlurIds: string[] = [];
    const newMaskIds: string[] = [];
    const newTriangleIds: string[] = [];

    let updatedFocuses = focuses;
    let updatedBlurs = blurZones;
    let updatedMasks = maskShapes;
    let updatedTriangles = triangles;

    if (fIds.length > 0) {
      const clones: FocusZone[] = [];
      let nextStep = focuses.reduce((max, f) => Math.max(max, f.stepNumber || 0), 0) + 1;
      focuses.filter((f) => fIds.includes(f.id)).forEach((f) => {
        const id = `focus-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        newFocusIds.push(id);
        clones.push({
          ...f,
          id,
          name: `${f.name} (copie)`,
          x: f.x + 15,
          y: f.y + 15,
          stepNumber: nextStep++,
        });
      });
      updatedFocuses = [...focuses, ...clones];
      setFocuses(updatedFocuses);
    }

    if (bIds.length > 0) {
      const clones: BlurZone[] = [];
      blurZones.filter((b) => bIds.includes(b.id)).forEach((b) => {
        const id = `blur-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        newBlurIds.push(id);
        clones.push({
          ...b,
          id,
          name: `${b.name} (copie)`,
          x: b.x + 15,
          y: b.y + 15,
        });
      });
      updatedBlurs = [...blurZones, ...clones];
      setBlurZones(updatedBlurs);
    }

    if (mIds.length > 0) {
      const clones: MaskShape[] = [];
      maskShapes.filter((m) => mIds.includes(m.id)).forEach((m) => {
        const id = `mask-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        newMaskIds.push(id);
        clones.push({
          ...m,
          id,
          name: `${m.name} (copie)`,
          x: m.x + 15,
          y: m.y + 15,
        });
      });
      updatedMasks = [...maskShapes, ...clones];
      setMaskShapes(updatedMasks);
    }

    if (tIds.length > 0) {
      const clones: TriangleShape[] = [];
      triangles.filter((t) => tIds.includes(t.id)).forEach((t) => {
        const id = `triangle-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        newTriangleIds.push(id);
        clones.push({
          ...t,
          id,
          name: `${t.name} (copie)`,
          x: t.x + 15,
          y: t.y + 15,
        });
      });
      updatedTriangles = [...triangles, ...clones];
      setTriangles(updatedTriangles);
    }

    setSelectedFocusIds(newFocusIds);
    setSelectedBlurIds(newBlurIds);
    setSelectedMaskIds(newMaskIds);
    setSelectedTriangleIds(newTriangleIds);

    recordHistory({
      focuses: updatedFocuses,
      blurZones: updatedBlurs,
      maskShapes: updatedMasks,
      triangles: updatedTriangles,
    });
  }, [selectedFocusIds, selectedFocusId, selectedBlurIds, selectedBlurId, selectedMaskIds, selectedMaskId, selectedTriangleIds, selectedTriangleId, focuses, blurZones, maskShapes, triangles, recordHistory]);

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
        const disabledCallout = { ...prev!, enabled: false };
        appStateRef.current.calloutVignette = disabledCallout;
        recordHistory({ calloutVignette: disabledCallout });
        return disabledCallout;
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

      let nextCallout: CalloutVignette;
      if (prev) {
        nextCallout = {
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
      } else {
        // Initialize default Callout Vignette (default 100px)
        nextCallout = {
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
      }
      appStateRef.current.calloutVignette = nextCallout;
      recordHistory({ calloutVignette: nextCallout });
      return nextCallout;
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

      appStateRef.current.calloutVignette = next;
      return next;
    });
    scheduleDebouncedRecordHistory();
  };

  // Add Horizontal Guide
  const handleAddGuideH = () => {
    const selected = focuses.find((f) => f.id === selectedFocusId);
    const bounds = calculateCompositionBounds(image, focuses, globalStyles.workspaceWidth);
    const pos = selected ? selected.y + selected.height / 2 : bounds.bgY + bounds.bgHeight / 2;
    const newGuide: UserGuide = { id: `guide-h-${Date.now()}`, type: 'horizontal', position: Math.round(pos) };
    const updated = [...userGuides, newGuide];
    setUserGuides(updated);
    recordHistory({ userGuides: updated });
  };

  // Add Vertical Guide
  const handleAddGuideV = () => {
    const selected = focuses.find((f) => f.id === selectedFocusId);
    const bounds = calculateCompositionBounds(image, focuses, globalStyles.workspaceWidth);
    const pos = selected ? selected.x + selected.width / 2 : bounds.bgX + bounds.bgWidth / 2;
    const newGuide: UserGuide = { id: `guide-v-${Date.now()}`, type: 'vertical', position: Math.round(pos) };
    const updated = [...userGuides, newGuide];
    setUserGuides(updated);
    recordHistory({ userGuides: updated });
  };

  const handleAddCustomGuide = (type: 'horizontal' | 'vertical', position: number) => {
    const newGuide: UserGuide = { id: `guide-${type[0]}-${Date.now()}`, type, position: Math.round(position) };
    const updated = [...userGuides, newGuide];
    setUserGuides(updated);
    recordHistory({ userGuides: updated });
  };

  const handleUpdateGuide = (id: string, position: number) => {
    setUserGuides((prev) => {
      const updated = prev.map((g) => (g.id === id ? { ...g, position: Math.round(position) } : g));
      return updated;
    });
    scheduleDebouncedRecordHistory();
  };

  const handleDeleteGuide = (id: string) => {
    const updated = userGuides.filter((g) => g.id !== id);
    setUserGuides(updated);
    recordHistory({ userGuides: updated });
  };

  const handleClearAllGuides = () => {
    setUserGuides([]);
    recordHistory({ userGuides: [] });
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
    recordHistory({ userGuides: [], blurZones: [], maskShapes: [] });
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
        handleBatchDuplicate();
        return;
      }

      // Delete: Delete or Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleBatchDelete();
        return;
      }

      // Escape: Quitter le recadrage interne, la prévisualisation ou désélectionner
      if (e.key === 'Escape') {
        if (internalFramingFocusId) {
          setInternalFramingFocusId(null);
          return;
        }
        if (isPreviewMode) {
          setIsPreviewMode(false);
          return;
        }
        handleClearSelection();
        setActiveTool('select');
        return;
      }

      // Enter: Valider et quitter le mode recadrage interne
      if (e.key === 'Enter' && internalFramingFocusId) {
        setInternalFramingFocusId(null);
        return;
      }

      // Add Focus: 'a' / 'A' (strictly without modifier keys to prevent unintended creation)
      if ((e.key === 'a' || e.key === 'A') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleAddFocus();
        return;
      }

      // Basculer orientation Verticale (50x240) / Horizontale (240x50): 'v' / 'V'
      if ((e.key === 'v' || e.key === 'V') && !e.ctrlKey && !e.metaKey && !e.altKey && selectedFocusId) {
        e.preventDefault();
        const curFocus = focuses.find((f) => f.id === selectedFocusId);
        if (curFocus) {
          const isV = curFocus.orientation === 'vertical' || curFocus.height > curFocus.width;
          const bounds = calculateCompositionBounds(image, focuses, globalStyles.workspaceWidth);
          if (isV) {
            const phoneCenterX = bounds.bgX + bounds.bgWidth / 2;
            handleUpdateFocus({
              orientation: 'horizontal',
              width: 240,
              height: 50,
              x: Math.round(phoneCenterX - 240 / 2),
            });
          } else {
            handleUpdateFocus({
              orientation: 'vertical',
              width: 50,
              height: 240,
              x: Math.round(bounds.bgX - 50 / 2),
              zoom: 1.2,
            });
          }
        }
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

      // Arrow keys to nudge selected object(s) (Photoshop style: 1px by default, 10px with Shift)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const step = e.shiftKey ? 10 : 1;
        let dx = 0;
        let dy = 0;
        if (e.key === 'ArrowUp') dy = -step;
        if (e.key === 'ArrowDown') dy = step;
        if (e.key === 'ArrowLeft') dx = -step;
        if (e.key === 'ArrowRight') dx = step;

        let handled = false;

        const hasSelectedShape = Boolean(
          selectedFocusIds.length > 0 ||
          selectedBlurIds.length > 0 ||
          selectedMaskIds.length > 0 ||
          selectedTriangleIds.length > 0 ||
          selectedBlurId ||
          selectedMaskId ||
          selectedTriangleId ||
          (selectedFocusId && !calloutVignette?.enabled)
        );

        // Si une ou plusieurs formes sont sélectionnées (masque, triangle, flou, focus), les flèches déplacent ces formes !
        if (hasSelectedShape) {
          handleBatchMove(dx, dy);
          handled = true;
          scheduleDebouncedRecordHistory();
        } else if (calloutVignette && calloutVignette.enabled && selectedCalloutPart) {
          // En mode Callout, uniquement si la cible loupe ou la vignette est explicitement sélectionnée
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
            handleUpdateCallout({
              sourceX: Math.round(((calloutVignette.sourceX ?? 0) + cdx) * 10) / 10,
              sourceY: Math.round(((calloutVignette.sourceY ?? 0) + cdy) * 10) / 10,
            });
            handled = true;
          }
        } else if (internalFramingFocusId && selectedFocusId) {
          const current = focuses.find((f) => f.id === selectedFocusId);
          if (current) {
            handleUpdateFocus({
              sourceOffsetX: Math.round((current.sourceOffsetX || 0) + dx),
              sourceOffsetY: Math.round((current.sourceOffsetY || 0) + dy),
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
    selectedFocusIds,
    selectedBlurIds,
    selectedMaskIds,
    selectedTriangleIds,
    internalFramingFocusId,
    selectedBlurId,
    selectedMaskId,
    selectedTriangleId,
    isPreviewMode,
    historyIndex,
    history,
    calloutVignette,
    selectedCalloutPart,
    handleBatchMove,
    handleBatchDelete,
    handleBatchDuplicate,
    handleClearSelection,
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
          selectedFocusIds={selectedFocusIds}
          selectedBlurIds={selectedBlurIds}
          selectedMaskIds={selectedMaskIds}
          selectedTriangleIds={selectedTriangleIds}
          onSelectFocus={handleSelectFocus}
          onUpdateFocus={handleUpdateFocus}
          onRenumberFocuses={handleAutoRenumberFocuses}
          internalFramingFocusId={internalFramingFocusId}
          onToggleInternalFraming={handleToggleInternalFraming}
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
          onSelectMultiple={handleSelectMultiple}
          onClearSelection={handleClearSelection}
          onBatchMove={handleBatchMove}
          onBatchMoveEnd={handleBatchMoveEnd}
          onBatchDelete={handleBatchDelete}
          onBatchDuplicate={handleBatchDuplicate}
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
          onAddCustomGuide={handleAddCustomGuide}
          onUpdateGuide={handleUpdateGuide}
          onDeleteGuide={handleDeleteGuide}
          onClearAllGuides={handleClearAllGuides}
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
          selectedFocusIds={selectedFocusIds}
          selectedBlurIds={selectedBlurIds}
          selectedMaskIds={selectedMaskIds}
          selectedTriangleIds={selectedTriangleIds}
          onSelectMultiple={handleSelectMultiple}
          onClearSelection={handleClearSelection}
          onBatchDelete={handleBatchDelete}
          onBatchDuplicate={handleBatchDuplicate}
          onSelectFocus={handleSelectFocus}
          onAddFocus={handleAddFocus}
          onUpdateFocus={handleUpdateFocus}
          onDeleteFocus={handleDeleteFocus}
          onDuplicateFocus={handleDuplicateFocus}
          onCenterFocusHorizontally={handleCenterFocusHorizontally}
          onRenumberFocuses={handleAutoRenumberFocuses}
          internalFramingFocusId={internalFramingFocusId}
          onToggleInternalFraming={handleToggleInternalFraming}
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
          onSplitMaskMultiplier={handleSplitMaskMultiplier}
          triangles={triangles}
          selectedTriangleId={selectedTriangleId}
          onSelectTriangle={handleSelectTriangle}
          onAddTriangle={() => handleAddTriangle()}
          onUpdateTriangle={handleUpdateTriangle}
          onDeleteTriangle={handleDeleteTriangle}
          calloutVignette={calloutVignette}
          onUpdateCallout={handleUpdateCallout}
          onToggleCallout={handleToggleCallout}
          activeTool={activeTool}
          onSelectTool={setActiveTool}
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
          userGuides={userGuides}
          onAddGuideH={handleAddGuideH}
          onAddGuideV={handleAddGuideV}
          onAddCustomGuide={handleAddCustomGuide}
          onUpdateGuide={handleUpdateGuide}
          onDeleteGuide={handleDeleteGuide}
          onClearAllGuides={handleClearAllGuides}
          sequentialImportNumbering={sequentialImportNumbering}
          onToggleSequentialImportNumbering={handleToggleSequentialImportNumbering}
          nextSequentialStep={nextSequentialStep}
          onChangeNextSequentialStep={setNextSequentialStep}
          onResetSequentialCounter={handleResetSequentialCounter}
        />
      </div>

      {/* Visual Preview Modal with Zoom & Pan */}
      <PreviewModal
        isOpen={isPreviewMode}
        onClose={() => setIsPreviewMode(false)}
        image={image}
        focuses={focuses}
        arrows={arrows}
        globalStyles={globalStyles}
        blurZones={blurZones}
        maskShapes={maskShapes}
        triangles={triangles}
        calloutVignette={calloutVignette}
        onCopyClipboard={handleCopyClipboard}
        onExportPng={handleExportPng}
        copied={copied}
        isDarkMode={isDarkMode}
      />

      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
