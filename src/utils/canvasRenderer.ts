/**
 * High-fidelity Canvas 2D rendering engine for procedure visuals.
 *
 * Rules:
 * - Screenshot corners: always straight square corners (no rounded corners, no drop shadow).
 * - Screenshot border: MUST ALWAYS have a 1px border of color #25465F.
 * - Step Badge (Pastille): MUST be a 20x20px square with 5px rounded corners,
 *   must NOT be cut by the rectangle, strictly without contour/border,
 *   and drawn at the absolute FOREGROUND (premier plan).
 * - Blue Mask shape: MUST be color #25465F.
 * - High-efficiency Blur: powerful frosted / downsampled blur guaranteeing complete anonymization.
 * - Visual Hover feedback: intuitive, ergonomic highlighting so users clearly see which zone is targeted.
 * - Preview Mode: displays exactly what the final exported PNG will look like.
 */

import { 
  FocusZone, 
  LoadedImage, 
  ResizeHandle, 
  SmartGuide, 
  GlobalStyleSettings,
  AnnotationArrow,
  UserGuide,
  BlurZone,
  MaskShape,
  TriangleShape,
  CalloutVignette
} from '../types';

export const BASE_COLOR = '#25465F'; // Corporate navy cyan #25465F
export const DEFAULT_WORKSPACE_WIDTH = 260; // Default workspace width in px (260px)
export const MIN_WORKSPACE_WIDTH = 240;
export const MAX_WORKSPACE_WIDTH = 500; // Cap at 500px max per requirement

export interface RenderOptions {
  interactive?: boolean;
  selectedFocusId?: string | null;
  hoveredFocusId?: string | null;
  hoveredHandle?: ResizeHandle | null;
  internalFramingFocusId?: string | null;
  smartGuides?: SmartGuide[];
  userGuides?: UserGuide[];
  arrows?: AnnotationArrow[];
  globalStyles?: Partial<GlobalStyleSettings>;
  showGuides?: boolean;
  showRulers?: boolean;
  skipClear?: boolean;
  blurZones?: BlurZone[];
  selectedBlurId?: string | null;
  hoveredBlurId?: string | null;
  maskShapes?: MaskShape[];
  selectedMaskId?: string | null;
  hoveredMaskId?: string | null;
  triangles?: TriangleShape[];
  selectedTriangleId?: string | null;
  hoveredTriangleId?: string | null;
  calloutVignette?: CalloutVignette | null;
  selectedCalloutPart?: 'source' | 'vignette' | null;
  hoveredCalloutPart?: 'source' | 'vignette' | null;
  previewMode?: boolean;
}

/**
 * Calculates the stable composition dimensions for the workspace.
 * - Screenshot size: resized homothetically to max 180px width and max 390px height.
 * - Workspace width: configurable up to 500px max (default: 440px).
 * - Screenshot stays centered horizontally and vertically inside the workspace.
 */
export function calculateCompositionBounds(
  image: LoadedImage | null,
  _focuses?: FocusZone[],
  workspaceWidth = DEFAULT_WORKSPACE_WIDTH,
  calloutVignette?: CalloutVignette | null
): {
  canvasWidth: number;
  canvasHeight: number;
  bgX: number;
  bgY: number;
  bgWidth: number;
  bgHeight: number;
  scale: number;
} {
  const origW = image ? image.originalWidth : 180;
  const origH = image ? image.originalHeight : 390;

  // Screenshot resizes to 180px max width and 390px max height, homothetically
  const maxW = 180;
  const maxH = 390;
  const bgScale = Math.min(maxW / origW, maxH / origH);
  const bgWidth = Math.round(origW * bgScale);
  const bgHeight = Math.round(origH * bgScale);

  const canvasHeight = Math.min(500, Math.max(420, bgHeight + 40));
  const bgY = Math.round((canvasHeight - bgHeight) / 2);

  // When Callout mode is chosen:
  // "la largeur doit comprendre la vignette et le screenshot ensemble avec une marge de sécurité de 15px à gauche et à droite."
  if (calloutVignette && calloutVignette.enabled) {
    const margin = 15; // 15px safety margin on left and right
    const vigW = calloutVignette.width || 100;
    const gap = calloutVignette.gap ?? 5; // 5px gap between vignette and screenshot
    const canvasWidth = margin + vigW + gap + bgWidth + margin;
    const bgX = margin + vigW + gap;

    return {
      canvasWidth,
      canvasHeight,
      bgX,
      bgY,
      bgWidth,
      bgHeight,
      scale: bgScale,
    };
  }

  const canvasWidth = Math.min(MAX_WORKSPACE_WIDTH, Math.max(MIN_WORKSPACE_WIDTH, Math.round(workspaceWidth || DEFAULT_WORKSPACE_WIDTH)));
  const bgX = Math.round((canvasWidth - bgWidth) / 2);

  return {
    canvasWidth,
    canvasHeight,
    bgX,
    bgY,
    bgWidth,
    bgHeight,
    scale: bgScale,
  };
}

/**
 * Calculates tight bounding box around the active visual elements for clean PNG export
 */
