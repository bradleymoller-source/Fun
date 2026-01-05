import { useState } from 'react';
import type { Character, AbilityScores, Feature, SkillName, LevelUpRecord } from '../../types';
import { Button } from '../ui/Button';
import { Panel } from '../ui/Panel';
import { SubclassSelection } from './SubclassSelection';
import { SpellLearning } from './SpellLearning';
import { FeatSelection } from './FeatSelection';
import { CantripLearning } from './CantripLearning';
import { ExpertiseSelection } from './ExpertiseSelection';
import { MetamagicSelection } from './MetamagicSelection';
import { InvocationSelection } from './InvocationSelection';
import { PactBoonSelection } from './PactBoonSelection';
import { FightingStyleSelection } from './FightingStyleSelection';
import { DivineOrderSelection } from './DivineOrderSelection';
import { PrimalOrderSelection } from './PrimalOrderSelection';
import { WeaponMasterySelection } from './WeaponMasterySelection';
import { PrimalKnowledgeSelection } from './PrimalKnowledgeSelection';
import {
  CLASS_HIT_DICE,
  CLASS_NAMES,
  CLASS_SUBCLASSES,
  ABILITY_NAMES,
  ABILITY_ABBREVIATIONS,
  getAbilityModifier,
  formatModifier,
  getProficiencyBonus,
  getFeaturesAtLevel,
  isASILevel,
  SPELL_SLOTS_BY_LEVEL,
  HALF_CASTER_SPELL_SLOTS,
  WARLOCK_SPELL_SLOTS,
  getNewSpellsAtLevel,
  getSpellPreparationType,
  gainsCantripsAtLevel,
  getNewCantripsAtLevel,
  gainsExpertiseAtLevel,
  getExpertiseCountAtLevel,
  gainsMetamagicAtLevel,
  getMetamagicKnownAtLevel,
  gainsInvocationsAtLevel,
  getInvocationsKnownAtLevel,
  needsPactBoon,
  needsFightingStyle,
  needsDivineOrder,
  needsPrimalOrder,
  needsWeaponMastery,
  needsPrimalKnowledge,
  getCharacterResources,
  type GeneralFeat,
} from '../../data/dndData';

interface LevelUpWizardProps {
  character: Character;
  onComplete: (updatedCharacter: Character) => void;
  onCancel: () => void;
}

type LevelUpStep =
  | 'overview' | 'hp' | 'subclass' | 'pactBoon' | 'fightingStyle' | 'divineOrder' | 'primalOrder' | 'primalKnowledge' | 'weaponMastery' | 'asi' | 'features'
  | 'cantripLearning' | 'spellLearning' | 'spells'
  | 'expertise' | 'metamagic' | 'invocations' | 'review';

