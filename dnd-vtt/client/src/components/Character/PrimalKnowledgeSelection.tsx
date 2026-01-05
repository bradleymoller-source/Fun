import type { Character, SkillName } from '../../types';
import { PRIMAL_KNOWLEDGE_SKILLS, SKILL_NAMES } from '../../data/dndData';

interface PrimalKnowledgeSelectionProps {
  character: Character;
  onSelect: (skill: SkillName) => void;
}

export function PrimalKnowledgeSelection({ character, onSelect }: PrimalKnowledgeSelectionProps) {
  // Filter out skills the character already has proficiency in
  const availableSkills = PRIMAL_KNOWLEDGE_SKILLS.filter(skill => {
    const profLevel = character.skillProficiencies[skill];
    return !profLevel || profLevel === 'none';
  });

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medieval text-lg text-gold">Primal Knowledge</h3>
        <p className="text-parchment/70 text-sm">
          At 3rd level, you gain proficiency in one skill from the following list.
          Choose a skill that represents your connection to the primal world.
        </p>
      </div>

      <div className="space-y-2">
        {availableSkills.map(skill => (
          <button
            key={skill}
            onClick={() => onSelect(skill)}
            className="w-full p-4 rounded border border-leather bg-dark-wood hover:border-amber-500 hover:bg-amber-900/20 transition-colors text-left"
          >
            <div className="text-amber-300 font-semibold">{SKILL_NAMES[skill]}</div>
          </button>
        ))}
      </div>

      {availableSkills.length === 0 && (
        <div className="text-parchment/50 text-sm italic">
          You already have proficiency in all available Primal Knowledge skills.
          <button
            onClick={() => onSelect(PRIMAL_KNOWLEDGE_SKILLS[0])}
            className="block mt-2 px-4 py-2 rounded bg-gold text-dark-wood font-semibold hover:bg-amber-400"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
