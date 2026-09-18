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
  // Ultra-sleek minimalist ruler: 16px high, subtle markings every 10px, 50px, 100px
  const ticks: React.ReactNode[] = [];
  const maxVal = Math.ceil(width);

  for (let x = 0; x <= maxVal; x += 10) {
    const isMajor = x % 100 === 0;
    const isMedium = !isMajor && x % 50 === 0;
    const tickHeight = isMajor ? 6 : isMedium ? 4 : 2.5;
    const y1 = 16 - tickHeight;

    ticks.push(
      <line
        key={`tick-top-${x}`}
        x1={x}
        y1={y1}
        x2={x}
        y2={16}
        stroke={isMajor ? '#94a3b8' : isMedium ? '#cbd5e1' : '#e2e8f0'}
        strokeWidth={1}
      />
    );

    if (isMajor && x + 24 <= maxVal) {
      ticks.push(
        <text
          key={`text-top-${x}`}
          x={x + 2}
          y={8}
          fontSize={7.5}
          fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
          fill="#64748b"
          letterSpacing="-0.02em"
          className="select-none pointer-events-none font-medium"
        >
          {x}
        </text>
      );
    }
  }

  return (
    <div
      onClick={onAddGuideH}
      title="Règle horizontale (cliquer pour ajouter un repère horizontal)"
      className="relative h-4 bg-[#f8fafc] border-b border-t border-[#e2e8f0] cursor-row-resize select-none overflow-hidden"
      style={{ width: `${width}px` }}
    >
      {/* Screenshot Zone Highlight - soft minimalist tint */}
      {bgX !== undefined && bgWidth !== undefined && (
        <div
          className="absolute top-0 bottom-0 bg-[#0088cc]/6 border-l border-r border-[#0088cc]/25 pointer-events-none transition-opacity"
          style={{
            left: `${bgX}px`,
            width: `${bgWidth}px`,
          }}
          title="Emplacement de la capture écran"
        />
      )}

      {/* SVG Ticks and Numbers */}
      <svg
        width={width}
        height={16}
        className="block absolute top-0 left-0 pointer-events-none"
      >
        {ticks}

        {/* Cursor Hairline indicator */}
        {cursorX !== null && cursorX !== undefined && cursorX >= 0 && cursorX <= width && (
          <line
            x1={cursorX}
            y1={0}
            x2={cursorX}
            y2={16}
            stroke="#0088cc"
            strokeWidth={1.2}
            strokeOpacity={0.9}
          />
        )}
      </svg>
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
  const ticks: React.ReactNode[] = [];
  const maxVal = Math.ceil(height);

  for (let y = 0; y <= maxVal; y += 10) {
    const isMajor = y % 100 === 0;
    const isMedium = !isMajor && y % 50 === 0;
    const tickWidth = isMajor ? 6 : isMedium ? 4 : 2.5;
    const x1 = 16 - tickWidth;

    ticks.push(
      <line
        key={`tick-left-${y}`}
        x1={x1}
        y1={y}
        x2={16}
        y2={y}
        stroke={isMajor ? '#94a3b8' : isMedium ? '#cbd5e1' : '#e2e8f0'}
        strokeWidth={1}
      />
    );

    if (isMajor && y + 14 <= maxVal) {
      ticks.push(
        <text
          key={`text-left-${y}`}
          x={2}
          y={y + 7.5}
          fontSize={7.5}
          fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
          fill="#64748b"
          letterSpacing="-0.02em"
          className="select-none pointer-events-none font-medium"
        >
          {y}
        </text>
      );
    }
  }

  return (
    <div
      onClick={onAddGuideV}
      title="Règle verticale (cliquer pour ajouter un repère vertical)"
      className="relative w-4 bg-[#f8fafc] border-r border-l border-[#e2e8f0] cursor-col-resize select-none overflow-hidden"
      style={{ height: `${height}px` }}
    >
      {/* Screenshot Zone Highlight */}
      {bgY !== undefined && bgHeight !== undefined && (
        <div
          className="absolute left-0 right-0 bg-[#0088cc]/6 border-t border-b border-[#0088cc]/25 pointer-events-none transition-opacity"
          style={{
            top: `${bgY}px`,
            height: `${bgHeight}px`,
          }}
          title="Emplacement de la capture écran"
        />
      )}

      {/* SVG Ticks and Numbers */}
      <svg
        width={16}
        height={height}
        className="block absolute top-0 left-0 pointer-events-none"
      >
        {ticks}

        {/* Cursor Hairline indicator */}
        {cursorY !== null && cursorY !== undefined && cursorY >= 0 && cursorY <= height && (
          <line
            x1={0}
            y1={cursorY}
            x2={16}
            y2={cursorY}
            stroke="#0088cc"
            strokeWidth={1.2}
            strokeOpacity={0.9}
          />
        )}
      </svg>
    </div>
  );
};
