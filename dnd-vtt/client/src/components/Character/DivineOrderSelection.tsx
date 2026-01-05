import { DIVINE_ORDER_OPTIONS } from '../../data/dndData';

interface DivineOrderSelectionProps {
  onSelect: (divineOrderId: string) => void;
}

export function DivineOrderSelection({ onSelect }: DivineOrderSelectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medieval text-lg text-gold">Choose Your Divine Order</h3>
        <p className="text-parchment/70 text-sm">
          At 1st level, you make a choice about your role in service to your deity.
          Choose one of the following Divine Orders.
        </p>
      </div>

      <div className="space-y-2">
        {DIVINE_ORDER_OPTIONS.map(order => (
          <button
            key={order.id}
            onClick={() => onSelect(order.id)}
            className="w-full p-4 rounded border border-leather bg-dark-wood hover:border-yellow-500 hover:bg-yellow-900/20 transition-colors text-left"
          >
            <div className="text-yellow-300 font-semibold">{order.name}</div>
            <p className="text-parchment/80 text-sm mt-1">{order.description}</p>
            <div className="mt-2 space-y-1">
              {order.benefits.map((benefit, idx) => (
                <div key={idx} className="text-xs text-parchment/60 flex items-start gap-1">
                  <span className="text-yellow-400">•</span>
                  {benefit}
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
