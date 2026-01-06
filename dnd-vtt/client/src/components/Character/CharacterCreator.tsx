import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Panel } from '../ui/Panel';
import { SelectionModal, SelectionButton, type SelectionOption } from '../ui/SelectionModal';
import { PortraitSelector } from './PortraitSelector';
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
  // 2024 additions
  BACKGROUNDS_2024,
  ORIGIN_FEATS,
  SPECIES_TRAITS,
  SPECIES_CHOICES,
  SPECIES_SUGGESTED_LANGUAGES,
  STANDARD_LANGUAGES,
  RARE_LANGUAGES,
  CLASS_FEATURES,
  CLASS_PROFICIENCIES,
  formatArmorProficiencies,
  formatWeaponProficiencies,
  POINT_BUY_COSTS,
  hasLevel1Subclass,
  getAvailableSubclasses,
  // Class feature choices
  FIGHTING_STYLES,
  FIGHTING_STYLE_CLASSES,
  DIVINE_ORDER_OPTIONS,
  PRIMAL_ORDER_OPTIONS,
  WARLOCK_INVOCATIONS_KNOWN,
  getAvailableInvocations,
  EXPERTISE_CLASSES,
  // Origin feat proficiency options
  ARTISAN_TOOLS,
  MUSICAL_INSTRUMENTS,
  // Species trait choices
  HIGH_ELF_CANTRIPS,
  // Class resources
  getCharacterResources,
  // Weapon Mastery
  WEAPON_MASTERY_CLASSES,
  WEAPON_MASTERIES,
  WEAPON_MASTERY_DESCRIPTIONS,
  getProficientWeapons,
  // Role information for dropdowns
  CLASS_ROLE_INFO,
  SPECIES_ROLE_INFO,
  SUBSPECIES_ROLE_INFO,
  BACKGROUND_ROLE_INFO,
  FEAT_ROLE_INFO,
  SKILL_DESCRIPTIONS,
} from '../../data/dndData';
import type { ShopItem, OriginFeatName } from '../../data/dndData';

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

// Equipment descriptions for starting gear
const EQUIPMENT_DESCRIPTIONS: Record<string, string> = {
  // Instruments
  "Lute": "A stringed musical instrument favored by bards",
  "Lyre": "A stringed musical instrument",
  "Flute": "A woodwind musical instrument",
  "Drum": "A percussion musical instrument",
  "Horn": "A wind musical instrument",
  "Bagpipes": "A reed instrument with multiple pipes",
  "Viol": "A bowed stringed instrument",
  // Focuses and tools
  "Holy Symbol": "A religious symbol used as a spellcasting focus for divine magic",
  "Druidic Focus": "A wooden staff, yew wand, or totem used for druid spellcasting",
  "Arcane Focus": "A crystal, orb, rod, staff, or wand used for arcane spellcasting",
  "Component Pouch": "A small leather belt pouch containing material components for spells",
  "Thieves' Tools": "A set of lockpicks and tools for disabling traps",
  "Herbalism Kit": "Tools for identifying plants and creating potions and antitoxins",
  "Spellbook": "A leather-bound book for recording wizard spells",
  // Ammunition
  "Crossbow Bolts (20)": "20 bolts for use with crossbows",
  "Arrows (20)": "20 arrows for use with bows",
  "Sling Bullets (20)": "20 bullets for use with a sling",
  // Other common items
  "Backpack": "A leather pack for carrying equipment",
  "Bedroll": "A padded roll for sleeping",
  "Rope (50ft)": "50 feet of hempen rope",
  "Torch": "A wooden rod with a flammable end that burns for 1 hour",
  "Rations (1 day)": "Dried food suitable for travel",
  "Waterskin": "A container for holding water",
  // Pack-related items
  "Blanket": "A wool blanket for warmth",
  "Candle": "A small wax candle that provides dim light in a 5-foot radius",
  "Tinderbox": "Flint, steel, and tinder to start fires",
  "Alms Box": "A small box for collecting donations",
  "Block of Incense": "Fragrant incense for religious ceremonies",
  "Censer": "A container for burning incense",
  "Vestments": "Religious robes and garments",
  "Mess Kit": "A tin box with cup, bowl, and utensils",
  "Chest": "A wooden chest for storing items",
  "Map/Scroll Case": "A cylindrical case for maps and scrolls",
  "Fine Clothes": "Elegant clothing suitable for formal occasions",
  "Ink": "A bottle of black ink",
  "Ink Pen": "A quill for writing",
  "Lamp": "An oil lamp providing bright light in a 15-foot radius",
  "Oil Flask": "A flask of oil for lamps",
  "Paper": "Sheets of parchment for writing",
  "Perfume": "A vial of fragrant perfume",
  "Sealing Wax": "Wax for sealing letters",
  "Soap": "A bar of soap",
  "Crowbar": "An iron crowbar useful for prying things open",
  "Hammer": "A small hammer",
  "Piton": "An iron spike for climbing",
  "Costume": "A theatrical costume for performances",
  "Disguise Kit": "Makeup and props for creating disguises",
  "Ball Bearings": "Tiny metal balls that create difficult terrain",
  "String (10ft)": "A length of twine",
  "Bell": "A small bell",
  "Hooded Lantern": "A lantern with a hood to direct or block light",
  "Book of Lore": "A book containing historical or arcane knowledge",
  "Parchment": "A sheet of parchment for writing",
  "Bag of Sand": "Fine sand used for drying ink",
  "Small Knife": "A small utility knife",
  "Quiver": "A container for arrows or bolts",
};

