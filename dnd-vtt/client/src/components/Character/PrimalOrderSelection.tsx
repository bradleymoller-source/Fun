import { PRIMAL_ORDER_OPTIONS } from '../../data/dndData';

interface PrimalOrderSelectionProps {
  onSelect: (primalOrderId: string) => void;
}

export function PrimalOrderSelection({ onSelect }: PrimalOrderSelectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medieval text-lg text-gold">Choose Your Primal Order</h3>
        <p className="text-parchment/70 text-sm">
          At 1st level, you choose how you will embody the natural world's power.
          Choose one of the following Primal Orders.
        </p>
      </div>

      <div className="space-y-2">
        {PRIMAL_ORDER_OPTIONS.map(order => (
          <button
            key={order.id}
            onClick={() => onSelect(order.id)}
            className="w-full p-4 rounded border border-leather bg-dark-wood hover:border-green-500 hover:bg-green-900/20 transition-colors text-left"
          >
            <div className="text-green-300 font-semibold">{order.name}</div>
            <p className="text-parchment/80 text-sm mt-1">{order.description}</p>
            <div className="mt-2 space-y-1">
              {order.benefits.map((benefit, idx) => (
                <div key={idx} className="text-xs text-parchment/60 flex items-start gap-1">
                  <span className="text-green-400">•</span>
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
