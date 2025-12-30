import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image, Line, Rect, Group, Circle, Text } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type Konva from 'konva';
import { useSessionStore } from '../../stores/sessionStore';
import type { Token, TokenSize, FogArea } from '../../types';

// Token size in grid squares
const TOKEN_SIZES: Record<TokenSize, number> = {
  tiny: 0.5,
  small: 1,
  medium: 1,
  large: 2,
  huge: 3,
  gargantuan: 4,
};

// Condition colors
const CONDITION_COLORS: Record<string, string> = {
  poisoned: '#00ff00',
  stunned: '#ffff00',
  prone: '#8b4513',
  frightened: '#800080',
  charmed: '#ff69b4',
  paralyzed: '#4169e1',
  restrained: '#808080',
  blinded: '#000000',
  deafened: '#696969',
  invisible: '#add8e6',
  incapacitated: '#dc143c',
  exhausted: '#8b0000',
  concentrating: '#00bfff',
};

interface MapCanvasProps {
  width: number;
  height: number;
  isDm: boolean;
  isLocked?: boolean;
  onTokenMove?: (tokenId: string, x: number, y: number) => void;
  playerId?: string; // Current player's socket ID
  // Fog of War callbacks (DM only)
  onAddFog?: (fog: FogArea) => void;
  onToggleFog?: (fogId: string) => void;
  onClearFog?: () => void;
}

