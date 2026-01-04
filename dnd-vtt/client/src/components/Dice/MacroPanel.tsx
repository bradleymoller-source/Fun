import { useState } from 'react';
import { Button } from '../ui/Button';
import { useMacros, DEFAULT_MACROS, isValidDiceFormula, type DiceMacro, type DiceMacroResult } from '../../hooks/useMacros';

interface MacroPanelProps {
  characterId?: string;
  onRollResult?: (result: DiceMacroResult) => void;
}

const MACRO_COLORS = [
  '#e74c3c', // Red
  '#3498db', // Blue
  '#2ecc71', // Green
  '#f39c12', // Orange
  '#9b59b6', // Purple
  '#1abc9c', // Teal
  '#e91e63', // Pink
  '#795548', // Brown
];

export function MacroPanel({ characterId, onRollResult }: MacroPanelProps) {
  const { macros, addMacro, updateMacro, deleteMacro, executeMacro } = useMacros({ characterId });
  const [isEditing, setIsEditing] = useState(false);
  const [editingMacro, setEditingMacro] = useState<DiceMacro | null>(null);
  const [editName, setEditName] = useState('');
  const [editFormula, setEditFormula] = useState('');
  const [editColor, setEditColor] = useState(MACRO_COLORS[0]);
  const [lastResult, setLastResult] = useState<DiceMacroResult | null>(null);

  // Handle macro execution
  const handleExecute = (id: string) => {
    const result = executeMacro(id);
    if (result) {
      setLastResult(result);
      onRollResult?.(result);
    }
  };

  // Open editor for new macro
  const handleAddNew = () => {
    setEditingMacro(null);
    setEditName('');
    setEditFormula('');
    setEditColor(MACRO_COLORS[0]);
    setIsEditing(true);
  };

  // Open editor for existing macro
  const handleEdit = (macro: DiceMacro) => {
    setEditingMacro(macro);
    setEditName(macro.name);
    setEditFormula(macro.formula);
    setEditColor(macro.color || MACRO_COLORS[0]);
    setIsEditing(true);
  };

  // Save macro (new or update)
  const handleSave = () => {
    if (!editName.trim() || !isValidDiceFormula(editFormula)) return;

    if (editingMacro) {
      updateMacro(editingMacro.id, {
        name: editName,
        formula: editFormula,
        color: editColor,
      });
    } else {
      addMacro({
        name: editName,
        formula: editFormula,
        color: editColor,
      });
    }

    setIsEditing(false);
    setEditingMacro(null);
  };

  // Cancel editing
  const handleCancel = () => {
    setIsEditing(false);
    setEditingMacro(null);
  };

  // Delete macro
  const handleDelete = (id: string) => {
    if (confirm('Delete this macro?')) {
      deleteMacro(id);
      if (editingMacro?.id === id) {
        handleCancel();
      }
    }
  };

  // Add default macros
  const handleAddDefaults = () => {
    DEFAULT_MACROS.forEach(macro => addMacro(macro));
  };

  return (
    <div className="space-y-3">
      {/* Macro Editor */}
      {isEditing && (
        <div className="bg-dark-wood p-3 rounded border border-leather">
          <h4 className="text-parchment text-sm font-bold mb-2">
            {editingMacro ? 'Edit Macro' : 'New Macro'}
          </h4>

          <div className="space-y-2">
            <input
              type="text"
              placeholder="Name (e.g., Attack Roll)"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-parchment text-dark-wood rounded"
            />

            <input
              type="text"
              placeholder="Formula (e.g., 1d20+5)"
              value={editFormula}
              onChange={(e) => setEditFormula(e.target.value)}
              className={`w-full px-3 py-1.5 text-sm bg-parchment text-dark-wood rounded ${
                editFormula && !isValidDiceFormula(editFormula) ? 'border-2 border-red-500' : ''
              }`}
            />

            <div>
              <span className="text-parchment/70 text-xs block mb-1">Color:</span>
              <div className="flex gap-1 flex-wrap">
                {MACRO_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setEditColor(color)}
                    className={`w-6 h-6 rounded border-2 ${
                      editColor === color ? 'border-gold' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!editName.trim() || !isValidDiceFormula(editFormula)}
              >
                Save
              </Button>
              {editingMacro && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(editingMacro.id)}
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Macro Buttons Grid */}
      {macros.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {macros.map((macro) => (
            <button
              key={macro.id}
              onClick={() => handleExecute(macro.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                handleEdit(macro);
              }}
              className="p-2 rounded border border-leather hover:border-gold transition-colors text-left"
              style={{ backgroundColor: `${macro.color}20` }}
              title={`${macro.formula} (right-click to edit)`}
            >
              <div className="flex items-center gap-2">
                {macro.icon && <span>{macro.icon}</span>}
                <span className="text-parchment text-sm font-medium truncate">
                  {macro.name}
                </span>
              </div>
              <div className="text-parchment/60 text-xs">{macro.formula}</div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-parchment/50 text-sm">
          <p>No macros yet</p>
          <button
            onClick={handleAddDefaults}
            className="text-gold hover:underline text-xs mt-1"
          >
            Add default macros
          </button>
        </div>
      )}

      {/* Add Button */}
      {!isEditing && (
        <Button size="sm" variant="secondary" onClick={handleAddNew} className="w-full">
          + Add Macro
        </Button>
      )}

      {/* Last Roll Result */}
      {lastResult && (
        <div className="bg-dark-wood p-3 rounded border border-gold/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-gold font-bold">{lastResult.macro.name}</span>
            <span className="text-2xl text-gold font-medieval">{lastResult.total}</span>
          </div>
          <div className="text-parchment/60 text-xs">{lastResult.breakdown}</div>
        </div>
      )}

      {/* Help Text */}
      <div className="text-parchment/40 text-xs">
        <p>Formulas: 1d20, 2d6+5, 4d6kh3 (keep highest 3)</p>
        <p>Right-click macro to edit</p>
      </div>
    </div>
  );
}
