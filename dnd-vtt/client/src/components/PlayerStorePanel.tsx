import { useState } from 'react';
import { useSessionStore } from '../stores/sessionStore';
import type { Character, PlayerInventoryItem, Weapon, EquipmentItem, StoreItem, Currency } from '../types';
import { Button } from './ui/Button';

interface PlayerStorePanelProps {
  character?: Character | null;
  onAddToCharacter?: (updates: Partial<Character>) => void;
}

// Parse price string like "10gp" or "5sp" into copper value
function parsePriceToCopper(price: string): number {
  const match = price.toLowerCase().match(/(\d+)\s*(cp|sp|ep|gp|pp)/);
  if (!match) return 0;

  const amount = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 'cp': return amount;
    case 'sp': return amount * 10;
    case 'ep': return amount * 50;
    case 'gp': return amount * 100;
    case 'pp': return amount * 1000;
    default: return 0;
  }
}

// Convert total copper to display format
function formatCurrency(currency: Currency): string {
  const parts: string[] = [];
  if (currency.platinum > 0) parts.push(`${currency.platinum}pp`);
  if (currency.gold > 0) parts.push(`${currency.gold}gp`);
  if (currency.electrum > 0) parts.push(`${currency.electrum}ep`);
  if (currency.silver > 0) parts.push(`${currency.silver}sp`);
  if (currency.copper > 0) parts.push(`${currency.copper}cp`);
  return parts.length > 0 ? parts.join(' ') : '0gp';
}

// Get total wealth in copper
function getTotalCopper(currency: Currency): number {
  return (
    currency.copper +
    currency.silver * 10 +
    currency.electrum * 50 +
    currency.gold * 100 +
    currency.platinum * 1000
  );
}

// Deduct copper from currency, returns new currency object
function deductCopper(currency: Currency, copperAmount: number): Currency | null {
  const total = getTotalCopper(currency);
  if (total < copperAmount) return null;

  let remaining = total - copperAmount;

  // Convert back to denominations (prefer larger coins)
  const platinum = Math.floor(remaining / 1000);
  remaining -= platinum * 1000;
  const gold = Math.floor(remaining / 100);
  remaining -= gold * 100;
  const electrum = Math.floor(remaining / 50);
  remaining -= electrum * 50;
  const silver = Math.floor(remaining / 10);
  remaining -= silver * 10;
  const copper = remaining;

  return { platinum, gold, electrum, silver, copper };
}

