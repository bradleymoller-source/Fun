# D&D VTT Implementation Plan

A comprehensive plan to implement all recommended improvements for the D&D Virtual Tabletop application.

---

## Phase 1: Security & Stability (High Priority)

These changes are critical for production readiness and should be implemented first.

### 1.1 Input Validation with Zod Schemas

**Goal**: Add type-safe runtime validation for all socket events and API endpoints.

**Files to Create/Modify**:
- `server/src/schemas/` (new directory)
  - `index.ts` - Export all schemas
  - `character.schema.ts` - Character creation/update validation
  - `session.schema.ts` - Session events validation
  - `map.schema.ts` - Map and token validation
  - `combat.schema.ts` - Initiative and combat validation
  - `campaign.schema.ts` - Campaign generation validation

**Implementation Steps**:
1. Install Zod: `npm install zod`
2. Create base schemas for common types:
   ```typescript
   // schemas/common.schema.ts
   import { z } from 'zod';

   export const RoomCodeSchema = z.string().min(6).max(20).regex(/^[A-Z0-9]+$/);
   export const PlayerIdSchema = z.string().uuid();
   export const PositionSchema = z.object({
     x: z.number().min(0).max(10000),
     y: z.number().min(0).max(10000)
   });
   ```

3. Create character validation schemas:
   ```typescript
   // schemas/character.schema.ts
   export const CharacterSchema = z.object({
     name: z.string().min(1).max(100),
     species: z.enum(['human', 'elf', 'dwarf', ...]),
     class: z.enum(['fighter', 'wizard', 'cleric', ...]),
     level: z.number().min(1).max(20),
     // ... all other fields
   });
   ```

4. Create validation middleware:
   ```typescript
   // middleware/validate.ts
   export function validateSocketEvent<T>(schema: z.ZodSchema<T>) {
     return (data: unknown, callback: Function) => {
       const result = schema.safeParse(data);
       if (!result.success) {
         callback({ error: result.error.format() });
         return null;
       }
       return result.data;
     };
   }
   ```

5. Apply to all socket handlers in `socketHandlers.ts`

**Estimated Scope**: ~15 files, ~1000 lines of schema definitions

---

### 1.2 Rate Limiting

**Goal**: Prevent abuse and DoS attacks on socket events.

**Files to Create/Modify**:
- `server/src/middleware/rateLimiter.ts` (new)
- `server/src/socketHandlers.ts` (modify)

**Implementation Steps**:
1. Install rate limiting package: `npm install rate-limiter-flexible`
2. Create rate limiter configuration:
   ```typescript
   // middleware/rateLimiter.ts
   import { RateLimiterMemory } from 'rate-limiter-flexible';

   export const generalLimiter = new RateLimiterMemory({
     points: 100,      // 100 events
     duration: 60,     // per minute
   });

   export const aiGenerationLimiter = new RateLimiterMemory({
     points: 5,        // 5 AI generations
     duration: 60,     // per minute
   });

   export const chatLimiter = new RateLimiterMemory({
     points: 30,       // 30 messages
     duration: 60,     // per minute
   });
   ```

3. Create rate limit wrapper:
   ```typescript
   export async function checkRateLimit(
     limiter: RateLimiterMemory,
     key: string
   ): Promise<boolean> {
     try {
       await limiter.consume(key);
       return true;
     } catch {
       return false;
     }
   }
   ```

4. Apply to socket handlers with different limits per event type

**Estimated Scope**: ~2 files, ~200 lines

---

### 1.3 Enhanced Room Security

**Goal**: Make room codes harder to guess and add optional authentication.

**Files to Create/Modify**:
- `server/src/utils/roomCode.ts` (new)
- `server/src/sessionManager.ts` (modify)
- `server/src/socketHandlers.ts` (modify)

**Implementation Steps**:
1. Generate cryptographically secure room codes:
   ```typescript
   // utils/roomCode.ts
   import crypto from 'crypto';

   export function generateSecureRoomCode(): string {
     // 8-character alphanumeric = 2.8 trillion combinations
     return crypto.randomBytes(6)
       .toString('base64')
       .replace(/[^A-Z0-9]/gi, '')
       .substring(0, 8)
       .toUpperCase();
   }
   ```

