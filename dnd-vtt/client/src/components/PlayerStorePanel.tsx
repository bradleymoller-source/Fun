import { useSessionStore } from '../stores/sessionStore';
import type { Character, PlayerInventoryItem, Weapon, EquipmentItem } from '../types';
import { Button } from './ui/Button';

interface PlayerStorePanelProps {
  character?: Character | null;
  onAddToCharacter?: (updates: Partial<Character>) => void;
}

export function PlayerStorePanel({ character, onAddToCharacter }: PlayerStorePanelProps) {
  const { storeItems, playerInventories } = useSessionStore();

  // Convert inventory item to weapon
  const createWeaponFromItem = (item: PlayerInventoryItem): Weapon => ({
    id: `weapon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: item.name,
    attackBonus: item.attackBonus || 0,
    damage: item.damage || '1d4',
    properties: item.properties || [],
    equipped: false,
  });

  // Convert inventory item to equipment
  const createEquipmentFromItem = (item: PlayerInventoryItem): EquipmentItem => ({
    id: `equip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: item.name,
    quantity: item.quantity,
    description: item.effect || item.description,
    equipped: false,
    category: item.itemType === 'armor' ? 'armor'
            : item.itemType === 'potion' ? 'potion'
            : item.itemType === 'gear' ? 'gear'
            : 'gear',
    armorClass: item.armorClass,
    armorType: item.armorType,
  });

  const handleAddWeapon = (item: PlayerInventoryItem) => {
    if (!character || !onAddToCharacter) return;

    const newWeapon = createWeaponFromItem(item);
    const updatedWeapons = [...(character.weapons || []), newWeapon];
    onAddToCharacter({ weapons: updatedWeapons });
  };

  const handleAddEquipment = (item: PlayerInventoryItem) => {
    if (!character || !onAddToCharacter) return;

    const newEquipment = createEquipmentFromItem(item);
    const updatedEquipment = [...(character.equipment || []), newEquipment];
    onAddToCharacter({ equipment: updatedEquipment });
  };

  const isWeapon = (item: PlayerInventoryItem) =>
    item.itemType === 'weapon' || item.damage || item.attackBonus !== undefined;

  const isArmor = (item: PlayerInventoryItem) =>
    item.itemType === 'armor' || item.armorClass !== undefined;

  const isEquipment = (item: PlayerInventoryItem) =>
    ['potion', 'scroll', 'gear', 'wondrous'].includes(item.itemType || '') ||
    (!isWeapon(item) && !isArmor(item) && item.itemType !== 'treasure');

  return (
    <div className="space-y-4">
      {/* Store Section - Items available for purchase */}
      <div className="bg-dark-wood p-4 rounded-lg border border-leather">
        <h3 className="font-medieval text-gold text-lg mb-3">Shop</h3>

        {storeItems.length === 0 ? (
          <p className="text-parchment/50 text-sm text-center py-2">
            No items available in the shop
          </p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {storeItems.map((item) => (
              <div key={item.id} className="p-2 bg-leather/20 rounded border border-leather/50">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-parchment font-medium">{item.name}</span>
                    <span className="text-gold ml-2">({item.price})</span>
                    {item.quantity !== -1 && (
                      <span className="text-parchment/70 ml-2">x{item.quantity}</span>
                    )}
                  </div>
                </div>
                {item.effect && (
                  <p className="text-green-400 text-sm mt-1">{item.effect}</p>
                )}
                {item.description && (
                  <p className="text-parchment/70 text-sm mt-1">{item.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Player's Inventory - Items received from DM */}
      {playerInventories.length > 0 && (
        <div className="bg-dark-wood p-4 rounded-lg border border-blue-600">
          <h3 className="font-medieval text-blue-400 text-lg mb-3">Your Items</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {playerInventories.map((item) => (
              <div key={item.id} className="p-2 bg-blue-900/30 rounded border border-blue-700/50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <span className="text-parchment font-medium">{item.name}</span>
                    {item.itemType && (
                      <span className={`ml-2 text-xs px-1 rounded ${
                        item.itemType === 'weapon' ? 'bg-red-500/30 text-red-300' :
                        item.itemType === 'armor' ? 'bg-blue-500/30 text-blue-300' :
                        item.itemType === 'potion' ? 'bg-green-500/30 text-green-300' :
                        'bg-gray-500/30 text-gray-300'
                      }`}>
                        {item.itemType}
                      </span>
                    )}
                    <span className="text-parchment/70 ml-2">x{item.quantity}</span>
                  </div>

                  {/* Add to Character buttons */}
                  {character && onAddToCharacter && (
                    <div className="flex gap-1 ml-2">
                      {isWeapon(item) && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleAddWeapon(item)}
                          className="text-xs py-0.5 px-2 bg-red-700/50 hover:bg-red-600/50"
                          title="Add to Combat Weapons"
                        >
                          + Weapons
                        </Button>
                      )}
                      {(isArmor(item) || isEquipment(item)) && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleAddEquipment(item)}
                          className="text-xs py-0.5 px-2 bg-blue-700/50 hover:bg-blue-600/50"
                          title="Add to Equipment"
                        >
                          + Gear
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Item details */}
                <div className="mt-1 text-xs space-y-0.5">
                  {item.damage && (
                    <p className="text-red-400">
                      <span className="text-parchment/50">Damage:</span> {item.damage}
                      {item.attackBonus !== undefined && (
                        <span className="ml-2">
                          <span className="text-parchment/50">Attack:</span> +{item.attackBonus}
                        </span>
                      )}
                    </p>
                  )}
                  {item.armorClass && (
                    <p className="text-blue-400">
                      <span className="text-parchment/50">AC:</span> {item.armorClass}
                      {item.armorType && <span className="ml-1">({item.armorType})</span>}
                    </p>
                  )}
                  {item.effect && (
                    <p className="text-green-400">{item.effect}</p>
                  )}
                  {item.description && !item.effect && (
                    <p className="text-parchment/70">{item.description}</p>
                  )}
                  {item.value && (
                    <p className="text-gold/70">Value: {item.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
