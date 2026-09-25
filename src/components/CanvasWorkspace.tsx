import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  FocusZone, 
  LoadedImage, 
  ResizeHandle, 
  DragState, 
  DetectedElement,
  SmartGuide,
  GlobalStyleSettings,
  AnnotationArrow,
  UserGuide,
  BlurZone,
  MaskShape,
  TriangleShape,
  CalloutVignette
} from '../types';
import { 
  drawComposition, 
  calculateCompositionBounds, 
  getFocusHandles 
} from '../utils/canvasRenderer';
import { TopSceneBar } from './TopSceneBar';
import { VerticalToolPalette, ToolType } from './VerticalToolPalette';
import { TopRuler, LeftRuler } from './ExternalRulers';
import { Eye, X } from 'lucide-react';

interface CanvasWorkspaceProps {
  image: LoadedImage | null;
  focuses: FocusZone[];
  selectedFocusId: string | null;
  onSelectFocus: (id: string | null) => void;
  onUpdateFocus: (updated: Partial<FocusZone>) => void;
  onRenumberFocuses?: () => void;
  onAddFocus: (orientation?: 'horizontal' | 'vertical') => void;
  onDeleteFocus?: (id: string) => void;
  onDuplicateFocus?: (id: string) => void;
  onAddFocusAt: (x: number, y: number, w?: number, h?: number, label?: string) => void;
  // Blur Zones
  blurZones: BlurZone[];
  selectedBlurId: string | null;
  onSelectBlur: (id: string | null) => void;
  onAddBlur: () => void;
  onAddBlurAt: (x: number, y: number) => void;
  onUpdateBlur: (id: string, updated: Partial<BlurZone>) => void;
  onDeleteBlur: (id: string) => void;
  onDuplicateBlur?: (id: string) => void;
  // Mask Shapes
  maskShapes: MaskShape[];
  selectedMaskId: string | null;
  onSelectMask: (id: string | null) => void;
  onAddMask: () => void;
  onAddMaskAt: (x: number, y: number) => void;
  onUpdateMask: (id: string, updated: Partial<MaskShape>) => void;
  onDeleteMask: (id: string) => void;
  onDuplicateMask?: (id: string) => void;
  // Triangle Shapes (15x13px)
  triangles?: TriangleShape[];
  selectedTriangleId?: string | null;
  onSelectTriangle?: (id: string | null) => void;
  onAddTriangle?: () => void;
  onAddTriangleAt?: (x: number, y: number) => void;
  onUpdateTriangle?: (id: string, updated: Partial<TriangleShape>) => void;
  onDeleteTriangle?: (id: string) => void;
  onDuplicateTriangle?: (id: string) => void;
  // Callout Vignette
  calloutVignette?: CalloutVignette | null;
  selectedCalloutPart?: 'source' | 'vignette' | null;
  onSelectCalloutPart?: (part: 'source' | 'vignette' | null) => void;
  onUpdateCallout?: (updated: Partial<CalloutVignette>) => void;
  onToggleCallout?: () => void;
  // Active Tool
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  // Preview Mode
  isPreviewMode: boolean;
  onTogglePreview: () => void;
  // Export trigger from toolbar
  onExportClick?: () => void;
  isExporting?: boolean;
  // Drop & import
  onFileDrop: (file: File) => void;
  detectedElements: DetectedElement[];
  showDetectedOverlay: boolean;
  onSelectDetected: (el: DetectedElement) => void;
  globalStyles: GlobalStyleSettings;
  onUpdateGlobalStyles: (updated: Partial<GlobalStyleSettings>) => void;
  arrows: AnnotationArrow[];
  onToggleArrow: () => void;
  onUpdateArrow?: (updated: Partial<AnnotationArrow>) => void;
  userGuides: UserGuide[];
  onAddGuideH: () => void;
  onAddGuideV: () => void;
  onImportClick: () => void;
  // Workspace centering & reset
  resetWorkspaceTrigger?: number;
  onCenterWorkspace?: () => void;
  // Internal screenshot framing inside focus zone
  internalFramingFocusId?: string | null;
  onToggleInternalFraming?: (id: string | null) => void;
  // History
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  isDarkMode?: boolean;
}

