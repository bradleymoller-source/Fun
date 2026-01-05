import { PACT_BOONS } from '../../data/dndData';

interface PactBoonSelectionProps {
  onSelect: (pactBoonId: string) => void;
}

export function PactBoonSelection({ onSelect }: PactBoonSelectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medieval text-lg text-gold">Choose Your Pact Boon</h3>
        <p className="text-parchment/70 text-sm">
          At 3rd level, your otherworldly patron bestows a gift upon you for your loyal service.
          Choose one of the following Pact Boons.
        </p>
      </div>

      <div className="space-y-2">
        {PACT_BOONS.map(pact => (
          <button
            key={pact.id}
            onClick={() => onSelect(pact.id)}
            className="w-full p-4 rounded border border-leather bg-dark-wood hover:border-purple-500 hover:bg-purple-900/20 transition-colors text-left"
          >
            <div className="text-purple-300 font-semibold">{pact.name}</div>
            <p className="text-parchment/80 text-sm mt-1">{pact.description}</p>
            <div className="mt-2 space-y-1">
              {pact.features.slice(0, 2).map((feature, idx) => (
                <div key={idx} className="text-xs text-parchment/60 flex items-start gap-1">
                  <span className="text-purple-400">•</span>
                  {feature}
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
