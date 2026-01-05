import { useState } from 'react';
import { Button } from '../ui/Button';
import { DIVINE_ORDER_OPTIONS, type DivineOrderOption } from '../../data/dndData';

interface DivineOrderSelectionProps {
  onSelect: (divineOrderId: string) => void;
}

export function DivineOrderSelection({ onSelect }: DivineOrderSelectionProps) {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const handleConfirm = () => {
    if (selectedOrder) {
      onSelect(selectedOrder);
    }
  };

  const getSelectedOrder = (): DivineOrderOption | undefined => {
    return DIVINE_ORDER_OPTIONS.find(o => o.id === selectedOrder);
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="font-medieval text-xl text-gold">Divine Order</h3>
        <p className="text-parchment/70 text-sm mt-1">
          Choose your sacred calling as a servant of the divine
        </p>
      </div>

      <div className="p-4 bg-dark-wood rounded border border-leather mb-4">
        <p className="text-parchment/80 text-sm">
          At 1st level, you have dedicated yourself to one of the following sacred roles.
          This choice defines how you channel your deity's power.
        </p>
      </div>

      {/* Divine Order Options */}
      <div className="space-y-3">
        {DIVINE_ORDER_OPTIONS.map(order => {
          const isSelected = selectedOrder === order.id;

          return (
            <div
              key={order.id}
              className={`p-4 rounded border cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-yellow-900/30 border-yellow-500'
                  : 'bg-leather/30 border-leather hover:border-yellow-500/50'
              }`}
              onClick={() => setSelectedOrder(order.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${isSelected ? 'text-yellow-300' : 'text-parchment'}`}>
                      {order.name}
                    </span>
                    {isSelected && (
                      <span className="text-xs bg-yellow-600/50 text-yellow-200 px-2 py-0.5 rounded">
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
                      <span className="text-yellow-400">•</span>
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
      <div className="p-3 bg-yellow-900/20 rounded border border-yellow-500/30">
        <div className="flex justify-between items-center">
          <div className="text-parchment text-sm">
            {selectedOrder
              ? `Chosen: ${getSelectedOrder()?.name}`
              : 'Select a Divine Order to continue'}
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
