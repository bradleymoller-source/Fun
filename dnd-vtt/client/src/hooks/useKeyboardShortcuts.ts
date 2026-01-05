import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsOptions {
  isDm: boolean;
  onNextTurn?: () => void;
  onQuickRoll?: (dice: string) => void;
  onToggleMeasure?: () => void;
  onToggleFog?: () => void;
  onEscape?: () => void;
}

export function useKeyboardShortcuts({
  isDm,
  onNextTurn,
  onQuickRoll,
  onToggleMeasure,
  onToggleFog,
  onEscape,
}: KeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        // Only allow Escape in input fields
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
          onEscape?.();
        }
        return;
      }

      // Prevent default for our shortcuts
      switch (e.key.toLowerCase()) {
        // Escape - Cancel current action
        case 'escape':
          onEscape?.();
          break;

        // DM shortcuts
        case 'n':
          if (isDm && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onNextTurn?.();
          }
          break;

        case 'm':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onToggleMeasure?.();
          }
          break;

        case 'f':
          if (isDm && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onToggleFog?.();
          }
          break;

        // Quick dice rolls (1-7)
        case '1':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onQuickRoll?.('d4');
          }
          break;

        case '2':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onQuickRoll?.('d6');
          }
          break;

        case '3':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onQuickRoll?.('d8');
          }
          break;

        case '4':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onQuickRoll?.('d10');
          }
          break;

        case '5':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onQuickRoll?.('d12');
          }
          break;

        case '6':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onQuickRoll?.('d20');
          }
          break;

        case '7':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onQuickRoll?.('d100');
          }
          break;
      }
    },
    [isDm, onNextTurn, onQuickRoll, onToggleMeasure, onToggleFog, onEscape]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Help text for displaying shortcuts
export const KEYBOARD_SHORTCUTS = {
  dm: [
    { key: 'N', description: 'Next Turn' },
    { key: 'F', description: 'Toggle Fog Drawing' },
    { key: 'M', description: 'Toggle Measure' },
  ],
  common: [
    { key: '1-7', description: 'Quick Roll (d4-d100)' },
    { key: 'Esc', description: 'Cancel Action' },
  ],
};
