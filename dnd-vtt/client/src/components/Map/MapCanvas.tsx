import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image, Line, Rect, Group, Circle, Text } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type Konva from 'konva';
import { useSessionStore } from '../../stores/sessionStore';
import type { Token, TokenSize } from '../../types';

// Token size in grid squares
const TOKEN_SIZES: Record<TokenSize, number> = {
  tiny: 0.5,
  small: 1,
  medium: 1,
  large: 2,
  huge: 3,
  gargantuan: 4,
};

interface MapCanvasProps {
  width: number;
  height: number;
  isDm: boolean;
  isLocked?: boolean;
  onTokenMove?: (tokenId: string, x: number, y: number) => void;
}

export function MapCanvas({ width, height, isDm, isLocked = false, onTokenMove }: MapCanvasProps) {
  const { map } = useSessionStore();
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [mapImage, setMapImage] = useState<HTMLImageElement | null>(null);
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

  // Draw grid lines - now works without map image too
  const renderGrid = () => {
    if (!map.showGrid) return null;

    const lines = [];
    const gridSize = map.gridSize;
    const startX = map.gridOffsetX % gridSize;
    const startY = map.gridOffsetY % gridSize;

    // Calculate grid extent based on map image or a large default area
    const gridWidth = mapImage ? mapImage.width : 2000;
    const gridHeight = mapImage ? mapImage.height : 2000;

    // Vertical lines
    for (let x = startX; x <= gridWidth; x += gridSize) {
      lines.push(
        <Line
          key={`v-${x}`}
          points={[x, 0, x, gridHeight]}
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth={1}
        />
      );
    }

    // Horizontal lines
    for (let y = startY; y <= gridHeight; y += gridSize) {
      lines.push(
        <Line
          key={`h-${y}`}
          points={[0, y, gridWidth, y]}
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth={1}
        />
      );
    }

    return lines;
  };

  // Render a single token
  const renderToken = (token: Token) => {
    // Hide tokens from players if they're marked as hidden
    if (token.isHidden && !isDm) return null;

    const gridSize = map.gridSize;
    const tokenGridSize = TOKEN_SIZES[token.size];
    const pixelSize = tokenGridSize * gridSize;
    const x = token.x * gridSize + map.gridOffsetX;
    const y = token.y * gridSize + map.gridOffsetY;

    // Can this token be dragged? Only DM can drag, and only if not locked
    const canDrag = isDm && !isLocked;

    return (
      <Group
        key={token.id}
        x={x}
        y={y}
        draggable={canDrag}
        onDragEnd={(e) => {
          if (!onTokenMove) return;
          // Convert pixel position back to grid position
          const newX = Math.round((e.target.x() - map.gridOffsetX) / gridSize);
          const newY = Math.round((e.target.y() - map.gridOffsetY) / gridSize);
          onTokenMove(token.id, newX, newY);
          // Snap to grid
          e.target.position({
            x: newX * gridSize + map.gridOffsetX,
            y: newY * gridSize + map.gridOffsetY,
          });
        }}
      >
        {/* Token background circle */}
        <Circle
          x={pixelSize / 2}
          y={pixelSize / 2}
          radius={pixelSize / 2 - 2}
          fill={token.color}
          stroke={token.isHidden ? '#ff0000' : '#ffffff'}
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
      </Group>
    );
  };

  // Render fog of war
  const renderFogOfWar = () => {
    if (!isDm && map.fogOfWar.length === 0) return null;

    return map.fogOfWar.map((area) => {
      // Players see unrevealed areas as black
      // DM sees all areas with different opacity
      if (!isDm && area.isRevealed) return null;

      return (
        <Rect
          key={area.id}
          x={area.x}
          y={area.y}
          width={area.width}
          height={area.height}
          fill={isDm ? (area.isRevealed ? 'rgba(0,255,0,0.2)' : 'rgba(0,0,0,0.5)') : '#000000'}
          stroke={isDm ? '#ffffff' : undefined}
          strokeWidth={isDm ? 1 : 0}
        />
      );
    });
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
        draggable={!isLocked}
        onWheel={handleWheel}
        onDragEnd={handleDragEnd}
      >
        {/* Background Layer */}
        <Layer>
          {mapImage && (
            <Image
              image={mapImage}
              x={0}
              y={0}
            />
          )}
          {!mapImage && (
            <Rect
              x={0}
              y={0}
              width={2000}
              height={2000}
              fill="#2d2d2d"
            />
          )}
        </Layer>

        {/* Grid Layer */}
        <Layer>{renderGrid()}</Layer>

        {/* Tokens Layer */}
        <Layer>
          {map.tokens.map(renderToken)}
        </Layer>

        {/* Fog of War Layer */}
        <Layer>{renderFogOfWar()}</Layer>
      </Stage>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => !isLocked && setStageScale(Math.min(5, stageScale * 1.2))}
          className={`w-8 h-8 rounded border ${isLocked ? 'bg-gray-600 text-gray-400 border-gray-500 cursor-not-allowed' : 'bg-dark-wood text-gold border-gold hover:bg-leather'}`}
          disabled={isLocked}
        >
          +
        </button>
        <button
          onClick={() => !isLocked && setStageScale(Math.max(0.1, stageScale / 1.2))}
          className={`w-8 h-8 rounded border ${isLocked ? 'bg-gray-600 text-gray-400 border-gray-500 cursor-not-allowed' : 'bg-dark-wood text-gold border-gold hover:bg-leather'}`}
          disabled={isLocked}
        >
          -
        </button>
        <button
          onClick={() => {
            if (!isLocked) {
              setStageScale(1);
              setStagePos({ x: 0, y: 0 });
            }
          }}
          className={`w-8 h-8 rounded border text-xs ${isLocked ? 'bg-gray-600 text-gray-400 border-gray-500 cursor-not-allowed' : 'bg-dark-wood text-gold border-gold hover:bg-leather'}`}
          disabled={isLocked}
        >
          1:1
        </button>
      </div>

      {/* Info overlay */}
      <div className="absolute top-2 left-2 text-parchment/50 text-xs">
        {isLocked ? 'Map locked' : 'Scroll to zoom • Drag to pan'}
      </div>

      {/* Lock indicator */}
      {isLocked && (
        <div className="absolute top-2 right-2 bg-red-600/80 text-white px-2 py-1 rounded text-xs">
          LOCKED
        </div>
      )}
    </div>
  );
}
