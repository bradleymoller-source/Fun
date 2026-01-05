import { useState } from 'react';
import type { Character, SkillName } from '../../types';
import { SKILL_NAMES, CLASS_NAMES } from '../../data/dndData';

interface ExpertiseSelectionProps {
  character: Character;
  expertiseCount: number;
  onSelect: (skills: SkillName[]) => void;
}

export function ExpertiseSelection({ character, expertiseCount, onSelect }: ExpertiseSelectionProps) {
  const [selectedSkills, setSelectedSkills] = useState<SkillName[]>([]);

  // Get skills the character is proficient in but doesn't have expertise
  const eligibleSkills = (Object.keys(character.skillProficiencies) as SkillName[])
    .filter(skill => {
      const profLevel = character.skillProficiencies[skill];
      return profLevel === 'proficient'; // Only proficient skills, not already expertise
    });

  const toggleSkill = (skill: SkillName) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else if (selectedSkills.length < expertiseCount) {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleConfirm = () => {
    onSelect(selectedSkills);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medieval text-lg text-gold">Choose Expertise</h3>
        <p className="text-parchment/70 text-sm">
          Choose {expertiseCount} skill{expertiseCount > 1 ? 's' : ''} to gain Expertise (double proficiency bonus).
          {' '}Selected: {selectedSkills.length}/{expertiseCount}
        </p>
      </div>

      <div className="space-y-2">
        {eligibleSkills.map(skill => {
          const isSelected = selectedSkills.includes(skill);
          return (
            <button
              key={skill}
              onClick={() => toggleSkill(skill)}
              disabled={!isSelected && selectedSkills.length >= expertiseCount}
              className={`w-full p-3 rounded border text-left transition-colors ${
                isSelected
                  ? 'border-purple-500 bg-purple-900/30 text-purple-300'
                  : selectedSkills.length >= expertiseCount
                  ? 'border-leather/50 bg-dark-wood/50 text-parchment/30 cursor-not-allowed'
                  : 'border-leather bg-dark-wood hover:border-gold/50'
              }`}
            >
              <div className="font-semibold">{SKILL_NAMES[skill]}</div>
            </button>
          );
        })}
      </div>

      {eligibleSkills.length === 0 && (
        <p className="text-parchment/50 text-sm italic">
          No eligible skills for expertise. You need skill proficiencies first.
        </p>
      )}

      <button
        onClick={handleConfirm}
        disabled={selectedSkills.length !== expertiseCount}
        className={`w-full px-4 py-2 rounded font-semibold transition-colors ${
          selectedSkills.length === expertiseCount
            ? 'bg-gold text-dark-wood hover:bg-amber-400'
            : 'bg-leather/50 text-parchment/50 cursor-not-allowed'
        }`}
      >
        Confirm Expertise
      </button>
    </div>
  );
}
