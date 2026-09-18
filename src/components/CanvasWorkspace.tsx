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
  TriangleShape
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
  onAddFocus: () => void;
  onDeleteFocus?: (id: string) => void;
  onAddFocusAt: (x: number, y: number, w?: number, h?: number, label?: string) => void;
  // Blur Zones
  blurZones: BlurZone[];
  selectedBlurId: string | null;
  onSelectBlur: (id: string | null) => void;
  onAddBlur: () => void;
  onAddBlurAt: (x: number, y: number) => void;
  onUpdateBlur: (id: string, updated: Partial<BlurZone>) => void;
  onDeleteBlur: (id: string) => void;
  // Mask Shapes
  maskShapes: MaskShape[];
  selectedMaskId: string | null;
  onSelectMask: (id: string | null) => void;
  onAddMask: () => void;
  onAddMaskAt: (x: number, y: number) => void;
  onUpdateMask: (id: string, updated: Partial<MaskShape>) => void;
  onDeleteMask: (id: string) => void;
  // Triangle Shapes (15x13px)
  triangles?: TriangleShape[];
  selectedTriangleId?: string | null;
  onSelectTriangle?: (id: string | null) => void;
  onAddTriangle?: () => void;
  onAddTriangleAt?: (x: number, y: number) => void;
  onUpdateTriangle?: (id: string, updated: Partial<TriangleShape>) => void;
  onDeleteTriangle?: (id: string) => void;
  // Active Tool
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  // Preview Mode
  isPreviewMode: boolean;
  onTogglePreview: () => void;
  // Export trigger from toolbar
  onExportClick: () => void;
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
  // History
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
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
  onAddFocusAt,
  blurZones,
  selectedBlurId,
  onSelectBlur,
  onAddBlur,
  onAddBlurAt,
  onUpdateBlur,
  onDeleteBlur,
  maskShapes,
  selectedMaskId,
  onSelectMask,
  onAddMask,
  onAddMaskAt,
  onUpdateMask,
  onDeleteMask,
  triangles = [],
  selectedTriangleId = null,
  onSelectTriangle,
  onAddTriangle,
  onAddTriangleAt,
  onUpdateTriangle,
  onDeleteTriangle,
  activeTool,
  onSelectTool,
  isPreviewMode,
  onTogglePreview,
  onExportClick,
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
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
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
      setDragBlurState(null);
      setDragMaskState(null);
      setDragTriangleState(null);
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
  }, []);

  // Calculate composition bounds with adjustable workspace width up to 500px
  const bounds = calculateCompositionBounds(image, focuses, globalStyles.workspaceWidth);

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

  // Hit-test handles of the selected focus
  const getHandleAtCoord = (cx: number, cy: number, focus: FocusZone): ResizeHandle | null => {
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

  // Hit-test focus bodies
  const getFocusAtCoord = (cx: number, cy: number): FocusZone | null => {
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
      if (cx >= m.x && cx <= m.x + m.width && cy >= m.y && cy <= m.y + m.height) {
        return m;
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
        const focusCenterX = newX + init.width / 2;
        const phoneCenterX = bounds.bgX + bounds.bgWidth / 2;
        const snapDist = 6;

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

    // FLUID HOVER DETECTION OVER ALL ELEMENTS (Triangle -> Mask -> Blur -> Focus)
    const hTri = getTriangleAtCoord(cx, cy);
    setHoveredTriangleId(hTri ? hTri.id : null);

    const hMask = getMaskAtCoord(cx, cy);
    setHoveredMaskId(hMask ? hMask.id : null);

    const hBlur = getBlurAtCoord(cx, cy);
    setHoveredBlurId(hBlur ? hBlur.id : null);

    const hFocus = getFocusAtCoord(cx, cy);
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
      const handle = getGenericHandleAtCoord(cx, cy, selectedMask);
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

    // 4. PRIORITY SELECTION: Check clicked Triangle FIRST
    const clickedTriangle = getTriangleAtCoord(cx, cy);
    if (clickedTriangle) {
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

    // 6. PRIORITY SELECTION: Check clicked Blur Zone (fluid selection without focus interference)
    const clickedBlur = getBlurAtCoord(cx, cy);
    if (clickedBlur) {
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

    // 7. Check if clicking on any focus zone
    const clickedFocus = getFocusAtCoord(cx, cy);
    if (clickedFocus) {
      onSelectFocus(clickedFocus.id);
      onSelectBlur(null);
      onSelectMask(null);
      onSelectTriangle?.(null);
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

    // 8. Clicked empty background
    if (isPanMode) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    onSelectFocus(null);
    onSelectBlur(null);
    onSelectMask(null);
    onSelectTriangle?.(null);
  };

  const handleMouseUp = () => {
    if (isPanning) setIsPanning(false);
    if (dragState) {
      setDragState(null);
      setActiveGuides([]);
    }
    if (dragBlurState) setDragBlurState(null);
    if (dragMaskState) setDragMaskState(null);
    if (dragTriangleState) setDragTriangleState(null);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Only allow double-click creation if user explicitly has the 'focus' tool selected
    if (activeTool !== 'focus') return;
    const { x: cx, y: cy } = clientToCanvasCoord(e.clientX, e.clientY);
    const defaultW = 240;
    const defaultH = 50;
    onAddFocusAt(
      Math.round(cx - defaultW / 2),
      Math.round(cy - defaultH / 2),
      defaultW,
      defaultH
    );
    onSelectTool('select');
  };

  // Photoshop-style wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey || e.altKey) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      const nextZoom = Math.min(5, Math.max(0.25, Math.round((zoomLevel + delta) * 100) / 100));
      setZoomLevel(nextZoom);
    }
  };

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
    if (activeTool === 'zoom') return isAltPressed ? 'zoom-out' : 'zoom-in';
    if (activeTool === 'blur' || activeTool === 'mask' || activeTool === 'triangle') return 'crosshair';
    if (isPanMode) return 'grab';
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
    if (hoveredFocusId) {
      return hoveredFocusId === selectedFocusId ? 'move' : 'pointer';
    }
    return 'default';
  };

  const selectedFocus = focuses.find((f) => f.id === selectedFocusId);

  return (
    <div 
      ref={containerRef}
      className="flex-1 max-w-3xl xl:max-w-4xl flex flex-col h-full max-h-[calc(100vh-7rem)] bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-[#979797]/15 relative overflow-hidden select-none p-3.5 gap-3"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onWheel={handleWheel}
    >
      {/* Top Scene Bar */}
      <TopSceneBar
        screenWidth={image?.displayWidth ?? 180}
        screenHeight={image?.displayHeight ?? 390}
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
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      {/* Main Canvas Viewport Area */}
      <div className="flex-1 relative flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-[#eeeeee]/40 border border-white/60 shadow-inner">
        {/* Banner indicator if Preview Mode is ON */}
        {isPreviewMode && (
          <div className="absolute top-4 z-40 bg-[#0088cc]/90 text-white backdrop-blur-xl px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2.5 text-xs font-medium animate-in fade-in">
            <Eye className="w-3.5 h-3.5" />
            <span>Mode Prévisualisation (rendu final net sans repères)</span>
            <button
              onClick={onTogglePreview}
              className="ml-2 hover:bg-white/20 p-0.5 rounded-full transition-colors"
              title="Quitter la prévisualisation"
            >
              <X className="w-3.5 h-3.5" />
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
            onAddBlur={onAddBlur}
            onAddMask={onAddMask}
            onAddTriangle={onAddTriangle}
            isPanMode={isPanMode}
            onTogglePanMode={() => setIsPanMode(!isPanMode)}
            isDetecting={false}
            showDetection={showDetectedOverlay}
            onToggleDetection={() => onUpdateGlobalStyles({ showGuides: !globalStyles.showGuides })}
            showHandles={globalStyles.showHandles !== false}
            onToggleHandles={() => onUpdateGlobalStyles({ showHandles: !globalStyles.showHandles })}
            onExportClick={onExportClick}
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
            onDeleteFocusWithId={(id) => onDeleteFocus?.(id)}
            isPreviewMode={isPreviewMode}
            onTogglePreview={onTogglePreview}
            onUndo={onUndo}
            onRedo={onRedo}
            canUndo={canUndo}
            canRedo={canRedo}
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