2. Add optional room passwords:
   ```typescript
   interface Session {
     // ... existing fields
     passwordHash?: string;
   }

   export function createSession(dmKey: string, password?: string): Session {
     const session = { /* ... */ };
     if (password) {
       session.passwordHash = await bcrypt.hash(password, 10);
     }
     return session;
   }
   ```

3. Update join flow to check password if set

**Estimated Scope**: ~3 files, ~150 lines

---

### 1.4 CORS Configuration for Production

**Goal**: Restrict cross-origin requests in production environment.

**Files to Modify**:
- `server/src/index.ts`

**Implementation Steps**:
1. Add environment-aware CORS config:
   ```typescript
   const corsOptions = {
     origin: process.env.NODE_ENV === 'production'
       ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com']
       : true,
     credentials: true,
   };

   app.use(cors(corsOptions));
   ```

2. Add to `.env.example`:
   ```
   ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
   ```

**Estimated Scope**: ~1 file, ~20 lines

---

### 1.5 Structured Logging with Winston

**Goal**: Replace console.log/error with structured, leveled logging.

**Files to Create/Modify**:
- `server/src/utils/logger.ts` (new)
- All server files with console.log (many)

**Implementation Steps**:
1. Install Winston: `npm install winston`
2. Create logger configuration:
   ```typescript
   // utils/logger.ts
   import winston from 'winston';

   export const logger = winston.createLogger({
     level: process.env.LOG_LEVEL || 'info',
     format: winston.format.combine(
       winston.format.timestamp(),
       winston.format.errors({ stack: true }),
       process.env.NODE_ENV === 'production'
         ? winston.format.json()
         : winston.format.prettyPrint()
     ),
     defaultMeta: { service: 'dnd-vtt' },
     transports: [
       new winston.transports.Console(),
       new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
       new winston.transports.File({ filename: 'logs/combined.log' }),
     ],
   });
   ```

3. Create context-aware logging:
   ```typescript
   export function createSessionLogger(roomCode: string) {
     return logger.child({ roomCode });
   }
   ```

4. Replace all console.log/error calls throughout server

**Estimated Scope**: ~1 new file, ~20 files modified, ~300 lines changed

---

### 1.6 PostgreSQL Migration Path

**Goal**: Prepare for migration from SQLite to PostgreSQL for production scale.

**Files to Create/Modify**:
- `server/src/db/migrations/` (new directory)
- `server/src/db/index.ts` (major refactor)
- `server/src/db/adapters/sqlite.ts` (new)
- `server/src/db/adapters/postgres.ts` (new)

**Implementation Steps**:
1. Install dependencies: `npm install pg knex`
2. Create database adapter interface:
   ```typescript
   // db/types.ts
   export interface DatabaseAdapter {
     initialize(): Promise<void>;
     query<T>(sql: string, params?: unknown[]): Promise<T[]>;
     run(sql: string, params?: unknown[]): Promise<{ lastID: number }>;
     get<T>(sql: string, params?: unknown[]): Promise<T | undefined>;
     close(): Promise<void>;
   }
   ```

3. Implement SQLite adapter (wrap current code)
4. Implement PostgreSQL adapter
5. Create adapter factory:
   ```typescript
   export function createDatabase(): DatabaseAdapter {
     const dbType = process.env.DATABASE_TYPE || 'sqlite';
     switch (dbType) {
       case 'postgres':
         return new PostgresAdapter(process.env.DATABASE_URL);
       case 'sqlite':
       default:
         return new SQLiteAdapter(process.env.SQLITE_PATH || './data/dnd_vtt.db');
     }
   }
   ```

6. Create migration system using Knex

**Estimated Scope**: ~6 files, ~500 lines

---

## Phase 2: Core Feature Enhancements (Medium Priority)

These features significantly improve gameplay experience.

### 2.1 Spell Slot Management UI

**Goal**: Add visual spell slot tracking with expenditure and recovery.

**Files to Create/Modify**:
- `client/src/components/Character/SpellSlotTracker.tsx` (new)
- `client/src/components/Character/CharacterSheet.tsx` (modify)
- `client/src/store/gameStore.ts` (modify)
- `shared/types.ts` (modify - add spell slot types)