export function CharacterCreator({ onComplete, onCancel, playerId }: CharacterCreatorProps) {
  const [step, setStep] = useState<CreationStep>('basics');

  // Basic info
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<Species>('human');
  const [subspecies, setSubspecies] = useState<string>('');
  const [speciesChoice, setSpeciesChoice] = useState<string>('');  // For Dragonborn ancestry, Goliath giant type, etc.
  const [highElfCantrip, setHighElfCantrip] = useState<string>('');  // For High Elf wizard cantrip choice
  const [characterClass, setCharacterClass] = useState<CharacterClass>('fighter');
  const [subclass, setSubclass] = useState<string>('');
  const [subclassChoices, setSubclassChoices] = useState<Record<string, string[]>>({});
  const [fightingStyle, setFightingStyle] = useState<string>('');
  const [divineOrder, setDivineOrder] = useState<string>('');  // Cleric Divine Order choice
  const [primalOrder, setPrimalOrder] = useState<string>('');    // Druid Primal Order choice
  const [divineOrderCantrip, setDivineOrderCantrip] = useState<string>(''); // Extra cantrip for Thaumaturge
  const [primalOrderCantrip, setPrimalOrderCantrip] = useState<string>(''); // Extra cantrip for Magician
  const [eldritchInvocations, setEldritchInvocations] = useState<string[]>([]);
  const [pactOfTomeCantrips, setPactOfTomeCantrips] = useState<string[]>([]); // Cantrips from Pact of the Tome
  const [lessonsCantrip, setLessonsCantrip] = useState<string>(''); // Cantrip from Lessons of the First Ones
  const [expertiseSkills, setExpertiseSkills] = useState<SkillName[]>([]);
  const [weaponMasteries, setWeaponMasteries] = useState<string[]>([]); // Weapons with mastery selected
  // Origin feat choices
  const [originFeatCantrips, setOriginFeatCantrips] = useState<string[]>([]);
  const [originFeatSpells, setOriginFeatSpells] = useState<string[]>([]);
  const [originFeatProficiencies, setOriginFeatProficiencies] = useState<string[]>([]);
  const [background, setBackground] = useState('Soldier');
  const [alignment, setAlignment] = useState('True Neutral');
  const [level, setLevel] = useState(1);

  // Modal state for selection pickers
  const [openModal, setOpenModal] = useState<'class' | 'species' | 'subspecies' | 'background' | 'feat' | null>(null);

  // Languages (Common + 2 more, with suggestions from species)
  const [languages, setLanguages] = useState<string[]>(['Common']);

  // Appearance
  const [appearance, setAppearance] = useState({
    age: '',
    height: '',
    weight: '',
    eyes: '',
    hair: '',
    skin: '',
  });

  // Human bonus feat (Versatile trait)
  const [humanBonusFeat, setHumanBonusFeat] = useState<OriginFeatName | null>(null);
  const [humanFeatCantrips, setHumanFeatCantrips] = useState<string[]>([]); // Magic Initiate cantrips from Human feat
  const [humanFeatSpells, setHumanFeatSpells] = useState<string[]>([]); // Magic Initiate spells from Human feat

  // Ability scores - initialize with fighter's standard array
  const [abilityScores, setAbilityScores] = useState<AbilityScores>(CLASS_STANDARD_ARRAYS['fighter']);
  const [abilityMethod, setAbilityMethod] = useState<'standard' | 'roll' | 'pointbuy'>('standard');
  const [pointBuyPoints, setPointBuyPoints] = useState(27); // Remaining points for point buy

  // Ability Score Increases (ASI) from character origin
  // D&D 5e 2024: +2 to one, +1 to another OR +1 to three different
  const [asiMethod, setAsiMethod] = useState<'2-1' | '1-1-1'>('2-1');
  const [asiPlus2, setAsiPlus2] = useState<keyof AbilityScores | null>(null);
  const [asiPlus1, setAsiPlus1] = useState<keyof AbilityScores | null>(null);

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
  const [showOnlyProficient, setShowOnlyProficient] = useState(true); // Filter to show only proficient gear

  // Personality
  const [personalityTraits, setPersonalityTraits] = useState('');
  const [ideals, setIdeals] = useState('');
  const [bonds, setBonds] = useState('');
  const [flaws, setFlaws] = useState('');
  const [backstory, setBackstory] = useState('');

  // Portrait
  const [portrait, setPortrait] = useState('');

  // Reset subspecies, languages, and species choice when species changes
  useEffect(() => {
    const info = SPECIES_INFO[species];
    if (info.subspecies && info.subspecies.length > 0) {
      setSubspecies(info.subspecies[0].name);
    } else {
      setSubspecies('');
    }
    // Set suggested languages for the species
    const suggested = SPECIES_SUGGESTED_LANGUAGES[species];
    if (suggested && suggested.length > 0) {
      setLanguages(['Common', ...suggested]);
    } else {
      setLanguages(['Common']);
    }
    // Set default species choice (e.g., dragon ancestry, giant ancestry)
    const speciesChoiceData = SPECIES_CHOICES[species];
    if (speciesChoiceData && speciesChoiceData.options.length > 0) {
      setSpeciesChoice(speciesChoiceData.options[0].id);
    } else {
      setSpeciesChoice('');
    }
    // Reset human bonus feat when species changes
    setHumanBonusFeat(null);
    // Reset High Elf cantrip when species changes
    setHighElfCantrip('');
  }, [species]);

  // Reset ASI selections when background changes (ASI is now tied to background abilities)
  useEffect(() => {
    setAsiPlus2(null);
    setAsiPlus1(null);
  }, [background]);

  // Reset origin feat choices when background changes
  useEffect(() => {
    setOriginFeatCantrips([]);
    setOriginFeatSpells([]);
    setOriginFeatProficiencies([]);
  }, [background]);

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
    // Only auto-select subclass for classes that get it at level 1 (Cleric, Sorcerer, Warlock)
    const subclasses = CLASS_SUBCLASSES[characterClass];
    if (subclasses && subclasses.length > 0 && hasLevel1Subclass(characterClass)) {
      setSubclass(subclasses[0].name);
    } else {
      setSubclass('');
    }
    // Reset subclass choices when class changes
    setSubclassChoices({});
    // Reset class feature choices when class changes
    // Only set fighting style if class gets it at level 1 (Fighter only)
    const fightingStyleData = FIGHTING_STYLE_CLASSES[characterClass];
    if (fightingStyleData && fightingStyleData.level === 1 && fightingStyleData.options.length > 0) {
      setFightingStyle(fightingStyleData.options[0]);
    } else {
      setFightingStyle('');
    }
    // Reset Divine Order for cleric
    if (characterClass === 'cleric') {
      setDivineOrder('protector');
      setDivineOrderCantrip('');
    }
    // Reset Primal Order for druid
    if (characterClass === 'druid') {
      setPrimalOrder('magician');
      setPrimalOrderCantrip('');
    }
    setEldritchInvocations([]);
    setPactOfTomeCantrips([]);
    setExpertiseSkills([]);
    setWeaponMasteries([]);
  }, [characterClass]);

  // Reset rolled HP when class changes
  useEffect(() => {
    setRolledHp(null);
    setHpMethod('standard');
  }, [characterClass]);

  // Clear Pact of the Tome cantrips if invocation is deselected
  useEffect(() => {
    if (!eldritchInvocations.includes('pact-of-the-tome')) {
      setPactOfTomeCantrips([]);
    }
  }, [eldritchInvocations]);

  // Clear Lessons of the First Ones cantrip if invocation is deselected
  useEffect(() => {
    if (!eldritchInvocations.includes('lessons-of-the-first-ones')) {
      setLessonsCantrip('');
    }
  }, [eldritchInvocations]);

  // Clear human feat cantrips/spells when feat changes
  useEffect(() => {
    setHumanFeatCantrips([]);
    setHumanFeatSpells([]);
  }, [humanBonusFeat]);

  // Reset equipment when class changes
  useEffect(() => {
    setEquipmentMethod('pack');
    setShopCart([]);
    setShopGold(50);
  }, [characterClass]);

  const classInfo = CLASS_INFO[characterClass];
  const speciesInfo = SPECIES_INFO[species];
  const backgroundInfo = BACKGROUND_INFO[background];
  const background2024 = BACKGROUNDS_2024[background];
  const speciesTraits = SPECIES_TRAITS[species];
  const classFeatures = CLASS_FEATURES[characterClass].filter(f => f.level <= level);
  const classProficiencies = CLASS_PROFICIENCIES[characterClass];

  // Get origin feat from background
  const originFeat = background2024 ? ORIGIN_FEATS[background2024.originFeat] : null;

  // Get background ability score options (for restricted ASI)
  const backgroundAbilities = background2024?.abilityScores || [];

  // Check if character has any acquired cantrips from non-class sources
  const hasAcquiredCantrips = (): boolean => {
    // Origin feat cantrips (Magic Initiate)
    if (originFeat?.cantripCount && originFeat.cantripCount > 0) return true;
    // Species innate cantrips
    if (speciesTraits?.cantrips && speciesTraits.cantrips.length > 0) return true;
    // High Elf wizard cantrip
    if (species === 'elf' && speciesChoice === 'high-elf') return true;
    // Drow Dancing Lights
    if (species === 'elf' && speciesChoice === 'drow') return true;
    // Forest Gnome Minor Illusion
    if (species === 'gnome' && speciesChoice === 'forest-gnome') return true;
    // Tiefling lineage cantrips
    if (species === 'tiefling') return true;
    // Monk Warrior of Elements
    if (characterClass === 'monk' && subclass === 'Warrior of the Elements') return true;
    // Pact of the Tome
    if (pactOfTomeCantrips.length > 0) return true;
    // Lessons of the First Ones
    if (lessonsCantrip) return true;
    // Human bonus feat (Magic Initiate)
    if (humanFeatCantrips.length > 0) return true;
    return false;
  };

  // Show spells step if spellcaster OR has any acquired cantrips
  const showSpellsStep = classInfo.isSpellcaster || hasAcquiredCantrips();

  const steps: CreationStep[] = showSpellsStep
    ? ['basics', 'abilities', 'skills', 'spells', 'equipment', 'details', 'review']
    : ['basics', 'abilities', 'skills', 'equipment', 'details', 'review'];
  const currentStepIndex = steps.indexOf(step);

  const canProceed = () => {
    switch (step) {
      case 'basics':
        // Require Divine Order for Cleric, Primal Order for Druid
        if (characterClass === 'cleric' && !divineOrder) return false;
        if (characterClass === 'druid' && !primalOrder) return false;
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

  // Point Buy functions
  const initPointBuy = () => {
    setAbilityScores({ strength: 8, dexterity: 8, constitution: 8, intelligence: 8, wisdom: 8, charisma: 8 });
    setPointBuyPoints(27);
    setAbilityMethod('pointbuy');
  };

  const getPointBuyCost = (score: number): number => {
    return POINT_BUY_COSTS[score] ?? 0;
  };

  const adjustPointBuyScore = (ability: keyof AbilityScores, delta: number) => {
    const currentScore = abilityScores[ability];
    const newScore = currentScore + delta;

    // Validate bounds (8-15 for point buy)
    if (newScore < 8 || newScore > 15) return;

    // Calculate cost difference
    const currentCost = getPointBuyCost(currentScore);
    const newCost = getPointBuyCost(newScore);
    const costDiff = newCost - currentCost;

    // Check if we have enough points
    if (costDiff > pointBuyPoints) return;

    setAbilityScores(prev => ({ ...prev, [ability]: newScore }));
    setPointBuyPoints(prev => prev - costDiff);
  };

  // Quick Build - optimal character based on class
  const handleQuickBuild = () => {
    // Set optimal ability scores for class
    setAbilityScores(CLASS_STANDARD_ARRAYS[characterClass]);
    setAbilityMethod('standard');

    // Auto-select ASI for primary ability
    const bg = BACKGROUNDS_2024[background];
    if (bg) {
      const primaryAbility = bg.abilityScores[0];
      const secondaryAbility = bg.abilityScores[1];
      setAsiMethod('2-1');
      setAsiPlus2(primaryAbility);
      setAsiPlus1(secondaryAbility);
    }

    // Auto-select class skills (first N choices)
    const availableSkills = classInfo.skillChoices.filter(
      skill => !backgroundInfo.skillProficiencies.includes(skill)
    );
    setSelectedClassSkills(availableSkills.slice(0, classInfo.numSkillChoices));

    // Auto-select cantrips/spells if spellcaster
    if (classInfo.isSpellcaster) {
      const cantrips = CLASS_CANTRIPS[characterClass] || [];
      const spells = CLASS_SPELLS_LEVEL_1[characterClass] || [];
      const numCantrips = CANTRIPS_KNOWN[characterClass] || 0;
      const numSpells = SPELLS_AT_LEVEL_1[characterClass] || 2;
      setSelectedCantrips(cantrips.slice(0, numCantrips).map(c => c.name));
      setSelectedSpells(spells.slice(0, Math.min(numSpells, 2)).map(s => s.name));
    }

    // Set equipment to pack
    setEquipmentMethod('pack');
  };

  // Randomize - fully random character
  const handleRandomize = () => {
    // Random species
    const randomSpecies = SPECIES_LIST[Math.floor(Math.random() * SPECIES_LIST.length)];
    setSpecies(randomSpecies);

    // Random class
    const randomClass = CLASS_LIST[Math.floor(Math.random() * CLASS_LIST.length)];
    setCharacterClass(randomClass);

    // Random background
    const bgKeys = Object.keys(BACKGROUNDS_2024);
    const randomBg = bgKeys[Math.floor(Math.random() * bgKeys.length)];
    setBackground(randomBg);

    // Roll abilities
    handleRollAbilities();

    // Random name
    const randomNames = ['Aldric', 'Brynn', 'Caelum', 'Dara', 'Elara', 'Finn', 'Gwendolyn', 'Hadrian', 'Isolde', 'Jareth'];
    setName(randomNames[Math.floor(Math.random() * randomNames.length)]);
  };

  // Toggle language selection
  const toggleLanguage = (lang: string) => {
    if (lang === 'Common') return; // Can't remove Common
    if (languages.includes(lang)) {
      setLanguages(prev => prev.filter(l => l !== lang));
    } else if (languages.length < 3) {
      setLanguages(prev => [...prev, lang]);
    }
  };

  const handleRollHp = () => {
    // Roll hit die for HP (D&D 5e: at level 1, you can roll or take max)
    const hitDie = CLASS_HIT_DICE[characterClass];
    const roll = Math.floor(Math.random() * hitDie) + 1;
    setRolledHp(roll);
    setHpMethod('roll');
  };

  // Calculate final ability scores with ASI bonuses applied
  const getFinalAbilityScores = (): AbilityScores => {
    const finalScores = { ...abilityScores };

    if (asiMethod === '2-1') {
      if (asiPlus2) {
        finalScores[asiPlus2] = Math.min(20, finalScores[asiPlus2] + 2);
      }
      if (asiPlus1) {
        finalScores[asiPlus1] = Math.min(20, finalScores[asiPlus1] + 1);
      }
    } else {
      // 1-1-1 method - automatically applies +1 to all 3 background abilities
      backgroundAbilities.forEach(ability => {
        finalScores[ability] = Math.min(20, finalScores[ability] + 1);
      });
    }

    return finalScores;
  };

  const getCalculatedHp = () => {
    const hitDie = CLASS_HIT_DICE[characterClass];
    // Use final CON score with ASI applied
    const finalScores = getFinalAbilityScores();
    const conMod = getAbilityModifier(finalScores.constitution);

    let baseHp: number;
    if (hpMethod === 'roll' && rolledHp !== null) {
      // Rolled HP: roll result + CON modifier (minimum 1)
      baseHp = Math.max(1, rolledHp + conMod);
    } else {
      // Standard: max hit die + CON modifier (minimum 1)
      baseHp = Math.max(1, hitDie + conMod);
    }

    // Tough feat: +2 HP per level
    const hasTough = (originFeat?.name === 'Tough') || (humanBonusFeat === 'Tough');
    if (hasTough) {
      baseHp += 2 * level;
    }

    // Dwarven Toughness (Hill Dwarf): +1 HP per level
    const hasDwarvenToughness = species === 'dwarf' && speciesChoice === 'hill-dwarf';
    if (hasDwarvenToughness) {
      baseHp += level;
    }

    return baseHp;
  };

  const swapAbilities = (a: keyof AbilityScores, b: keyof AbilityScores) => {
    setAbilityScores(prev => ({
      ...prev,
      [a]: prev[b],
      [b]: prev[a],
    }));
  };

  // Reset ASI selections when method changes
  const handleAsiMethodChange = (method: '2-1' | '1-1-1') => {
    setAsiMethod(method);
    setAsiPlus2(null);
    setAsiPlus1(null);
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

  // Randomize physical appearance based on species
  const randomizeAppearance = () => {
    const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    // Age ranges by species
    const ageRanges: Record<Species, { min: number; max: number }> = {
      human: { min: 18, max: 80 },
      elf: { min: 100, max: 750 },
      dwarf: { min: 50, max: 350 },
      halfling: { min: 20, max: 150 },
      dragonborn: { min: 15, max: 80 },
      gnome: { min: 40, max: 425 },
      tiefling: { min: 18, max: 105 },
      aasimar: { min: 18, max: 160 },
      goliath: { min: 16, max: 80 },
      orc: { min: 12, max: 50 },
    };

    // Height ranges (in inches) by species
    const heightRanges: Record<Species, { min: number; max: number }> = {
      human: { min: 60, max: 78 },
      elf: { min: 58, max: 78 },
      dwarf: { min: 44, max: 56 },
      halfling: { min: 30, max: 42 },
      dragonborn: { min: 66, max: 80 },
      gnome: { min: 36, max: 44 },
      tiefling: { min: 60, max: 78 },
      aasimar: { min: 60, max: 78 },
      goliath: { min: 84, max: 102 },
      orc: { min: 64, max: 80 },
    };

    // Weight ranges by species
    const weightRanges: Record<Species, { min: number; max: number }> = {
      human: { min: 110, max: 250 },
      elf: { min: 90, max: 180 },
      dwarf: { min: 130, max: 220 },
      halfling: { min: 35, max: 50 },
      dragonborn: { min: 200, max: 320 },
      gnome: { min: 35, max: 50 },
      tiefling: { min: 110, max: 220 },
      aasimar: { min: 110, max: 250 },
      goliath: { min: 280, max: 400 },
      orc: { min: 180, max: 300 },
    };

    // Eye colors by species
    const eyeColors: Record<Species, string[]> = {
      human: ['Brown', 'Blue', 'Green', 'Hazel', 'Gray', 'Amber'],
      elf: ['Blue', 'Green', 'Violet', 'Gold', 'Silver', 'Amber', 'Gray'],
      dwarf: ['Brown', 'Blue', 'Gray', 'Green', 'Amber'],
      halfling: ['Brown', 'Blue', 'Green', 'Hazel'],
      dragonborn: ['Red', 'Gold', 'Green', 'Blue', 'Black', 'White', 'Amber'],
      gnome: ['Blue', 'Green', 'Brown', 'Turquoise', 'Violet'],
      tiefling: ['Red', 'Gold', 'Silver', 'Black', 'Pale Yellow', 'Purple'],
      aasimar: ['Gold', 'Silver', 'White', 'Pale Blue', 'Topaz'],
      goliath: ['Blue', 'Green', 'Gray', 'Brown'],
      orc: ['Red', 'Gray', 'Brown', 'Yellow', 'Amber'],
    };

    // Hair colors by species
    const hairColors: Record<Species, string[]> = {
      human: ['Black', 'Brown', 'Blonde', 'Red', 'Auburn', 'Gray', 'White'],
      elf: ['Black', 'Silver', 'Blonde', 'Gold', 'Copper', 'White', 'Green', 'Blue'],
      dwarf: ['Black', 'Brown', 'Red', 'Gray', 'White', 'Ginger'],
      halfling: ['Brown', 'Black', 'Auburn', 'Blonde', 'Sandy'],
      dragonborn: ['None (scales)', 'None', 'Frill', 'Crest'],
      gnome: ['Red', 'Blonde', 'White', 'Brown', 'Orange', 'Pink'],
      tiefling: ['Black', 'Dark Red', 'Purple', 'Blue', 'White', 'Orange'],
      aasimar: ['Golden', 'Silver', 'White', 'Pale Blonde', 'Copper'],
      goliath: ['Black', 'Dark Brown', 'None (bald)'],
      orc: ['Black', 'Brown', 'Gray', 'None (bald)'],
    };

    // Skin tones by species
    const skinTones: Record<Species, string[]> = {
      human: ['Fair', 'Light', 'Olive', 'Tan', 'Brown', 'Dark Brown', 'Ebony'],
      elf: ['Pale', 'Fair', 'Bronze', 'Copper', 'Dusk Gray', 'Obsidian'],
      dwarf: ['Tan', 'Fair', 'Light Brown', 'Brown', 'Gray'],
      halfling: ['Fair', 'Tan', 'Light Brown', 'Ruddy'],
      dragonborn: ['Brass', 'Bronze', 'Copper', 'Gold', 'Silver', 'Blue', 'Green', 'Red', 'White', 'Black'],
      gnome: ['Fair', 'Tan', 'Ruddy', 'Light Brown', 'Wood Brown'],
      tiefling: ['Red', 'Purple', 'Blue', 'Pale', 'Ashen', 'Normal Human Range'],
      aasimar: ['Fair', 'Golden', 'Pale', 'Silver-touched', 'Bronze'],
      goliath: ['Gray', 'Light Gray', 'Stone Gray', 'Brown-Gray'],
      orc: ['Gray-Green', 'Green', 'Gray', 'Brown'],
    };

    const ageRange = ageRanges[species];
    const heightRange = heightRanges[species];
    const weightRange = weightRanges[species];

    const age = Math.floor(Math.random() * (ageRange.max - ageRange.min) + ageRange.min);
    const heightInches = Math.floor(Math.random() * (heightRange.max - heightRange.min) + heightRange.min);
    const weight = Math.floor(Math.random() * (weightRange.max - weightRange.min) + weightRange.min);

    const feet = Math.floor(heightInches / 12);
    const inches = heightInches % 12;

    setAppearance({
      age: age.toString(),
      height: `${feet}'${inches}"`,
      weight: `${weight} lbs`,
      eyes: pick(eyeColors[species]),
      hair: pick(hairColors[species]),
      skin: pick(skinTones[species]),
    });
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
    let items = shopCategory === 'all' ? ALL_SHOP_ITEMS : ALL_SHOP_ITEMS.filter(item => item.category === shopCategory);

    if (showOnlyProficient) {
      const profs = CLASS_PROFICIENCIES[characterClass];

      items = items.filter(item => {
        // Non-weapon/armor items always pass
        if (item.category !== 'weapon' && item.category !== 'armor') {
          return true;
        }

        // Filter armor by proficiency
        if (item.category === 'armor' && item.armorType) {
          return profs.armor.includes(item.armorType);
        }

        // Filter weapons by proficiency
        if (item.category === 'weapon' && item.weaponType) {
          // Check if class has simple or martial weapon proficiency
          const hasSimple = profs.weapons.some(w => w.type === 'simple');
          const hasMartial = profs.weapons.some(w => w.type === 'martial');

          if (item.weaponType === 'simple' && hasSimple) return true;
          if (item.weaponType === 'martial' && hasMartial) return true;

          // Check for specific weapon proficiency (Bards, Rogues, etc.)
          const specificWeapons = profs.weapons
            .filter(w => w.type === 'specific')
            .flatMap(w => w.specific || []);
          if (specificWeapons.includes(item.name)) return true;

          return false;
        }

        return true;
      });
    }

    return items;
  };

  const createCharacter = (): Character => {
    const charLevel = level; // Use the state level
    const maxHp = getCalculatedHp();
    const finalScores = getFinalAbilityScores();
    const dexMod = getAbilityModifier(finalScores.dexterity);
    const strMod = getAbilityModifier(finalScores.strength);

    // Combine background and class skill proficiencies
    const finalSkills = { ...getDefaultSkillProficiencies() };
    backgroundInfo.skillProficiencies.forEach(skill => {
      finalSkills[skill] = 'proficient';
    });
    selectedClassSkills.forEach(skill => {
      finalSkills[skill] = 'proficient';
    });

    // Add Skilled feat skill proficiencies
    if (originFeat?.proficiencyChoices?.type === 'skill' || originFeat?.proficiencyChoices?.type === 'any') {
      originFeatProficiencies.forEach(prof => {
        // Only add if it's a valid skill name
        if (prof in finalSkills) {
          finalSkills[prof as SkillName] = 'proficient';
        }
      });
    }

    // Build weapons and equipment based on method
    let weapons: Character['weapons'] = [];
    let equipment: Character['equipment'] = [];
    let startingGold = 0;
    let baseAC = 10 + dexMod;

    // Check for fighting style bonuses
    const hasArchery = fightingStyle === 'archery';
    const hasDueling = fightingStyle === 'dueling';
    const hasDefense = fightingStyle === 'defense';
    const hasThrownWeapon = fightingStyle === 'thrown-weapon';
    const hasGreatWeapon = fightingStyle === 'great-weapon';

    if (equipmentMethod === 'pack') {
      const pack = CLASS_STARTING_PACKS[characterClass];

      // Group thrown weapons by name to consolidate duplicates (e.g., 10 Darts -> "Dart (×10)")
      const weaponCounts = new Map<string, number>();
      for (const w of pack.weapons) {
        const isThrown = w.properties?.some(p => p.toLowerCase().includes('thrown'));
        if (isThrown) {
          weaponCounts.set(w.name, (weaponCounts.get(w.name) || 0) + 1);
        }
      }

      // Track which thrown weapons we've already added
      const addedThrown = new Set<string>();

      // Convert pack weapons to character weapons (consolidating thrown weapons)
      weapons = pack.weapons.reduce<Character['weapons']>((acc, w) => {
        // Check if weapon is ranged (has ammunition property)
        const isRanged = w.properties?.some(p => p.toLowerCase().includes('ammunition'));
        // Check if weapon is thrown
        const isThrown = w.properties?.some(p => p.toLowerCase().includes('thrown'));
        // Check if weapon is finesse (can use DEX instead of STR)
        const isFinesse = w.properties?.some(p => p.toLowerCase().includes('finesse'));
        // Check if weapon is two-handed or versatile (for great weapon)
        const isTwoHanded = w.properties?.some(p => p.toLowerCase().includes('two-handed') || p.toLowerCase().includes('versatile'));
        // Check if weapon is one-handed melee (for dueling - not two-handed and no ammunition)
        const isOneHandedMelee = !isRanged && !isTwoHanded;

        // Skip duplicate thrown weapons (we'll add them consolidated)
        if (isThrown && addedThrown.has(w.name)) {
          return acc;
        }
        if (isThrown) {
          addedThrown.add(w.name);
        }

        // Determine which ability modifier to use for attack/damage
        // Ranged: DEX, Finesse: max(STR, DEX), Otherwise: STR
        let abilityMod: number;
        if (isRanged) {
          abilityMod = dexMod;
        } else if (isFinesse) {
          abilityMod = Math.max(strMod, dexMod);
        } else {
          abilityMod = strMod;
        }

        // Calculate attack bonus: ability mod + proficiency + fighting style bonuses
        let attackBonus = abilityMod + getProficiencyBonus(level);
        if (hasArchery && isRanged) {
          attackBonus += 2; // Archery fighting style
        }

        // Calculate damage: dice + ability mod + fighting style bonuses
        let damage = w.damage;
        const damageMatch = damage.match(/^(\d+d\d+)(\+(\d+))?/);

        if (damageMatch) {
          const baseDice = damageMatch[1];
          const existingBonus = parseInt(damageMatch[3] || '0');
          let bonusDamage = existingBonus + abilityMod; // Add ability modifier to damage

          // Dueling: +2 damage with one-handed melee
          if (hasDueling && isOneHandedMelee && !isThrown) {
            bonusDamage += 2;
          }
          // Thrown Weapon Fighting: +2 damage with thrown weapons
          if (hasThrownWeapon && isThrown) {
            bonusDamage += 2;
          }

          if (bonusDamage > 0) {
            damage = `${baseDice}+${bonusDamage}`;
          } else if (bonusDamage < 0) {
            damage = `${baseDice}${bonusDamage}`; // negative modifier
          } else {
            damage = baseDice;
          }
        }

        // Great Weapon Fighting: note in properties (reroll 1s/2s)
        let properties = w.properties || [];
        if (hasGreatWeapon && isTwoHanded) {
          properties = [...properties, 'GWF: reroll 1-2'];
        }

        // Get quantity for thrown weapons
        const quantity = isThrown ? (weaponCounts.get(w.name) || 1) : 1;
        const displayName = quantity > 1 ? `${w.name} (×${quantity})` : w.name;

        acc.push({
          id: `weapon-${acc.length}`,
          name: displayName,
          attackBonus,
          damage,
          properties,
          equipped: acc.length === 0,
        });

        return acc;
      }, []);

      // Convert pack equipment to character equipment
      equipment = pack.equipment.map((e, idx) => ({
        id: `equip-${idx}`,
        name: e.name,
        quantity: e.quantity,
        description: EQUIPMENT_DESCRIPTIONS[e.name] || e.name,
        category: 'gear' as const,
      }));

      // Add shield if class pack includes one
      if (pack.shield) {
        equipment.push({
          id: 'equip-shield',
          name: 'Shield',
          quantity: 1,
          equipped: true,
          category: 'shield' as const,
          armorClass: 2,
          armorType: 'shield' as const,
          description: '+2 AC',
        });
        baseAC += 2;
      }

      // Add armor to equipment if class pack includes one
      if (pack.armor) {
        // Determine armor type
        let armorType: 'light' | 'medium' | 'heavy' = 'medium';
        let maxDexBonus: number | undefined = 2;

        if (pack.armor.name.includes('Leather') || pack.armor.name.includes('Padded') || pack.armor.name.includes('Studded')) {
          armorType = 'light';
          maxDexBonus = undefined; // Full Dex for light armor
        } else if (pack.armor.name.includes('Chain Mail') || pack.armor.name.includes('Ring Mail') || pack.armor.name.includes('Splint') || pack.armor.name.includes('Plate')) {
          armorType = 'heavy';
          maxDexBonus = 0;
        }

        equipment.push({
          id: 'equip-armor',
          name: pack.armor.name,
          quantity: 1,
          description: pack.armor.description,
          equipped: true,
          category: 'armor' as const,
          armorClass: pack.armor.armorClass,
          armorType,
          maxDexBonus,
          stealthDisadvantage: armorType === 'heavy' || pack.armor.name.includes('Scale') || pack.armor.name.includes('Ring') || pack.armor.name.includes('Chain Shirt'),
        });
        // Calculate AC with armor
        if (armorType === 'light') {
          baseAC = pack.armor.armorClass + dexMod;
        } else if (armorType === 'medium') {
          baseAC = pack.armor.armorClass + Math.min(dexMod, 2);
          // Primal Order Warden adds +1 AC while wearing medium armor
          if (characterClass === 'druid' && primalOrder === 'warden') {
            baseAC += 1;
          }
        } else {
          baseAC = pack.armor.armorClass;
        }
        if (pack.shield) {
          baseAC += 2;
        }
        // Defense fighting style adds +1 AC while wearing armor
        if (hasDefense) {
          baseAC += 1;
        }
      }

      startingGold = pack.gold;
    } else {
      // Shop purchases
      const weaponItems = shopCart.filter(i => i.category === 'weapon');
      const nonWeaponItems = shopCart.filter(i => i.category !== 'weapon');

      // Group thrown weapons by name to consolidate duplicates
      const weaponCounts = new Map<string, number>();
      for (const w of weaponItems) {
        const isThrown = w.properties?.some(p => p.toLowerCase().includes('thrown'));
        if (isThrown) {
          weaponCounts.set(w.name, (weaponCounts.get(w.name) || 0) + 1);
        }
      }

      // Track which thrown weapons we've already added
      const addedThrown = new Set<string>();

      weapons = weaponItems.reduce<Character['weapons']>((acc, w) => {
        // Check if weapon is ranged (has ammunition property)
        const isRanged = w.properties?.some(p => p.toLowerCase().includes('ammunition'));
        // Check if weapon is thrown
        const isThrown = w.properties?.some(p => p.toLowerCase().includes('thrown'));
        // Check if weapon is finesse (can use DEX instead of STR)
        const isFinesse = w.properties?.some(p => p.toLowerCase().includes('finesse'));
        // Check if weapon is two-handed or versatile (for great weapon)
        const isTwoHanded = w.properties?.some(p => p.toLowerCase().includes('two-handed') || p.toLowerCase().includes('versatile'));
        // Check if weapon is one-handed melee (for dueling)
        const isOneHandedMelee = !isRanged && !isTwoHanded;

        // Skip duplicate thrown weapons (we'll add them consolidated)
        if (isThrown && addedThrown.has(w.name)) {
          return acc;
        }
        if (isThrown) {
          addedThrown.add(w.name);
        }

        // Determine which ability modifier to use for attack/damage
        // Ranged: DEX, Finesse: max(STR, DEX), Otherwise: STR
        let abilityMod: number;
        if (isRanged) {
          abilityMod = dexMod;
        } else if (isFinesse) {
          abilityMod = Math.max(strMod, dexMod);
        } else {
          abilityMod = strMod;
        }

        // Calculate attack bonus: ability mod + proficiency + fighting style bonuses
        let attackBonus = abilityMod + getProficiencyBonus(level);
        if (hasArchery && isRanged) {
          attackBonus += 2;
        }

        // Calculate damage: dice + ability mod + fighting style bonuses
        let damage = w.damage || '1d4';
        const damageMatch = damage.match(/^(\d+d\d+)(\+(\d+))?/);

        if (damageMatch) {
          const baseDice = damageMatch[1];
          const existingBonus = parseInt(damageMatch[3] || '0');
          let bonusDamage = existingBonus + abilityMod; // Add ability modifier to damage

          // Dueling: +2 damage with one-handed melee
          if (hasDueling && isOneHandedMelee && !isThrown) {
            bonusDamage += 2;
          }
          // Thrown Weapon Fighting: +2 damage with thrown weapons
          if (hasThrownWeapon && isThrown) {
            bonusDamage += 2;
          }

          if (bonusDamage > 0) {
            damage = `${baseDice}+${bonusDamage}`;
          } else if (bonusDamage < 0) {
            damage = `${baseDice}${bonusDamage}`; // negative modifier
          } else {
            damage = baseDice;
          }
        }

        // Great Weapon Fighting: note in properties (reroll 1s/2s)
        let properties = w.properties || [];
        if (hasGreatWeapon && isTwoHanded) {
          properties = [...properties, 'GWF: reroll 1-2'];
        }

        // Get quantity for thrown weapons
        const quantity = isThrown ? (weaponCounts.get(w.name) || 1) : 1;
        const displayName = quantity > 1 ? `${w.name} (×${quantity})` : w.name;

        acc.push({
          id: w.id,
          name: displayName,
          attackBonus,
          damage,
          properties,
          equipped: acc.length === 0,
        });

        return acc;
      }, []);

      // Map non-weapon items with proper armor properties
      equipment = nonWeaponItems.map(e => {
        const item: typeof equipment[number] = {
          id: e.id,
          name: e.name,
          quantity: e.quantity,
          description: e.description,
          category: e.category === 'armor' ? 'armor' : 'gear',
        };

        // Add armor properties for armor items
        if (e.category === 'armor') {
          if (e.name === 'Shield') {
            item.category = 'shield';
            item.armorType = 'shield';
            item.armorClass = 2;
            item.equipped = true;
          } else {
            item.category = 'armor';
            item.armorClass = e.armorClass;

            // Determine armor type based on name
            if (e.name.includes('Leather') || e.name.includes('Padded') || e.name.includes('Studded')) {
              item.armorType = 'light';
            } else if (e.name.includes('Chain Mail') || e.name.includes('Ring Mail') || e.name.includes('Splint') || e.name.includes('Plate')) {
              item.armorType = 'heavy';
              item.maxDexBonus = 0;
              item.stealthDisadvantage = true;
            } else {
              item.armorType = 'medium';
              item.maxDexBonus = 2;
              item.stealthDisadvantage = e.name.includes('Scale') || e.name.includes('Half Plate');
            }
            item.equipped = true;
          }
        }

        return item;
      });

      // Handle armor AC from shop purchases
      const armorItem = shopCart.find(i => i.category === 'armor' && i.armorClass && i.armorClass > 2);
      const shieldItem = shopCart.find(i => i.name === 'Shield');

      if (armorItem && armorItem.armorClass) {
        if (armorItem.name.includes('Leather') || armorItem.name.includes('Padded') || armorItem.name.includes('Studded')) {
          // Light armor - full DEX
          baseAC = armorItem.armorClass + dexMod;
        } else if (armorItem.name.includes('Chain Mail') || armorItem.name.includes('Ring Mail') || armorItem.name.includes('Splint') || armorItem.name.includes('Plate')) {
          // Heavy armor - no DEX
          baseAC = armorItem.armorClass;
        } else {
          // Medium armor - max +2 DEX
          baseAC = armorItem.armorClass + Math.min(dexMod, 2);
          // Primal Order Warden adds +1 AC while wearing medium armor
          if (characterClass === 'druid' && primalOrder === 'warden') {
            baseAC += 1;
          }
        }
        // Defense fighting style adds +1 AC while wearing armor
        if (hasDefense) {
          baseAC += 1;
        }
      }
      if (shieldItem) {
        baseAC += 2;
      }

      startingGold = Math.floor(shopGold); // Remaining gold
    }

    const now = new Date().toISOString();

    // Collect features from class and species as Feature[] type
    const features: { id: string; name: string; source: string; description: string; }[] = [];
    classFeatures.forEach((f, idx) => features.push({
      id: `class-${idx}`,
      name: f.name,
      source: CLASS_NAMES[characterClass],
      description: f.description,
    }));
    speciesTraits.features
      .filter(f => !f.level || f.level <= charLevel)
      // Skip generic "Celestial Revelation" for Aasimar - we'll add the specific chosen one below
      .filter(f => !(species === 'aasimar' && f.name === 'Celestial Revelation'))
      .forEach((f, idx) => features.push({
        id: `species-${idx}`,
        name: f.name,
        source: SPECIES_NAMES[species],
        description: f.description,
      }));

    // Add subclass features if level requirement met
    if (subclass) {
      const selectedSubclass = CLASS_SUBCLASSES[characterClass]?.find(sc => sc.name === subclass);
      if (selectedSubclass && charLevel >= selectedSubclass.levelAvailable) {
        selectedSubclass.features.forEach((f, idx) => features.push({
          id: `subclass-${idx}`,
          name: f.split(':')[0].trim(), // Get feature name before colon
          source: subclass,
          description: f.includes(':') ? f.split(':').slice(1).join(':').trim() : f,
        }));
      }
    }

    // Add subspecies/lineage-specific features based on speciesChoice
    if (species === 'elf') {
      if (speciesChoice === 'wood-elf') {
        features.push({
          id: 'wood-elf-mask',
          name: 'Mask of the Wild',
          source: 'Wood Elf',
          description: 'You can attempt to hide when lightly obscured by foliage, heavy rain, falling snow, mist, or other natural phenomena.',
        });
      } else if (speciesChoice === 'drow') {
        features.push({
          id: 'drow-darkvision',
          name: 'Superior Darkvision',
          source: 'Drow',
          description: 'Your darkvision extends to 120 feet.',
        });
        if (charLevel >= 3) {
          features.push({
            id: 'drow-faerie-fire',
            name: 'Drow Magic: Faerie Fire',
            source: 'Drow',
            description: 'You can cast Faerie Fire once per long rest. Charisma is your spellcasting ability.',
          });
        }
        if (charLevel >= 5) {
          features.push({
            id: 'drow-darkness',
            name: 'Drow Magic: Darkness',
            source: 'Drow',
            description: 'You can cast Darkness once per long rest. Charisma is your spellcasting ability.',
          });
        }
      }
    } else if (species === 'halfling') {
      if (speciesChoice === 'lightfoot') {
        features.push({
          id: 'lightfoot-stealth',
          name: 'Naturally Stealthy',
          source: 'Lightfoot Halfling',
          description: 'You can attempt to hide when obscured only by a creature at least one size larger than you.',
        });
      } else if (speciesChoice === 'stout') {
        features.push({
          id: 'stout-resilience',
          name: 'Stout Resilience',
          source: 'Stout Halfling',
          description: 'You have resistance to poison damage and advantage on saving throws against poison.',
        });
      }
    } else if (species === 'gnome') {
      if (speciesChoice === 'forest-gnome') {
        features.push({
          id: 'forest-gnome-beasts',
          name: 'Speak with Small Beasts',
          source: 'Forest Gnome',
          description: 'Through sounds and gestures, you can communicate simple ideas with Small or smaller beasts.',
        });
      } else if (speciesChoice === 'rock-gnome') {
        features.push({
          id: 'rock-gnome-tinker',
          name: 'Tinker',
          source: 'Rock Gnome',
          description: "You can spend 1 hour and 10 gp to create a Tiny clockwork device (AC 5, 1 HP). Choose: Clockwork Toy, Fire Starter, or Music Box. Lasts 24 hours unless you use an action to dismantle it.",
        });
      }
    } else if (species === 'tiefling') {
      // Tiefling spells at higher levels
      if (speciesChoice === 'abyssal' && charLevel >= 3) {
        features.push({
          id: 'abyssal-ray',
          name: 'Abyssal Legacy: Ray of Sickness',
          source: 'Abyssal Tiefling',
          description: 'You can cast Ray of Sickness once per long rest. Charisma is your spellcasting ability.',
        });
      }
      if (speciesChoice === 'abyssal' && charLevel >= 5) {
        features.push({
          id: 'abyssal-hold',
          name: 'Abyssal Legacy: Hold Person',
          source: 'Abyssal Tiefling',
          description: 'You can cast Hold Person once per long rest. Charisma is your spellcasting ability.',
        });
      }
      if (speciesChoice === 'chthonic' && charLevel >= 3) {
        features.push({
          id: 'chthonic-false-life',
          name: 'Chthonic Legacy: False Life',
          source: 'Chthonic Tiefling',
          description: 'You can cast False Life once per long rest. Charisma is your spellcasting ability.',
        });
      }
      if (speciesChoice === 'chthonic' && charLevel >= 5) {
        features.push({
          id: 'chthonic-ray',
          name: 'Chthonic Legacy: Ray of Enfeeblement',
          source: 'Chthonic Tiefling',
          description: 'You can cast Ray of Enfeeblement once per long rest. Charisma is your spellcasting ability.',
        });
      }
      if (speciesChoice === 'infernal' && charLevel >= 3) {
        features.push({
          id: 'infernal-rebuke',
          name: 'Infernal Legacy: Hellish Rebuke',
          source: 'Infernal Tiefling',
          description: 'You can cast Hellish Rebuke (2nd level) once per long rest. Charisma is your spellcasting ability.',
        });
      }
      if (speciesChoice === 'infernal' && charLevel >= 5) {
        features.push({
          id: 'infernal-darkness',
          name: 'Infernal Legacy: Darkness',
          source: 'Infernal Tiefling',
          description: 'You can cast Darkness once per long rest. Charisma is your spellcasting ability.',
        });
      }
    } else if (species === 'aasimar' && charLevel >= 3) {
      // Aasimar Celestial Revelation - add the specific form chosen by the player
      const revelationOption = SPECIES_CHOICES.aasimar?.options.find(o => o.id === speciesChoice);
      if (revelationOption) {
        features.push({
          id: 'celestial-revelation',
          name: `Celestial Revelation: ${revelationOption.name}`,
          source: 'Aasimar',
          description: `Transform for 1 minute as a bonus action (Prof bonus uses per Long Rest). ${revelationOption.description}`,
        });
      }
    }

    if (originFeat) features.push({
      id: 'origin-feat',
      name: originFeat.name,
      source: background,
      description: originFeat.description,
    });
    if (species === 'human' && humanBonusFeat) features.push({
      id: 'human-bonus-feat',
      name: humanBonusFeat,
      source: 'Human Versatile',
      description: ORIGIN_FEATS[humanBonusFeat].description,
    });

    // Convert armor proficiencies to strings
    let armorProfs: string[] = formatArmorProficiencies(classProficiencies.armor).split(', ');

    // Convert weapon proficiencies to strings
    let weaponProfs: string[] = formatWeaponProficiencies(classProficiencies.weapons).split(', ');

    // Apply Divine Order (Cleric) proficiencies
    if (characterClass === 'cleric' && divineOrder === 'protector') {
      if (!armorProfs.includes('Heavy Armor')) {
        armorProfs.push('Heavy Armor');
      }
      if (!weaponProfs.includes('Martial Weapons')) {
        weaponProfs.push('Martial Weapons');
      }
    }

    // Apply Primal Order (Druid) proficiencies
    if (characterClass === 'druid' && primalOrder === 'warden') {
      if (!weaponProfs.includes('Martial Weapons')) {
        weaponProfs.push('Martial Weapons');
      }
    }

    // Add Unarmed Strike for Monks (Martial Arts feature)
    if (characterClass === 'monk') {
      // Monk martial arts damage scales with level: 1d6 (1-4), 1d8 (5-10), 1d10 (11-16), 1d12 (17+)
      let martialArtsDie = '1d6';
      if (charLevel >= 17) martialArtsDie = '1d12';
      else if (charLevel >= 11) martialArtsDie = '1d10';
      else if (charLevel >= 5) martialArtsDie = '1d8';

      const strMod = getAbilityModifier(finalScores.strength);
      // Monks can use DEX or STR for unarmed strikes
      const attackMod = Math.max(dexMod, strMod);
      const profBonus = getProficiencyBonus(charLevel);

      weapons.push({
        id: 'weapon-unarmed',
        name: 'Unarmed Strike (Martial Arts)',
        attackBonus: attackMod + profBonus,
        damage: `${martialArtsDie}+${attackMod}`,
        properties: ['Finesse', 'Light'],
        equipped: true,
      });
    }

    // Add Unarmed Strike for Tavern Brawler feat (from origin feat or human bonus feat)
    const hasTavernBrawler = originFeat?.name === 'Tavern Brawler' || humanBonusFeat === 'Tavern Brawler';
    if (hasTavernBrawler && characterClass !== 'monk') { // Monk already has better unarmed
      const strMod = getAbilityModifier(finalScores.strength);
      const profBonus = getProficiencyBonus(charLevel);

      weapons.push({
        id: 'weapon-unarmed-tb',
        name: 'Unarmed Strike (Tavern Brawler)',
        attackBonus: strMod + profBonus,
        damage: `1d4+${strMod}`,
        properties: ['Light'],
        equipped: true,
      });
    }

    // Add Unarmed Fighting style if selected (Fighter/Paladin/Ranger)
    if (fightingStyle === 'unarmed' && characterClass !== 'monk') {
      const strMod = getAbilityModifier(finalScores.strength);
      const profBonus = getProficiencyBonus(charLevel);

      // Remove any existing unarmed strike from Tavern Brawler (Fighting Style is better)
      const tbIndex = weapons.findIndex(w => w.id === 'weapon-unarmed-tb');
      if (tbIndex !== -1) weapons.splice(tbIndex, 1);

      weapons.push({
        id: 'weapon-unarmed-fs',
        name: 'Unarmed Strike (Unarmed Fighting)',
        attackBonus: strMod + profBonus,
        damage: `1d6+${strMod}`, // 1d8 if both hands free, but we use 1d6 as baseline
        properties: ['Light'],
        equipped: true,
      });
    }

    return {
      id: `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      playerId,
      name,
      species,
      speciesChoice: speciesChoice || undefined,
      highElfCantrip: highElfCantrip || undefined,
      characterClass,
      subclass: subclass || undefined,
      subclassChoices: Object.keys(subclassChoices).length > 0 ? subclassChoices : undefined,
      fightingStyle: fightingStyle || undefined,
      divineOrder: characterClass === 'cleric' ? divineOrder : undefined,
      primalOrder: characterClass === 'druid' ? primalOrder : undefined,
      eldritchInvocations: eldritchInvocations.length > 0 ? eldritchInvocations : undefined,
      expertiseSkills: expertiseSkills.length > 0 ? expertiseSkills : undefined,
      weaponMasteries: weaponMasteries.length > 0 ? weaponMasteries : undefined,
      level: charLevel,
      background,
      alignment,
      experiencePoints: 0,
      abilityScores: finalScores,
      savingThrowProficiencies: CLASS_SAVING_THROWS[characterClass],
      skillProficiencies: finalSkills,
      armorProficiencies: armorProfs,
      weaponProficiencies: weaponProfs,
      toolProficiencies: [
        ...(background2024?.toolProficiency ? [background2024.toolProficiency] : []),
        // Rock Gnome gets Tinker's Tools
        ...(species === 'gnome' && speciesChoice === 'rock-gnome' ? ["Tinker's Tools"] : []),
        // Origin feat tool proficiencies (Crafter, Musician)
        ...(originFeat?.proficiencyChoices?.type === 'artisan' || originFeat?.proficiencyChoices?.type === 'musical'
            ? originFeatProficiencies : []),
      ],
      languages,
      armorClass: baseAC,
      initiative: dexMod,
      // Apply subspecies speed modifiers
      speed: species === 'elf' && speciesChoice === 'wood-elf' ? 35 : speciesTraits.speed,
      maxHitPoints: Math.max(1, maxHp),
      currentHitPoints: Math.max(1, maxHp),
      temporaryHitPoints: 0,
      hitDiceTotal: charLevel,
      hitDiceRemaining: charLevel,
      deathSaves: { successes: 0, failures: 0 },
      weapons,
      equipment,
      currency: { copper: 0, silver: 0, electrum: 0, gold: startingGold, platinum: 0 },
      features,
      cantrips: [
        ...selectedCantrips,
        ...(highElfCantrip ? [highElfCantrip] : []),
        ...originFeatCantrips,
        // Species innate cantrips (e.g., Aasimar Light)
        ...(speciesTraits.cantrips || []),
        // Species choice cantrips based on lineage/legacy selection
        ...(species === 'elf' && speciesChoice === 'drow' ? ['Dancing Lights'] : []),
        ...(species === 'gnome' && speciesChoice === 'forest-gnome' ? ['Minor Illusion'] : []),
        ...(species === 'tiefling' && speciesChoice === 'abyssal' ? ['Poison Spray'] : []),
        ...(species === 'tiefling' && speciesChoice === 'chthonic' ? ['Chill Touch'] : []),
        ...(species === 'tiefling' && speciesChoice === 'infernal' ? ['Thaumaturgy'] : []),
        // Monk Warrior of the Elements - Elementalism cantrip
        ...(characterClass === 'monk' && subclass === 'Warrior of the Elements' ? ['Elementalism'] : []),
        // Pact of the Tome cantrips (Warlock invocation)
        ...pactOfTomeCantrips,
        // Lessons of the First Ones cantrip (Warlock invocation)
        ...(lessonsCantrip ? [lessonsCantrip] : []),
        // Human bonus feat (Magic Initiate) cantrips
        ...humanFeatCantrips,
        // Divine Order (Thaumaturge) extra cantrip
        ...(characterClass === 'cleric' && divineOrder === 'thaumaturge' && divineOrderCantrip ? [divineOrderCantrip] : []),
        // Primal Order (Magician) extra cantrip
        ...(characterClass === 'druid' && primalOrder === 'magician' && primalOrderCantrip ? [primalOrderCantrip] : []),
      ],
      spells: [
        ...selectedSpells,
        // Human bonus feat (Magic Initiate) spells
        ...humanFeatSpells,
        ...originFeatSpells,
        // Subclass bonus spells only at level 3+
        ...(level >= 3 ? (CLASS_SUBCLASSES[characterClass]?.find(sc => sc.name === subclass)?.bonusSpells || []) : []),
        // Drow innate spells
        ...(species === 'elf' && speciesChoice === 'drow' && charLevel >= 3 ? ['Faerie Fire'] : []),
        ...(species === 'elf' && speciesChoice === 'drow' && charLevel >= 5 ? ['Darkness'] : []),
        // Tiefling legacy spells
        ...(species === 'tiefling' && speciesChoice === 'abyssal' && charLevel >= 3 ? ['Ray of Sickness'] : []),
        ...(species === 'tiefling' && speciesChoice === 'abyssal' && charLevel >= 5 ? ['Hold Person'] : []),
        ...(species === 'tiefling' && speciesChoice === 'chthonic' && charLevel >= 3 ? ['False Life'] : []),
        ...(species === 'tiefling' && speciesChoice === 'chthonic' && charLevel >= 5 ? ['Ray of Enfeeblement'] : []),
        ...(species === 'tiefling' && speciesChoice === 'infernal' && charLevel >= 3 ? ['Hellish Rebuke'] : []),
        ...(species === 'tiefling' && speciesChoice === 'infernal' && charLevel >= 5 ? ['Darkness'] : []),
      ],
      personalityTraits,
      ideals,
      bonds,
      flaws,
      backstory,
      // Appearance
      age: appearance.age || undefined,
      height: appearance.height || undefined,
      weight: appearance.weight || undefined,
      eyes: appearance.eyes || undefined,
      hair: appearance.hair || undefined,
      skin: appearance.skin || undefined,
      portrait: portrait || undefined,
      createdAt: now,
      updatedAt: now,
      // Initialize class resources (Ki, Rage, etc.)
      featureUses: (() => {
        const allFeats = [
          ...(originFeat ? [originFeat.name] : []),
          ...(species === 'human' && humanBonusFeat ? [humanBonusFeat] : []),
        ];
        const resources = getCharacterResources(characterClass, species, charLevel, finalScores, allFeats);
        const featureUses: Record<string, { used: number; max: number; restoreOn: 'short' | 'long' | 'dawn' }> = {};
        for (const [id, resource] of Object.entries(resources)) {
          featureUses[id] = {
            used: 0,
            max: resource.max,
            restoreOn: resource.restoreOn === 'short' ? 'short' : 'long',
          };
        }
        return Object.keys(featureUses).length > 0 ? featureUses : undefined;
      })(),
    };
  };

  const handleComplete = () => {
    const character = createCharacter();
    onComplete(character);
  };

  const renderBasicsStep = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="font-medieval text-base text-gold">Basics</h3>
        <div className="flex gap-1 ml-auto">
          <button
            onClick={handleQuickBuild}
            className="px-2 py-1 text-xs bg-leather/50 text-parchment rounded hover:bg-leather"
          >
            Quick Build
          </button>
          <button
            onClick={handleRandomize}
            className="px-2 py-1 text-xs bg-leather/50 text-parchment rounded hover:bg-leather"
          >
            Randomize
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-parchment text-sm mb-1">Character Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter character name" />
        </div>
        <div>
          <label className="block text-parchment text-sm mb-1">Level</label>
          <select
            value={level}
            onChange={(e) => setLevel(parseInt(e.target.value))}
            className="w-full bg-parchment text-dark-wood px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-gold"
          >
            {Array.from({ length: 20 }, (_, i) => i + 1).map(l => (
              <option key={l} value={l}>Level {l}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-parchment text-sm mb-1">Class</label>
        <SelectionButton
          value={characterClass}
          displayValue={`${CLASS_NAMES[characterClass]} (d${CLASS_HIT_DICE[characterClass]})`}
          onClick={() => setOpenModal('class')}
        />

        {/* Class Role Info Summary */}
        {(() => {
          const roleInfo = CLASS_ROLE_INFO[characterClass];
          const roleColors: Record<string, string> = {
            Tank: 'bg-blue-600', Damage: 'bg-red-600', Healer: 'bg-green-600',
            Support: 'bg-yellow-600', Controller: 'bg-purple-600', Utility: 'bg-cyan-600'
          };
          return (
            <div className={`mt-2 p-2 rounded border border-${roleInfo.color}-500/50 bg-${roleInfo.color}-900/20`}>
              <div className="flex flex-wrap gap-1 mb-1">
                {roleInfo.roles.map(role => (
                  <span key={role} className={`${roleColors[role]} text-white text-xs px-1.5 py-0.5 rounded font-medium`}>
                    {role}
                  </span>
                ))}
              </div>
              <p className="text-parchment text-xs">{roleInfo.playstyle}</p>
            </div>
          );
        })()}

        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-dark-wood p-2 rounded">
            <span className="text-parchment/70">Armor: </span>
            <span className="text-parchment">{formatArmorProficiencies(classProficiencies.armor)}</span>
          </div>
          <div className="bg-dark-wood p-2 rounded">
            <span className="text-parchment/70">Weapons: </span>
            <span className="text-parchment">{formatWeaponProficiencies(classProficiencies.weapons)}</span>
          </div>
        </div>
        {/* Class Features */}
        <div className="mt-2 bg-dark-wood p-2 rounded border border-leather">
          <div className="text-parchment/70 text-xs mb-1">Level 1 Features:</div>
          {classFeatures.map((feat, i) => (
            <div key={i} className="text-xs mb-1">
              <span className="text-gold">{feat.name}: </span>
              <span className="text-parchment/80">{feat.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Weapon Mastery (Fighter/Barbarian/Monk/Paladin/Ranger) */}
      {WEAPON_MASTERY_CLASSES[characterClass] > 0 && (
        <div className="bg-orange-900/20 border border-orange-500/50 p-3 rounded">
          <div className="flex items-center gap-2 mb-1">
            <label className="text-orange-400 text-sm font-semibold">Weapon Mastery</label>
            <span className={`text-xs px-2 py-0.5 rounded ${
              weaponMasteries.length === WEAPON_MASTERY_CLASSES[characterClass]
                ? 'bg-green-600/80 text-white'
                : 'bg-leather text-parchment/70'
            }`}>
              {weaponMasteries.length}/{WEAPON_MASTERY_CLASSES[characterClass]}
            </span>
          </div>
          <p className="text-parchment/70 text-xs mb-2">
            Choose {WEAPON_MASTERY_CLASSES[characterClass]} weapon{WEAPON_MASTERY_CLASSES[characterClass] > 1 ? 's' : ''} to gain mastery with.
            You can use their mastery property when attacking.
          </p>
          <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
            {getProficientWeapons(classProficiencies.weapons).map(weapon => {
              const isSelected = weaponMasteries.includes(weapon);
              const mastery = WEAPON_MASTERIES[weapon];
              const atMax = weaponMasteries.length >= WEAPON_MASTERY_CLASSES[characterClass];

              return (
                <button
                  key={weapon}
                  onClick={() => {
                    if (isSelected) {
                      setWeaponMasteries(weaponMasteries.filter(w => w !== weapon));
                    } else if (!atMax) {
                      setWeaponMasteries([...weaponMasteries, weapon]);
                    }
                  }}
                  disabled={!isSelected && atMax}
                  className={`text-left p-1.5 rounded text-xs transition-colors ${
                    isSelected
                      ? 'bg-orange-600/40 text-orange-200 border border-orange-500'
                      : atMax
                      ? 'bg-leather/20 text-parchment/40 cursor-not-allowed'
                      : 'bg-leather/30 hover:bg-leather/50 text-parchment/80'
                  }`}
                  title={WEAPON_MASTERY_DESCRIPTIONS[mastery]}
                >
                  <span className="font-medium">{isSelected ? '✓ ' : ''}{weapon}</span>
                  <span className="text-parchment/50 ml-1">({mastery})</span>
                </button>
              );
            })}
          </div>
          {weaponMasteries.length > 0 && (
            <div className="mt-2 pt-2 border-t border-orange-500/30 text-xs">
              <div className="text-orange-300 font-semibold mb-1">Selected Masteries:</div>
              {weaponMasteries.map(weapon => (
                <div key={weapon} className="text-parchment/80 mb-1">
                  <span className="text-orange-400">{weapon}</span> - <span className="text-gold">{WEAPON_MASTERIES[weapon]}</span>: {WEAPON_MASTERY_DESCRIPTIONS[WEAPON_MASTERIES[weapon]]}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fighting Style (Fighter/Paladin/Ranger) */}
      {FIGHTING_STYLE_CLASSES[characterClass] && level >= FIGHTING_STYLE_CLASSES[characterClass]!.level && (
        <div className="bg-red-900/20 border border-red-500/50 p-3 rounded">
          <label className="block text-red-400 text-sm mb-1">Fighting Style</label>
          <p className="text-parchment/70 text-xs mb-2">Choose a fighting style that defines your combat approach.</p>
          <select
            value={fightingStyle}
            onChange={(e) => setFightingStyle(e.target.value)}
            className="w-full bg-parchment text-dark-wood px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-gold"
          >
            {FIGHTING_STYLE_CLASSES[characterClass]!.options.map(styleId => {
              const style = FIGHTING_STYLES.find(s => s.id === styleId);
              return style ? (
                <option key={style.id} value={style.id}>{style.name}</option>
              ) : null;
            })}
          </select>
          {fightingStyle && (
            <p className="text-parchment/70 text-xs mt-2">
              {FIGHTING_STYLES.find(s => s.id === fightingStyle)?.description}
            </p>
          )}
        </div>
      )}

      {/* Divine Order (Cleric Level 1) */}
      {characterClass === 'cleric' && (
        <div className={`bg-yellow-900/20 border p-3 rounded ${!divineOrder ? 'border-red-500/70' : 'border-yellow-500/50'}`}>
          <label className="block text-yellow-400 text-sm mb-1">
            Divine Order <span className="text-red-400">*</span>
          </label>
          <p className="text-parchment/70 text-xs mb-2">Choose how your deity has prepared you for service.</p>
          <div className="grid grid-cols-2 gap-2">
            {DIVINE_ORDER_OPTIONS.map(option => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setDivineOrder(option.id);
                  if (option.id !== 'thaumaturge') setDivineOrderCantrip('');
                }}
                className={`p-2 rounded text-left text-sm transition-colors ${
                  divineOrder === option.id
                    ? 'bg-yellow-600/30 border-2 border-yellow-500 text-parchment'
                    : 'bg-dark-wood border border-leather text-parchment/70 hover:border-yellow-500/50'
                }`}
              >
                <div className="font-semibold text-yellow-400">{option.name}</div>
                <div className="text-xs mt-1">{option.description}</div>
              </button>
            ))}
          </div>
          {divineOrder && (
            <div className="mt-2 text-xs text-parchment/70">
              <strong>Benefits:</strong> {DIVINE_ORDER_OPTIONS.find(o => o.id === divineOrder)?.benefits.join(', ')}
            </div>
          )}
          {/* Thaumaturge cantrip selection */}
          {divineOrder === 'thaumaturge' && CLASS_CANTRIPS.cleric && (
            <div className="mt-3 p-2 bg-yellow-900/30 rounded border border-yellow-500/30">
              <label className="block text-yellow-300 text-xs mb-1">Extra Cleric Cantrip (Thaumaturge)</label>
              <select
                value={divineOrderCantrip}
                onChange={(e) => setDivineOrderCantrip(e.target.value)}
                className="w-full bg-parchment text-dark-wood px-2 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">Select a cantrip...</option>
                {CLASS_CANTRIPS.cleric
                  .filter(c => !selectedCantrips.includes(c.name)) // Don't show already selected cantrips
                  .map(cantrip => (
                    <option key={cantrip.name} value={cantrip.name}>{cantrip.name}</option>
                  ))}
              </select>
              {divineOrderCantrip && (
                <p className="text-parchment/60 text-xs mt-1">
                  {CLASS_CANTRIPS.cleric.find(c => c.name === divineOrderCantrip)?.description}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Primal Order (Druid Level 1) */}
      {characterClass === 'druid' && (
        <div className={`bg-green-900/20 border p-3 rounded ${!primalOrder ? 'border-red-500/70' : 'border-green-500/50'}`}>
          <label className="block text-green-400 text-sm mb-1">
            Primal Order <span className="text-red-400">*</span>
          </label>
          <p className="text-parchment/70 text-xs mb-2">Choose your connection to the primal forces of nature.</p>
          <div className="grid grid-cols-2 gap-2">
            {PRIMAL_ORDER_OPTIONS.map(option => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setPrimalOrder(option.id);
                  if (option.id !== 'magician') setPrimalOrderCantrip('');
                }}
                className={`p-2 rounded text-left text-sm transition-colors ${
                  primalOrder === option.id
                    ? 'bg-green-600/30 border-2 border-green-500 text-parchment'
                    : 'bg-dark-wood border border-leather text-parchment/70 hover:border-green-500/50'
                }`}
              >
                <div className="font-semibold text-green-400">{option.name}</div>
                <div className="text-xs mt-1">{option.description}</div>
              </button>
            ))}
          </div>
          {primalOrder && (
            <div className="mt-2 text-xs text-parchment/70">
              <strong>Benefits:</strong> {PRIMAL_ORDER_OPTIONS.find(o => o.id === primalOrder)?.benefits.join(', ')}
            </div>
          )}
          {/* Magician cantrip selection */}
          {primalOrder === 'magician' && CLASS_CANTRIPS.druid && (
            <div className="mt-3 p-2 bg-green-900/30 rounded border border-green-500/30">
              <label className="block text-green-300 text-xs mb-1">Extra Druid Cantrip (Magician)</label>
              <select
                value={primalOrderCantrip}
                onChange={(e) => setPrimalOrderCantrip(e.target.value)}
                className="w-full bg-parchment text-dark-wood px-2 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select a cantrip...</option>
                {CLASS_CANTRIPS.druid
                  .filter(c => !selectedCantrips.includes(c.name)) // Don't show already selected cantrips
                  .map(cantrip => (
                    <option key={cantrip.name} value={cantrip.name}>{cantrip.name}</option>
                  ))}
              </select>
              {primalOrderCantrip && (
                <p className="text-parchment/60 text-xs mt-1">
                  {CLASS_CANTRIPS.druid.find(c => c.name === primalOrderCantrip)?.description}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Subclass selection - show all with availability */}
      <div>
        <label className="block text-parchment text-sm mb-1">
          Subclass
          {!hasLevel1Subclass(characterClass) && (
            <span className="text-parchment/50 text-xs ml-2">(Available at level 3)</span>
          )}
        </label>
        <select
          value={subclass}
          onChange={(e) => {
            setSubclass(e.target.value);
            setSubclassChoices({}); // Reset choices when subclass changes
          }}
          disabled={!hasLevel1Subclass(characterClass) && level < 3}
          className="w-full bg-parchment text-dark-wood px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-gold disabled:opacity-50"
        >
          {getAvailableSubclasses(characterClass, 20).map(sc => (
            <option
              key={sc.name}
              value={sc.name}
              disabled={sc.levelAvailable > level}
            >
              {sc.name} {sc.levelAvailable > level ? `(Level ${sc.levelAvailable})` : ''}
            </option>
          ))}
        </select>
        {subclass && (
          <>
            <p className="text-parchment/60 text-xs mt-1">
              {CLASS_SUBCLASSES[characterClass].find(sc => sc.name === subclass)?.description}
            </p>
            <div className="mt-1">
              {CLASS_SUBCLASSES[characterClass].find(sc => sc.name === subclass)?.features.map((f, i) => (
                <p key={i} className="text-gold/80 text-xs">• {f}</p>
              ))}
            </div>
            {/* Subclass Choices */}
            {(() => {
              const selectedSubclass = CLASS_SUBCLASSES[characterClass].find(sc => sc.name === subclass);
              const subclassLevelAvailable = selectedSubclass?.levelAvailable || 1;
              const meetsLevelRequirement = level >= subclassLevelAvailable;

              if (!selectedSubclass?.choices) return null;

              // If character doesn't meet level requirement, show a note
              if (!meetsLevelRequirement) {
                return (
                  <div className="mt-3 p-2 bg-leather/30 border border-parchment/30 rounded">
                    <p className="text-parchment/60 text-xs text-center">
                      🔒 Subclass features unlock at level {subclassLevelAvailable}
                    </p>
                  </div>
                );
              }

              return selectedSubclass.choices.map(choice => {
                const selectedOptions = subclassChoices[choice.id] || [];
                const isComplete = selectedOptions.length === choice.count;

                const toggleOption = (optionId: string) => {
                  const current = subclassChoices[choice.id] || [];
                  if (current.includes(optionId)) {
                    // Remove
                    setSubclassChoices({ ...subclassChoices, [choice.id]: current.filter(id => id !== optionId) });
                  } else if (current.length < choice.count) {
                    // Add (only if we haven't reached the max)
                    setSubclassChoices({ ...subclassChoices, [choice.id]: [...current, optionId] });
                  }
                };

                return (
                  <div key={choice.id} className="mt-3 p-2 bg-dark-wood border border-gold/30 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-gold font-bold text-sm">{choice.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${isComplete ? 'bg-green-600/80 text-white' : 'bg-leather text-parchment/70'}`}>
                        {selectedOptions.length}/{choice.count}
                      </span>
                    </div>
                    <p className="text-parchment/60 text-xs mb-2">{choice.description}</p>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {choice.options.map(option => {
                        const isSelected = selectedOptions.includes(option.id);
                        const isDisabled = !isSelected && selectedOptions.length >= choice.count;

                        return (
                          <button
                            key={option.id}
                            onClick={() => toggleOption(option.id)}
                            disabled={isDisabled}
                            className={`w-full text-left p-2 rounded text-xs transition-colors ${
                              isSelected
                                ? 'bg-gold/30 border border-gold text-parchment'
                                : isDisabled
                                ? 'bg-leather/20 text-parchment/40 cursor-not-allowed'
                                : 'bg-leather/30 hover:bg-leather/50 text-parchment/80 border border-transparent'
                            }`}
                          >
                            <div className="font-semibold">{isSelected ? '✓ ' : ''}{option.name}</div>
                            <div className="text-parchment/60 mt-0.5">{option.description}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}
            {/* Bonus Spells */}
            {CLASS_SUBCLASSES[characterClass].find(sc => sc.name === subclass)?.bonusSpells && (
              <div className="mt-2 p-2 bg-blue-900/30 border border-blue-500/30 rounded">
                <span className="text-blue-400 text-xs font-semibold">Bonus Spells: </span>
                <span className="text-parchment/80 text-xs">
                  {CLASS_SUBCLASSES[characterClass].find(sc => sc.name === subclass)?.bonusSpells?.join(', ')}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Eldritch Invocations (Warlock) */}
      {characterClass === 'warlock' && (
        <div className="bg-purple-900/20 border border-purple-500/50 p-3 rounded">
          <div className="flex items-center gap-2 mb-1">
            <label className="text-purple-400 text-sm font-semibold">Eldritch Invocations</label>
            <span className={`text-xs px-2 py-0.5 rounded ${
              eldritchInvocations.length === WARLOCK_INVOCATIONS_KNOWN[level]
                ? 'bg-green-600/80 text-white'
                : 'bg-leather text-parchment/70'
            }`}>
              {eldritchInvocations.length}/{WARLOCK_INVOCATIONS_KNOWN[level]}
            </span>
          </div>
          <p className="text-parchment/70 text-xs mb-2">
            Select {WARLOCK_INVOCATIONS_KNOWN[level]} invocations. Some require prerequisites.
          </p>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {getAvailableInvocations(level).map(inv => {
              const isSelected = eldritchInvocations.includes(inv.id);
              const atMax = eldritchInvocations.length >= WARLOCK_INVOCATIONS_KNOWN[level];
              const isDisabled = !isSelected && atMax;

              const toggleInvocation = () => {
                if (isSelected) {
                  setEldritchInvocations(eldritchInvocations.filter(id => id !== inv.id));
                } else if (!atMax) {
                  setEldritchInvocations([...eldritchInvocations, inv.id]);
                }
              };

              return (
                <button
                  key={inv.id}
                  onClick={toggleInvocation}
                  disabled={isDisabled}
                  className={`w-full text-left p-2 rounded text-xs transition-colors ${
                    isSelected
                      ? 'bg-purple-600/30 border border-purple-500 text-parchment'
                      : isDisabled
                      ? 'bg-leather/20 text-parchment/40 cursor-not-allowed'
                      : 'bg-leather/30 hover:bg-leather/50 text-parchment/80 border border-transparent'
                  }`}
                >
                  <div className="font-semibold">
                    {isSelected ? '✓ ' : ''}{inv.name}
                    {inv.prerequisite && <span className="text-purple-400/70 ml-1">({inv.prerequisite})</span>}
                  </div>
                  <div className="text-parchment/60 mt-0.5">{inv.description}</div>
                </button>
              );
            })}
          </div>

          {/* Pact of the Tome Cantrip Selection */}
          {eldritchInvocations.includes('pact-of-the-tome') && (
            <div className="mt-3 pt-3 border-t border-purple-500/30">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-purple-300 text-xs font-semibold">Pact of the Tome Cantrips</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  pactOfTomeCantrips.length === 3
                    ? 'bg-green-600/80 text-white'
                    : 'bg-leather text-parchment/70'
                }`}>
                  {pactOfTomeCantrips.length}/3
                </span>
              </div>
              <p className="text-parchment/70 text-xs mb-2">Choose 3 cantrips from any class spell list.</p>
              <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
                {/* Get all unique cantrips from all classes */}
                {(() => {
                  const allCantrips = new Set<string>();
                  Object.values(CLASS_CANTRIPS).forEach(list => {
                    list?.forEach(c => allCantrips.add(c.name));
                  });
                  return Array.from(allCantrips).sort().map(cantrip => {
                    const isSelected = pactOfTomeCantrips.includes(cantrip);
                    const atMax = pactOfTomeCantrips.length >= 3;
                    return (
                      <button
                        key={cantrip}
                        onClick={() => {
                          if (isSelected) {
                            setPactOfTomeCantrips(pactOfTomeCantrips.filter(c => c !== cantrip));
                          } else if (!atMax) {
                            setPactOfTomeCantrips([...pactOfTomeCantrips, cantrip]);
                          }
                        }}
                        disabled={!isSelected && atMax}
                        className={`text-left px-2 py-1 rounded text-xs ${
                          isSelected
                            ? 'bg-purple-600/40 text-purple-200'
                            : atMax
                            ? 'text-parchment/30 cursor-not-allowed'
                            : 'text-parchment/70 hover:bg-leather/30'
                        }`}
                      >
                        {isSelected ? '✓ ' : ''}{cantrip}
                      </button>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* Lessons of the First Ones Cantrip Selection */}
          {eldritchInvocations.includes('lessons-of-the-first-ones') && (
            <div className="mt-3 pt-3 border-t border-purple-500/30">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-purple-300 text-xs font-semibold">Lessons of the First Ones Cantrip</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  lessonsCantrip
                    ? 'bg-green-600/80 text-white'
                    : 'bg-leather text-parchment/70'
                }`}>
                  {lessonsCantrip ? '1/1' : '0/1'}
                </span>
              </div>
              <p className="text-parchment/70 text-xs mb-2">Choose 1 cantrip from any class spell list.</p>
              <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
                {(() => {
                  const allCantrips = new Set<string>();
                  Object.values(CLASS_CANTRIPS).forEach(list => {
                    list?.forEach(c => allCantrips.add(c.name));
                  });
                  return Array.from(allCantrips).sort().map(cantrip => {
                    const isSelected = lessonsCantrip === cantrip;
                    return (
                      <button
                        key={cantrip}
                        onClick={() => {
                          if (isSelected) {
                            setLessonsCantrip('');
                          } else {
                            setLessonsCantrip(cantrip);
                          }
                        }}
                        className={`text-left px-2 py-1 rounded text-xs ${
                          isSelected
                            ? 'bg-purple-600/40 text-purple-200'
                            : 'text-parchment/70 hover:bg-leather/30'
                        }`}
                      >
                        {isSelected ? '✓ ' : ''}{cantrip}
                      </button>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-parchment text-sm mb-1">Background</label>
        <SelectionButton
          value={background}
          displayValue={background}
          onClick={() => setOpenModal('background')}
        />

        {/* Background Role Info Summary */}
        {(() => {
          const bgRole = BACKGROUND_ROLE_INFO[background];
          if (!bgRole) return null;
          return (
            <div className={`mt-2 p-2 rounded border border-${bgRole.color}-500/50 bg-${bgRole.color}-900/20`}>
              <p className="text-parchment text-xs italic mb-1">{bgRole.flavor}</p>
              <div className="text-xs">
                <span className="text-gold">Theme: </span>
                <span className="text-parchment/80">{bgRole.theme}</span>
              </div>
            </div>
          );
        })()}

        {/* Background Details */}
        {background2024 && (
          <div className="mt-2 bg-dark-wood p-2 rounded border border-leather text-xs">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <span className="text-parchment/70">Skills: </span>
                <span className="text-parchment">{background2024.skillProficiencies.map(s => SKILL_NAMES[s]).join(', ')}</span>
              </div>
              <div>
                <span className="text-parchment/70">Tool: </span>
                <span className="text-parchment">{background2024.toolProficiency}</span>
              </div>
            </div>
            <div className="mb-2">
              <span className="text-parchment/70">Ability Options: </span>
              <span className="text-gold">{background2024.abilityScores.map(a => ABILITY_ABBREVIATIONS[a]).join(', ')}</span>
            </div>
            {/* Origin Feat */}
            <div className="bg-gold/10 border border-gold/30 p-2 rounded">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-gold font-bold">Origin Feat: {originFeat?.name}</span>
                {(() => {
                  const featRole = originFeat?.name ? FEAT_ROLE_INFO[originFeat.name] : null;
                  if (!featRole) return null;
                  const powerColors: Record<string, string> = {
                    Combat: 'bg-red-600', Utility: 'bg-blue-600', Versatile: 'bg-purple-600'
                  };
                  return (
                    <span className={`${powerColors[featRole.power]} text-white text-xs px-1.5 py-0.5 rounded font-medium`}>
                      {featRole.power}
                    </span>
                  );
                })()}
              </div>
              {(() => {
                const featRole = originFeat?.name ? FEAT_ROLE_INFO[originFeat.name] : null;
                if (!featRole) return null;
                return (
                  <div className="mb-1">
                    <p className="text-parchment text-xs">{featRole.summary}</p>
                    <div className="text-xs mt-0.5">
                      <span className="text-gold/80">Good for: </span>
                      <span className="text-parchment/70">{featRole.goodFor.join(', ')}</span>
                    </div>
                  </div>
                );
              })()}
              <p className="text-parchment/70">{originFeat?.description}</p>
              <ul className="mt-1 text-parchment/80">
                {originFeat?.benefits.map((b, i) => (
                  <li key={i}>• {b}</li>
                ))}
              </ul>

              {/* Origin Feat Cantrip Choices (Magic Initiate) */}
              {originFeat?.cantripsFrom && originFeat?.cantripCount && (
                <div className="mt-2 p-2 bg-purple-900/20 border border-purple-500/30 rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-purple-400 text-xs font-semibold">Choose Cantrips</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      originFeatCantrips.length === originFeat.cantripCount
                        ? 'bg-green-600/80 text-white'
                        : 'bg-leather text-parchment/70'
                    }`}>
                      {originFeatCantrips.length}/{originFeat.cantripCount}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
                    {(CLASS_CANTRIPS[originFeat.cantripsFrom] || []).map(cantrip => {
                      const isSelected = originFeatCantrips.includes(cantrip.name);
                      const atMax = originFeatCantrips.length >= originFeat.cantripCount!;
                      return (
                        <button
                          key={cantrip.name}
                          onClick={() => {
                            if (isSelected) {
                              setOriginFeatCantrips(originFeatCantrips.filter(c => c !== cantrip.name));
                            } else if (!atMax) {
                              setOriginFeatCantrips([...originFeatCantrips, cantrip.name]);
                            }
                          }}
                          disabled={!isSelected && atMax}
                          className={`p-1 rounded text-left text-xs transition-colors ${
                            isSelected
                              ? 'bg-purple-600/30 border border-purple-500 text-parchment'
                              : atMax
                              ? 'bg-leather/20 text-parchment/40 cursor-not-allowed'
                              : 'bg-leather/30 hover:bg-leather/50 text-parchment/80'
                          }`}
                        >
                          {isSelected ? '✓ ' : ''}{cantrip.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Origin Feat Spell Choices (Magic Initiate) */}
              {originFeat?.spellsFrom && originFeat?.spellCount && (
                <div className="mt-2 p-2 bg-blue-900/20 border border-blue-500/30 rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-blue-400 text-xs font-semibold">Choose 1st-Level Spell</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      originFeatSpells.length === originFeat.spellCount
                        ? 'bg-green-600/80 text-white'
                        : 'bg-leather text-parchment/70'
                    }`}>
                      {originFeatSpells.length}/{originFeat.spellCount}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
                    {(CLASS_SPELLS_LEVEL_1[originFeat.spellsFrom] || []).map(spell => {
                      const isSelected = originFeatSpells.includes(spell.name);
                      const atMax = originFeatSpells.length >= originFeat.spellCount!;
                      return (
                        <button
                          key={spell.name}
                          onClick={() => {
                            if (isSelected) {
                              setOriginFeatSpells(originFeatSpells.filter(s => s !== spell.name));
                            } else if (!atMax) {
                              setOriginFeatSpells([...originFeatSpells, spell.name]);
                            }
                          }}
                          disabled={!isSelected && atMax}
                          className={`p-1 rounded text-left text-xs transition-colors ${
                            isSelected
                              ? 'bg-blue-600/30 border border-blue-500 text-parchment'
                              : atMax
                              ? 'bg-leather/20 text-parchment/40 cursor-not-allowed'
                              : 'bg-leather/30 hover:bg-leather/50 text-parchment/80'
                          }`}
                        >
                          {isSelected ? '✓ ' : ''}{spell.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Origin Feat Proficiency Choices (Crafter, Musician, Skilled) */}
              {originFeat?.proficiencyChoices && (
                <div className="mt-2 p-2 bg-amber-900/20 border border-amber-500/30 rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-amber-400 text-xs font-semibold">
                      Choose {originFeat.proficiencyChoices.type === 'artisan' ? "Artisan's Tools" :
                              originFeat.proficiencyChoices.type === 'musical' ? 'Musical Instruments' :
                              originFeat.proficiencyChoices.type === 'skill' ? 'Skills' : 'Skills or Tools'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      originFeatProficiencies.length === originFeat.proficiencyChoices.count
                        ? 'bg-green-600/80 text-white'
                        : 'bg-leather text-parchment/70'
                    }`}>
                      {originFeatProficiencies.length}/{originFeat.proficiencyChoices.count}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                    {(originFeat.proficiencyChoices.type === 'artisan' ? ARTISAN_TOOLS :
                      originFeat.proficiencyChoices.type === 'musical' ? MUSICAL_INSTRUMENTS :
                      originFeat.proficiencyChoices.type === 'skill' ? Object.keys(SKILL_NAMES) :
                      [...Object.keys(SKILL_NAMES), ...ARTISAN_TOOLS]
                    ).map(prof => {
                      const isSelected = originFeatProficiencies.includes(prof);
                      const atMax = originFeatProficiencies.length >= originFeat.proficiencyChoices!.count;
                      return (
                        <button
                          key={prof}
                          onClick={() => {
                            if (isSelected) {
                              setOriginFeatProficiencies(originFeatProficiencies.filter(p => p !== prof));
                            } else if (!atMax) {
                              setOriginFeatProficiencies([...originFeatProficiencies, prof]);
                            }
                          }}
                          disabled={!isSelected && atMax}
                          className={`px-2 py-1 rounded text-xs transition-colors ${
                            isSelected
                              ? 'bg-amber-600/30 border border-amber-500 text-parchment'
                              : atMax
                              ? 'bg-leather/20 text-parchment/40 cursor-not-allowed'
                              : 'bg-leather/30 hover:bg-leather/50 text-parchment/80'
                          }`}
                        >
                          {isSelected ? '✓ ' : ''}{typeof prof === 'string' && prof in SKILL_NAMES ? SKILL_NAMES[prof as SkillName] : prof}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Species - 2024 PHB order: Class → Background → Species */}
      <div>
        <label className="block text-parchment text-sm mb-1">Species</label>
        <SelectionButton
          value={species}
          displayValue={SPECIES_NAMES[species]}
          onClick={() => setOpenModal('species')}
        />

        {/* Species Role Info Summary */}
        {(() => {
          const speciesRole = SPECIES_ROLE_INFO[species];
          return (
            <div className={`mt-2 p-2 rounded border border-${speciesRole.color}-500/50 bg-${speciesRole.color}-900/20`}>
              <p className="text-parchment text-xs italic mb-1">{speciesRole.flavor}</p>
              <div className="text-xs">
                <span className="text-gold">Traits: </span>
                <span className="text-parchment/80">{speciesRole.traits}</span>
              </div>
            </div>
          );
        })()}

        {/* Species Traits - Mechanical */}
        <div className="mt-2 bg-dark-wood p-2 rounded border border-leather">
          <div className="grid grid-cols-3 gap-2 text-xs text-center mb-2">
            <div className="bg-leather/30 p-1 rounded">
              <div className="text-parchment/70">Speed</div>
              <div className="text-gold font-bold">{speciesTraits.speed} ft</div>
            </div>
            <div className="bg-leather/30 p-1 rounded">
              <div className="text-parchment/70">Size</div>
              <div className="text-gold font-bold">{speciesTraits.size}</div>
            </div>
            <div className="bg-leather/30 p-1 rounded">
              <div className="text-parchment/70">Darkvision</div>
              <div className="text-gold font-bold">{speciesTraits.darkvision > 0 ? `${speciesTraits.darkvision} ft` : 'None'}</div>
            </div>
          </div>
          {speciesTraits.resistances.length > 0 && (
            <p className="text-green-400 text-xs">Resistances: {speciesTraits.resistances.join(', ')}</p>
          )}
          <div className="flex flex-wrap gap-1 mt-1">
            {speciesTraits.features.filter(f => !f.level || f.level <= level).map((feat, i) => (
              <span key={i} className="bg-gold/20 text-gold px-2 py-0.5 rounded text-xs">{feat.name}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Only show old-style subspecies dropdown if species doesn't have SPECIES_CHOICES (which provides better flavor) */}
      {speciesInfo.subspecies && speciesInfo.subspecies.length > 0 && !SPECIES_CHOICES[species] && (
        <div>
          <label className="block text-parchment text-sm mb-1">Subspecies</label>
          <SelectionButton
            value={subspecies}
            displayValue={subspecies}
            onClick={() => setOpenModal('subspecies')}
          />

          {/* Subspecies Role Info Summary */}
          {(() => {
            const subRole = SUBSPECIES_ROLE_INFO[subspecies];
            if (!subRole) {
              const subDesc = speciesInfo.subspecies?.find(s => s.name === subspecies)?.description;
              return subDesc ? (
                <p className="text-parchment/60 text-xs mt-1">{subDesc}</p>
              ) : null;
            }
            return (
              <div className={`mt-2 p-2 rounded border border-${subRole.color}-500/50 bg-${subRole.color}-900/20`}>
                <p className="text-parchment text-xs italic">{subRole.playstyle}</p>
              </div>
            );
          })()}
        </div>
      )}

      {/* Species Choice (Dragonborn Ancestry, Goliath Giant Type, etc.) */}
      {SPECIES_CHOICES[species] && (
        <div className="bg-amber-900/20 border border-amber-500/50 p-3 rounded">
          <label className="block text-amber-400 text-sm mb-1">{SPECIES_CHOICES[species]!.name}</label>
          <p className="text-parchment/70 text-xs mb-2">{SPECIES_CHOICES[species]!.description}</p>
          <select
            value={speciesChoice}
            onChange={(e) => setSpeciesChoice(e.target.value)}
            className="w-full bg-parchment text-dark-wood px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-gold"
          >
            {SPECIES_CHOICES[species]!.options.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.name}</option>
            ))}
          </select>
          {speciesChoice && (
            <p className="text-parchment/70 text-xs mt-2">
              {SPECIES_CHOICES[species]!.options.find(o => o.id === speciesChoice)?.description}
            </p>
          )}
        </div>
      )}

      {/* High Elf Cantrip Choice */}
      {species === 'elf' && speciesChoice === 'high-elf' && (
        <div className="bg-blue-900/20 border border-blue-500/50 p-3 rounded">
          <label className="block text-blue-400 text-sm mb-1">High Elf Cantrip</label>
          <p className="text-parchment/70 text-xs mb-2">Choose one cantrip from the Wizard spell list. Intelligence is your spellcasting ability for it.</p>
          <select
            value={highElfCantrip}
            onChange={(e) => setHighElfCantrip(e.target.value)}
            className="w-full bg-parchment text-dark-wood px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-gold"
          >
            <option value="">Select a cantrip...</option>
            {HIGH_ELF_CANTRIPS.map(cantrip => (
              <option key={cantrip} value={cantrip}>{cantrip}</option>
            ))}
          </select>
        </div>
      )}

      {/* Human Bonus Feat */}
      {species === 'human' && (
        <div className="bg-gold/10 border border-gold/50 p-3 rounded">
          <label className="block text-gold text-sm mb-1">Versatile: Bonus Origin Feat</label>
          <p className="text-parchment/70 text-xs mb-2">Humans gain an additional Origin Feat of their choice.</p>
          <SelectionButton
            value={humanBonusFeat || ''}
            displayValue={humanBonusFeat || 'Select a feat...'}
            onClick={() => setOpenModal('feat')}
          />
          {originFeat && (
            <p className="text-parchment/50 text-xs mt-1 italic">
              Note: {originFeat.name} is already selected from your background.
            </p>
          )}
          {humanBonusFeat && (
            <div className="mt-2 text-xs">
              {(() => {
                const featRole = FEAT_ROLE_INFO[humanBonusFeat];
                const powerColors: Record<string, string> = {
                  Combat: 'bg-red-600', Utility: 'bg-blue-600', Versatile: 'bg-purple-600'
                };
                return featRole ? (
                  <div className={`p-2 rounded border border-${featRole.color}-500/50 bg-${featRole.color}-900/20 mb-2`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`${powerColors[featRole.power]} text-white text-xs px-1.5 py-0.5 rounded font-medium`}>
                        {featRole.power}
                      </span>
                    </div>
                    <p className="text-parchment/80">{featRole.summary}</p>
                  </div>
                ) : null;
              })()}
              <ul className="text-gold/80">
                {ORIGIN_FEATS[humanBonusFeat].benefits.map((b, i) => (
                  <li key={i}>• {b}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Magic Initiate cantrip/spell selection for Human bonus feat */}
          {humanBonusFeat && ORIGIN_FEATS[humanBonusFeat]?.cantripsFrom && (
            <div className="mt-3 pt-3 border-t border-gold/30">
              <h4 className="text-gold text-sm font-semibold mb-2">
                {humanBonusFeat} Cantrips ({humanFeatCantrips.length}/{ORIGIN_FEATS[humanBonusFeat].cantripCount || 2})
              </h4>
              <div className="grid grid-cols-2 gap-1 max-h-24 overflow-y-auto mb-3">
                {(CLASS_CANTRIPS[ORIGIN_FEATS[humanBonusFeat].cantripsFrom!] || []).map(cantrip => {
                  const isSelected = humanFeatCantrips.includes(cantrip.name);
                  const maxCantrips = ORIGIN_FEATS[humanBonusFeat!].cantripCount || 2;
                  return (
                    <button
                      key={cantrip.name}
                      onClick={() => {
                        if (isSelected) {
                          setHumanFeatCantrips(humanFeatCantrips.filter(c => c !== cantrip.name));
                        } else if (humanFeatCantrips.length < maxCantrips) {
                          setHumanFeatCantrips([...humanFeatCantrips, cantrip.name]);
                        }
                      }}
                      disabled={!isSelected && humanFeatCantrips.length >= maxCantrips}
                      className={`text-left px-2 py-1 rounded text-xs ${
                        isSelected
                          ? 'bg-purple-600/40 text-purple-200'
                          : 'text-parchment/70 hover:bg-leather/30 disabled:opacity-50'
                      }`}
                    >
                      {isSelected ? '✓ ' : ''}{cantrip.name}
                    </button>
                  );
                })}
              </div>

              <h4 className="text-gold text-sm font-semibold mb-2">
                {humanBonusFeat} Spell ({humanFeatSpells.length}/{ORIGIN_FEATS[humanBonusFeat].spellCount || 1})
              </h4>
              <div className="grid grid-cols-2 gap-1 max-h-24 overflow-y-auto">
                {(CLASS_SPELLS_LEVEL_1[ORIGIN_FEATS[humanBonusFeat].spellsFrom!] || []).map(spell => {
                  const isSelected = humanFeatSpells.includes(spell.name);
                  const maxSpells = ORIGIN_FEATS[humanBonusFeat!].spellCount || 1;
                  return (
                    <button
                      key={spell.name}
                      onClick={() => {
                        if (isSelected) {
                          setHumanFeatSpells(humanFeatSpells.filter(s => s !== spell.name));
                        } else if (humanFeatSpells.length < maxSpells) {
                          setHumanFeatSpells([...humanFeatSpells, spell.name]);
                        }
                      }}
                      disabled={!isSelected && humanFeatSpells.length >= maxSpells}
                      className={`text-left px-2 py-1 rounded text-xs ${
                        isSelected
                          ? 'bg-blue-600/40 text-blue-200'
                          : 'text-parchment/70 hover:bg-leather/30 disabled:opacity-50'
                      }`}
                    >
                      {isSelected ? '✓ ' : ''}{spell.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Languages */}
      <div>
        <label className="block text-parchment text-sm mb-1">Languages ({languages.length}/3)</label>
        <p className="text-parchment/60 text-xs mb-2">You know Common plus 2 additional languages.</p>
        <div className="flex flex-wrap gap-1">
          {STANDARD_LANGUAGES.map(lang => (
            <button
              key={lang}
              onClick={() => toggleLanguage(lang)}
              disabled={lang === 'Common'}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                languages.includes(lang)
                  ? 'bg-gold text-dark-wood font-bold'
                  : 'bg-leather/50 text-parchment hover:bg-leather'
              } ${lang === 'Common' ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {lang}
            </button>
          ))}
        </div>
        <p className="text-parchment/50 text-xs mt-2">Rare Languages:</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {RARE_LANGUAGES.map(lang => (
            <button
              key={lang}
              onClick={() => toggleLanguage(lang)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                languages.includes(lang)
                  ? 'bg-gold text-dark-wood font-bold'
                  : 'bg-leather/30 text-parchment/70 hover:bg-leather/50'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
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
          <Button size="sm" variant={abilityMethod === 'pointbuy' ? 'primary' : 'secondary'} onClick={initPointBuy}>
            Point Buy
          </Button>
        </div>

        <p className="text-parchment/70 text-xs">
          {abilityMethod === 'standard'
            ? `${CLASS_NAMES[characterClass]} Standard Array: Optimized for ${CLASS_NAMES[characterClass]}. Click arrows to swap.`
            : abilityMethod === 'roll'
            ? 'Rolled scores. Click arrows to swap values or re-roll.'
            : `Point Buy: 27 points. Scores 8-15. Points remaining: ${pointBuyPoints}`}
        </p>

        {/* Point Buy remaining points indicator */}
        {abilityMethod === 'pointbuy' && (
          <div className="bg-gold/20 p-2 rounded text-center">
            <span className="text-parchment">Points Remaining: </span>
            <span className={`font-bold text-xl ${pointBuyPoints > 0 ? 'text-gold' : pointBuyPoints < 0 ? 'text-red-400' : 'text-green-400'}`}>
              {pointBuyPoints}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {abilities.map((ability, idx) => (
            <div key={ability} className="bg-dark-wood p-3 rounded border border-leather">
              <label className="block text-parchment text-sm mb-1">
                {ABILITY_NAMES[ability]} ({ABILITY_ABBREVIATIONS[ability]})
              </label>
              <div className="flex items-center justify-between">
                {abilityMethod === 'pointbuy' ? (
                  /* Point Buy controls */
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => adjustPointBuyScore(ability, -1)}
                      disabled={abilityScores[ability] <= 8}
                      className="w-8 h-8 bg-leather rounded text-parchment hover:bg-gold hover:text-dark-wood disabled:opacity-30 disabled:hover:bg-leather disabled:hover:text-parchment font-bold"
                    >
                      −
                    </button>
                    <div className="text-center">
                      <span className="text-gold font-bold text-2xl">{abilityScores[ability]}</span>
                      <div className="text-parchment/50 text-xs">cost: {getPointBuyCost(abilityScores[ability])}</div>
                    </div>
                    <button
                      onClick={() => adjustPointBuyScore(ability, 1)}
                      disabled={abilityScores[ability] >= 15 || pointBuyPoints < (getPointBuyCost(abilityScores[ability] + 1) - getPointBuyCost(abilityScores[ability]))}
                      className="w-8 h-8 bg-leather rounded text-parchment hover:bg-gold hover:text-dark-wood disabled:opacity-30 disabled:hover:bg-leather disabled:hover:text-parchment font-bold"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  /* Standard/Roll swap controls */
                  <>
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
                  </>
                )}
              </div>
              {abilityMethod !== 'pointbuy' && (
                <div className="text-parchment/50 text-xs text-right">
                  ({formatModifier(getAbilityModifier(abilityScores[ability]))})
                </div>
              )}
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

        {/* Ability Score Increases (Origin Bonuses) */}
        <div className="mt-6 pt-4 border-t border-leather">
          <h4 className="font-medieval text-md text-gold mb-2">Origin Ability Bonuses</h4>
          <p className="text-parchment/70 text-xs mb-2">
            Your background ({background}) allows bonuses to: <span className="text-gold font-semibold">{backgroundAbilities.map(a => ABILITY_ABBREVIATIONS[a]).join(', ')}</span>
          </p>
          <p className="text-parchment/70 text-xs mb-3">
            Choose one option:
          </p>

          <div className="flex gap-2 mb-3">
            <Button
              size="sm"
              variant={asiMethod === '2-1' ? 'primary' : 'secondary'}
              onClick={() => handleAsiMethodChange('2-1')}
            >
              +2 / +1
            </Button>
            <Button
              size="sm"
              variant={asiMethod === '1-1-1' ? 'primary' : 'secondary'}
              onClick={() => handleAsiMethodChange('1-1-1')}
            >
              +1 / +1 / +1
            </Button>
          </div>

          {asiMethod === '2-1' ? (
            <div className="space-y-3">
              <div>
                <label className="text-parchment/70 text-sm mb-1 block">+2 Bonus:</label>
                <div className="flex flex-wrap gap-2">
                  {backgroundAbilities.map(ability => (
                    <button
                      key={`plus2-${ability}`}
                      onClick={() => {
                        if (asiPlus1 === ability) setAsiPlus1(null);
                        setAsiPlus2(asiPlus2 === ability ? null : ability);
                      }}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        asiPlus2 === ability
                          ? 'bg-gold text-dark-wood font-bold'
                          : 'bg-leather/50 text-parchment hover:bg-leather'
                      }`}
                    >
                      {ABILITY_ABBREVIATIONS[ability]}
                      {asiPlus2 === ability && ' +2'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-parchment/70 text-sm mb-1 block">+1 Bonus (different ability):</label>
                <div className="flex flex-wrap gap-2">
                  {backgroundAbilities.filter(a => a !== asiPlus2).map(ability => (
                    <button
                      key={`plus1-${ability}`}
                      onClick={() => setAsiPlus1(asiPlus1 === ability ? null : ability)}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        asiPlus1 === ability
                          ? 'bg-gold text-dark-wood font-bold'
                          : 'bg-leather/50 text-parchment hover:bg-leather'
                      }`}
                    >
                      {ABILITY_ABBREVIATIONS[ability]}
                      {asiPlus1 === ability && ' +1'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="text-parchment/70 text-sm mb-1 block">
                +1 to all three abilities:
              </label>
              <div className="flex flex-wrap gap-2">
                {backgroundAbilities.map(ability => (
                  <span
                    key={`triple-${ability}`}
                    className="px-3 py-1 rounded text-sm bg-gold text-dark-wood font-bold"
                  >
                    {ABILITY_ABBREVIATIONS[ability]} +1
                  </span>
                ))}
              </div>
              <p className="text-parchment/50 text-xs mt-2">
                The +1/+1/+1 option applies +1 to all three of your background's designated abilities.
              </p>
            </div>
          )}

          {/* Final Scores Preview */}
          {((asiMethod === '2-1' && (asiPlus2 || asiPlus1)) || asiMethod === '1-1-1') && (
            <div className="mt-4 bg-dark-wood p-3 rounded border border-gold/50">
              <div className="text-gold text-sm mb-2">Final Ability Scores (with bonuses):</div>
              <div className="grid grid-cols-6 gap-1 text-center">
                {abilities.map(ability => {
                  const baseScore = abilityScores[ability];
                  const finalScore = getFinalAbilityScores()[ability];
                  const hasBonus = finalScore > baseScore;
                  return (
                    <div key={`final-${ability}`} className={`p-2 rounded ${hasBonus ? 'bg-gold/20' : 'bg-leather/30'}`}>
                      <div className="text-parchment/70 text-xs">{ABILITY_ABBREVIATIONS[ability]}</div>
                      <div className={`font-bold ${hasBonus ? 'text-gold' : 'text-parchment'}`}>
                        {finalScore}
                      </div>
                      {hasBonus && (
                        <div className="text-green-400 text-xs">+{finalScore - baseScore}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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

        {/* Expertise (Rogue/Bard) */}
        {EXPERTISE_CLASSES[characterClass] && level >= EXPERTISE_CLASSES[characterClass]!.level && (
          <div className="bg-cyan-900/20 border border-cyan-500/50 p-3 rounded">
            <div className="flex items-center gap-2 mb-1">
              <label className="text-cyan-400 text-sm font-semibold">Expertise</label>
              <span className={`text-xs px-2 py-0.5 rounded ${
                expertiseSkills.length === EXPERTISE_CLASSES[characterClass]!.count
                  ? 'bg-green-600/80 text-white'
                  : 'bg-leather text-parchment/70'
              }`}>
                {expertiseSkills.length}/{EXPERTISE_CLASSES[characterClass]!.count}
              </span>
            </div>
            <p className="text-parchment/70 text-xs mb-2">
              Choose {EXPERTISE_CLASSES[characterClass]!.count} skills to gain expertise in (double proficiency bonus).
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[...backgroundInfo.skillProficiencies, ...selectedClassSkills].map(skill => {
                const isSelected = expertiseSkills.includes(skill);
                const atMax = expertiseSkills.length >= EXPERTISE_CLASSES[characterClass]!.count;
                const isDisabled = !isSelected && atMax;

                const toggleExpertise = () => {
                  if (isSelected) {
                    setExpertiseSkills(expertiseSkills.filter(s => s !== skill));
                  } else if (!atMax) {
                    setExpertiseSkills([...expertiseSkills, skill]);
                  }
                };

                return (
                  <button
                    key={skill}
                    onClick={toggleExpertise}
                    disabled={isDisabled}
                    className={`p-2 rounded text-left text-sm transition-colors ${
                      isSelected
                        ? 'bg-cyan-600/30 border border-cyan-500 text-parchment'
                        : isDisabled
                        ? 'bg-leather/20 text-parchment/40 cursor-not-allowed border border-transparent'
                        : 'bg-leather/30 hover:bg-leather/50 text-parchment/80 border border-transparent'
                    }`}
                  >
                    <span>{isSelected ? '★ ' : ''}{SKILL_NAMES[skill]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSpellsStep = () => {
    const cantrips = CLASS_CANTRIPS[characterClass] || [];
    const spells = CLASS_SPELLS_LEVEL_1[characterClass] || [];
    const cantripsNeeded = CANTRIPS_KNOWN[characterClass] || 0;
    const spellsNeeded = SPELLS_AT_LEVEL_1[characterClass] || 2;

    // Gather acquired cantrips and spells from various sources
    const acquiredCantrips: { name: string; source: string }[] = [];
    const acquiredSpells: { name: string; source: string }[] = [];

    // Species innate cantrips (e.g., Aasimar Light)
    const speciesTraits = SPECIES_TRAITS[species];
    if (speciesTraits.cantrips) {
      speciesTraits.cantrips.forEach(c => {
        acquiredCantrips.push({ name: c, source: SPECIES_NAMES[species] });
      });
    }

    // Species choice cantrips (lineage/legacy)
    if (species === 'elf' && speciesChoice === 'drow') {
      acquiredCantrips.push({ name: 'Dancing Lights', source: 'Drow' });
    }
    if (species === 'gnome' && speciesChoice === 'forest-gnome') {
      acquiredCantrips.push({ name: 'Minor Illusion', source: 'Forest Gnome' });
    }
    if (species === 'tiefling') {
      if (speciesChoice === 'abyssal') acquiredCantrips.push({ name: 'Poison Spray', source: 'Abyssal Legacy' });
      if (speciesChoice === 'chthonic') acquiredCantrips.push({ name: 'Chill Touch', source: 'Chthonic Legacy' });
      if (speciesChoice === 'infernal') acquiredCantrips.push({ name: 'Thaumaturgy', source: 'Infernal Legacy' });
    }

    // High Elf cantrip (wizard cantrip choice)
    if (highElfCantrip) {
      acquiredCantrips.push({ name: highElfCantrip, source: 'High Elf' });
    }

    // Origin feat cantrips and spells
    originFeatCantrips.forEach(c => {
      acquiredCantrips.push({ name: c, source: 'Origin Feat' });
    });
    originFeatSpells.forEach(s => {
      acquiredSpells.push({ name: s, source: 'Origin Feat' });
    });

    // Subclass bonus spells (only at level 3+ when subclass is gained)
    if (level >= 3) {
      const subclassBonusSpells = CLASS_SUBCLASSES[characterClass]?.find(sc => sc.name === subclass)?.bonusSpells || [];
      subclassBonusSpells.forEach(s => {
        acquiredSpells.push({ name: s, source: subclass || 'Subclass' });
      });
    }

    // Monk Warrior of the Elements - Elementalism cantrip
    if (characterClass === 'monk' && subclass === 'Warrior of the Elements') {
      acquiredCantrips.push({ name: 'Elementalism', source: 'Warrior of the Elements' });
    }

    // Pact of the Tome cantrips (Warlock invocation)
    pactOfTomeCantrips.forEach(c => {
      acquiredCantrips.push({ name: c, source: 'Pact of the Tome' });
    });

    // Lessons of the First Ones cantrip (Warlock invocation)
    if (lessonsCantrip) {
      acquiredCantrips.push({ name: lessonsCantrip, source: 'Lessons of the First Ones' });
    }

    // Human bonus feat (Magic Initiate) cantrips and spells
    humanFeatCantrips.forEach(c => {
      acquiredCantrips.push({ name: c, source: humanBonusFeat || 'Human Feat' });
    });
    humanFeatSpells.forEach(s => {
      acquiredSpells.push({ name: s, source: humanBonusFeat || 'Human Feat' });
    });

    // Check if this is a non-spellcaster just viewing acquired cantrips
    const isNonSpellcaster = !classInfo.isSpellcaster && cantripsNeeded === 0;

    return (
      <div className="space-y-3 flex flex-col h-full">
        <div>
          <h3 className="font-medieval text-lg text-gold">
            {isNonSpellcaster ? 'Acquired Magic' : 'Spellcasting'}
          </h3>
          {classInfo.spellcastingAbility && (
            <p className="text-parchment/70 text-xs">
              Spellcasting Ability: {ABILITY_NAMES[classInfo.spellcastingAbility]}
            </p>
          )}
          {isNonSpellcaster && (
            <p className="text-parchment/70 text-xs">
              Your species or background grants you the following magical abilities.
            </p>
          )}
        </div>

        {/* Acquired Cantrips/Spells from Race/Background/Subclass */}
        {(acquiredCantrips.length > 0 || acquiredSpells.length > 0) && (
          <div className="bg-green-900/20 border border-green-500/50 rounded p-3 space-y-2">
            <h4 className="text-green-400 text-sm font-semibold">✓ Already Acquired</h4>
            {acquiredCantrips.length > 0 && (
              <div>
                <span className="text-parchment/70 text-xs">Cantrips: </span>
                <span className="text-purple-300 text-xs">
                  {acquiredCantrips.map(c => `${c.name} (${c.source})`).join(', ')}
                </span>
              </div>
            )}
            {acquiredSpells.length > 0 && (
              <div>
                <span className="text-parchment/70 text-xs">Spells: </span>
                <span className="text-blue-300 text-xs">
                  {acquiredSpells.map(s => `${s.name} (${s.source})`).join(', ')}
                </span>
              </div>
            )}
          </div>
        )}

        {cantrips.length > 0 && (
          <div className="flex-1 flex flex-col min-h-0">
            <h4 className="text-purple-400 text-sm mb-2">
              Class Cantrips ({selectedCantrips.length}/{cantripsNeeded})
            </h4>
            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              {cantrips.map(cantrip => {
                const isSelected = selectedCantrips.includes(cantrip.name);
                const isAlreadyAcquired = acquiredCantrips.some(ac => ac.name === cantrip.name);
                return (
                  <button
                    key={cantrip.name}
                    onClick={() => !isAlreadyAcquired && toggleCantrip(cantrip.name)}
                    disabled={isAlreadyAcquired || (!isSelected && selectedCantrips.length >= cantripsNeeded)}
                    className={`w-full p-3 rounded text-left text-xs transition-colors ${
                      isAlreadyAcquired
                        ? 'bg-green-900/30 border border-green-500/50 text-green-400/70 cursor-not-allowed'
                        : isSelected
                        ? 'bg-purple-500/20 border-2 border-purple-500 text-purple-300'
                        : 'bg-dark-wood border border-leather text-parchment hover:border-purple-500/50 disabled:opacity-50'
                    }`}
                  >
                    <div className="font-semibold text-sm">{isAlreadyAcquired ? '✓ ' : ''}{cantrip.name}</div>
                    <div className="text-parchment/70 mt-1">{isAlreadyAcquired ? 'Already acquired' : cantrip.description}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {spells.length > 0 && (
          <div className="flex-1 flex flex-col min-h-0">
            <h4 className="text-blue-400 text-sm mb-2">
              Class 1st Level Spells ({selectedSpells.length}/{Math.min(spellsNeeded, spells.length)})
            </h4>
            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              {spells.map(spell => {
                const isSelected = selectedSpells.includes(spell.name);
                const isAlreadyAcquired = acquiredSpells.some(as => as.name === spell.name);
                return (
                  <button
                    key={spell.name}
                    onClick={() => !isAlreadyAcquired && toggleSpell(spell.name)}
                    disabled={isAlreadyAcquired || (!isSelected && selectedSpells.length >= spellsNeeded)}
                    className={`w-full p-3 rounded text-left text-xs transition-colors ${
                      isAlreadyAcquired
                        ? 'bg-green-900/30 border border-green-500/50 text-green-400/70 cursor-not-allowed'
                        : isSelected
                        ? 'bg-blue-500/20 border-2 border-blue-500 text-blue-300'
                        : 'bg-dark-wood border border-leather text-parchment hover:border-blue-500/50 disabled:opacity-50'
                    }`}
                  >
                    <div className="font-semibold text-sm">{isAlreadyAcquired ? '✓ ' : ''}{spell.name}</div>
                    <div className="text-parchment/70 mt-1">{isAlreadyAcquired ? 'Already acquired' : spell.description}</div>
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

            {/* Proficiency Filter */}
            <label className="flex items-center gap-2 text-parchment text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyProficient}
                onChange={(e) => setShowOnlyProficient(e.target.checked)}
                className="w-4 h-4 accent-gold"
              />
              <span>Show only proficient weapons/armor</span>
            </label>

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

      {/* Portrait */}
      <div className="bg-dark-wood p-3 rounded border border-leather">
        <h4 className="text-gold text-sm mb-2">Character Portrait</h4>
        <PortraitSelector value={portrait} onChange={setPortrait} />
      </div>

      {/* Appearance Fields */}
      <div className="bg-dark-wood p-3 rounded border border-leather">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-gold text-sm">Physical Appearance</h4>
          <Button size="sm" variant="secondary" onClick={randomizeAppearance}>Randomize</Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-parchment/70 text-xs block mb-1">Age</label>
            <Input
              value={appearance.age}
              onChange={(e) => setAppearance(prev => ({ ...prev, age: e.target.value }))}
              placeholder="e.g. 25"
              className="text-xs"
            />
          </div>
          <div>
            <label className="text-parchment/70 text-xs block mb-1">Height</label>
            <Input
              value={appearance.height}
              onChange={(e) => setAppearance(prev => ({ ...prev, height: e.target.value }))}
              placeholder="e.g. 5'10"
              className="text-xs"
            />
          </div>
          <div>
            <label className="text-parchment/70 text-xs block mb-1">Weight</label>
            <Input
              value={appearance.weight}
              onChange={(e) => setAppearance(prev => ({ ...prev, weight: e.target.value }))}
              placeholder="e.g. 160 lbs"
              className="text-xs"
            />
          </div>
          <div>
            <label className="text-parchment/70 text-xs block mb-1">Eyes</label>
            <Input
              value={appearance.eyes}
              onChange={(e) => setAppearance(prev => ({ ...prev, eyes: e.target.value }))}
              placeholder="e.g. Blue"
              className="text-xs"
            />
          </div>
          <div>
            <label className="text-parchment/70 text-xs block mb-1">Hair</label>
            <Input
              value={appearance.hair}
              onChange={(e) => setAppearance(prev => ({ ...prev, hair: e.target.value }))}
              placeholder="e.g. Black"
              className="text-xs"
            />
          </div>
          <div>
            <label className="text-parchment/70 text-xs block mb-1">Skin</label>
            <Input
              value={appearance.skin}
              onChange={(e) => setAppearance(prev => ({ ...prev, skin: e.target.value }))}
              placeholder="e.g. Tan"
              className="text-xs"
            />
          </div>
        </div>
      </div>

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
    const profBonus = getProficiencyBonus(level);
    const finalScores = getFinalAbilityScores();

    const allProficientSkills = [
      ...backgroundInfo.skillProficiencies,
      ...selectedClassSkills,
    ];

    // Collect all feats
    const allFeats: string[] = [];
    if (originFeat) allFeats.push(originFeat.name);
    if (species === 'human' && humanBonusFeat) allFeats.push(humanBonusFeat);

    return (
      <div className="space-y-4">
        <h3 className="font-medieval text-lg text-gold">Review Your Character</h3>

        <div className="bg-dark-wood p-4 rounded border border-leather space-y-3">
          <div className="text-center border-b border-leather pb-3">
            <h4 className="font-medieval text-2xl text-gold">{name || 'Unnamed Character'}</h4>
            <p className="text-parchment">
              {SPECIES_NAMES[species]} {subspecies && `(${subspecies})`} {CLASS_NAMES[characterClass]} (Level {level})
            </p>
            {subclass && (hasLevel1Subclass(characterClass) || level >= 3) && (
              <p className="text-gold/80 text-sm">{subclass}</p>
            )}
            <p className="text-parchment/70 text-sm">{background} • {alignment}</p>
          </div>

          {/* Subclass Choices Display */}
          {subclass && Object.keys(subclassChoices).length > 0 && (
            <div className="bg-gold/10 p-2 rounded border border-gold/30">
              {CLASS_SUBCLASSES[characterClass].find(sc => sc.name === subclass)?.choices?.map(choice => {
                const selected = subclassChoices[choice.id] || [];
                if (selected.length === 0) return null;
                return (
                  <div key={choice.id} className="mb-1 last:mb-0">
                    <span className="text-gold text-xs font-semibold">{choice.name}: </span>
                    <span className="text-parchment text-xs">
                      {selected.map(optionId =>
                        choice.options.find(o => o.id === optionId)?.name
                      ).filter(Boolean).join(', ')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-leather/50 p-2 rounded">
              <div className="text-gold font-bold text-xl">{10 + getAbilityModifier(finalScores.dexterity)}</div>
              <div className="text-parchment/70 text-xs">AC</div>
            </div>
            <div className="bg-leather/50 p-2 rounded">
              <div className="text-gold font-bold text-xl">{maxHp}</div>
              <div className="text-parchment/70 text-xs">HP</div>
            </div>
            <div className="bg-leather/50 p-2 rounded">
              <div className="text-gold font-bold text-xl">{speciesTraits.speed} ft</div>
              <div className="text-parchment/70 text-xs">Speed</div>
            </div>
            <div className="bg-leather/50 p-2 rounded">
              <div className="text-gold font-bold text-xl">+{profBonus}</div>
              <div className="text-parchment/70 text-xs">Prof</div>
            </div>
          </div>

          {/* Species Traits */}
          {(speciesTraits.darkvision > 0 || speciesTraits.resistances.length > 0) && (
            <div className="flex flex-wrap gap-2 text-xs">
              {speciesTraits.darkvision > 0 && (
                <span className="bg-purple-900/30 text-purple-300 px-2 py-0.5 rounded">
                  Darkvision {speciesTraits.darkvision}ft
                </span>
              )}
              {speciesTraits.resistances.map(r => (
                <span key={r} className="bg-green-900/30 text-green-300 px-2 py-0.5 rounded">
                  Resist {r}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-6 gap-1 text-center">
            {(Object.keys(ABILITY_ABBREVIATIONS) as (keyof AbilityScores)[]).map(ability => {
              const baseScore = abilityScores[ability];
              const finalScore = finalScores[ability];
              const hasBonus = finalScore > baseScore;
              return (
                <div key={ability} className={`p-2 rounded ${hasBonus ? 'bg-gold/20' : 'bg-leather/30'}`}>
                  <div className="text-parchment/70 text-xs">{ABILITY_ABBREVIATIONS[ability]}</div>
                  <div className={`font-bold ${hasBonus ? 'text-gold' : 'text-parchment'}`}>{finalScore}</div>
                  <div className="text-parchment text-xs">
                    {formatModifier(getAbilityModifier(finalScore))}
                  </div>
                </div>
              );
            })}
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

          {/* Languages */}
          <div>
            <div className="text-parchment/70 text-xs mb-1">Languages:</div>
            <div className="flex flex-wrap gap-1">
              {languages.map(lang => (
                <span key={lang} className="bg-blue-900/30 text-blue-300 px-2 py-0.5 rounded text-xs">{lang}</span>
              ))}
            </div>
          </div>

          {/* Feats */}
          {allFeats.length > 0 && (
            <div>
              <div className="text-parchment/70 text-xs mb-1">Feats:</div>
              <div className="flex flex-wrap gap-1">
                {allFeats.map(feat => (
                  <span key={feat} className="bg-orange-900/30 text-orange-300 px-2 py-0.5 rounded text-xs">{feat}</span>
                ))}
              </div>
            </div>
          )}

          {/* Class Features */}
          {classFeatures.length > 0 && (
            <div>
              <div className="text-parchment/70 text-xs mb-1">Class Features:</div>
              <div className="flex flex-wrap gap-1">
                {classFeatures.map(f => (
                  <span key={f.name} className="bg-red-900/30 text-red-300 px-2 py-0.5 rounded text-xs">{f.name}</span>
                ))}
              </div>
            </div>
          )}

          {/* Weapon Masteries */}
          {weaponMasteries.length > 0 && (
            <div>
              <div className="text-parchment/70 text-xs mb-1">Weapon Masteries:</div>
              <div className="flex flex-wrap gap-1">
                {weaponMasteries.map(weapon => (
                  <span key={weapon} className="bg-orange-900/30 text-orange-300 px-2 py-0.5 rounded text-xs">
                    {weapon} ({WEAPON_MASTERIES[weapon]})
                  </span>
                ))}
              </div>
            </div>
          )}

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

          <div className="text-parchment/70 text-xs border-t border-leather pt-2">
            Hit Dice: {level}d{hitDie} | Proficiency Bonus: +{profBonus}
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

  // Build selection options for modals
  const classOptions: SelectionOption[] = CLASS_LIST.map(c => {
    const roleInfo = CLASS_ROLE_INFO[c];
    return {
      id: c,
      name: CLASS_NAMES[c],
      hitDie: CLASS_HIT_DICE[c],
      roles: roleInfo.roles,
      playstyle: roleInfo.playstyle,
      keyStats: roleInfo.keyStats,
      complexity: roleInfo.complexity,
      goodFor: roleInfo.goodFor,
      color: roleInfo.color,
    };
  });

  const speciesOptions: SelectionOption[] = SPECIES_LIST.map(s => {
    const roleInfo = SPECIES_ROLE_INFO[s];
    const speciesFullInfo = SPECIES_INFO[s];
    return {
      id: s,
      name: SPECIES_NAMES[s],
      traits: roleInfo.traits,
      traitsList: speciesFullInfo.traits, // Full trait descriptions
      bestFor: roleInfo.bestFor,
      flavor: roleInfo.flavor,
      color: roleInfo.color,
    };
  });

  const subspeciesOptions: SelectionOption[] = (speciesInfo.subspecies || []).map(sub => {
    const roleInfo = SUBSPECIES_ROLE_INFO[sub.name];
    return {
      id: sub.name,
      name: sub.name,
      description: sub.description,
      summary: roleInfo?.summary,
      playstyle: roleInfo?.playstyle,
      goodFor: roleInfo?.goodFor,
      color: roleInfo?.color || 'amber',
    };
  });

  const backgroundOptions: SelectionOption[] = BACKGROUNDS.map(b => {
    const roleInfo = BACKGROUND_ROLE_INFO[b];
    const bg2024 = BACKGROUNDS_2024[b];
    const featData = bg2024 ? ORIGIN_FEATS[bg2024.originFeat] : undefined;
    // Combine flavor and theme into one description
    const combinedDesc = [roleInfo?.flavor, roleInfo?.theme].filter(Boolean).join(' ');
    return {
      id: b,
      name: b,
      flavor: combinedDesc || undefined,
      goodFor: roleInfo?.goodFor,
      color: roleInfo?.color || 'amber',
      // Skills with full descriptions
      skills: bg2024 ? bg2024.skillProficiencies.map(s => ({
        name: SKILL_NAMES[s],
        description: SKILL_DESCRIPTIONS[s],
      })) : undefined,
      // Full feat info
      featInfo: featData ? {
        name: featData.name,
        description: featData.description,
        benefits: featData.benefits,
      } : undefined,
    };
  });

  // Feat options for human bonus feat selection (exclude the background's origin feat)
  const featOptions: SelectionOption[] = Object.entries(ORIGIN_FEATS)
    .filter(([featName]) => featName !== originFeat?.name)
    .map(([featName, feat]) => {
      const roleInfo = FEAT_ROLE_INFO[featName];
      return {
        id: featName,
        name: featName,
        description: feat.description,
        summary: roleInfo?.summary,
        power: roleInfo?.power,
        goodFor: roleInfo?.goodFor,
        color: roleInfo?.color || 'amber',
        // Full feat benefits
        featInfo: {
          name: feat.name,
          description: feat.description,
          benefits: feat.benefits,
        },
      };
    });

  return (
    <>
      <Panel className="fixed inset-2 z-50 flex flex-col overflow-hidden">
        {/* Condensed Header */}
        <div className="flex items-center gap-3 mb-3 flex-shrink-0">
          <h2 className="font-medieval text-lg text-gold whitespace-nowrap">Create Character</h2>
          <div className="flex-1 flex gap-0.5">
            {steps.map((s, idx) => (
              <div
                key={s}
                className={`flex-1 h-1.5 rounded ${idx <= currentStepIndex ? 'bg-gold' : 'bg-leather'}`}
              />
            ))}
          </div>
          <button onClick={onCancel} className="text-parchment/50 hover:text-parchment text-xl leading-none">✕</button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto mb-3 pr-1">
          {renderCurrentStep()}
        </div>

        {/* Footer Navigation */}
        <div className="flex justify-between flex-shrink-0 pt-2 border-t border-leather">
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

      {/* Selection Modals */}
      <SelectionModal
        isOpen={openModal === 'class'}
        onClose={() => setOpenModal(null)}
        onSelect={(id) => setCharacterClass(id as CharacterClass)}
        title="Choose Your Class"
        options={classOptions}
        selectedId={characterClass}
        columns={2}
      />

      <SelectionModal
        isOpen={openModal === 'species'}
        onClose={() => setOpenModal(null)}
        onSelect={(id) => setSpecies(id as Species)}
        title="Choose Your Species"
        options={speciesOptions}
        selectedId={species}
        columns={2}
      />

      <SelectionModal
        isOpen={openModal === 'subspecies'}
        onClose={() => setOpenModal(null)}
        onSelect={(id) => setSubspecies(id)}
        title="Choose Your Subspecies"
        options={subspeciesOptions}
        selectedId={subspecies}
        columns={1}
      />

      <SelectionModal
        isOpen={openModal === 'background'}
        onClose={() => setOpenModal(null)}
        onSelect={(id) => setBackground(id)}
        title="Choose Your Background"
        options={backgroundOptions}
        selectedId={background}
        columns={2}
      />

      <SelectionModal
        isOpen={openModal === 'feat'}
        onClose={() => setOpenModal(null)}
        onSelect={(id) => setHumanBonusFeat(id as OriginFeatName)}
        title="Choose Your Bonus Feat"
        options={featOptions}
        selectedId={humanBonusFeat || undefined}
        columns={2}
      />
    </>
  );
}
