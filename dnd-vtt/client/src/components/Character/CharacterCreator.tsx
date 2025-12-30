import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Panel } from '../ui/Panel';
import type { Character, Species, CharacterClass, AbilityScores, SkillName } from '../../types';
import {
  SPECIES_NAMES,
  CLASS_NAMES,
  ABILITY_NAMES,
  ABILITY_ABBREVIATIONS,
  CLASS_HIT_DICE,
  CLASS_SAVING_THROWS,
  SKILL_NAMES,
  SKILL_ABILITIES,
  BACKGROUNDS,
  ALIGNMENTS,
  SPECIES_SPEED,
  SPECIES_INFO,
  CLASS_INFO,
  BACKGROUND_INFO,
  PERSONALITY_TRAITS,
  IDEALS,
  BONDS,
  FLAWS,
  CLASS_CANTRIPS,
  CLASS_SPELLS_LEVEL_1,
  CANTRIPS_KNOWN,
  SPELLS_AT_LEVEL_1,
  rollAllAbilityScores,
  getAbilityModifier,
  formatModifier,
  getProficiencyBonus,
  getDefaultSkillProficiencies,
  CLASS_STARTING_PACKS,
  ALL_SHOP_ITEMS,
  CLASS_STANDARD_ARRAYS,
  CLASS_SUBCLASSES,
} from '../../data/dndData';
import type { ShopItem } from '../../data/dndData';

type CreationStep = 'basics' | 'abilities' | 'skills' | 'spells' | 'equipment' | 'details' | 'review';

interface SelectedShopItem extends ShopItem {
  id: string;
  quantity: number;
}

interface CharacterCreatorProps {
  onComplete: (character: Character) => void;
  onCancel: () => void;
  playerId: string;
}

const SPECIES_LIST: Species[] = ['aasimar', 'dragonborn', 'dwarf', 'elf', 'gnome', 'goliath', 'halfling', 'human', 'orc', 'tiefling'];
const CLASS_LIST: CharacterClass[] = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard'];

