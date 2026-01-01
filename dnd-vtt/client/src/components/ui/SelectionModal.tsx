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
  // Image
  image?: string;
}

interface SelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  title: string;
  options: SelectionOption[];
  selectedId?: string;
  columns?: number;
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

// Class images from a public D&D art source (silhouettes/icons style)
const CLASS_IMAGES: Record<string, string> = {
  barbarian: 'https://www.dndbeyond.com/avatars/thumbnails/6/342/420/618/617258.png',
  bard: 'https://www.dndbeyond.com/avatars/thumbnails/6/369/420/618/617261.png',
  cleric: 'https://www.dndbeyond.com/avatars/thumbnails/6/371/420/618/617263.png',
  druid: 'https://www.dndbeyond.com/avatars/thumbnails/6/346/420/618/617262.png',
  fighter: 'https://www.dndbeyond.com/avatars/thumbnails/6/359/420/618/617264.png',
  monk: 'https://www.dndbeyond.com/avatars/thumbnails/6/489/420/618/617265.png',
  paladin: 'https://www.dndbeyond.com/avatars/thumbnails/6/365/420/618/617267.png',
  ranger: 'https://www.dndbeyond.com/avatars/thumbnails/6/367/420/618/617268.png',
  rogue: 'https://www.dndbeyond.com/avatars/thumbnails/6/384/420/618/617269.png',
  sorcerer: 'https://www.dndbeyond.com/avatars/thumbnails/6/485/420/618/617270.png',
  warlock: 'https://www.dndbeyond.com/avatars/thumbnails/6/375/420/618/617271.png',
  wizard: 'https://www.dndbeyond.com/avatars/thumbnails/6/357/420/618/617272.png',
};

// Species images
const SPECIES_IMAGES: Record<string, string> = {
  human: 'https://www.dndbeyond.com/avatars/thumbnails/6/258/420/618/617974.png',
  elf: 'https://www.dndbeyond.com/avatars/thumbnails/7/639/420/618/617976.png',
  dwarf: 'https://www.dndbeyond.com/avatars/thumbnails/6/254/420/618/617973.png',
  halfling: 'https://www.dndbeyond.com/avatars/thumbnails/6/256/420/618/617979.png',
  gnome: 'https://www.dndbeyond.com/avatars/thumbnails/6/334/420/618/617978.png',
  halfOrc: 'https://www.dndbeyond.com/avatars/thumbnails/6/466/420/618/617980.png',
  tiefling: 'https://www.dndbeyond.com/avatars/thumbnails/7/641/420/618/617982.png',
  dragonborn: 'https://www.dndbeyond.com/avatars/thumbnails/6/340/420/618/617975.png',
  aasimar: 'https://www.dndbeyond.com/avatars/thumbnails/7/623/420/618/617969.png',
  goliath: 'https://www.dndbeyond.com/avatars/thumbnails/7/620/420/618/617977.png',
  orc: 'https://www.dndbeyond.com/avatars/thumbnails/6/466/420/618/617980.png',
};

