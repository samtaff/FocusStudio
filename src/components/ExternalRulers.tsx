import React, { useRef, useEffect } from 'react';

interface TopRulerProps {
  width: number;
  bgX?: number;
  bgWidth?: number;
  cursorX?: number | null;
  onAddGuideH?: () => void;
  onStartDragGuide?: (type: 'horizontal', startCoord: number) => void;
  isDarkMode?: boolean;
}

export const TopRuler: React.FC<TopRulerProps> = ({
  width,
  bgX = 0,
  bgWidth = 0,
  cursorX,
  onAddGuideH,
  onStartDragGuide,
  isDarkMode = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High-DPI support
    const dpr = window.devicePixelRatio || 1;
    const h = 20;
    canvas.width = width * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = isDarkMode ? '#1e1e1e' : '#f1f3f5';
    ctx.fillRect(0, 0, width, h);

    // Active screenshot area highlight
    if (bgWidth > 0) {
      ctx.fillStyle = isDarkMode ? '#272727' : '#ffffff';
      ctx.fillRect(bgX, 0, bgWidth, h);

      // Left and right edges of screenshot
      ctx.strokeStyle = isDarkMode ? 'rgba(0, 136, 204, 0.45)' : 'rgba(0, 136, 204, 0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bgX + 0.5, 0);
      ctx.lineTo(bgX + 0.5, h);
      ctx.moveTo(bgX + bgWidth - 0.5, 0);
      ctx.lineTo(bgX + bgWidth - 0.5, h);
      ctx.stroke();
    }

    // Bottom border line
    ctx.strokeStyle = isDarkMode ? '#383838' : '#d1d5db';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h - 0.5);
    ctx.lineTo(width, h - 0.5);
    ctx.stroke();

    // Graduations
    ctx.font = '8px "JetBrains Mono", Menlo, monospace';
    ctx.fillStyle = isDarkMode ? '#8e8e8e' : '#6b7280';
    ctx.strokeStyle = isDarkMode ? '#4a4a4a' : '#cbd5e1';
    ctx.lineWidth = 1;

    // Draw ticks from leftmost point to rightmost point relative to bgX origin (0px)
    const step = 10;
    const minPixel = -Math.ceil(bgX / step) * step;
    const maxPixel = Math.ceil((width - bgX) / step) * step;

    for (let px = minPixel; px <= maxPixel; px += step) {
      const screenX = Math.round(bgX + px);
      if (screenX < 0 || screenX > width) continue;

      const is100 = px % 100 === 0;
      const is50 = px % 50 === 0;
      const tickH = is100 ? 9 : is50 ? 6 : 3;

      ctx.beginPath();
      ctx.moveTo(screenX + 0.5, h - tickH);
      ctx.lineTo(screenX + 0.5, h);
      ctx.stroke();

      if (is100 || (px === 0)) {
        ctx.textAlign = 'left';
        ctx.fillText(`${px}`, screenX + 2, 8);
      }
    }

    // Cursor indicator hairline
    if (cursorX !== null && cursorX !== undefined && cursorX >= 0 && cursorX <= width) {
      ctx.strokeStyle = '#0088cc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cursorX + 0.5, 0);
      ctx.lineTo(cursorX + 0.5, h);
      ctx.stroke();

      // Small cursor marker triangle
      ctx.fillStyle = '#0088cc';
      ctx.beginPath();
      ctx.moveTo(cursorX, h);
      ctx.lineTo(cursorX - 3, h - 4);
      ctx.lineTo(cursorX + 3, h - 4);
      ctx.closePath();
      ctx.fill();
    }
  }, [width, bgX, bgWidth, cursorX, isDarkMode]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onStartDragGuide) {
      // Start pulling a horizontal guide downwards from the top ruler
      onStartDragGuide('horizontal', bgX);
    } else if (onAddGuideH) {
      onAddGuideH();
    }
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onDoubleClick={onAddGuideH}
      title="Règle Photoshop horizontale : Glisser vers le bas pour créer un repère horizontal (Double-clic pour ajouter)"
      className="relative select-none overflow-hidden cursor-row-resize shrink-0 shadow-xs"
      style={{ width: `${width}px`, height: '20px' }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: `${width}px`, height: '20px', display: 'block' }}
      />
    </div>
  );
};

