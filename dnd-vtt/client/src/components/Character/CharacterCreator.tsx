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
} from '../../data/dndData';

type CreationStep = 'basics' | 'abilities' | 'skills' | 'spells' | 'details' | 'review';

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
  const [background, setBackground] = useState('Folk Hero');
  const [alignment, setAlignment] = useState('True Neutral');

  // Ability scores
  const [abilityScores, setAbilityScores] = useState<AbilityScores>({
    strength: 15, dexterity: 14, constitution: 13,
    intelligence: 12, wisdom: 10, charisma: 8,
  });
  const [abilityMethod, setAbilityMethod] = useState<'standard' | 'roll'>('standard');

  // Skills
  const [selectedClassSkills, setSelectedClassSkills] = useState<SkillName[]>([]);

  // Spells
  const [selectedCantrips, setSelectedCantrips] = useState<string[]>([]);
  const [selectedSpells, setSelectedSpells] = useState<string[]>([]);

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

  const classInfo = CLASS_INFO[characterClass];
  const speciesInfo = SPECIES_INFO[species];
  const backgroundInfo = BACKGROUND_INFO[background];

  const steps: CreationStep[] = classInfo.isSpellcaster
    ? ['basics', 'abilities', 'skills', 'spells', 'details', 'review']
    : ['basics', 'abilities', 'skills', 'details', 'review'];
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
    const rolled = rollAllAbilityScores();
    rolled.sort((a, b) => b - a); // Sort descending
    const abilities: (keyof AbilityScores)[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
    const newScores: AbilityScores = { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 };
    abilities.forEach((ability, idx) => {
      newScores[ability] = rolled[idx];
    });
    setAbilityScores(newScores);
    setAbilityMethod('roll');
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

  const createCharacter = (): Character => {
    const level = 1;
    const hitDie = CLASS_HIT_DICE[characterClass];
    const conMod = getAbilityModifier(abilityScores.constitution);
    const maxHp = hitDie + conMod;

    // Combine background and class skill proficiencies
    const finalSkills = { ...getDefaultSkillProficiencies() };
    backgroundInfo.skillProficiencies.forEach(skill => {
      finalSkills[skill] = 'proficient';
    });
    selectedClassSkills.forEach(skill => {
      finalSkills[skill] = 'proficient';
    });

    const now = new Date().toISOString();

    return {
      id: `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      playerId,
      name,
      species,
      characterClass,
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
      armorClass: 10 + getAbilityModifier(abilityScores.dexterity),
      initiative: getAbilityModifier(abilityScores.dexterity),
      speed: SPECIES_SPEED[species],
      maxHitPoints: Math.max(1, maxHp),
      currentHitPoints: Math.max(1, maxHp),
      temporaryHitPoints: 0,
      hitDiceTotal: level,
      hitDiceRemaining: level,
      deathSaves: { successes: 0, failures: 0 },
      weapons: [],
      equipment: [],
      currency: { copper: 0, silver: 0, electrum: 0, gold: 10, platinum: 0 },
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
            setAbilityScores({ strength: 15, dexterity: 14, constitution: 13, intelligence: 12, wisdom: 10, charisma: 8 });
          }}>
            Standard Array
          </Button>
          <Button size="sm" variant={abilityMethod === 'roll' ? 'primary' : 'secondary'} onClick={handleRollAbilities}>
            Roll (4d6 drop lowest)
          </Button>
        </div>

        <p className="text-parchment/70 text-xs">
          {abilityMethod === 'standard'
            ? 'Standard Array: 15, 14, 13, 12, 10, 8. Click arrows to swap values between abilities.'
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
    const conMod = getAbilityModifier(abilityScores.constitution);
    const maxHp = Math.max(1, hitDie + conMod);
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
