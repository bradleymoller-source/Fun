import { useState } from 'react';
import { Button } from '../ui/Button';
import { PRIMAL_ORDER_OPTIONS, type PrimalOrderOption } from '../../data/dndData';

interface PrimalOrderSelectionProps {
  onSelect: (primalOrderId: string) => void;
}

export function PrimalOrderSelection({ onSelect }: PrimalOrderSelectionProps) {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const handleConfirm = () => {
    if (selectedOrder) {
      onSelect(selectedOrder);
    }
  };

  const getSelectedOrder = (): PrimalOrderOption | undefined => {
    return PRIMAL_ORDER_OPTIONS.find(o => o.id === selectedOrder);
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="font-medieval text-xl text-gold">Primal Order</h3>
        <p className="text-parchment/70 text-sm mt-1">
          Choose how you connect with the primal forces of nature
        </p>
      </div>

      <div className="p-4 bg-dark-wood rounded border border-leather mb-4">
        <p className="text-parchment/80 text-sm">
          At 1st level, you align yourself with one of the following primal orders.
          This shapes how you interact with the natural world and its magic.
        </p>
      </div>

      {/* Primal Order Options */}
      <div className="space-y-3">
        {PRIMAL_ORDER_OPTIONS.map(order => {
          const isSelected = selectedOrder === order.id;

          return (
            <div
              key={order.id}
              className={`p-4 rounded border cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-green-900/30 border-green-500'
                  : 'bg-leather/30 border-leather hover:border-green-500/50'
              }`}
              onClick={() => setSelectedOrder(order.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${isSelected ? 'text-green-300' : 'text-parchment'}`}>
                      {order.name}
                    </span>
                    {isSelected && (
                      <span className="text-xs bg-green-600/50 text-green-200 px-2 py-0.5 rounded">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-parchment/70 text-sm mt-1">{order.description}</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-leather/50">
                <div className="text-parchment/60 text-xs font-semibold mb-2">Benefits:</div>
                <ul className="space-y-1">
                  {order.benefits.map((benefit, idx) => (
                    <li key={idx} className="text-parchment/70 text-sm flex items-start gap-2">
                      <span className="text-green-400">•</span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm */}
      <div className="p-3 bg-green-900/20 rounded border border-green-500/30">
        <div className="flex justify-between items-center">
          <div className="text-parchment text-sm">
            {selectedOrder
              ? `Chosen: ${getSelectedOrder()?.name}`
              : 'Select a Primal Order to continue'}
          </div>
          <Button
            onClick={handleConfirm}
            disabled={!selectedOrder}
            variant="primary"
            size="sm"
          >
            Confirm Order
          </Button>
        </div>
      </div>
    </div>
  );
}