**Implementation Steps**:
1. Add spell slot types:
   ```typescript
   interface SpellSlots {
     [level: number]: {
       total: number;
       used: number;
     };
   }

   interface Character {
     // ... existing
     spellSlots: SpellSlots;
   }
   ```

2. Create SpellSlotTracker component:
   ```typescript
   // SpellSlotTracker.tsx
   export function SpellSlotTracker({ character, onUpdate }) {
     return (
       <div className="spell-slots-grid">
         {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => (
           <SpellSlotLevel
             key={level}
             level={level}
             total={character.spellSlots[level]?.total || 0}
             used={character.spellSlots[level]?.used || 0}
             onUse={() => handleUseSlot(level)}
             onRecover={() => handleRecoverSlot(level)}
           />
         ))}
       </div>
     );
   }
   ```

3. Add slot visualization (filled/empty circles)
4. Wire up to character updates and sync to server
5. Calculate slots based on class and level in CharacterCreator

**Estimated Scope**: ~3 files, ~300 lines

---

### 2.2 Rest Mechanics (Short/Long Rest)

**Goal**: Add rest buttons that handle HP recovery, Hit Dice, spell slots, and feature recharges.

**Files to Create/Modify**:
- `client/src/components/Character/RestButtons.tsx` (new)
- `client/src/components/Character/CharacterSheet.tsx` (modify)
- `client/src/utils/restMechanics.ts` (new)

**Implementation Steps**:
1. Create rest mechanics utility:
   ```typescript
   // utils/restMechanics.ts
   export function applyShortRest(character: Character, hitDiceToSpend: number): Character {
     const hitDie = getHitDie(character.class);
     const conMod = Math.floor((character.stats.constitution - 10) / 2);

     // Roll hit dice for healing
     let healing = 0;
     for (let i = 0; i < hitDiceToSpend; i++) {
       healing += rollDie(hitDie) + conMod;
     }

     return {
       ...character,
       hp: Math.min(character.hp + healing, character.maxHp),
       hitDice: {
         ...character.hitDice,
         used: character.hitDice.used + hitDiceToSpend
       },
       // Reset short-rest features (Second Wind, Action Surge, etc.)
       features: resetShortRestFeatures(character.features)
     };
   }

   export function applyLongRest(character: Character): Character {
     return {
       ...character,
       hp: character.maxHp,
       hitDice: {
         ...character.hitDice,
         used: Math.max(0, character.hitDice.used - Math.floor(character.level / 2))
       },
       spellSlots: resetAllSpellSlots(character),
       features: resetAllFeatures(character.features)
     };
   }
   ```

2. Create RestButtons component with modal for hit dice spending
3. Add confirmation dialog with summary of what will be restored
4. Sync changes to server

**Estimated Scope**: ~3 files, ~250 lines

---

### 2.3 Skill Check Buttons

**Goal**: Add quick-roll buttons for all skills and ability checks.

**Files to Create/Modify**:
- `client/src/components/Character/SkillChecks.tsx` (new)
- `client/src/components/Character/CharacterSheet.tsx` (modify)
- `client/src/utils/diceRoller.ts` (modify)

**Implementation Steps**:
1. Create skill roll function:
   ```typescript
   export function rollSkillCheck(
     character: Character,
     skill: string,
     advantage?: 'advantage' | 'disadvantage' | 'normal'
   ): RollResult {
     const abilityMod = getAbilityModForSkill(skill, character);
     const profBonus = character.skills[skill]
       ? character.proficiencyBonus * (character.skills[skill].expertise ? 2 : 1)
       : 0;

     return roll(20, abilityMod + profBonus, advantage);
   }
   ```

2. Create SkillChecks component with grid layout:
   ```typescript
   const SKILLS = [
     { name: 'Acrobatics', ability: 'dexterity' },
     { name: 'Animal Handling', ability: 'wisdom' },
     // ... all 18 skills
   ];

   export function SkillChecks({ character, onRoll }) {
     return (
       <div className="skill-grid">
         {SKILLS.map(skill => (
           <SkillButton
             key={skill.name}
             skill={skill}
             modifier={calculateModifier(character, skill)}
             isProficient={character.skills[skill.name]?.proficient}
             hasExpertise={character.skills[skill.name]?.expertise}
             onClick={() => onRoll(skill.name)}
           />
         ))}
       </div>
     );
   }
   ```

