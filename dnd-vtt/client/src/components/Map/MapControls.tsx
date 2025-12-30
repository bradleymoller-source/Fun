import { useState, useRef } from 'react';
import { useSessionStore } from '../../stores/sessionStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { Token, TokenSize } from '../../types';

interface MapControlsProps {
  onAddToken: (token: Token) => void;
  onUpdateToken: (tokenId: string, updates: Partial<Token>) => void;
  onRemoveToken: (tokenId: string) => void;
}

const TOKEN_COLORS = [
  '#e74c3c', // Red
  '#3498db', // Blue
  '#2ecc71', // Green
  '#f39c12', // Orange
  '#9b59b6', // Purple
  '#1abc9c', // Teal
  '#e91e63', // Pink
  '#795548', // Brown
];

export function MapControls({ onAddToken, onUpdateToken, onRemoveToken }: MapControlsProps) {
  const { map, setMapImage, setGridSize, setGridOffset, toggleGrid } = useSessionStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Token creation form
  const [tokenName, setTokenName] = useState('');
  const [tokenSize, setTokenSize] = useState<TokenSize>('medium');
  const [tokenColor, setTokenColor] = useState(TOKEN_COLORS[0]);
  const [tokenHidden, setTokenHidden] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64 for simplicity (in production, upload to server)
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setMapImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleAddToken = () => {
    if (!tokenName.trim()) return;

    const token: Token = {
      id: `token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: tokenName,
      x: 5, // Default position
      y: 5,
      size: tokenSize,
      color: tokenColor,
      isHidden: tokenHidden,
    };

    onAddToken(token);
    setTokenName('');
  };

  return (
    <div className="space-y-4">
      {/* Map Upload Section */}
      <div className="bg-dark-wood p-4 rounded-lg border border-leather">
        <h3 className="font-medieval text-gold text-lg mb-3">Map Image</h3>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload Map
          </Button>
          {map.imageUrl && (
            <Button
              size="sm"
              variant="danger"
              onClick={() => setMapImage(null)}
            >
              Clear
            </Button>
          )}
        </div>

        {map.imageUrl && (
          <p className="text-parchment/50 text-xs mt-2">Map loaded</p>
        )}
      </div>

      {/* Grid Controls */}
      <div className="bg-dark-wood p-4 rounded-lg border border-leather">
        <h3 className="font-medieval text-gold text-lg mb-3">Grid Settings</h3>

        <div className="flex items-center gap-4 mb-3">
          <label className="flex items-center gap-2 text-parchment">
            <input
              type="checkbox"
              checked={map.showGrid}
              onChange={toggleGrid}
              className="w-4 h-4"
            />
            Show Grid
          </label>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-parchment text-sm">Size:</span>
          <input
            type="range"
            min="20"
            max="100"
            value={map.gridSize}
            onChange={(e) => setGridSize(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-parchment text-sm w-12">{map.gridSize}px</span>
        </div>

        {/* Grid Offset Controls */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-parchment text-sm w-16">Offset X:</span>
            <input
              type="range"
              min="0"
              max={map.gridSize}
              value={map.gridOffsetX}
              onChange={(e) => setGridOffset(Number(e.target.value), map.gridOffsetY)}
              className="flex-1"
            />
            <span className="text-parchment text-sm w-8">{map.gridOffsetX}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-parchment text-sm w-16">Offset Y:</span>
            <input
              type="range"
              min="0"
              max={map.gridSize}
              value={map.gridOffsetY}
              onChange={(e) => setGridOffset(map.gridOffsetX, Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-parchment text-sm w-8">{map.gridOffsetY}</span>
          </div>
        </div>
      </div>

      {/* Token Creation */}
      <div className="bg-dark-wood p-4 rounded-lg border border-leather">
        <h3 className="font-medieval text-gold text-lg mb-3">Add Token</h3>

        <div className="space-y-3">
          <Input
            placeholder="Token name"
            value={tokenName}
            onChange={(e) => setTokenName(e.target.value)}
            className="text-sm py-2"
          />

          <div>
            <label className="text-parchment text-sm block mb-1">Size:</label>
            <select
              value={tokenSize}
              onChange={(e) => setTokenSize(e.target.value as TokenSize)}
              className="w-full bg-parchment text-dark-wood rounded px-3 py-2 text-sm"
            >
              <option value="tiny">Tiny (0.5 sq)</option>
              <option value="small">Small (1 sq)</option>
              <option value="medium">Medium (1 sq)</option>
              <option value="large">Large (2 sq)</option>
              <option value="huge">Huge (3 sq)</option>
              <option value="gargantuan">Gargantuan (4 sq)</option>
            </select>
          </div>

          <div>
            <label className="text-parchment text-sm block mb-1">Color:</label>
            <div className="flex gap-2 flex-wrap">
              {TOKEN_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setTokenColor(color)}
                  className={`w-8 h-8 rounded-full border-2 ${
                    tokenColor === color ? 'border-gold' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-parchment text-sm">
            <input
              type="checkbox"
              checked={tokenHidden}
              onChange={(e) => setTokenHidden(e.target.checked)}
              className="w-4 h-4"
            />
            Hidden (DM only)
          </label>

          <Button
            size="sm"
            onClick={handleAddToken}
            disabled={!tokenName.trim()}
            className="w-full"
          >
            Add Token
          </Button>
        </div>
      </div>

      {/* Token List */}
      {map.tokens.length > 0 && (
        <div className="bg-dark-wood p-4 rounded-lg border border-leather">
          <h3 className="font-medieval text-gold text-lg mb-3">
            Tokens ({map.tokens.length})
          </h3>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {map.tokens.map((token) => (
              <TokenListItem
                key={token.id}
                token={token}
                onUpdate={onUpdateToken}
                onRemove={onRemoveToken}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface TokenListItemProps {
  token: Token;
  onUpdate: (tokenId: string, updates: Partial<Token>) => void;
  onRemove: (tokenId: string) => void;
}

function TokenListItem({ token, onUpdate, onRemove }: TokenListItemProps) {
  return (
    <div className="flex items-center justify-between bg-leather/30 px-3 py-2 rounded">
      <div className="flex items-center gap-2">
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: token.color }}
        />
        <span className="text-parchment text-sm">
          {token.name}
          {token.isHidden && <span className="text-red-400 ml-1">(hidden)</span>}
        </span>
      </div>
      <div className="flex gap-1">
        <button
          onClick={() => onUpdate(token.id, { isHidden: !token.isHidden })}
          className="text-parchment/50 hover:text-parchment text-xs px-2"
          title={token.isHidden ? 'Show to players' : 'Hide from players'}
        >
          {token.isHidden ? '👁' : '👁‍🗨'}
        </button>
        <button
          onClick={() => onRemove(token.id)}
          className="text-red-400 hover:text-red-300 text-xs px-2"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