export function MapCanvas({ width, height, isDm, isLocked = false, onTokenMove, playerId, onAddFog, onToggleFog, onClearFog }: MapCanvasProps) {
  const { map, initiative } = useSessionStore();
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [mapImage, setMapImage] = useState<HTMLImageElement | null>(null);
  const [measuring, setMeasuring] = useState(false);
  const [measureStart, setMeasureStart] = useState<{ x: number; y: number } | null>(null);
  const [measureEnd, setMeasureEnd] = useState<{ x: number; y: number } | null>(null);
  // Fog of War drawing state
  const [drawingFog, setDrawingFog] = useState(false);
  const [fogStart, setFogStart] = useState<{ x: number; y: number } | null>(null);
  const [fogEnd, setFogEnd] = useState<{ x: number; y: number } | null>(null);
  const stageRef = useRef<Konva.Stage>(null);

  // Load map image when URL changes
  useEffect(() => {
    if (map.imageUrl) {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.src = map.imageUrl;
      img.onload = () => setMapImage(img);
    } else {
      setMapImage(null);
    }
  }, [map.imageUrl]);

  // Handle zoom with mouse wheel
  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    if (isLocked) return;
    e.evt.preventDefault();

    const scaleBy = 1.1;
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stageScale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.max(0.1, Math.min(5, newScale));

    setStageScale(clampedScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
  };

  // Handle panning with drag
  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    if (isLocked) return;
    setStagePos({
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  // Get world position from screen position
  const getWorldPos = () => {
    const stage = stageRef.current;
    if (!stage) return null;
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;
    return {
      x: (pointer.x - stagePos.x) / stageScale,
      y: (pointer.y - stagePos.y) / stageScale,
    };
  };

  // Measurement tool handlers
  const handleStageClick = (_e: KonvaEventObject<MouseEvent>) => {
    const worldPos = getWorldPos();
    if (!worldPos) return;

    // Fog drawing mode
    if (drawingFog && isDm) {
      if (!fogStart) {
        setFogStart(worldPos);
      } else {
        // Create fog area
        if (onAddFog && fogEnd) {
          const x = Math.min(fogStart.x, fogEnd.x);
          const y = Math.min(fogStart.y, fogEnd.y);
          const width = Math.abs(fogEnd.x - fogStart.x);
          const height = Math.abs(fogEnd.y - fogStart.y);

          if (width > 10 && height > 10) {
            const fogArea: FogArea = {
              id: `fog-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              x,
              y,
              width,
              height,
              isRevealed: false,
            };
            onAddFog(fogArea);
          }
        }
        setFogStart(null);
        setFogEnd(null);
      }
      return;
    }

    // Measurement mode
    if (measuring) {
      if (!measureStart) {
        setMeasureStart(worldPos);
      } else {
        setMeasureEnd(worldPos);
        setMeasuring(false);
      }
    }
  };

  const handleStageMouseMove = (_e: KonvaEventObject<MouseEvent>) => {
    const worldPos = getWorldPos();
    if (!worldPos) return;

    // Fog drawing mode
    if (drawingFog && fogStart) {
      setFogEnd(worldPos);
      return;
    }

    // Measurement mode
    if (measuring && measureStart) {
      setMeasureEnd(worldPos);
    }
  };

  // Draw grid lines
  const renderGrid = () => {
    if (!map.showGrid) return null;

    const lines = [];
    const gridSize = map.gridSize;
    const startX = map.gridOffsetX % gridSize;
    const startY = map.gridOffsetY % gridSize;
    const gridWidth = mapImage ? mapImage.width : 2000;
    const gridHeight = mapImage ? mapImage.height : 2000;

    for (let x = startX; x <= gridWidth; x += gridSize) {
      lines.push(
        <Line key={`v-${x}`} points={[x, 0, x, gridHeight]} stroke="rgba(255, 255, 255, 0.4)" strokeWidth={1} />
      );
    }

    for (let y = startY; y <= gridHeight; y += gridSize) {
      lines.push(
        <Line key={`h-${y}`} points={[0, y, gridWidth, y]} stroke="rgba(255, 255, 255, 0.4)" strokeWidth={1} />
      );
    }

    return lines;
  };

  // Check if a token is the active turn
  const isActiveTurn = (tokenId: string) => {
    const activeEntry = initiative.find(e => e.isActive);
    return activeEntry?.tokenId === tokenId;
  };

  // Render a single token with HP bar and conditions
  const renderToken = (token: Token) => {
    if (token.isHidden && !isDm) return null;

    const gridSize = map.gridSize;
    const tokenGridSize = TOKEN_SIZES[token.size];
    const pixelSize = tokenGridSize * gridSize;
    const x = token.x * gridSize + map.gridOffsetX;
    const y = token.y * gridSize + map.gridOffsetY;

    // Player can drag their own token, DM can drag any token
    const canDrag = isDm || Boolean(playerId && token.ownerId === playerId);
    const isActive = isActiveTurn(token.id);

    // Calculate HP percentage for HP bar
    const hpPercent = token.maxHp && token.currentHp !== undefined
      ? Math.max(0, Math.min(1, token.currentHp / token.maxHp))
      : null;

    return (
      <Group
        key={token.id}
        x={x}
        y={y}
        draggable={canDrag}
        onDragStart={(e) => { e.cancelBubble = true; }}
        onDragEnd={(e) => {
          e.cancelBubble = true;
          if (!onTokenMove) return;
          const newX = Math.round((e.target.x() - map.gridOffsetX) / gridSize);
          const newY = Math.round((e.target.y() - map.gridOffsetY) / gridSize);
          onTokenMove(token.id, newX, newY);
          e.target.position({
            x: newX * gridSize + map.gridOffsetX,
            y: newY * gridSize + map.gridOffsetY,
          });
        }}
      >
        {/* Active turn highlight ring */}
        {isActive && (
          <Circle
            x={pixelSize / 2}
            y={pixelSize / 2}
            radius={pixelSize / 2 + 4}
            stroke="#ffff00"
            strokeWidth={3}
            dash={[8, 4]}
          />
        )}
        {/* Token background circle */}
        <Circle
          x={pixelSize / 2}
          y={pixelSize / 2}
          radius={pixelSize / 2 - 2}
          fill={token.color}
          stroke={token.isHidden ? '#ff0000' : canDrag ? '#00ff00' : '#ffffff'}
          strokeWidth={token.isHidden ? 3 : 2}
          opacity={token.isHidden ? 0.6 : 1}
        />
        {/* Token label */}
        <Text
          x={0}
          y={pixelSize / 2 - 6}
          width={pixelSize}
          text={token.name.substring(0, 3).toUpperCase()}
          fontSize={12}
          fill="#ffffff"
          align="center"
          fontStyle="bold"
        />
        {/* HP Bar (if token has HP) */}
        {hpPercent !== null && (
          <>
            <Rect
              x={2}
              y={pixelSize - 8}
              width={pixelSize - 4}
              height={6}
              fill="#333333"
              cornerRadius={2}
            />
            <Rect
              x={2}
              y={pixelSize - 8}
              width={(pixelSize - 4) * hpPercent}
              height={6}
              fill={hpPercent > 0.5 ? '#00ff00' : hpPercent > 0.25 ? '#ffff00' : '#ff0000'}
              cornerRadius={2}
            />
          </>
        )}
        {/* Condition indicators */}
        {token.conditions && token.conditions.length > 0 && (
          <Group x={pixelSize - 8} y={0}>
            {token.conditions.slice(0, 3).map((condition, i) => (
              <Circle
                key={condition}
                x={0}
                y={i * 10}
                radius={4}
                fill={CONDITION_COLORS[condition] || '#888888'}
                stroke="#ffffff"
                strokeWidth={1}
              />
            ))}
          </Group>
        )}
      </Group>
    );
  };

  // Render fog of war
  const renderFogOfWar = () => {
    if (!isDm && map.fogOfWar.length === 0) return null;

    return map.fogOfWar.map((area) => {
      if (!isDm && area.isRevealed) return null;

      return (
        <Rect
          key={area.id}
          x={area.x}
          y={area.y}
          width={area.width}
          height={area.height}
          fill={isDm ? (area.isRevealed ? 'rgba(0,255,0,0.2)' : 'rgba(0,0,0,0.5)') : '#000000'}
          stroke={isDm ? (area.isRevealed ? '#00ff00' : '#ffffff') : undefined}
          strokeWidth={isDm ? 2 : 0}
          onClick={(e) => {
            if (isDm && onToggleFog && !drawingFog) {
              e.cancelBubble = true;
              onToggleFog(area.id);
            }
          }}
          onTap={(e) => {
            if (isDm && onToggleFog && !drawingFog) {
              e.cancelBubble = true;
              onToggleFog(area.id);
            }
          }}
        />
      );
    });
  };

  // Render fog drawing preview
  const renderFogDrawingPreview = () => {
    if (!drawingFog || !fogStart || !fogEnd) return null;

    const x = Math.min(fogStart.x, fogEnd.x);
    const y = Math.min(fogStart.y, fogEnd.y);
    const width = Math.abs(fogEnd.x - fogStart.x);
    const height = Math.abs(fogEnd.y - fogStart.y);

    return (
      <Rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="rgba(0,0,0,0.3)"
        stroke="#ff0000"
        strokeWidth={2}
        dash={[10, 5]}
      />
    );
  };

  // Render measurement line
  const renderMeasurement = () => {
    if (!measureStart || !measureEnd) return null;

    const dx = measureEnd.x - measureStart.x;
    const dy = measureEnd.y - measureStart.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const gridDistance = distance / map.gridSize * 5; // 5 feet per square

    return (
      <>
        <Line
          points={[measureStart.x, measureStart.y, measureEnd.x, measureEnd.y]}
          stroke="#00ffff"
          strokeWidth={2}
          dash={[10, 5]}
        />
        <Text
          x={(measureStart.x + measureEnd.x) / 2}
          y={(measureStart.y + measureEnd.y) / 2 - 20}
          text={`${Math.round(gridDistance)} ft`}
          fontSize={14}
          fill="#00ffff"
          fontStyle="bold"
        />
      </>
    );
  };

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden">
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        draggable={!isLocked && !measuring && !drawingFog}
        onWheel={handleWheel}
        onDragEnd={handleDragEnd}
        onClick={handleStageClick}
        onMouseMove={handleStageMouseMove}
      >
        <Layer>
          {mapImage && <Image image={mapImage} x={0} y={0} />}
          {!mapImage && <Rect x={0} y={0} width={2000} height={2000} fill="#2d2d2d" />}
        </Layer>
        <Layer>{renderGrid()}</Layer>
        <Layer>{map.tokens.map(renderToken)}</Layer>
        <Layer>{renderFogOfWar()}</Layer>
        <Layer>{renderFogDrawingPreview()}</Layer>
        <Layer>{renderMeasurement()}</Layer>
      </Stage>

      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => !isLocked && setStageScale(Math.min(5, stageScale * 1.2))}
          className={`w-8 h-8 rounded border ${isLocked ? 'bg-gray-600 text-gray-400 border-gray-500 cursor-not-allowed' : 'bg-dark-wood text-gold border-gold hover:bg-leather'}`}
          disabled={isLocked}
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => !isLocked && setStageScale(Math.max(0.1, stageScale / 1.2))}
          className={`w-8 h-8 rounded border ${isLocked ? 'bg-gray-600 text-gray-400 border-gray-500 cursor-not-allowed' : 'bg-dark-wood text-gold border-gold hover:bg-leather'}`}
          disabled={isLocked}
          title="Zoom Out"
        >
          -
        </button>
        <button
          onClick={() => { if (!isLocked) { setStageScale(1); setStagePos({ x: 0, y: 0 }); } }}
          className={`w-8 h-8 rounded border text-xs ${isLocked ? 'bg-gray-600 text-gray-400 border-gray-500 cursor-not-allowed' : 'bg-dark-wood text-gold border-gold hover:bg-leather'}`}
          disabled={isLocked}
          title="Reset View"
        >
          1:1
        </button>
        <button
          onClick={() => {
            setMeasuring(!measuring);
            setDrawingFog(false);
            setMeasureStart(null);
            setMeasureEnd(null);
          }}
          className={`w-8 h-8 rounded border text-xs ${measuring ? 'bg-cyan-600 text-white border-cyan-400' : 'bg-dark-wood text-gold border-gold hover:bg-leather'}`}
          title="Measure Distance"
        >
          📏
        </button>
        {/* Fog of War controls (DM only) */}
        {isDm && (
          <>
            <button
              onClick={() => {
                setDrawingFog(!drawingFog);
                setMeasuring(false);
                setFogStart(null);
                setFogEnd(null);
              }}
              className={`w-8 h-8 rounded border text-xs ${drawingFog ? 'bg-gray-700 text-white border-gray-500' : 'bg-dark-wood text-gold border-gold hover:bg-leather'}`}
              title="Draw Fog of War"
            >
              🌫️
            </button>
            {map.fogOfWar.length > 0 && onClearFog && (
              <button
                onClick={onClearFog}
                className="w-8 h-8 rounded border text-xs bg-dark-wood text-red-400 border-red-400 hover:bg-red-900"
                title="Clear All Fog"
              >
                ❌
              </button>
            )}
          </>
        )}
      </div>

      {/* Info overlay */}
      <div className="absolute top-2 left-2 text-parchment/50 text-xs">
        {drawingFog ? 'Click to start, click again to place fog • Click fog to reveal/hide' : measuring ? 'Click start and end points to measure' : isLocked ? 'Map locked' : 'Scroll to zoom • Drag to pan'}
      </div>

      {isLocked && (
        <div className="absolute top-2 right-2 bg-green-600/80 text-white px-2 py-1 rounded text-xs">
          MAP LOCKED
        </div>
      )}
    </div>
  );
}