export const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({
  image,
  focuses,
  selectedFocusId,
  onSelectFocus,
  onUpdateFocus,
  onRenumberFocuses,
  onAddFocus,
  onDeleteFocus,
  onDuplicateFocus,
  onAddFocusAt,
  blurZones,
  selectedBlurId,
  onSelectBlur,
  onAddBlur,
  onAddBlurAt,
  onUpdateBlur,
  onDeleteBlur,
  onDuplicateBlur,
  maskShapes,
  selectedMaskId,
  onSelectMask,
  onAddMask,
  onAddMaskAt,
  onUpdateMask,
  onDeleteMask,
  onDuplicateMask,
  triangles = [],
  selectedTriangleId = null,
  onSelectTriangle,
  onAddTriangle,
  onAddTriangleAt,
  onUpdateTriangle,
  onDeleteTriangle,
  onDuplicateTriangle,
  calloutVignette,
  selectedCalloutPart = null,
  onSelectCalloutPart,
  onUpdateCallout,
  onToggleCallout,
  activeTool,
  onSelectTool,
  isPreviewMode,
  onTogglePreview,
  onExportClick = () => {},
  isExporting = false,
  onFileDrop,
  detectedElements,
  showDetectedOverlay,
  onSelectDetected,
  globalStyles,
  onUpdateGlobalStyles,
  arrows,
  onToggleArrow,
  onUpdateArrow,
  userGuides,
  onAddGuideH,
  onAddGuideV,
  onImportClick,
  resetWorkspaceTrigger,
  onCenterWorkspace: externalCenterWorkspace,
  internalFramingFocusId = null,
  onToggleInternalFraming,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  isDarkMode = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Viewport Zoom & Pan (Photoshop-like)
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanMode, setIsPanMode] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isAltPressed, setIsAltPressed] = useState<boolean>(false);

  // Drag & Resize State
  const [dragState, setDragState] = useState<DragState | null>(null);
  // Internal screenshot framing drag (Alt + drag inside focus zone)
  const [dragFramingState, setDragFramingState] = useState<{
    focusId: string;
    startX: number;
    startY: number;
    initialOffsetX: number;
    initialOffsetY: number;
  } | null>(null);
  const [dragBlurState, setDragBlurState] = useState<{
    id: string;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    initialW: number;
    initialH: number;
    handle: ResizeHandle | null;
  } | null>(null);
  const [dragMaskState, setDragMaskState] = useState<{
    id: string;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    initialW: number;
    initialH: number;
    handle: ResizeHandle | null;
  } | null>(null);
  const [dragTriangleState, setDragTriangleState] = useState<{
    id: string;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);

  // Callout Vignette drag state (drag source target on screen or drag vignette offsetY)
  const [internalSelectedCalloutPart, setInternalSelectedCalloutPart] = useState<'source' | 'vignette' | null>(null);
  const activeSelectedCalloutPart = selectedCalloutPart !== undefined ? selectedCalloutPart : internalSelectedCalloutPart;
  const updateSelectedCallout = (part: 'source' | 'vignette' | null) => {
    setInternalSelectedCalloutPart(part);
    onSelectCalloutPart?.(part);
  };
  const [hoveredCalloutPart, setHoveredCalloutPart] = useState<'source' | 'vignette' | null>(null);
  const [dragCalloutState, setDragCalloutState] = useState<{
    part: 'source' | 'vignette';
    startX: number;
    startY: number;
    initialSourceX: number;
    initialSourceY: number;
    initialOffsetY: number;
  } | null>(null);

  // Hover states for fluid visual feedback
  const [hoveredFocusId, setHoveredFocusId] = useState<string | null>(null);
  const [hoveredBlurId, setHoveredBlurId] = useState<string | null>(null);
  const [hoveredMaskId, setHoveredMaskId] = useState<string | null>(null);
  const [hoveredTriangleId, setHoveredTriangleId] = useState<string | null>(null);
  const [hoveredHandle, setHoveredHandle] = useState<ResizeHandle | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);

  // Dynamic Alignment Guides
  const [activeGuides, setActiveGuides] = useState<SmartGuide[]>([]);
  const [canvasMousePos, setCanvasMousePos] = useState<{ x: number; y: number } | null>(null);

  // Key sequence buffer for "Z3" shortcut (User request: "lorsque j'appuie sur 'Z3' je veux que la petite fenêtre des zones s'ouvre")
  const keySequenceRef = useRef<string>('');
  const sequenceTimerRef = useRef<number | null>(null);

  // Key listener for Spacebar, Alt key, Escape (preview), and "Z3" shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
      }

      if (e.key === 'Alt') setIsAltPressed(true);
      if (e.key === 'Escape' && isPreviewMode && onTogglePreview) {
        onTogglePreview();
        return;
      }

      // Check Z3 shortcut: 'z' or 'Z' followed by '3' (or direct combination)
      const keyUpper = e.key.toUpperCase();
      if (keyUpper === 'Z') {
        keySequenceRef.current = 'Z';
        if (sequenceTimerRef.current) window.clearTimeout(sequenceTimerRef.current);
        sequenceTimerRef.current = window.setTimeout(() => {
          keySequenceRef.current = '';
        }, 1500);
      } else if (keySequenceRef.current === 'Z' && /^[0-9]$/.test(keyUpper)) {
        e.preventDefault();
        const zoneNum = parseInt(keyUpper, 10);
        const targetFocus = focuses.find((f) => (f.stepNumber || 1) === zoneNum) || focuses[zoneNum - 1];
        if (targetFocus) {
          onSelectFocus(targetFocus.id);
        }
        keySequenceRef.current = '';
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setIsSpacePressed(false);
      if (e.key === 'Alt') setIsAltPressed(false);
    };

    // Global mouseup and window blur so dragging / panning never gets stuck
    const handleGlobalMouseUp = () => {
      setIsPanning(false);
      setDragState(null);
      setDragFramingState(null);
      setDragBlurState(null);
      setDragMaskState(null);
      setDragTriangleState(null);
      setDragCalloutState(null);
      setActiveGuides([]);
    };

    const handleWindowBlur = () => {
      setIsAltPressed(false);
      setIsSpacePressed(false);
      setIsPanning(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isPreviewMode, onTogglePreview, focuses, onSelectFocus]);

  // Center workspace function (Reset zoom to 100% and pan to 0,0)
  const handleCenterWorkspace = useCallback(() => {
    setPanOffset({ x: 0, y: 0 });
    setZoomLevel(1);
    externalCenterWorkspace?.();
  }, [externalCenterWorkspace]);

  // Effect to handle external trigger for workspace recentering
  useEffect(() => {
    if (resetWorkspaceTrigger) {
      setPanOffset({ x: 0, y: 0 });
      setZoomLevel(1);
    }
  }, [resetWorkspaceTrigger]);

  // Calculate composition bounds with adjustable workspace width up to 500px, or dynamic Callout mode bounds
  const bounds = calculateCompositionBounds(image, focuses, globalStyles.workspaceWidth, calloutVignette);

  // Synchronize and draw on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (canvas.width !== bounds.canvasWidth || canvas.height !== bounds.canvasHeight) {
      canvas.width = bounds.canvasWidth;
      canvas.height = bounds.canvasHeight;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawComposition(ctx, image, focuses, {
      interactive: !isPreviewMode,
      selectedFocusId: isPreviewMode ? null : selectedFocusId,
      hoveredFocusId: isPreviewMode ? null : hoveredFocusId,
      hoveredHandle: isPreviewMode ? null : hoveredHandle,
      internalFramingFocusId: isPreviewMode ? null : internalFramingFocusId,
      smartGuides: isPreviewMode ? [] : activeGuides,
      userGuides: isPreviewMode ? [] : userGuides,
      globalStyles,
      showGuides: !isPreviewMode && globalStyles.showGuides !== false,
      showRulers: !isPreviewMode && globalStyles.showRulers !== false,
      blurZones,
      selectedBlurId: isPreviewMode ? null : selectedBlurId,
      hoveredBlurId: isPreviewMode ? null : hoveredBlurId,
      maskShapes,
      selectedMaskId: isPreviewMode ? null : selectedMaskId,
      hoveredMaskId: isPreviewMode ? null : hoveredMaskId,
      triangles,
      selectedTriangleId: isPreviewMode ? null : selectedTriangleId,
      hoveredTriangleId: isPreviewMode ? null : hoveredTriangleId,
      calloutVignette,
      selectedCalloutPart: isPreviewMode ? null : activeSelectedCalloutPart,
      hoveredCalloutPart: isPreviewMode ? null : hoveredCalloutPart,
      previewMode: isPreviewMode,
    });
  }, [
    image, 
    focuses, 
    selectedFocusId, 
    hoveredFocusId, 
    hoveredHandle, 
    bounds, 
    activeGuides, 
    userGuides, 
    globalStyles,
    blurZones,
    selectedBlurId,
    hoveredBlurId,
    maskShapes,
    selectedMaskId,
    hoveredMaskId,
    triangles,
    selectedTriangleId,
    hoveredTriangleId,
    calloutVignette,
    activeSelectedCalloutPart,
    hoveredCalloutPart,
    isPreviewMode
  ]);

  // Convert client viewport coordinates to Canvas composition coordinates
  const clientToCanvasCoord = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);
    return { x, y };
  }, []);

  // Hit-test handles of the selected focus (disabled when in Callout mode)
  const getHandleAtCoord = (cx: number, cy: number, focus: FocusZone): ResizeHandle | null => {
    if (calloutVignette && calloutVignette.enabled) return null;
    const handles = getFocusHandles(focus);
    const tolerance = 9;
    for (const key of Object.keys(handles) as ResizeHandle[]) {
      const pt = handles[key];
      if (Math.abs(cx - pt.x) <= tolerance && Math.abs(cy - pt.y) <= tolerance) {
        return key;
      }
    }
    return null;
  };

  // Generic handle hit test
  const getGenericHandleAtCoord = (
    cx: number, 
    cy: number, 
    rect: { x: number; y: number; width: number; height: number }
  ): ResizeHandle | null => {
    const tolerance = 8;
    const handles: Record<ResizeHandle, { x: number; y: number }> = {
      nw: { x: rect.x, y: rect.y },
      n: { x: rect.x + rect.width / 2, y: rect.y },
      ne: { x: rect.x + rect.width, y: rect.y },
      w: { x: rect.x, y: rect.y + rect.height / 2 },
      e: { x: rect.x + rect.width, y: rect.y + rect.height / 2 },
      sw: { x: rect.x, y: rect.y + rect.height },
      s: { x: rect.x + rect.width / 2, y: rect.y + rect.height },
      se: { x: rect.x + rect.width, y: rect.y + rect.height },
    };
    for (const key of Object.keys(handles) as ResizeHandle[]) {
      const pt = handles[key];
      if (Math.abs(cx - pt.x) <= tolerance && Math.abs(cy - pt.y) <= tolerance) {
        return key;
      }
    }
    return null;
  };

  // Hit-test focus bodies (disabled when Callout vignette is active, as vignette mode visually replaces base focus zones)
  const getFocusAtCoord = (cx: number, cy: number): FocusZone | null => {
    if (calloutVignette && calloutVignette.enabled) return null;
    for (let i = focuses.length - 1; i >= 0; i--) {
      const f = focuses[i];
      if (cx >= f.x && cx <= f.x + f.width && cy >= f.y && cy <= f.y + f.height) {
        return f;
      }
    }
    return null;
  };

  // Hit-test blur zones
  const getBlurAtCoord = (cx: number, cy: number): BlurZone | null => {
    for (let i = blurZones.length - 1; i >= 0; i--) {
      const b = blurZones[i];
      if (cx >= b.x && cx <= b.x + b.width && cy >= b.y && cy <= b.y + b.height) {
        return b;
      }
    }
    return null;
  };

  // Hit-test mask shapes
  const getMaskAtCoord = (cx: number, cy: number): MaskShape | null => {
    for (let i = maskShapes.length - 1; i >= 0; i--) {
      const m = maskShapes[i];
      if (m.multiplier?.enabled) {
        const cols = Math.max(1, m.multiplier.cols || 2);
        const rows = Math.max(1, m.multiplier.rows || 2);
        const gapX = m.multiplier.gapX ?? 10;
        const gapY = m.multiplier.gapY ?? 10;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const ix = m.x + c * (m.width + gapX);
            const iy = m.y + r * (m.height + gapY);
            if (cx >= ix && cx <= ix + m.width && cy >= iy && cy <= iy + m.height) {
              return m;
            }
          }
        }
      } else {
        if (cx >= m.x && cx <= m.x + m.width && cy >= m.y && cy <= m.y + m.height) {
          return m;
        }
      }
    }
    return null;
  };

  // Hit-test triangles (15x13px)
  const getTriangleAtCoord = (cx: number, cy: number): TriangleShape | null => {
    const pad = 4; // click tolerance padding
    for (let i = triangles.length - 1; i >= 0; i--) {
      const t = triangles[i];
      const w = t.width || 15;
      const h = t.height || 13;
      if (cx >= t.x - pad && cx <= t.x + w + pad && cy >= t.y - pad && cy <= t.y + h + pad) {
        return t;
      }
    }
    return null;
  };

  // Hit-test Callout parts: source target on screen or vignette bubble on left
  const getCalloutPartAtCoord = (cx: number, cy: number): 'source' | 'vignette' | null => {
    if (!calloutVignette || !calloutVignette.enabled) return null;
    const pad = 5;

    // 1. Source target on screen
    const srcX = calloutVignette.sourceX;
    const srcY = calloutVignette.sourceY;
    const srcW = calloutVignette.sourceWidth || 40;
    const srcH = calloutVignette.sourceHeight || 40;
    if (cx >= srcX - pad && cx <= srcX + srcW + pad && cy >= srcY - pad && cy <= srcY + srcH + pad) {
      return 'source';
    }

    // 2. Vignette bubble placed at 5px gap on left of screen
    const gap = calloutVignette.gap ?? 5;
    const vigW = calloutVignette.width || 100;
    const vigH = calloutVignette.height || vigW;
    const vigX = bounds.bgX - gap - vigW;
    const shadowDist = (calloutVignette.showShadow !== false)
      ? (calloutVignette.shadowDistance ?? calloutVignette.shadowOffsetY ?? 5)
      : 0;
    const alignedBottomY = bounds.bgY + bounds.bgHeight - vigH - shadowDist;
    const vigY = calloutVignette.alignBottom !== false ? alignedBottomY : (calloutVignette.offsetY ?? alignedBottomY);
    if (cx >= vigX - pad && cx <= vigX + vigW + pad && cy >= vigY - pad && cy <= vigY + vigH + pad) {
      return 'vignette';
    }

    return null;
  };

  // Mouse Move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (activeTool === 'zoom') return;

    const { x: cx, y: cy } = clientToCanvasCoord(e.clientX, e.clientY);
    setCanvasMousePos({ x: Math.round(cx), y: Math.round(cy) });

    // Dragging Callout Vignette (source target or vignette vertical position)
    if (dragCalloutState && onUpdateCallout && calloutVignette) {
      const dx = cx - dragCalloutState.startX;
      const dy = cy - dragCalloutState.startY;

      if (dragCalloutState.part === 'source') {
        onUpdateCallout({
          sourceX: Math.round(dragCalloutState.initialSourceX + dx),
          sourceY: Math.round(dragCalloutState.initialSourceY + dy),
        });
      } else if (dragCalloutState.part === 'vignette') {
        onUpdateCallout({
          offsetY: Math.round(dragCalloutState.initialOffsetY + dy),
          alignBottom: false,
        });
      }
      return;
    }

    // Dragging Triangle
    if (dragTriangleState && onUpdateTriangle) {
      const dx = cx - dragTriangleState.startX;
      const dy = cy - dragTriangleState.startY;
      onUpdateTriangle(dragTriangleState.id, {
        x: Math.round(dragTriangleState.initialX + dx),
        y: Math.round(dragTriangleState.initialY + dy),
      });
      return;
    }

    // Dragging Blur Zone
    if (dragBlurState) {
      const dx = cx - dragBlurState.startX;
      const dy = cy - dragBlurState.startY;
      if (dragBlurState.handle) {
        const h = dragBlurState.handle;
        let newW = dragBlurState.initialW;
        let newH = dragBlurState.initialH;
        let newX = dragBlurState.initialX;
        let newY = dragBlurState.initialY;
        if (h.includes('e')) newW = Math.max(20, dragBlurState.initialW + dx);
        if (h.includes('s')) newH = Math.max(10, dragBlurState.initialH + dy);
        if (h.includes('w')) {
          newW = Math.max(20, dragBlurState.initialW - dx);
          newX = dragBlurState.initialX + dx;
        }
        if (h.includes('n')) {
          newH = Math.max(10, dragBlurState.initialH - dy);
          newY = dragBlurState.initialY + dy;
        }
        onUpdateBlur(dragBlurState.id, { x: Math.round(newX), y: Math.round(newY), width: Math.round(newW), height: Math.round(newH) });
      } else {
        onUpdateBlur(dragBlurState.id, {
          x: Math.round(dragBlurState.initialX + dx),
          y: Math.round(dragBlurState.initialY + dy),
        });
      }
      return;
    }

    // Dragging Mask Shape
    if (dragMaskState) {
      const dx = cx - dragMaskState.startX;
      const dy = cy - dragMaskState.startY;
      if (dragMaskState.handle) {
        const h = dragMaskState.handle;
        let newW = dragMaskState.initialW;
        let newH = dragMaskState.initialH;
        let newX = dragMaskState.initialX;
        let newY = dragMaskState.initialY;
        if (h.includes('e')) newW = Math.max(10, dragMaskState.initialW + dx);
        if (h.includes('s')) newH = Math.max(10, dragMaskState.initialH + dy);
        if (h.includes('w')) {
          newW = Math.max(10, dragMaskState.initialW - dx);
          newX = dragMaskState.initialX + dx;
        }
        if (h.includes('n')) {
          newH = Math.max(10, dragMaskState.initialH - dy);
          newY = dragMaskState.initialY + dy;
        }
        onUpdateMask(dragMaskState.id, { x: Math.round(newX), y: Math.round(newY), width: Math.round(newW), height: Math.round(newH) });
      } else {
        onUpdateMask(dragMaskState.id, {
          x: Math.round(dragMaskState.initialX + dx),
          y: Math.round(dragMaskState.initialY + dy),
        });
      }
      return;
    }

    // Déplacement / Cadrage interne du screenshot dans la zone focus (Alt + Glisser ou mode recadrage actif)
    if (dragFramingState && dragFramingState.focusId) {
      const dx = cx - dragFramingState.startX;
      const dy = cy - dragFramingState.startY;
      onUpdateFocus({
        sourceOffsetX: Math.round(dragFramingState.initialOffsetX + dx),
        sourceOffsetY: Math.round(dragFramingState.initialOffsetY + dy),
      });
      return;
    }

    // Dragging Focus Zone
    if (dragState && dragState.focusId) {
      const dx = cx - dragState.startX;
      const dy = cy - dragState.startY;
      const init = dragState.initialFocus;

      if (dragState.isDragging) {
        let newX = Math.round(init.x + dx);
        let newY = Math.round(init.y + dy);

        // Alignment guides
        const currentGuides: SmartGuide[] = [];
        const isVertical = init.orientation === 'vertical' || init.height > init.width;
        const focusCenterX = newX + init.width / 2;
        const phoneCenterX = bounds.bgX + bounds.bgWidth / 2;
        const phoneLeft = bounds.bgX;
        const phoneRight = bounds.bgX + bounds.bgWidth;
        const snapDist = 8;

        if (isVertical) {
          // Le magnétisme en mode vertical se base sur le CENTRE de la zone focus
          let snappedX = false;

          // 1. Bord gauche du screenshot original : aligner le CENTRE du focus sur le bord gauche
          if (Math.abs(focusCenterX - phoneLeft) <= snapDist) {
            newX = Math.round(phoneLeft - init.width / 2);
            currentGuides.push({
              type: 'vertical',
              position: phoneLeft,
              label: 'Bord gauche (Centré)',
              color: '#0088cc',
            });
            snappedX = true;
          }
          // 2. Bord droit du screenshot original : aligner le CENTRE du focus sur le bord droit
          else if (Math.abs(focusCenterX - phoneRight) <= snapDist) {
            newX = Math.round(phoneRight - init.width / 2);
            currentGuides.push({
              type: 'vertical',
              position: phoneRight,
              label: 'Bord droit (Centré)',
              color: '#0088cc',
            });
            snappedX = true;
          }
          // 3. Centre horizontal du screenshot original : aligner le CENTRE du focus sur le centre du screenshot
          else if (Math.abs(focusCenterX - phoneCenterX) <= snapDist) {
            newX = Math.round(phoneCenterX - init.width / 2);
            currentGuides.push({
              type: 'vertical',
              position: phoneCenterX,
              label: 'Centre Screenshot',
              color: '#38bdf8',
            });
            snappedX = true;
          }

          // Magnétisme vertical (Haut / Bas du screenshot)
          const phoneTop = bounds.bgY;
          const phoneBottom = bounds.bgY + bounds.bgHeight;
          if (Math.abs(newY - phoneTop) <= snapDist) {
            newY = Math.round(phoneTop);
            currentGuides.push({
              type: 'horizontal',
              position: phoneTop,
              label: 'Haut Screenshot',
              color: '#10b981',
            });
          } else if (Math.abs((newY + init.height) - phoneBottom) <= snapDist) {
            newY = Math.round(phoneBottom - init.height);
            currentGuides.push({
              type: 'horizontal',
              position: phoneBottom,
              label: 'Bas Screenshot',
              color: '#10b981',
            });
          }
        } else {
          // Focus horizontal standard : centre et ligne horizontale
          if (Math.abs(focusCenterX - phoneCenterX) <= snapDist) {
            newX = Math.round(phoneCenterX - init.width / 2);
            currentGuides.push({
              type: 'vertical',
              position: phoneCenterX,
              label: 'Centre',
              color: '#38bdf8',
            });
          }

          currentGuides.push({
            type: 'horizontal',
            position: newY + init.height / 2,
            color: 'rgba(16, 185, 129, 0.6)',
          });
        }

        setActiveGuides(currentGuides);

        onUpdateFocus({
          x: newX,
          y: newY,
        });

        if (dragState.initialArrow && onUpdateArrow) {
          const deltaX = newX - init.x;
          const deltaY = newY - init.y;
          onUpdateArrow({
            startX: dragState.initialArrow.startX + deltaX,
            startY: dragState.initialArrow.startY + deltaY,
            endX: dragState.initialArrow.endX + deltaX,
            endY: dragState.initialArrow.endY + deltaY,
          });
        }
      } else if (dragState.isResizing && dragState.handle) {
        const handle = dragState.handle;
        let newX = init.x;
        let newY = init.y;
        let newW = init.width;
        let newH = init.height;

        const minW = 40;
        const minH = 20;

        if (handle.includes('e')) newW = Math.max(minW, init.width + dx);
        if (handle.includes('s')) newH = Math.max(minH, init.height + dy);
        if (handle.includes('w')) {
          const proposedW = init.width - dx;
          if (proposedW >= minW) {
            newW = proposedW;
            newX = init.x + dx;
          }
        }
        if (handle.includes('n')) {
          const proposedH = init.height - dy;
          if (proposedH >= minH) {
            newH = proposedH;
            newY = init.y + dy;
          }
        }

        onUpdateFocus({
          x: Math.round(newX),
          y: Math.round(newY),
          width: Math.round(newW),
          height: Math.round(newH),
        });
      }
      return;
    }

    // Hover detection over focus handles
    const selected = focuses.find((f) => f.id === selectedFocusId);
    if (selected && globalStyles.showHandles !== false) {
      const handle = getHandleAtCoord(cx, cy, selected);
      if (handle) {
        setHoveredHandle(handle);
        return;
      }
    }
    setHoveredHandle(null);

    // FLUID HOVER DETECTION OVER ALL ELEMENTS (Strict layering: Callout -> Triangle -> Mask -> Focus -> Blur)
    const hCallout = getCalloutPartAtCoord(cx, cy);
    setHoveredCalloutPart(hCallout);

    const hTri = getTriangleAtCoord(cx, cy);
    setHoveredTriangleId(hTri ? hTri.id : null);

    const hMask = getMaskAtCoord(cx, cy);
    setHoveredMaskId(hMask ? hMask.id : null);

    const hFocus = getFocusAtCoord(cx, cy);
    setHoveredFocusId(hFocus ? hFocus.id : null);

    // Blur is strictly underneath all other elements (Callout, Triangle, Mask, Focus)
    const hasElementAbove = Boolean(hCallout || hTri || hMask || hFocus);
    const hBlur = hasElementAbove ? null : getBlurAtCoord(cx, cy);
    setHoveredBlurId(hBlur ? hBlur.id : null);
  };

  // Mouse Down
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Photoshop Zoom tool click
    if (activeTool === 'zoom') {
      const isZoomOut = e.altKey || isAltPressed;
      const factor = isZoomOut ? 0.8 : 1.25;
      const nextZoom = Math.min(5, Math.max(0.25, Math.round(zoomLevel * factor * 100) / 100));
      setZoomLevel(nextZoom);
      return;
    }

    // Focus tool click to place a new focus zone
    if (activeTool === 'focus') {
      const { x: cx, y: cy } = clientToCanvasCoord(e.clientX, e.clientY);
      onAddFocusAt(Math.round(cx - 120), Math.round(cy - 25));
      onSelectTool('select');
      return;
    }

    // Blur tool click to place a new blur zone
    if (activeTool === 'blur') {
      const { x: cx, y: cy } = clientToCanvasCoord(e.clientX, e.clientY);
      onAddBlurAt(Math.round(cx - 50), Math.round(cy - 20));
      onSelectTool('select');
      return;
    }

    // Mask tool click to place a new blue mask
    if (activeTool === 'mask') {
      const { x: cx, y: cy } = clientToCanvasCoord(e.clientX, e.clientY);
      onAddMaskAt(Math.round(cx - 50), Math.round(cy - 20));
      onSelectTool('select');
      return;
    }

    // Triangle tool click to place a new 15x13px triangle
    if (activeTool === 'triangle' && onAddTriangleAt) {
      const { x: cx, y: cy } = clientToCanvasCoord(e.clientX, e.clientY);
      onAddTriangleAt(Math.round(cx - 7.5), Math.round(cy - 6.5));
      onSelectTool('select');
      return;
    }

    // Middle click OR holding Spacebar -> Pan workspace immediately
    if (e.button === 1 || isSpacePressed) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    if (e.button !== 0) return;

    (document.activeElement as HTMLElement)?.blur?.();

    const { x: cx, y: cy } = clientToCanvasCoord(e.clientX, e.clientY);

    // 1. Check if clicking handles on selected Blur Zone
    const selectedBlur = blurZones.find((b) => b.id === selectedBlurId);
    if (selectedBlur) {
      const handle = getGenericHandleAtCoord(cx, cy, selectedBlur);
      if (handle) {
        setDragBlurState({
          id: selectedBlur.id,
          startX: cx,
          startY: cy,
          initialX: selectedBlur.x,
          initialY: selectedBlur.y,
          initialW: selectedBlur.width,
          initialH: selectedBlur.height,
          handle,
        });
        return;
      }
    }

    // 2. Check if clicking handles on selected Mask Shape
    const selectedMask = maskShapes.find((m) => m.id === selectedMaskId);
    if (selectedMask) {
      let handleRect = selectedMask;
      if (selectedMask.multiplier?.enabled) {
        const cols = Math.max(1, selectedMask.multiplier.cols || 2);
        const rows = Math.max(1, selectedMask.multiplier.rows || 2);
        const gapX = selectedMask.multiplier.gapX ?? 10;
        const gapY = selectedMask.multiplier.gapY ?? 10;
        const totalW = cols * selectedMask.width + (cols - 1) * gapX;
        const totalH = rows * selectedMask.height + (rows - 1) * gapY;
        handleRect = { x: selectedMask.x, y: selectedMask.y, width: totalW, height: totalH };
      }
      const handle = getGenericHandleAtCoord(cx, cy, handleRect) || getGenericHandleAtCoord(cx, cy, selectedMask);
      if (handle) {
        setDragMaskState({
          id: selectedMask.id,
          startX: cx,
          startY: cy,
          initialX: selectedMask.x,
          initialY: selectedMask.y,
          initialW: selectedMask.width,
          initialH: selectedMask.height,
          handle,
        });
        return;
      }
    }

    // 3. Check if clicking handles of selected focus
    const selected = focuses.find((f) => f.id === selectedFocusId);
    if (selected && globalStyles.showHandles !== false) {
      const handle = getHandleAtCoord(cx, cy, selected);
      if (handle) {
        setDragState({
          isDragging: false,
          isResizing: true,
          handle,
          focusId: selected.id,
          startX: cx,
          startY: cy,
          initialFocus: { ...selected },
        });
        return;
      }
    }

    // 4. PRIORITY SELECTION: Check clicked Callout part (source target or vignette bubble)
    const clickedCallout = getCalloutPartAtCoord(cx, cy);
    if (clickedCallout && calloutVignette) {
      const vigH = calloutVignette.height || calloutVignette.width || 100;
      const shadowDist = (calloutVignette.showShadow !== false)
        ? (calloutVignette.shadowDistance ?? calloutVignette.shadowOffsetY ?? 5)
        : 0;
      const currentVigY = calloutVignette.alignBottom !== false 
        ? (bounds.bgY + bounds.bgHeight - vigH - shadowDist) 
        : calloutVignette.offsetY;

      updateSelectedCallout(clickedCallout);
      onSelectFocus(null);
      onSelectBlur(null);
      onSelectMask(null);
      onSelectTriangle?.(null);
      setDragCalloutState({
        part: clickedCallout,
        startX: cx,
        startY: cy,
        initialSourceX: calloutVignette.sourceX,
        initialSourceY: calloutVignette.sourceY,
        initialOffsetY: currentVigY,
      });
      return;
    }

    // 5. PRIORITY SELECTION: Check clicked Triangle FIRST
    const clickedTriangle = getTriangleAtCoord(cx, cy);
    if (clickedTriangle) {
      updateSelectedCallout(null);
      onSelectTriangle?.(clickedTriangle.id);
      onSelectFocus(null);
      onSelectBlur(null);
      onSelectMask(null);
      setDragTriangleState({
        id: clickedTriangle.id,
        startX: cx,
        startY: cy,
        initialX: clickedTriangle.x,
        initialY: clickedTriangle.y,
      });
      return;
    }

    // 5. PRIORITY SELECTION: Check clicked Mask Shape
    const clickedMask = getMaskAtCoord(cx, cy);
    if (clickedMask) {
      updateSelectedCallout(null);
      onSelectMask(clickedMask.id);
      onSelectFocus(null);
      onSelectBlur(null);
      onSelectTriangle?.(null);
      setDragMaskState({
        id: clickedMask.id,
        startX: cx,
        startY: cy,
        initialX: clickedMask.x,
        initialY: clickedMask.y,
        initialW: clickedMask.width,
        initialH: clickedMask.height,
        handle: null,
      });
      return;
    }

    // 6. PRIORITY SELECTION: Check clicked Focus Zone (Focus is strictly above blur zones)
    const clickedFocus = getFocusAtCoord(cx, cy);
    if (clickedFocus) {
      updateSelectedCallout(null);
      onSelectFocus(clickedFocus.id);
      onSelectBlur(null);
      onSelectMask(null);
      onSelectTriangle?.(null);

      // Si la touche Alt est maintenue ou si la zone est en mode recadrage interne :
      // -> Déplacer le screenshot dans la zone focus sans altérer la capture d'origine
      if (e.altKey || internalFramingFocusId === clickedFocus.id) {
        setDragFramingState({
          focusId: clickedFocus.id,
          startX: cx,
          startY: cy,
          initialOffsetX: clickedFocus.sourceOffsetX || 0,
          initialOffsetY: clickedFocus.sourceOffsetY || 0,
        });
        return;
      }

      const attachedArrow = arrows.find((a) => a.focusId === clickedFocus.id);

      setDragState({
        isDragging: true,
        isResizing: false,
        handle: null,
        focusId: clickedFocus.id,
        startX: cx,
        startY: cy,
        initialFocus: { ...clickedFocus },
        initialArrow: attachedArrow ? { ...attachedArrow } : undefined,
      });
      return;
    }

    // 7. PRIORITY SELECTION: Check clicked Blur Zone (Underneath all objects)
    const clickedBlur = getBlurAtCoord(cx, cy);
    if (clickedBlur) {
      updateSelectedCallout(null);
      onSelectBlur(clickedBlur.id);
      onSelectFocus(null);
      onSelectMask(null);
      onSelectTriangle?.(null);
      setDragBlurState({
        id: clickedBlur.id,
        startX: cx,
        startY: cy,
        initialX: clickedBlur.x,
        initialY: clickedBlur.y,
        initialW: clickedBlur.width,
        initialH: clickedBlur.height,
        handle: null,
      });
      return;
    }

    // 8. Main active sur le screenshot : se déplacer librement comme souhaité
    const isInsideScreenshot =
      cx >= bounds.bgX &&
      cx <= bounds.bgX + bounds.bgWidth &&
      cy >= bounds.bgY &&
      cy <= bounds.bgY + bounds.bgHeight;

    if (isInsideScreenshot && (!clickedFocus || calloutVignette?.enabled)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    // 9. Clicked empty background
    if (isPanMode) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    updateSelectedCallout(null);
    onSelectFocus(null);
    onSelectBlur(null);
    onSelectMask(null);
    onSelectTriangle?.(null);
  };

  const handleMouseUp = () => {
    if (isPanning) setIsPanning(false);
    if (dragCalloutState) setDragCalloutState(null);
    if (dragFramingState) setDragFramingState(null);
    if (dragState) {
      setDragState(null);
      setActiveGuides([]);
    }
    if (dragBlurState) setDragBlurState(null);
    if (dragMaskState) setDragMaskState(null);
    if (dragTriangleState) setDragTriangleState(null);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x: cx, y: cy } = clientToCanvasCoord(e.clientX, e.clientY);

    // Double-clic sur une zone focus : activer / quitter le mode recadrage interne
    const clickedFocus = getFocusAtCoord(cx, cy);
    if (clickedFocus) {
      onSelectFocus(clickedFocus.id);
      onToggleInternalFraming?.(clickedFocus.id);
      return;
    }

    // Only allow double-click creation if user explicitly has the 'focus' tool selected
    if (activeTool !== 'focus') return;
    const isVert = e.altKey || e.shiftKey;
    const defaultW = isVert ? 50 : 240;
    const defaultH = isVert ? 240 : 50;
    onAddFocusAt(
      Math.round(cx - defaultW / 2),
      Math.round(cy - defaultH / 2),
      defaultW,
      defaultH,
      undefined,
      isVert ? 'vertical' : 'horizontal'
    );
    onSelectTool('select');
  };

  // Photoshop & Figma style navigation : Pan & Zoom sur la zone de travail
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleNativeWheel = (e: WheelEvent) => {
      // Bloquer le scroll natif de la page parente
      e.preventDefault();

      const isZoomModifier = e.ctrlKey || e.metaKey || e.altKey;

      if (isZoomModifier) {
        // Zoom progressif fluide (pincement trackpad, Ctrl / Cmd / Alt + molette)
        const zoomDelta = e.deltaY < 0 ? 0.08 : -0.08;
        setZoomLevel((prev) => Math.min(5, Math.max(0.25, Math.round((prev + zoomDelta) * 100) / 100)));
      } else if (e.shiftKey) {
        // Shift + Molette -> Défilement horizontal (Pan X)
        setPanOffset((prev) => ({
          x: Math.round(prev.x - (e.deltaY || e.deltaX)),
          y: prev.y,
        }));
      } else {
        // Molette souris standard ou défilement 2 doigts au trackpad -> Déplacement naturel (Pan)
        setPanOffset((prev) => ({
          x: Math.round(prev.x - e.deltaX),
          y: Math.round(prev.y - e.deltaY),
        }));
      }
    };

    container.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleNativeWheel);
    };
  }, []);

  // Drag & drop local files
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onFileDrop(file);
    }
  };

  // Cursor style calculation
  const getCursor = () => {
    if (isSpacePressed || isPanning) return isPanning ? 'grabbing' : 'grab';
    if (dragFramingState) return 'grabbing';
    if (activeTool === 'zoom') return isAltPressed ? 'zoom-out' : 'zoom-in';
    if (activeTool === 'blur' || activeTool === 'mask' || activeTool === 'triangle') return 'crosshair';
    if (isPanMode) return 'grab';
    if (dragCalloutState) return 'grabbing';
    if (dragState?.isDragging || dragBlurState || dragMaskState || dragTriangleState) return 'move';
    if (dragState?.isResizing && dragState.handle) {
      const h = dragState.handle;
      if (h === 'nw' || h === 'se') return 'nwse-resize';
      if (h === 'ne' || h === 'sw') return 'nesw-resize';
      if (h === 'n' || h === 's') return 'ns-resize';
      if (h === 'w' || h === 'e') return 'ew-resize';
    }
    if (hoveredHandle) {
      if (hoveredHandle === 'nw' || hoveredHandle === 'se') return 'nwse-resize';
      if (hoveredHandle === 'ne' || hoveredHandle === 'sw') return 'nesw-resize';
      if (hoveredHandle === 'n' || hoveredHandle === 's') return 'ns-resize';
      if (hoveredHandle === 'w' || hoveredHandle === 'e') return 'ew-resize';
    }
    if (hoveredTriangleId || hoveredMaskId || hoveredBlurId) {
      return 'pointer';
    }
    if (hoveredCalloutPart === 'vignette') {
      return 'grab';
    }
    if (hoveredCalloutPart === 'source') {
      return 'grab';
    }
    if (hoveredFocusId && !calloutVignette?.enabled) {
      if (isAltPressed || internalFramingFocusId === hoveredFocusId) {
        return 'all-scroll';
      }
      return hoveredFocusId === selectedFocusId ? 'move' : 'pointer';
    }

    // Lorsque je survole le screenshot la main doit être active pour que je puisse me déplacer comme je le souhaite
    const isOverScreenshot = Boolean(
      canvasMousePos &&
      canvasMousePos.x >= bounds.bgX &&
      canvasMousePos.x <= bounds.bgX + bounds.bgWidth &&
      canvasMousePos.y >= bounds.bgY &&
      canvasMousePos.y <= bounds.bgY + bounds.bgHeight
    );
    if (isOverScreenshot) {
      return isPanning ? 'grabbing' : 'grab';
    }

    return 'default';
  };

  const selectedFocus = focuses.find((f) => f.id === selectedFocusId);

  return (
    <div 
      ref={containerRef}
      className={`flex-1 max-w-3xl xl:max-w-4xl flex flex-col h-full max-h-[calc(100vh-7rem)] backdrop-blur-xl rounded-3xl relative overflow-hidden select-none p-3.5 gap-3 transition-colors duration-200 ${
        isDarkMode
          ? 'bg-[#212121]/90 border border-[#333333] shadow-[0_8px_30px_rgba(0,0,0,0.4)] ring-1 ring-white/10 text-white'
          : 'bg-white/70 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-[#979797]/15 text-[#000000]'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Top Scene Bar */}
      <TopSceneBar
        screenWidth={calloutVignette?.enabled ? bounds.canvasWidth : (image?.displayWidth ?? 180)}
        screenHeight={calloutVignette?.enabled ? bounds.canvasHeight : (image?.displayHeight ?? 390)}
        globalStyles={globalStyles}
        onUpdateGlobalStyles={onUpdateGlobalStyles}
        onAddGuideH={onAddGuideH}
        onAddGuideV={onAddGuideV}
        isPanMode={isPanMode}
        onTogglePanMode={() => setIsPanMode(!isPanMode)}
        zoomLevel={zoomLevel}
        onSetZoom={setZoomLevel}
        onAddFocus={onAddFocus}
        onDeleteFocus={() => selectedFocusId && onDeleteFocus?.(selectedFocusId)}
        hasSelectedFocus={!!selectedFocusId}
        isPreviewMode={isPreviewMode}
        onTogglePreview={onTogglePreview}
        isCalloutMode={!!calloutVignette?.enabled}
        onCenterWorkspace={handleCenterWorkspace}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        isDarkMode={isDarkMode}
      />

      {/* Main Canvas Viewport Area */}
      <div className={`flex-1 relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border transition-colors duration-200 ${
        isDarkMode
          ? 'bg-[#181818] border-[#2c2c2c] shadow-inner'
          : 'bg-[#eeeeee]/40 border-white/60 shadow-inner'
      }`}>
        {/* Banner indicator if Internal Framing Mode is ON */}
        {!isPreviewMode && internalFramingFocusId && selectedFocus && (
          <div className="absolute top-4 z-40 bg-[#25465F]/95 text-white backdrop-blur-xl px-4 py-2 rounded-2xl shadow-xl border border-sky-400/40 flex items-center gap-3 text-xs font-medium animate-in fade-in slide-in-from-top-2 select-none">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              <span className="font-semibold text-white">Mode Cadrage interne :</span>
              <span className="font-mono text-sky-200">
                X: {(selectedFocus.sourceOffsetX ?? 0) > 0 ? `+${Math.round(selectedFocus.sourceOffsetX ?? 0)}` : Math.round(selectedFocus.sourceOffsetX ?? 0)}px, 
                Y: {(selectedFocus.sourceOffsetY ?? 0) > 0 ? `+${Math.round(selectedFocus.sourceOffsetY ?? 0)}` : Math.round(selectedFocus.sourceOffsetY ?? 0)}px
              </span>
            </div>
            <span className="text-[11px] text-sky-100/70 hidden md:inline">
              Glissez la souris ou utilisez les flèches (Alt pour 1px, Shift pour 10px)
            </span>
            {((selectedFocus.sourceOffsetX ?? 0) !== 0 || (selectedFocus.sourceOffsetY ?? 0) !== 0) && (
              <button
                type="button"
                onClick={() => onUpdateFocus({ sourceOffsetX: 0, sourceOffsetY: 0 })}
                className="px-2 py-0.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-[10px] font-medium transition-colors"
                title="Recentrer à (0, 0)"
              >
                Recentrer
              </button>
            )}
            <button
              type="button"
              onClick={() => onToggleInternalFraming?.(null)}
              className="px-2.5 py-1 rounded-full bg-white text-[#25465F] hover:bg-sky-50 font-bold text-[11px] transition-all shadow-sm"
              title="Terminer le recadrage (Échap ou Entrée)"
            >
              Terminer
            </button>
          </div>
        )}

        {/* Left Vertical Floating Toolbar (hidden in preview mode) */}
        {!isPreviewMode && (
          <VerticalToolPalette
            focuses={focuses}
            selectedFocus={selectedFocus || null}
            activeTool={activeTool}
            onSelectTool={onSelectTool}
            onAddFocus={onAddFocus}
            onDeleteFocus={() => selectedFocusId && onDeleteFocus?.(selectedFocusId)}
            onDeleteFocusWithId={(id) => onDeleteFocus?.(id)}
            onDuplicateFocus={onDuplicateFocus}
            onAddBlur={onAddBlur}
            blurZones={blurZones}
            selectedBlurId={selectedBlurId}
            onSelectBlur={onSelectBlur}
            onDeleteBlur={onDeleteBlur}
            onDuplicateBlur={onDuplicateBlur}
            onUpdateBlur={onUpdateBlur}
            onAddMask={onAddMask}
            maskShapes={maskShapes}
            selectedMaskId={selectedMaskId}
            onSelectMask={onSelectMask}
            onDeleteMask={onDeleteMask}
            onDuplicateMask={onDuplicateMask}
            onUpdateMask={onUpdateMask}
            onAddTriangle={onAddTriangle}
            triangles={triangles}
            selectedTriangleId={selectedTriangleId}
            onSelectTriangle={onSelectTriangle}
            onDeleteTriangle={onDeleteTriangle}
            onDuplicateTriangle={onDuplicateTriangle}
            onUpdateTriangle={onUpdateTriangle}
            calloutVignette={calloutVignette}
            hasCallout={!!calloutVignette?.enabled}
            onToggleCallout={onToggleCallout}
            onUpdateCallout={onUpdateCallout}
            isPanMode={isPanMode}
            onTogglePanMode={() => setIsPanMode(!isPanMode)}
            isDetecting={false}
            showDetection={showDetectedOverlay}
            onToggleDetection={() => onUpdateGlobalStyles({ showGuides: !globalStyles.showGuides })}
            showHandles={globalStyles.showHandles !== false}
            onToggleHandles={() => onUpdateGlobalStyles({ showHandles: !globalStyles.showHandles })}
            onExportClick={onExportClick}
            isExporting={isExporting}
            onCenterWorkspace={handleCenterWorkspace}
            onSelectFocus={(id) => onSelectFocus(id)}
            onUpdateFocus={(id, updated) => {
              if (selectedFocusId === id) {
                onUpdateFocus(updated);
              } else {
                onSelectFocus(id);
                onUpdateFocus(updated);
              }
            }}
            onRenumberFocuses={onRenumberFocuses}
            onHoverFocus={(id) => setHoveredFocusId(id)}
            isPreviewMode={isPreviewMode}
            onTogglePreview={onTogglePreview}
            onUndo={onUndo}
            onRedo={onRedo}
            canUndo={canUndo}
            canRedo={canRedo}
            isDarkMode={isDarkMode}
          />
        )}

        {/* Center Stage with Canvas */}
        <div 
          className="flex flex-col items-center justify-center transition-transform duration-75"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center center',
          }}
        >
          {/* Canvas Wrapper with external rulers outside the checkerboard */}
          {!isPreviewMode && globalStyles.showRulers !== false ? (
            <div className="flex flex-col shadow-2xl ring-1 ring-slate-400/20 select-none">
              {/* Top Ruler Row */}
              <div className="flex items-stretch">
                <div 
                  className="w-2.5 h-2.5 bg-transparent border-t border-l border-r border-b border-slate-300/40 select-none shrink-0"
                  title="Règles discrètes"
                />
                <TopRuler
                  width={bounds.canvasWidth}
                  bgX={bounds.bgX}
                  bgWidth={bounds.bgWidth}
                  cursorX={canvasMousePos?.x}
                  onAddGuideH={onAddGuideH}
                />
              </div>

              {/* Canvas with Left Ruler */}
              <div className="flex items-stretch">
                <LeftRuler
                  height={bounds.canvasHeight}
                  bgY={bounds.bgY}
                  bgHeight={bounds.bgHeight}
                  cursorY={canvasMousePos?.y}
                  onAddGuideV={onAddGuideV}
                />
                <div 
                  className="relative photoshop-checkerboard border-b border-r border-slate-300"
                  style={{
                    width: `${bounds.canvasWidth}px`,
                    height: `${bounds.canvasHeight}px`,
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    width={bounds.canvasWidth}
                    height={bounds.canvasHeight}
                    onMouseMove={handleMouseMove}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={() => {
                      setCanvasMousePos(null);
                      handleMouseUp();
                    }}
                    onDoubleClick={handleDoubleClick}
                    className="block select-none"
                    style={{
                      cursor: getCursor(),
                      width: `${bounds.canvasWidth}px`,
                      height: `${bounds.canvasHeight}px`,
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div 
              className={`relative transition-all duration-200 ${
                isPreviewMode 
                  ? 'bg-white shadow-2xl ring-1 ring-slate-900/10' 
                  : 'photoshop-checkerboard border border-slate-300 shadow-2xl ring-1 ring-slate-400/20'
              }`}
              style={{
                width: `${bounds.canvasWidth}px`,
                height: `${bounds.canvasHeight}px`,
              }}
            >
              <canvas
                ref={canvasRef}
                width={bounds.canvasWidth}
                height={bounds.canvasHeight}
                onMouseMove={handleMouseMove}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => {
                  setCanvasMousePos(null);
                  handleMouseUp();
                }}
                onDoubleClick={handleDoubleClick}
                className="block select-none"
                style={{
                  cursor: getCursor(),
                  width: `${bounds.canvasWidth}px`,
                  height: `${bounds.canvasHeight}px`,
                }}
              />
            </div>
          )}
        </div>

        {/* Bottom Status Bar: discreet, outside the plan de travail (fixed at bottom of workspace viewport) */}
        <div className="absolute bottom-3 z-30 pointer-events-none select-none flex items-center justify-center">
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono bg-white/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200/80 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0088cc]/80 inline-block" />
            <span>
              Plan : <strong className="text-slate-700 font-medium">{bounds.canvasWidth} × {bounds.canvasHeight} px</strong>
            </span>
            <span className="text-slate-300">·</span>
            <span>
              Screenshot : <strong className="text-slate-700 font-medium">{bounds.bgWidth} × {bounds.bgHeight} px</strong>
            </span>
            {selectedFocus && (
              <>
                <span className="text-slate-300">·</span>
                <span>
                  Focus :{' '}
                  <strong className="text-[#0088cc] font-medium">
                    {Math.round(selectedFocus.width)} × {Math.round(selectedFocus.height)} px
                  </strong>
                </span>
              </>
            )}
            <span className="text-slate-300">·</span>
            <span>Zoom : {Math.round(zoomLevel * 100)}%</span>
          </div>
        </div>

        {/* Drag over indicator */}
        {isDragOver && (
          <div className="absolute inset-0 bg-[#0088cc]/10 backdrop-blur-xs border-2 border-dashed border-[#0088cc] rounded-2xl flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-white px-6 py-4 rounded-2xl shadow-xl border border-white text-[#000000] font-semibold text-sm">
              Déposez votre capture d'écran ici
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
