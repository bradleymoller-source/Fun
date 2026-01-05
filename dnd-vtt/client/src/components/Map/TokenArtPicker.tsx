import { useState } from 'react';
import { Button } from '../ui/Button';

// Built-in token art categories and items
// These would ideally be actual image URLs, but for now we'll use emoji representations
// that can be replaced with actual token art later
const TOKEN_LIBRARY = {
  players: [
    { id: 'fighter', name: 'Fighter', color: '#c0392b', emoji: '⚔️' },
    { id: 'wizard', name: 'Wizard', color: '#9b59b6', emoji: '🧙' },
    { id: 'rogue', name: 'Rogue', color: '#34495e', emoji: '🗡️' },
    { id: 'cleric', name: 'Cleric', color: '#f1c40f', emoji: '✝️' },
    { id: 'ranger', name: 'Ranger', color: '#27ae60', emoji: '🏹' },
    { id: 'paladin', name: 'Paladin', color: '#3498db', emoji: '🛡️' },
    { id: 'barbarian', name: 'Barbarian', color: '#e74c3c', emoji: '🪓' },
    { id: 'bard', name: 'Bard', color: '#e91e63', emoji: '🎵' },
    { id: 'druid', name: 'Druid', color: '#4caf50', emoji: '🌿' },
    { id: 'monk', name: 'Monk', color: '#ff9800', emoji: '👊' },
    { id: 'sorcerer', name: 'Sorcerer', color: '#673ab7', emoji: '⚡' },
    { id: 'warlock', name: 'Warlock', color: '#7b1fa2', emoji: '👁️' },
  ],
  monsters: [
    { id: 'goblin', name: 'Goblin', color: '#8bc34a', emoji: '👺' },
    { id: 'orc', name: 'Orc', color: '#607d8b', emoji: '👹' },
    { id: 'skeleton', name: 'Skeleton', color: '#eceff1', emoji: '💀' },
    { id: 'zombie', name: 'Zombie', color: '#4caf50', emoji: '🧟' },
    { id: 'dragon', name: 'Dragon', color: '#f44336', emoji: '🐉' },
    { id: 'wolf', name: 'Wolf', color: '#795548', emoji: '🐺' },
    { id: 'spider', name: 'Spider', color: '#37474f', emoji: '🕷️' },
    { id: 'ogre', name: 'Ogre', color: '#8d6e63', emoji: '👿' },
    { id: 'troll', name: 'Troll', color: '#689f38', emoji: '🧌' },
    { id: 'ghost', name: 'Ghost', color: '#b0bec5', emoji: '👻' },
    { id: 'demon', name: 'Demon', color: '#b71c1c', emoji: '😈' },
    { id: 'elemental', name: 'Elemental', color: '#ff5722', emoji: '🔥' },
  ],
  npcs: [
    { id: 'noble', name: 'Noble', color: '#9c27b0', emoji: '👑' },
    { id: 'merchant', name: 'Merchant', color: '#ffc107', emoji: '💰' },
    { id: 'guard', name: 'Guard', color: '#607d8b', emoji: '💂' },
    { id: 'commoner', name: 'Commoner', color: '#795548', emoji: '👤' },
    { id: 'priest', name: 'Priest', color: '#fff176', emoji: '⛪' },
    { id: 'mage', name: 'Mage', color: '#7e57c2', emoji: '🔮' },
  ],
  objects: [
    { id: 'chest', name: 'Chest', color: '#8d6e63', emoji: '📦' },
    { id: 'door', name: 'Door', color: '#a1887f', emoji: '🚪' },
    { id: 'trap', name: 'Trap', color: '#ff5722', emoji: '⚠️' },
    { id: 'campfire', name: 'Campfire', color: '#ff9800', emoji: '🔥' },
    { id: 'altar', name: 'Altar', color: '#9e9e9e', emoji: '🏛️' },
    { id: 'statue', name: 'Statue', color: '#78909c', emoji: '🗿' },
  ],
};

type Category = keyof typeof TOKEN_LIBRARY;

interface TokenArtPickerProps {
  onSelect: (tokenData: { name: string; color: string; imageUrl?: string }) => void;
  onClose: () => void;
}

export function TokenArtPicker({ onSelect, onClose }: TokenArtPickerProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category>('monsters');
  const [customUrl, setCustomUrl] = useState('');
  const [customName, setCustomName] = useState('');
  const [customColor, setCustomColor] = useState('#3498db');

  const handleSelectToken = (token: typeof TOKEN_LIBRARY['players'][0]) => {
    onSelect({
      name: token.name,
      color: token.color,
      // In a real implementation, this would be an actual image URL
      // imageUrl: `/tokens/${token.id}.png`,
    });
    onClose();
  };

  const handleCustomToken = () => {
    if (!customName.trim()) return;

    onSelect({
      name: customName,
      color: customColor,
      imageUrl: customUrl || undefined,
    });
    onClose();
  };

  const categories: { id: Category; label: string }[] = [
    { id: 'monsters', label: 'Monsters' },
    { id: 'players', label: 'Players' },
    { id: 'npcs', label: 'NPCs' },
    { id: 'objects', label: 'Objects' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-wood p-6 rounded-lg border-2 border-leather max-w-lg w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gold font-bold text-lg">Add Token</h3>
          <button
            onClick={onClose}
            className="text-parchment/60 hover:text-parchment text-xl"
          >
            ✕
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1 mb-4">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-gold text-dark-wood'
                  : 'bg-leather/50 text-parchment hover:bg-leather'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Token Grid */}
        <div className="flex-1 overflow-y-auto mb-4">
          <div className="grid grid-cols-4 gap-2">
            {TOKEN_LIBRARY[selectedCategory].map(token => (
              <button
                key={token.id}
                onClick={() => handleSelectToken(token)}
                className="p-3 bg-leather/30 rounded border border-leather hover:border-gold transition-colors text-center"
              >
                <div
                  className="w-10 h-10 mx-auto rounded-full flex items-center justify-center text-2xl mb-1"
                  style={{ backgroundColor: token.color }}
                >
                  {token.emoji}
                </div>
                <div className="text-parchment text-xs truncate">
                  {token.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Token */}
        <div className="border-t border-leather pt-4">
          <h4 className="text-parchment/80 text-sm mb-2">Custom Token</h4>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm bg-parchment text-dark-wood rounded"
            />
            <input
              type="color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="w-10 h-8 rounded cursor-pointer"
              title="Token color"
            />
            <Button
              size="sm"
              onClick={handleCustomToken}
              disabled={!customName.trim()}
            >
              Add
            </Button>
          </div>
          <input
            type="text"
            placeholder="Image URL (optional)"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            className="w-full mt-2 px-3 py-1.5 text-sm bg-parchment text-dark-wood rounded"
          />
        </div>
      </div>
    </div>
  );
}
