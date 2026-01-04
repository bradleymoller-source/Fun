import { useState, useCallback, useEffect } from 'react';

interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
}

interface UseUndoRedoReturn<T> {
  state: T;
  set: (newState: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clear: () => void;
}

/**
 * Hook for managing undo/redo state
 * @param initialState - The initial state
 * @param maxHistory - Maximum number of history entries (default 50)
 */
export function useUndoRedo<T>(
  initialState: T,
  maxHistory: number = 50
): UseUndoRedoReturn<T> {
  const [history, setHistory] = useState<UndoRedoState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  // Set new state and add to history
  const set = useCallback((newState: T) => {
    setHistory(prev => {
      // Don't add to history if state hasn't changed
      if (JSON.stringify(prev.present) === JSON.stringify(newState)) {
        return prev;
      }

      const newPast = [...prev.past, prev.present];

      // Limit history size
      if (newPast.length > maxHistory) {
        newPast.shift();
      }

      return {
        past: newPast,
        present: newState,
        future: [], // Clear future when new state is set
      };
    });
  }, [maxHistory]);

  // Undo: move present to future, take from past
  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev;

      const newPast = [...prev.past];
      const previousState = newPast.pop()!;

      return {
        past: newPast,
        present: previousState,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  // Redo: move present to past, take from future
  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev;

      const newFuture = [...prev.future];
      const nextState = newFuture.shift()!;

      return {
        past: [...prev.past, prev.present],
        present: nextState,
        future: newFuture,
      };
    });
  }, []);

  // Clear history
  const clear = useCallback(() => {
    setHistory(prev => ({
      past: [],
      present: prev.present,
      future: [],
    }));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    state: history.present,
    set,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    clear,
  };
}

/**
 * Simplified hook for tracking specific actions that can be undone
 * Useful for complex state where you only want to track certain changes
 */
interface Action<T> {
  type: string;
  payload: T;
  undo: () => void;
  redo: () => void;
}

interface UseActionHistoryReturn<T> {
  addAction: (action: Action<T>) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clear: () => void;
}

export function useActionHistory<T>(maxHistory: number = 50): UseActionHistoryReturn<T> {
  const [past, setPast] = useState<Action<T>[]>([]);
  const [future, setFuture] = useState<Action<T>[]>([]);

  const addAction = useCallback((action: Action<T>) => {
    setPast(prev => {
      const newPast = [...prev, action];
      if (newPast.length > maxHistory) {
        newPast.shift();
      }
      return newPast;
    });
    setFuture([]); // Clear redo stack
  }, [maxHistory]);

  const undo = useCallback(() => {
    setPast(prev => {
      if (prev.length === 0) return prev;

      const newPast = [...prev];
      const action = newPast.pop()!;

      // Execute undo function
      action.undo();

      setFuture(f => [action, ...f]);

      return newPast;
    });
  }, []);

  const redo = useCallback(() => {
    setFuture(prev => {
      if (prev.length === 0) return prev;

      const newFuture = [...prev];
      const action = newFuture.shift()!;

      // Execute redo function
      action.redo();

      setPast(p => [...p, action]);

      return newFuture;
    });
  }, []);

  const clear = useCallback(() => {
    setPast([]);
    setFuture([]);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    addAction,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    clear,
  };
}