export function PlayerStorePanel({ character, onAddToCharacter }: PlayerStorePanelProps) {
  const { storeItems, playerInventories } = useSessionStore();
  const [buyMessage, setBuyMessage] = useState<string | null>(null);

  // Convert inventory item to weapon
  const createWeaponFromItem = (item: PlayerInventoryItem | StoreItem): Weapon => ({
    id: `weapon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: item.name,
    attackBonus: ('attackBonus' in item ? item.attackBonus : undefined) || 0,
    damage: ('damage' in item ? item.damage : undefined) || '1d6',
    properties: ('properties' in item ? item.properties : undefined) || [],
    equipped: false,
  });

  // Convert inventory item to equipment
  const createEquipmentFromItem = (item: PlayerInventoryItem | StoreItem): EquipmentItem => ({
    id: `equip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: item.name,
    quantity: ('quantity' in item ? item.quantity : 1) || 1,
    description: ('effect' in item ? item.effect : undefined) || ('description' in item ? item.description : undefined),
    equipped: false,
    category: isArmor(item) ? 'armor' : isPotion(item) ? 'potion' : 'gear',
    armorClass: 'armorClass' in item ? item.armorClass : undefined,
    armorType: 'armorType' in item ? item.armorType : undefined,
  });

  // Check if item is a weapon (check itemType, damage field, or description text)
  const isWeapon = (item: PlayerInventoryItem | StoreItem): boolean => {
    if ('itemType' in item && item.itemType === 'weapon') return true;
    if ('damage' in item && item.damage) return true;
    if ('attackBonus' in item && item.attackBonus !== undefined) return true;

    // Check description/effect for weapon keywords
    const desc = (('description' in item ? item.description : '') || ('effect' in item ? item.effect : '') || '').toLowerCase();
    const name = item.name.toLowerCase();
    const weaponKeywords = ['sword', 'axe', 'bow', 'dagger', 'mace', 'hammer', 'spear', 'staff', 'weapon', 'crossbow', 'javelin', 'trident', 'scimitar', 'rapier', 'glaive', 'halberd', 'pike', 'flail', 'morningstar', 'warhammer', 'battleaxe', 'greataxe', 'greatsword', 'longsword', 'shortsword', 'shortbow', 'longbow', 'club', 'greatclub', 'handaxe', 'lance', 'maul', 'quarterstaff', 'sickle', 'whip'];

    return weaponKeywords.some(kw => name.includes(kw) || desc.includes(kw));
  };

  // Check if item is armor
  const isArmor = (item: PlayerInventoryItem | StoreItem): boolean => {
    if ('itemType' in item && item.itemType === 'armor') return true;
    if ('armorClass' in item && item.armorClass !== undefined) return true;

    const desc = (('description' in item ? item.description : '') || ('effect' in item ? item.effect : '') || '').toLowerCase();
    const name = item.name.toLowerCase();
    const armorKeywords = ['armor', 'shield', 'mail', 'plate', 'leather armor', 'chain', 'breastplate', 'scale', 'splint', 'half plate', 'padded', 'studded', 'hide', 'ring mail'];

    return armorKeywords.some(kw => name.includes(kw) || desc.includes(kw));
  };

  // Check if item is a potion
  const isPotion = (item: PlayerInventoryItem | StoreItem): boolean => {
    if ('itemType' in item && item.itemType === 'potion') return true;
    const name = item.name.toLowerCase();
    return name.includes('potion') || name.includes('elixir') || name.includes('philter');
  };

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

  // Handle buying from store
  const handleBuy = (item: StoreItem) => {
    if (!character || !onAddToCharacter) {
      setBuyMessage('No character loaded');
      setTimeout(() => setBuyMessage(null), 2000);
      return;
    }

    const copperCost = parsePriceToCopper(item.price);
    if (copperCost === 0) {
      setBuyMessage('Invalid price');
      setTimeout(() => setBuyMessage(null), 2000);
      return;
    }

    const currentCurrency = character.currency || { copper: 0, silver: 0, electrum: 0, gold: 0, platinum: 0 };
    const newCurrency = deductCopper(currentCurrency, copperCost);

    if (!newCurrency) {
      setBuyMessage('Not enough gold!');
      setTimeout(() => setBuyMessage(null), 2000);
      return;
    }

    // Determine where to add the item
    if (isWeapon(item)) {
      const newWeapon = createWeaponFromItem(item);
      const updatedWeapons = [...(character.weapons || []), newWeapon];
      onAddToCharacter({ weapons: updatedWeapons, currency: newCurrency });
      setBuyMessage(`Bought ${item.name} - added to Weapons!`);
    } else {
      const newEquipment = createEquipmentFromItem(item);
      const updatedEquipment = [...(character.equipment || []), newEquipment];
      onAddToCharacter({ equipment: updatedEquipment, currency: newCurrency });
      setBuyMessage(`Bought ${item.name} - added to Gear!`);
    }

    setTimeout(() => setBuyMessage(null), 2000);
  };

  // Check if player can afford item
  const canAfford = (item: StoreItem): boolean => {
    if (!character?.currency) return false;
    const copperCost = parsePriceToCopper(item.price);
    return getTotalCopper(character.currency) >= copperCost;
  };

  return (
    <div className="space-y-4">
      {/* Currency Display */}
      {character?.currency && (
        <div className="bg-dark-wood p-3 rounded-lg border border-gold/50">
          <div className="flex justify-between items-center">
            <span className="font-medieval text-gold text-sm">Your Wealth:</span>
            <span className="text-gold font-bold">{formatCurrency(character.currency)}</span>
          </div>
        </div>
      )}

      {/* Buy Message */}
      {buyMessage && (
        <div className={`p-2 rounded text-center text-sm ${
          buyMessage.includes('Not enough') || buyMessage.includes('Invalid') || buyMessage.includes('No character')
            ? 'bg-red-900/50 text-red-300 border border-red-500'
            : 'bg-green-900/50 text-green-300 border border-green-500'
        }`}>
          {buyMessage}
        </div>
      )}

      {/* Store Section - Items available for purchase */}
      <div className="bg-dark-wood p-4 rounded-lg border border-leather">
        <h3 className="font-medieval text-gold text-lg mb-3">Shop</h3>

        {storeItems.length === 0 ? (
          <p className="text-parchment/50 text-sm text-center py-2">
            No items available in the shop
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {storeItems.map((item) => (
              <div key={item.id} className="p-2 bg-leather/20 rounded border border-leather/50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <span className="text-parchment font-medium">{item.name}</span>
                    <span className="text-gold ml-2">({item.price})</span>
                    {item.quantity !== -1 && item.quantity !== undefined && (
                      <span className="text-parchment/70 ml-2">x{item.quantity}</span>
                    )}
                  </div>
                  {character && onAddToCharacter && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleBuy(item)}
                      disabled={!canAfford(item)}
                      className={`text-xs py-0.5 px-3 ${
                        canAfford(item)
                          ? 'bg-gold/30 hover:bg-gold/50 text-gold'
                          : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Buy
                    </Button>
                  )}
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
                      {(isArmor(item) || !isWeapon(item)) && (
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
