import type { ReactNode } from 'react';
import type { Monster, AbilityScores, MonsterAction } from '../../types';

interface MonsterStatBlockProps {
  monster: Monster;
  onClose?: () => void;
  onRollAttack?: (name: string, attackBonus: number, damage: string) => void;
  onRollSave?: (ability: keyof AbilityScores, modifier: number) => void;
  compact?: boolean;
}

// Calculate ability modifier
function getModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

// Format modifier with + or -
function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

// Ability score abbreviations
const ABILITY_ABBREV: Record<keyof AbilityScores, string> = {
  strength: 'STR',
  dexterity: 'DEX',
  constitution: 'CON',
  intelligence: 'INT',
  wisdom: 'WIS',
  charisma: 'CHA',
};

export function MonsterStatBlock({
  monster,
  onClose,
  onRollAttack,
  onRollSave,
  compact = false,
}: MonsterStatBlockProps) {
  const renderAbilityScores = () => (
    <div className="grid grid-cols-6 gap-1 text-center border-y border-deep-red py-2 my-2">
      {(Object.keys(ABILITY_ABBREV) as (keyof AbilityScores)[]).map((ability) => (
        <button
          key={ability}
          onClick={() => onRollSave?.(ability, getModifier(monster.abilities[ability]))}
          className="hover:bg-deep-red/20 rounded p-1 transition-colors"
          title={`Roll ${ABILITY_ABBREV[ability]} check`}
        >
          <div className="text-xs text-parchment/70">{ABILITY_ABBREV[ability]}</div>
          <div className="font-bold text-parchment">{monster.abilities[ability]}</div>
          <div className="text-xs text-gold">
            ({formatModifier(getModifier(monster.abilities[ability]))})
          </div>
        </button>
      ))}
    </div>
  );

  const renderDefenses = () => {
    const defenses: ReactNode[] = [];

    if (monster.damageVulnerabilities?.length) {
      defenses.push(
        <div key="vuln" className="text-sm">
          <span className="text-parchment/70">Vulnerabilities:</span>{' '}
          <span className="text-red-400">{monster.damageVulnerabilities.join(', ')}</span>
        </div>
      );
    }
    if (monster.damageResistances?.length) {
      defenses.push(
        <div key="resist" className="text-sm">
          <span className="text-parchment/70">Resistances:</span>{' '}
          <span className="text-yellow-400">{monster.damageResistances.join(', ')}</span>
        </div>
      );
    }
    if (monster.damageImmunities?.length) {
      defenses.push(
        <div key="immune" className="text-sm">
          <span className="text-parchment/70">Immunities:</span>{' '}
          <span className="text-green-400">{monster.damageImmunities.join(', ')}</span>
        </div>
      );
    }
    if (monster.conditionImmunities?.length) {
      defenses.push(
        <div key="condImm" className="text-sm">
          <span className="text-parchment/70">Condition Immunities:</span>{' '}
          <span className="text-blue-400">{monster.conditionImmunities.join(', ')}</span>
        </div>
      );
    }

    return defenses.length > 0 ? <div className="space-y-1 my-2">{defenses}</div> : null;
  };

  const renderSavingThrows = () => {
    if (!monster.savingThrows || Object.keys(monster.savingThrows).length === 0) return null;

    const saves = Object.entries(monster.savingThrows)
      .filter(([_, value]) => value !== undefined)
      .map(([ability, value]) => `${ABILITY_ABBREV[ability as keyof AbilityScores]} ${formatModifier(value!)}`)
      .join(', ');

    return (
      <div className="text-sm">
        <span className="text-parchment/70">Saving Throws:</span>{' '}
        <span className="text-parchment">{saves}</span>
      </div>
    );
  };

  const renderSkills = () => {
    if (!monster.skills || Object.keys(monster.skills).length === 0) return null;

    const skills = Object.entries(monster.skills)
      .map(([skill, value]) => `${skill} ${formatModifier(value)}`)
      .join(', ');

    return (
      <div className="text-sm">
        <span className="text-parchment/70">Skills:</span>{' '}
        <span className="text-parchment">{skills}</span>
      </div>
    );
  };

  const renderActions = (title: string, actions: MonsterAction[] | undefined) => {
    if (!actions || actions.length === 0) return null;

    return (
      <div className="mt-4">
        <h4 className="font-medieval text-deep-red border-b border-deep-red pb-1 mb-2">
          {title}
        </h4>
        <div className="space-y-2">
          {actions.map((action) => (
            <div key={action.id}>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-parchment italic">{action.name}.</span>
                {action.attackBonus !== undefined && (
                  <button
                    onClick={() => onRollAttack?.(action.name, action.attackBonus!, action.damage || '')}
                    className="text-xs bg-deep-red/30 hover:bg-deep-red/50 px-2 py-0.5 rounded transition-colors"
                    title="Roll attack"
                  >
                    {formatModifier(action.attackBonus)} to hit
                  </button>
                )}
                {action.damage && (
                  <span className="text-xs text-gold">({action.damage})</span>
                )}
              </div>
              <p className="text-sm text-parchment/80 ml-4">{action.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTraits = () => {
    if (!monster.traits || monster.traits.length === 0) return null;

    return (
      <div className="mt-4">
        <div className="space-y-2">
          {monster.traits.map((trait) => (
            <div key={trait.id}>
              <span className="font-semibold text-parchment italic">{trait.name}.</span>{' '}
              <span className="text-sm text-parchment/80">{trait.description}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderLegendaryActions = () => {
    if (!monster.legendaryActions || monster.legendaryActions.length === 0) return null;

    return (
      <div className="mt-4">
        <h4 className="font-medieval text-deep-red border-b border-deep-red pb-1 mb-2">
          Legendary Actions
        </h4>
        <p className="text-xs text-parchment/70 mb-2">
          Can take {monster.legendaryActionCount || 3} legendary actions, choosing from the options below.
          Only one legendary action option can be used at a time and only at the end of another creature's turn.
        </p>
        <div className="space-y-2">
          {monster.legendaryActions.map((action) => (
            <div key={action.id}>
              <span className="font-semibold text-parchment italic">
                {action.name} (Costs {action.cost} Action{action.cost > 1 ? 's' : ''}).
              </span>{' '}
              <span className="text-sm text-parchment/80">{action.description}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (compact) {
    return (
      <div className="bg-dark-wood rounded-lg border border-deep-red p-3 text-parchment">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-medieval text-lg text-gold">{monster.name}</h3>
            <p className="text-xs text-parchment/70">
              {monster.size} {monster.type}, {monster.alignment}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-parchment/50 hover:text-parchment"
            >
              ✕
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <span className="text-parchment/70">AC:</span> {monster.armorClass}
          </div>
          <div>
            <span className="text-parchment/70">HP:</span> {monster.hitPoints}
          </div>
          <div>
            <span className="text-parchment/70">CR:</span> {monster.challengeRating}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-wood rounded-lg border-2 border-deep-red p-4 text-parchment max-h-[600px] overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-medieval text-2xl text-gold">{monster.name}</h3>
          <p className="text-sm italic text-parchment/70">
            {monster.size} {monster.type}, {monster.alignment}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-parchment/50 hover:text-parchment text-xl"
          >
            ✕
          </button>
        )}
      </div>

      {/* Combat Stats */}
      <div className="border-t border-deep-red pt-2 mt-2 space-y-1">
        <div className="text-sm">
          <span className="text-parchment/70">Armor Class:</span>{' '}
          <span className="text-parchment">
            {monster.armorClass}
            {monster.armorType && ` (${monster.armorType})`}
          </span>
        </div>
        <div className="text-sm">
          <span className="text-parchment/70">Hit Points:</span>{' '}
          <span className="text-parchment">
            {monster.hitPoints} ({monster.hitDice})
          </span>
        </div>
        <div className="text-sm">
          <span className="text-parchment/70">Speed:</span>{' '}
          <span className="text-parchment">{monster.speed}</span>
        </div>
      </div>

      {/* Ability Scores */}
      {renderAbilityScores()}

      {/* Saves, Skills, Senses */}
      <div className="space-y-1">
        {renderSavingThrows()}
        {renderSkills()}
        {renderDefenses()}
        <div className="text-sm">
          <span className="text-parchment/70">Senses:</span>{' '}
          <span className="text-parchment">{monster.senses}</span>
        </div>
        <div className="text-sm">
          <span className="text-parchment/70">Languages:</span>{' '}
          <span className="text-parchment">{monster.languages || '—'}</span>
        </div>
        <div className="text-sm">
          <span className="text-parchment/70">Challenge:</span>{' '}
          <span className="text-parchment">
            {monster.challengeRating} ({monster.xp.toLocaleString()} XP)
          </span>
        </div>
      </div>

      {/* Traits */}
      {renderTraits()}

      {/* Actions */}
      {renderActions('Actions', monster.actions)}

      {/* Bonus Actions */}
      {renderActions('Bonus Actions', monster.bonusActions)}

      {/* Reactions */}
      {renderActions('Reactions', monster.reactions)}

      {/* Legendary Actions */}
      {renderLegendaryActions()}

      {/* Notes */}
      {monster.notes && (
        <div className="mt-4 p-2 bg-leather/20 rounded border border-leather">
          <h4 className="text-sm font-semibold text-gold mb-1">DM Notes</h4>
          <p className="text-sm text-parchment/80">{monster.notes}</p>
        </div>
      )}

      {/* Source */}
      {monster.source && (
        <div className="mt-4 text-xs text-parchment/50 text-right italic">
          Source: {monster.source}
        </div>
      )}
    </div>
  );
}
