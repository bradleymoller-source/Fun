import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Panel } from '../ui/Panel';
import type { Character, Species, CharacterClass, AbilityScores, SkillName, ProficiencyLevel } from '../../types';
import {
  SPECIES_NAMES,
  CLASS_NAMES,
  ABILITY_NAMES,
  ABILITY_ABBREVIATIONS,
  CLASS_HIT_DICE,
  CLASS_SAVING_THROWS,
  SKILL_NAMES,
  SKILL_ABILITIES,
  ALL_SKILLS,
  BACKGROUNDS,
  ALIGNMENTS,
  STANDARD_ARRAY,
  SPECIES_SPEED,
  getAbilityModifier,
  formatModifier,
  getProficiencyBonus,
  getDefaultSkillProficiencies,
} from '../../data/dndData';

type CreationStep = 'basics' | 'abilities' | 'skills' | 'details' | 'review';

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
  const [characterClass, setCharacterClass] = useState<CharacterClass>('fighter');
  const [background, setBackground] = useState('Folk Hero');
  const [alignment, setAlignment] = useState('True Neutral');

  // Ability scores
  const [abilityScores, setAbilityScores] = useState<AbilityScores>({
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  });
  const [assignmentMethod, setAssignmentMethod] = useState<'standard' | 'manual'>('standard');
  const [standardArrayAssignments, setStandardArrayAssignments] = useState<(keyof AbilityScores | null)[]>([null, null, null, null, null, null]);

  // Skills
  const [skillProficiencies, setSkillProficiencies] = useState<Record<SkillName, ProficiencyLevel>>(getDefaultSkillProficiencies());

  // Personality
  const [personalityTraits, setPersonalityTraits] = useState('');
  const [ideals, setIdeals] = useState('');
  const [bonds, setBonds] = useState('');
  const [flaws, setFlaws] = useState('');
  const [backstory, setBackstory] = useState('');

  const steps: CreationStep[] = ['basics', 'abilities', 'skills', 'details', 'review'];
  const currentStepIndex = steps.indexOf(step);

  const canProceed = () => {
    switch (step) {
      case 'basics':
        return name.trim().length > 0;
      case 'abilities':
        if (assignmentMethod === 'standard') {
          return standardArrayAssignments.every(a => a !== null);
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      // If coming from abilities step with standard array, apply the scores
      if (step === 'abilities' && assignmentMethod === 'standard') {
        const newScores = { ...abilityScores };
        standardArrayAssignments.forEach((ability, idx) => {
          if (ability) {
            newScores[ability] = STANDARD_ARRAY[idx];
          }
        });
        setAbilityScores(newScores);
      }
      setStep(steps[currentStepIndex + 1]);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setStep(steps[currentStepIndex - 1]);
    }
  };

  const handleAbilityChange = (ability: keyof AbilityScores, value: number) => {
    setAbilityScores(prev => ({
      ...prev,
      [ability]: Math.max(1, Math.min(20, value)),
    }));
  };

  const handleStandardArrayAssign = (arrayIndex: number, ability: keyof AbilityScores) => {
    // Remove this ability from any other slot
    const newAssignments = standardArrayAssignments.map(a => a === ability ? null : a);
    // Assign to this slot
    newAssignments[arrayIndex] = ability;
    setStandardArrayAssignments(newAssignments);
  };

  const toggleSkillProficiency = (skill: SkillName) => {
    setSkillProficiencies(prev => ({
      ...prev,
      [skill]: prev[skill] === 'none' ? 'proficient' : 'none',
    }));
  };

  const createCharacter = (): Character => {
    const level = 1;
    const hitDie = CLASS_HIT_DICE[characterClass];
    const conMod = getAbilityModifier(abilityScores.constitution);
    const maxHp = hitDie + conMod;

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
      skillProficiencies,
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
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter character name"
        />
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
      </div>

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

  const renderAbilitiesStep = () => (
    <div className="space-y-4">
      <h3 className="font-medieval text-lg text-gold">Ability Scores</h3>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setAssignmentMethod('standard')}
          className={`px-3 py-1 rounded text-sm ${
            assignmentMethod === 'standard'
              ? 'bg-gold text-dark-wood'
              : 'bg-leather text-parchment hover:bg-leather/70'
          }`}
        >
          Standard Array
        </button>
        <button
          onClick={() => setAssignmentMethod('manual')}
          className={`px-3 py-1 rounded text-sm ${
            assignmentMethod === 'manual'
              ? 'bg-gold text-dark-wood'
              : 'bg-leather text-parchment hover:bg-leather/70'
          }`}
        >
          Manual Entry
        </button>
      </div>

      {assignmentMethod === 'standard' ? (
        <div className="space-y-3">
          <p className="text-parchment/70 text-sm">
            Assign each value to an ability score:
          </p>
          {STANDARD_ARRAY.map((value, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="text-gold font-bold w-8">{value}</span>
              <span className="text-parchment">→</span>
              <select
                value={standardArrayAssignments[idx] || ''}
                onChange={(e) => handleStandardArrayAssign(idx, e.target.value as keyof AbilityScores)}
                className="flex-1 bg-parchment text-dark-wood px-2 py-1 rounded"
              >
                <option value="">Select ability...</option>
                {(Object.keys(ABILITY_NAMES) as (keyof AbilityScores)[]).map(ability => (
                  <option
                    key={ability}
                    value={ability}
                    disabled={standardArrayAssignments.includes(ability) && standardArrayAssignments[idx] !== ability}
                  >
                    {ABILITY_NAMES[ability]}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(ABILITY_NAMES) as (keyof AbilityScores)[]).map(ability => (
            <div key={ability} className="bg-dark-wood p-3 rounded border border-leather">
              <label className="block text-parchment text-sm mb-1">
                {ABILITY_ABBREVIATIONS[ability]}
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAbilityChange(ability, abilityScores[ability] - 1)}
                  className="w-8 h-8 bg-leather rounded text-parchment hover:bg-gold hover:text-dark-wood"
                >
                  -
                </button>
                <span className="text-gold font-bold text-xl w-8 text-center">
                  {abilityScores[ability]}
                </span>
                <button
                  onClick={() => handleAbilityChange(ability, abilityScores[ability] + 1)}
                  className="w-8 h-8 bg-leather rounded text-parchment hover:bg-gold hover:text-dark-wood"
                >
                  +
                </button>
                <span className="text-parchment/70 text-sm">
                  ({formatModifier(getAbilityModifier(abilityScores[ability]))})
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSkillsStep = () => {
    const profBonus = getProficiencyBonus(1);
    const skillsByAbility: Record<keyof AbilityScores, SkillName[]> = {
      strength: ['athletics'],
      dexterity: ['acrobatics', 'sleightOfHand', 'stealth'],
      constitution: [],
      intelligence: ['arcana', 'history', 'investigation', 'nature', 'religion'],
      wisdom: ['animalHandling', 'insight', 'medicine', 'perception', 'survival'],
      charisma: ['deception', 'intimidation', 'performance', 'persuasion'],
    };

    return (
      <div className="space-y-4">
        <h3 className="font-medieval text-lg text-gold">Skill Proficiencies</h3>
        <p className="text-parchment/70 text-sm">
          Select skills you are proficient in (typically 2-4 from your class and background):
        </p>

        <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
          {(Object.keys(skillsByAbility) as (keyof AbilityScores)[]).map(ability => {
            const skills = skillsByAbility[ability];
            if (skills.length === 0) return null;

            return (
              <div key={ability}>
                <h4 className="text-gold text-sm font-semibold mb-2">
                  {ABILITY_NAMES[ability]} ({ABILITY_ABBREVIATIONS[ability]})
                </h4>
                <div className="space-y-1">
                  {skills.map(skill => {
                    const abilityScore = abilityScores[SKILL_ABILITIES[skill]];
                    const isProficient = skillProficiencies[skill] === 'proficient';
                    const modifier = getAbilityModifier(abilityScore) + (isProficient ? profBonus : 0);

                    return (
                      <label
                        key={skill}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                          isProficient ? 'bg-gold/20 border border-gold' : 'bg-dark-wood border border-leather hover:border-gold/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isProficient}
                            onChange={() => toggleSkillProficiency(skill)}
                            className="w-4 h-4"
                          />
                          <span className={isProficient ? 'text-gold' : 'text-parchment'}>
                            {SKILL_NAMES[skill]}
                          </span>
                        </div>
                        <span className={`font-bold ${isProficient ? 'text-gold' : 'text-parchment/70'}`}>
                          {formatModifier(modifier)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDetailsStep = () => (
    <div className="space-y-4">
      <h3 className="font-medieval text-lg text-gold">Personality & Backstory</h3>

      <div>
        <label className="block text-parchment text-sm mb-1">Personality Traits</label>
        <textarea
          value={personalityTraits}
          onChange={(e) => setPersonalityTraits(e.target.value)}
          placeholder="Describe your character's personality..."
          className="w-full bg-parchment text-dark-wood px-3 py-2 rounded h-20 resize-none focus:outline-none focus:ring-2 focus:ring-gold"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-parchment text-sm mb-1">Ideals</label>
          <textarea
            value={ideals}
            onChange={(e) => setIdeals(e.target.value)}
            placeholder="What drives you?"
            className="w-full bg-parchment text-dark-wood px-3 py-2 rounded h-16 resize-none focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>
        <div>
          <label className="block text-parchment text-sm mb-1">Bonds</label>
          <textarea
            value={bonds}
            onChange={(e) => setBonds(e.target.value)}
            placeholder="What connects you to the world?"
            className="w-full bg-parchment text-dark-wood px-3 py-2 rounded h-16 resize-none focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>
      </div>

      <div>
        <label className="block text-parchment text-sm mb-1">Flaws</label>
        <textarea
          value={flaws}
          onChange={(e) => setFlaws(e.target.value)}
          placeholder="What are your weaknesses?"
          className="w-full bg-parchment text-dark-wood px-3 py-2 rounded h-16 resize-none focus:outline-none focus:ring-2 focus:ring-gold"
        />
      </div>

      <div>
        <label className="block text-parchment text-sm mb-1">Backstory</label>
        <textarea
          value={backstory}
          onChange={(e) => setBackstory(e.target.value)}
          placeholder="Tell us about your character's history..."
          className="w-full bg-parchment text-dark-wood px-3 py-2 rounded h-24 resize-none focus:outline-none focus:ring-2 focus:ring-gold"
        />
      </div>
    </div>
  );

  const renderReviewStep = () => {
    const hitDie = CLASS_HIT_DICE[characterClass];
    const conMod = getAbilityModifier(abilityScores.constitution);
    const maxHp = Math.max(1, hitDie + conMod);
    const profBonus = getProficiencyBonus(1);

    return (
      <div className="space-y-4">
        <h3 className="font-medieval text-lg text-gold">Review Your Character</h3>

        <div className="bg-dark-wood p-4 rounded border border-leather space-y-3">
          <div className="text-center border-b border-leather pb-3">
            <h4 className="font-medieval text-2xl text-gold">{name || 'Unnamed Character'}</h4>
            <p className="text-parchment">
              {SPECIES_NAMES[species]} {CLASS_NAMES[characterClass]} (Level 1)
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
              {ALL_SKILLS
                .filter(skill => skillProficiencies[skill] === 'proficient')
                .map(skill => (
                  <span key={skill} className="bg-gold/20 text-gold px-2 py-0.5 rounded text-xs">
                    {SKILL_NAMES[skill]}
                  </span>
                ))}
              {ALL_SKILLS.filter(skill => skillProficiencies[skill] === 'proficient').length === 0 && (
                <span className="text-parchment/50 text-xs">None selected</span>
              )}
            </div>
          </div>

          <div>
            <div className="text-parchment/70 text-xs mb-1">Saving Throw Proficiencies:</div>
            <div className="flex gap-1">
              {CLASS_SAVING_THROWS[characterClass].map(save => (
                <span key={save} className="bg-gold/20 text-gold px-2 py-0.5 rounded text-xs">
                  {ABILITY_ABBREVIATIONS[save]}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="text-parchment/70 text-xs mb-1">Hit Dice: {1}d{hitDie}</div>
            <div className="text-parchment/70 text-xs">Proficiency Bonus: +{profBonus}</div>
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
      case 'details': return renderDetailsStep();
      case 'review': return renderReviewStep();
    }
  };

  return (
    <Panel className="max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-medieval text-xl text-gold">Create Character</h2>
        <button onClick={onCancel} className="text-parchment/50 hover:text-parchment">
          ✕
        </button>
      </div>

      {/* Progress indicator */}
      <div className="flex justify-between mb-6">
        {steps.map((s, idx) => (
          <div
            key={s}
            className={`flex-1 h-1 rounded mx-0.5 ${
              idx <= currentStepIndex ? 'bg-gold' : 'bg-leather'
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="mb-6">
        {renderCurrentStep()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="secondary"
          onClick={prevStep}
          disabled={currentStepIndex === 0}
        >
          Back
        </Button>

        {step === 'review' ? (
          <Button onClick={handleComplete}>
            Create Character
          </Button>
        ) : (
          <Button onClick={nextStep} disabled={!canProceed()}>
            Next
          </Button>
        )}
      </div>
    </Panel>
  );
}
