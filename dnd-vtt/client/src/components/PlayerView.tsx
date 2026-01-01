import { useState, useEffect, useRef, useCallback } from 'react';
import { Panel } from './ui/Panel';
import { Button } from './ui/Button';
import { useSessionStore } from '../stores/sessionStore';
import { useSocket } from '../hooks/useSocket';
import { useKeyboardShortcuts, KEYBOARD_SHORTCUTS } from '../hooks/useKeyboardShortcuts';
import { MapCanvas } from './Map/MapCanvas';
import { DiceRoller } from './DiceRoller';
import { ChatPanel } from './ChatPanel';
import { InitiativeTracker } from './InitiativeTracker';
import { CharacterCreator } from './Character/CharacterCreator';
import { CharacterSheet } from './Character/CharacterSheet';
import type { DiceRoll, ChatMessage, Character, InitiativeEntry } from '../types';

type MapOrientation = 'landscape' | 'portrait';

const ORIENTATION_SIZES = {
  landscape: { width: 900, height: 600 },
  portrait: { width: 600, height: 800 },
};

export function PlayerView() {
  const { roomCode, playerName, players, isConnected, playerTab, character, setPlayerTab, setCharacter, updateCharacter } = useSessionStore();
  const { rollDice, sendChatMessage, moveToken, saveCharacter, deleteCharacter, playerRollInitiative, socket } = useSocket();
  const [showParty, setShowParty] = useState(false);
  const [mapOrientation, setMapOrientation] = useState<MapOrientation>('landscape');
  const [mapDimensions, setMapDimensions] = useState(ORIENTATION_SIZES.landscape);
  const [showCharacterCreator, setShowCharacterCreator] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [initiativeMessage, setInitiativeMessage] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Quick roll function for keyboard shortcuts
  const handleQuickRoll = useCallback((dice: string) => {
    const diceMap: Record<string, { count: number; sides: number }> = {
      d4: { count: 1, sides: 4 },
      d6: { count: 1, sides: 6 },
      d8: { count: 1, sides: 8 },
      d10: { count: 1, sides: 10 },
      d12: { count: 1, sides: 12 },
      d20: { count: 1, sides: 20 },
      d100: { count: 1, sides: 100 },
    };
    const diceInfo = diceMap[dice];
    if (!diceInfo) return;

    const rolls = Array.from({ length: diceInfo.count }, () =>
      Math.floor(Math.random() * diceInfo.sides) + 1
    );
    const total = rolls.reduce((sum, r) => sum + r, 0);

    const roll: DiceRoll = {
      id: `roll-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      playerId: socket?.id || 'player',
      playerName: character?.name || playerName || 'Player',
      notation: dice,
      rolls,
      modifier: 0,
      total,
      timestamp: new Date().toISOString(),
      isPrivate: false,
    };
    rollDice(roll);
  }, [socket?.id, character?.name, playerName, rollDice]);

  // Update dimensions when orientation changes
  useEffect(() => {
    const updateDimensions = () => {
      if (mapContainerRef.current) {
        const containerWidth = mapContainerRef.current.getBoundingClientRect().width - 32;
        const baseSize = ORIENTATION_SIZES[mapOrientation];

        // Scale down if container is smaller than base size
        const scale = Math.min(1, containerWidth / baseSize.width);

        setMapDimensions({
          width: Math.floor(baseSize.width * scale),
          height: Math.floor(baseSize.height * scale),
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [mapOrientation]);

  // Phase 3: Dice Roll Handler
  const handleDiceRoll = async (roll: DiceRoll) => {
    try {
      await rollDice(roll);
    } catch (error) {
      console.error('Failed to roll dice:', error);
    }
  };

  // Phase 3: Chat Message Handler
  const handleSendMessage = async (content: string) => {
    const message: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      senderId: socket?.id || 'player',
      senderName: playerName || 'Player',
      content,
      timestamp: new Date().toISOString(),
      type: 'chat',
    };
    try {
      await sendChatMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Phase 4: Character Creation Handler
  const handleCharacterCreated = async (newCharacter: Character) => {
    setCharacter(newCharacter);
    setShowCharacterCreator(false);
    // Sync character to server
    try {
      await saveCharacter(newCharacter);
      console.log('Character saved to server:', newCharacter.name);
    } catch (error) {
      console.error('Failed to save character:', error);
    }
  };

  // Phase 4: Character Update Handler
  const handleCharacterUpdate = async (updates: Partial<Character>) => {
    updateCharacter(updates);
    // Sync character updates to server
    const updatedCharacter = { ...character, ...updates, updatedAt: new Date().toISOString() } as Character;
    try {
      await saveCharacter(updatedCharacter);
    } catch (error) {
      console.error('Failed to sync character update:', error);
    }
  };

  // Phase 4: Character Import Handler
  const handleCharacterImport = async (importedCharacter: Character) => {
    setCharacter(importedCharacter);
    try {
      await saveCharacter(importedCharacter);
      console.log('Imported character saved to server:', importedCharacter.name);
    } catch (error) {
      console.error('Failed to save imported character:', error);
    }
  };

  // Phase 4: Character Delete Handler
  const handleCharacterDelete = async () => {
    try {
      await deleteCharacter();
      console.log('Character deleted');
    } catch (error) {
      console.error('Failed to delete character:', error);
    }
  };

  // Phase 4: Character Initiative Roll Handler
  const handleCharacterInitiativeRoll = async (roll: number) => {
    if (!character) {
      setInitiativeMessage('❌ No character available');
      setTimeout(() => setInitiativeMessage(null), 3000);
      return;
    }
    if (!socket?.id) {
      setInitiativeMessage('❌ Not connected to server');
      setTimeout(() => setInitiativeMessage(null), 3000);
      return;
    }
    const entry: InitiativeEntry = {
      id: `init-${socket.id}-${Date.now()}`,
      name: character.name,
      initiative: roll,
      isNpc: false,
      isActive: false,
      playerId: socket.id,
      currentHp: character.currentHitPoints,
      maxHp: character.maxHitPoints,
    };
    try {
      await playerRollInitiative(entry);
      setInitiativeMessage(`🎲 Initiative: ${roll}! View in Map tab.`);
      setTimeout(() => setInitiativeMessage(null), 4000);
    } catch (error) {
      setInitiativeMessage('❌ Failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setTimeout(() => setInitiativeMessage(null), 4000);
    }
  };

  // Token movement handler (player can move their own token)
  const handleTokenMove = async (tokenId: string, x: number, y: number) => {
    try {
      await moveToken(tokenId, x, y);
    } catch (error) {
      console.error('Failed to move token:', error);
    }
  };

  // Player initiative roll handler (from InitiativeTracker buttons)
  const handlePlayerInitiativeRoll = async (entry: InitiativeEntry) => {
    try {
      await playerRollInitiative(entry);
    } catch (error) {
      console.error('Failed to add initiative entry:', error);
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    isDm: false,
    onQuickRoll: handleQuickRoll,
    onEscape: () => setShowShortcuts(false),
  });

  const renderMapView = () => (
    <>
      {/* Map Display */}
      <div className="flex-1 map-container" ref={mapContainerRef}>
        {/* Map Toolbar */}
        <div className="flex items-center justify-between mb-2 bg-dark-wood p-2 rounded-lg border border-leather">
          <div className="flex items-center gap-2">
            <span className="text-parchment text-sm">View:</span>
            <button
              onClick={() => setMapOrientation('landscape')}
              className={`px-3 py-1 rounded text-sm ${
                mapOrientation === 'landscape'
                  ? 'bg-gold text-dark-wood'
                  : 'bg-leather text-parchment hover:bg-leather/70'
              }`}
            >
              Landscape
            </button>
            <button
              onClick={() => setMapOrientation('portrait')}
              className={`px-3 py-1 rounded text-sm ${
                mapOrientation === 'portrait'
                  ? 'bg-gold text-dark-wood'
                  : 'bg-leather text-parchment hover:bg-leather/70'
              }`}
            >
              Portrait
            </button>
          </div>
        </div>

        <Panel className="p-2">
          <MapCanvas
            width={mapDimensions.width}
            height={mapDimensions.height}
            isDm={false}
            playerId={socket?.id}
            onTokenMove={handleTokenMove}
          />
        </Panel>
      </div>

      {/* Sidebar - Phase 3 Features */}
      <div className={`w-full lg:w-80 space-y-4 ${showMobileSidebar ? 'block' : 'hidden lg:block'}`}>
        {/* Initiative Tracker (view only for players) */}
        <Panel>
          <h2 className="font-medieval text-xl text-gold mb-4">
            Initiative
          </h2>
          <InitiativeTracker
            isDm={false}
            onAddEntry={handlePlayerInitiativeRoll}
            onRemoveEntry={() => {}}
            onUpdateEntry={() => {}}
            onNextTurn={() => {}}
            onStartCombat={() => {}}
            onEndCombat={() => {}}
            playerId={socket?.id}
            playerName={character?.name || playerName || 'Player'}
            playerMaxHp={character?.maxHitPoints}
          />
        </Panel>

        {/* Dice Roller */}
        <Panel>
          <h2 className="font-medieval text-xl text-gold mb-4">
            Dice Roller
          </h2>
          <DiceRoller
            onRoll={handleDiceRoll}
            playerId={socket?.id || 'player'}
            playerName={playerName || 'Player'}
            isDm={false}
            character={character}
          />
        </Panel>

        {/* Chat */}
        <Panel>
          <h2 className="font-medieval text-xl text-gold mb-4">
            Party Chat
          </h2>
          <ChatPanel
            onSendMessage={handleSendMessage}
            playerId={socket?.id || 'player'}
            playerName={playerName || 'Player'}
          />
        </Panel>
      </div>
    </>
  );

  const renderCharacterView = () => (
    <div className="flex flex-col lg:flex-row gap-4 w-full">
      {/* Character Sheet or Creator */}
      <div className="flex-1">
        {showCharacterCreator ? (
          <CharacterCreator
            onComplete={handleCharacterCreated}
            onCancel={() => setShowCharacterCreator(false)}
            playerId={socket?.id || 'player'}
          />
        ) : character ? (
          <Panel>
            <CharacterSheet
              character={character}
              onUpdate={handleCharacterUpdate}
              onImport={handleCharacterImport}
              onDelete={handleCharacterDelete}
              onRollInitiative={handleCharacterInitiativeRoll}
              isEditable={true}
            />
          </Panel>
        ) : (
          <Panel>
            <div className="text-center py-12">
              <h2 className="font-medieval text-2xl text-gold mb-4">
                No Character Yet
              </h2>
              <p className="text-parchment/70 mb-6">
                Create a character to begin your adventure!
              </p>
              <button
                onClick={() => setShowCharacterCreator(true)}
                className="bg-gold text-dark-wood px-6 py-3 rounded-lg font-medieval text-lg hover:bg-gold/90 transition-colors"
              >
                Create Character
              </button>
            </div>
          </Panel>
        )}
      </div>

      {/* Sidebar - Dice & Chat */}
      <div className={`w-full lg:w-80 space-y-4 ${showMobileSidebar ? 'block' : 'hidden lg:block'}`}>
        {/* Dice Roller */}
        <Panel>
          <h2 className="font-medieval text-xl text-gold mb-4">
            Dice Roller
          </h2>
          <DiceRoller
            onRoll={handleDiceRoll}
            playerId={socket?.id || 'player'}
            playerName={character?.name || playerName || 'Player'}
            isDm={false}
            character={character}
          />
        </Panel>

        {/* Chat */}
        <Panel>
          <h2 className="font-medieval text-xl text-gold mb-4">
            Party Chat
          </h2>
          <ChatPanel
            onSendMessage={handleSendMessage}
            playerId={socket?.id || 'player'}
            playerName={character?.name || playerName || 'Player'}
          />
        </Panel>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-4">
      {/* Initiative Toast Notification */}
      {initiativeMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-dark-wood border-2 border-gold rounded-lg px-4 py-3 shadow-lg animate-pulse">
          <span className="text-gold font-medieval">{initiativeMessage}</span>
        </div>
      )}
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Panel className="mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="font-medieval text-2xl text-gold">
                Welcome, {character?.name || playerName}!
              </h1>
              <p className="text-parchment/70">
                Room: <span className="text-gold font-bold">{roomCode}</span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Keyboard Shortcuts Help */}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowShortcuts(!showShortcuts)}
                title="Keyboard Shortcuts"
              >
                ⌨️
              </Button>

              {/* Party Toggle */}
              <button
                onClick={() => setShowParty(!showParty)}
                className="text-parchment/70 hover:text-parchment text-sm flex items-center gap-2"
              >
                Party ({players.length})
                <span className={`transform transition-transform ${showParty ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>

              {/* Connection Status */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'
                  }`}
                />
                <span className="text-parchment text-sm">
                  {isConnected ? 'Connected' : 'Reconnecting...'}
                </span>
              </div>
            </div>
          </div>

          {/* Party Members (Collapsible) */}
          {showParty && (
            <div className="mt-4 pt-4 border-t border-leather">
              <h2 className="font-medieval text-lg text-gold mb-2">
                Your Party
              </h2>
              {players.length === 0 ? (
                <p className="text-parchment/50 text-sm">No other adventurers yet...</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className={`
                        px-3 py-1 rounded-lg border text-sm
                        ${player.isConnected
                          ? 'bg-dark-wood border-gold text-parchment'
                          : 'bg-dark-wood/50 border-leather text-parchment/50'
                        }
                      `}
                    >
                      <span className="font-medieval">{player.name}</span>
                      {!player.isConnected && (
                        <span className="text-yellow-500 text-xs ml-1">(away)</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Panel>

        {/* Keyboard Shortcuts Help Panel */}
        {showShortcuts && (
          <Panel className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-medieval text-xl text-gold">Keyboard Shortcuts</h2>
              <button
                onClick={() => setShowShortcuts(false)}
                className="text-parchment/70 hover:text-parchment"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-gold text-sm font-semibold mb-2">Quick Dice</h3>
                {KEYBOARD_SHORTCUTS.common.map((shortcut) => (
                  <div key={shortcut.key} className="flex justify-between text-sm text-parchment py-1">
                    <kbd className="bg-dark-wood px-2 rounded border border-leather">{shortcut.key}</kbd>
                    <span className="text-parchment/70">{shortcut.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setPlayerTab('map')}
            className={`flex-1 py-3 rounded-lg font-medieval text-lg transition-colors ${
              playerTab === 'map'
                ? 'bg-gold text-dark-wood'
                : 'bg-dark-wood text-parchment border border-leather hover:border-gold'
            }`}
          >
            Game Map
          </button>
          <button
            onClick={() => setPlayerTab('character')}
            className={`flex-1 py-3 rounded-lg font-medieval text-lg transition-colors ${
              playerTab === 'character'
                ? 'bg-gold text-dark-wood'
                : 'bg-dark-wood text-parchment border border-leather hover:border-gold'
            }`}
          >
            Character Sheet
            {!character && <span className="ml-2 text-sm">(Create)</span>}
          </button>
        </div>

        {/* Mobile Sidebar Toggle Button */}
        <button
          onClick={() => setShowMobileSidebar(!showMobileSidebar)}
          className="lg:hidden mobile-menu-btn bg-gold text-dark-wood"
          aria-label="Toggle controls"
        >
          {showMobileSidebar ? '✕' : '☰'}
        </button>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-4">
          {playerTab === 'map' ? renderMapView() : renderCharacterView()}
        </div>
      </div>
    </div>
  );
}
