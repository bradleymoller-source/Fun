import { useState } from 'react';
import type { Character, AbilityScores, SkillName } from '../../types';
import {
  ABILITY_NAMES,
  ABILITY_ABBREVIATIONS,
  SKILL_NAMES,
  SKILL_ABILITIES,
  CLASS_NAMES,
  SPECIES_NAMES,
  CLASS_HIT_DICE,
  getAbilityModifier,
  formatModifier,
  getProficiencyBonus,
  getSkillModifier,
} from '../../data/dndData';

type SheetTab = 'stats' | 'skills' | 'combat' | 'equipment' | 'spells' | 'bio';

interface CharacterSheetProps {
  character: Character;
  onUpdate?: (updates: Partial<Character>) => void;
  isEditable?: boolean;
}

export function CharacterSheet({ character, onUpdate, isEditable = true }: CharacterSheetProps) {
  const [activeTab, setActiveTab] = useState<SheetTab>('stats');

  const profBonus = getProficiencyBonus(character.level);
  const hitDie = CLASS_HIT_DICE[character.characterClass];

  const handleHpChange = (delta: number) => {
    if (!onUpdate) return;
    const newHp = Math.max(0, Math.min(character.maxHitPoints, character.currentHitPoints + delta));
    onUpdate({ currentHitPoints: newHp });
  };

  const tabs: { id: SheetTab; label: string }[] = [
    { id: 'stats', label: 'Stats' },
    { id: 'skills', label: 'Skills' },
    { id: 'combat', label: 'Combat' },
    { id: 'equipment', label: 'Gear' },
    { id: 'spells', label: 'Spells' },
    { id: 'bio', label: 'Bio' },
  ];

  const renderHeader = () => (
    <div className="text-center border-b border-leather pb-4 mb-4">
      <h2 className="font-medieval text-2xl text-gold">{character.name}</h2>
      <p className="text-parchment">
        Level {character.level} {SPECIES_NAMES[character.species]} {CLASS_NAMES[character.characterClass]}
      </p>
      <p className="text-parchment/70 text-sm">
        {character.background} • {character.alignment || 'Unaligned'}
      </p>
    </div>
  );

  const renderQuickStats = () => (
    <div className="grid grid-cols-4 gap-2 mb-4">
      <div className="bg-dark-wood p-2 rounded border border-leather text-center">
        <div className="text-gold font-bold text-xl">{character.armorClass}</div>
        <div className="text-parchment/70 text-xs">AC</div>
      </div>
      <div className="bg-dark-wood p-2 rounded border border-leather text-center">
        <div className="text-gold font-bold text-xl">
          {formatModifier(character.initiative)}
        </div>
        <div className="text-parchment/70 text-xs">Initiative</div>
      </div>
      <div className="bg-dark-wood p-2 rounded border border-leather text-center">
        <div className="text-gold font-bold text-xl">{character.speed} ft</div>
        <div className="text-parchment/70 text-xs">Speed</div>
      </div>
      <div className="bg-dark-wood p-2 rounded border border-leather text-center">
        <div className="text-gold font-bold text-xl">+{profBonus}</div>
        <div className="text-parchment/70 text-xs">Prof</div>
      </div>
    </div>
  );

  const renderHitPoints = () => (
    <div className="bg-dark-wood p-3 rounded border border-leather mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-parchment text-sm">Hit Points</span>
        <span className="text-parchment/70 text-xs">
          {character.hitDiceRemaining}d{hitDie} remaining
        </span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        {isEditable && (
          <button
            onClick={() => handleHpChange(-1)}
            className="w-8 h-8 bg-red-600 rounded text-white font-bold hover:bg-red-500"
          >
            -
          </button>
        )}
        <div className="flex-1 text-center">
          <span className="text-gold font-bold text-2xl">{character.currentHitPoints}</span>
          <span className="text-parchment/70"> / {character.maxHitPoints}</span>
        </div>
        {isEditable && (
          <button
            onClick={() => handleHpChange(1)}
            className="w-8 h-8 bg-green-600 rounded text-white font-bold hover:bg-green-500"
          >
            +
          </button>
        )}
      </div>
      {character.temporaryHitPoints > 0 && (
        <div className="text-center text-blue-400 text-sm">
          +{character.temporaryHitPoints} temp HP
        </div>
      )}
      {/* HP Bar */}
      <div className="h-2 bg-leather rounded overflow-hidden">
        <div
          className="h-full bg-green-500 transition-all"
          style={{ width: `${(character.currentHitPoints / character.maxHitPoints) * 100}%` }}
        />
      </div>
    </div>
  );

  const renderStatsTab = () => (
    <div className="space-y-4">
      {renderQuickStats()}
      {renderHitPoints()}

      {/* Ability Scores */}
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(ABILITY_ABBREVIATIONS) as (keyof AbilityScores)[]).map(ability => {
          const score = character.abilityScores[ability];
          const modifier = getAbilityModifier(score);
          const isProficient = character.savingThrowProficiencies.includes(ability);
          const saveMod = modifier + (isProficient ? profBonus : 0);

          return (
            <div key={ability} className="bg-dark-wood p-3 rounded border border-leather text-center">
              <div className="text-parchment/70 text-xs mb-1">{ABILITY_NAMES[ability]}</div>
              <div className="text-gold font-bold text-2xl">{score}</div>
              <div className="text-parchment font-bold">{formatModifier(modifier)}</div>
              <div className="mt-2 pt-2 border-t border-leather">
                <div className={`text-xs ${isProficient ? 'text-gold' : 'text-parchment/50'}`}>
                  Save: {formatModifier(saveMod)} {isProficient && '●'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Death Saves */}
      {character.currentHitPoints === 0 && (
        <div className="bg-red-900/30 p-3 rounded border border-red-500">
          <div className="text-red-300 font-semibold mb-2">Death Saving Throws</div>
          <div className="flex justify-between">
            <div>
              <span className="text-green-400">Successes: </span>
              {[1, 2, 3].map(i => (
                <span key={i} className={`mx-0.5 ${i <= character.deathSaves.successes ? 'text-green-400' : 'text-parchment/30'}`}>●</span>
              ))}
            </div>
            <div>
              <span className="text-red-400">Failures: </span>
              {[1, 2, 3].map(i => (
                <span key={i} className={`mx-0.5 ${i <= character.deathSaves.failures ? 'text-red-400' : 'text-parchment/30'}`}>●</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSkillsTab = () => {
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
        <div className="bg-dark-wood p-2 rounded border border-leather text-center">
          <span className="text-parchment/70 text-sm">Passive Perception: </span>
          <span className="text-gold font-bold">
            {10 + getSkillModifier(
              character.abilityScores.wisdom,
              character.skillProficiencies.perception,
              profBonus
            )}
          </span>
        </div>

        {(Object.keys(skillsByAbility) as (keyof AbilityScores)[]).map(ability => {
          const skills = skillsByAbility[ability];
          if (skills.length === 0) return null;

          return (
            <div key={ability}>
              <h4 className="text-gold text-sm font-semibold mb-2">
                {ABILITY_NAMES[ability]}
              </h4>
              <div className="space-y-1">
                {skills.map(skill => {
                  const profLevel = character.skillProficiencies[skill];
                  const modifier = getSkillModifier(
                    character.abilityScores[SKILL_ABILITIES[skill]],
                    profLevel,
                    profBonus
                  );

                  return (
                    <div
                      key={skill}
                      className={`flex items-center justify-between p-2 rounded ${
                        profLevel !== 'none' ? 'bg-gold/10 border border-gold/30' : 'bg-dark-wood border border-leather'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={profLevel !== 'none' ? 'text-gold' : 'text-parchment/50'}>
                          {profLevel === 'expertise' ? '◆' : profLevel === 'proficient' ? '●' : '○'}
                        </span>
                        <span className={profLevel !== 'none' ? 'text-gold' : 'text-parchment'}>
                          {SKILL_NAMES[skill]}
                        </span>
                      </div>
                      <span className={`font-bold ${profLevel !== 'none' ? 'text-gold' : 'text-parchment/70'}`}>
                        {formatModifier(modifier)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderCombatTab = () => (
    <div className="space-y-4">
      {renderQuickStats()}
      {renderHitPoints()}

      {/* Weapons */}
      <div>
        <h4 className="text-gold font-semibold mb-2">Weapons</h4>
        {character.weapons.length === 0 ? (
          <p className="text-parchment/50 text-sm">No weapons equipped</p>
        ) : (
          <div className="space-y-2">
            {character.weapons.map(weapon => (
              <div key={weapon.id} className="bg-dark-wood p-2 rounded border border-leather flex justify-between items-center">
                <div>
                  <div className="text-parchment font-semibold">{weapon.name}</div>
                  <div className="text-parchment/70 text-xs">{weapon.damage}</div>
                </div>
                <div className="text-gold font-bold">
                  {formatModifier(weapon.attackBonus)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Proficiencies */}
      <div>
        <h4 className="text-gold font-semibold mb-2">Proficiencies</h4>
        <div className="bg-dark-wood p-3 rounded border border-leather space-y-2 text-sm">
          {character.armorProficiencies.length > 0 && (
            <div>
              <span className="text-parchment/70">Armor: </span>
              <span className="text-parchment">{character.armorProficiencies.join(', ')}</span>
            </div>
          )}
          {character.weaponProficiencies.length > 0 && (
            <div>
              <span className="text-parchment/70">Weapons: </span>
              <span className="text-parchment">{character.weaponProficiencies.join(', ')}</span>
            </div>
          )}
          {character.toolProficiencies.length > 0 && (
            <div>
              <span className="text-parchment/70">Tools: </span>
              <span className="text-parchment">{character.toolProficiencies.join(', ')}</span>
            </div>
          )}
          <div>
            <span className="text-parchment/70">Languages: </span>
            <span className="text-parchment">{character.languages.join(', ')}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEquipmentTab = () => (
    <div className="space-y-4">
      {/* Currency */}
      <div>
        <h4 className="text-gold font-semibold mb-2">Currency</h4>
        <div className="grid grid-cols-5 gap-1 text-center">
          {(['copper', 'silver', 'electrum', 'gold', 'platinum'] as const).map(coin => (
            <div key={coin} className="bg-dark-wood p-2 rounded border border-leather">
              <div className="text-gold font-bold">{character.currency[coin]}</div>
              <div className="text-parchment/70 text-xs uppercase">{coin.slice(0, 2)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Equipment */}
      <div>
        <h4 className="text-gold font-semibold mb-2">Equipment</h4>
        {character.equipment.length === 0 ? (
          <p className="text-parchment/50 text-sm text-center py-4">
            No equipment yet
          </p>
        ) : (
          <div className="space-y-1">
            {character.equipment.map(item => (
              <div key={item.id} className="bg-dark-wood p-2 rounded border border-leather flex justify-between">
                <span className="text-parchment">{item.name}</span>
                {item.quantity > 1 && (
                  <span className="text-parchment/70">×{item.quantity}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderSpellsTab = () => {
    if (!character.spellcasting) {
      return (
        <div className="text-center py-8">
          <p className="text-parchment/50">This character does not have spellcasting abilities.</p>
        </div>
      );
    }

    const { ability, spellSaveDC, spellAttackBonus, spells, spellSlots, spellSlotsUsed } = character.spellcasting;

    return (
      <div className="space-y-4">
        {/* Spellcasting Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-dark-wood p-2 rounded border border-leather">
            <div className="text-gold font-bold">{ABILITY_ABBREVIATIONS[ability]}</div>
            <div className="text-parchment/70 text-xs">Ability</div>
          </div>
          <div className="bg-dark-wood p-2 rounded border border-leather">
            <div className="text-gold font-bold">{spellSaveDC}</div>
            <div className="text-parchment/70 text-xs">Save DC</div>
          </div>
          <div className="bg-dark-wood p-2 rounded border border-leather">
            <div className="text-gold font-bold">{formatModifier(spellAttackBonus)}</div>
            <div className="text-parchment/70 text-xs">Attack</div>
          </div>
        </div>

        {/* Spell Slots */}
        <div>
          <h4 className="text-gold font-semibold mb-2">Spell Slots</h4>
          <div className="flex flex-wrap gap-2">
            {spellSlots.map((slots, idx) => {
              if (slots === 0) return null;
              const level = idx + 1;
              const used = spellSlotsUsed[idx] || 0;
              return (
                <div key={idx} className="bg-dark-wood p-2 rounded border border-leather text-center min-w-[60px]">
                  <div className="text-parchment/70 text-xs">Level {level}</div>
                  <div className="text-gold font-bold">{slots - used}/{slots}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Spell List */}
        <div>
          <h4 className="text-gold font-semibold mb-2">Spells</h4>
          {spells.length === 0 ? (
            <p className="text-parchment/50 text-sm text-center py-4">No spells known</p>
          ) : (
            <div className="space-y-1">
              {spells
                .sort((a, b) => a.level - b.level)
                .map(spell => (
                  <div key={spell.id} className="bg-dark-wood p-2 rounded border border-leather">
                    <div className="flex justify-between items-center">
                      <span className="text-parchment">{spell.name}</span>
                      <span className="text-parchment/70 text-xs">
                        {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderBioTab = () => (
    <div className="space-y-4">
      {/* Features */}
      <div>
        <h4 className="text-gold font-semibold mb-2">Features & Traits</h4>
        {character.features.length === 0 ? (
          <p className="text-parchment/50 text-sm">No features or traits</p>
        ) : (
          <div className="space-y-2">
            {character.features.map(feature => (
              <div key={feature.id} className="bg-dark-wood p-3 rounded border border-leather">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-gold font-semibold">{feature.name}</span>
                  <span className="text-parchment/50 text-xs">{feature.source}</span>
                </div>
                <p className="text-parchment text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Personality */}
      {character.personalityTraits && (
        <div>
          <h4 className="text-gold font-semibold mb-2">Personality Traits</h4>
          <p className="text-parchment text-sm bg-dark-wood p-3 rounded border border-leather">
            {character.personalityTraits}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {character.ideals && (
          <div>
            <h4 className="text-gold font-semibold mb-2">Ideals</h4>
            <p className="text-parchment text-sm bg-dark-wood p-3 rounded border border-leather">
              {character.ideals}
            </p>
          </div>
        )}
        {character.bonds && (
          <div>
            <h4 className="text-gold font-semibold mb-2">Bonds</h4>
            <p className="text-parchment text-sm bg-dark-wood p-3 rounded border border-leather">
              {character.bonds}
            </p>
          </div>
        )}
      </div>

      {character.flaws && (
        <div>
          <h4 className="text-gold font-semibold mb-2">Flaws</h4>
          <p className="text-parchment text-sm bg-dark-wood p-3 rounded border border-leather">
            {character.flaws}
          </p>
        </div>
      )}

      {character.backstory && (
        <div>
          <h4 className="text-gold font-semibold mb-2">Backstory</h4>
          <p className="text-parchment text-sm bg-dark-wood p-3 rounded border border-leather whitespace-pre-wrap">
            {character.backstory}
          </p>
        </div>
      )}
    </div>
  );

  const renderCurrentTab = () => {
    switch (activeTab) {
      case 'stats': return renderStatsTab();
      case 'skills': return renderSkillsTab();
      case 'combat': return renderCombatTab();
      case 'equipment': return renderEquipmentTab();
      case 'spells': return renderSpellsTab();
      case 'bio': return renderBioTab();
    }
  };

  return (
    <div className="space-y-4">
      {renderHeader()}

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 bg-dark-wood p-1 rounded border border-leather">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[60px] px-2 py-1.5 rounded text-sm transition-colors ${
              activeTab === tab.id
                ? 'bg-gold text-dark-wood font-semibold'
                : 'text-parchment hover:bg-leather'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {renderCurrentTab()}
      </div>
    </div>
  );
}