export function calculateExportBounds(
  image: LoadedImage | null,
  focuses: FocusZone[],
  arrows: AnnotationArrow[] = [],
  padding = 16,
  workspaceWidth = DEFAULT_WORKSPACE_WIDTH,
  blurZones: BlurZone[] = [],
  maskShapes: MaskShape[] = [],
  triangles: TriangleShape[] = [],
  calloutVignette?: CalloutVignette | null
): {
  exportWidth: number;
  exportHeight: number;
  offsetX: number;
  offsetY: number;
} {
  const isCalloutMode = Boolean(calloutVignette && calloutVignette.enabled);

  // In Callout mode: width strictly encompasses vignette and screenshot with 15px safety margins
  if (isCalloutMode && calloutVignette) {
    const { canvasWidth, bgX, bgY, bgWidth, bgHeight } = calculateCompositionBounds(
      image,
      focuses,
      workspaceWidth,
      calloutVignette
    );

    const vigW = calloutVignette.width || 100;
    const vigH = calloutVignette.height || vigW;
    const shadowDist = (calloutVignette.showShadow !== false)
      ? (calloutVignette.shadowDistance ?? calloutVignette.shadowOffsetY ?? 5)
      : 0;
    const alignedBottomY = bgY + bgHeight - vigH - shadowDist;
    const vigY = calloutVignette.alignBottom !== false ? alignedBottomY : (calloutVignette.offsetY ?? alignedBottomY);

    const minY = Math.min(vigY, bgY) - 15;
    const maxY = Math.max(vigY + vigH + shadowDist, bgY + bgHeight) + 15;

    return {
      exportWidth: canvasWidth,
      exportHeight: Math.max(60, Math.round(maxY - minY)),
      offsetX: 0,
      offsetY: Math.round(-minY),
    };
  }

  const { bgX, bgY, bgWidth, bgHeight } = calculateCompositionBounds(image, focuses, workspaceWidth, calloutVignette);

  let minX = bgX;
  let maxX = bgX + bgWidth;
  let minY = bgY;
  let maxY = bgY + bgHeight;

  // Account for Callout Vignette placed at gap (default 5px) to the left of the screen
  if (calloutVignette && calloutVignette.enabled) {
    const gap = calloutVignette.gap ?? 5;
    const vigW = calloutVignette.width || 100;
    const vigH = calloutVignette.height || vigW;
    const vigX = bgX - gap - vigW;
    const vigY = calloutVignette.offsetY;

    minX = Math.min(minX, vigX - 10);
    maxX = Math.max(maxX, vigX + vigW + 10);
    minY = Math.min(minY, vigY - 5);
    maxY = Math.max(maxY, vigY + vigH + 15);
  }

  focuses.forEach((f) => {
    minX = Math.min(minX, f.x);
    maxX = Math.max(maxX, f.x + f.width);
    minY = Math.min(minY, f.y);
    maxY = Math.max(maxY, f.y + f.height);

    // Also account for 20x20 step badge: centered on screen border, 15px exceeding above focus zone (5px overlapping top)
    if (f.showStepBadge !== false && f.stepNumber !== undefined) {
      const num = f.stepNumber || 1;
      const alignLeft = f.badgePosition === 'left' ? true : f.badgePosition === 'right' ? false : (num % 2 !== 0);
      const badgeX = alignLeft ? bgX - 10 : bgX + bgWidth - 10;
      const badgeY = f.y - 15;
      minX = Math.min(minX, badgeX);
      maxX = Math.max(maxX, badgeX + 20);
      minY = Math.min(minY, badgeY);
      maxY = Math.max(maxY, badgeY + 20);
    }
  });

  arrows.forEach((a) => {
    if (!a.visible) return;
    minX = Math.min(minX, a.startX, a.endX);
    maxX = Math.max(maxX, a.startX, a.endX);
    minY = Math.min(minY, a.startY, a.endY);
    maxY = Math.max(maxY, a.startY, a.endY);
  });

  blurZones.forEach((b) => {
    minX = Math.min(minX, b.x);
    maxX = Math.max(maxX, b.x + b.width);
    minY = Math.min(minY, b.y);
    maxY = Math.max(maxY, b.y + b.height);
  });

  maskShapes.forEach((m) => {
    minX = Math.min(minX, m.x);
    maxX = Math.max(maxX, m.x + m.width);
    minY = Math.min(minY, m.y);
    maxY = Math.max(maxY, m.y + m.height);
  });

  triangles.forEach((t) => {
    minX = Math.min(minX, t.x);
    maxX = Math.max(maxX, t.x + t.width);
    minY = Math.min(minY, t.y);
    maxY = Math.max(maxY, t.y + t.height);
  });

  const exportWidth = Math.max(60, Math.round(maxX - minX + padding * 2));
  const exportHeight = Math.max(60, Math.round(maxY - minY + padding * 2));
  const offsetX = Math.round(-minX + padding);
  const offsetY = Math.round(-minY + padding);

  return {
    exportWidth,
    exportHeight,
    offsetX,
    offsetY,
  };
}

/**
 * Draws the visual composition onto any CanvasRenderingContext2D.
 */
export function drawComposition(
  ctx: CanvasRenderingContext2D,
  image: LoadedImage | null,
  focuses: FocusZone[],
  options: RenderOptions = {}
) {
  const { 
    interactive = false, 
    selectedFocusId = null, 
    hoveredFocusId = null,
    internalFramingFocusId = null,
    smartGuides = [],
    userGuides = [],
    globalStyles = {},
    showGuides = true,
    showRulers = true,
    skipClear = false,
    blurZones = [],
    selectedBlurId = null,
    hoveredBlurId = null,
    maskShapes = [],
    selectedMaskId = null,
    hoveredMaskId = null,
    triangles = [],
    selectedTriangleId = null,
    hoveredTriangleId = null,
    calloutVignette = null,
    selectedCalloutPart = null,
    hoveredCalloutPart = null,
  } = options;

  if (!skipClear) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  if (!image) return;

  const workspaceWidth = globalStyles.workspaceWidth || DEFAULT_WORKSPACE_WIDTH;
  const isCalloutMode = Boolean(calloutVignette && calloutVignette.enabled);
  const { bgX, bgY, bgWidth, bgHeight, scale } = calculateCompositionBounds(image, focuses, workspaceWidth, calloutVignette);

  // 1. Draw base screenshot non-destructively with STRAIGHT SQUARE CORNERS (no rounded corners, no shadow)
  ctx.save();
  ctx.beginPath();
  ctx.rect(bgX, bgY, bgWidth, bgHeight);
  ctx.clip();
  drawImageHighQualityDownscale(ctx, image.element, bgX, bgY, bgWidth, bgHeight);

  // 2. Apply blue tint (#25465F at 50% opacity by default)
  // When Callout option is chosen, the background tint disappears!
  if (!isCalloutMode) {
    const tintColor = globalStyles.bgTintColor || BASE_COLOR;
    const tintOpacity = globalStyles.bgTintOpacity ?? 0.50;
    if (tintOpacity > 0) {
      ctx.fillStyle = hexToRgba(tintColor, tintOpacity);
      ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
    }
  }
  ctx.restore();

  // 3. Screenshot border: MUST ALWAYS HAVE A 1px BORDER IN #25465F (straight square corners)
  ctx.save();
  ctx.strokeStyle = BASE_COLOR; // Strictly #25465F
  ctx.lineWidth = 1;
  ctx.strokeRect(bgX + 0.5, bgY + 0.5, bgWidth - 1, bgHeight - 1);
  ctx.restore();

  // 4. Draw Blur zones: MUST ALWAYS BE UNDERNEATH ALL OTHER OBJECTS (Focus zones, Masks, Triangles, Vignette, Badges)
  if (blurZones.length > 0) {
    blurZones.forEach((blur) => {
      drawSingleBlurZone(ctx, blur, interactive && !options.previewMode && blur.id === selectedBlurId);
    });
  }

  // 5. Draw Focus zones content & borders (renders on top of blur zones)
  // When Callout option is chosen, the focus zone disappears!
  if (!isCalloutMode) {
    focuses.forEach((focus) => {
      drawSingleFocusContentAndBorder(ctx, image, focus, { bgX, bgY, bgWidth, bgHeight, scale });
    });
  }

  // 6. Draw Mask shapes (renders on top of blur zones)
  if (maskShapes.length > 0) {
    maskShapes.forEach((mask) => {
      drawSingleMaskShape(ctx, mask);
    });
  }

  // 7. Draw Triangles (15x13px en #25465F ou blanc, renders on top of blur zones)
  if (triangles.length > 0) {
    triangles.forEach((triangle) => {
      drawSingleTriangle(ctx, triangle);
    });
  }

  // 8. STEP BADGE: MUST BE A 20x20px SQUARE WITH 5px ROUNDED CORNERS,
  // NOT CUT BY THE RECTANGLE, STRICTLY NO BORDER, DRAWN AT THE VERY FOREGROUND (premier plan)
  // When Callout option is chosen, step badge disappears with focus zone!
  if (!isCalloutMode) {
    focuses.forEach((focus) => {
      if (focus.showStepBadge !== false && focus.stepNumber !== undefined) {
        drawStepBadge(ctx, focus, { bgX, bgY, bgWidth, bgHeight });
      }
    });
  }

  // 9. Callout Vignette (Detached magnified bubble at 5px gap with floor shadow)
  if (calloutVignette && calloutVignette.enabled) {
    drawCalloutVignette(ctx, image, calloutVignette, { bgX, bgY, bgWidth, bgHeight, scale }, {
      interactive: interactive && !options.previewMode,
      selectedPart: selectedCalloutPart,
      hoveredPart: hoveredCalloutPart,
    });
  }

  // If in Preview Mode, do NOT draw any guides, handles, rulers, or hover highlights
  if (options.previewMode) {
    return;
  }

  // 9. Rulers are rendered outside the checkerboard damier in CanvasWorkspace
  // (Not drawn on canvas to keep the transparency checkerboard clean)

  // 10. If interactive, draw smart alignment guides & user guides (ultra-discreet & small)
  if (interactive && showGuides) {
    const phoneCenterX = bgX + bgWidth / 2;
    drawSymmetryAxis(ctx, phoneCenterX, bgY, bgHeight);

    if (smartGuides.length > 0) {
      drawSmartGuides(ctx, smartGuides);
    }

    if (userGuides.length > 0) {
      drawUserGuides(ctx, userGuides);
    }
  }

  // 11. If interactive, draw hover highlight & selection handles
  if (interactive && globalStyles.showHandles !== false) {
    // Focus hover & selection (hidden when in Callout mode)
    if (!isCalloutMode) {
      focuses.forEach((focus) => {
        const isSelected = focus.id === selectedFocusId;
        const isHovered = focus.id === hoveredFocusId && !isSelected;

        if (isHovered) {
          drawFocusHoverHighlight(ctx, focus);
        } else if (isSelected) {
          drawFocusSelectionHandles(ctx, focus, focus.id === internalFramingFocusId);
        }
      });
    }

    // Blur hover & selection
    blurZones.forEach((blur) => {
      const isSelected = blur.id === selectedBlurId;
      const isHovered = blur.id === hoveredBlurId && !isSelected;

      if (isHovered) {
        drawBlurHoverHighlight(ctx, blur);
      } else if (isSelected) {
        drawGenericSelectionHandles(ctx, blur.x, blur.y, blur.width, blur.height, '#0284c7', blur.name || 'Zone de flou');
      }
    });

    // Mask hover & selection
    maskShapes.forEach((mask) => {
      const isSelected = mask.id === selectedMaskId;
      const isHovered = mask.id === hoveredMaskId && !isSelected;

      if (isHovered) {
        drawMaskHoverHighlight(ctx, mask);
      } else if (isSelected) {
        drawGenericSelectionHandles(ctx, mask.x, mask.y, mask.width, mask.height, '#38bdf8', mask.name || 'Forme');
      }
    });

    // Triangle hover & selection
    triangles.forEach((triangle) => {
      const isSelected = triangle.id === selectedTriangleId;
      const isHovered = triangle.id === hoveredTriangleId && !isSelected;

      if (isHovered) {
        drawTriangleHoverHighlight(ctx, triangle);
      } else if (isSelected) {
        drawGenericSelectionHandles(ctx, triangle.x, triangle.y, triangle.width, triangle.height, '#f59e0b', 'Triangle');
      }
    });
  }
}

