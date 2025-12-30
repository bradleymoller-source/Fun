import { useState, useEffect, useRef } from 'react';
import { Panel } from './ui/Panel';
import { useSessionStore } from '../stores/sessionStore';
import { useSocket } from '../hooks/useSocket';
import { MapCanvas } from './Map/MapCanvas';
import { DiceRoller } from './DiceRoller';
import { ChatPanel } from './ChatPanel';
import { InitiativeTracker } from './InitiativeTracker';
import { CharacterCreator } from './Character/CharacterCreator';
import { CharacterSheet } from './Character/CharacterSheet';
import type { DiceRoll, ChatMessage, Character } from '../types';

type MapOrientation = 'landscape' | 'portrait';

const ORIENTATION_SIZES = {
  landscape: { width: 900, height: 600 },
  portrait: { width: 600, height: 800 },
};

export function PlayerView() {
  const { roomCode, playerName, players, isConnected, playerTab, character, setPlayerTab, setCharacter, updateCharacter } = useSessionStore();
  const { rollDice, sendChatMessage, socket } = useSocket();
  const [showParty, setShowParty] = useState(false);
  const [mapOrientation, setMapOrientation] = useState<MapOrientation>('landscape');
  const [mapDimensions, setMapDimensions] = useState(ORIENTATION_SIZES.landscape);
  const [showCharacterCreator, setShowCharacterCreator] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

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
  const handleCharacterCreated = (newCharacter: Character) => {
    setCharacter(newCharacter);
    setShowCharacterCreator(false);
    // TODO: Sync character to server
  };

  // Phase 4: Character Update Handler
  const handleCharacterUpdate = (updates: Partial<Character>) => {
    updateCharacter(updates);
    // TODO: Sync character updates to server
  };

  const renderMapView = () => (
    <>
      {/* Map Display */}
      <div className="flex-1" ref={mapContainerRef}>
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
          />
        </Panel>
      </div>

      {/* Sidebar - Phase 3 Features */}
      <div className="w-full lg:w-80 space-y-4">
        {/* Initiative Tracker (view only for players) */}
        <Panel>
          <h2 className="font-medieval text-xl text-gold mb-4">
            Initiative
          </h2>
          <InitiativeTracker
            isDm={false}
            onAddEntry={() => {}}
            onRemoveEntry={() => {}}
            onUpdateEntry={() => {}}
            onNextTurn={() => {}}
            onStartCombat={() => {}}
            onEndCombat={() => {}}
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
      <div className="w-full lg:w-80 space-y-4">
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

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-4">
          {playerTab === 'map' ? renderMapView() : renderCharacterView()}
        </div>
      </div>
    </div>
  );
}