interface LeftRulerProps {
  height: number;
  bgY?: number;
  bgHeight?: number;
  cursorY?: number | null;
  onAddGuideV?: () => void;
  onStartDragGuide?: (type: 'vertical', startCoord: number) => void;
  isDarkMode?: boolean;
}

export const LeftRuler: React.FC<LeftRulerProps> = ({
  height,
  bgY = 0,
  bgHeight = 0,
  cursorY,
  onAddGuideV,
  onStartDragGuide,
  isDarkMode = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = 20;
    canvas.width = w * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = isDarkMode ? '#1e1e1e' : '#f1f3f5';
    ctx.fillRect(0, 0, w, height);

    // Active screenshot area highlight
    if (bgHeight > 0) {
      ctx.fillStyle = isDarkMode ? '#272727' : '#ffffff';
      ctx.fillRect(0, bgY, w, bgHeight);

      // Top and bottom edges of screenshot
      ctx.strokeStyle = isDarkMode ? 'rgba(0, 136, 204, 0.45)' : 'rgba(0, 136, 204, 0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, bgY + 0.5);
      ctx.lineTo(w, bgY + 0.5);
      ctx.moveTo(0, bgY + bgHeight - 0.5);
      ctx.lineTo(w, bgY + bgHeight - 0.5);
      ctx.stroke();
    }

    // Right border line
    ctx.strokeStyle = isDarkMode ? '#383838' : '#d1d5db';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w - 0.5, 0);
    ctx.lineTo(w - 0.5, height);
    ctx.stroke();

    // Graduations
    ctx.font = '7.5px "JetBrains Mono", Menlo, monospace';
    ctx.fillStyle = isDarkMode ? '#8e8e8e' : '#6b7280';
    ctx.strokeStyle = isDarkMode ? '#4a4a4a' : '#cbd5e1';
    ctx.lineWidth = 1;

    const step = 10;
    const minPixel = -Math.ceil(bgY / step) * step;
    const maxPixel = Math.ceil((height - bgY) / step) * step;

    for (let py = minPixel; py <= maxPixel; py += step) {
      const screenY = Math.round(bgY + py);
      if (screenY < 0 || screenY > height) continue;

      const is100 = py % 100 === 0;
      const is50 = py % 50 === 0;
      const tickW = is100 ? 9 : is50 ? 6 : 3;

      ctx.beginPath();
      ctx.moveTo(w - tickW, screenY + 0.5);
      ctx.lineTo(w, screenY + 0.5);
      ctx.stroke();

      if (is100 || (py === 0)) {
        // Draw vertical/rotated text for clean readability
        ctx.save();
        ctx.translate(9, screenY - 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'right';
        ctx.fillText(`${py}`, 0, 0);
        ctx.restore();
      }
    }

    // Cursor indicator hairline
    if (cursorY !== null && cursorY !== undefined && cursorY >= 0 && cursorY <= height) {
      ctx.strokeStyle = '#0088cc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, cursorY + 0.5);
      ctx.lineTo(w, cursorY + 0.5);
      ctx.stroke();

      // Small cursor marker triangle
      ctx.fillStyle = '#0088cc';
      ctx.beginPath();
      ctx.moveTo(w, cursorY);
      ctx.lineTo(w - 4, cursorY - 3);
      ctx.lineTo(w - 4, cursorY + 3);
      ctx.closePath();
      ctx.fill();
    }
  }, [height, bgY, bgHeight, cursorY, isDarkMode]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onStartDragGuide) {
      // Start pulling a vertical guide rightwards from the left ruler
      onStartDragGuide('vertical', bgY);
    } else if (onAddGuideV) {
      onAddGuideV();
    }
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onDoubleClick={onAddGuideV}
      title="Règle Photoshop verticale : Glisser vers la droite pour créer un repère vertical (Double-clic pour ajouter)"
      className="relative select-none overflow-hidden cursor-col-resize shrink-0 shadow-xs"
      style={{ width: '20px', height: `${height}px` }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '20px', height: `${height}px`, display: 'block' }}
      />
    </div>
  );
};
