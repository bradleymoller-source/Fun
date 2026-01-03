import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from './ui/Button';
import { Panel } from './ui/Panel';
import { useSocket } from '../hooks/useSocket';
import { useSessionStore } from '../stores/sessionStore';
import { useKeyboardShortcuts, KEYBOARD_SHORTCUTS } from '../hooks/useKeyboardShortcuts';
import { MapCanvas } from './Map/MapCanvas';
import { MapControls } from './Map/MapControls';
import { MapLibrary } from './Map/MapLibrary';
import { DiceRoller } from './DiceRoller';
import { ChatPanel } from './ChatPanel';
import { InitiativeTracker } from './InitiativeTracker';
import { MonsterPanel } from './Monster/MonsterPanel';
import { PartyDashboard } from './PartyDashboard';
import { EncounterBuilder } from './EncounterBuilder';
import { CampaignGenerator } from './CampaignGenerator';
import { NotesPanel } from './DM/NotesPanel';
import { StorePanel } from './StorePanel';
import type { Token, DiceRoll, ChatMessage, InitiativeEntry, FogArea, Character, StoreItem, LootItem } from '../types';

type MapOrientation = 'landscape' | 'portrait';

const ORIENTATION_SIZES = {
  landscape: { width: 900, height: 600 },
  portrait: { width: 600, height: 800 },
};