3. Show results in chat/roll history
4. Add advantage/disadvantage toggle

**Estimated Scope**: ~2 files, ~200 lines

---

### 2.4 Turn Order Manipulation (Hold/Delay)

**Goal**: Allow DM to reorder initiative, and players to hold/delay actions.

**Files to Create/Modify**:
- `client/src/components/Initiative/InitiativeTracker.tsx` (modify)
- `server/src/sessionManager.ts` (modify)
- `server/src/socketHandlers.ts` (modify)

**Implementation Steps**:
1. Add initiative manipulation functions:
   ```typescript
   // sessionManager.ts
   export function reorderInitiative(
     roomCode: string,
     fromIndex: number,
     toIndex: number
   ): InitiativeEntry[] | null {
     const session = getSession(roomCode);
     if (!session) return null;

     const [entry] = session.initiative.splice(fromIndex, 1);
     session.initiative.splice(toIndex, 0, entry);

     return session.initiative;
   }

   export function holdAction(roomCode: string, entryId: string): void {
     const session = getSession(roomCode);
     const entry = session.initiative.find(e => e.id === entryId);
     if (entry) {
       entry.isHolding = true;
     }
   }
   ```

2. Add drag-and-drop to initiative list (DM only)
3. Add "Hold" button for current turn
4. Add "Release" option to insert held action

**Estimated Scope**: ~3 files, ~200 lines

---

### 2.5 Concentration Tracking

**Goal**: Track concentration spells with automatic reminders and breaking.

**Files to Create/Modify**:
- `client/src/components/Combat/ConcentrationTracker.tsx` (new)
- `client/src/store/gameStore.ts` (modify)
- `shared/types.ts` (modify)

**Implementation Steps**:
1. Add concentration state:
   ```typescript
   interface Character {
     // ... existing
     concentration?: {
       spellName: string;
       startedAt: number; // turn number
       duration?: number; // in minutes or rounds
     };
   }
   ```

2. Create ConcentrationTracker component:
   ```typescript
   export function ConcentrationTracker({ character, onBreak }) {
     if (!character.concentration) return null;

     return (
       <div className="concentration-badge">
         <span>Concentrating: {character.concentration.spellName}</span>
         <Button onClick={() => handleConcentrationCheck()}>
           Take Damage
         </Button>
         <Button variant="destructive" onClick={onBreak}>
           Break
         </Button>
       </div>
     );
   }
   ```

3. Auto-prompt for concentration save when damage taken
4. Clear concentration when new concentration spell cast
5. Show concentration status on tokens

**Estimated Scope**: ~3 files, ~250 lines

---

### 2.6 Condition Visual Indicators on Tokens

**Goal**: Display active conditions (prone, stunned, etc.) visually on map tokens.

**Files to Create/Modify**:
- `client/src/components/Map/Token.tsx` (modify)
- `client/src/components/Map/ConditionIcons.tsx` (new)

**Implementation Steps**:
1. Create condition icon mapping:
   ```typescript
   const CONDITION_ICONS: Record<string, { icon: string; color: string }> = {
     'Blinded': { icon: '👁️', color: '#666' },
     'Charmed': { icon: '💕', color: '#ff69b4' },
     'Deafened': { icon: '🔇', color: '#666' },
     'Frightened': { icon: '😨', color: '#9932cc' },
     'Grappled': { icon: '🤝', color: '#8b4513' },
     'Incapacitated': { icon: '💫', color: '#ffd700' },
     'Invisible': { icon: '👻', color: '#add8e6' },
     'Paralyzed': { icon: '⚡', color: '#ffff00' },
     'Petrified': { icon: '🗿', color: '#808080' },
     'Poisoned': { icon: '☠️', color: '#00ff00' },
     'Prone': { icon: '⬇️', color: '#8b0000' },
     'Restrained': { icon: '⛓️', color: '#4169e1' },
     'Stunned': { icon: '💥', color: '#ffa500' },
     'Unconscious': { icon: '💤', color: '#000080' },
   };
   ```

