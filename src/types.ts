/**
 * Types for the Focus technical visual procedure generator
 */

export interface FocusZone {
  id: string;
  name: string; // e.g., "Focus 1", "Empreintes"
  // Geometry on the composition canvas
  x: number;
  y: number;
  width: number;
  height: number;
  
  // Magnification & Source sampling
  zoom: number; // e.g., 1.0 to 3.5 (default: 1.4)
  
  // Source area offset relative to the focus center
  sourceOffsetX: number;
  sourceOffsetY: number;
  
  // Visual styling
  borderWidth: number; // in points/pixels (default: 2)
  borderColor: string; // default: #25465F
  borderRadius: number; // rounded corners in pixels (default: 12)
  
  // Step Number Badge (Ex: "3" - odd left, even right)
  stepNumber: number; // 1, 2, 3...
  showStepBadge: boolean; // default true
  badgePosition: 'auto' | 'left' | 'right'; // 'auto': odd=left, even=right
  badgeColor?: string; // default: #25465F
  
  // Depth / Shadow (Ombre portée: opacité 30%, angle 90°, distance 2px, taille 2px, #25465F)
  hasShadow?: boolean; // default true
  shadowColor?: string; // default: #25465F
  shadowOpacity?: number; // default: 0.30 (30%)
  shadowAngle?: number; // default: 90 (90°)
  shadowDistance?: number; // default: 2 (2px)
  shadowSize?: number; // default: 2 (2px)
  shadowBlur?: number; // default 2
  shadowOffsetX?: number; // default 0
  shadowOffsetY?: number; // default 2
  
  // Optional leader / callout line if displaced from original position
  showLeaderLine?: boolean;
}

export interface SmartGuide {
  type: 'vertical' | 'horizontal';
  position: number;
  label?: string;
  color?: string;
}

export interface ContainerStyle {
  borderRadius: number; // Always 0 (coins droits sans arrondi)
  showShadow: boolean; // default: true
  shadowBlur: number; // default: 20
  borderWidth: number; // default: 1
  borderColor: string; // default: rgba(37, 70, 95, 0.3)
}

export interface AnnotationArrow {
  id: string;
  focusId: string;
  visible: boolean;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  width: number;
  label?: string;
}

export interface BlurZone {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  blurRadius: number; // in pixels, e.g. 10
  borderRadius?: number; // e.g. 4
}

export interface MaskShape {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string; // #25465F by default
  opacity?: number; // 0 to 1, default 1
  borderRadius?: number; // default 4
  borderWidth?: number; // 0, 1, 2, etc.
  borderColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  clipImage?: {
    dataUrl: string;
    name: string;
    element?: HTMLImageElement;
    scale?: number;
    offsetX?: number;
    offsetY?: number;
  };
}

export interface TriangleShape {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number; // default 15px
  height: number; // default 13px
  color: string; // default #25465F or #ffffff
  direction: 'down' | 'up' | 'left' | 'right'; // default 'down'
  borderWidth?: number;
  borderColor?: string;
  opacity?: number; // 0 to 1
}

export interface CalloutVignette {
  enabled: boolean;
  // Source sampling on the screen
  sourceX: number; // position on screen in composition coords (left)
  sourceY: number; // top
  sourceCenterX?: number; // persistent absolute sub-pixel center anchor X
  sourceCenterY?: number; // persistent absolute sub-pixel center anchor Y
  sourceWidth: number; // sampling diameter/size (default 40px)
  sourceHeight: number;
  sourceZoom?: number; // default 1.0 (fine-tuning crop zoom)

  // Vignette geometry (placed 5px from left edge of screen: x = bgX - 5 - width)
  width: number; // diameter / size (default 100px)
  height: number;
  offsetY: number; // vertical position in composition coords
  gap: number; // distance in px from screen border (default 5px)
  alignBottom?: boolean; // strictly aligned to the bottom of the screenshot (default true)
  
  // Styling
  shape: 'circle' | 'rounded'; // circle or custom rounded rectangle
  borderRadius: number; // e.g. 50% for circle (width/2) or custom (0 to 50px)
  borderWidth: number; // default 0 or 2
  borderColor: string; // default '#ffffff' or '#25465F'
  
  // Drop shadow behind vignette (ombre portée: opacité 50%, distance 5px, taille 2px)
  showShadow: boolean; // default true
  shadowDistance?: number; // default 5 (5px)
  shadowSize?: number; // default 2 (2px)
  shadowBlur: number; // default 2
  shadowOpacity: number; // default 0.50 (50%)
  shadowOffsetX?: number; // default 0
  shadowOffsetY?: number; // default 5
  
  // Floor shadow (legacy compatibility)
  showFloorShadow?: boolean;
  floorShadowBlur?: number;
  floorShadowOpacity?: number;
  floorShadowOffsetY?: number;
  
  // Optional custom image replacement (HD icon)
  customImage?: {
    dataUrl: string;
    element?: HTMLImageElement;
  };
}

export interface UserGuide {
  id: string;
  type: 'horizontal' | 'vertical';
  position: number; // pixel position along the axis
}

export interface GlobalStyleSettings {
  bgTintColor: string; // default #25465F
  bgTintOpacity: number; // default 0.50 (50%)
  exportScale: 1 | 2 | 3; // 1x, 2x (HD), 3x (4K)
  container: ContainerStyle;
  workspaceWidth: number; // Width of the Photoshop-style canvas workspace (up to 500px max)
  showRulers: boolean;
  showHandles: boolean;
  showGuides: boolean;
  previewHD: boolean;
}

export interface DetectedElement {
  id: string;
  label: string; // e.g. "Bouton", "Ligne de menu", "Icône", "Champ texte"
  type: 'button' | 'menu-item' | 'icon' | 'text' | 'input' | 'card';
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export interface LoadedImage {
  name: string;
  element: HTMLImageElement;
  dataUrl: string;
  originalWidth: number;
  originalHeight: number;
  displayWidth: number;
  displayHeight: number;
  scaleFactor: number; // displayHeight / originalHeight
}

export interface CompositionDimensions {
  width: number;
  height: number; // strictly <= 490px
  scale: number;
  imageX: number;
  imageY: number;
}

export type ResizeHandle = 
  | 'nw' | 'n' | 'ne' 
  | 'w' | 'e' 
  | 'sw' | 's' | 'se';

export interface DragState {
  isDragging: boolean;
  isResizing: boolean;
  handle: ResizeHandle | null;
  focusId: string;
  startX: number;
  startY: number;
  initialFocus: FocusZone;
  initialArrow?: AnnotationArrow;
}