/**
 * Renders a single Focus card:
 * - Drop shadow
 * - Rounded corners (10px default)
 * - Magnified un-tinted screenshot area
 * - Border in #25465F (2 pt)
 */
function drawSingleFocusContentAndBorder(
  ctx: CanvasRenderingContext2D,
  image: LoadedImage,
  focus: FocusZone,
  bounds: { bgX: number; bgY: number; bgWidth: number; bgHeight: number; scale: number }
) {
  const { bgX, bgY, scale } = bounds;
  const zoom = Math.max(1.0, focus.zoom || 1.0);
  const radius = Math.max(0, focus.borderRadius ?? 10);

  const destX = Math.round(focus.x);
  const destY = Math.round(focus.y);
  const destW = Math.round(focus.width);
  const destH = Math.round(focus.height);

  const compCenterX = focus.x + focus.width / 2;
  const compCenterY = focus.y + focus.height / 2;

  // sourceOffsetX & sourceOffsetY: décalage du screenshot dans la zone focus sans altérer la capture d'origine
  const origCenterX = (compCenterX - bgX) / scale - (focus.sourceOffsetX || 0) / (scale * zoom);
  const origCenterY = (compCenterY - bgY) / scale - (focus.sourceOffsetY || 0) / (scale * zoom);

  const origCropW = (destW / zoom) / scale;
  const origCropH = (destH / zoom) / scale;

  const origSrcX = origCenterX - origCropW / 2;
  const origSrcY = origCenterY - origCropH / 2;

  // A. Drop Shadow under the focus card (Photoshop: opacité 30%, angle 90°, distance 2px, taille 2px, #25465F)
  if (focus.hasShadow !== false) {
    ctx.save();
    const shadowColorHex = focus.shadowColor || BASE_COLOR;
    const shadowOpacity = focus.shadowOpacity ?? 0.30;
    ctx.shadowColor = hexToRgba(shadowColorHex, shadowOpacity);

    // Angle 90°: light from top to bottom (dx = 0, dy = distance)
    const angle = focus.shadowAngle ?? 90;
    const distance = focus.shadowDistance ?? (focus.shadowOffsetY ?? 2);
    const size = focus.shadowSize ?? (focus.shadowBlur ?? 2);

    // Convert angle to rad (90° means straight down)
    const rad = (angle * Math.PI) / 180;
    ctx.shadowOffsetX = focus.shadowOffsetX ?? Math.round(distance * Math.cos(rad - Math.PI / 2) * 0); // 0 at 90°
    ctx.shadowOffsetY = focus.shadowOffsetY ?? (angle === 90 ? distance : Math.round(distance * Math.sin(rad)));
    ctx.shadowBlur = size;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(destX, destY, destW, destH, radius);
    ctx.fill();
    ctx.restore();
  }

  // B. Draw clipped and magnified content with rounded corners
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(destX, destY, destW, destH, radius);
  ctx.clip();

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(destX, destY, destW, destH);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const origImgW = image.originalWidth || image.element.naturalWidth || image.element.width;
  const origImgH = image.originalHeight || image.element.naturalHeight || image.element.height;

  drawImageSafeClipped(
    ctx,
    image.element,
    origSrcX,
    origSrcY,
    origCropW,
    origCropH,
    destX,
    destY,
    destW,
    destH,
    origImgW,
    origImgH
  );

  ctx.restore();

  // C. Border stroke (2 pt in #25465F, rounded corners 10px)
  ctx.save();
  const bWidth = focus.borderWidth || 2;
  ctx.strokeStyle = focus.borderColor || BASE_COLOR;
  ctx.lineWidth = bWidth;
  ctx.beginPath();
  ctx.roundRect(destX, destY, destW, destH, radius);
  ctx.stroke();
  ctx.restore();
}

