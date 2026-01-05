import { useState } from 'react';
import type { Character, SkillName } from '../../types';
import { Button } from '../ui/Button';
import { PRIMAL_KNOWLEDGE_SKILLS, SKILL_ABILITIES, SKILL_NAMES } from '../../data/dndData';

interface PrimalKnowledgeSelectionProps {
  character: Character;
  onSelect: (skill: SkillName) => void;
}

export function PrimalKnowledgeSelection({ character, onSelect }: PrimalKnowledgeSelectionProps) {
  const [selectedSkill, setSelectedSkill] = useState<SkillName | null>(null);

  // Filter out skills the character is already proficient in
  const availableSkills = PRIMAL_KNOWLEDGE_SKILLS.filter(
    skill => character.skillProficiencies[skill] === 'none'
  );

  const handleConfirm = () => {
    if (selectedSkill) {
      onSelect(selectedSkill);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="font-medieval text-xl text-gold">Primal Knowledge</h3>
        <p className="text-parchment/70 text-sm mt-1">
          Your instinctive connection to nature grants you additional knowledge
        </p>
      </div>

      <div className="p-4 bg-dark-wood rounded border border-leather mb-4">
        <p className="text-parchment/80 text-sm">
          At 3rd level, you gain proficiency in one skill of your choice from the following list.
          Choose a skill that reflects your primal instincts.
        </p>
      </div>

      {/* Skill Options */}
      <div className="space-y-2">
        {availableSkills.map(skill => {
          const isSelected = selectedSkill === skill;
          const ability = SKILL_ABILITIES[skill];

          return (
            <div
              key={skill}
              className={`p-3 rounded border cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-amber-900/30 border-amber-500'
                  : 'bg-leather/30 border-leather hover:border-amber-500/50'
              }`}
              onClick={() => setSelectedSkill(skill)}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${isSelected ? 'text-amber-300' : 'text-parchment'}`}>
                    {SKILL_NAMES[skill]}
                  </span>
                  <span className="text-xs text-parchment/50">
                    ({ability.slice(0, 3).toUpperCase()})
                  </span>
                </div>
                {isSelected && (
                  <span className="text-xs bg-amber-600/50 text-amber-200 px-2 py-0.5 rounded">
                    Selected
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {availableSkills.length === 0 && (
        <div className="p-4 bg-amber-900/20 rounded border border-amber-500/30 text-center">
          <p className="text-parchment/70 text-sm">
            You are already proficient in all Primal Knowledge skills.
          </p>
        </div>
      )}

      {/* Confirm */}
      <div className="p-3 bg-amber-900/20 rounded border border-amber-500/30">
        <div className="flex justify-between items-center">
          <div className="text-parchment text-sm">
            {selectedSkill
              ? `Chosen: ${SKILL_NAMES[selectedSkill]}`
              : 'Select a skill to continue'}
          </div>
          <Button
            onClick={handleConfirm}
            disabled={!selectedSkill}
            variant="primary"
            size="sm"
          >
            Confirm Skill
          </Button>
        </div>
      </div>
    </div>
  );
}
