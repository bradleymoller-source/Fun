import { useSessionStore } from '../stores/sessionStore';

export function PlayerStorePanel() {
  const { storeItems, playerInventories } = useSessionStore();

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
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {playerInventories.map((item) => (
              <div key={item.id} className="p-2 bg-blue-900/30 rounded border border-blue-700/50">
                <span className="text-parchment font-medium">{item.name}</span>
                <span className="text-parchment/70 ml-2">x{item.quantity}</span>
                {item.description && (
                  <p className="text-parchment/70 text-sm mt-1">{item.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