export function CharacterCreator({ onComplete, onCancel, playerId }: CharacterCreatorProps) {
  const [step, setStep] = useState<CreationStep>('basics');

  // Basic info
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<Species>('human');
  const [subspecies, setSubspecies] = useState<string>('');
  const [characterClass, setCharacterClass] = useState<CharacterClass>('fighter');
  const [subclass, setSubclass] = useState<string>('');
  const [background, setBackground] = useState('Folk Hero');
  const [alignment, setAlignment] = useState('True Neutral');

  // Ability scores - initialize with fighter's standard array
  const [abilityScores, setAbilityScores] = useState<AbilityScores>(CLASS_STANDARD_ARRAYS['fighter']);
  const [abilityMethod, setAbilityMethod] = useState<'standard' | 'roll'>('standard');

  // HP method
  const [hpMethod, setHpMethod] = useState<'standard' | 'roll'>('standard');
  const [rolledHp, setRolledHp] = useState<number | null>(null);

  // Skills
  const [selectedClassSkills, setSelectedClassSkills] = useState<SkillName[]>([]);

  // Spells
  const [selectedCantrips, setSelectedCantrips] = useState<string[]>([]);
  const [selectedSpells, setSelectedSpells] = useState<string[]>([]);

  // Equipment
  const [equipmentMethod, setEquipmentMethod] = useState<'pack' | 'shop'>('pack');
  const [shopCart, setShopCart] = useState<SelectedShopItem[]>([]);
  const [shopGold, setShopGold] = useState(50); // Starting gold for shopping
  const [shopCategory, setShopCategory] = useState<string>('all');

  // Personality
  const [personalityTraits, setPersonalityTraits] = useState('');
  const [ideals, setIdeals] = useState('');
  const [bonds, setBonds] = useState('');
  const [flaws, setFlaws] = useState('');
  const [backstory, setBackstory] = useState('');

  // Reset subspecies when species changes
  useEffect(() => {
    const info = SPECIES_INFO[species];
    if (info.subspecies && info.subspecies.length > 0) {
      setSubspecies(info.subspecies[0].name);
    } else {
      setSubspecies('');
    }
  }, [species]);

  // Reset skill selections when class/background changes
  useEffect(() => {
    setSelectedClassSkills([]);
    setSelectedCantrips([]);
    setSelectedSpells([]);
  }, [characterClass, background]);

  // Reset ability scores to class-specific standard when class changes (if using standard method)
  useEffect(() => {
    if (abilityMethod === 'standard') {
      setAbilityScores(CLASS_STANDARD_ARRAYS[characterClass]);
    }
    // Reset subclass when class changes
    const subclasses = CLASS_SUBCLASSES[characterClass];
    if (subclasses && subclasses.length > 0) {
      setSubclass(subclasses[0].name);
    } else {
      setSubclass('');
    }
  }, [characterClass]);

  // Reset rolled HP when class changes
  useEffect(() => {
    setRolledHp(null);
    setHpMethod('standard');
  }, [characterClass]);

  // Reset equipment when class changes
  useEffect(() => {
    setEquipmentMethod('pack');
    setShopCart([]);
    setShopGold(50);
  }, [characterClass]);

  const classInfo = CLASS_INFO[characterClass];
  const speciesInfo = SPECIES_INFO[species];
  const backgroundInfo = BACKGROUND_INFO[background];

  const steps: CreationStep[] = classInfo.isSpellcaster
    ? ['basics', 'abilities', 'skills', 'spells', 'equipment', 'details', 'review']
    : ['basics', 'abilities', 'skills', 'equipment', 'details', 'review'];
  const currentStepIndex = steps.indexOf(step);

  const canProceed = () => {
    switch (step) {
      case 'basics':
        return name.trim().length > 0;
      case 'skills':
        return selectedClassSkills.length === classInfo.numSkillChoices;
      case 'spells':
        const cantripsNeeded = CANTRIPS_KNOWN[characterClass] || 0;
        const spellsNeeded = SPELLS_AT_LEVEL_1[characterClass] || 0;
        return selectedCantrips.length === cantripsNeeded && selectedSpells.length >= Math.min(spellsNeeded, 2);
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setStep(steps[currentStepIndex + 1]);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setStep(steps[currentStepIndex - 1]);
    }
  };

  const handleRollAbilities = () => {
    // Roll 4d6 drop lowest for each ability score
    // Each ability gets its own independent roll - no sorting
    const rolled = rollAllAbilityScores();
    const abilities: (keyof AbilityScores)[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
    const newScores: AbilityScores = { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 };
    abilities.forEach((ability, idx) => {
      newScores[ability] = rolled[idx];
    });
    setAbilityScores(newScores);
    setAbilityMethod('roll');
  };

  const handleRollHp = () => {
    // Roll hit die for HP (D&D 5e: at level 1, you can roll or take max)
    const hitDie = CLASS_HIT_DICE[characterClass];
    const roll = Math.floor(Math.random() * hitDie) + 1;
    setRolledHp(roll);
    setHpMethod('roll');
  };

  const getCalculatedHp = () => {
    const hitDie = CLASS_HIT_DICE[characterClass];
    const conMod = getAbilityModifier(abilityScores.constitution);

    if (hpMethod === 'roll' && rolledHp !== null) {
      // Rolled HP: roll result + CON modifier (minimum 1)
      return Math.max(1, rolledHp + conMod);
    }
    // Standard: max hit die + CON modifier (minimum 1)
    return Math.max(1, hitDie + conMod);
  };

  const swapAbilities = (a: keyof AbilityScores, b: keyof AbilityScores) => {
    setAbilityScores(prev => ({
      ...prev,
      [a]: prev[b],
      [b]: prev[a],
    }));
  };

  const toggleClassSkill = (skill: SkillName) => {
    if (selectedClassSkills.includes(skill)) {
      setSelectedClassSkills(prev => prev.filter(s => s !== skill));
    } else if (selectedClassSkills.length < classInfo.numSkillChoices) {
      setSelectedClassSkills(prev => [...prev, skill]);
    }
  };

  const randomizePersonality = (field: 'traits' | 'ideals' | 'bonds' | 'flaws') => {
    const lists = { traits: PERSONALITY_TRAITS, ideals: IDEALS, bonds: BONDS, flaws: FLAWS };
    const list = lists[field];
    const random = list[Math.floor(Math.random() * list.length)];
    switch (field) {
      case 'traits': setPersonalityTraits(random); break;
      case 'ideals': setIdeals(random); break;
      case 'bonds': setBonds(random); break;
      case 'flaws': setFlaws(random); break;
    }
  };

  const toggleCantrip = (cantrip: string) => {
    const max = CANTRIPS_KNOWN[characterClass] || 0;
    if (selectedCantrips.includes(cantrip)) {
      setSelectedCantrips(prev => prev.filter(c => c !== cantrip));
    } else if (selectedCantrips.length < max) {
      setSelectedCantrips(prev => [...prev, cantrip]);
    }
  };

  const toggleSpell = (spell: string) => {
    const max = SPELLS_AT_LEVEL_1[characterClass] || 2;
    if (selectedSpells.includes(spell)) {
      setSelectedSpells(prev => prev.filter(s => s !== spell));
    } else if (selectedSpells.length < max) {
      setSelectedSpells(prev => [...prev, spell]);
    }
  };

  // Shop functions
  const addToCart = (item: ShopItem) => {
    if (shopGold < item.cost) return; // Can't afford

    const existingItem = shopCart.find(i => i.name === item.name);
    if (existingItem) {
      setShopCart(prev => prev.map(i =>
        i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setShopCart(prev => [...prev, {
        ...item,
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        quantity: 1,
      }]);
    }
    setShopGold(prev => prev - item.cost);
  };

  const removeFromCart = (itemName: string) => {
    const item = shopCart.find(i => i.name === itemName);
    if (!item) return;

    if (item.quantity > 1) {
      setShopCart(prev => prev.map(i =>
        i.name === itemName ? { ...i, quantity: i.quantity - 1 } : i
      ));
    } else {
      setShopCart(prev => prev.filter(i => i.name !== itemName));
    }
    setShopGold(prev => prev + item.cost);
  };

  const getFilteredShopItems = () => {
    if (shopCategory === 'all') return ALL_SHOP_ITEMS;
    return ALL_SHOP_ITEMS.filter(item => item.category === shopCategory);
  };

  const createCharacter = (): Character => {
    const level = 1;
    const maxHp = getCalculatedHp();
    const dexMod = getAbilityModifier(abilityScores.dexterity);

    // Combine background and class skill proficiencies
    const finalSkills = { ...getDefaultSkillProficiencies() };
    backgroundInfo.skillProficiencies.forEach(skill => {
      finalSkills[skill] = 'proficient';
    });
    selectedClassSkills.forEach(skill => {
      finalSkills[skill] = 'proficient';
    });

    // Build weapons and equipment based on method
    let weapons: Character['weapons'] = [];
    let equipment: Character['equipment'] = [];
    let startingGold = 0;
    let baseAC = 10 + dexMod;

    if (equipmentMethod === 'pack') {
      const pack = CLASS_STARTING_PACKS[characterClass];

      // Convert pack weapons to character weapons
      weapons = pack.weapons.map((w, idx) => ({
        id: `weapon-${idx}`,
        name: w.name,
        attackBonus: 2, // Base proficiency at level 1
        damage: w.damage,
        properties: w.properties,
        equipped: idx === 0, // First weapon is equipped
      }));

      // Convert pack equipment to character equipment
      equipment = pack.equipment.map((e, idx) => ({
        id: `equip-${idx}`,
        name: e.name,
        quantity: e.quantity,
      }));

      // Add shield if class pack includes one
      if (pack.shield) {
        equipment.push({ id: 'equip-shield', name: 'Shield', quantity: 1, equipped: true });
        baseAC += 2;
      }

      // Add armor to equipment if class pack includes one
      if (pack.armor) {
        equipment.push({
          id: 'equip-armor',
          name: pack.armor.name,
          quantity: 1,
          description: pack.armor.description,
          equipped: true,
        });
        // Calculate AC with armor
        baseAC = pack.armor.armorClass + Math.min(dexMod, 2); // Most armor caps Dex at +2
        if (pack.armor.name.includes('Leather') || pack.armor.name.includes('Studded')) {
          baseAC = pack.armor.armorClass + dexMod; // Light armor gets full Dex
        }
        if (pack.armor.name.includes('Chain Mail') || pack.armor.name.includes('Ring Mail')) {
          baseAC = pack.armor.armorClass; // Heavy armor no Dex
        }
        if (pack.shield) {
          baseAC += 2;
        }
      }

      startingGold = pack.gold;
    } else {
      // Shop purchases
      const weaponItems = shopCart.filter(i => i.category === 'weapon');
      const nonWeaponItems = shopCart.filter(i => i.category !== 'weapon');

      weapons = weaponItems.map((w, idx) => ({
        id: w.id,
        name: w.name,
        attackBonus: 2,
        damage: w.damage || '1d4',
        properties: w.properties,
        equipped: idx === 0,
      }));

      equipment = nonWeaponItems.map(e => ({
        id: e.id,
        name: e.name,
        quantity: e.quantity,
        description: e.description,
      }));

      // Handle armor AC from shop purchases
      const armorItem = shopCart.find(i => i.category === 'armor' && i.armorClass && i.armorClass > 2);
      const shieldItem = shopCart.find(i => i.name === 'Shield');

      if (armorItem && armorItem.armorClass) {
        if (armorItem.name.includes('Leather') || armorItem.name.includes('Padded') || armorItem.name.includes('Studded')) {
          baseAC = armorItem.armorClass + dexMod;
        } else if (armorItem.name.includes('Chain Mail') || armorItem.name.includes('Ring Mail')) {
          baseAC = armorItem.armorClass;
        } else {
          baseAC = armorItem.armorClass + Math.min(dexMod, 2);
        }
      }
      if (shieldItem) {
        baseAC += 2;
      }

      startingGold = Math.floor(shopGold); // Remaining gold
    }

    const now = new Date().toISOString();

    return {
      id: `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      playerId,
      name,
      species,
      characterClass,
      subclass: subclass || undefined,
      level,
      background,
      alignment,
      experiencePoints: 0,
      abilityScores,
      savingThrowProficiencies: CLASS_SAVING_THROWS[characterClass],
      skillProficiencies: finalSkills,
      armorProficiencies: [],
      weaponProficiencies: [],
      toolProficiencies: [],
      languages: ['Common'],
      armorClass: baseAC,
      initiative: dexMod,
      speed: SPECIES_SPEED[species],
      maxHitPoints: Math.max(1, maxHp),
      currentHitPoints: Math.max(1, maxHp),
      temporaryHitPoints: 0,
      hitDiceTotal: level,
      hitDiceRemaining: level,
      deathSaves: { successes: 0, failures: 0 },
      weapons,
      equipment,
      currency: { copper: 0, silver: 0, electrum: 0, gold: startingGold, platinum: 0 },
      features: [],
      cantrips: selectedCantrips,
      spells: selectedSpells,
      personalityTraits,
      ideals,
      bonds,
      flaws,
      backstory,
      createdAt: now,
      updatedAt: now,
    };
  };

  const handleComplete = () => {
    const character = createCharacter();
    onComplete(character);
  };

  const renderBasicsStep = () => (
    <div className="space-y-4">
      <h3 className="font-medieval text-lg text-gold">Basic Information</h3>

      <div>
        <label className="block text-parchment text-sm mb-1">Character Name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter character name" />
      </div>

      <div>
        <label className="block text-parchment text-sm mb-1">Species</label>
        <select
          value={species}
          onChange={(e) => setSpecies(e.target.value as Species)}
          className="w-full bg-parchment text-dark-wood px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-gold"
        >
          {SPECIES_LIST.map(s => (
            <option key={s} value={s}>{SPECIES_NAMES[s]}</option>
          ))}
        </select>
        <p className="text-parchment/60 text-xs mt-1">{speciesInfo.description}</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {speciesInfo.traits.map((trait, i) => (
            <span key={i} className="bg-leather/50 text-parchment/80 px-2 py-0.5 rounded text-xs">{trait}</span>
          ))}
        </div>
      </div>

      {speciesInfo.subspecies && speciesInfo.subspecies.length > 0 && (
        <div>
          <label className="block text-parchment text-sm mb-1">Subspecies</label>
          <select
            value={subspecies}
            onChange={(e) => setSubspecies(e.target.value)}
            className="w-full bg-parchment text-dark-wood px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-gold"
          >
            {speciesInfo.subspecies.map(sub => (
              <option key={sub.name} value={sub.name}>{sub.name}</option>
            ))}
          </select>
          <p className="text-parchment/60 text-xs mt-1">
            {speciesInfo.subspecies.find(s => s.name === subspecies)?.description}
          </p>
        </div>
      )}

      <div>
        <label className="block text-parchment text-sm mb-1">Class</label>
        <select
          value={characterClass}
          onChange={(e) => setCharacterClass(e.target.value as CharacterClass)}
          className="w-full bg-parchment text-dark-wood px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-gold"
        >
          {CLASS_LIST.map(c => (
            <option key={c} value={c}>{CLASS_NAMES[c]} (d{CLASS_HIT_DICE[c]})</option>
          ))}
        </select>
        <p className="text-parchment/60 text-xs mt-1">{classInfo.description}</p>
        <p className="text-parchment/70 text-xs">Primary: {classInfo.primaryAbility} | Saves: {classInfo.savingThrows}</p>
      </div>

      {/* Subclass selection for classes that choose at level 1 */}
      {CLASS_SUBCLASSES[characterClass] && (
        <div>
          <label className="block text-parchment text-sm mb-1">
            {characterClass === 'cleric' ? 'Divine Domain' :
             characterClass === 'sorcerer' ? 'Sorcerous Origin' :
             characterClass === 'warlock' ? 'Otherworldly Patron' : 'Subclass'}
          </label>
          <select
            value={subclass}
            onChange={(e) => setSubclass(e.target.value)}
            className="w-full bg-parchment text-dark-wood px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-gold"
          >
            {CLASS_SUBCLASSES[characterClass]!.map(sc => (
              <option key={sc.name} value={sc.name}>{sc.name}</option>
            ))}
          </select>
          <p className="text-parchment/60 text-xs mt-1">
            {CLASS_SUBCLASSES[characterClass]!.find(sc => sc.name === subclass)?.description}
          </p>
          <div className="mt-1">
            {CLASS_SUBCLASSES[characterClass]!.find(sc => sc.name === subclass)?.features.map((f, i) => (
              <p key={i} className="text-gold/80 text-xs">• {f}</p>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-parchment text-sm mb-1">Background</label>
        <select
          value={background}
          onChange={(e) => setBackground(e.target.value)}
          className="w-full bg-parchment text-dark-wood px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-gold"
        >
          {BACKGROUNDS.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        <p className="text-parchment/60 text-xs mt-1">{backgroundInfo.description}</p>
        <p className="text-parchment/70 text-xs">
          Skills: {backgroundInfo.skillProficiencies.map(s => SKILL_NAMES[s]).join(', ')}
        </p>
      </div>

      <div>
        <label className="block text-parchment text-sm mb-1">Alignment</label>
        <select
          value={alignment}
          onChange={(e) => setAlignment(e.target.value)}
          className="w-full bg-parchment text-dark-wood px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-gold"
        >
          {ALIGNMENTS.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>
    </div>
  );

  const renderAbilitiesStep = () => {
    const abilities: (keyof AbilityScores)[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

    return (
      <div className="space-y-4">
        <h3 className="font-medieval text-lg text-gold">Ability Scores</h3>

        <div className="flex gap-2 mb-4">
          <Button size="sm" variant={abilityMethod === 'standard' ? 'primary' : 'secondary'} onClick={() => {
            setAbilityMethod('standard');
            setAbilityScores(CLASS_STANDARD_ARRAYS[characterClass]);
          }}>
            Standard Array
          </Button>
          <Button size="sm" variant={abilityMethod === 'roll' ? 'primary' : 'secondary'} onClick={handleRollAbilities}>
            Roll (4d6 drop lowest)
          </Button>
        </div>

        <p className="text-parchment/70 text-xs">
          {abilityMethod === 'standard'
            ? `${CLASS_NAMES[characterClass]} Standard Array: Optimized for ${CLASS_NAMES[characterClass]}. Click arrows to swap.`
            : 'Rolled scores. Click arrows to swap values or re-roll.'}
        </p>

        <div className="grid grid-cols-2 gap-3">
          {abilities.map((ability, idx) => (
            <div key={ability} className="bg-dark-wood p-3 rounded border border-leather">
              <label className="block text-parchment text-sm mb-1">
                {ABILITY_NAMES[ability]} ({ABILITY_ABBREVIATIONS[ability]})
              </label>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {idx > 0 && (
                    <button
                      onClick={() => swapAbilities(ability, abilities[idx - 1])}
                      className="text-parchment/50 hover:text-gold text-xs"
                      title={`Swap with ${ABILITY_NAMES[abilities[idx - 1]]}`}
                    >
                      ↑
                    </button>
                  )}
                  {idx < abilities.length - 1 && (
                    <button
                      onClick={() => swapAbilities(ability, abilities[idx + 1])}
                      className="text-parchment/50 hover:text-gold text-xs"
                      title={`Swap with ${ABILITY_NAMES[abilities[idx + 1]]}`}
                    >
                      ↓
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gold font-bold text-2xl">{abilityScores[ability]}</span>
                  <span className="text-parchment text-sm">
                    ({formatModifier(getAbilityModifier(abilityScores[ability]))})
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* HP Options */}
        <div className="mt-6 pt-4 border-t border-leather">
          <h4 className="font-medieval text-md text-gold mb-2">Starting Hit Points</h4>
          <div className="flex gap-2 mb-2">
            <Button
              size="sm"
              variant={hpMethod === 'standard' ? 'primary' : 'secondary'}
              onClick={() => {
                setHpMethod('standard');
                setRolledHp(null);
              }}
            >
              Standard (Max d{CLASS_HIT_DICE[characterClass]})
            </Button>
            <Button
              size="sm"
              variant={hpMethod === 'roll' ? 'primary' : 'secondary'}
              onClick={handleRollHp}
            >
              {rolledHp !== null ? `Roll Again (got ${rolledHp})` : `Roll d${CLASS_HIT_DICE[characterClass]}`}
            </Button>
          </div>
          <div className="bg-dark-wood p-3 rounded border border-leather">
            <div className="flex items-center justify-between">
              <div className="text-parchment/70 text-sm">
                {hpMethod === 'standard'
                  ? `Max hit die (${CLASS_HIT_DICE[characterClass]}) + CON modifier (${formatModifier(getAbilityModifier(abilityScores.constitution))})`
                  : `Rolled ${rolledHp ?? '?'} + CON modifier (${formatModifier(getAbilityModifier(abilityScores.constitution))})`}
              </div>
              <div className="text-gold font-bold text-2xl">
                {getCalculatedHp()} HP
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSkillsStep = () => {
    const profBonus = getProficiencyBonus(1);
    const availableClassSkills = classInfo.skillChoices.filter(
      skill => !backgroundInfo.skillProficiencies.includes(skill)
    );

    return (
      <div className="space-y-4">
        <h3 className="font-medieval text-lg text-gold">Skill Proficiencies</h3>

        <div className="bg-dark-wood p-3 rounded border border-leather">
          <h4 className="text-gold text-sm mb-2">From Background ({background})</h4>
          <div className="flex flex-wrap gap-1">
            {backgroundInfo.skillProficiencies.map(skill => (
              <span key={skill} className="bg-gold/30 text-gold px-2 py-1 rounded text-sm">
                {SKILL_NAMES[skill]}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-gold text-sm mb-2">
            Choose {classInfo.numSkillChoices} from {CLASS_NAMES[characterClass]}
            ({selectedClassSkills.length}/{classInfo.numSkillChoices})
          </h4>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {availableClassSkills.map(skill => {
              const isSelected = selectedClassSkills.includes(skill);
              const abilityScore = abilityScores[SKILL_ABILITIES[skill]];
              const modifier = getAbilityModifier(abilityScore) + (isSelected ? profBonus : 0);

              return (
                <button
                  key={skill}
                  onClick={() => toggleClassSkill(skill)}
                  disabled={!isSelected && selectedClassSkills.length >= classInfo.numSkillChoices}
                  className={`p-2 rounded text-left text-sm transition-colors ${
                    isSelected
                      ? 'bg-gold/20 border border-gold text-gold'
                      : 'bg-dark-wood border border-leather text-parchment hover:border-gold/50 disabled:opacity-50'
                  }`}
                >
                  <div className="flex justify-between">
                    <span>{SKILL_NAMES[skill]}</span>
                    <span className="font-bold">{formatModifier(modifier)}</span>
                  </div>
                  <span className="text-xs opacity-70">{ABILITY_ABBREVIATIONS[SKILL_ABILITIES[skill]]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderSpellsStep = () => {
    const cantrips = CLASS_CANTRIPS[characterClass] || [];
    const spells = CLASS_SPELLS_LEVEL_1[characterClass] || [];
    const cantripsNeeded = CANTRIPS_KNOWN[characterClass] || 0;
    const spellsNeeded = SPELLS_AT_LEVEL_1[characterClass] || 2;

    return (
      <div className="space-y-4">
        <h3 className="font-medieval text-lg text-gold">Spellcasting</h3>
        <p className="text-parchment/70 text-xs">
          Spellcasting Ability: {classInfo.spellcastingAbility ? ABILITY_NAMES[classInfo.spellcastingAbility] : 'None'}
        </p>

        {cantrips.length > 0 && (
          <div>
            <h4 className="text-gold text-sm mb-2">
              Cantrips ({selectedCantrips.length}/{cantripsNeeded})
            </h4>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {cantrips.map(cantrip => {
                const isSelected = selectedCantrips.includes(cantrip.name);
                return (
                  <button
                    key={cantrip.name}
                    onClick={() => toggleCantrip(cantrip.name)}
                    disabled={!isSelected && selectedCantrips.length >= cantripsNeeded}
                    className={`p-2 rounded text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-gold/20 border border-gold text-gold'
                        : 'bg-dark-wood border border-leather text-parchment hover:border-gold/50 disabled:opacity-50'
                    }`}
                  >
                    <div className="font-semibold">{cantrip.name}</div>
                    <div className="opacity-70 truncate">{cantrip.description}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {spells.length > 0 && (
          <div>
            <h4 className="text-gold text-sm mb-2">
              1st Level Spells ({selectedSpells.length}/{Math.min(spellsNeeded, spells.length)})
            </h4>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {spells.map(spell => {
                const isSelected = selectedSpells.includes(spell.name);
                return (
                  <button
                    key={spell.name}
                    onClick={() => toggleSpell(spell.name)}
                    disabled={!isSelected && selectedSpells.length >= spellsNeeded}
                    className={`p-2 rounded text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-gold/20 border border-gold text-gold'
                        : 'bg-dark-wood border border-leather text-parchment hover:border-gold/50 disabled:opacity-50'
                    }`}
                  >
                    <div className="font-semibold">{spell.name}</div>
                    <div className="opacity-70 truncate">{spell.description}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderEquipmentStep = () => {
    const pack = CLASS_STARTING_PACKS[characterClass];
    const filteredItems = getFilteredShopItems();
    const categories = ['all', 'weapon', 'armor', 'gear', 'potion', 'food', 'tool'];

    return (
      <div className="space-y-4">
        <h3 className="font-medieval text-lg text-gold">Starting Equipment</h3>

        <div className="flex gap-2 mb-4">
          <Button
            size="sm"
            variant={equipmentMethod === 'pack' ? 'primary' : 'secondary'}
            onClick={() => {
              setEquipmentMethod('pack');
              setShopCart([]);
              setShopGold(50);
            }}
          >
            Class Pack
          </Button>
          <Button
            size="sm"
            variant={equipmentMethod === 'shop' ? 'primary' : 'secondary'}
            onClick={() => setEquipmentMethod('shop')}
          >
            Shop (50g)
          </Button>
        </div>

        {equipmentMethod === 'pack' ? (
          <div className="bg-dark-wood p-4 rounded border border-leather space-y-3">
            <h4 className="text-gold font-semibold">{CLASS_NAMES[characterClass]} Starting Pack</h4>

            {/* Weapons */}
            <div>
              <div className="text-parchment/70 text-xs mb-1">Weapons:</div>
              <div className="flex flex-wrap gap-1">
                {pack.weapons.map((w, idx) => (
                  <span key={idx} className="bg-red-900/30 text-parchment px-2 py-0.5 rounded text-xs">
                    {w.name} ({w.damage})
                  </span>
                ))}
              </div>
            </div>

            {/* Armor */}
            {pack.armor && (
              <div>
                <div className="text-parchment/70 text-xs mb-1">Armor:</div>
                <span className="bg-blue-900/30 text-parchment px-2 py-0.5 rounded text-xs">
                  {pack.armor.name} ({pack.armor.description})
                </span>
                {pack.shield && (
                  <span className="ml-1 bg-blue-900/30 text-parchment px-2 py-0.5 rounded text-xs">
                    Shield (+2 AC)
                  </span>
                )}
              </div>
            )}

            {/* Equipment */}
            <div>
              <div className="text-parchment/70 text-xs mb-1">Equipment:</div>
              <div className="flex flex-wrap gap-1">
                {pack.equipment.map((e, idx) => (
                  <span key={idx} className="bg-leather/50 text-parchment px-2 py-0.5 rounded text-xs">
                    {e.name} {e.quantity > 1 && `(x${e.quantity})`}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-gold text-sm pt-2 border-t border-leather">
              Starting Gold: {pack.gold}g
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Gold Counter */}
            <div className="flex justify-between items-center bg-gold/20 p-2 rounded">
              <span className="text-parchment">Remaining Gold:</span>
              <span className="text-gold font-bold text-xl">{shopGold.toFixed(1)}g</span>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setShopCategory(cat)}
                  className={`px-2 py-1 rounded text-xs capitalize ${
                    shopCategory === cat
                      ? 'bg-gold text-dark-wood'
                      : 'bg-leather/50 text-parchment hover:bg-leather'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Cart */}
            {shopCart.length > 0 && (
              <div className="bg-dark-wood p-3 rounded border border-leather">
                <div className="text-gold text-sm mb-2">Your Cart:</div>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {shopCart.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-xs">
                      <span className="text-parchment">
                        {item.name} {item.quantity > 1 && `x${item.quantity}`}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-gold">{(item.cost * item.quantity).toFixed(1)}g</span>
                        <button
                          onClick={() => removeFromCart(item.name)}
                          className="text-red-400 hover:text-red-300"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shop Items */}
            <div className="bg-dark-wood p-3 rounded border border-leather max-h-48 overflow-y-auto">
              <div className="space-y-1">
                {filteredItems.map((item, idx) => {
                  const canAfford = shopGold >= item.cost;
                  return (
                    <button
                      key={idx}
                      onClick={() => canAfford && addToCart(item)}
                      disabled={!canAfford}
                      className={`w-full text-left p-2 rounded flex justify-between items-center text-xs ${
                        canAfford
                          ? 'hover:bg-leather/50 cursor-pointer'
                          : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div>
                        <span className="text-parchment">{item.name}</span>
                        {item.damage && (
                          <span className="text-parchment/50 ml-1">({item.damage})</span>
                        )}
                        {item.description && (
                          <div className="text-parchment/50 text-xs">{item.description}</div>
                        )}
                      </div>
                      <span className="text-gold">{item.cost}g</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDetailsStep = () => (
    <div className="space-y-4">
      <h3 className="font-medieval text-lg text-gold">Personality & Backstory</h3>

      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-parchment text-sm">Personality Traits</label>
          <Button size="sm" variant="secondary" onClick={() => randomizePersonality('traits')}>Roll</Button>
        </div>
        <textarea
          value={personalityTraits}
          onChange={(e) => setPersonalityTraits(e.target.value)}
          placeholder="Describe your character's personality..."
          className="w-full bg-parchment text-dark-wood px-3 py-2 rounded h-16 resize-none focus:outline-none focus:ring-2 focus:ring-gold"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-parchment text-sm">Ideals</label>
            <Button size="sm" variant="secondary" onClick={() => randomizePersonality('ideals')}>Roll</Button>
          </div>
          <textarea
            value={ideals}
            onChange={(e) => setIdeals(e.target.value)}
            placeholder="What drives you?"
            className="w-full bg-parchment text-dark-wood px-3 py-2 rounded h-14 resize-none focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-parchment text-sm">Bonds</label>
            <Button size="sm" variant="secondary" onClick={() => randomizePersonality('bonds')}>Roll</Button>
          </div>
          <textarea
            value={bonds}
            onChange={(e) => setBonds(e.target.value)}
            placeholder="What connects you?"
            className="w-full bg-parchment text-dark-wood px-3 py-2 rounded h-14 resize-none focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-parchment text-sm">Flaws</label>
          <Button size="sm" variant="secondary" onClick={() => randomizePersonality('flaws')}>Roll</Button>
        </div>
        <textarea
          value={flaws}
          onChange={(e) => setFlaws(e.target.value)}
          placeholder="What are your weaknesses?"
          className="w-full bg-parchment text-dark-wood px-3 py-2 rounded h-14 resize-none focus:outline-none focus:ring-2 focus:ring-gold"
        />
      </div>

      <div>
        <label className="block text-parchment text-sm mb-1">Backstory</label>
        <textarea
          value={backstory}
          onChange={(e) => setBackstory(e.target.value)}
          placeholder="Tell us about your character's history..."
          className="w-full bg-parchment text-dark-wood px-3 py-2 rounded h-20 resize-none focus:outline-none focus:ring-2 focus:ring-gold"
        />
      </div>
    </div>
  );

  const renderReviewStep = () => {
    const hitDie = CLASS_HIT_DICE[characterClass];
    const maxHp = getCalculatedHp();
    const profBonus = getProficiencyBonus(1);

    const allProficientSkills = [
      ...backgroundInfo.skillProficiencies,
      ...selectedClassSkills,
    ];

    return (
      <div className="space-y-4">
        <h3 className="font-medieval text-lg text-gold">Review Your Character</h3>

        <div className="bg-dark-wood p-4 rounded border border-leather space-y-3">
          <div className="text-center border-b border-leather pb-3">
            <h4 className="font-medieval text-2xl text-gold">{name || 'Unnamed Character'}</h4>
            <p className="text-parchment">
              {SPECIES_NAMES[species]} {subspecies && `(${subspecies})`} {CLASS_NAMES[characterClass]} (Level 1)
            </p>
            <p className="text-parchment/70 text-sm">{background} • {alignment}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-leather/50 p-2 rounded">
              <div className="text-gold font-bold text-xl">{10 + getAbilityModifier(abilityScores.dexterity)}</div>
              <div className="text-parchment/70 text-xs">AC</div>
            </div>
            <div className="bg-leather/50 p-2 rounded">
              <div className="text-gold font-bold text-xl">{maxHp}</div>
              <div className="text-parchment/70 text-xs">HP</div>
            </div>
            <div className="bg-leather/50 p-2 rounded">
              <div className="text-gold font-bold text-xl">{SPECIES_SPEED[species]} ft</div>
              <div className="text-parchment/70 text-xs">Speed</div>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-1 text-center">
            {(Object.keys(ABILITY_ABBREVIATIONS) as (keyof AbilityScores)[]).map(ability => (
              <div key={ability} className="bg-leather/30 p-2 rounded">
                <div className="text-parchment/70 text-xs">{ABILITY_ABBREVIATIONS[ability]}</div>
                <div className="text-gold font-bold">{abilityScores[ability]}</div>
                <div className="text-parchment text-xs">
                  {formatModifier(getAbilityModifier(abilityScores[ability]))}
                </div>
              </div>
            ))}
          </div>

          <div>
            <div className="text-parchment/70 text-xs mb-1">Proficient Skills:</div>
            <div className="flex flex-wrap gap-1">
              {allProficientSkills.map(skill => (
                <span key={skill} className="bg-gold/20 text-gold px-2 py-0.5 rounded text-xs">
                  {SKILL_NAMES[skill]}
                </span>
              ))}
            </div>
          </div>

          {selectedCantrips.length > 0 && (
            <div>
              <div className="text-parchment/70 text-xs mb-1">Cantrips:</div>
              <div className="flex flex-wrap gap-1">
                {selectedCantrips.map(c => (
                  <span key={c} className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded text-xs">{c}</span>
                ))}
              </div>
            </div>
          )}

          {selectedSpells.length > 0 && (
            <div>
              <div className="text-parchment/70 text-xs mb-1">Spells:</div>
              <div className="flex flex-wrap gap-1">
                {selectedSpells.map(s => (
                  <span key={s} className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-xs">{s}</span>
                ))}
              </div>
            </div>
          )}

          <div className="text-parchment/70 text-xs">
            Hit Dice: 1d{hitDie} | Proficiency Bonus: +{profBonus}
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (step) {
      case 'basics': return renderBasicsStep();
      case 'abilities': return renderAbilitiesStep();
      case 'skills': return renderSkillsStep();
      case 'spells': return renderSpellsStep();
      case 'equipment': return renderEquipmentStep();
      case 'details': return renderDetailsStep();
      case 'review': return renderReviewStep();
    }
  };

  return (
    <Panel className="max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-medieval text-xl text-gold">Create Character</h2>
        <button onClick={onCancel} className="text-parchment/50 hover:text-parchment">✕</button>
      </div>

      <div className="flex justify-between mb-6">
        {steps.map((s, idx) => (
          <div
            key={s}
            className={`flex-1 h-1 rounded mx-0.5 ${idx <= currentStepIndex ? 'bg-gold' : 'bg-leather'}`}
          />
        ))}
      </div>

      <div className="mb-6 max-h-[60vh] overflow-y-auto">
        {renderCurrentStep()}
      </div>

      <div className="flex justify-between">
        <Button variant="secondary" onClick={prevStep} disabled={currentStepIndex === 0}>
          Back
        </Button>

        {step === 'review' ? (
          <Button onClick={handleComplete}>Create Character</Button>
        ) : (
          <Button onClick={nextStep} disabled={!canProceed()}>Next</Button>
        )}
      </div>
    </Panel>
  );
}
