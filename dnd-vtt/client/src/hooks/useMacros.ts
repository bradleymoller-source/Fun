import { useState, useEffect, useCallback } from 'react';

export interface DiceMacro {
  id: string;
  name: string;
  formula: string; // e.g., "2d6+5", "1d20+7"
  color?: string;
  icon?: string;
  description?: string;
}

interface UseMacrosOptions {
  characterId?: string;
  storageKey?: string;
}

interface UseMacrosReturn {
  macros: DiceMacro[];
  addMacro: (macro: Omit<DiceMacro, 'id'>) => void;
  updateMacro: (id: string, updates: Partial<Omit<DiceMacro, 'id'>>) => void;
  deleteMacro: (id: string) => void;
  reorderMacros: (fromIndex: number, toIndex: number) => void;
  executeMacro: (id: string) => DiceMacroResult | null;
}

export interface DiceMacroResult {
  macro: DiceMacro;
  rolls: DiceRollPart[];
  total: number;
  breakdown: string;
}

interface DiceRollPart {
  dice: string; // e.g., "2d6"
  rolls: number[];
  subtotal: number;
}

/**
 * Parse a dice formula and roll it
 * Supports formats like: "2d6", "1d20+5", "2d8+1d6+3", "4d6kh3" (keep highest 3)
 */
function parseDiceFormula(formula: string): { rolls: DiceRollPart[]; total: number; breakdown: string } {
  const cleanFormula = formula.replace(/\s/g, '').toLowerCase();
  const rolls: DiceRollPart[] = [];
  let total = 0;
  const breakdownParts: string[] = [];

  // Match dice expressions and modifiers
  // Matches: 2d6, 1d20, +5, -3, 4d6kh3, 2d6kl1
  const regex = /([+-]?)(\d+)?d(\d+)(k[hl]?\d+)?|([+-])(\d+)/gi;
  let match;
  let isFirst = true;

  while ((match = regex.exec(cleanFormula)) !== null) {
    if (match[3]) {
      // Dice roll (XdY format)
      const sign = match[1] === '-' ? -1 : 1;
      const count = parseInt(match[2] || '1');
      const sides = parseInt(match[3]);
      const keep = match[4]; // e.g., "kh3" or "kl1"

      let diceRolls: number[] = [];
      for (let i = 0; i < count; i++) {
        diceRolls.push(Math.floor(Math.random() * sides) + 1);
      }

      let keptRolls = diceRolls;
      let keepStr = '';

      if (keep) {
        const keepCount = parseInt(keep.slice(2) || keep.slice(1));
        const keepHighest = keep.includes('h') || !keep.includes('l');

        // Sort and keep
        const sorted = [...diceRolls].sort((a, b) => keepHighest ? b - a : a - b);
        keptRolls = sorted.slice(0, keepCount);
        keepStr = keepHighest ? ` (keep highest ${keepCount})` : ` (keep lowest ${keepCount})`;
      }

      const subtotal = keptRolls.reduce((sum, r) => sum + r, 0) * sign;

      rolls.push({
        dice: `${count}d${sides}${keep || ''}`,
        rolls: diceRolls,
        subtotal,
      });

      total += subtotal;

      const signStr = isFirst ? '' : (sign > 0 ? ' + ' : ' - ');
      breakdownParts.push(`${signStr}[${diceRolls.join(', ')}]${keepStr}`);
    } else if (match[6]) {
      // Flat modifier
      const sign = match[5] === '-' ? -1 : 1;
      const value = parseInt(match[6]) * sign;
      total += value;

      const signStr = isFirst ? '' : (value >= 0 ? ' + ' : ' - ');
      breakdownParts.push(`${signStr}${Math.abs(value)}`);
    }

    isFirst = false;
  }

  return {
    rolls,
    total,
    breakdown: breakdownParts.join('') + ` = ${total}`,
  };
}

/**
 * Hook for managing dice macros with localStorage persistence
 */
export function useMacros(options: UseMacrosOptions = {}): UseMacrosReturn {
  const { characterId, storageKey = 'dice-macros' } = options;
  const fullKey = characterId ? `${storageKey}-${characterId}` : storageKey;

  const [macros, setMacros] = useState<DiceMacro[]>([]);

  // Load macros from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(fullKey);
      if (saved) {
        setMacros(JSON.parse(saved));
      }
    } catch {
      // Invalid JSON, start fresh
    }
  }, [fullKey]);

  // Save macros to localStorage
  const saveMacros = useCallback((newMacros: DiceMacro[]) => {
    setMacros(newMacros);
    localStorage.setItem(fullKey, JSON.stringify(newMacros));
  }, [fullKey]);

  // Add a new macro
  const addMacro = useCallback((macro: Omit<DiceMacro, 'id'>) => {
    const newMacro: DiceMacro = {
      ...macro,
      id: `macro-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    saveMacros([...macros, newMacro]);
  }, [macros, saveMacros]);

  // Update an existing macro
  const updateMacro = useCallback((id: string, updates: Partial<Omit<DiceMacro, 'id'>>) => {
    const updated = macros.map(m => m.id === id ? { ...m, ...updates } : m);
    saveMacros(updated);
  }, [macros, saveMacros]);

  // Delete a macro
  const deleteMacro = useCallback((id: string) => {
    saveMacros(macros.filter(m => m.id !== id));
  }, [macros, saveMacros]);

  // Reorder macros
  const reorderMacros = useCallback((fromIndex: number, toIndex: number) => {
    const newMacros = [...macros];
    const [moved] = newMacros.splice(fromIndex, 1);
    newMacros.splice(toIndex, 0, moved);
    saveMacros(newMacros);
  }, [macros, saveMacros]);

  // Execute a macro and return the result
  const executeMacro = useCallback((id: string): DiceMacroResult | null => {
    const macro = macros.find(m => m.id === id);
    if (!macro) return null;

    const { rolls, total, breakdown } = parseDiceFormula(macro.formula);

    return {
      macro,
      rolls,
      total,
      breakdown,
    };
  }, [macros]);

  return {
    macros,
    addMacro,
    updateMacro,
    deleteMacro,
    reorderMacros,
    executeMacro,
  };
}

// Default macros for common D&D rolls
export const DEFAULT_MACROS: Omit<DiceMacro, 'id'>[] = [
  { name: 'Attack', formula: '1d20', color: '#e74c3c', icon: '⚔️' },
  { name: 'Damage (1d8)', formula: '1d8', color: '#3498db', icon: '💥' },
  { name: 'Damage (2d6)', formula: '2d6', color: '#9b59b6', icon: '💥' },
  { name: 'Sneak Attack (2d6)', formula: '2d6', color: '#2ecc71', icon: '🗡️' },
  { name: 'Fireball', formula: '8d6', color: '#e67e22', icon: '🔥' },
  { name: 'Healing Word', formula: '1d4+3', color: '#1abc9c', icon: '💚' },
];

// Utility to validate a dice formula
export function isValidDiceFormula(formula: string): boolean {
  if (!formula.trim()) return false;

  // Check for at least one dice expression or modifier
  const regex = /(\d+)?d\d+|[+-]?\d+/i;
  return regex.test(formula);
}