export function DMView() {
  const { roomCode, dmKey, players, map, savedMaps, allCharacters, addToken: addTokenLocal, addFogArea, toggleFogArea, setFogOfWar, updateInitiativeEntry: updateInitiativeLocal } = useSessionStore();
  const {
    kickPlayer,
    addToken,
    moveToken,
    updateToken,
    removeToken,
    updateMap,
    showMapToPlayers,
    hideMapFromPlayers,
    rollDice,
    sendChatMessage,
    addInitiativeEntry,
    removeInitiativeEntry,
    nextTurn,
    startCombat,
    endCombat,
    getAllCharacters,
    updatePlayerCharacter,
    distributeItem,
    addLootItem,
    addStoreItem,
    socket,
  } = useSocket();
  const [dmNotes, setDmNotes] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<'code' | 'key' | null>(null);
  const [showPlayers, setShowPlayers] = useState(true);
  const [mapOrientation, setMapOrientation] = useState<MapOrientation>('landscape');
  const [isMapLocked, setIsMapLocked] = useState(false);
  const [mapDimensions, setMapDimensions] = useState(ORIENTATION_SIZES.landscape);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
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
      playerId: socket?.id || 'dm',
      playerName: 'DM',
      notation: dice,
      rolls,
      modifier: 0,
      total,
      timestamp: new Date().toISOString(),
      isPrivate: false,
    };
    rollDice(roll);
  }, [socket?.id, rollDice]);

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

  // Sync local map state changes to server (not tokens - those use dedicated events)
  const syncMapToServer = () => {
    updateMap({
      imageUrl: map.imageUrl,
      gridSize: map.gridSize,
      gridOffsetX: map.gridOffsetX,
      gridOffsetY: map.gridOffsetY,
      showGrid: map.showGrid,
      fogOfWar: map.fogOfWar,
    });
  };

  // Debounced sync when map changes
  useEffect(() => {
    const timer = setTimeout(syncMapToServer, 500);
    return () => clearTimeout(timer);
  }, [map.imageUrl, map.gridSize, map.showGrid, map.gridOffsetX, map.gridOffsetY, map.fogOfWar]);

  // Load all player characters when DM view mounts
  useEffect(() => {
    getAllCharacters().catch(console.error);
  }, [getAllCharacters]);

  // Periodically refresh characters (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      getAllCharacters().catch(console.error);
    }, 30000);
    return () => clearInterval(interval);
  }, [getAllCharacters]);

  // Handle character update from party dashboard
  const handleUpdateCharacter = async (characterId: string, updates: Partial<Character>) => {
    try {
      await updatePlayerCharacter(characterId, updates);
    } catch (error) {
      console.error('Failed to update character:', error);
    }
  };

  // Handle DM notes (stored locally for now)
  const handleAddDmNote = (characterId: string, note: string) => {
    setDmNotes(prev => ({ ...prev, [characterId]: note }));
  };

  const copyToClipboard = (text: string, type: 'code' | 'key') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleAddToken = async (token: Token) => {
    // Optimistic update - add token locally immediately for instant feedback
    addTokenLocal(token);

    try {
      await addToken(token);
    } catch (error) {
      console.error('Failed to add token:', error);
      // Could remove the token here if socket fails, but for now just log
    }
  };

  const handleTokenMove = async (tokenId: string, x: number, y: number) => {
    try {
      await moveToken(tokenId, x, y);
    } catch (error) {
      console.error('Failed to move token:', error);
    }
  };

  const handleTokenUpdate = async (tokenId: string, updates: Partial<Token>) => {
    try {
      await updateToken(tokenId, updates);
    } catch (error) {
      console.error('Failed to update token:', error);
    }
  };

  const handleTokenRemove = async (tokenId: string) => {
    try {
      await removeToken(tokenId);
    } catch (error) {
      console.error('Failed to remove token:', error);
    }
  };

  const handleShowMapToPlayers = async (mapId: string) => {
    console.log('handleShowMapToPlayers called with mapId:', mapId);
    console.log('Available savedMaps:', savedMaps.map(m => ({ id: m.id, name: m.name })));

    const savedMap = savedMaps.find(m => m.id === mapId);
    if (!savedMap) {
      console.error('Map not found in library:', mapId);
      alert('Map not found in library. Try saving it again.');
      return;
    }

    console.log('Found savedMap:', savedMap.name, 'imageUrl length:', savedMap.imageUrl?.length);

    // Filter hidden tokens when showing to players
    // Also include current live tokens from the active map to preserve monsters
    const savedTokens = (savedMap.tokens || []).filter(t => !t.isHidden);
    const liveTokens = map.tokens.filter(t => !t.isHidden);

    // Merge tokens: use saved tokens if available, otherwise use live tokens
    const visibleTokens = savedTokens.length > 0 ? savedTokens : liveTokens;

    console.log('Showing map with', visibleTokens.length, 'tokens');

    try {
      console.log('Calling showMapToPlayers...');
      await showMapToPlayers(mapId, {
        imageUrl: savedMap.imageUrl,
        gridSize: savedMap.gridSize,
        gridOffsetX: savedMap.gridOffsetX,
        gridOffsetY: savedMap.gridOffsetY,
        tokens: visibleTokens,
      });
      console.log('showMapToPlayers completed successfully');
    } catch (error) {
      console.error('Failed to show map to players:', error);
      alert(`Failed to show map: ${error instanceof Error ? error.message : 'Unknown error'}. Make sure you are connected to a session.`);
    }
  };

  const handleHideMapFromPlayers = async () => {
    try {
      await hideMapFromPlayers();
    } catch (error) {
      console.error('Failed to hide map from players:', error);
    }
  };

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
      senderId: socket?.id || 'dm',
      senderName: 'DM',
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

  // Phase 3: Initiative Handlers
  const handleAddInitiativeEntry = async (entry: InitiativeEntry) => {
    try {
      await addInitiativeEntry(entry);
    } catch (error) {
      console.error('Failed to add initiative entry:', error);
    }
  };

  const handleRemoveInitiativeEntry = async (entryId: string) => {
    try {
      await removeInitiativeEntry(entryId);
    } catch (error) {
      console.error('Failed to remove initiative entry:', error);
    }
  };

  const handleNextTurn = async () => {
    try {
      await nextTurn();
    } catch (error) {
      console.error('Failed to advance turn:', error);
    }
  };

  const handleStartCombat = async () => {
    try {
      await startCombat();
    } catch (error) {
      console.error('Failed to start combat:', error);
    }
  };

  const handleEndCombat = async () => {
    try {
      await endCombat();
    } catch (error) {
      console.error('Failed to end combat:', error);
    }
  };

  // Fog of War handlers
  const handleAddFog = (fog: FogArea) => {
    addFogArea(fog);
    // Fog is synced via the debounced map update effect
  };

  const handleToggleFog = (fogId: string) => {
    toggleFogArea(fogId);
    // Fog is synced via the debounced map update effect
  };

  const handleClearFog = () => {
    setFogOfWar([]);
    // Fog is synced via the debounced map update effect
  };

  // Store/Loot handlers
  const handleUpdateStore = async (items: StoreItem[]) => {
    // Individual items are synced via socket events
    console.log('Store updated:', items);
  };

  const handleDistributeItem = async (itemId: string, playerId: string, playerName: string, quantity: number) => {
    try {
      await distributeItem(itemId, playerId, playerName, quantity);
      console.log(`Item ${itemId} distributed to ${playerName}`);
    } catch (error) {
      console.error('Failed to distribute item:', error);
    }
  };

  const handleDistributeStoreItem = async (item: StoreItem, playerId: string, playerName: string) => {
    try {
      // Convert store item to loot item and add to loot pool
      const lootItem: LootItem = {
        id: `loot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: item.name,
        value: item.price,
        quantity: 1,
        description: item.description,
        source: 'Store',
        effect: item.effect,
      };
      await addLootItem(lootItem);
      // Then distribute it
      await distributeItem(lootItem.id, playerId, playerName, 1);
      console.log(`Store item ${item.name} given to ${playerName}`);
    } catch (error) {
      console.error('Failed to give store item:', error);
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    isDm: true,
    onNextTurn: handleNextTurn,
    onQuickRoll: handleQuickRoll,
    onEscape: () => setShowShortcuts(false),
  });

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <Panel className="mb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="font-medieval text-2xl text-gold">
                Dungeon Master View
              </h1>
              <p className="text-parchment/70 text-sm mt-1">
                Share the room code with your players
              </p>
            </div>

            <div className="flex gap-4 items-center">
              {/* Keyboard Shortcuts Help */}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowShortcuts(!showShortcuts)}
                title="Keyboard Shortcuts"
              >
                ⌨️
              </Button>

              {/* Toggle Players Panel */}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowPlayers(!showPlayers)}
              >
                {showPlayers ? 'Hide Players' : 'Show Players'}
              </Button>

              {/* Room Code */}
              <div
                className="bg-dark-wood px-4 py-2 rounded-lg border-2 border-gold cursor-pointer hover:bg-leather/50 transition-colors"
                onClick={() => roomCode && copyToClipboard(roomCode, 'code')}
                title="Click to copy"
              >
                <div className="text-parchment/50 text-xs">ROOM CODE</div>
                <div className="font-medieval text-2xl text-gold tracking-widest">
                  {roomCode}
                </div>
                {copied === 'code' && (
                  <div className="text-green-400 text-xs">Copied!</div>
                )}
              </div>
            </div>
          </div>

          {/* DM Key (save this!) */}
          <div className="mt-4 p-3 bg-deep-red/20 border border-deep-red rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-red-300 text-sm font-semibold">
                  Your DM Key (save this!)
                </div>
                <div className="text-parchment font-mono text-sm">
                  {dmKey}
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => dmKey && copyToClipboard(dmKey, 'key')}
              >
                {copied === 'key' ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <p className="text-parchment/50 text-xs mt-2">
              Use this key to reclaim your session if you get disconnected
            </p>
          </div>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <h3 className="text-gold text-sm font-semibold mb-2">DM Controls</h3>
                {KEYBOARD_SHORTCUTS.dm.map((shortcut) => (
                  <div key={shortcut.key} className="flex justify-between text-sm text-parchment py-1">
                    <kbd className="bg-dark-wood px-2 rounded border border-leather">{shortcut.key}</kbd>
                    <span className="text-parchment/70">{shortcut.description}</span>
                  </div>
                ))}
              </div>
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

        {/* Mobile Sidebar Toggle Button */}
        <button
          onClick={() => setShowMobileSidebar(!showMobileSidebar)}
          className="lg:hidden mobile-menu-btn bg-gold text-dark-wood"
          aria-label="Toggle controls"
        >
          {showMobileSidebar ? '✕' : '☰'}
        </button>

        {/* Main Content: Map + Sidebar */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Map Canvas - Takes most of the space */}
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

              <button
                onClick={() => setIsMapLocked(!isMapLocked)}
                className={`px-3 py-1 rounded text-sm flex items-center gap-1 ${
                  isMapLocked
                    ? 'bg-red-600 text-white'
                    : 'bg-leather text-parchment hover:bg-leather/70'
                }`}
              >
                {isMapLocked ? '🔒 Unlock' : '🔓 Lock'}
              </button>
            </div>

            <Panel className="p-2">
              <MapCanvas
                width={mapDimensions.width}
                height={mapDimensions.height}
                isDm={true}
                isLocked={isMapLocked}
                onTokenMove={handleTokenMove}
                onAddFog={handleAddFog}
                onToggleFog={handleToggleFog}
                onClearFog={handleClearFog}
              />
            </Panel>
          </div>

          {/* Sidebar - Controls */}
          <div className={`w-full lg:w-80 space-y-4 ${showMobileSidebar ? 'block' : 'hidden lg:block'}`}>
            {/* Players Panel (Collapsible) */}
            {showPlayers && (
              <Panel>
                <h2 className="font-medieval text-xl text-gold mb-4">
                  Connected Players ({players.length})
                </h2>

                {players.length === 0 ? (
                  <div className="text-parchment/50 text-center py-4">
                    <p>No players yet</p>
                    <p className="text-sm mt-1">
                      Share code <span className="text-gold font-bold">{roomCode}</span>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {players.map((player) => (
                      <div
                        key={player.id}
                        className="flex justify-between items-center bg-dark-wood px-3 py-2 rounded-lg border border-leather"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              player.isConnected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
                            }`}
                          />
                          <span className="text-parchment font-medieval text-sm">
                            {player.name}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => kickPlayer(player.id)}
                          className="text-xs py-1 px-2"
                        >
                          Kick
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            )}

            {/* Party Dashboard - DM view of all player characters */}
            <Panel>
              <h2 className="font-medieval text-xl text-gold mb-4">
                Party Dashboard
              </h2>
              <PartyDashboard
                characters={allCharacters}
                tokens={map.tokens}
                onUpdateCharacter={handleUpdateCharacter}
                onUpdateToken={handleTokenUpdate}
                onAddDmNote={handleAddDmNote}
                dmNotes={dmNotes}
              />
            </Panel>

            {/* Map Library */}
            <Panel>
              <MapLibrary
                onShowToPlayers={handleShowMapToPlayers}
                onHideFromPlayers={handleHideMapFromPlayers}
              />
            </Panel>

            {/* Map Controls */}
            <Panel>
              <h2 className="font-medieval text-xl text-gold mb-4">
                Map Controls
              </h2>
              <MapControls
                onAddToken={handleAddToken}
                onUpdateToken={handleTokenUpdate}
                onRemoveToken={handleTokenRemove}
              />
            </Panel>

            {/* Initiative Tracker */}
            <Panel>
              <h2 className="font-medieval text-xl text-gold mb-4">
                Initiative Tracker
              </h2>
              <InitiativeTracker
                isDm={true}
                onAddEntry={handleAddInitiativeEntry}
                onRemoveEntry={handleRemoveInitiativeEntry}
                onUpdateEntry={updateInitiativeLocal}
                onNextTurn={handleNextTurn}
                onStartCombat={handleStartCombat}
                onEndCombat={handleEndCombat}
                onRemoveToken={removeToken}
              />
            </Panel>

            {/* DM Notes */}
            <Panel>
              <NotesPanel roomCode={roomCode || ''} />
            </Panel>

            {/* Campaign Generator */}
            <Panel>
              <h2 className="font-medieval text-xl text-gold mb-4">
                AI Campaign Generator
              </h2>
              <CampaignGenerator
                addInitiativeEntry={addInitiativeEntry}
                startCombat={startCombat}
                addToken={addToken}
                addStoreItem={addStoreItem}
                addLootItem={addLootItem}
                distributeItem={distributeItem}
              />
            </Panel>

            {/* Encounter Builder */}
            <Panel>
              <h2 className="font-medieval text-xl text-gold mb-4">
                Encounter Builder
              </h2>
              <EncounterBuilder
                allCharacters={allCharacters}
                onAddTokens={(tokens) => tokens.forEach(t => handleAddToken(t))}
              />
            </Panel>

            {/* Monster Stat Blocks */}
            <Panel>
              <h2 className="font-medieval text-xl text-gold mb-4">
                Monsters & NPCs
              </h2>
              <MonsterPanel
                onRollDice={handleDiceRoll}
                onAddToken={handleAddToken}
                socketId={socket?.id}
              />
            </Panel>

            {/* Dice Roller */}
            <Panel>
              <h2 className="font-medieval text-xl text-gold mb-4">
                Dice Roller
              </h2>
              <DiceRoller
                onRoll={handleDiceRoll}
                playerId={socket?.id || 'dm'}
                playerName="DM"
                isDm={true}
              />
            </Panel>

            {/* Store & Loot */}
            <Panel>
              <h2 className="font-medieval text-xl text-gold mb-4">
                Store & Loot
              </h2>
              <StorePanel
                isDm={true}
                players={players}
                onUpdateStore={handleUpdateStore}
                onDistributeItem={handleDistributeItem}
                onDistributeStoreItem={handleDistributeStoreItem}
              />
            </Panel>

            {/* Chat */}
            <Panel>
              <h2 className="font-medieval text-xl text-gold mb-4">
                Party Chat
              </h2>
              <ChatPanel
                onSendMessage={handleSendMessage}
                playerId={socket?.id || 'dm'}
                playerName="DM"
              />
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
