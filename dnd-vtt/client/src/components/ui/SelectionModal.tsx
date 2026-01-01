import { useState, useEffect, useRef } from 'react';
import type { TouchEvent } from 'react';

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
  // Image (optional)
  image?: string;
}

interface SelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  title: string;
  options: SelectionOption[];
  selectedId?: string;
  columns?: number; // Ignored in new design, kept for compatibility
}

const roleColors: Record<string, string> = {
  Tank: 'bg-blue-600',
  Damage: 'bg-red-600',
  Healer: 'bg-green-600',
  Support: 'bg-yellow-600',
  Controller: 'bg-purple-600',
  Utility: 'bg-cyan-600',
};

const complexityColors: Record<string, { bg: string; text: string }> = {
  Beginner: { bg: 'bg-green-900/50', text: 'text-green-400' },
  Intermediate: { bg: 'bg-yellow-900/50', text: 'text-yellow-400' },
  Advanced: { bg: 'bg-red-900/50', text: 'text-red-400' },
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
}: SelectionModalProps) {
  // Find initial index based on selectedId
  const initialIndex = selectedId ? options.findIndex(o => o.id === selectedId) : 0;
  const [currentIndex, setCurrentIndex] = useState(Math.max(0, initialIndex));
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Minimum swipe distance
  const minSwipeDistance = 50;

  // Reset index when modal opens or options change
  useEffect(() => {
    if (isOpen) {
      const idx = selectedId ? options.findIndex(o => o.id === selectedId) : 0;
      setCurrentIndex(Math.max(0, idx));
    }
  }, [isOpen, selectedId, options]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'Enter') handleSelect();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, currentIndex]);

  if (!isOpen || options.length === 0) return null;

  const currentOption = options[currentIndex];
  const isSelected = currentOption.id === selectedId;

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % options.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + options.length) % options.length);
  };

  const handleSelect = () => {
    onSelect(currentOption.id);
    onClose();
  };

  // Touch handlers for swipe
  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
  };

  const colorClass = currentOption.color || 'amber';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        ref={containerRef}
        className="relative w-full h-full flex flex-col"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 z-10">
          <h2 className="text-xl font-bold text-gold">{title}</h2>
          <button
            onClick={onClose}
            className="text-parchment/60 hover:text-parchment text-3xl leading-none w-10 h-10 flex items-center justify-center"
          >
            &times;
          </button>
        </div>

        {/* Navigation Dots */}
        <div className="flex justify-center gap-1.5 px-4 pb-2 z-10">
          {options.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex
                  ? 'bg-gold w-6'
                  : options[idx].id === selectedId
                  ? 'bg-gold/60'
                  : 'bg-parchment/30 hover:bg-parchment/50'
              }`}
            />
          ))}
        </div>

        {/* Card Container */}
        <div className="flex-1 flex items-center justify-center px-4 pb-4 overflow-hidden">
          {/* Previous Arrow */}
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center text-gold/60 hover:text-gold text-4xl"
          >
            ‹
          </button>

          {/* Card */}
          <div
            className={`
              w-full max-w-md h-full max-h-[70vh]
              bg-gradient-to-b from-dark-wood to-leather
              border-4 rounded-xl overflow-hidden
              flex flex-col
              transition-all duration-200
              ${isSelected ? 'border-gold shadow-[0_0_20px_rgba(218,165,32,0.4)]' : `border-${colorClass}-500/50`}
            `}
          >
            {/* Card Header */}
            <div className={`p-4 bg-${colorClass}-900/30 border-b border-${colorClass}-500/30`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-2xl font-bold text-gold">{currentOption.name}</h3>
                  {currentOption.hitDie && (
                    <span className="text-parchment/60 text-sm">Hit Die: d{currentOption.hitDie}</span>
                  )}
                </div>
                {isSelected && (
                  <span className="text-gold text-2xl">✓</span>
                )}
              </div>

              {/* Roles */}
              {currentOption.roles && currentOption.roles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {currentOption.roles.map(role => (
                    <span
                      key={role}
                      className={`${roleColors[role] || 'bg-gray-600'} text-white text-sm px-2 py-1 rounded font-medium`}
                    >
                      {role}
                    </span>
                  ))}
                  {currentOption.complexity && (
                    <span className={`${complexityColors[currentOption.complexity].bg} ${complexityColors[currentOption.complexity].text} text-sm px-2 py-1 rounded border border-current`}>
                      {currentOption.complexity}
                    </span>
                  )}
                </div>
              )}

              {/* Power type for feats */}
              {currentOption.power && (
                <div className="flex gap-1.5 mt-2">
                  <span className={`${powerColors[currentOption.power]} text-white text-sm px-2 py-1 rounded font-medium`}>
                    {currentOption.power}
                  </span>
                </div>
              )}
            </div>

            {/* Card Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Playstyle / Summary / Flavor */}
              {(currentOption.playstyle || currentOption.summary || currentOption.flavor) && (
                <div>
                  <p className="text-parchment text-base leading-relaxed">
                    {currentOption.playstyle || currentOption.summary || currentOption.flavor}
                  </p>
                </div>
              )}

              {/* Theme (for backgrounds) */}
              {currentOption.theme && (
                <div className="bg-black/20 rounded p-3">
                  <span className="text-gold text-sm font-semibold">Theme</span>
                  <p className="text-parchment/90 mt-1">{currentOption.theme}</p>
                </div>
              )}

              {/* Description */}
              {currentOption.description && !currentOption.playstyle && !currentOption.summary && (
                <div>
                  <p className="text-parchment/80">{currentOption.description}</p>
                </div>
              )}

              {/* Key Stats */}
              {currentOption.keyStats && (
                <div className="bg-black/20 rounded p-3">
                  <span className="text-gold text-sm font-semibold">Key Stats</span>
                  <p className="text-parchment text-lg font-medium mt-1">{currentOption.keyStats}</p>
                </div>
              )}

              {/* Traits (for species) */}
              {currentOption.traits && (
                <div className="bg-black/20 rounded p-3">
                  <span className="text-gold text-sm font-semibold">Key Traits</span>
                  <p className="text-parchment/90 mt-1">{currentOption.traits}</p>
                </div>
              )}

              {/* Best For / Good For */}
              {(currentOption.bestFor || currentOption.goodFor) && (
                <div className="bg-black/20 rounded p-3">
                  <span className="text-gold text-sm font-semibold">Great For</span>
                  <p className="text-parchment/90 mt-1">
                    {Array.isArray(currentOption.bestFor) ? currentOption.bestFor.join(', ') :
                     Array.isArray(currentOption.goodFor) ? currentOption.goodFor.join(', ') :
                     currentOption.goodFor}
                  </p>
                </div>
              )}

              {/* Extra info */}
              {currentOption.extra && Object.entries(currentOption.extra).map(([key, value]) => (
                <div key={key} className="bg-black/20 rounded p-3">
                  <span className="text-gold text-sm font-semibold">{key}</span>
                  <p className="text-parchment/90 mt-1">{value}</p>
                </div>
              ))}
            </div>

            {/* Card Footer */}
            <div className="p-4 border-t border-gold/20 bg-black/20">
              <button
                onClick={handleSelect}
                className={`
                  w-full py-3 rounded-lg font-bold text-lg transition-all
                  ${isSelected
                    ? 'bg-gold/20 text-gold border-2 border-gold'
                    : 'bg-gold text-dark-wood hover:bg-gold/90'
                  }
                `}
              >
                {isSelected ? '✓ Selected' : 'Select'}
              </button>
            </div>
          </div>

          {/* Next Arrow */}
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center text-gold/60 hover:text-gold text-4xl"
          >
            ›
          </button>
        </div>

        {/* Footer Counter */}
        <div className="text-center pb-4 text-parchment/60">
          {currentIndex + 1} of {options.length}
          <span className="text-parchment/40 ml-2">• Swipe or use arrows</span>
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