/**
 * Draws the numbered step badge:
 * - MUST be a 20x20px square with 5px rounded corners.
 * - Odd numbers on left vertical edge of screenshot (bgX)
 * - Even numbers on right vertical edge of screenshot (bgX + bgWidth)
 * - MUST NOT be cut off by the rectangle: drawn on the top layer, strictly unclipped.
 * - Exactly matching reference image: positioned at the top edge of the focus zone,
 *   sitting 14px above focus.y (the white card top line passes below the number),
 *   and overlapping the first 6px of the card.
 * - STRICTLY NO BORDER / CONTOUR.
 */
function drawStepBadge(
  ctx: CanvasRenderingContext2D, 
  focus: FocusZone,
  bounds: { bgX: number; bgY: number; bgWidth: number; bgHeight: number }
) {
  const { bgX, bgWidth } = bounds;
  const badgeW = 20;
  const badgeH = 20;
  const badgeRadius = 5;
  const num = focus.stepNumber || 1;

  const isVertical = focus.orientation === 'vertical' || focus.height > focus.width;

  let alignLeft = true;
  if (focus.badgePosition === 'left') {
    alignLeft = true;
  } else if (focus.badgePosition === 'right') {
    alignLeft = false;
  } else {
    // 'auto': Odd on left edge, Even on right edge (or based on vertical focus placement)
    if (isVertical) {
      const focusCenterX = focus.x + focus.width / 2;
      const phoneCenterX = bgX + bgWidth / 2;
      alignLeft = focusCenterX < phoneCenterX;
    } else {
      alignLeft = num % 2 !== 0;
    }
  }

  // Centered horizontally on the vertical border of the imported original screenshot (50% inside, 50% outside)
  const badgeX = alignLeft
    ? Math.round(bgX - badgeW / 2)
    : Math.round(bgX + bgWidth - badgeW / 2);

  // Position: la pastille dépasse de 15 px au-dessus de la zone focus
  // (15 px au-dessus de focus.y, et les 5 px du bas reposent sur le haut de la zone focus)
  const badgeY = Math.round(focus.y - 15);

  ctx.save();
  // Fill badge (strictly no contour / stroke)
  ctx.fillStyle = focus.badgeColor || focus.borderColor || BASE_COLOR;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, badgeRadius);
  ctx.fill();

  // Text: White, Bold, perfectly and equally centered in the badge box
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  const text = String(num);
  const metrics = ctx.measureText(text);
  const ascent = metrics.actualBoundingBoxAscent;
  const descent = metrics.actualBoundingBoxDescent;
  // Mathematical optical vertical and horizontal center
  const centerY = badgeY + (badgeH + ascent - descent) / 2;
  const centerX = badgeX + badgeW / 2;

  ctx.fillText(text, centerX, centerY);
  ctx.restore();
}

/**
 * Draws an advanced anonymization blur zone directly on the canvas.
 * Guaranteed to be rendered strictly UNDERNEATH all other objects (focus, masks, triangles, vignettes).
 * Supports:
 * - 'gaussian': Pure optical Gaussian blur
 * - 'frosted': Milky frosted glass with top subtle highlight
 * - 'pixelate': High-definition mosaic pixelation
 * - 'smoked': Smoked dark glass blur
 * - Customizable intensity (blurRadius / pixel size)
 * - Customizable opacity (0.05 to 1.0)
 * - Corner rounding (borderRadius)
 */
