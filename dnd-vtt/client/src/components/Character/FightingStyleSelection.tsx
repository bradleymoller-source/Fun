import type { CharacterClass } from '../../types';
import { getAvailableFightingStyles, CLASS_NAMES } from '../../data/dndData';

interface FightingStyleSelectionProps {
  characterClass: CharacterClass;
  onSelect: (styleId: string) => void;
}

export function FightingStyleSelection({ characterClass, onSelect }: FightingStyleSelectionProps) {
  const availableStyles = getAvailableFightingStyles(characterClass);

  console.log('[FightingStyleSelection] Rendering for class:', characterClass);
  console.log('[FightingStyleSelection] Available styles:', availableStyles);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medieval text-lg text-gold">Fighting Style</h3>
        <p className="text-parchment/70 text-sm">
          Choose a fighting style for your {CLASS_NAMES[characterClass]}. This style defines your combat technique.
        </p>
      </div>

      <div className="space-y-2">
        {availableStyles.map(style => (
          <button
            key={style.id}
            onClick={() => onSelect(style.id)}
            className="w-full p-4 rounded border border-leather bg-dark-wood hover:border-gold hover:bg-leather/30 transition-colors text-left"
          >
            <div className="text-gold font-semibold">{style.name}</div>
            <p className="text-parchment/80 text-sm mt-1">{style.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