2. Create ConditionIcons component (ring of icons around token)
3. Add to Token component render
4. Show full condition names on hover

**Estimated Scope**: ~2 files, ~150 lines

---

### 2.7 Character Import/Export

**Goal**: Allow saving and loading characters as JSON files.

**Files to Create/Modify**:
- `client/src/utils/characterIO.ts` (new)
- `client/src/components/Character/CharacterSheet.tsx` (modify)
- `client/src/components/Character/CharacterCreator.tsx` (modify)

**Implementation Steps**:
1. Create export function:
   ```typescript
   export function exportCharacter(character: Character): void {
     const data = JSON.stringify(character, null, 2);
     const blob = new Blob([data], { type: 'application/json' });
     const url = URL.createObjectURL(blob);

     const a = document.createElement('a');
     a.href = url;
     a.download = `${character.name.replace(/\s+/g, '_')}.json`;
     a.click();
   }
   ```

2. Create import function with validation:
   ```typescript
   export async function importCharacter(file: File): Promise<Character> {
     const text = await file.text();
     const data = JSON.parse(text);

     // Validate with Zod schema
     const result = CharacterSchema.safeParse(data);
     if (!result.success) {
       throw new Error('Invalid character file');
     }

     return result.data;
   }
   ```

3. Add Import/Export buttons to character UI
4. Handle versioning for backwards compatibility

**Estimated Scope**: ~2 files, ~150 lines

---

### 2.8 Session Recovery Improvements

**Goal**: Better handle disconnections and browser refreshes.

**Files to Create/Modify**:
- `client/src/hooks/useSessionRecovery.ts` (new)
- `client/src/store/gameStore.ts` (modify)
- `server/src/sessionManager.ts` (modify)

**Implementation Steps**:
1. Store session info in localStorage:
   ```typescript
   interface StoredSession {
     roomCode: string;
     playerId: string;
     playerName: string;
     isDM: boolean;
     dmKey?: string;
     timestamp: number;
   }
   ```

2. Create recovery hook:
   ```typescript
   export function useSessionRecovery() {
     useEffect(() => {
       const stored = localStorage.getItem('dnd-session');
       if (stored) {
         const session = JSON.parse(stored);
         // Check if session is still valid (< 24 hours old)
         if (Date.now() - session.timestamp < 86400000) {
           attemptReconnect(session);
         }
       }
     }, []);
   }
   ```

3. Add heartbeat/ping to detect disconnections
4. Show reconnection UI when connection lost
5. Auto-rejoin on reconnect

**Estimated Scope**: ~3 files, ~200 lines

---

## Phase 3: UI/UX Polish (Lower Priority)

These improvements enhance the user experience but aren't critical.

### 3.1 Token Art Library & Custom Uploads

**Goal**: Provide default token images and allow custom uploads.

**Files to Create/Modify**:
- `client/src/components/Map/TokenArtPicker.tsx` (new)
- `client/src/assets/tokens/` (new directory with images)
- `server/src/routes/upload.ts` (new)

**Implementation Steps**:
1. Create token art directory structure:
   ```
   assets/tokens/
   ├── creatures/
   │   ├── goblin.png
   │   ├── orc.png
   │   └── dragon.png
   ├── players/
   │   ├── fighter.png
   │   ├── wizard.png
   │   └── rogue.png
   └── objects/
       ├── chest.png
       └── barrel.png
   ```

2. Create TokenArtPicker component with categories
3. Add image upload endpoint with size/type validation:
   ```typescript
   // routes/upload.ts
   import multer from 'multer';

   const upload = multer({
     limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
     fileFilter: (req, file, cb) => {
       const allowed = ['image/png', 'image/jpeg', 'image/webp'];
       cb(null, allowed.includes(file.mimetype));
     }
   });
   ```

4. Store uploaded images with unique IDs
5. Allow setting custom token art per token

**Estimated Scope**: ~4 files + assets, ~300 lines

---

### 3.2 DM Notes System

**Goal**: Allow DM to attach private notes to sessions, NPCs, and locations.