export function LevelUpWizard({ character, onComplete, onCancel }: LevelUpWizardProps) {
  const newLevel = character.level + 1;
  const hitDie = CLASS_HIT_DICE[character.characterClass];
  const conMod = getAbilityModifier(character.abilityScores.constitution);

  // HP options
  const [hpMethod, setHpMethod] = useState<'average' | 'roll'>('average');
  const [rolledHp, setRolledHp] = useState<number | null>(null);

  // ASI options
  const hasASI = isASILevel(character.characterClass, newLevel);
  const [asiMethod, setAsiMethod] = useState<'+2' | '+1/+1'>('+2');
  const [asiAbility1, setAsiAbility1] = useState<keyof AbilityScores | null>(null);
  const [asiAbility2, setAsiAbility2] = useState<keyof AbilityScores | null>(null);
  const [showFeatSelection, setShowFeatSelection] = useState(false);
  const [selectedFeat, setSelectedFeat] = useState<GeneralFeat | null>(null);
  const [featAbilityChoice, setFeatAbilityChoice] = useState<keyof AbilityScores | null>(null);

  // Subclass selection
  const needsSubclass = newLevel === 3 && !character.subclass;
  const [selectedSubclass, setSelectedSubclass] = useState<string | null>(null);
  const [subclassChoices, setSubclassChoices] = useState<Record<string, string[]>>({});

  // Spell learning
  const [newSpellsLearned, setNewSpellsLearned] = useState<string[]>([]);
  const spellsToLearn = getNewSpellsAtLevel(character.characterClass, newLevel);

  // Cantrip learning
  const [newCantripsLearned, setNewCantripsLearned] = useState<string[]>([]);
  const cantripsToLearn = getNewCantripsAtLevel(character.characterClass, newLevel);
  const gainsCantrips = gainsCantripsAtLevel(character.characterClass, newLevel);

  // Expertise
  const [newExpertise, setNewExpertise] = useState<SkillName[]>([]);
  const gainsExpertise = gainsExpertiseAtLevel(character.characterClass, newLevel);
  const expertiseCount = getExpertiseCountAtLevel(character.characterClass, newLevel);

  // Metamagic (Sorcerer)
  const [newMetamagic, setNewMetamagic] = useState<string[]>([]);
  const gainsMetamagic = character.characterClass === 'sorcerer' && gainsMetamagicAtLevel(newLevel);
  const metamagicToLearn = gainsMetamagic ? getMetamagicKnownAtLevel(newLevel) - getMetamagicKnownAtLevel(character.level) : 0;

  // Invocations (Warlock)
  const [newInvocations, setNewInvocations] = useState<string[]>([]);
  const gainsInvocations = character.characterClass === 'warlock' && gainsInvocationsAtLevel(newLevel);
  const invocationsToLearn = gainsInvocations ? getInvocationsKnownAtLevel(newLevel) - getInvocationsKnownAtLevel(character.level) : 0;

  // Pact Boon (Warlock L1)
  const [selectedPactBoon, setSelectedPactBoon] = useState<string | null>(null);
  const requiresPactBoon = needsPactBoon(character.characterClass, newLevel, character.pactBoon);

  // Fighting Style (Fighter L1, Paladin L2, Ranger L2)
  const [selectedFightingStyle, setSelectedFightingStyle] = useState<string | null>(null);
  const requiresFightingStyle = needsFightingStyle(character.characterClass, newLevel, character.fightingStyle);

  // DEBUG: Log fighting style check
  console.log('[LevelUp] Fighting Style Check:', {
    class: character.characterClass,
    newLevel,
    currentFightingStyle: character.fightingStyle,
    requiresFightingStyle
  });

  // Divine Order (Cleric L1)
  const [selectedDivineOrder, setSelectedDivineOrder] = useState<string | null>(null);
  const requiresDivineOrder = needsDivineOrder(character.characterClass, newLevel, character.divineOrder);

  // Primal Order (Druid L1)
  const [selectedPrimalOrder, setSelectedPrimalOrder] = useState<string | null>(null);
  const requiresPrimalOrder = needsPrimalOrder(character.characterClass, newLevel, character.primalOrder);

  // Weapon Mastery (Barbarian, Fighter, Monk, Paladin, Ranger at L1)
  const [selectedWeaponMasteries, setSelectedWeaponMasteries] = useState<string[]>([]);
  const requiresWeaponMastery = needsWeaponMastery(character.characterClass, newLevel, character.weaponMasteries);

  // Primal Knowledge (Barbarian L3)
  const [selectedPrimalKnowledgeSkill, setSelectedPrimalKnowledgeSkill] = useState<SkillName | null>(null);
  const requiresPrimalKnowledge = needsPrimalKnowledge(character.characterClass, newLevel, character.primalKnowledgeSkill);

  // Step tracking
  const [step, setStep] = useState<LevelUpStep>('overview');

  // Get new features at this level
  const newFeatures = getFeaturesAtLevel(character.characterClass, newLevel)
    .filter(f => f.name !== 'Ability Score Improvement'); // ASI is handled separately

  // Calculate HP gain
  const getHpGain = (): number => {
    let baseGain: number;
    if (hpMethod === 'average') {
      baseGain = Math.ceil(hitDie / 2) + 1 + conMod;
    } else if (rolledHp !== null) {
      baseGain = Math.max(1, rolledHp + conMod);
    } else {
      return 0;
    }

    // Tough feat
    const hasTough = character.features.some(f => f.name === 'Tough') || selectedFeat?.name === 'Tough';
    if (hasTough) baseGain += 2;

    // Dwarven Toughness
    const hasDwarvenToughness = character.species === 'dwarf' &&
      character.features.some(f => f.name === 'Dwarven Toughness');
    if (hasDwarvenToughness) baseGain += 1;

    return baseGain;
  };

  const rollHp = () => {
    const roll = Math.floor(Math.random() * hitDie) + 1;
    setRolledHp(roll);
  };

  // Check if spellcasting class
  const isFullCaster = ['bard', 'cleric', 'druid', 'sorcerer', 'wizard'].includes(character.characterClass);
  const isHalfCaster = ['paladin', 'ranger'].includes(character.characterClass);
  const isWarlock = character.characterClass === 'warlock';
  const characterIsSpellcaster = isFullCaster || isHalfCaster || isWarlock;
  const preparationType = getSpellPreparationType(character.characterClass);

  // Get spell slots for comparison
  const getCurrentSpellSlots = () => {
    if (isFullCaster) return SPELL_SLOTS_BY_LEVEL[character.level] || [];
    if (isHalfCaster) return HALF_CASTER_SPELL_SLOTS[character.level] || [];
    return [];
  };

  const getNewSpellSlots = () => {
    if (isFullCaster) return SPELL_SLOTS_BY_LEVEL[newLevel] || [];
    if (isHalfCaster) return HALF_CASTER_SPELL_SLOTS[newLevel] || [];
    return [];
  };

  const getWarlockSlots = () => {
    if (!isWarlock) return null;
    return {
      current: WARLOCK_SPELL_SLOTS[character.level],
      new: WARLOCK_SPELL_SLOTS[newLevel],
    };
  };

  // Determine which steps to show
  const getSteps = (): LevelUpStep[] => {
    const steps: LevelUpStep[] = ['overview', 'hp'];

    // Subclass at level 3
    if (needsSubclass) {
      steps.push('subclass');
    }

    // Pact Boon (Warlock at level 3)
    if (requiresPactBoon) {
      steps.push('pactBoon');
    }

    // Fighting Style (Fighter L1, Paladin/Ranger L2)
    if (requiresFightingStyle) {
      steps.push('fightingStyle');
    }

    // Divine Order (Cleric L1)
    if (requiresDivineOrder) {
      steps.push('divineOrder');
    }

    // Primal Order (Druid L1)
    if (requiresPrimalOrder) {
      steps.push('primalOrder');
    }

    // Weapon Mastery (Barbarian, Fighter, Monk, Paladin, Ranger at L1)
    if (requiresWeaponMastery) {
      steps.push('weaponMastery');
    }

    // Primal Knowledge (Barbarian L3)
    if (requiresPrimalKnowledge) {
      steps.push('primalKnowledge');
    }

    // ASI levels
    if (hasASI) {
      steps.push('asi');
    }

    // New class features
    if (newFeatures.length > 0) {
      steps.push('features');
    }

    // Expertise (Rogue, Bard, Ranger)
    if (gainsExpertise && expertiseCount > 0) {
      steps.push('expertise');
    }

    // Metamagic (Sorcerer)
    if (gainsMetamagic && metamagicToLearn > 0) {
      steps.push('metamagic');
    }

    // Invocations (Warlock)
    if (gainsInvocations && invocationsToLearn > 0) {
      steps.push('invocations');
    }

    // Cantrip learning (spellcasters that gain cantrips at this level)
    if (gainsCantrips && cantripsToLearn > 0) {
      steps.push('cantripLearning');
    }

    // Spell learning for known casters or wizard
    if (characterIsSpellcaster && (preparationType === 'known' || preparationType === 'spellbook')) {
      if (spellsToLearn > 0 || preparationType === 'spellbook') {
        steps.push('spellLearning');
      }
    }

    // Spell slot progression display
    if (characterIsSpellcaster) {
      steps.push('spells');
    }

    steps.push('review');
    return steps;
  };

  const steps = getSteps();
  const currentStepIndex = steps.indexOf(step);

  // DEBUG: Log computed steps
  console.log('[LevelUp] Computed steps:', steps);

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

  const canProceed = (): boolean => {
    switch (step) {
      case 'hp':
        return hpMethod === 'average' || rolledHp !== null;
      case 'subclass':
        return selectedSubclass !== null;
      case 'pactBoon':
        return selectedPactBoon !== null;
      case 'fightingStyle':
        return selectedFightingStyle !== null;
      case 'divineOrder':
        return selectedDivineOrder !== null;
      case 'primalOrder':
        return selectedPrimalOrder !== null;
      case 'weaponMastery':
        return selectedWeaponMasteries.length > 0;
      case 'primalKnowledge':
        return selectedPrimalKnowledgeSkill !== null;
      case 'asi':
        if (showFeatSelection) return false; // Handled by feat selection
        if (selectedFeat) return true;
        if (asiMethod === '+2') {
          return asiAbility1 !== null;
        } else {
          return asiAbility1 !== null && asiAbility2 !== null && asiAbility1 !== asiAbility2;
        }
      case 'expertise':
        return newExpertise.length === expertiseCount;
      case 'metamagic':
        return newMetamagic.length === metamagicToLearn;
      case 'invocations':
        return newInvocations.length === invocationsToLearn;
      case 'cantripLearning':
        return newCantripsLearned.length === cantripsToLearn;
      case 'spellLearning':
        if (preparationType === 'prepared') return true; // Prepared casters don't need to select
        if (preparationType === 'spellbook') return newSpellsLearned.length === 2;
        return newSpellsLearned.length === spellsToLearn;
      default:
        return true;
    }
  };

  const applyLevelUp = () => {
    const hpGain = getHpGain();

    // Calculate new ability scores
    const newAbilityScores = { ...character.abilityScores };

    if (hasASI) {
      if (selectedFeat) {
        // Apply feat ability bonus
        if (selectedFeat.abilityBonus) {
          if (selectedFeat.abilityBonus.ability === 'choice' && featAbilityChoice) {
            newAbilityScores[featAbilityChoice] = Math.min(20, newAbilityScores[featAbilityChoice] + 1);
          } else if (selectedFeat.abilityBonus.ability !== 'choice') {
            const ability = selectedFeat.abilityBonus.ability as keyof AbilityScores;
            newAbilityScores[ability] = Math.min(20, newAbilityScores[ability] + 1);
          }
        }
      } else if (asiMethod === '+2' && asiAbility1) {
        newAbilityScores[asiAbility1] = Math.min(20, newAbilityScores[asiAbility1] + 2);
      } else if (asiMethod === '+1/+1' && asiAbility1 && asiAbility2) {
        newAbilityScores[asiAbility1] = Math.min(20, newAbilityScores[asiAbility1] + 1);
        newAbilityScores[asiAbility2] = Math.min(20, newAbilityScores[asiAbility2] + 1);
      }
    }

    // Add new features
    const updatedFeatures: Feature[] = [...character.features];
    newFeatures.forEach((feature, idx) => {
      updatedFeatures.push({
        id: `level${newLevel}-${idx}`,
        name: feature.name,
        source: `${CLASS_NAMES[character.characterClass]} Level ${newLevel}`,
        description: feature.description,
      });
    });

    // Add feat as feature if taken
    if (selectedFeat) {
      updatedFeatures.push({
        id: `feat-${selectedFeat.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: selectedFeat.name,
        source: 'Feat',
        description: selectedFeat.benefits.join(' '),
      });
    }

    // Recalculate derived stats
    const newConMod = getAbilityModifier(newAbilityScores.constitution);
    const conModDiff = newConMod - conMod;
    const retroactiveHpGain = conModDiff * newLevel;

    const newDexMod = getAbilityModifier(newAbilityScores.dexterity);

    // Build updated spells
    const currentSpells = character.spellsKnown || character.spells || [];
    let updatedSpellsKnown = [...currentSpells, ...newSpellsLearned];

    // Add subclass bonus spells (always prepared spells from subclass)
    if (selectedSubclass) {
      const subclassInfo = CLASS_SUBCLASSES[character.characterClass]?.find(
        sub => sub.name === selectedSubclass
      );
      if (subclassInfo?.bonusSpells) {
        // Add bonus spells that aren't already in the spell list
        const bonusSpellsToAdd = subclassInfo.bonusSpells.filter(
          spell => !updatedSpellsKnown.includes(spell)
        );
        updatedSpellsKnown = [...updatedSpellsKnown, ...bonusSpellsToAdd];
      }
    }

    // Build updated cantrips
    const currentCantrips = character.cantripsKnown || [];
    const updatedCantripsKnown = [...currentCantrips, ...newCantripsLearned];

    // Update skill proficiencies with expertise
    const updatedSkillProficiencies = { ...character.skillProficiencies };
    for (const skill of newExpertise) {
      updatedSkillProficiencies[skill] = 'expertise';
    }

    // Add Primal Knowledge skill proficiency (Barbarian L3)
    if (selectedPrimalKnowledgeSkill) {
      updatedSkillProficiencies[selectedPrimalKnowledgeSkill] = 'proficient';
    }

    // Update metamagic
    const currentMetamagic = character.metamagicKnown || [];
    const updatedMetamagic = [...currentMetamagic, ...newMetamagic];

    // Update invocations
    const currentInvocations = character.eldritchInvocations || [];
    const updatedInvocations = [...currentInvocations, ...newInvocations];

    // Update spellcasting stats if applicable
    let updatedSpellcasting = character.spellcasting;
    if (updatedSpellcasting) {
      const newProfBonus = getProficiencyBonus(newLevel);
      const spellAbility = updatedSpellcasting.ability;
      const newAbilityMod = getAbilityModifier(newAbilityScores[spellAbility]);

      // Get new spell slots
      let newSlots: number[] = [];
      if (isFullCaster) {
        newSlots = SPELL_SLOTS_BY_LEVEL[newLevel] || [];
      } else if (isHalfCaster) {
        newSlots = HALF_CASTER_SPELL_SLOTS[newLevel] || [];
      } else if (isWarlock) {
        const warlockData = WARLOCK_SPELL_SLOTS[newLevel];
        // Warlock has special slot handling - slots are all at the same level
        newSlots = Array(9).fill(0);
        if (warlockData) {
          newSlots[warlockData.level - 1] = warlockData.slots;
        }
      }

      updatedSpellcasting = {
        ...updatedSpellcasting,
        spellSaveDC: 8 + newProfBonus + newAbilityMod,
        spellAttackBonus: newProfBonus + newAbilityMod,
        spellSlots: newSlots,
      };
    }

    // Update feature uses (Ki, Rage, Sorcery Points, etc.) with new maximums
    const featNames = character.features
      .filter(f => f.source === 'Feat')
      .map(f => f.name);
    if (selectedFeat) {
      featNames.push(selectedFeat.name);
    }
    const newResourceInfo = getCharacterResources(
      character.characterClass,
      character.species,
      newLevel,
      newAbilityScores,
      featNames.length > 0 ? featNames : undefined
    );

    const updatedFeatureUses: Record<string, { used: number; max: number; restoreOn: 'short' | 'long' | 'dawn' }> = {};
    for (const [resourceId, info] of Object.entries(newResourceInfo)) {
      const currentUse = character.featureUses?.[resourceId];
      updatedFeatureUses[resourceId] = {
        used: currentUse?.used || 0,
        max: info.max,
        restoreOn: info.restoreOn === 'short' || info.restoreOn === 'long' ? info.restoreOn : 'long',
      };
    }

    // Build level history record
    const levelUpRecord: LevelUpRecord = {
      level: newLevel,
      timestamp: new Date().toISOString(),
      changes: {
        hpGained: getHpGain(),
        hpMethod: hpMethod,
        featuresGained: newFeatures.map(f => f.name),
        ...(newSpellsLearned.length > 0 && { spellsLearned: newSpellsLearned }),
        ...(newCantripsLearned.length > 0 && { cantripsLearned: newCantripsLearned }),
        ...(hasASI && !selectedFeat && asiAbility1 && {
          asiChoice: {
            method: asiMethod,
            abilities: asiMethod === '+2' ? [asiAbility1] : [asiAbility1, asiAbility2!],
          },
        }),
        ...(selectedFeat && { featTaken: selectedFeat.name }),
        ...(selectedSubclass && { subclassChosen: selectedSubclass }),
        ...(selectedPactBoon && { pactBoonChosen: selectedPactBoon }),
        ...(selectedFightingStyle && { fightingStyleChosen: selectedFightingStyle }),
        ...(selectedDivineOrder && { divineOrderChosen: selectedDivineOrder }),
        ...(selectedPrimalOrder && { primalOrderChosen: selectedPrimalOrder }),
        ...(selectedPrimalKnowledgeSkill && { primalKnowledgeSkillChosen: selectedPrimalKnowledgeSkill }),
        ...(selectedWeaponMasteries.length > 0 && { weaponMasteriesChosen: selectedWeaponMasteries }),
        ...((newExpertise.length > 0 || newMetamagic.length > 0 || newInvocations.length > 0) && {
          otherChoices: {
            ...(newExpertise.length > 0 && { expertise: newExpertise }),
            ...(newMetamagic.length > 0 && { metamagic: newMetamagic }),
            ...(newInvocations.length > 0 && { invocations: newInvocations }),
          },
        }),
      },
    };

    const updatedLevelHistory = [...(character.levelHistory || []), levelUpRecord];

    const updatedCharacter: Character = {
      ...character,
      level: newLevel,
      abilityScores: newAbilityScores,
      maxHitPoints: character.maxHitPoints + hpGain + retroactiveHpGain,
      currentHitPoints: character.currentHitPoints + hpGain + retroactiveHpGain,
      hitDiceTotal: newLevel,
      hitDiceRemaining: character.hitDiceRemaining + 1,
      initiative: newDexMod,
      features: updatedFeatures,
      experiencePoints: character.experiencePoints,
      skillProficiencies: updatedSkillProficiencies,
      updatedAt: new Date().toISOString(),
      // Updated spellcasting
      ...(updatedSpellcasting && { spellcasting: updatedSpellcasting }),
      // Subclass
      ...(selectedSubclass && {
        subclass: selectedSubclass,
        subclassChoices: subclassChoices,
      }),
      // Spells (include when new spells learned OR when subclass adds bonus spells)
      ...((newSpellsLearned.length > 0 || (selectedSubclass && CLASS_SUBCLASSES[character.characterClass]?.find(sub => sub.name === selectedSubclass)?.bonusSpells?.length)) && {
        spellsKnown: updatedSpellsKnown,
        spells: updatedSpellsKnown,
      }),
      // Cantrips
      ...(newCantripsLearned.length > 0 && {
        cantripsKnown: updatedCantripsKnown,
      }),
      // Metamagic (Sorcerer)
      ...(newMetamagic.length > 0 && {
        metamagicKnown: updatedMetamagic,
      }),
      // Invocations (Warlock)
      ...(newInvocations.length > 0 && {
        eldritchInvocations: updatedInvocations,
      }),
      // Pact Boon (Warlock)
      ...(selectedPactBoon && {
        pactBoon: selectedPactBoon,
      }),
      // Fighting Style (Fighter, Paladin, Ranger)
      ...(selectedFightingStyle && {
        fightingStyle: selectedFightingStyle,
      }),
      // Divine Order (Cleric)
      ...(selectedDivineOrder && {
        divineOrder: selectedDivineOrder,
      }),
      // Primal Order (Druid)
      ...(selectedPrimalOrder && {
        primalOrder: selectedPrimalOrder,
      }),
      // Primal Knowledge (Barbarian)
      ...(selectedPrimalKnowledgeSkill && {
        primalKnowledgeSkill: selectedPrimalKnowledgeSkill,
      }),
      // Weapon Masteries (Barbarian, Fighter, Monk, Paladin, Ranger)
      ...(selectedWeaponMasteries.length > 0 && {
        weaponMasteries: selectedWeaponMasteries,
      }),
      // Feature uses with updated maximums
      featureUses: updatedFeatureUses,
      // Level history
      levelHistory: updatedLevelHistory,
    };

    onComplete(updatedCharacter);
  };

  // Render functions
  const renderOverview = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="font-medieval text-2xl text-gold mb-2">Level Up!</h3>
        <p className="text-parchment text-lg">
          {character.name} is advancing to <span className="text-gold font-bold">Level {newLevel}</span>
        </p>
      </div>

      <div className="bg-dark-wood p-4 rounded border border-leather">
        <h4 className="text-gold font-semibold mb-2">What's Coming:</h4>
        <ul className="space-y-2 text-parchment">
          <li className="flex items-center gap-2">
            <span className="text-green-400">+</span>
            Hit Points (d{hitDie} + {conMod >= 0 ? '+' : ''}{conMod} CON)
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-400">+</span>
            1 Hit Die (now {newLevel}d{hitDie})
          </li>
          {needsSubclass && (
            <li className="flex items-center gap-2">
              <span className="text-purple-400">★</span>
              Choose your {CLASS_NAMES[character.characterClass]} subclass
            </li>
          )}
          {requiresPactBoon && (
            <li className="flex items-center gap-2">
              <span className="text-purple-400">★</span>
              Choose your Pact Boon
            </li>
          )}
          {requiresFightingStyle && (
            <li className="flex items-center gap-2">
              <span className="text-red-400">★</span>
              Choose a Fighting Style
            </li>
          )}
          {requiresDivineOrder && (
            <li className="flex items-center gap-2">
              <span className="text-yellow-400">★</span>
              Choose your Divine Order
            </li>
          )}
          {requiresPrimalOrder && (
            <li className="flex items-center gap-2">
              <span className="text-green-400">★</span>
              Choose your Primal Order
            </li>
          )}
          {requiresWeaponMastery && (
            <li className="flex items-center gap-2">
              <span className="text-orange-400">★</span>
              Choose Weapon Masteries
            </li>
          )}
          {requiresPrimalKnowledge && (
            <li className="flex items-center gap-2">
              <span className="text-amber-400">★</span>
              Choose Primal Knowledge Skill
            </li>
          )}
          {hasASI && (
            <li className="flex items-center gap-2">
              <span className="text-gold">★</span>
              Ability Score Improvement or Feat
            </li>
          )}
          {newFeatures.map(f => (
            <li key={f.name} className="flex items-center gap-2">
              <span className="text-blue-400">◆</span>
              {f.name}
            </li>
          ))}
          {getProficiencyBonus(newLevel) > getProficiencyBonus(character.level) && (
            <li className="flex items-center gap-2">
              <span className="text-purple-400">↑</span>
              Proficiency Bonus increases to +{getProficiencyBonus(newLevel)}
            </li>
          )}
          {gainsCantrips && cantripsToLearn > 0 && (
            <li className="flex items-center gap-2">
              <span className="text-cyan-400">✦</span>
              Learn {cantripsToLearn} new cantrip{cantripsToLearn > 1 ? 's' : ''}
            </li>
          )}
          {characterIsSpellcaster && (preparationType === 'known' || preparationType === 'spellbook') && spellsToLearn > 0 && (
            <li className="flex items-center gap-2">
              <span className="text-cyan-400">✦</span>
              Learn {spellsToLearn} new spell{spellsToLearn > 1 ? 's' : ''}
            </li>
          )}
          {characterIsSpellcaster && (
            <li className="flex items-center gap-2">
              <span className="text-cyan-400">✦</span>
              Spell slot progression
            </li>
          )}
          {gainsExpertise && expertiseCount > 0 && (
            <li className="flex items-center gap-2">
              <span className="text-purple-400">★</span>
              Choose {expertiseCount} skill{expertiseCount > 1 ? 's' : ''} for Expertise
            </li>
          )}
          {gainsMetamagic && metamagicToLearn > 0 && (
            <li className="flex items-center gap-2">
              <span className="text-purple-400">★</span>
              Learn {metamagicToLearn} Metamagic option{metamagicToLearn > 1 ? 's' : ''}
            </li>
          )}
          {gainsInvocations && invocationsToLearn > 0 && (
            <li className="flex items-center gap-2">
              <span className="text-purple-400">★</span>
              Learn {invocationsToLearn} Eldritch Invocation{invocationsToLearn > 1 ? 's' : ''}
            </li>
          )}
        </ul>
      </div>
    </div>
  );

  const renderHpStep = () => (
    <div className="space-y-4">
      <h3 className="font-medieval text-lg text-gold">Hit Point Increase</h3>

      <p className="text-parchment/70 text-sm">
        Choose how to determine your HP increase. Your hit die is d{hitDie} and your
        Constitution modifier is {formatModifier(conMod)}.
      </p>

      <div className="flex gap-2 mb-4">
        <Button
          variant={hpMethod === 'average' ? 'primary' : 'secondary'}
          onClick={() => {
            setHpMethod('average');
            setRolledHp(null);
          }}
        >
          Average ({Math.ceil(hitDie / 2) + 1})
        </Button>
        <Button
          variant={hpMethod === 'roll' ? 'primary' : 'secondary'}
          onClick={() => setHpMethod('roll')}
        >
          Roll
        </Button>
      </div>

      {hpMethod === 'average' ? (
        <div className="bg-dark-wood p-4 rounded border border-gold/50 text-center">
          <div className="text-parchment/70 text-sm mb-1">HP Gained</div>
          <div className="text-gold text-4xl font-bold">+{getHpGain()}</div>
          <div className="text-parchment/50 text-xs mt-1">
            ({Math.ceil(hitDie / 2) + 1} average + {conMod} CON)
          </div>
        </div>
      ) : (
        <div className="bg-dark-wood p-4 rounded border border-leather">
          <div className="flex items-center justify-center gap-4">
            <Button onClick={rollHp} variant="primary">
              Roll d{hitDie}
            </Button>
            {rolledHp !== null && (
              <div className="text-center">
                <div className="text-parchment/70 text-xs">Rolled</div>
                <div className="text-gold text-3xl font-bold">{rolledHp}</div>
              </div>
            )}
          </div>
          {rolledHp !== null && (
            <div className="text-center mt-4">
              <div className="text-parchment/70 text-sm">Total HP Gained</div>
              <div className="text-gold text-4xl font-bold">+{getHpGain()}</div>
            </div>
          )}
        </div>
      )}

      <div className="text-center text-parchment/70 text-sm">
        New Max HP: {character.maxHitPoints} → <span className="text-gold font-bold">{character.maxHitPoints + getHpGain()}</span>
      </div>
    </div>
  );

  const renderSubclassStep = () => (
    <SubclassSelection
      character={character}
      onSelect={(subclass, choices) => {
        setSelectedSubclass(subclass);
        if (choices) setSubclassChoices(choices);
        nextStep();
      }}
    />
  );

  const renderAsiStep = () => {
    if (showFeatSelection) {
      return (
        <FeatSelection
          character={character}
          onSelect={(feat, abilityChoice) => {
            setSelectedFeat(feat);
            if (abilityChoice) setFeatAbilityChoice(abilityChoice);
            setShowFeatSelection(false);
          }}
          onCancel={() => setShowFeatSelection(false)}
        />
      );
    }

    const abilities = Object.keys(character.abilityScores) as (keyof AbilityScores)[];

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medieval text-lg text-gold">Ability Score Improvement</h3>
            <p className="text-parchment/70 text-sm">
              Increase abilities or take a feat
            </p>
          </div>
          {!selectedFeat && (
            <Button onClick={() => setShowFeatSelection(true)} variant="secondary" size="sm">
              Take a Feat →
            </Button>
          )}
        </div>

        {selectedFeat ? (
          <div className="p-4 bg-gold/20 rounded border border-gold">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-gold font-semibold">{selectedFeat.name}</span>
                {selectedFeat.abilityBonus && (
                  <span className="text-parchment/70 text-sm ml-2">
                    (+1 {featAbilityChoice ? ABILITY_NAMES[featAbilityChoice] :
                      selectedFeat.abilityBonus.ability !== 'choice' ?
                      ABILITY_NAMES[selectedFeat.abilityBonus.ability as keyof AbilityScores] : ''})
                  </span>
                )}
              </div>
              <Button
                onClick={() => {
                  setSelectedFeat(null);
                  setFeatAbilityChoice(null);
                }}
                variant="secondary"
                size="sm"
              >
                Change
              </Button>
            </div>
            <p className="text-parchment/70 text-xs mt-2">{selectedFeat.description}</p>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-4">
              <Button
                variant={asiMethod === '+2' ? 'primary' : 'secondary'}
                onClick={() => {
                  setAsiMethod('+2');
                  setAsiAbility2(null);
                }}
              >
                +2 to One
              </Button>
              <Button
                variant={asiMethod === '+1/+1' ? 'primary' : 'secondary'}
                onClick={() => setAsiMethod('+1/+1')}
              >
                +1 to Two
              </Button>
            </div>

            {asiMethod === '+2' ? (
              <div>
                <label className="text-parchment text-sm mb-2 block">Choose ability for +2:</label>
                <div className="grid grid-cols-3 gap-2">
                  {abilities.map(ability => {
                    const currentScore = character.abilityScores[ability];
                    const atMax = currentScore >= 20;

                    return (
                      <button
                        key={ability}
                        onClick={() => !atMax && setAsiAbility1(ability)}
                        disabled={atMax}
                        className={`p-3 rounded border transition-colors ${
                          asiAbility1 === ability
                            ? 'bg-gold text-dark-wood border-gold font-bold'
                            : atMax
                            ? 'bg-dark-wood/50 text-parchment/30 border-leather/30 cursor-not-allowed'
                            : 'bg-leather/50 text-parchment border-leather hover:border-gold'
                        }`}
                      >
                        <div className="text-sm">{ABILITY_ABBREVIATIONS[ability]}</div>
                        <div className="text-lg font-bold">{currentScore}</div>
                        {asiAbility1 === ability && (
                          <div className="text-xs text-green-600">→ {Math.min(20, currentScore + 2)}</div>
                        )}
                        {atMax && <div className="text-xs">(max)</div>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-parchment text-sm mb-2 block">First +1:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {abilities.map(ability => {
                      const currentScore = character.abilityScores[ability];
                      const atMax = currentScore >= 20;

                      return (
                        <button
                          key={ability}
                          onClick={() => {
                            if (!atMax) {
                              setAsiAbility1(ability);
                              if (asiAbility2 === ability) setAsiAbility2(null);
                            }
                          }}
                          disabled={atMax}
                          className={`p-2 rounded border transition-colors ${
                            asiAbility1 === ability
                              ? 'bg-gold text-dark-wood border-gold font-bold'
                              : atMax
                              ? 'bg-dark-wood/50 text-parchment/30 border-leather/30 cursor-not-allowed'
                              : 'bg-leather/50 text-parchment border-leather hover:border-gold'
                          }`}
                        >
                          <div className="text-xs">{ABILITY_ABBREVIATIONS[ability]}</div>
                          <div className="font-bold">{currentScore}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-parchment text-sm mb-2 block">Second +1:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {abilities.map(ability => {
                      const currentScore = character.abilityScores[ability];
                      const atMax = currentScore >= 20;
                      const isSameAsFirst = ability === asiAbility1;

                      return (
                        <button
                          key={ability}
                          onClick={() => !atMax && !isSameAsFirst && setAsiAbility2(ability)}
                          disabled={atMax || isSameAsFirst}
                          className={`p-2 rounded border transition-colors ${
                            asiAbility2 === ability
                              ? 'bg-gold text-dark-wood border-gold font-bold'
                              : atMax || isSameAsFirst
                              ? 'bg-dark-wood/50 text-parchment/30 border-leather/30 cursor-not-allowed'
                              : 'bg-leather/50 text-parchment border-leather hover:border-gold'
                          }`}
                        >
                          <div className="text-xs">{ABILITY_ABBREVIATIONS[ability]}</div>
                          <div className="font-bold">{currentScore}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {(asiAbility1 || asiAbility2) && (
              <div className="bg-dark-wood p-3 rounded border border-gold/50">
                <div className="text-gold text-sm mb-2">Changes:</div>
                <div className="flex flex-wrap gap-2">
                  {asiAbility1 && (
                    <span className="bg-green-900/30 text-green-300 px-2 py-1 rounded text-sm">
                      {ABILITY_NAMES[asiAbility1]}: {character.abilityScores[asiAbility1]} → {Math.min(20, character.abilityScores[asiAbility1] + (asiMethod === '+2' ? 2 : 1))}
                    </span>
                  )}
                  {asiMethod === '+1/+1' && asiAbility2 && (
                    <span className="bg-green-900/30 text-green-300 px-2 py-1 rounded text-sm">
                      {ABILITY_NAMES[asiAbility2]}: {character.abilityScores[asiAbility2]} → {Math.min(20, character.abilityScores[asiAbility2] + 1)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderFeaturesStep = () => (
    <div className="space-y-4">
      <h3 className="font-medieval text-lg text-gold">New Class Features</h3>

      <p className="text-parchment/70 text-sm">
        At level {newLevel}, you gain the following {CLASS_NAMES[character.characterClass]} features:
      </p>

      <div className="space-y-3">
        {newFeatures.map(feature => (
          <div key={feature.name} className="bg-dark-wood p-4 rounded border border-leather">
            <h4 className="text-gold font-semibold mb-1">{feature.name}</h4>
            <p className="text-parchment text-sm">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSpellLearningStep = () => (
    <SpellLearning
      character={character}
      newLevel={newLevel}
      currentSpells={character.spellsKnown || character.spells || []}
      onSelect={(spells) => {
        setNewSpellsLearned(spells);
        nextStep();
      }}
    />
  );

  const renderSpellsStep = () => {
    const currentSlots = getCurrentSpellSlots();
    const newSlots = getNewSpellSlots();
    const warlockSlots = getWarlockSlots();

    return (
      <div className="space-y-4">
        <h3 className="font-medieval text-lg text-gold">Spellcasting Progression</h3>

        {isWarlock && warlockSlots ? (
          <div className="bg-dark-wood p-4 rounded border border-leather">
            <h4 className="text-parchment font-semibold mb-2">Pact Magic Slots</h4>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-parchment/70 text-xs">Current</div>
                <div className="text-gold text-xl font-bold">
                  {warlockSlots.current.slots} × Level {warlockSlots.current.level}
                </div>
              </div>
              <span className="text-gold text-2xl">→</span>
              <div className="text-center">
                <div className="text-parchment/70 text-xs">New</div>
                <div className="text-green-400 text-xl font-bold">
                  {warlockSlots.new.slots} × Level {warlockSlots.new.level}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-dark-wood p-4 rounded border border-leather">
            <h4 className="text-parchment font-semibold mb-2">Spell Slots</h4>
            <div className="grid grid-cols-9 gap-1 text-center text-xs">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => {
                const current = currentSlots[level - 1] || 0;
                const next = newSlots[level - 1] || 0;
                const changed = next !== current;

                return (
                  <div key={level} className={`p-2 rounded ${changed ? 'bg-gold/20' : 'bg-leather/30'}`}>
                    <div className="text-parchment/70">{level}st</div>
                    <div className={changed ? 'text-green-400 font-bold' : 'text-parchment'}>
                      {current} → {next}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {newSpellsLearned.length > 0 && (
          <div className="p-3 bg-cyan-900/20 rounded border border-cyan-500/30">
            <div className="text-cyan-300 text-sm font-semibold mb-1">New Spells Learned:</div>
            <div className="text-parchment text-sm">{newSpellsLearned.join(', ')}</div>
          </div>
        )}
      </div>
    );
  };

  const renderReview = () => {
    const hpGain = getHpGain();

    return (
      <div className="space-y-4">
        <h3 className="font-medieval text-lg text-gold">Review Changes</h3>

        <div className="bg-dark-wood p-4 rounded border border-gold/50 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-parchment">Level</span>
            <span className="text-gold font-bold">{character.level} → {newLevel}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-parchment">Max HP</span>
            <span className="text-gold font-bold">{character.maxHitPoints} → {character.maxHitPoints + hpGain}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-parchment">Hit Dice</span>
            <span className="text-gold font-bold">{character.level}d{hitDie} → {newLevel}d{hitDie}</span>
          </div>

          {getProficiencyBonus(newLevel) > getProficiencyBonus(character.level) && (
            <div className="flex justify-between items-center">
              <span className="text-parchment">Proficiency Bonus</span>
              <span className="text-gold font-bold">+{getProficiencyBonus(character.level)} → +{getProficiencyBonus(newLevel)}</span>
            </div>
          )}

          {selectedSubclass && (
            <div className="border-t border-leather pt-2 mt-2">
              <div className="text-parchment text-sm mb-1">Subclass:</div>
              <span className="text-purple-300 font-semibold">{selectedSubclass}</span>
            </div>
          )}

          {selectedDivineOrder && (
            <div className="border-t border-leather pt-2 mt-2">
              <div className="text-parchment text-sm mb-1">Divine Order:</div>
              <span className="text-yellow-300 font-semibold capitalize">{selectedDivineOrder}</span>
            </div>
          )}

          {selectedPrimalOrder && (
            <div className="border-t border-leather pt-2 mt-2">
              <div className="text-parchment text-sm mb-1">Primal Order:</div>
              <span className="text-green-300 font-semibold capitalize">{selectedPrimalOrder}</span>
            </div>
          )}

          {selectedFightingStyle && (
            <div className="border-t border-leather pt-2 mt-2">
              <div className="text-parchment text-sm mb-1">Fighting Style:</div>
              <span className="text-red-300 font-semibold capitalize">{selectedFightingStyle}</span>
            </div>
          )}

          {selectedPactBoon && (
            <div className="border-t border-leather pt-2 mt-2">
              <div className="text-parchment text-sm mb-1">Pact Boon:</div>
              <span className="text-purple-300 font-semibold capitalize">{selectedPactBoon.replace(/-/g, ' ')}</span>
            </div>
          )}

          {selectedWeaponMasteries.length > 0 && (
            <div className="border-t border-leather pt-2 mt-2">
              <div className="text-parchment text-sm mb-1">Weapon Masteries:</div>
              <div className="flex flex-wrap gap-1">
                {selectedWeaponMasteries.map(weapon => (
                  <span key={weapon} className="bg-orange-900/30 text-orange-300 px-2 py-0.5 rounded text-xs">
                    {weapon}
                  </span>
                ))}
              </div>
            </div>
          )}

          {selectedPrimalKnowledgeSkill && (
            <div className="border-t border-leather pt-2 mt-2">
              <div className="text-parchment text-sm mb-1">Primal Knowledge:</div>
              <span className="text-amber-300 font-semibold">{selectedPrimalKnowledgeSkill}</span>
            </div>
          )}

          {hasASI && (selectedFeat || asiAbility1) && (
            <div className="border-t border-leather pt-2 mt-2">
              <div className="text-parchment text-sm mb-1">
                {selectedFeat ? 'Feat:' : 'Ability Score Improvement:'}
              </div>
              {selectedFeat ? (
                <span className="text-gold font-semibold">{selectedFeat.name}</span>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {asiAbility1 && (
                    <span className="bg-green-900/30 text-green-300 px-2 py-1 rounded text-sm">
                      {ABILITY_NAMES[asiAbility1]}: +{asiMethod === '+2' ? 2 : 1}
                    </span>
                  )}
                  {asiMethod === '+1/+1' && asiAbility2 && (
                    <span className="bg-green-900/30 text-green-300 px-2 py-1 rounded text-sm">
                      {ABILITY_NAMES[asiAbility2]}: +1
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {newFeatures.length > 0 && (
            <div className="border-t border-leather pt-2 mt-2">
              <div className="text-parchment text-sm mb-1">New Features:</div>
              <div className="flex flex-wrap gap-1">
                {newFeatures.map(f => (
                  <span key={f.name} className="bg-blue-900/30 text-blue-300 px-2 py-0.5 rounded text-xs">
                    {f.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {newCantripsLearned.length > 0 && (
            <div className="border-t border-leather pt-2 mt-2">
              <div className="text-parchment text-sm mb-1">Cantrips Learned:</div>
              <div className="flex flex-wrap gap-1">
                {newCantripsLearned.map(cantrip => (
                  <span key={cantrip} className="bg-cyan-900/30 text-cyan-300 px-2 py-0.5 rounded text-xs">
                    {cantrip}
                  </span>
                ))}
              </div>
            </div>
          )}

          {newSpellsLearned.length > 0 && (
            <div className="border-t border-leather pt-2 mt-2">
              <div className="text-parchment text-sm mb-1">Spells Learned:</div>
              <div className="flex flex-wrap gap-1">
                {newSpellsLearned.map(spell => (
                  <span key={spell} className="bg-cyan-900/30 text-cyan-300 px-2 py-0.5 rounded text-xs">
                    {spell}
                  </span>
                ))}
              </div>
            </div>
          )}

          {newExpertise.length > 0 && (
            <div className="border-t border-leather pt-2 mt-2">
              <div className="text-parchment text-sm mb-1">Expertise:</div>
              <div className="flex flex-wrap gap-1">
                {newExpertise.map(skill => (
                  <span key={skill} className="bg-purple-900/30 text-purple-300 px-2 py-0.5 rounded text-xs">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {newMetamagic.length > 0 && (
            <div className="border-t border-leather pt-2 mt-2">
              <div className="text-parchment text-sm mb-1">Metamagic:</div>
              <div className="flex flex-wrap gap-1">
                {newMetamagic.map(id => (
                  <span key={id} className="bg-purple-900/30 text-purple-300 px-2 py-0.5 rounded text-xs">
                    {id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </span>
                ))}
              </div>
            </div>
          )}

          {newInvocations.length > 0 && (
            <div className="border-t border-leather pt-2 mt-2">
              <div className="text-parchment text-sm mb-1">Invocations:</div>
              <div className="flex flex-wrap gap-1">
                {newInvocations.map(id => (
                  <span key={id} className="bg-purple-900/30 text-purple-300 px-2 py-0.5 rounded text-xs">
                    {id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="text-center">
          <Button onClick={applyLevelUp} variant="primary" size="lg">
            Confirm Level Up
          </Button>
        </div>
      </div>
    );
  };

  const renderCantripLearningStep = () => (
    <CantripLearning
      character={character}
      newLevel={newLevel}
      currentCantrips={character.cantripsKnown || []}
      onSelect={(cantrips) => {
        setNewCantripsLearned(cantrips);
        nextStep();
      }}
    />
  );

  const renderExpertiseStep = () => (
    <ExpertiseSelection
      character={character}
      expertiseCount={expertiseCount}
      onSelect={(skills) => {
        setNewExpertise(skills);
        nextStep();
      }}
    />
  );

  const renderMetamagicStep = () => (
    <MetamagicSelection
      character={character}
      newLevel={newLevel}
      currentMetamagic={character.metamagicKnown || []}
      onSelect={(metamagic) => {
        setNewMetamagic(metamagic);
        nextStep();
      }}
    />
  );

  const renderInvocationsStep = () => (
    <InvocationSelection
      character={character}
      newLevel={newLevel}
      currentInvocations={character.eldritchInvocations || []}
      onSelect={(invocations) => {
        setNewInvocations(invocations);
        nextStep();
      }}
    />
  );

  const renderPactBoonStep = () => (
    <PactBoonSelection
      onSelect={(pactBoonId) => {
        setSelectedPactBoon(pactBoonId);
        nextStep();
      }}
    />
  );

  const renderFightingStyleStep = () => {
    console.log('[LevelUp] renderFightingStyleStep called');
    return (
      <FightingStyleSelection
        characterClass={character.characterClass}
        onSelect={(styleId) => {
          setSelectedFightingStyle(styleId);
          nextStep();
        }}
      />
    );
  };

  const renderDivineOrderStep = () => (
    <DivineOrderSelection
      onSelect={(divineOrderId) => {
        setSelectedDivineOrder(divineOrderId);
        nextStep();
      }}
    />
  );

  const renderPrimalOrderStep = () => (
    <PrimalOrderSelection
      onSelect={(primalOrderId) => {
        setSelectedPrimalOrder(primalOrderId);
        nextStep();
      }}
    />
  );

  const renderWeaponMasteryStep = () => (
    <WeaponMasterySelection
      character={character}
      onSelect={(weaponMasteries) => {
        setSelectedWeaponMasteries(weaponMasteries);
        nextStep();
      }}
    />
  );

  const renderPrimalKnowledgeStep = () => (
    <PrimalKnowledgeSelection
      character={character}
      onSelect={(skill) => {
        setSelectedPrimalKnowledgeSkill(skill);
        nextStep();
      }}
    />
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 'overview': return renderOverview();
      case 'hp': return renderHpStep();
      case 'subclass': return renderSubclassStep();
      case 'pactBoon': return renderPactBoonStep();
      case 'fightingStyle': return renderFightingStyleStep();
      case 'divineOrder': return renderDivineOrderStep();
      case 'primalOrder': return renderPrimalOrderStep();
      case 'weaponMastery': return renderWeaponMasteryStep();
      case 'primalKnowledge': return renderPrimalKnowledgeStep();
      case 'asi': return renderAsiStep();
      case 'features': return renderFeaturesStep();
      case 'expertise': return renderExpertiseStep();
      case 'metamagic': return renderMetamagicStep();
      case 'invocations': return renderInvocationsStep();
      case 'cantripLearning': return renderCantripLearningStep();
      case 'spellLearning': return renderSpellLearningStep();
      case 'spells': return renderSpellsStep();
      case 'review': return renderReview();
      default: return null;
    }
  };

  return (
    <Panel className="max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-medieval text-xl text-gold">
          {CLASS_NAMES[character.characterClass]} Level {newLevel}
        </h2>
        <button onClick={onCancel} className="text-parchment/50 hover:text-parchment">✕</button>
      </div>

      {/* Progress indicator */}
      <div className="flex justify-center gap-1 mb-6">
        {steps.map((s, idx) => (
          <div
            key={s}
            className={`w-3 h-3 rounded-full transition-colors ${
              idx < currentStepIndex
                ? 'bg-gold'
                : idx === currentStepIndex
                ? 'bg-gold ring-2 ring-gold/50'
                : 'bg-leather'
            }`}
          />
        ))}
      </div>

      {renderCurrentStep()}

      {/* Navigation - hide for steps that auto-advance */}
      {!['subclass', 'pactBoon', 'fightingStyle', 'divineOrder', 'primalOrder', 'weaponMastery', 'primalKnowledge', 'spellLearning', 'cantripLearning', 'expertise', 'metamagic', 'invocations'].includes(step) && (
        <div className="flex justify-between mt-6 pt-4 border-t border-leather">
          <Button
            variant="secondary"
            onClick={currentStepIndex === 0 ? onCancel : prevStep}
          >
            {currentStepIndex === 0 ? 'Cancel' : 'Back'}
          </Button>

          {step !== 'review' && (
            <Button
              onClick={nextStep}
              disabled={!canProceed()}
            >
              Next
            </Button>
          )}
        </div>
      )}
    </Panel>
  );
}