function drawSingleBlurZone(
  ctx: CanvasRenderingContext2D,
  blur: BlurZone,
  showIndicator = false
) {
  const { x, y, width: w, height: h } = blur;
  if (w <= 0 || h <= 0) return;

  const radius = blur.borderRadius ?? 4;
  const userRadius = Math.max(2, Math.min(50, blur.blurRadius || 12));
  const opacity = Math.max(0.05, Math.min(1.0, blur.opacity ?? 1.0));
  const blurType = blur.blurType || 'frosted';

  // For pixelate, we sample exactly the bounding area; for blurs, we add a padding
  const pad = blurType === 'pixelate' ? 0 : Math.ceil(userRadius * 0.75);
  const srcX = Math.max(0, Math.floor(x - pad));
  const srcY = Math.max(0, Math.floor(y - pad));
  const srcW = Math.min(ctx.canvas.width - srcX, Math.ceil(w + pad * 2));
  const srcH = Math.min(ctx.canvas.height - srcY, Math.ceil(h + pad * 2));

  if (srcW <= 0 || srcH <= 0) return;

  try {
    // 1. Snapshot the existing pixels on the canvas (underneath all other objects)
    const offscreen = document.createElement('canvas');
    offscreen.width = srcW;
    offscreen.height = srcH;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;
    offCtx.drawImage(ctx.canvas, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.clip();

    if (blurType === 'pixelate') {
      // 2. PIXELATE / MOSAIC REDACTION
      // Block size scaled from intensity (between 4px and 32px)
      const blockSize = blur.pixelSize || Math.max(4, Math.min(32, Math.round(userRadius * 0.85)));
      const tinyW = Math.max(1, Math.floor(w / blockSize));
      const tinyH = Math.max(1, Math.floor(h / blockSize));

      const pixelCanvas = document.createElement('canvas');
      pixelCanvas.width = tinyW;
      pixelCanvas.height = tinyH;
      const pixelCtx = pixelCanvas.getContext('2d');
      if (pixelCtx) {
        pixelCtx.imageSmoothingEnabled = false;
        // Sample exact area from offscreen
        pixelCtx.drawImage(offscreen, x - srcX, y - srcY, w, h, 0, 0, tinyW, tinyH);

        // Render back with nearest-neighbor mosaic magnification
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(pixelCanvas, 0, 0, tinyW, tinyH, x, y, w, h);
      }
    } else {
      // 3. OPTICAL BLURS: GAUSSIAN, FROSTED, SMOKED
      // Downsample stage to eliminate high-frequency details
      const scaleDivisor = Math.max(2, Math.min(10, Math.round(userRadius / 2.5)));
      const downW = Math.max(4, Math.floor(srcW / scaleDivisor));
      const downH = Math.max(4, Math.floor(srcH / scaleDivisor));

      const downCanvas = document.createElement('canvas');
      downCanvas.width = downW;
      downCanvas.height = downH;
      const downCtx = downCanvas.getContext('2d');
      if (downCtx) {
        downCtx.imageSmoothingEnabled = true;
        downCtx.imageSmoothingQuality = 'medium';
        downCtx.drawImage(offscreen, 0, 0, srcW, srcH, 0, 0, downW, downH);

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.filter = `blur(${Math.max(3, Math.round(userRadius / 2))}px)`;
        ctx.drawImage(downCanvas, 0, 0, downW, downH, srcX, srcY, srcW, srcH);
        ctx.filter = 'none';

        if (blurType === 'frosted') {
          // Dépoli : Voile translucide blanc laiteux + reflet givré en haut
          ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
          ctx.fillRect(x, y, w, h);

          const grad = ctx.createLinearGradient(x, y, x, y + Math.min(h, 24));
          grad.addColorStop(0, 'rgba(255, 255, 255, 0.30)');
          grad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
          ctx.fillStyle = grad;
          ctx.fillRect(x, y, w, Math.min(h, 24));
        } else if (blurType === 'smoked') {
          // Fumé : Voile sombre élégant pour assombrir et masquer avec discrétion
          ctx.fillStyle = 'rgba(15, 23, 42, 0.38)';
          ctx.fillRect(x, y, w, h);
        }
        // 'gaussian' keeps pure blurred pixels without additional color wash
      }
    }

    ctx.restore();
  } catch (e) {
    console.error('Error applying blur:', e);
  }

  // Subtle border only for interactive positioning when selected
  if (showIndicator) {
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2.5, 2.5]);
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * Draws a mask shape to hide portions:
 * Supports custom color (#25465F by default), border contour, and clipping mask with secondary screenshot!
 */
function drawSingleMaskShape(
  ctx: CanvasRenderingContext2D,
  mask: MaskShape
) {
  const radius = mask.borderRadius ?? 4;
  const color = mask.color || BASE_COLOR;
  const opacity = mask.opacity ?? 1.0;

  ctx.save();
  ctx.globalAlpha = opacity;

  // 1. Clipping mask with an imported screenshot if present
  if (mask.clipImage && (mask.clipImage.element || mask.clipImage.dataUrl)) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(mask.x, mask.y, mask.width, mask.height, radius);
    ctx.clip();

    // Background base
    ctx.fillStyle = color;
    ctx.fillRect(mask.x, mask.y, mask.width, mask.height);

    const imgEl = mask.clipImage.element;
    if (imgEl && imgEl.complete && imgEl.naturalWidth > 0) {
      const scale = mask.clipImage.scale ?? 1;
      const offX = mask.clipImage.offsetX ?? 0;
      const offY = mask.clipImage.offsetY ?? 0;

      const destW = mask.width * scale;
      const destH = mask.height * scale;
      const destX = mask.x + (mask.width - destW) / 2 + offX;
      const destY = mask.y + (mask.height - destH) / 2 + offY;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(imgEl, destX, destY, destW, destH);
    }
    ctx.restore();
  } else {
    // Standard solid color fill
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(mask.x, mask.y, mask.width, mask.height, radius);
    ctx.fill();
  }

  // 2. Contour / Border (only if explicit borderWidth > 0)
  if (mask.borderWidth && mask.borderWidth > 0) {
    ctx.save();
    ctx.strokeStyle = mask.borderColor || BASE_COLOR;
    ctx.lineWidth = mask.borderWidth;
    if (mask.borderStyle === 'dashed') {
      ctx.setLineDash([4, 3]);
    } else if (mask.borderStyle === 'dotted') {
      ctx.setLineDash([2, 2]);
    } else {
      ctx.setLineDash([]);
    }
    ctx.beginPath();
    ctx.roundRect(mask.x, mask.y, mask.width, mask.height, radius);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Draws a 15x13px Triangle:
 * - Default size: 15px width × 13px height
 * - Color: #25465F or white (#ffffff)
 * - Orientation: down (default), up, left, right
 */
function drawSingleTriangle(
  ctx: CanvasRenderingContext2D,
  triangle: TriangleShape
) {
  const { x, y, width: w, height: h, color, direction = 'down', opacity = 1 } = triangle;

  ctx.save();
  ctx.globalAlpha = opacity;

  ctx.beginPath();
  if (direction === 'down') {
    // Pointing downward: flat top, point at bottom center
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w / 2, y + h);
  } else if (direction === 'up') {
    // Pointing upward: point at top center, flat bottom
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
  } else if (direction === 'left') {
    // Pointing left
    ctx.moveTo(x, y + h / 2);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h);
  } else {
    // Pointing right
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y + h / 2);
    ctx.lineTo(x, y + h);
  }
  ctx.closePath();

  ctx.fillStyle = color || BASE_COLOR;
  ctx.fill();

  if (triangle.borderWidth && triangle.borderWidth > 0) {
    ctx.strokeStyle = triangle.borderColor || BASE_COLOR;
    ctx.lineWidth = triangle.borderWidth;
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * High-visibility ergonomic hover highlight for Focus zone
 */
function drawFocusHoverHighlight(ctx: CanvasRenderingContext2D, focus: FocusZone) {
  const { x, y, width: w, height: h, borderRadius = 10 } = focus;

  ctx.save();
  // Soft glowing outer halo without obscuring tags
  ctx.shadowColor = 'rgba(56, 189, 248, 0.4)';
  ctx.shadowBlur = 6;
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x - 1, y - 1, w + 2, h + 2, borderRadius + 1);
  ctx.stroke();
  ctx.restore();
}

/**
 * High-visibility ergonomic hover highlight for Blur zone
 */
function drawBlurHoverHighlight(ctx: CanvasRenderingContext2D, blur: BlurZone) {
  const { x, y, width: w, height: h, borderRadius = 4 } = blur;

  ctx.save();
  ctx.shadowColor = 'rgba(56, 189, 248, 0.5)';
  ctx.shadowBlur = 6;
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x - 1, y - 1, w + 2, h + 2, borderRadius + 1);
  ctx.stroke();
  ctx.restore();
}

/**
 * High-visibility ergonomic hover highlight for Mask shape
 */
function drawMaskHoverHighlight(ctx: CanvasRenderingContext2D, mask: MaskShape) {
  const { x, y, width: w, height: h, borderRadius = 4 } = mask;

  ctx.save();
  ctx.shadowColor = 'rgba(56, 189, 248, 0.5)';
  ctx.shadowBlur = 6;
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x - 1, y - 1, w + 2, h + 2, borderRadius + 1);
  ctx.stroke();
  ctx.restore();
}

/**
 * High-visibility hover highlight for Triangle
 */
function drawTriangleHoverHighlight(ctx: CanvasRenderingContext2D, triangle: TriangleShape) {
  const { x, y, width: w, height: h } = triangle;

  ctx.save();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
  ctx.restore();
}

/**
 * Generic selection handles for blur, mask or triangle shapes (discreet, 8 handles)
 */
