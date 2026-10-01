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
  selectedFocusIds?: string[];
  onSelectFocus: (id: string | null, isMulti?: boolean) => void;
  onUpdateFocus: (updated: Partial<FocusZone>) => void;
  onRenumberFocuses?: () => void;
  onAddFocus: (orientation?: 'horizontal' | 'vertical') => void;
  onDeleteFocus?: (id: string) => void;
  onDuplicateFocus?: (id: string) => void;
  onAddFocusAt: (x: number, y: number, w?: number, h?: number, label?: string) => void;
  // Blur Zones
  blurZones: BlurZone[];
  selectedBlurId: string | null;
  selectedBlurIds?: string[];
  onSelectBlur: (id: string | null, isMulti?: boolean) => void;
  onAddBlur: () => void;
  onAddBlurAt: (x: number, y: number) => void;
  onUpdateBlur: (id: string, updated: Partial<BlurZone>) => void;
  onDeleteBlur: (id: string) => void;
  onDuplicateBlur?: (id: string) => void;
  // Mask Shapes
  maskShapes: MaskShape[];
  selectedMaskId: string | null;
  selectedMaskIds?: string[];
  onSelectMask: (id: string | null, isMulti?: boolean) => void;
  onAddMask: () => void;
  onAddMaskAt: (x: number, y: number) => void;
  onUpdateMask: (id: string, updated: Partial<MaskShape>) => void;
  onDeleteMask: (id: string) => void;
  onDuplicateMask?: (id: string) => void;
  // Triangle Shapes (15x13px)
  triangles?: TriangleShape[];
  selectedTriangleId?: string | null;
  selectedTriangleIds?: string[];
  onSelectTriangle?: (id: string | null, isMulti?: boolean) => void;
  onAddTriangle?: () => void;
  onAddTriangleAt?: (x: number, y: number) => void;
  onUpdateTriangle?: (id: string, updated: Partial<TriangleShape>) => void;
  onDeleteTriangle?: (id: string) => void;
  onDuplicateTriangle?: (id: string) => void;
  // Multi-Selection Operations
  onSelectMultiple?: (selection: { focusIds?: string[]; blurIds?: string[]; maskIds?: string[]; triangleIds?: string[] }, isAdditive?: boolean) => void;
  onClearSelection?: () => void;
  onBatchMove?: (
    dx: number,
    dy: number,
    snapshot?: {
      focuses?: Array<{ id: string; x: number; y: number }>;
      blurs?: Array<{ id: string; x: number; y: number }>;
      masks?: Array<{ id: string; x: number; y: number }>;
      triangles?: Array<{ id: string; x: number; y: number }>;
    }
  ) => void;
  onBatchMoveEnd?: () => void;
  onBatchDelete?: () => void;
  onBatchDuplicate?: () => void;
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
  onAddCustomGuide?: (type: 'horizontal' | 'vertical', position: number) => void;
  onUpdateGuide?: (id: string, position: number) => void;
  onDeleteGuide?: (id: string) => void;
  onClearAllGuides?: () => void;
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
  selectedFocusIds = [],
  onSelectFocus,
  onUpdateFocus,
  onRenumberFocuses,
  onAddFocus,
  onDeleteFocus,
  onDuplicateFocus,
  onAddFocusAt,
  blurZones,
  selectedBlurId,
  selectedBlurIds = [],
  onSelectBlur,
  onAddBlur,
  onAddBlurAt,
  onUpdateBlur,
  onDeleteBlur,
  onDuplicateBlur,
  maskShapes,
  selectedMaskId,
  selectedMaskIds = [],
  onSelectMask,
  onAddMask,
  onAddMaskAt,
  onUpdateMask,
  onDeleteMask,
  onDuplicateMask,
  triangles = [],
  selectedTriangleId = null,
  selectedTriangleIds = [],
  onSelectTriangle,
  onAddTriangle,
  onAddTriangleAt,
  onUpdateTriangle,
  onDeleteTriangle,
  onDuplicateTriangle,
  onSelectMultiple,
  onClearSelection,
  onBatchMove,
  onBatchMoveEnd,
  onBatchDelete,
  onBatchDuplicate,
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
  onAddCustomGuide,
  onUpdateGuide,
  onDeleteGuide,
  onClearAllGuides,
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

  // Photoshop Rulers: Dragging Guide from Ruler or moving existing guide
  const [draggingGuide, setDraggingGuide] = useState<{ type: 'horizontal' | 'vertical'; position: number; isNew: boolean; guideId?: string } | null>(null);
  const [hoveredGuide, setHoveredGuide] = useState<UserGuide | null>(null);

  // Photoshop-Style Corner Rotation state (no pin stem, 4 corner zones with arc)
  const [hoveredRotationCorner, setHoveredRotationCorner] = useState<{ type: 'mask' | 'triangle'; id: string; corner: 'nw' | 'ne' | 'se' | 'sw' } | null>(null);
  const [dragRotateState, setDragRotateState] = useState<{ id: string; type: 'mask' | 'triangle'; centerX: number; centerY: number; startAngle: number; initialRotation: number } | null>(null);

  // Multi-Selection State: Marquee rectangle & Multi-Drag
  const [marqueeState, setMarqueeState] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
  const [multiDragState, setMultiDragState] = useState<{
    startX: number;
    startY: number;
    hasMoved?: boolean;
    initialFocuses: { id: string; x: number; y: number }[];
    initialBlurs: { id: string; x: number; y: number }[];
    initialMasks: { id: string; x: number; y: number }[];
    initialTriangles: { id: string; x: number; y: number }[];
  } | null>(null);

  // Smart Snap guides & HUD info badge
  const [activeSnapGuides, setActiveSnapGuides] = useState<SmartGuide[]>([]);
  const [hudInfo, setHudInfo] = useState<{ x: number; y: number; text: string } | null>(null);

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

  // Convert client viewport coordinates to Canvas composition coordinates
  const clientToCanvasCoord = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);
    return { x, y };
  }, []);

  // Global drag listener for Guide pulling (from rulers) and Shape Rotation
  useEffect(() => {
    if (!draggingGuide && !dragRotateState) return;

    const handleGlobalPointerMove = (e: MouseEvent) => {
      const { x: cx, y: cy } = clientToCanvasCoord(e.clientX, e.clientY);
      setCanvasMousePos({ x: Math.round(cx), y: Math.round(cy) });

      if (draggingGuide) {
        const newPos = draggingGuide.type === 'horizontal' ? Math.round(cy) : Math.round(cx);
        setDraggingGuide((prev) => (prev ? { ...prev, position: newPos } : null));
        setHudInfo({
          x: cx,
          y: cy,
          text: draggingGuide.type === 'horizontal'
            ? `Repère Y : ${newPos} px (${newPos - bounds.bgY >= 0 ? '+' : ''}${newPos - bounds.bgY} px)`
            : `Repère X : ${newPos} px (${newPos - bounds.bgX >= 0 ? '+' : ''}${newPos - bounds.bgX} px)`,
        });
      } else if (dragRotateState) {
        const { centerX, centerY, startAngle, initialRotation } = dragRotateState;
        const curAngle = (Math.atan2(cy - centerY, cx - centerX) * 180) / Math.PI;
        let delta = curAngle - startAngle;
        let targetRot = Math.round(initialRotation + delta);
        while (targetRot > 180) targetRot -= 360;
        while (targetRot <= -180) targetRot += 360;

        // Magnetic angle snapping (with shift: 15° steps; normal: 45° steps)
        const snapAngles = e.shiftKey
          ? [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, -15, -30, -45, -60, -75, -90, -105, -120, -135, -150, -165, -180]
          : [0, 45, 90, 135, 180, -45, -90, -135];
        for (const sa of snapAngles) {
          if (Math.abs(targetRot - sa) <= (e.shiftKey ? 6 : 3.5)) {
            targetRot = sa;
            break;
          }
        }

        if (dragRotateState.type === 'mask') {
          onUpdateMask(dragRotateState.id, { rotation: targetRot });
        } else {
          onUpdateTriangle?.(dragRotateState.id, { rotation: targetRot });
        }

        setHudInfo({
          x: cx,
          y: cy,
          text: `Angle : ${targetRot}°`,
        });
      }
    };

    const handleGlobalPointerUp = () => {
      if (draggingGuide) {
        if (draggingGuide.isNew) {
          const isOffscreen = draggingGuide.type === 'horizontal'
            ? (draggingGuide.position < -15 || draggingGuide.position > bounds.canvasHeight + 15)
            : (draggingGuide.position < -15 || draggingGuide.position > bounds.canvasWidth + 15);
          if (!isOffscreen) {
            onAddCustomGuide?.(draggingGuide.type, Math.max(0, draggingGuide.position));
          }
        } else if (draggingGuide.guideId) {
          const isOffscreen = draggingGuide.type === 'horizontal'
            ? (draggingGuide.position < 0 || draggingGuide.position > bounds.canvasHeight)
            : (draggingGuide.position < 0 || draggingGuide.position > bounds.canvasWidth);
          if (isOffscreen) {
            onDeleteGuide?.(draggingGuide.guideId);
          } else {
            onUpdateGuide?.(draggingGuide.guideId, draggingGuide.position);
          }
        }
        setDraggingGuide(null);
      }
      if (dragRotateState) {
        setDragRotateState(null);
      }
      setHudInfo(null);
    };

    window.addEventListener('mousemove', handleGlobalPointerMove);
    window.addEventListener('mouseup', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalPointerMove);
      window.removeEventListener('mouseup', handleGlobalPointerUp);
    };
  }, [draggingGuide, dragRotateState, clientToCanvasCoord, bounds, onAddCustomGuide, onDeleteGuide, onUpdateGuide, onUpdateMask, onUpdateTriangle]);

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

    const activeFocusIds = selectedFocusIds.length > 0 ? selectedFocusIds : (selectedFocusId ? [selectedFocusId] : []);
    const activeBlurIds = selectedBlurIds.length > 0 ? selectedBlurIds : (selectedBlurId ? [selectedBlurId] : []);
    const activeMaskIds = selectedMaskIds.length > 0 ? selectedMaskIds : (selectedMaskId ? [selectedMaskId] : []);
    const activeTriangleIds = selectedTriangleIds.length > 0 ? selectedTriangleIds : (selectedTriangleId ? [selectedTriangleId] : []);

    drawComposition(ctx, image, focuses, {
      interactive: !isPreviewMode,
      selectedFocusId: isPreviewMode ? null : selectedFocusId,
      selectedFocusIds: isPreviewMode ? [] : activeFocusIds,
      hoveredFocusId: isPreviewMode ? null : hoveredFocusId,
      hoveredHandle: isPreviewMode ? null : hoveredHandle,
      internalFramingFocusId: isPreviewMode ? null : internalFramingFocusId,
      smartGuides: isPreviewMode ? [] : [...activeGuides, ...activeSnapGuides],
      userGuides: isPreviewMode ? [] : (
        draggingGuide
          ? [...userGuides.filter(g => g.id !== draggingGuide.guideId), { id: 'dragging-guide', type: draggingGuide.type, position: draggingGuide.position }]
          : userGuides
      ),
      globalStyles,
      showGuides: !isPreviewMode && globalStyles.showGuides !== false,
      showRulers: !isPreviewMode && globalStyles.showRulers !== false,
      blurZones,
      selectedBlurId: isPreviewMode ? null : selectedBlurId,
      selectedBlurIds: isPreviewMode ? [] : activeBlurIds,
      hoveredBlurId: isPreviewMode ? null : hoveredBlurId,
      maskShapes,
      selectedMaskId: isPreviewMode ? null : selectedMaskId,
      selectedMaskIds: isPreviewMode ? [] : activeMaskIds,
      hoveredMaskId: isPreviewMode ? null : hoveredMaskId,
      triangles,
      selectedTriangleId: isPreviewMode ? null : selectedTriangleId,
      selectedTriangleIds: isPreviewMode ? [] : activeTriangleIds,
      hoveredTriangleId: isPreviewMode ? null : hoveredTriangleId,
      hoveredRotationCorner: isPreviewMode ? null : hoveredRotationCorner,
      marqueeRect: marqueeState ? {
        x: Math.min(marqueeState.startX, marqueeState.currentX),
        y: Math.min(marqueeState.startY, marqueeState.currentY),
        width: Math.abs(marqueeState.currentX - marqueeState.startX),
        height: Math.abs(marqueeState.currentY - marqueeState.startY),
      } : undefined,
      calloutVignette,
      selectedCalloutPart: isPreviewMode ? null : activeSelectedCalloutPart,
      hoveredCalloutPart: isPreviewMode ? null : hoveredCalloutPart,
      previewMode: isPreviewMode,
    });
  }, [
    image, 
    focuses, 
    selectedFocusId, 
    selectedFocusIds,
    hoveredFocusId, 
    hoveredHandle, 
    bounds, 
    activeGuides, 
    userGuides, 
    globalStyles,
    blurZones, 
    selectedBlurId, 
    selectedBlurIds,
    hoveredBlurId, 
    maskShapes, 
    selectedMaskId, 
    selectedMaskIds,
    hoveredMaskId, 
    triangles, 
    selectedTriangleId, 
    selectedTriangleIds,
    hoveredTriangleId, 
    hoveredRotationCorner,
    marqueeState,
    calloutVignette, 
    activeSelectedCalloutPart, 
    hoveredCalloutPart, 
    isPreviewMode
  ]);

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
  const getBlurAtCoord = (cx: number, cy: number, layerFilter?: 'above' | 'below'): BlurZone | null => {
    for (let i = blurZones.length - 1; i >= 0; i--) {
      const b = blurZones[i];
      const bLayer = b.layer === 'below' ? 'below' : 'above';
      if (layerFilter && bLayer !== layerFilter) continue;
      if (cx >= b.x && cx <= b.x + b.width && cy >= b.y && cy <= b.y + b.height) {
        return b;
      }
    }
    return null;
  };

  // Hit-test mask shapes (with inverse rotation support)
  const getMaskAtCoord = (cx: number, cy: number, layerFilter?: 'above' | 'below'): MaskShape | null => {
    for (let i = maskShapes.length - 1; i >= 0; i--) {
      const m = maskShapes[i];
      const mLayer = m.layer === 'below' ? 'below' : 'above';
      if (layerFilter && mLayer !== layerFilter) continue;

      const cols = m.multiplier?.enabled ? Math.max(1, m.multiplier.cols || 2) : 1;
      const rows = m.multiplier?.enabled ? Math.max(1, m.multiplier.rows || 2) : 1;
      const gapX = m.multiplier?.gapX ?? 10;
      const gapY = m.multiplier?.gapY ?? 10;
      const totalW = cols * m.width + (cols - 1) * gapX;
      const totalH = rows * m.height + (rows - 1) * gapY;
      const centerX = m.x + totalW / 2;
      const centerY = m.y + totalH / 2;
      const rot = m.rotation || 0;

      // Inverse rotate (cx, cy) to local unrotated space
      const rotRad = -((rot * Math.PI) / 180);
      const dx = cx - centerX;
      const dy = cy - centerY;
      const lx = centerX + dx * Math.cos(rotRad) - dy * Math.sin(rotRad);
      const ly = centerY + dx * Math.sin(rotRad) + dy * Math.cos(rotRad);

      if (m.multiplier?.enabled) {
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const ix = m.x + c * (m.width + gapX);
            const iy = m.y + r * (m.height + gapY);
            if (lx >= ix && lx <= ix + m.width && ly >= iy && ly <= iy + m.height) {
              return m;
            }
          }
        }
      } else {
        if (lx >= m.x && lx <= m.x + m.width && ly >= m.y && ly <= m.y + m.height) {
          return m;
        }
      }
    }
    return null;
  };

  // Hit-test triangles (15x13px with inverse rotation support)
  const getTriangleAtCoord = (cx: number, cy: number): TriangleShape | null => {
    const pad = 4; // click tolerance padding
    for (let i = triangles.length - 1; i >= 0; i--) {
      const t = triangles[i];
      const w = t.width || 15;
      const h = t.height || 13;
      const centerX = t.x + w / 2;
      const centerY = t.y + h / 2;
      const rot = t.rotation || 0;

      const rotRad = -((rot * Math.PI) / 180);
      const dx = cx - centerX;
      const dy = cy - centerY;
      const lx = centerX + dx * Math.cos(rotRad) - dy * Math.sin(rotRad);
      const ly = centerY + dx * Math.sin(rotRad) + dy * Math.cos(rotRad);

      if (lx >= t.x - pad && lx <= t.x + w + pad && ly >= t.y - pad && ly <= t.y + h + pad) {
        return t;
      }
    }
    return null;
  };

  // Hit-test Photoshop-style Corner Rotation: check outer corner regions of selected mask or triangle
  const getPhotoshopRotationCornerAtCoord = (cx: number, cy: number): { 
    type: 'mask' | 'triangle'; 
    id: string; 
    corner: 'nw' | 'ne' | 'se' | 'sw';
    centerX: number;
    centerY: number;
    initialRotation: number;
  } | null => {
    // 1. Check selected masks
    const activeMaskIds = selectedMaskIds.length > 0 ? selectedMaskIds : (selectedMaskId ? [selectedMaskId] : []);
    for (const mId of activeMaskIds) {
      const mask = maskShapes.find((m) => m.id === mId);
      if (!mask) continue;
      const cols = mask.multiplier?.enabled ? Math.max(1, mask.multiplier.cols || 2) : 1;
      const rows = mask.multiplier?.enabled ? Math.max(1, mask.multiplier.rows || 2) : 1;
      const gapX = mask.multiplier?.gapX ?? 10;
      const gapY = mask.multiplier?.gapY ?? 10;
      const totalW = cols * mask.width + (cols - 1) * gapX;
      const totalH = rows * mask.height + (rows - 1) * gapY;
      const centerX = mask.x + totalW / 2;
      const centerY = mask.y + totalH / 2;
      const rot = mask.rotation || 0;

      const rotRad = -((rot * Math.PI) / 180);
      const dx = cx - centerX;
      const dy = cy - centerY;
      const lx = dx * Math.cos(rotRad) - dy * Math.sin(rotRad);
      const ly = dx * Math.sin(rotRad) + dy * Math.cos(rotRad);

      const halfW = totalW / 2;
      const halfH = totalH / 2;

      const corners: { corner: 'nw' | 'ne' | 'se' | 'sw'; x: number; y: number }[] = [
        { corner: 'nw', x: -halfW, y: -halfH },
        { corner: 'ne', x: halfW, y: -halfH },
        { corner: 'se', x: halfW, y: halfH },
        { corner: 'sw', x: -halfW, y: halfH },
      ];

      for (const c of corners) {
        const dist = Math.hypot(lx - c.x, ly - c.y);
        // Photoshop-style: cursor just outside the corner (between 3px and 18px)
        if (dist >= 3 && dist <= 20) {
          const isOutside = Math.abs(lx) >= halfW - 2 || Math.abs(ly) >= halfH - 2;
          if (isOutside) {
            return {
              type: 'mask',
              id: mask.id,
              corner: c.corner,
              centerX,
              centerY,
              initialRotation: rot,
            };
          }
        }
      }
    }

    // 2. Check selected triangles (15x13px or custom size)
    const activeTriangleIds = selectedTriangleIds.length > 0 ? selectedTriangleIds : (selectedTriangleId ? [selectedTriangleId] : []);
    for (const tId of activeTriangleIds) {
      const tri = triangles.find((t) => t.id === tId);
      if (!tri) continue;
      const w = tri.width || 15;
      const h = tri.height || 13;
      const centerX = tri.x + w / 2;
      const centerY = tri.y + h / 2;
      const rot = tri.rotation || 0;

      const rotRad = -((rot * Math.PI) / 180);
      const dx = cx - centerX;
      const dy = cy - centerY;
      const lx = dx * Math.cos(rotRad) - dy * Math.sin(rotRad);
      const ly = dx * Math.sin(rotRad) + dy * Math.cos(rotRad);

      const halfW = w / 2;
      const halfH = h / 2;

      const corners: { corner: 'nw' | 'ne' | 'se' | 'sw'; x: number; y: number }[] = [
        { corner: 'nw', x: -halfW, y: -halfH },
        { corner: 'ne', x: halfW, y: -halfH },
        { corner: 'se', x: halfW, y: halfH },
        { corner: 'sw', x: -halfW, y: halfH },
      ];

      for (const c of corners) {
        const dist = Math.hypot(lx - c.x, ly - c.y);
        if (dist >= 3 && dist <= 20) {
          const isOutside = Math.abs(lx) >= halfW - 2 || Math.abs(ly) >= halfH - 2;
          if (isOutside) {
            return {
              type: 'triangle',
              id: tri.id,
              corner: c.corner,
              centerX,
              centerY,
              initialRotation: rot,
            };
          }
        }
      }
    }

    return null;
  };

  // Hit-test existing User Guide on canvas
  const getGuideAtCoord = (cx: number, cy: number): UserGuide | null => {
    const pad = 5;
    for (let i = userGuides.length - 1; i >= 0; i--) {
      const g = userGuides[i];
      if (g.type === 'horizontal' && Math.abs(cy - g.position) <= pad) {
        return g;
      }
      if (g.type === 'vertical' && Math.abs(cx - g.position) <= pad) {
        return g;
      }
    }
    return null;
  };

  // Smart snapping calculation against screen borders, centers, and Photoshop guides
  const calculateSmartSnaps = (
    targetX: number, 
    targetY: number, 
    targetW: number, 
    targetH: number, 
    ignoreId?: string
  ): { snappedX: number; snappedY: number; smartGuides: SmartGuide[] } => {
    if (globalStyles.snapToGuides === false) {
      return { snappedX: targetX, snappedY: targetY, smartGuides: [] };
    }

    const threshold = 6;
    let snappedX = targetX;
    let snappedY = targetY;
    const smartGuides: SmartGuide[] = [];

    // Candidate X lines
    const candidateX: { pos: number; label: string }[] = [
      { pos: bounds.bgX, label: 'Bord gauche screen' },
      { pos: Math.round(bounds.bgX + bounds.bgWidth / 2), label: 'Centre screen' },
      { pos: bounds.bgX + bounds.bgWidth, label: 'Bord droit screen' },
    ];
    userGuides.filter(g => g.type === 'vertical').forEach(g => {
      candidateX.push({ pos: g.position, label: `Repère ${Math.round(g.position)}px` });
    });

    // Candidate Y lines
    const candidateY: { pos: number; label: string }[] = [
      { pos: bounds.bgY, label: 'Haut screen' },
      { pos: Math.round(bounds.bgY + bounds.bgHeight / 2), label: 'Milieu screen' },
      { pos: bounds.bgY + bounds.bgHeight, label: 'Bas screen' },
    ];
    userGuides.filter(g => g.type === 'horizontal').forEach(g => {
      candidateY.push({ pos: g.position, label: `Repère ${Math.round(g.position)}px` });
    });

    // Snap X (left, center, right)
    for (const c of candidateX) {
      if (Math.abs(targetX - c.pos) < threshold) {
        snappedX = c.pos;
        smartGuides.push({ type: 'vertical', position: c.pos, label: c.label });
        break;
      }
      if (Math.abs(targetX + targetW / 2 - c.pos) < threshold) {
        snappedX = c.pos - targetW / 2;
        smartGuides.push({ type: 'vertical', position: c.pos, label: c.label });
        break;
      }
      if (Math.abs(targetX + targetW - c.pos) < threshold) {
        snappedX = c.pos - targetW;
        smartGuides.push({ type: 'vertical', position: c.pos, label: c.label });
        break;
      }
    }

    // Snap Y (top, center, bottom)
    for (const c of candidateY) {
      if (Math.abs(targetY - c.pos) < threshold) {
        snappedY = c.pos;
        smartGuides.push({ type: 'horizontal', position: c.pos, label: c.label });
        break;
      }
      if (Math.abs(targetY + targetH / 2 - c.pos) < threshold) {
        snappedY = c.pos - targetH / 2;
        smartGuides.push({ type: 'horizontal', position: c.pos, label: c.label });
        break;
      }
      if (Math.abs(targetY + targetH - c.pos) < threshold) {
        snappedY = c.pos - targetH;
        smartGuides.push({ type: 'horizontal', position: c.pos, label: c.label });
        break;
      }
    }

    // Snap to Photoshop grid if enabled and not already snapped
    if (globalStyles.showGrid) {
      const gSize = globalStyles.gridSize || 20;
      if (snappedX === targetX) {
        const nearestGridX = Math.round(targetX / gSize) * gSize;
        if (Math.abs(targetX - nearestGridX) < threshold) {
          snappedX = nearestGridX;
          smartGuides.push({ type: 'vertical', position: nearestGridX, label: `Grille ${nearestGridX}px`, color: '#0088cc' });
        }
      }
      if (snappedY === targetY) {
        const nearestGridY = Math.round(targetY / gSize) * gSize;
        if (Math.abs(targetY - nearestGridY) < threshold) {
          snappedY = nearestGridY;
          smartGuides.push({ type: 'horizontal', position: nearestGridY, label: `Grille ${nearestGridY}px`, color: '#0088cc' });
        }
      }
    }

    return { snappedX: Math.round(snappedX), snappedY: Math.round(snappedY), smartGuides };
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

    // Dragging Guide from Ruler or moving existing guide
    if (draggingGuide) {
      const newPos = draggingGuide.type === 'horizontal' ? Math.round(cy) : Math.round(cx);
      setDraggingGuide((prev) => (prev ? { ...prev, position: newPos } : null));
      setHudInfo({
        x: cx,
        y: cy,
        text: draggingGuide.type === 'horizontal'
          ? `Repère Y: ${newPos} px (${newPos - bounds.bgY >= 0 ? '+' : ''}${newPos - bounds.bgY} px)`
          : `Repère X: ${newPos} px (${newPos - bounds.bgX >= 0 ? '+' : ''}${newPos - bounds.bgX} px)`,
      });
      return;
    }

    // Dragging Rotation (Photoshop-style corner rotation with Shift 15° snapping)
    if (dragRotateState) {
      const { centerX, centerY, startAngle, initialRotation } = dragRotateState;
      const curAngle = (Math.atan2(cy - centerY, cx - centerX) * 180) / Math.PI;
      const delta = curAngle - startAngle;
      let targetRot = Math.round(initialRotation + delta);
      while (targetRot > 180) targetRot -= 360;
      while (targetRot <= -180) targetRot += 360;

      // Photoshop Shift snap: 15° increments (0°, 15°, 30°, 45°, 60°, 75°, 90°...)
      if (e.shiftKey) {
        targetRot = Math.round(targetRot / 15) * 15;
      } else {
        // Subtle magnetic snap to cardinal angles
        const snapAngles = [0, 45, 90, 135, 180, -45, -90, -135];
        for (const sa of snapAngles) {
          if (Math.abs(targetRot - sa) <= 3) {
            targetRot = sa;
            break;
          }
        }
      }

      if (dragRotateState.type === 'mask') {
        onUpdateMask(dragRotateState.id, { rotation: targetRot });
      } else {
        onUpdateTriangle?.(dragRotateState.id, { rotation: targetRot });
      }

      setHudInfo({
        x: cx,
        y: cy,
        text: `Angle : ${targetRot}°${e.shiftKey ? ' (Shift: 15°)' : ''}`,
      });
      return;
    }

    // Dragging Multi-Selection (Moving all selected elements together smoothly without drift)
    if (multiDragState) {
      const dx = cx - multiDragState.startX;
      const dy = cy - multiDragState.startY;
      multiDragState.hasMoved = true;

      if (onBatchMove) {
        onBatchMove(dx, dy, {
          focuses: multiDragState.initialFocuses,
          blurs: multiDragState.initialBlurs,
          masks: multiDragState.initialMasks,
          triangles: multiDragState.initialTriangles,
        });
      } else {
        multiDragState.initialFocuses.forEach((f) => onUpdateFocus({ x: Math.round(f.x + dx), y: Math.round(f.y + dy) }));
        multiDragState.initialBlurs.forEach((b) => onUpdateBlur(b.id, { x: Math.round(b.x + dx), y: Math.round(b.y + dy) }));
        multiDragState.initialMasks.forEach((m) => onUpdateMask(m.id, { x: Math.round(m.x + dx), y: Math.round(m.y + dy) }));
        multiDragState.initialTriangles.forEach((t) => onUpdateTriangle?.(t.id, { x: Math.round(t.x + dx), y: Math.round(t.y + dy) }));
      }

      setHudInfo({
        x: cx,
        y: cy,
        text: `Déplacement multiple : ΔX: ${dx >= 0 ? '+' : ''}${Math.round(dx)} px  ΔY: ${dy >= 0 ? '+' : ''}${Math.round(dy)} px`,
      });
      return;
    }

    // Dragging Marquee Box Selection
    if (marqueeState) {
      setMarqueeState((prev) => (prev ? { ...prev, currentX: cx, currentY: cy } : null));
      return;
    }

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

    // Dragging Triangle (with Photoshop smart snapping)
    if (dragTriangleState && onUpdateTriangle) {
      const dx = cx - dragTriangleState.startX;
      const dy = cy - dragTriangleState.startY;
      const rawX = Math.round(dragTriangleState.initialX + dx);
      const rawY = Math.round(dragTriangleState.initialY + dy);
      const snap = calculateSmartSnaps(rawX, rawY, 15, 13, dragTriangleState.id);
      setActiveSnapGuides(snap.smartGuides);
      onUpdateTriangle(dragTriangleState.id, {
        x: snap.snappedX,
        y: snap.snappedY,
      });
      setHudInfo({
        x: cx,
        y: cy,
        text: `X: ${snap.snappedX} px  Y: ${snap.snappedY} px`,
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
        const rawX = Math.round(dragBlurState.initialX + dx);
        const rawY = Math.round(dragBlurState.initialY + dy);
        const snap = calculateSmartSnaps(rawX, rawY, dragBlurState.initialW, dragBlurState.initialH, dragBlurState.id);
        setActiveSnapGuides(snap.smartGuides);
        onUpdateBlur(dragBlurState.id, {
          x: snap.snappedX,
          y: snap.snappedY,
        });
        setHudInfo({
          x: cx,
          y: cy,
          text: `Flou X: ${snap.snappedX} px  Y: ${snap.snappedY} px`,
        });
      }
      return;
    }

    // Dragging Mask Shape (with Photoshop smart snapping)
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
        setHudInfo({
          x: cx,
          y: cy,
          text: `L: ${Math.round(newW)} px  H: ${Math.round(newH)} px`,
        });
      } else {
        const rawX = Math.round(dragMaskState.initialX + dx);
        const rawY = Math.round(dragMaskState.initialY + dy);
        const snap = calculateSmartSnaps(rawX, rawY, dragMaskState.initialW, dragMaskState.initialH, dragMaskState.id);
        setActiveSnapGuides(snap.smartGuides);
        onUpdateMask(dragMaskState.id, {
          x: snap.snappedX,
          y: snap.snappedY,
        });
        setHudInfo({
          x: cx,
          y: cy,
          text: `X: ${snap.snappedX} px  Y: ${snap.snappedY} px  L: ${dragMaskState.initialW} px  H: ${dragMaskState.initialH} px`,
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

        if (globalStyles.snapToGuides !== false) {
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

          // Also snap to user-placed Photoshop guides and grid!
          const snap = calculateSmartSnaps(newX, newY, init.width, init.height);
          if (snap.smartGuides.length > 0) {
            newX = snap.snappedX;
            newY = snap.snappedY;
            currentGuides.push(...snap.smartGuides);
          }
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

    // Photoshop-style corner rotation hover
    const rotCorner = getPhotoshopRotationCornerAtCoord(cx, cy);
    setHoveredRotationCorner(rotCorner ? { type: rotCorner.type, id: rotCorner.id, corner: rotCorner.corner } : null);

    // Guide hover
    const gHover = getGuideAtCoord(cx, cy);
    setHoveredGuide(gHover);

    // FLUID HOVER DETECTION OVER ALL ELEMENTS (Strict layering: Callout -> Triangle -> Mask (Above) -> Focus -> Mask (Below) -> Blur)
    const hCallout = getCalloutPartAtCoord(cx, cy);
    setHoveredCalloutPart(hCallout);

    const hTri = getTriangleAtCoord(cx, cy);
    setHoveredTriangleId(hTri ? hTri.id : null);

    const hMaskAbove = getMaskAtCoord(cx, cy, 'above');
    const hBlurAbove = getBlurAtCoord(cx, cy, 'above');
    const hasAboveObject = Boolean(hCallout || hTri || hMaskAbove || hBlurAbove);

    const hFocus = hasAboveObject ? null : getFocusAtCoord(cx, cy);
    const hasFocusOrAbove = Boolean(hasAboveObject || hFocus);

    const hMaskBelow = hasFocusOrAbove ? null : getMaskAtCoord(cx, cy, 'below');
    const hasBelowMaskOrAbove = Boolean(hasFocusOrAbove || hMaskBelow);

    const hBlurBelow = hasBelowMaskOrAbove ? null : getBlurAtCoord(cx, cy, 'below');

    const hMask = hMaskAbove || hMaskBelow;
    setHoveredMaskId(hMask ? hMask.id : null);

    const hBlur = hBlurAbove || hBlurBelow;
    setHoveredBlurId(hBlur ? hBlur.id : null);

    setHoveredFocusId(hFocus ? hFocus.id : null);
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

    // 0. Check if clicking Photoshop-style Corner Rotation on selected mask or triangle
    const clickedRotCorner = getPhotoshopRotationCornerAtCoord(cx, cy);
    if (clickedRotCorner) {
      const { centerX, centerY, id, type, initialRotation } = clickedRotCorner;
      const startAngle = (Math.atan2(cy - centerY, cx - centerX) * 180) / Math.PI;
      setDragRotateState({
        id,
        type,
        centerX,
        centerY,
        startAngle,
        initialRotation,
      });
      return;
    }

    // 0.b. Check if clicking existing guide line on canvas
    const clickedGuide = getGuideAtCoord(cx, cy);
    if (clickedGuide) {
      setDraggingGuide({
        type: clickedGuide.type,
        position: clickedGuide.position,
        isNew: false,
        guideId: clickedGuide.id,
      });
      return;
    }

    // 1. Check if clicking handles on selected Blur Zone (only when single blur is selected)
    const selectedBlur = blurZones.find((b) => b.id === selectedBlurId);
    if (selectedBlur && selectedBlurIds.length <= 1 && selectedFocusIds.length === 0 && selectedMaskIds.length === 0 && selectedTriangleIds.length === 0) {
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

    // 2. Check if clicking handles on selected Mask Shape (only when single mask is selected)
    const selectedMask = maskShapes.find((m) => m.id === selectedMaskId);
    if (selectedMask && selectedMaskIds.length <= 1 && selectedFocusIds.length === 0 && selectedBlurIds.length === 0 && selectedTriangleIds.length === 0) {
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

    // 3. Check if clicking handles of selected focus (only when single focus is selected)
    const selected = focuses.find((f) => f.id === selectedFocusId);
    if (selected && globalStyles.showHandles !== false && selectedFocusIds.length <= 1 && selectedBlurIds.length === 0 && selectedMaskIds.length === 0 && selectedTriangleIds.length === 0) {
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

    // Multi-Selection State Helpers
    const isShiftHolding = e.shiftKey;
    const activeFIds = selectedFocusIds.length > 0 ? selectedFocusIds : (selectedFocusId ? [selectedFocusId] : []);
    const activeBIds = selectedBlurIds.length > 0 ? selectedBlurIds : (selectedBlurId ? [selectedBlurId] : []);
    const activeMIds = selectedMaskIds.length > 0 ? selectedMaskIds : (selectedMaskId ? [selectedMaskId] : []);
    const activeTIds = selectedTriangleIds.length > 0 ? selectedTriangleIds : (selectedTriangleId ? [selectedTriangleId] : []);
    const totalSelectedCount = activeFIds.length + activeBIds.length + activeMIds.length + activeTIds.length;

    const startMultiDrag = () => {
      setMultiDragState({
        startX: cx,
        startY: cy,
        hasMoved: false,
        initialFocuses: focuses.filter((f) => activeFIds.includes(f.id)).map((f) => ({ id: f.id, x: f.x, y: f.y })),
        initialBlurs: blurZones.filter((b) => activeBIds.includes(b.id)).map((b) => ({ id: b.id, x: b.x, y: b.y })),
        initialMasks: maskShapes.filter((m) => activeMIds.includes(m.id)).map((m) => ({ id: m.id, x: m.x, y: m.y })),
        initialTriangles: triangles.filter((t) => activeTIds.includes(t.id)).map((t) => ({ id: t.id, x: t.x, y: t.y })),
      });
    };

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
      onClearSelection?.();
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

    // 5. PRIORITY SELECTION: Check clicked Triangle
    const clickedTriangle = getTriangleAtCoord(cx, cy);
    if (clickedTriangle) {
      updateSelectedCallout(null);

      if (isShiftHolding) {
        onSelectTriangle?.(clickedTriangle.id, true);
        return;
      }

      if (activeTIds.includes(clickedTriangle.id) && totalSelectedCount > 1) {
        startMultiDrag();
        return;
      }

      onSelectTriangle?.(clickedTriangle.id, false);
      setDragTriangleState({
        id: clickedTriangle.id,
        startX: cx,
        startY: cy,
        initialX: clickedTriangle.x,
        initialY: clickedTriangle.y,
      });
      return;
    }

    // 5.b. PRIORITY SELECTION: Check clicked Mask Shape positioned ABOVE focus zones
    const clickedMaskAbove = getMaskAtCoord(cx, cy, 'above');
    if (clickedMaskAbove) {
      updateSelectedCallout(null);

      if (isShiftHolding) {
        onSelectMask(clickedMaskAbove.id, true);
        return;
      }

      if (activeMIds.includes(clickedMaskAbove.id) && totalSelectedCount > 1) {
        startMultiDrag();
        return;
      }

      onSelectMask(clickedMaskAbove.id, false);
      setDragMaskState({
        id: clickedMaskAbove.id,
        startX: cx,
        startY: cy,
        initialX: clickedMaskAbove.x,
        initialY: clickedMaskAbove.y,
        initialW: clickedMaskAbove.width,
        initialH: clickedMaskAbove.height,
        handle: null,
      });
      return;
    }

    // 5.5. PRIORITY SELECTION: Check clicked Blur Zone positioned ABOVE focus zones
    const clickedBlurAbove = getBlurAtCoord(cx, cy, 'above');
    if (clickedBlurAbove) {
      updateSelectedCallout(null);

      if (isShiftHolding) {
        onSelectBlur(clickedBlurAbove.id, true);
        return;
      }

      if (activeBIds.includes(clickedBlurAbove.id) && totalSelectedCount > 1) {
        startMultiDrag();
        return;
      }

      onSelectBlur(clickedBlurAbove.id, false);
      setDragBlurState({
        id: clickedBlurAbove.id,
        startX: cx,
        startY: cy,
        initialX: clickedBlurAbove.x,
        initialY: clickedBlurAbove.y,
        initialW: clickedBlurAbove.width,
        initialH: clickedBlurAbove.height,
        handle: null,
      });
      return;
    }

    // 6. PRIORITY SELECTION: Check clicked Focus Zone
    const clickedFocus = getFocusAtCoord(cx, cy);
    if (clickedFocus) {
      updateSelectedCallout(null);

      if (isShiftHolding) {
        onSelectFocus(clickedFocus.id, true);
        return;
      }

      if (activeFIds.includes(clickedFocus.id) && totalSelectedCount > 1) {
        startMultiDrag();
        return;
      }

      onSelectFocus(clickedFocus.id, false);

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

    // 6.b. PRIORITY SELECTION: Check clicked Mask Shape positioned BEHIND focus zones
    const clickedMaskBelow = getMaskAtCoord(cx, cy, 'below');
    if (clickedMaskBelow) {
      updateSelectedCallout(null);

      if (isShiftHolding) {
        onSelectMask(clickedMaskBelow.id, true);
        return;
      }

      if (activeMIds.includes(clickedMaskBelow.id) && totalSelectedCount > 1) {
        startMultiDrag();
        return;
      }

      onSelectMask(clickedMaskBelow.id, false);
      setDragMaskState({
        id: clickedMaskBelow.id,
        startX: cx,
        startY: cy,
        initialX: clickedMaskBelow.x,
        initialY: clickedMaskBelow.y,
        initialW: clickedMaskBelow.width,
        initialH: clickedMaskBelow.height,
        handle: null,
      });
      return;
    }

    // 7. PRIORITY SELECTION: Check clicked Blur Zone positioned BEHIND focus zones (or fallback)
    const clickedBlur = getBlurAtCoord(cx, cy, 'below') || getBlurAtCoord(cx, cy);
    if (clickedBlur) {
      updateSelectedCallout(null);

      if (isShiftHolding) {
        onSelectBlur(clickedBlur.id, true);
        return;
      }

      if (activeBIds.includes(clickedBlur.id) && totalSelectedCount > 1) {
        startMultiDrag();
        return;
      }

      onSelectBlur(clickedBlur.id, false);
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

    // 8. Pan mode explicitly active
    if (isPanMode) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    // 9. Clicked empty background: clear selection unless Shift is held, and start Marquee Selection
    if (!isShiftHolding) {
      updateSelectedCallout(null);
      onSelectFocus(null);
      onSelectBlur(null);
      onSelectMask(null);
      onSelectTriangle?.(null);
      onClearSelection?.();
    }

    // Start Marquee Selection Box
    setMarqueeState({
      startX: cx,
      startY: cy,
      currentX: cx,
      currentY: cy,
    });
  };

  const handleMouseUp = (e?: React.MouseEvent<HTMLCanvasElement>) => {
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
    if (multiDragState) {
      if (multiDragState.hasMoved) {
        onBatchMoveEnd?.();
      }
      setMultiDragState(null);
    }

    // Finalize Marquee Selection Box
    if (marqueeState) {
      const minX = Math.min(marqueeState.startX, marqueeState.currentX);
      const maxX = Math.max(marqueeState.startX, marqueeState.currentX);
      const minY = Math.min(marqueeState.startY, marqueeState.currentY);
      const maxY = Math.max(marqueeState.startY, marqueeState.currentY);

      if (maxX - minX > 4 || maxY - minY > 4) {
        const hitFocusIds = focuses
          .filter((f) => f.x + f.width >= minX && f.x <= maxX && f.y + f.height >= minY && f.y <= maxY)
          .map((f) => f.id);
        const hitBlurIds = blurZones
          .filter((b) => b.x + b.width >= minX && b.x <= maxX && b.y + b.height >= minY && b.y <= maxY)
          .map((b) => b.id);
        const hitMaskIds = maskShapes
          .filter((m) => {
            const mw = m.multiplier?.enabled ? (m.multiplier.cols || 2) * m.width + ((m.multiplier.cols || 2) - 1) * (m.multiplier.gapX ?? 10) : m.width;
            const mh = m.multiplier?.enabled ? (m.multiplier.rows || 2) * m.height + ((m.multiplier.rows || 2) - 1) * (m.multiplier.gapY ?? 10) : m.height;
            return m.x + mw >= minX && m.x <= maxX && m.y + mh >= minY && m.y <= maxY;
          })
          .map((m) => m.id);
        const hitTriangleIds = triangles
          .filter((t) => t.x + (t.width || 15) >= minX && t.x <= maxX && t.y + (t.height || 13) >= minY && t.y <= maxY)
          .map((t) => t.id);

        if (hitFocusIds.length > 0 || hitBlurIds.length > 0 || hitMaskIds.length > 0 || hitTriangleIds.length > 0) {
          onSelectMultiple?.(
            {
              focusIds: hitFocusIds,
              blurIds: hitBlurIds,
              maskIds: hitMaskIds,
              triangleIds: hitTriangleIds,
            },
            e.shiftKey
          );
        }
      }
      setMarqueeState(null);
    }

    // Finalize guide dragging
    if (draggingGuide) {
      if (draggingGuide.isNew) {
        onAddCustomGuide?.(draggingGuide.type, draggingGuide.position);
      } else if (draggingGuide.guideId) {
        // If dragged outside canvas or back onto ruler, delete guide!
        const isOffscreen = draggingGuide.type === 'horizontal' 
          ? (draggingGuide.position < 0 || draggingGuide.position > bounds.canvasHeight)
          : (draggingGuide.position < 0 || draggingGuide.position > bounds.canvasWidth);
        if (isOffscreen) {
          onDeleteGuide?.(draggingGuide.guideId);
        } else {
          onUpdateGuide?.(draggingGuide.guideId, draggingGuide.position);
        }
      }
      setDraggingGuide(null);
    }

    if (dragRotateState) setDragRotateState(null);
    setActiveSnapGuides([]);
    setHudInfo(null);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x: cx, y: cy } = clientToCanvasCoord(e.clientX, e.clientY);

    // Double-click on existing guide -> delete it!
    const clickedGuide = getGuideAtCoord(cx, cy);
    if (clickedGuide && onDeleteGuide) {
      onDeleteGuide(clickedGuide.id);
      return;
    }

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
    if (draggingGuide) return draggingGuide.type === 'horizontal' ? 'ns-resize' : 'ew-resize';
    if (hoveredGuide) return hoveredGuide.type === 'horizontal' ? 'ns-resize' : 'ew-resize';
    if (dragRotateState || hoveredRotationCorner) {
      return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M12 4C7.58 4 4 7.58 4 12' stroke='%23000' stroke-width='2.5' stroke-linecap='round'/%3E%3Cpath d='M12 4C7.58 4 4 7.58 4 12' stroke='%23fff' stroke-width='1.5' stroke-linecap='round'/%3E%3Cpath d='M14 2L11 4.5L14 7' fill='%23000'/%3E%3Cpath d='M14 2L11 4.5L14 7' stroke='%23fff' stroke-width='0.75' fill='%23000'/%3E%3Cpath d='M12 20C16.42 20 20 16.42 20 12' stroke='%23000' stroke-width='2.5' stroke-linecap='round'/%3E%3Cpath d='M12 20C16.42 20 20 16.42 20 12' stroke='%23fff' stroke-width='1.5' stroke-linecap='round'/%3E%3Cpath d='M10 22L13 19.5L10 17' fill='%23000'/%3E%3Cpath d='M10 22L13 19.5L10 17' stroke='%23fff' stroke-width='0.75' fill='%23000'/%3E%3C/svg%3E") 12 12, crosshair`;
    }
    if (multiDragState) return 'move';
    if (marqueeState) return 'crosshair';
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

    const activeF = selectedFocusIds.length > 0 ? selectedFocusIds : (selectedFocusId ? [selectedFocusId] : []);
    const activeB = selectedBlurIds.length > 0 ? selectedBlurIds : (selectedBlurId ? [selectedBlurId] : []);
    const activeM = selectedMaskIds.length > 0 ? selectedMaskIds : (selectedMaskId ? [selectedMaskId] : []);
    const activeT = selectedTriangleIds.length > 0 ? selectedTriangleIds : (selectedTriangleId ? [selectedTriangleId] : []);

    if (
      (hoveredTriangleId && activeT.includes(hoveredTriangleId)) ||
      (hoveredMaskId && activeM.includes(hoveredMaskId)) ||
      (hoveredBlurId && activeB.includes(hoveredBlurId))
    ) {
      return 'move';
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
      return activeF.includes(hoveredFocusId) ? 'move' : 'pointer';
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
                  className={`w-5 h-5 flex items-center justify-center text-[9px] font-mono select-none shrink-0 border-t border-l border-r border-b ${
                    isDarkMode ? 'bg-[#1e1e1e] border-[#383838] text-[#888888]' : 'bg-[#e5e7eb] border-[#d1d5db] text-[#6b7280]'
                  }`}
                  title="Origine des règles Photoshop (en pixels)"
                >
                  px
                </div>
                <TopRuler
                  width={bounds.canvasWidth}
                  bgX={bounds.bgX}
                  bgWidth={bounds.bgWidth}
                  cursorX={canvasMousePos?.x}
                  onAddGuideH={onAddGuideH}
                  onStartDragGuide={(type) => {
                    setDraggingGuide({
                      type: 'horizontal',
                      position: bounds.bgY,
                      isNew: true,
                    });
                  }}
                  isDarkMode={isDarkMode}
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
                  onStartDragGuide={(type) => {
                    setDraggingGuide({
                      type: 'vertical',
                      position: bounds.bgX,
                      isNew: true,
                    });
                  }}
                  isDarkMode={isDarkMode}
                />
                <div 
                  className="relative photoshop-checkerboard border-b border-r border-slate-300"
                  style={{
                    width: `${bounds.canvasWidth}px`,
                    height: `${bounds.canvasHeight}px`,
                  }}
                >
                  {/* Floating Photoshop Precision HUD badge */}
                  {hudInfo && (
                    <div 
                      className="absolute pointer-events-none z-50 px-2 py-0.5 rounded-md bg-[#0f172a]/90 text-white font-mono text-[10px] shadow-lg border border-white/20 whitespace-nowrap -translate-x-1/2 -translate-y-8 select-none"
                      style={{ left: `${hudInfo.x}px`, top: `${hudInfo.y}px` }}
                    >
                      {hudInfo.text}
                    </div>
                  )}
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