export function SelectionModal({
  isOpen,
  onClose,
  onSelect,
  title,
  options,
  selectedId,
}: SelectionModalProps) {
  const initialIndex = selectedId ? options.findIndex(o => o.id === selectedId) : 0;
  const [currentIndex, setCurrentIndex] = useState(Math.max(0, initialIndex));
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const minSwipeDistance = 50;

  useEffect(() => {
    if (isOpen) {
      const idx = selectedId ? options.findIndex(o => o.id === selectedId) : 0;
      setCurrentIndex(Math.max(0, idx));
      setDragOffset(0);
    }
  }, [isOpen, selectedId, options]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') navigateTo(currentIndex - 1);
      if (e.key === 'ArrowRight') navigateTo(currentIndex + 1);
      if (e.key === 'Enter') handleSelect();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, currentIndex]);

  if (!isOpen || options.length === 0) return null;

  const currentOption = options[currentIndex];
  const isSelected = currentOption.id === selectedId;

  const navigateTo = (index: number) => {
    if (isAnimating) return;
    const newIndex = (index + options.length) % options.length;
    setIsAnimating(true);
    setCurrentIndex(newIndex);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleSelect = () => {
    onSelect(currentOption.id);
    onClose();
  };

  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!touchStart) return;
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);
    setDragOffset(currentTouch - touchStart);
  };

  const onTouchEnd = () => {
    setIsDragging(false);
    if (!touchStart || !touchEnd) {
      setDragOffset(0);
      return;
    }

    const distance = touchStart - touchEnd;
    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) {
        navigateTo(currentIndex + 1);
      } else {
        navigateTo(currentIndex - 1);
      }
    }
    setDragOffset(0);
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Get image for the option
  const getImage = (option: SelectionOption): string | undefined => {
    if (option.image) return option.image;
    // Check if it's a class
    if (CLASS_IMAGES[option.id]) return CLASS_IMAGES[option.id];
    // Check if it's a species
    if (SPECIES_IMAGES[option.id]) return SPECIES_IMAGES[option.id];
    return undefined;
  };

  const image = getImage(currentOption);
  const colorClass = currentOption.color || 'amber';

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black" />

      {/* Full Screen Container */}
      <div
        ref={containerRef}
        className="relative w-full h-full flex flex-col"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Header - Minimal */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gold">{title}</h2>
            <span className="text-parchment/50 text-sm">{currentIndex + 1}/{options.length}</span>
          </div>
          <button
            onClick={onClose}
            className="text-parchment/60 hover:text-parchment text-2xl w-10 h-10 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Card Area */}
        <div
          className="flex-1 flex items-center justify-center overflow-hidden"
          style={{
            transform: isDragging ? `translateX(${dragOffset}px)` : 'translateX(0)',
            transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          }}
        >
          {/* Previous Card Preview */}
          <div
            className="absolute left-0 w-16 h-full flex items-center justify-center cursor-pointer z-10"
            onClick={() => navigateTo(currentIndex - 1)}
          >
            <span className="text-gold/40 hover:text-gold/80 text-5xl transition-colors">‹</span>
          </div>

          {/* Main Card - Full Screen */}
          <div
            className={`
              w-full h-full
              flex flex-col
              bg-gradient-to-b from-dark-wood via-leather to-dark-wood
            `}
          >
            {/* Image Section */}
            {image && (
              <div className="relative h-48 sm:h-64 flex-shrink-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-dark-wood z-10" />
                <img
                  src={image}
                  alt={currentOption.name}
                  className="w-full h-full object-cover object-top opacity-80"
                />
                {/* Overlay gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br from-${colorClass}-900/40 to-transparent`} />
              </div>
            )}

            {/* Content */}
            <div className={`flex-1 flex flex-col overflow-hidden ${image ? '-mt-12 relative z-20' : 'pt-16'}`}>
              {/* Title & Badges */}
              <div className="px-5 pt-4 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-3xl font-bold text-gold">{currentOption.name}</h3>
                      {isSelected && <span className="text-gold text-2xl">✓</span>}
                    </div>

                    {/* Inline Stats Row */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {currentOption.hitDie && (
                        <span className="text-parchment/70 text-sm bg-black/30 px-2 py-0.5 rounded">
                          d{currentOption.hitDie}
                        </span>
                      )}
                      {currentOption.keyStats && (
                        <span className="text-parchment/70 text-sm bg-black/30 px-2 py-0.5 rounded">
                          {currentOption.keyStats}
                        </span>
                      )}
                      {currentOption.complexity && (
                        <span className={`${complexityColors[currentOption.complexity].text} text-sm bg-black/30 px-2 py-0.5 rounded`}>
                          {currentOption.complexity}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Role Badges */}
                {currentOption.roles && currentOption.roles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {currentOption.roles.map(role => (
                      <span
                        key={role}
                        className={`${roleColors[role] || 'bg-gray-600'} text-white text-sm px-3 py-1 rounded-full font-medium`}
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                )}

                {/* Power type for feats */}
                {currentOption.power && (
                  <div className="flex gap-2 mt-3">
                    <span className={`${powerColors[currentOption.power]} text-white text-sm px-3 py-1 rounded-full font-medium`}>
                      {currentOption.power}
                    </span>
                  </div>
                )}
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-5 pb-4">
                {/* Main Description */}
                {(currentOption.playstyle || currentOption.summary || currentOption.flavor) && (
                  <p className="text-parchment text-base leading-relaxed mb-4">
                    {currentOption.playstyle || currentOption.summary || currentOption.flavor}
                  </p>
                )}

                {/* Theme */}
                {currentOption.theme && (
                  <div className="mb-3">
                    <span className="text-gold/80 text-sm">Theme: </span>
                    <span className="text-parchment/90">{currentOption.theme}</span>
                  </div>
                )}

                {/* Traits */}
                {currentOption.traits && (
                  <div className="mb-3">
                    <span className="text-gold/80 text-sm">Traits: </span>
                    <span className="text-parchment/90">{currentOption.traits}</span>
                  </div>
                )}

                {/* Good For */}
                {(currentOption.bestFor || currentOption.goodFor) && (
                  <div className="mb-3">
                    <span className="text-gold/80 text-sm">Great for: </span>
                    <span className="text-parchment/90">
                      {Array.isArray(currentOption.bestFor) ? currentOption.bestFor.join(', ') :
                       Array.isArray(currentOption.goodFor) ? currentOption.goodFor.join(', ') :
                       currentOption.goodFor}
                    </span>
                  </div>
                )}

                {/* Extra info as compact list */}
                {currentOption.extra && Object.entries(currentOption.extra).map(([key, value]) => (
                  <div key={key} className="mb-2">
                    <span className="text-gold/80 text-sm">{key}: </span>
                    <span className="text-parchment/90">{value}</span>
                  </div>
                ))}

                {/* Description fallback */}
                {currentOption.description && !currentOption.playstyle && !currentOption.summary && !currentOption.flavor && (
                  <p className="text-parchment/80">{currentOption.description}</p>
                )}
              </div>

              {/* Select Button - Fixed at bottom */}
              <div className="px-5 pb-5 pt-2 bg-gradient-to-t from-dark-wood to-transparent">
                <button
                  onClick={handleSelect}
                  className={`
                    w-full py-4 rounded-xl font-bold text-lg transition-all
                    ${isSelected
                      ? 'bg-gold/20 text-gold border-2 border-gold'
                      : 'bg-gold text-dark-wood hover:bg-gold/90 active:scale-98'
                    }
                  `}
                >
                  {isSelected ? '✓ Currently Selected' : 'Select ' + currentOption.name}
                </button>
              </div>
            </div>
          </div>

          {/* Next Card Preview */}
          <div
            className="absolute right-0 w-16 h-full flex items-center justify-center cursor-pointer z-10"
            onClick={() => navigateTo(currentIndex + 1)}
          >
            <span className="text-gold/40 hover:text-gold/80 text-5xl transition-colors">›</span>
          </div>
        </div>

        {/* Bottom Navigation Dots */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-20">
          {options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => navigateTo(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentIndex
                  ? 'bg-gold w-8'
                  : opt.id === selectedId
                  ? 'bg-gold/60 w-2'
                  : 'bg-parchment/30 hover:bg-parchment/50 w-2'
              }`}
            />
          ))}
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
