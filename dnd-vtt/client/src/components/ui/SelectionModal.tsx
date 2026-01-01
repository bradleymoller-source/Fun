import { useState, useEffect, useRef } from 'react';
import type { TouchEvent } from 'react';

export interface DetailedItem {
  name: string;
  description: string;
}

export interface SelectionOption {
  id: string;
  name: string;
  description?: string;
  roles?: string[];
  playstyle?: string;
  keyStats?: string;
  complexity?: 'Beginner' | 'Intermediate' | 'Advanced';
  goodFor?: string | string[];
  traits?: string;
  traitsList?: string[]; // Full trait descriptions for species
  bestFor?: string[];
  flavor?: string;
  theme?: string;
  summary?: string;
  power?: 'Combat' | 'Utility' | 'Versatile';
  color?: string;
  hitDie?: number;
  extra?: Record<string, string | number>;
  image?: string;
  skills?: DetailedItem[]; // Skills with descriptions for backgrounds
  featInfo?: { name: string; description: string; benefits: string[] }; // Full feat info for backgrounds
  toolProficiency?: string; // Tool proficiency for backgrounds
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

const complexityColors: Record<string, string> = {
  Beginner: 'text-green-400',
  Intermediate: 'text-yellow-400',
  Advanced: 'text-red-400',
};

const powerColors: Record<string, string> = {
  Combat: 'bg-red-600',
  Utility: 'bg-blue-600',
  Versatile: 'bg-purple-600',
};

// Color backgrounds for cards based on class/type
const cardGradients: Record<string, string> = {
  barbarian: 'from-red-900 to-red-950',
  bard: 'from-pink-900 to-pink-950',
  cleric: 'from-yellow-900 to-yellow-950',
  druid: 'from-green-900 to-green-950',
  fighter: 'from-orange-900 to-orange-950',
  monk: 'from-cyan-900 to-cyan-950',
  paladin: 'from-amber-800 to-amber-950',
  ranger: 'from-emerald-900 to-emerald-950',
  rogue: 'from-stone-800 to-stone-950',
  sorcerer: 'from-red-800 to-purple-950',
  warlock: 'from-purple-900 to-purple-950',
  wizard: 'from-blue-900 to-blue-950',
  // Species
  human: 'from-amber-800 to-amber-950',
  elf: 'from-emerald-800 to-emerald-950',
  dwarf: 'from-orange-800 to-orange-950',
  halfling: 'from-lime-800 to-lime-950',
  gnome: 'from-pink-800 to-pink-950',
  tiefling: 'from-rose-900 to-rose-950',
  dragonborn: 'from-cyan-800 to-cyan-950',
  aasimar: 'from-yellow-700 to-yellow-950',
  goliath: 'from-stone-700 to-stone-950',
  orc: 'from-green-800 to-green-950',
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
  const [dragOffset, setDragOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const CARD_WIDTH = 85; // percentage of viewport
  const CARD_GAP = 3; // percentage gap between cards

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

  const navigateTo = (index: number) => {
    if (isTransitioning) return;
    const newIndex = Math.max(0, Math.min(options.length - 1, index));
    if (newIndex !== currentIndex) {
      setIsTransitioning(true);
      setCurrentIndex(newIndex);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  const handleSelect = () => {
    onSelect(options[currentIndex].id);
    onClose();
  };

  const onTouchStart = (e: TouchEvent) => {
    if (isTransitioning) return;
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!touchStart || isTransitioning) return;
    const currentTouch = e.targetTouches[0].clientX;
    const diff = currentTouch - touchStart;
    // Limit drag at edges
    if ((currentIndex === 0 && diff > 0) || (currentIndex === options.length - 1 && diff < 0)) {
      setDragOffset(diff * 0.3); // Resistance at edges
    } else {
      setDragOffset(diff);
    }
  };

  const onTouchEnd = () => {
    if (!touchStart) return;
    const threshold = window.innerWidth * 0.15;

    if (dragOffset < -threshold && currentIndex < options.length - 1) {
      navigateTo(currentIndex + 1);
    } else if (dragOffset > threshold && currentIndex > 0) {
      navigateTo(currentIndex - 1);
    }

    setDragOffset(0);
    setTouchStart(null);
  };

  // Calculate the transform for the carousel
  const getCarouselTransform = () => {
    const cardWidthWithGap = CARD_WIDTH + CARD_GAP;
    const baseOffset = -currentIndex * cardWidthWithGap;
    const dragPercent = (dragOffset / window.innerWidth) * 100;
    return `translateX(calc(${baseOffset}% + ${dragPercent}% + ${(100 - CARD_WIDTH) / 2}%))`;
  };

  const renderCard = (option: SelectionOption, index: number) => {
    const isActive = index === currentIndex;
    const isSelected = option.id === selectedId;
    const gradient = cardGradients[option.id] || 'from-leather to-dark-wood';

    return (
      <div
        key={option.id}
        className={`
          flex-shrink-0 h-full
          transition-all duration-300
          ${isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-60'}
        `}
        style={{ width: `${CARD_WIDTH}%`, marginRight: `${CARD_GAP}%` }}
      >
        <div
          className={`
            h-full rounded-2xl overflow-hidden
            bg-gradient-to-b ${gradient}
            border-2 ${isSelected ? 'border-gold shadow-[0_0_30px_rgba(218,165,32,0.5)]' : 'border-white/10'}
            flex flex-col
          `}
        >
          {/* Card Header with Icon/Symbol */}
          <div className="relative h-32 sm:h-40 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-black/20" />
            <span className="text-8xl sm:text-9xl opacity-30 select-none">
              {getClassIcon(option.id)}
            </span>
            {isSelected && (
              <div className="absolute top-3 right-3 bg-gold text-dark-wood rounded-full w-8 h-8 flex items-center justify-center font-bold">
                ✓
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            {/* Title */}
            <h3 className="text-2xl sm:text-3xl font-bold text-gold mb-2">{option.name}</h3>

            {/* Stats Row */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {option.hitDie && (
                <span className="text-parchment/80 text-sm bg-black/30 px-2 py-1 rounded">
                  d{option.hitDie}
                </span>
              )}
              {option.keyStats && (
                <span className="text-parchment/80 text-sm bg-black/30 px-2 py-1 rounded">
                  {option.keyStats}
                </span>
              )}
              {option.complexity && (
                <span className={`${complexityColors[option.complexity]} text-sm bg-black/30 px-2 py-1 rounded`}>
                  {option.complexity}
                </span>
              )}
            </div>

            {/* Role Badges */}
            {option.roles && option.roles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {option.roles.map(role => (
                  <span
                    key={role}
                    className={`${roleColors[role]} text-white text-sm px-3 py-1 rounded-full font-medium`}
                  >
                    {role}
                  </span>
                ))}
              </div>
            )}

            {/* Power type for feats */}
            {option.power && (
              <div className="flex gap-2 mb-3">
                <span className={`${powerColors[option.power]} text-white text-sm px-3 py-1 rounded-full font-medium`}>
                  {option.power}
                </span>
              </div>
            )}

            {/* Scrollable Description */}
            <div className="flex-1 overflow-y-auto space-y-3 text-sm">
              {(option.playstyle || option.summary || option.flavor) && (
                <p className="text-parchment leading-relaxed">
                  {option.playstyle || option.summary || option.flavor}
                </p>
              )}

              {option.theme && (
                <p className="text-parchment/80">
                  <span className="text-gold/80">Theme: </span>{option.theme}
                </p>
              )}

              {/* Full traits list for species */}
              {option.traitsList && option.traitsList.length > 0 && (
                <div className="space-y-1">
                  <span className="text-gold font-semibold">Racial Traits:</span>
                  {option.traitsList.map((trait, idx) => (
                    <div key={idx} className="text-parchment/90 pl-2 border-l border-gold/30">
                      {trait}
                    </div>
                  ))}
                </div>
              )}

              {/* Skills with descriptions for backgrounds */}
              {option.skills && option.skills.length > 0 && (
                <div className="space-y-1">
                  <span className="text-gold font-semibold">Skill Proficiencies:</span>
                  {option.skills.map((skill, idx) => (
                    <div key={idx} className="pl-2 border-l border-gold/30">
                      <span className="text-parchment font-medium">{skill.name}</span>
                      <span className="text-parchment/70"> — {skill.description}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tool proficiency for backgrounds */}
              {option.toolProficiency && (
                <p className="text-parchment/80">
                  <span className="text-gold/80">Tool: </span>{option.toolProficiency}
                </p>
              )}

              {/* Full feat info for backgrounds */}
              {option.featInfo && (
                <div className="space-y-1 bg-black/20 rounded-lg p-2">
                  <div className="text-gold font-semibold">Origin Feat: {option.featInfo.name}</div>
                  <p className="text-parchment/80 text-xs">{option.featInfo.description}</p>
                  <div className="space-y-0.5">
                    {option.featInfo.benefits.map((benefit, idx) => (
                      <div key={idx} className="text-parchment/90 text-xs pl-2 flex gap-1">
                        <span className="text-gold">•</span>
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {option.traits && !option.traitsList && (
                <p className="text-parchment/80">
                  <span className="text-gold/80">Traits: </span>{option.traits}
                </p>
              )}

              {(option.bestFor || option.goodFor) && (
                <p className="text-parchment/80">
                  <span className="text-gold/80">Great for: </span>
                  {Array.isArray(option.bestFor) ? option.bestFor.join(', ') :
                   Array.isArray(option.goodFor) ? option.goodFor.join(', ') :
                   option.goodFor}
                </p>
              )}

              {option.extra && Object.entries(option.extra).map(([key, value]) => (
                <p key={key} className="text-parchment/80">
                  <span className="text-gold/80">{key}: </span>{value}
                </p>
              ))}
            </div>
          </div>

          {/* Select Button */}
          <div className="p-4 pt-2">
            <button
              onClick={handleSelect}
              className={`
                w-full py-3 rounded-xl font-bold text-base transition-all
                ${isSelected
                  ? 'bg-gold/20 text-gold border-2 border-gold'
                  : 'bg-gold text-dark-wood hover:bg-gold/90 active:scale-[0.98]'
                }
              `}
            >
              {isSelected ? '✓ Selected' : 'Select'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black to-transparent">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-gold">{title}</h2>
          <span className="text-parchment/50 text-sm">{currentIndex + 1} of {options.length}</span>
        </div>
        <button
          onClick={onClose}
          className="text-parchment/60 hover:text-parchment text-2xl w-10 h-10 flex items-center justify-center rounded-full bg-white/10"
        >
          ✕
        </button>
      </div>

      {/* Carousel Container */}
      <div
        ref={containerRef}
        className="absolute inset-0 pt-14 pb-16 overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Cards Track */}
        <div
          className="h-full flex items-center"
          style={{
            transform: getCarouselTransform(),
            transition: dragOffset === 0 ? 'transform 0.3s ease-out' : 'none',
          }}
        >
          {options.map((option, index) => renderCard(option, index))}
        </div>

        {/* Arrow Buttons (desktop) */}
        <button
          onClick={() => navigateTo(currentIndex - 1)}
          disabled={currentIndex === 0}
          className={`
            absolute left-2 top-1/2 -translate-y-1/2 z-10
            w-10 h-10 rounded-full bg-black/50
            flex items-center justify-center
            text-gold/60 hover:text-gold hover:bg-black/70
            transition-all disabled:opacity-30 disabled:cursor-not-allowed
            hidden sm:flex
          `}
        >
          ‹
        </button>
        <button
          onClick={() => navigateTo(currentIndex + 1)}
          disabled={currentIndex === options.length - 1}
          className={`
            absolute right-2 top-1/2 -translate-y-1/2 z-10
            w-10 h-10 rounded-full bg-black/50
            flex items-center justify-center
            text-gold/60 hover:text-gold hover:bg-black/70
            transition-all disabled:opacity-30 disabled:cursor-not-allowed
            hidden sm:flex
          `}
        >
          ›
        </button>
      </div>

    </div>
  );
}

// Get icon/emoji for each class
function getClassIcon(id: string): string {
  const icons: Record<string, string> = {
    // Classes
    barbarian: '⚔️',
    bard: '🎭',
    cleric: '✝️',
    druid: '🌿',
    fighter: '🛡️',
    monk: '👊',
    paladin: '⚜️',
    ranger: '🏹',
    rogue: '🗡️',
    sorcerer: '✨',
    warlock: '👁️',
    wizard: '📖',
    // Species
    human: '👤',
    elf: '🧝',
    dwarf: '⛏️',
    halfling: '🍀',
    gnome: '🔧',
    tiefling: '😈',
    dragonborn: '🐉',
    aasimar: '😇',
    goliath: '🗿',
    orc: '💪',
    // Fallback
    default: '⭐',
  };
  return icons[id] || icons.default;
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