**Files to Create/Modify**:
- `client/src/components/DM/NotesPanel.tsx` (new)
- `client/src/components/DM/NoteEditor.tsx` (new)
- `server/src/db/index.ts` (modify - add notes table)
- `shared/types.ts` (modify)

**Implementation Steps**:
1. Create notes database table:
   ```sql
   CREATE TABLE dm_notes (
     id TEXT PRIMARY KEY,
     session_id TEXT NOT NULL,
     type TEXT NOT NULL, -- 'session', 'npc', 'location', 'general'
     reference_id TEXT, -- optional link to specific entity
     title TEXT NOT NULL,
     content TEXT NOT NULL,
     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (session_id) REFERENCES sessions(id)
   );
   ```

2. Create NotesPanel with categories
3. Create NoteEditor with markdown support
4. Add quick-access button in DM toolbar
5. Notes are DM-only, never broadcast to players

**Estimated Scope**: ~4 files, ~400 lines

---

### 3.3 Undo/Redo System

**Goal**: Allow undoing recent actions on the map.

**Files to Create/Modify**:
- `client/src/hooks/useUndoRedo.ts` (new)
- `client/src/store/gameStore.ts` (modify)

**Implementation Steps**:
1. Create action history system:
   ```typescript
   interface ActionHistory {
     past: MapState[];
     present: MapState;
     future: MapState[];
   }

   export function useUndoRedo(maxHistory = 50) {
     const [history, setHistory] = useState<ActionHistory>({
       past: [],
       present: initialState,
       future: []
     });

     const undo = () => {
       if (history.past.length === 0) return;

       setHistory(prev => ({
         past: prev.past.slice(0, -1),
         present: prev.past[prev.past.length - 1],
         future: [prev.present, ...prev.future]
       }));
     };

     const redo = () => {
       if (history.future.length === 0) return;

       setHistory(prev => ({
         past: [...prev.past, prev.present],
         present: prev.future[0],
         future: prev.future.slice(1)
       }));
     };

     return { undo, redo, canUndo: history.past.length > 0, canRedo: history.future.length > 0 };
   }
   ```

2. Track significant map changes (token moves, additions, deletions)
3. Add Ctrl+Z/Ctrl+Y keyboard shortcuts
4. Add undo/redo buttons to toolbar

**Estimated Scope**: ~2 files, ~200 lines

---

### 3.4 Dice Macro System

**Goal**: Allow saving and reusing common dice roll combinations.

**Files to Create/Modify**:
- `client/src/components/Dice/MacroPanel.tsx` (new)
- `client/src/components/Dice/MacroEditor.tsx` (new)
- `client/src/hooks/useMacros.ts` (new)

**Implementation Steps**:
1. Define macro structure:
   ```typescript
   interface DiceMacro {
     id: string;
     name: string;
     formula: string; // e.g., "2d6+5", "1d20+7 advantage"
     color?: string;
     icon?: string;
   }
   ```

2. Store macros in localStorage per character
3. Create MacroPanel with draggable buttons
4. Create MacroEditor for adding/editing
5. Support complex formulas (multiple dice, modifiers, advantage)

**Estimated Scope**: ~3 files, ~300 lines

---

## Phase 4: Architecture Improvements

These changes improve code quality and maintainability.

### 4.1 Component Refactoring

**Goal**: Break up large components into smaller, focused modules.

**Current Large Files**:
- `CharacterCreator.tsx` (2800+ lines) → Split into:
  - `CharacterCreator/index.tsx` - Main orchestrator
  - `CharacterCreator/SpeciesStep.tsx`
  - `CharacterCreator/ClassStep.tsx`
  - `CharacterCreator/AbilityScoresStep.tsx`
  - `CharacterCreator/BackgroundStep.tsx`
  - `CharacterCreator/EquipmentStep.tsx`
  - `CharacterCreator/SpellsStep.tsx`
  - `CharacterCreator/DetailsStep.tsx`

- `CharacterSheet.tsx` (1500+ lines) → Split into:
  - `CharacterSheet/index.tsx`
  - `CharacterSheet/CombatTab.tsx`
  - `CharacterSheet/SpellsTab.tsx`
  - `CharacterSheet/InventoryTab.tsx`
  - `CharacterSheet/FeaturesTab.tsx`
  - `CharacterSheet/NotesTab.tsx`

