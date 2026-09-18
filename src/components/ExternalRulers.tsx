import React from 'react';

interface TopRulerProps {
  width: number;
  bgX?: number;
  bgWidth?: number;
  cursorX?: number | null;
  onAddGuideH?: () => void;
}

export const TopRuler: React.FC<TopRulerProps> = ({
  width,
  bgX,
  bgWidth,
  cursorX,
  onAddGuideH,
}) => {
  return (
    <div
      onClick={onAddGuideH}
      title="Règle horizontale (cliquer pour ajouter un repère horizontal)"
      className="relative h-2.5 bg-transparent border-t border-b border-slate-300/40 cursor-row-resize select-none overflow-hidden"
      style={{ width: `${width}px` }}
    >
      {/* Screenshot Zone subtle marker line */}
      {bgX !== undefined && bgWidth !== undefined && (
        <div
          className="absolute top-0 bottom-0 border-l border-r border-[#0088cc]/30 pointer-events-none"
          style={{
            left: `${bgX}px`,
            width: `${bgWidth}px`,
          }}
          title="Zone capture écran"
        />
      )}

      {/* Cursor Hairline indicator */}
      {cursorX !== null && cursorX !== undefined && cursorX >= 0 && cursorX <= width && (
        <div
          className="absolute top-0 bottom-0 w-px bg-[#0088cc] pointer-events-none"
          style={{ left: `${cursorX}px` }}
        />
      )}
    </div>
  );
};

interface LeftRulerProps {
  height: number;
  bgY?: number;
  bgHeight?: number;
  cursorY?: number | null;
  onAddGuideV?: () => void;
}

export const LeftRuler: React.FC<LeftRulerProps> = ({
  height,
  bgY,
  bgHeight,
  cursorY,
  onAddGuideV,
}) => {
  return (
    <div
      onClick={onAddGuideV}
      title="Règle verticale (cliquer pour ajouter un repère vertical)"
      className="relative w-2.5 bg-transparent border-l border-r border-slate-300/40 cursor-col-resize select-none overflow-hidden"
      style={{ height: `${height}px` }}
    >
      {/* Screenshot Zone subtle marker line */}
      {bgY !== undefined && bgHeight !== undefined && (
        <div
          className="absolute left-0 right-0 border-t border-b border-[#0088cc]/30 pointer-events-none"
          style={{
            top: `${bgY}px`,
            height: `${bgHeight}px`,
          }}
          title="Zone capture écran"
        />
      )}

      {/* Cursor Hairline indicator */}
      {cursorY !== null && cursorY !== undefined && cursorY >= 0 && cursorY <= height && (
        <div
          className="absolute left-0 right-0 h-px bg-[#0088cc] pointer-events-none"
          style={{ top: `${cursorY}px` }}
        />
      )}
    </div>
  );
};

