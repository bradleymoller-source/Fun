import { useState, useEffect } from 'react';

export interface SelectionOption {
  id: string;
  name: string;
  description?: string;
  // Role info fields
  roles?: string[];
  playstyle?: string;
  keyStats?: string;
  complexity?: 'Beginner' | 'Intermediate' | 'Advanced';
  goodFor?: string | string[];
  traits?: string;
  bestFor?: string[];
  flavor?: string;
  theme?: string;
  summary?: string;
  power?: 'Combat' | 'Utility' | 'Versatile';
  color?: string;
  // Extra info
  hitDie?: number;
  extra?: Record<string, string | number>;
}

interface SelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  title: string;
  options: SelectionOption[];
  selectedId?: string;
  columns?: 1 | 2 | 3;
}

const roleColors: Record<string, string> = {
  Tank: 'bg-blue-600',
  Damage: 'bg-red-600',
  Healer: 'bg-green-600',
  Support: 'bg-yellow-600',
  Controller: 'bg-purple-600',
  Utility: 'bg-cyan-600',
};

const complexityColors: Record<string, string> = {
  Beginner: 'text-green-400 border-green-400',
  Intermediate: 'text-yellow-400 border-yellow-400',
  Advanced: 'text-red-400 border-red-400',
};

const powerColors: Record<string, string> = {
  Combat: 'bg-red-600',
  Utility: 'bg-blue-600',
  Versatile: 'bg-purple-600',
};

export function SelectionModal({
  isOpen,
  onClose,
  onSelect,
  title,
  options,
  selectedId,
  columns = 2,
}: SelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Reset search when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredOptions = options.filter(opt =>
    opt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opt.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opt.playstyle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opt.roles?.some(r => r.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelect = (id: string) => {
    onSelect(id);
    onClose();
  };

  const gridCols = columns === 1 ? 'grid-cols-1' : columns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-gradient-to-b from-leather to-dark-wood border-4 border-gold rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gold/30">
          <h2 className="text-xl font-bold text-gold">{title}</h2>
          <button
            onClick={onClose}
            className="text-parchment/60 hover:text-parchment text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Search */}
        {options.length > 6 && (
          <div className="p-3 border-b border-gold/20">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-dark-wood/50 text-parchment px-3 py-2 rounded border border-leather focus:border-gold focus:outline-none"
              autoFocus
            />
          </div>
        )}

        {/* Options Grid */}
        <div className={`flex-1 overflow-y-auto p-3 sm:p-4 grid ${gridCols} gap-3`}>
          {filteredOptions.map((option) => {
            const isSelected = option.id === selectedId;
            const colorClass = option.color || 'amber';

            return (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className={`
                  text-left p-3 rounded-lg border-2 transition-all
                  ${isSelected
                    ? `border-gold bg-gold/20 ring-2 ring-gold/50`
                    : `border-${colorClass}-500/30 bg-${colorClass}-900/20 hover:border-${colorClass}-400 hover:bg-${colorClass}-900/30`
                  }
                `}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-bold ${isSelected ? 'text-gold' : 'text-parchment'}`}>
                      {option.name}
                    </span>
                    {option.hitDie && (
                      <span className="text-xs text-parchment/60">(d{option.hitDie})</span>
                    )}
                  </div>
                  {isSelected && (
                    <span className="text-gold text-sm">✓</span>
                  )}
                </div>

                {/* Roles */}
                {option.roles && option.roles.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1">
                    {option.roles.map(role => (
                      <span
                        key={role}
                        className={`${roleColors[role] || 'bg-gray-600'} text-white text-xs px-1.5 py-0.5 rounded font-medium`}
                      >
                        {role}
                      </span>
                    ))}
                    {option.complexity && (
                      <span className={`${complexityColors[option.complexity]} text-xs px-1.5 py-0.5 rounded border`}>
                        {option.complexity}
                      </span>
                    )}
                  </div>
                )}

                {/* Power type for feats */}
                {option.power && (
                  <div className="flex gap-1 mb-1">
                    <span className={`${powerColors[option.power]} text-white text-xs px-1.5 py-0.5 rounded font-medium`}>
                      {option.power}
                    </span>
                  </div>
                )}

                {/* Playstyle / Summary / Flavor */}
                {(option.playstyle || option.summary || option.flavor) && (
                  <p className="text-parchment/80 text-xs mb-1">
                    {option.playstyle || option.summary || option.flavor}
                  </p>
                )}

                {/* Theme (for backgrounds) */}
                {option.theme && (
                  <p className="text-parchment/70 text-xs mb-1 italic">
                    {option.theme}
                  </p>
                )}

                {/* Key Stats */}
                {option.keyStats && (
                  <div className="text-xs">
                    <span className="text-gold/80">Stats: </span>
                    <span className="text-parchment/70">{option.keyStats}</span>
                  </div>
                )}

                {/* Traits (for species) */}
                {option.traits && (
                  <div className="text-xs">
                    <span className="text-gold/80">Traits: </span>
                    <span className="text-parchment/70">{option.traits}</span>
                  </div>
                )}

                {/* Best For / Good For */}
                {(option.bestFor || option.goodFor) && (
                  <div className="text-xs mt-0.5">
                    <span className="text-gold/80">Good for: </span>
                    <span className="text-parchment/70">
                      {Array.isArray(option.bestFor) ? option.bestFor.join(', ') :
                       Array.isArray(option.goodFor) ? option.goodFor.join(', ') :
                       option.goodFor}
                    </span>
                  </div>
                )}

                {/* Extra info */}
                {option.extra && Object.entries(option.extra).map(([key, value]) => (
                  <div key={key} className="text-xs mt-0.5">
                    <span className="text-gold/80">{key}: </span>
                    <span className="text-parchment/70">{value}</span>
                  </div>
                ))}
              </button>
            );
          })}

          {filteredOptions.length === 0 && (
            <div className="col-span-full text-center text-parchment/60 py-8">
              No options match your search
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gold/30 flex justify-between items-center">
          <span className="text-parchment/60 text-sm">
            {filteredOptions.length} option{filteredOptions.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-leather hover:bg-leather/80 text-parchment rounded border border-gold/30"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper component for the trigger button
interface SelectionButtonProps {
  value: string;
  displayValue?: string;
  onClick: () => void;
  placeholder?: string;
  className?: string;
}

export function SelectionButton({
  value,
  displayValue,
  onClick,
  placeholder = 'Select...',
  className = '',
}: SelectionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full bg-parchment text-dark-wood px-3 py-2 rounded
        flex items-center justify-between
        focus:outline-none focus:ring-2 focus:ring-gold
        hover:bg-parchment/90 transition-colors
        ${className}
      `}
    >
      <span className={value ? '' : 'text-dark-wood/50'}>
        {displayValue || value || placeholder}
      </span>
      <span className="text-dark-wood/60">▼</span>
    </button>
  );
}