- `CampaignGenerator.tsx` (1200+ lines) → Split into:
  - `CampaignGenerator/index.tsx`
  - `CampaignGenerator/OverviewPanel.tsx`
  - `CampaignGenerator/ActPanel.tsx`
  - `CampaignGenerator/EncounterPanel.tsx`

**Implementation**: Extract logical sections into separate files with clear interfaces

**Estimated Scope**: ~20 new files, significant refactoring

---

### 4.2 Delta Updates for Performance

**Goal**: Only send changed data over sockets instead of full state.

**Files to Modify**:
- `server/src/socketHandlers.ts`
- `client/src/hooks/useSocket.ts`
- `shared/types.ts`

**Implementation Steps**:
1. Create diff utility:
   ```typescript
   export function createDelta<T>(previous: T, current: T): Partial<T> {
     const delta: Partial<T> = {};
     for (const key in current) {
       if (JSON.stringify(previous[key]) !== JSON.stringify(current[key])) {
         delta[key] = current[key];
       }
     }
     return delta;
   }
   ```

2. Modify socket emissions to send deltas
3. Update client to apply deltas to current state
4. Add sequence numbers for ordering

**Estimated Scope**: ~3 files, ~200 lines

---

### 4.3 Error Boundaries

**Goal**: Prevent entire app crashes from component errors.

**Files to Create/Modify**:
- `client/src/components/ErrorBoundary.tsx` (new)
- `client/src/App.tsx` (modify)
- `client/src/components/ErrorFallback.tsx` (new)

**Implementation Steps**:
1. Create ErrorBoundary component:
   ```typescript
   class ErrorBoundary extends React.Component<Props, State> {
     static getDerivedStateFromError(error: Error) {
       return { hasError: true, error };
     }

     componentDidCatch(error: Error, info: React.ErrorInfo) {
       console.error('Component error:', error, info);
       // Send to logging service
     }

     render() {
       if (this.state.hasError) {
         return <ErrorFallback error={this.state.error} onReset={() => this.setState({ hasError: false })} />;
       }
       return this.props.children;
     }
   }
   ```

2. Create user-friendly error fallback UI
3. Wrap major sections in error boundaries
4. Add "Report Issue" button

**Estimated Scope**: ~3 files, ~150 lines

---

## Implementation Order Summary

### Sprint 1: Security Foundation
1. Input Validation (Zod schemas)
2. Rate Limiting
3. Enhanced Room Security
4. CORS Configuration
5. Structured Logging

### Sprint 2: Database & Recovery
1. PostgreSQL Migration Path
2. Session Recovery Improvements
3. Error Boundaries

### Sprint 3: Combat Enhancements
1. Concentration Tracking
2. Condition Indicators on Tokens
3. Turn Order Manipulation
4. Skill Check Buttons

### Sprint 4: Character Management
1. Spell Slot Management UI
2. Rest Mechanics
3. Character Import/Export

### Sprint 5: DM Tools
1. DM Notes System
2. Token Art Library
3. Undo/Redo System

### Sprint 6: Polish
1. Dice Macro System
2. Component Refactoring
3. Delta Updates

---

## Metrics for Success

- **Security**: Zero critical vulnerabilities in security audit
- **Performance**: Socket message size reduced by 50%+
- **Stability**: Error boundary catches prevent 99% of crashes
- **User Experience**: Session recovery success rate > 95%
- **Code Quality**: No component files over 500 lines

---

## Dependencies to Add

```json
{
  "dependencies": {
    "zod": "^3.22.0",
    "winston": "^3.11.0",
    "rate-limiter-flexible": "^4.0.0",
    "pg": "^8.11.0",
    "knex": "^3.1.0",
    "multer": "^1.4.5-lts.1",
    "bcrypt": "^5.1.1"
  },
  "devDependencies": {
    "@types/pg": "^8.10.0",
    "@types/multer": "^1.4.11",
    "@types/bcrypt": "^5.0.2"
  }
}
```

---

*This plan excludes audio features (sound effects and ambient music) as requested.*