function drawGenericSelectionHandles(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color = '#38bdf8',
  label?: string
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 2]);
  ctx.strokeRect(x, y, w, h);
  ctx.setLineDash([]);

  // Discreet micro-handles (1.75px radius, soft alpha)
  const radius = 1.75;
  const corners = [
    { cx: x, cy: y },
    { cx: x + w / 2, cy: y },
    { cx: x + w, cy: y },
    { cx: x, cy: y + h / 2 },
    { cx: x + w, cy: y + h / 2 },
    { cx: x, cy: y + h },
    { cx: x + w / 2, cy: y + h },
    { cx: x + w, cy: y + h },
  ];

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.75;
  ctx.globalAlpha = 0.8;
  corners.forEach(({ cx, cy }) => {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
  ctx.restore();
}

/**
 * Draws pixel metric rulers along the top and left
 */
function drawRulers(ctx: CanvasRenderingContext2D, bgX: number, bgY: number, bgW: number, bgH: number) {
  ctx.save();
  ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
  ctx.font = '7.5px "JetBrains Mono", Menlo, monospace';
  ctx.lineWidth = 0.5;

  const rulerY = Math.max(8, bgY - 6);
  ctx.beginPath();
  ctx.moveTo(bgX, rulerY);
  ctx.lineTo(bgX + bgW, rulerY);
  ctx.stroke();

  for (let x = 0; x <= bgW; x += 50) {
    const rx = bgX + x;
    const isMajor = x % 100 === 0;
    ctx.beginPath();
    ctx.moveTo(rx, rulerY - (isMajor ? 2.5 : 1.5));
    ctx.lineTo(rx, rulerY + (isMajor ? 2.5 : 1.5));
    ctx.stroke();

    if (isMajor) {
      ctx.textAlign = 'center';
      ctx.fillText(`${x}`, rx, rulerY - 3.5);
    }
  }

  const rulerX = Math.max(8, bgX - 6);
  ctx.beginPath();
  ctx.moveTo(rulerX, bgY);
  ctx.lineTo(rulerX, bgY + bgH);
  ctx.stroke();

  for (let y = 0; y <= bgH; y += 50) {
    const ry = bgY + y;
    const isMajor = y % 100 === 0;
    ctx.beginPath();
    ctx.moveTo(rulerX - (isMajor ? 2.5 : 1.5), ry);
    ctx.lineTo(rulerX + (isMajor ? 2.5 : 1.5), ry);
    ctx.stroke();

    if (isMajor) {
      ctx.textAlign = 'right';
      ctx.fillText(`${y}`, rulerX - 3.5, ry + 2.5);
    }
  }

  ctx.restore();
}

/**
 * Draws the central vertical symmetry axis (discreet)
 */
function drawSymmetryAxis(ctx: CanvasRenderingContext2D, centerX: number, bgY: number, bgH: number) {
  ctx.save();
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
  ctx.lineWidth = 0.5;
  ctx.setLineDash([2, 3]);

  ctx.beginPath();
  ctx.moveTo(centerX, bgY - 4);
  ctx.lineTo(centerX, bgY + bgH + 4);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws smart alignment guides
 */
function drawSmartGuides(ctx: CanvasRenderingContext2D, guides: SmartGuide[]) {
  ctx.save();
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);

  guides.forEach((g) => {
    ctx.strokeStyle = g.color || (g.type === 'vertical' ? 'rgba(56, 189, 248, 0.75)' : 'rgba(236, 72, 153, 0.75)');
    ctx.beginPath();
    if (g.type === 'vertical') {
      ctx.moveTo(g.position, 0);
      ctx.lineTo(g.position, ctx.canvas.height);
    } else {
      ctx.moveTo(0, g.position);
      ctx.lineTo(ctx.canvas.width, g.position);
    }
    ctx.stroke();

    if (g.label) {
      ctx.save();
      ctx.setLineDash([]);
      ctx.font = 'bold 9px system-ui, -apple-system, sans-serif';
      const textMetrics = ctx.measureText(g.label);
      const textW = textMetrics.width;
      const textH = 14;

      if (g.type === 'vertical') {
        const lx = Math.min(ctx.canvas.width - textW - 8, Math.max(4, g.position + 4));
        const ly = 16;
        // Pill background
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.beginPath();
        ctx.roundRect(lx - 4, ly - 10, textW + 8, textH, 4);
        ctx.fill();
        // Text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(g.label, lx, ly);
      } else {
        const lx = 6;
        const ly = g.position - 4;
        // Pill background
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.beginPath();
        ctx.roundRect(lx - 2, ly - 10, textW + 8, textH, 4);
        ctx.fill();
        // Text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(g.label, lx + 2, ly);
      }
      ctx.restore();
    }
  });

  ctx.restore();
}

/**
 * Draws manual user-placed guides
 */
function drawUserGuides(ctx: CanvasRenderingContext2D, guides: UserGuide[]) {
  ctx.save();
  ctx.lineWidth = 0.5;
  ctx.setLineDash([3, 3]);
  ctx.strokeStyle = 'rgba(2, 132, 199, 0.30)';

  guides.forEach((g) => {
    ctx.beginPath();
    if (g.type === 'vertical') {
      ctx.moveTo(g.position, 0);
      ctx.lineTo(g.position, ctx.canvas.height);
    } else {
      ctx.moveTo(0, g.position);
      ctx.lineTo(ctx.canvas.width, g.position);
    }
    ctx.stroke();
  });

  ctx.restore();
}

/**
 * Interactive handles for dragging & resizing
 */
export const HANDLE_SIZE = 6;

export function getFocusHandles(focus: FocusZone): Record<ResizeHandle, { x: number; y: number }> {
  const { x, y, width: w, height: h } = focus;
  return {
    nw: { x, y },
    n: { x: x + w / 2, y },
    ne: { x: x + w, y },
    w: { x, y: y + h / 2 },
    e: { x: x + w, y: y + h / 2 },
    sw: { x, y: y + h },
    s: { x: x + w / 2, y: y + h },
    se: { x: x + w, y: y + h },
  };
}

function drawFocusSelectionHandles(ctx: CanvasRenderingContext2D, focus: FocusZone, isFramingMode = false) {
  const { x, y, width: w, height: h, borderRadius = 10 } = focus;

  ctx.save();

  if (isFramingMode) {
    // Mode recadrage actif : surbrillance cyan avec grille de cadrage interne
    ctx.strokeStyle = '#0088cc';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.roundRect(x - 1, y - 1, w + 2, h + 2, borderRadius + 1);
    ctx.stroke();
    ctx.setLineDash([]);

    // Grille interne des tiers pour assister l'alignement précis
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, borderRadius);
    ctx.clip();

    ctx.strokeStyle = 'rgba(0, 136, 204, 0.35)';
    ctx.lineWidth = 0.75;
    ctx.setLineDash([2, 3]);

    // 2 lignes verticales (tiers)
    ctx.beginPath();
    ctx.moveTo(x + w / 3, y);
    ctx.lineTo(x + w / 3, y + h);
    ctx.moveTo(x + (2 * w) / 3, y);
    ctx.lineTo(x + (2 * w) / 3, y + h);
    // 2 lignes horizontales (tiers)
    ctx.moveTo(x, y + h / 3);
    ctx.lineTo(x + w, y + h / 3);
    ctx.moveTo(x, y + (2 * h) / 3);
    ctx.lineTo(x + w, y + (2 * h) / 3);
    ctx.stroke();

    // Réticule central
    const cx = x + w / 2;
    const cy = y + h / 2;
    ctx.strokeStyle = 'rgba(0, 136, 204, 0.7)';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy);
    ctx.lineTo(cx + 5, cy);
    ctx.moveTo(cx, cy - 5);
    ctx.lineTo(cx, cy + 5);
    ctx.stroke();

    ctx.restore();

    // Badge indicateur au-dessus
    const badgeText = `Recadrage actif : X: ${focus.sourceOffsetX ? `${focus.sourceOffsetX > 0 ? '+' : ''}${Math.round(focus.sourceOffsetX)}` : '0'}px, Y: ${focus.sourceOffsetY ? `${focus.sourceOffsetY > 0 ? '+' : ''}${Math.round(focus.sourceOffsetY)}` : '0'}px`;
    ctx.font = '600 8.5px system-ui, -apple-system, sans-serif';
    const textMetrics = ctx.measureText(badgeText);
    const badgeW = textMetrics.width + 12;
    const badgeH = 14;
    const badgeX = Math.round(x + (w - badgeW) / 2);
    const badgeY = Math.round(y - badgeH - 3);

    ctx.fillStyle = 'rgba(0, 136, 204, 0.95)';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 7);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + badgeH / 2 + 0.5);
  } else {
    // Mode standard : bordure pointillée discrète
    ctx.strokeStyle = 'rgba(0, 136, 204, 0.45)';
    ctx.lineWidth = 0.85;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.roundRect(x - 1, y - 1, w + 2, h + 2, borderRadius + 1);
    ctx.stroke();
    ctx.setLineDash([]);

    // Si un décalage interne est appliqué, afficher un micro-repère discret
    if ((focus.sourceOffsetX && focus.sourceOffsetX !== 0) || (focus.sourceOffsetY && focus.sourceOffsetY !== 0)) {
      ctx.fillStyle = 'rgba(0, 136, 204, 0.15)';
      ctx.beginPath();
      ctx.arc(x + w - 8, y + 8, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const handles = getFocusHandles(focus);
  const radius = 1.75;

  (Object.keys(handles) as ResizeHandle[]).forEach((handleKey) => {
    const pt = handles[handleKey];
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0088cc';
    ctx.lineWidth = 0.75;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  ctx.restore();
}

function hexToRgba(hex: string, alpha: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  const r = parseInt(c.substring(0, 2), 16) || 37;
  const g = parseInt(c.substring(2, 4), 16) || 70;
  const b = parseInt(c.substring(4, 6), 16) || 95;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * High-quality multi-step downsampler (bilinear mipmap pass).
 * Prevents severe aliasing, pixel skipping, and glyph disintegration
 * when downscaling high-resolution images (like Retina iPhone screenshots) by >2x.
 */
function drawImageHighQualityDownscale(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number
) {
  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  if (origW > dw * 2 && origH > dh * 2) {
    let curCanvas = document.createElement('canvas');
    curCanvas.width = origW;
    curCanvas.height = origH;
    let curCtx = curCanvas.getContext('2d');
    if (!curCtx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, dx, dy, dw, dh);
      return;
    }

    curCtx.imageSmoothingEnabled = true;
    curCtx.imageSmoothingQuality = 'high';
    curCtx.drawImage(img, 0, 0, origW, origH);

    let curW = origW;
    let curH = origH;

    while (curW > dw * 2 && curH > dh * 2) {
      const nextW = Math.max(dw, Math.floor(curW / 2));
      const nextH = Math.max(dh, Math.floor(curH / 2));

      const nextCanvas = document.createElement('canvas');
      nextCanvas.width = nextW;
      nextCanvas.height = nextH;
      const nextCtx = nextCanvas.getContext('2d');
      if (!nextCtx) break;

      nextCtx.imageSmoothingEnabled = true;
      nextCtx.imageSmoothingQuality = 'high';
      nextCtx.drawImage(curCanvas, 0, 0, curW, curH, 0, 0, nextW, nextH);

      curCanvas = nextCanvas;
      curW = nextW;
      curH = nextH;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(curCanvas, 0, 0, curW, curH, dx, dy, dw, dh);
  } else {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, dx, dy, dw, dh);
  }
}

/**
 * Safely clips source and destination coordinates to ensure drawImage never samples
 * out-of-bounds pixels, preventing canvas wrap-around, blank tiles, or browser-specific rendering bugs.
 */
function drawImageSafeClipped(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  imgW: number,
  imgH: number
) {
  if (sx + sw <= 0 || sy + sh <= 0 || sx >= imgW || sy >= imgH || sw <= 0 || sh <= 0) {
    return;
  }

  let clampSx = sx;
  let clampSy = sy;
  let clampSw = sw;
  let clampSh = sh;

  let clampDx = dx;
  let clampDy = dy;
  let clampDw = dw;
  let clampDh = dh;

  if (clampSx < 0) {
    const diff = -clampSx;
    const ratio = diff / clampSw;
    clampDx += clampDw * ratio;
    clampDw -= clampDw * ratio;
    clampSw -= diff;
    clampSx = 0;
  }

  if (clampSy < 0) {
    const diff = -clampSy;
    const ratio = diff / clampSh;
    clampDy += clampDh * ratio;
    clampDh -= clampDh * ratio;
    clampSh -= diff;
    clampSy = 0;
  }

  if (clampSx + clampSw > imgW) {
    const excess = (clampSx + clampSw) - imgW;
    const ratio = excess / clampSw;
    clampDw -= clampDw * ratio;
    clampSw = imgW - clampSx;
  }

  if (clampSy + clampSh > imgH) {
    const excess = (clampSy + clampSh) - imgH;
    const ratio = excess / clampSh;
    clampDh -= clampDh * ratio;
    clampSh = imgH - clampSy;
  }

  if (clampSw <= 0 || clampSh <= 0 || clampDw <= 0 || clampDh <= 0) {
    return;
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, clampSx, clampSy, clampSw, clampSh, clampDx, clampDy, clampDw, clampDh);
}

/**
 * Draws the Callout Vignette (detached magnified bubble with 5px gap from screen,
 * custom rounded corners / circle, and realistic floor shadow).
 */
export function drawCalloutVignette(
  ctx: CanvasRenderingContext2D,
  image: LoadedImage | null,
  callout: CalloutVignette,
  bounds: { bgX: number; bgY: number; bgWidth: number; bgHeight: number; scale: number },
  options: {
    interactive?: boolean;
    selectedPart?: 'source' | 'vignette' | null;
    hoveredPart?: 'source' | 'vignette' | null;
  } = {}
) {
  if (!callout.enabled) return;

  const { bgX, bgY, bgHeight, scale } = bounds;
  const gap = callout.gap ?? 5; // 5px gap from screen border
  const vigW = callout.width || 100;
  const vigH = callout.height || vigW;
  const vigX = bgX - gap - vigW; // Placed at 5px gap to the left of the screen border

  // La vignette doit être alignée au bas du screenshot en référence à son ombre portée
  const showShadow = callout.showShadow !== false;
  const shadowDistance = callout.shadowDistance ?? callout.shadowOffsetY ?? 5; // distance 5px
  const shadowSize = callout.shadowSize ?? callout.shadowBlur ?? 2; // taille 2px
  const shadowOpacity = callout.shadowOpacity ?? 0.50; // opacité 50%
  const shadowDist = showShadow ? shadowDistance : 0;

  // L'alignement bas en référence à l'ombre portée : vigY + vigH + shadowDist = bgY + bgHeight
  const alignedBottomY = bgY + bgHeight - vigH - shadowDist;
  const vigY = callout.alignBottom !== false ? alignedBottomY : (callout.offsetY ?? alignedBottomY);

  // Compute border radius
  const maxR = Math.min(vigW, vigH) / 2;
  const borderRadius = callout.shape === 'circle'
    ? maxR
    : Math.min(maxR, Math.max(0, callout.borderRadius ?? 16));

  // 1. Draw drop shadow behind vignette
  // Exigences strictes : ombre portée de 50% d'opacité, distance de 5px, taille de 2px
  if (showShadow) {
    ctx.save();
    const shadowOffsetX = callout.shadowOffsetX ?? 0;
    const shadowOffsetY = shadowDistance;
    const shadowBlur = shadowSize;

    ctx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`;
    ctx.shadowBlur = shadowBlur;
    ctx.shadowOffsetX = shadowOffsetX;
    ctx.shadowOffsetY = shadowOffsetY;

    // Déport géométrique hors champ : projette uniquement le flou d'ombre portée
    // sans déposer de silhouette sombre directement sous le tracé de découpe.
    // Cela supprime définitivement le liseré sombre de crénelage (anti-aliasing bleed).
    const SHADOW_OFFSET_HACK = 20000;
    ctx.shadowOffsetX = shadowOffsetX + SHADOW_OFFSET_HACK;
    ctx.beginPath();
    ctx.roundRect(vigX - SHADOW_OFFSET_HACK, vigY, vigW, vigH, borderRadius);
    ctx.fillStyle = '#000000';
    ctx.fill();

    ctx.restore();
  }

  // 2. Draw Vignette body (clipped with rounded corners or circle)
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(vigX, vigY, vigW, vigH, borderRadius);
  ctx.clip();

  // Content: either custom uploaded HD icon or cropped screen section
  if (callout.customImage?.element && callout.customImage.element.complete) {
    // Custom HD image
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(callout.customImage.element, vigX, vigY, vigW, vigH);
  } else if (image) {
    // Cropped and magnified section from the screen
    const srcW = callout.sourceWidth || 40;
    const srcH = callout.sourceHeight || 40;
    const srcX = callout.sourceX;
    const srcY = callout.sourceY;

    // Convert source coords from composition to original image pixels
    const origSrcX = (srcX - bgX) / scale;
    const origSrcY = (srcY - bgY) / scale;
    const origSrcW = srcW / scale;
    const origSrcH = srcH / scale;

    const origImgW = image.originalWidth || image.element.naturalWidth || image.element.width;
    const origImgH = image.originalHeight || image.element.naturalHeight || image.element.height;

    // Ensure sample is within image boundaries so the vignette is fully covered with no edge gaps
    const safeOrigW = Math.min(origSrcW, origImgW);
    const safeOrigH = Math.min(origSrcH, origImgH);
    const safeOrigX = Math.max(0, Math.min(origImgW - safeOrigW, origSrcX));
    const safeOrigY = Math.max(0, Math.min(origImgH - safeOrigH, origSrcY));

    drawImageSafeClipped(
      ctx,
      image.element,
      safeOrigX,
      safeOrigY,
      safeOrigW,
      safeOrigH,
      vigX,
      vigY,
      vigW,
      vigH,
      origImgW,
      origImgH
    );
  }

  // Repères discrets dans la vignette pour un centrage parfait
  if (options.interactive !== false) {
    const vcx = Math.round(vigX + vigW / 2);
    const vcy = Math.round(vigY + vigH / 2);

    ctx.save();
    // Lignes axiales subtiles en pointillés
    ctx.strokeStyle = 'rgba(0, 136, 204, 0.22)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(vigX, vcy);
    ctx.lineTo(vigX + vigW, vcy);
    ctx.moveTo(vcx, vigY);
    ctx.lineTo(vcx, vigY + vigH);
    ctx.stroke();

    // Réticule central discret (micro-croix avec halo blanc de contraste)
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(vcx - 6, vcy);
    ctx.lineTo(vcx + 6, vcy);
    ctx.moveTo(vcx, vcy - 6);
    ctx.lineTo(vcx, vcy + 6);
    ctx.stroke();

    ctx.strokeStyle = '#0088cc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(vcx - 5, vcy);
    ctx.lineTo(vcx + 5, vcy);
    ctx.moveTo(vcx, vcy - 5);
    ctx.lineTo(vcx, vcy + 5);
    ctx.stroke();

    // Petits crans repères sur les 4 bords (5px)
    ctx.strokeStyle = 'rgba(0, 136, 204, 0.5)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(vcx, vigY); ctx.lineTo(vcx, vigY + 6);
    ctx.moveTo(vcx, vigY + vigH - 6); ctx.lineTo(vcx, vigY + vigH);
    ctx.moveTo(vigX, vcy); ctx.lineTo(vigX + 6, vcy);
    ctx.moveTo(vigX + vigW - 6, vcy); ctx.lineTo(vigX + vigW, vcy);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();

  // Note: Il ne doit jamais y avoir de bordure pour la vignette (exigence stricte)

  // 4. Interactive guides (Source target on screen + Vignette selection)
  if (options.interactive) {
    const isSourceSelected = options.selectedPart === 'source';
    const isSourceHovered = options.hoveredPart === 'source' && !isSourceSelected;
    const isVignetteSelected = options.selectedPart === 'vignette';
    const isVignetteHovered = options.hoveredPart === 'vignette' && !isVignetteSelected;

    // Draw Source Target on screen (viewfinder matching vignette shape and corner radius)
    // Styled in Fluorescent Neon Pink (#ff007f) with very fine dashed outline and micro crosshair
    const srcW = callout.sourceWidth || 40;
    const srcH = callout.sourceHeight || 40;
    const srcX = callout.sourceX;
    const srcY = callout.sourceY;
    
    // Exact same shape as vignette:
    // If circle: perfect circle (radius = min(srcW, srcH) / 2)
    // If rounded: corner radius proportional to vignette borderRadius or exact borderRadius clamped
    const maxSrcR = Math.min(srcW, srcH) / 2;
    const vigBaseW = callout.width || 100;
    const shapeRatio = srcW / (vigBaseW > 0 ? vigBaseW : 100);
    const srcRadius = callout.shape === 'circle'
      ? maxSrcR
      : Math.min(maxSrcR, Math.max(0, Math.round((callout.borderRadius ?? 16) * shapeRatio)));

    ctx.save();

    // 1. Contour très fin en pointillés rose fluo (#ff007f), sans voile intérieur
    ctx.strokeStyle = '#ff007f';
    ctx.lineWidth = 1;
    ctx.setLineDash([2.5, 2.5]);
    ctx.beginPath();
    ctx.roundRect(srcX, srcY, srcW, srcH, srcRadius);
    ctx.stroke();

    // 2. Croix centrale très fine en rose fluo (#ff007f)
    ctx.setLineDash([]);
    ctx.lineWidth = 1;
    const cX = Math.round(srcX + srcW / 2);
    const cY = Math.round(srcY + srcH / 2);
    ctx.beginPath();
    ctx.moveTo(cX - 4, cY); ctx.lineTo(cX + 4, cY);
    ctx.moveTo(cX, cY - 4); ctx.lineTo(cX, cY + 4);
    ctx.stroke();

    ctx.restore();

    // Draw Vignette selection frame
    if (isVignetteSelected || isVignetteHovered) {
      ctx.save();
      ctx.strokeStyle = isVignetteSelected ? '#0088cc' : '#38bdf8';
      ctx.lineWidth = isVignetteSelected ? 1.5 : 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.roundRect(vigX - 2, vigY - 2, vigW + 4, vigH + 4, borderRadius + 2);
      ctx.stroke();

      // Mini label
      ctx.setLineDash([]);
      ctx.fillStyle = '#0088cc';
      ctx.font = 'bold 8.5px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Vignette (5px)', vigX + vigW / 2, vigY - 5);
      ctx.restore();
    }
  }
}

