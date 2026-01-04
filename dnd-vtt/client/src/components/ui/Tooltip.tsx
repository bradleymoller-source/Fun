import { useState, useRef, useEffect, type ReactNode } from 'react';

interface TooltipProps {
  content: string | ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export function Tooltip({ content, children, position = 'top', delay = 200 }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - 8;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + 8;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left - tooltipRect.width - 8;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + 8;
        break;
    }

    // Keep tooltip within viewport
    const padding = 8;
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));

    setTooltipPosition({ top, left });
  };

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      requestAnimationFrame(calculatePosition);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block"
      >
        {children}
      </div>
      {isVisible && (
        <div
          ref={tooltipRef}
          style={{
            position: 'fixed',
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            zIndex: 9999,
          }}
          className="px-3 py-2 text-sm bg-dark-wood text-parchment border border-gold/50 rounded shadow-lg max-w-xs"
        >
          {content}
        </div>
      )}
    </>
  );
}

// Pre-defined tooltips for D&D rules
export const RULE_TOOLTIPS = {
  // Conditions
  blinded: 'A blinded creature can\'t see and automatically fails any ability check that requires sight. Attack rolls against the creature have advantage, and the creature\'s attack rolls have disadvantage.',
  charmed: 'A charmed creature can\'t attack the charmer or target the charmer with harmful abilities or magical effects. The charmer has advantage on any ability check to interact socially with the creature.',
  deafened: 'A deafened creature can\'t hear and automatically fails any ability check that requires hearing.',
  frightened: 'A frightened creature has disadvantage on ability checks and attack rolls while the source of its fear is within line of sight. The creature can\'t willingly move closer to the source of its fear.',
  grappled: 'A grappled creature\'s speed becomes 0, and it can\'t benefit from any bonus to its speed. The condition ends if the grappler is incapacitated or if an effect removes the grappled creature from the grappler.',
  incapacitated: 'An incapacitated creature can\'t take actions or reactions.',
  invisible: 'An invisible creature is impossible to see without the aid of magic or a special sense. The creature has advantage on attack rolls, and attack rolls against the creature have disadvantage.',
  paralyzed: 'A paralyzed creature is incapacitated and can\'t move or speak. The creature automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have advantage, and any attack that hits is a critical hit if the attacker is within 5 feet.',
  petrified: 'A petrified creature is transformed, along with any nonmagical object it is wearing or carrying, into a solid inanimate substance (usually stone). Its weight increases by a factor of ten, and it ceases aging.',
  poisoned: 'A poisoned creature has disadvantage on attack rolls and ability checks.',
  prone: 'A prone creature\'s only movement option is to crawl, unless it stands up. The creature has disadvantage on attack rolls. Attack rolls against the creature have advantage if the attacker is within 5 feet, or disadvantage if farther away.',
  restrained: 'A restrained creature\'s speed becomes 0, and it can\'t benefit from any bonus to its speed. Attack rolls against the creature have advantage, and the creature\'s attack rolls have disadvantage. The creature has disadvantage on Dexterity saving throws.',
  stunned: 'A stunned creature is incapacitated, can\'t move, and can speak only falteringly. The creature automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have advantage.',
  unconscious: 'An unconscious creature is incapacitated, can\'t move or speak, and is unaware of its surroundings. The creature drops whatever it\'s holding and falls prone. Attack rolls against the creature have advantage, and any attack that hits is a critical hit if within 5 feet.',
  exhausted: '2024 Rules: Each level of exhaustion gives -2 to all d20 rolls. At 6 levels, you die. One level is removed after a long rest with food and drink.',
  concentrating: 'Concentration is required for some spells. If you take damage, make a Constitution save (DC 10 or half damage, whichever is higher) or lose the spell. You can only concentrate on one spell at a time.',

  // Ability Scores
  strength: 'Strength measures physical power, athletic training, and raw force. Used for melee attacks, carrying capacity, and physical feats.',
  dexterity: 'Dexterity measures agility, reflexes, and balance. Used for ranged attacks, AC (if unarmored), initiative, and finesse weapons.',
  constitution: 'Constitution measures health, stamina, and vital force. Affects hit points and concentration saves.',
  intelligence: 'Intelligence measures mental acuity, accuracy of recall, and reasoning. Used by wizards for spellcasting.',
  wisdom: 'Wisdom measures awareness, intuition, and insight. Used by clerics and druids for spellcasting.',
  charisma: 'Charisma measures force of personality, persuasiveness, and social influence. Used by bards, sorcerers, warlocks, and paladins for spellcasting.',

  // Combat
  armorClass: 'Armor Class (AC) represents how well your character avoids being wounded in battle. Things that contribute to AC include the armor worn, shields, Dexterity modifier, and other modifiers.',
  initiative: 'Initiative determines the order of turns during combat. When combat starts, every participant makes a Dexterity check to determine their place in the initiative order.',
  proficiencyBonus: 'Your proficiency bonus applies to attack rolls with weapons you\'re proficient with, saving throws you\'re proficient in, skill checks for skills you\'re proficient in, and spell attack rolls.',
  hitDice: 'Hit Dice are used to regain hit points during a short rest. You can spend one or more Hit Dice, rolling each die and adding your Constitution modifier to determine how many hit points you regain.',
  deathSaves: 'When you start your turn with 0 HP, make a death saving throw. Roll a d20: 10+ is a success, 9 or lower is a failure. 3 successes = stable, 3 failures = death. Natural 20 = regain 1 HP. Natural 1 = 2 failures.',
  temporaryHitPoints: 'Temporary hit points are a buffer against damage. They are lost first when you take damage. Multiple sources don\'t stack - you take the higher value.',

  // Rests
  shortRest: 'A short rest is at least 1 hour long. During a short rest, you can spend Hit Dice to regain HP, and some class features restore on a short rest.',
  longRest: 'A long rest is at least 8 hours long. You regain all lost HP, spell slots, and many class features. You also regain spent Hit Dice up to half your total (minimum 1).',

  // Spellcasting
  spellSlots: 'Spell slots represent your capacity to cast spells. When you cast a spell, you expend a slot of that spell\'s level or higher. Spell slots are restored after a long rest.',
  spellSaveDC: 'The Difficulty Class for saving throws against your spells. Calculated as 8 + proficiency bonus + spellcasting ability modifier.',
  spellAttackBonus: 'Added to attack rolls for spells. Calculated as proficiency bonus + spellcasting ability modifier.',
  cantrips: 'Cantrips are simple spells that can be cast at will, without using a spell slot. They become more powerful as you level up.',

  // Skills
  expertise: 'Expertise doubles your proficiency bonus for that skill. Some classes like Rogues and Bards can gain expertise in certain skills.',
  passivePerception: 'Passive Perception is used to detect hidden creatures or objects without actively searching. Equals 10 + Perception modifier.',
};
