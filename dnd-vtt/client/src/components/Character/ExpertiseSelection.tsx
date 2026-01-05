import { useState } from 'react';
import type { Character, SkillName } from '../../types';
import { Button } from '../ui/Button';
import {
  CLASS_NAMES,
  SKILL_NAMES,
} from '../../data/dndData';

interface ExpertiseSelectionProps {
  character: Character;
  expertiseCount: number; // How many skills to choose
  onSelect: (skills: SkillName[]) => void;
}

export function ExpertiseSelection({
  character,
  expertiseCount,
  onSelect,
}: ExpertiseSelectionProps) {
  const [selectedSkills, setSelectedSkills] = useState<SkillName[]>([]);

  // Get skills the character is proficient in but doesn't have expertise
  const eligibleSkills = (Object.entries(character.skillProficiencies) as [SkillName, string][])
    .filter(([, proficiency]) => proficiency === 'proficient')
    .map(([skill]) => skill);

  // Also include already selected expertise for display purposes
  const currentExpertise = (Object.entries(character.skillProficiencies) as [SkillName, string][])
    .filter(([, proficiency]) => proficiency === 'expertise')
    .map(([skill]) => skill);

  const handleSkillToggle = (skill: SkillName) => {
    setSelectedSkills(prev => {
      if (prev.includes(skill)) {
        return prev.filter(s => s !== skill);
      } else if (prev.length < expertiseCount) {
        return [...prev, skill];
      }
      return prev;
    });
  };

  const handleConfirm = () => {
    if (selectedSkills.length === expertiseCount) {
      onSelect(selectedSkills);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="font-medieval text-xl text-gold">Choose Expertise</h3>
        <p className="text-parchment/70 text-sm mt-1">
          Your {CLASS_NAMES[character.characterClass]} training grants you expertise in{' '}
          {expertiseCount} skill{expertiseCount > 1 ? 's' : ''}
        </p>
      </div>

      <div className="p-4 bg-dark-wood rounded border border-leather mb-4">
        <div className="flex justify-between items-center">
          <span className="text-parchment">Skills to choose:</span>
          <span className="text-gold font-bold">
            {selectedSkills.length} / {expertiseCount}
          </span>
        </div>
        <p className="text-parchment/60 text-xs mt-2">
          Expertise doubles your proficiency bonus for the chosen skills
        </p>
      </div>

      {/* Current Expertise (if any) */}
      {currentExpertise.length > 0 && (
        <div className="p-3 bg-purple-900/20 rounded border border-purple-500/30 mb-4">
          <div className="text-purple-300 text-sm font-semibold mb-1">
            Current Expertise:
          </div>
          <div className="flex flex-wrap gap-1">
            {currentExpertise.map(skill => (
              <span
                key={skill}
                className="bg-purple-900/30 text-purple-200 px-2 py-0.5 rounded text-xs"
              >
                {SKILL_NAMES[skill]}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Skill Selection */}
      <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
        {eligibleSkills.length === 0 ? (
          <div className="p-4 bg-dark-wood rounded border border-leather text-center">
            <p className="text-parchment/70">
              You must have skill proficiencies to choose expertise.
            </p>
          </div>
        ) : (
          eligibleSkills.map(skill => {
            const isSelected = selectedSkills.includes(skill);
            const isDisabled = !isSelected && selectedSkills.length >= expertiseCount;

            return (
              <div
                key={skill}
                className={`p-3 rounded border cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-gold/20 border-gold'
                    : isDisabled
                    ? 'bg-dark-wood/50 border-leather/30 opacity-50 cursor-not-allowed'
                    : 'bg-leather/30 border-leather hover:border-gold/50'
                }`}
                onClick={() => !isDisabled && handleSkillToggle(skill)}
              >
                <div className="flex justify-between items-center">
                  <span className={isSelected ? 'text-gold font-semibold' : 'text-parchment'}>
                    {SKILL_NAMES[skill]}
                  </span>
                  {isSelected && (
                    <span className="text-green-400 text-xs">×2 proficiency</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirm */}
      <div className="p-3 bg-gold/10 rounded border border-gold/30">
        <div className="flex justify-between items-center">
          <div className="text-parchment text-sm">
            {selectedSkills.length === expertiseCount
              ? `Expertise in: ${selectedSkills.map(s => SKILL_NAMES[s]).join(', ')}`
              : `Select ${expertiseCount - selectedSkills.length} more skill${
                  expertiseCount - selectedSkills.length > 1 ? 's' : ''
                }`}
          </div>
          <Button
            onClick={handleConfirm}
            disabled={selectedSkills.length !== expertiseCount}
            variant="primary"
            size="sm"
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
