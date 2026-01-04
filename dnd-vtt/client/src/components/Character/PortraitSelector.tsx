import { useState, useRef } from 'react';
import { Button } from '../ui/Button';

// Default fantasy character silhouettes (SVG data URIs)
const DEFAULT_PORTRAITS = [
  // Warrior/Fighter
  { id: 'warrior', name: 'Warrior', color: '#8B4513' },
  // Mage/Wizard
  { id: 'mage', name: 'Mage', color: '#4B0082' },
  // Rogue
  { id: 'rogue', name: 'Rogue', color: '#2F4F4F' },
  // Cleric/Priest
  { id: 'cleric', name: 'Cleric', color: '#DAA520' },
  // Ranger
  { id: 'ranger', name: 'Ranger', color: '#228B22' },
  // Barbarian
  { id: 'barbarian', name: 'Barbarian', color: '#8B0000' },
  // Bard
  { id: 'bard', name: 'Bard', color: '#9932CC' },
  // Monk
  { id: 'monk', name: 'Monk', color: '#D2691E' },
  // Paladin
  { id: 'paladin', name: 'Paladin', color: '#FFD700' },
  // Druid
  { id: 'druid', name: 'Druid', color: '#556B2F' },
  // Sorcerer
  { id: 'sorcerer', name: 'Sorcerer', color: '#FF4500' },
  // Warlock
  { id: 'warlock', name: 'Warlock', color: '#800080' },
];

// Generate an SVG portrait placeholder
function generatePortraitSvg(id: string, color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs>
      <linearGradient id="bg${id}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${adjustColor(color, -40)};stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" fill="url(#bg${id})" rx="4"/>
    <circle cx="50" cy="35" r="18" fill="${adjustColor(color, 60)}" opacity="0.9"/>
    <ellipse cx="50" cy="85" rx="25" ry="30" fill="${adjustColor(color, 60)}" opacity="0.9"/>
    <circle cx="50" cy="35" r="14" fill="${adjustColor(color, 40)}" opacity="0.6"/>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// Adjust color brightness
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

interface PortraitSelectorProps {
  value?: string;
  onChange: (portrait: string) => void;
}

export function PortraitSelector({ value, onChange }: PortraitSelectorProps) {
  const [mode, setMode] = useState<'preset' | 'url' | 'upload'>('preset');
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePresetSelect = (id: string, color: string) => {
    onChange(generatePortraitSvg(id, color));
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) {
      setUrlError('Please enter a URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(urlInput);
      setUrlError('');
      onChange(urlInput);
    } catch {
      setUrlError('Invalid URL format');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUrlError('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setUrlError('Image must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      onChange(result);
      setUrlError('');
    };
    reader.onerror = () => {
      setUrlError('Error reading file');
    };
    reader.readAsDataURL(file);
  };

  const handleClear = () => {
    onChange('');
    setUrlInput('');
    setUrlError('');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        {/* Current portrait preview */}
        <div className="w-20 h-20 rounded-lg border-2 border-gold/50 bg-dark-wood overflow-hidden flex-shrink-0">
          {value ? (
            <img
              src={value}
              alt="Character portrait"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = generatePortraitSvg('default', '#666');
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-parchment/50 text-xs text-center p-2">
              No portrait
            </div>
          )}
        </div>

        {/* Mode selector */}
        <div className="flex-1 space-y-2">
          <div className="flex gap-1">
            <button
              onClick={() => setMode('preset')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                mode === 'preset'
                  ? 'bg-gold text-dark-wood'
                  : 'bg-leather/50 text-parchment hover:bg-leather'
              }`}
            >
              Presets
            </button>
            <button
              onClick={() => setMode('url')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                mode === 'url'
                  ? 'bg-gold text-dark-wood'
                  : 'bg-leather/50 text-parchment hover:bg-leather'
              }`}
            >
              URL
            </button>
            <button
              onClick={() => setMode('upload')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                mode === 'upload'
                  ? 'bg-gold text-dark-wood'
                  : 'bg-leather/50 text-parchment hover:bg-leather'
              }`}
            >
              Upload
            </button>
            {value && (
              <button
                onClick={handleClear}
                className="px-2 py-1 text-xs rounded bg-red-900/50 text-red-300 hover:bg-red-900/70 ml-auto"
              >
                Clear
              </button>
            )}
          </div>

          {/* URL input */}
          {mode === 'url' && (
            <div className="flex gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.png"
                className="flex-1 bg-parchment text-dark-wood px-2 py-1 rounded text-xs"
              />
              <Button size="sm" onClick={handleUrlSubmit}>Set</Button>
            </div>
          )}

          {/* Upload button */}
          {mode === 'upload' && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                Choose Image (max 2MB)
              </Button>
            </>
          )}

          {urlError && (
            <p className="text-red-400 text-xs">{urlError}</p>
          )}
        </div>
      </div>

      {/* Preset portraits grid */}
      {mode === 'preset' && (
        <div className="grid grid-cols-6 gap-2">
          {DEFAULT_PORTRAITS.map(portrait => (
            <button
              key={portrait.id}
              onClick={() => handlePresetSelect(portrait.id, portrait.color)}
              className="w-12 h-12 rounded border border-leather hover:border-gold transition-colors overflow-hidden"
              title={portrait.name}
            >
              <img
                src={generatePortraitSvg(portrait.id, portrait.color)}
                alt={portrait.name}
                className="w-full h-full"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Export the portrait generator for use elsewhere
export { generatePortraitSvg, DEFAULT_PORTRAITS };
