import type { Character } from '../types';

/**
 * Export a character to a JSON file for download
 */
export function exportCharacter(character: Character): void {
  // Create a clean copy without internal IDs that might conflict
  const exportData = {
    ...character,
    exportedAt: new Date().toISOString(),
    version: '1.0', // For future compatibility
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${character.name.replace(/[^a-zA-Z0-9]/g, '_')}_character.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import a character from a JSON file
 * Returns the parsed character or throws an error if invalid
 */
export async function importCharacter(file: File): Promise<Partial<Character>> {
  return new Promise((resolve, reject) => {
    if (!file.name.endsWith('.json')) {
      reject(new Error('File must be a JSON file'));
      return;
    }

    if (file.size > 1024 * 1024) { // 1MB limit
      reject(new Error('File is too large (max 1MB)'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);

        // Validate required fields
        if (!data.name || typeof data.name !== 'string') {
          reject(new Error('Invalid character: missing name'));
          return;
        }

        if (!data.characterClass || typeof data.characterClass !== 'string') {
          reject(new Error('Invalid character: missing class'));
          return;
        }

        if (!data.species || typeof data.species !== 'string') {
          reject(new Error('Invalid character: missing species'));
          return;
        }

        if (!data.level || typeof data.level !== 'number' || data.level < 1 || data.level > 20) {
          reject(new Error('Invalid character: invalid level'));
          return;
        }

        if (!data.abilityScores || typeof data.abilityScores !== 'object') {
          reject(new Error('Invalid character: missing ability scores'));
          return;
        }

        // Validate ability scores
        const abilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
        for (const ability of abilities) {
          if (typeof data.abilityScores[ability] !== 'number' ||
              data.abilityScores[ability] < 1 ||
              data.abilityScores[ability] > 30) {
            reject(new Error(`Invalid character: invalid ${ability} score`));
            return;
          }
        }

        // Return the character data (without playerId, id - these will be assigned on import)
        const importedCharacter: Partial<Character> = {
          name: data.name,
          species: data.species,
          subspecies: data.subspecies,
          speciesChoice: data.speciesChoice,
          highElfCantrip: data.highElfCantrip,
          characterClass: data.characterClass,
          subclass: data.subclass,
          subclassChoices: data.subclassChoices,
          level: data.level,
          background: data.background,
          alignment: data.alignment,
          experiencePoints: data.experiencePoints || 0,
          fightingStyle: data.fightingStyle,
          eldritchInvocations: data.eldritchInvocations,
          expertiseSkills: data.expertiseSkills,
          abilityScores: data.abilityScores,
          savingThrowProficiencies: data.savingThrowProficiencies || [],
          skillProficiencies: data.skillProficiencies || {},
          armorProficiencies: data.armorProficiencies || [],
          weaponProficiencies: data.weaponProficiencies || [],
          toolProficiencies: data.toolProficiencies || [],
          languages: data.languages || [],
          armorClass: data.armorClass,
          initiative: data.initiative,
          speed: data.speed,
          maxHitPoints: data.maxHitPoints,
          currentHitPoints: data.currentHitPoints,
          temporaryHitPoints: data.temporaryHitPoints || 0,
          hitDiceTotal: data.hitDiceTotal,
          hitDiceRemaining: data.hitDiceRemaining,
          deathSaves: data.deathSaves || { successes: 0, failures: 0 },
          conditions: data.conditions || [],
          inspiration: data.inspiration || false,
          exhaustionLevel: data.exhaustionLevel || 0,
          concentratingOn: data.concentratingOn || null,
          spellSlotsUsed: data.spellSlotsUsed,
          featureUses: data.featureUses,
          weapons: data.weapons || [],
          equipment: data.equipment || [],
          currency: data.currency || { copper: 0, silver: 0, electrum: 0, gold: 0, platinum: 0 },
          features: data.features || [],
          cantrips: data.cantrips,
          spells: data.spells,
          spellcasting: data.spellcasting,
          personalityTraits: data.personalityTraits || '',
          ideals: data.ideals || '',
          bonds: data.bonds || '',
          flaws: data.flaws || '',
          backstory: data.backstory || '',
          age: data.age,
          height: data.height,
          weight: data.weight,
          eyes: data.eyes,
          skin: data.skin,
          hair: data.hair,
          appearance: data.appearance,
          portrait: data.portrait,
        };

        resolve(importedCharacter);
      } catch (err) {
        reject(new Error('Failed to parse character file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Create a file input and trigger character import
 */
export function triggerCharacterImport(): Promise<Partial<Character>> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      try {
        const character = await importCharacter(file);
        resolve(character);
      } catch (err) {
        reject(err);
      }
    };

    input.click();
  });
}
