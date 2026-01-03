import { useState } from 'react';
import { useSessionStore } from '../stores/sessionStore';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import type { StoreItem, LootItem, Player } from '../types';

interface StorePanelProps {
  isDm: boolean;
  players?: Player[];
  onUpdateStore?: (items: StoreItem[]) => void;
  onDistributeItem?: (itemId: string, playerId: string, playerName: string, quantity: number) => void;
  onDistributeStoreItem?: (item: StoreItem, playerId: string, playerName: string) => void;
  // Socket functions passed from parent to avoid creating new socket connection
  addStoreItem?: (item: StoreItem) => Promise<void>;
  removeStoreItem?: (itemId: string) => Promise<void>;
  addLootItem?: (item: LootItem) => Promise<void>;
  removeLootItem?: (itemId: string) => Promise<void>;
}

export function StorePanel({ isDm, players = [], onDistributeItem, onDistributeStoreItem, addStoreItem, removeStoreItem, addLootItem, removeLootItem }: StorePanelProps) {
  const { storeItems, lootItems, playerInventories } = useSessionStore();

  const [showAddStore, setShowAddStore] = useState(false);
  const [showAddLoot, setShowAddLoot] = useState(false);
  const [newStoreItem, setNewStoreItem] = useState({ name: '', price: '', quantity: 1, description: '', effect: '' });
  const [newLootItem, setNewLootItem] = useState({ name: '', value: '', quantity: 1, description: '', source: '' });
  const [distributeItem, setDistributeItem] = useState<{ itemId: string; quantity: number } | null>(null);
  const [distributeStoreItem, setDistributeStoreItem] = useState<StoreItem | null>(null);

  const handleAddStoreItem = async () => {
    if (!newStoreItem.name.trim() || !newStoreItem.price.trim() || !addStoreItem) return;

    const item: StoreItem = {
      id: `store-${Date.now()}`,
      name: newStoreItem.name.trim(),
      price: newStoreItem.price.trim(),
      quantity: newStoreItem.quantity,
      description: newStoreItem.description.trim() || undefined,
      effect: newStoreItem.effect.trim() || undefined,
    };

    try {
      await addStoreItem(item);
      setNewStoreItem({ name: '', price: '', quantity: 1, description: '', effect: '' });
      setShowAddStore(false);
    } catch (error) {
      console.error('Failed to add store item:', error);
    }
  };

  const handleAddLootItem = async () => {
    if (!newLootItem.name.trim() || !addLootItem) return;

    const item: LootItem = {
      id: `loot-${Date.now()}`,
      name: newLootItem.name.trim(),
      value: newLootItem.value.trim() || undefined,
      quantity: newLootItem.quantity,
      description: newLootItem.description.trim() || undefined,
      source: newLootItem.source.trim() || undefined,
    };

    try {
      await addLootItem(item);
      setNewLootItem({ name: '', value: '', quantity: 1, description: '', source: '' });
      setShowAddLoot(false);
    } catch (error) {
      console.error('Failed to add loot item:', error);
    }
  };

  const handleDistribute = (playerId: string, playerName: string) => {
    if (!distributeItem) return;

    // Call the socket function to distribute
    onDistributeItem?.(distributeItem.itemId, playerId, playerName, distributeItem.quantity);
    setDistributeItem(null);
  };

  const handleDistributeStore = (playerId: string, playerName: string) => {
    if (!distributeStoreItem || !onDistributeStoreItem) return;
    onDistributeStoreItem(distributeStoreItem, playerId, playerName);
    setDistributeStoreItem(null);
  };

  const handleRemoveStore = async (itemId: string) => {
    if (!removeStoreItem) return;
    try {
      await removeStoreItem(itemId);
    } catch (error) {
      console.error('Failed to remove store item:', error);
    }
  };

  const handleRemoveLoot = async (itemId: string) => {
    if (!removeLootItem) return;
    try {
      await removeLootItem(itemId);
    } catch (error) {
      console.error('Failed to remove loot item:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Store Section - Visible to all */}
      <div className="bg-dark-wood p-4 rounded-lg border border-leather">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medieval text-gold text-lg">Store</h3>
          {isDm && (
            <Button size="sm" onClick={() => setShowAddStore(!showAddStore)}>
              {showAddStore ? 'Cancel' : '+ Add Item'}
            </Button>
          )}
        </div>

        {/* Add Store Item Form (DM only) */}
        {isDm && showAddStore && (
          <div className="mb-4 p-3 bg-leather/30 rounded space-y-2">
            <Input
              placeholder="Item name"
              value={newStoreItem.name}
              onChange={(e) => setNewStoreItem({ ...newStoreItem, name: e.target.value })}
            />
            <div className="flex gap-2">
              <Input
                placeholder="Price (e.g., 50gp)"
                value={newStoreItem.price}
                onChange={(e) => setNewStoreItem({ ...newStoreItem, price: e.target.value })}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="Qty"
                value={newStoreItem.quantity}
                onChange={(e) => setNewStoreItem({ ...newStoreItem, quantity: parseInt(e.target.value) || 1 })}
                className="w-20"
              />
            </div>
            <Input
              placeholder="Effect (e.g., Restores 2d4+2 HP)"
              value={newStoreItem.effect}
              onChange={(e) => setNewStoreItem({ ...newStoreItem, effect: e.target.value })}
            />
            <Input
              placeholder="Description (optional)"
              value={newStoreItem.description}
              onChange={(e) => setNewStoreItem({ ...newStoreItem, description: e.target.value })}
            />
            <Button onClick={handleAddStoreItem} disabled={!newStoreItem.name.trim() || !newStoreItem.price.trim()}>
              Add to Store
            </Button>
          </div>
        )}

        {/* Store Items List */}
        {storeItems.length === 0 ? (
          <p className="text-parchment/50 text-sm text-center py-2">
            No items in store
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
                  {isDm && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => setDistributeStoreItem(item)}
                        className="text-green-400 hover:text-green-300 text-sm px-2 py-1 bg-green-900/50 rounded"
                      >
                        Give
                      </button>
                      <button
                        onClick={() => handleRemoveStore(item.id)}
                        className="text-red-400 hover:text-red-300 text-sm px-2 py-1 bg-red-900/50 rounded"
                      >
                        Remove
                      </button>
                    </div>
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

        {/* Store Distribute Dialog */}
        {distributeStoreItem && (
          <div className="mt-4 p-3 bg-green-900/30 rounded border border-green-600">
            <p className="text-parchment text-sm mb-2">
              Give "{distributeStoreItem.name}" to:
            </p>
            <div className="space-y-2">
              {players.length === 0 ? (
                <p className="text-parchment/50 text-sm">No players connected</p>
              ) : (
                players.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => handleDistributeStore(player.id, player.name)}
                    className="w-full text-left px-3 py-2 bg-leather/30 hover:bg-leather/50 rounded text-parchment"
                  >
                    {player.name}
                  </button>
                ))
              )}
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setDistributeStoreItem(null)}
              className="mt-2"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Loot Section - DM Only */}
      {isDm && (
        <div className="bg-dark-wood p-4 rounded-lg border border-yellow-600">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medieval text-yellow-400 text-lg">Loot Pool (DM Only)</h3>
            <Button size="sm" onClick={() => setShowAddLoot(!showAddLoot)}>
              {showAddLoot ? 'Cancel' : '+ Add Loot'}
            </Button>
          </div>

          {/* Add Loot Item Form */}
          {showAddLoot && (
            <div className="mb-4 p-3 bg-leather/30 rounded space-y-2">
              <Input
                placeholder="Item name"
                value={newLootItem.name}
                onChange={(e) => setNewLootItem({ ...newLootItem, name: e.target.value })}
              />
              <div className="flex gap-2">
                <Input
                  placeholder="Value (e.g., 50gp)"
                  value={newLootItem.value}
                  onChange={(e) => setNewLootItem({ ...newLootItem, value: e.target.value })}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Qty"
                  value={newLootItem.quantity}
                  onChange={(e) => setNewLootItem({ ...newLootItem, quantity: parseInt(e.target.value) || 1 })}
                  className="w-20"
                />
              </div>
              <Input
                placeholder="Source (e.g., Room 3 chest)"
                value={newLootItem.source}
                onChange={(e) => setNewLootItem({ ...newLootItem, source: e.target.value })}
              />
              <Input
                placeholder="Description (optional)"
                value={newLootItem.description}
                onChange={(e) => setNewLootItem({ ...newLootItem, description: e.target.value })}
              />
              <Button onClick={handleAddLootItem} disabled={!newLootItem.name.trim()}>
                Add to Loot Pool
              </Button>
            </div>
          )}

          {/* Loot Items List */}
          {lootItems.length === 0 ? (
            <p className="text-parchment/50 text-sm text-center py-2">
              No unclaimed loot. Add items from treasure or defeated enemies.
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {lootItems.map((item) => (
                <div key={item.id} className={`p-2 rounded border ${
                  item.itemType === 'clue' ? 'bg-amber-900/40 border-amber-600/50' : 'bg-yellow-900/30 border-yellow-700/50'
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <span className="text-parchment font-medium">{item.name}</span>
                      {item.itemType && (
                        <span className={`ml-2 text-xs px-1 rounded ${
                          item.itemType === 'weapon' ? 'bg-red-500/30 text-red-300' :
                          item.itemType === 'armor' ? 'bg-blue-500/30 text-blue-300' :
                          item.itemType === 'potion' ? 'bg-green-500/30 text-green-300' :
                          item.itemType === 'clue' ? 'bg-amber-500/30 text-amber-300' :
                          item.itemType === 'scroll' ? 'bg-purple-500/30 text-purple-300' :
                          item.itemType === 'wondrous' ? 'bg-pink-500/30 text-pink-300' :
                          'bg-gray-500/30 text-gray-300'
                        }`}>
                          {item.itemType}
                        </span>
                      )}
                      {item.attackBonus !== undefined && item.attackBonus > 0 && (
                        <span className="text-green-400 ml-1">+{item.attackBonus > 5 ? item.attackBonus - 5 : item.attackBonus}</span>
                      )}
                      {item.value && <span className="text-gold ml-2">({item.value})</span>}
                      <span className="text-parchment/70 ml-2">x{item.quantity}</span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setDistributeItem({ itemId: item.id, quantity: 1 })}
                        className="text-green-400 hover:text-green-300 text-sm px-2 py-1 bg-green-900/50 rounded"
                      >
                        Give
                      </button>
                      <button
                        onClick={() => handleRemoveLoot(item.id)}
                        className="text-red-400 hover:text-red-300 text-sm px-2 py-1 bg-red-900/50 rounded"
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                  {item.source && (
                    <p className="text-yellow-400/70 text-xs mt-1">From: {item.source}</p>
                  )}
                  {/* Weapon stats */}
                  {item.damage && (
                    <p className="text-red-400 text-sm mt-1">
                      <span className="text-parchment/50">Damage:</span> {item.damage}
                      {item.attackBonus !== undefined && (
                        <span className="ml-2"><span className="text-parchment/50">Attack:</span> +{item.attackBonus}</span>
                      )}
                    </p>
                  )}
                  {/* Armor stats */}
                  {item.armorClass && (
                    <p className="text-blue-400 text-sm mt-1">
                      <span className="text-parchment/50">AC:</span> {item.armorClass}
                      {item.armorType && <span className="ml-1">({item.armorType})</span>}
                    </p>
                  )}
                  {/* Effect for magic items */}
                  {item.effect && (
                    <p className="text-purple-400 text-sm mt-1">{item.effect}</p>
                  )}
                  {/* Always show description for clues, otherwise show if no effect */}
                  {item.itemType === 'clue' && item.description ? (
                    <p className="text-amber-300 text-sm mt-1 italic bg-amber-900/30 p-1 rounded border-l-2 border-amber-500">
                      📜 {item.description}
                    </p>
                  ) : (
                    item.description && !item.effect && (
                      <p className="text-parchment/70 text-sm mt-1">{item.description}</p>
                    )
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Distribute Dialog */}
          {distributeItem && (
            <div className="mt-4 p-3 bg-green-900/30 rounded border border-green-600">
              <p className="text-parchment text-sm mb-2">
                Give "{lootItems.find(l => l.id === distributeItem.itemId)?.name}" to:
              </p>
              <div className="space-y-2">
                {players.length === 0 ? (
                  <p className="text-parchment/50 text-sm">No players connected</p>
                ) : (
                  players.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => handleDistribute(player.id, player.name)}
                      className="w-full text-left px-3 py-2 bg-leather/30 hover:bg-leather/50 rounded text-parchment"
                    >
                      {player.name}
                    </button>
                  ))
                )}
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setDistributeItem(null)}
                className="mt-2"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Player Inventory Section - Show what players have received */}
      {isDm && playerInventories.length > 0 && (
        <div className="bg-dark-wood p-4 rounded-lg border border-blue-600">
          <h3 className="font-medieval text-blue-400 text-lg mb-3">Distributed Items</h3>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {playerInventories.map((item) => (
              <div key={item.id} className="text-sm text-parchment">
                <span className="text-blue-400">{item.playerName}</span>: {item.name} x{item.quantity}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
