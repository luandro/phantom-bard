import { useState, useCallback, useEffect, useRef, createContext, useContext, type ReactNode } from 'react';
import PartySocket from 'partysocket';
import { type GameState, type Character, type StoryEntry, type DiceRoll, type PartyPlayer, PREBUILT_CAMPAIGNS, type Campaign, type GroupPatron } from '@/lib/types';
import { createDefaultGameState, loadGameState, saveGameState, clearGameState, createStoryEntry, rollDice, createCharacter } from '@/lib/game-store';

// ─── Party code generator ───────────────────────────────────────────────────

/**
 * Generates a random 5-character party code using unambiguous
 * alphanumeric characters (excludes 0/O/I/1/L to avoid confusion).
 * @returns A uppercase alphanumeric party code string
 */
function generatePartyCode(): string {
  // Unambiguous alphanumeric chars (no 0/O/I/1/L)
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ─── Type guard for incoming game state (Task 12) ──────────────────────────

/**
 * Type guard that validates whether an unknown value conforms to the {@link GameState} interface.
 * Checks for required fields: campaignName, campaignLevel, party (as Character[]), storyLog, currentTurn,
 * isInCombat, and gameStarted.
 * @param data - The value to validate
 * @returns True if the data is a valid GameState
 */
const STORY_ENTRY_TYPES = new Set<string>(['narration', 'player', 'system', 'dice', 'puzzle']);

function isValidCharacter(el: unknown): el is Character {
  if (typeof el !== 'object' || el === null) return false;
  const c = el as Record<string, unknown>;
  return (
    typeof c.id === 'string' &&
    typeof c.name === 'string' &&
    typeof c.race === 'string' &&
    typeof c.class === 'string' &&
    typeof c.subclass === 'string' &&
    typeof c.level === 'number' &&
    typeof c.hp === 'number' &&
    typeof c.maxHp === 'number' &&
    typeof c.stats === 'object' && c.stats !== null &&
    typeof (c.stats as Record<string, unknown>).STR === 'number' &&
    typeof (c.stats as Record<string, unknown>).DEX === 'number' &&
    typeof (c.stats as Record<string, unknown>).CON === 'number' &&
    typeof (c.stats as Record<string, unknown>).INT === 'number' &&
    typeof (c.stats as Record<string, unknown>).WIS === 'number' &&
    typeof (c.stats as Record<string, unknown>).CHA === 'number' &&
    Array.isArray(c.inventory) &&
    Array.isArray(c.spells)
  );
}

function isValidStoryEntry(el: unknown): el is StoryEntry {
  if (typeof el !== 'object' || el === null) return false;
  const s = el as Record<string, unknown>;
  return (
    typeof s.id === 'string' &&
    typeof s.type === 'string' &&
    STORY_ENTRY_TYPES.has(s.type as string) &&
    typeof s.content === 'string' &&
    typeof s.timestamp === 'number'
  );
}

function isValidGameState(data: unknown): data is GameState {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.campaignName === 'string' &&
    typeof d.campaignLevel === 'number' &&
    Array.isArray(d.party) &&
    Array.isArray(d.storyLog) &&
    typeof d.currentTurn === 'number' &&
    typeof d.isInCombat === 'boolean' &&
    typeof d.gameStarted === 'boolean' &&
    (d.party as unknown[]).every(isValidCharacter) &&
    (d.storyLog as unknown[]).every(isValidStoryEntry)
  );
}

// ─── Context types ───────────────────────────────────────────────────────────

interface GameContextType {
  state: GameState;
  isLoading: boolean;
  startCampaign: (name: string, level: number, party: Character[], patron?: GroupPatron) => void;
  addStoryEntry: (entry: StoryEntry) => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  performDiceRoll: (sides: number, modifier?: number) => DiceRoll;
  sendPlayerAction: (action: string) => Promise<void>;
  resetGame: () => void;
  matchedCampaign: Campaign | null;
  // Multiplayer / party
  partyCode: string | null;
  partyPlayers: PartyPlayer[];
  isPartyHost: boolean;
  isPartyConnected: boolean;
  playerName: string;
  createParty: (name: string) => string;
  joinParty: (code: string, name: string) => void;
  leaveParty: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

/**
 * React context hook for accessing the game state and actions.
 * Must be called within a {@link GameProvider}.
 * @returns The game context with state, actions, and multiplayer utilities
 * @throws If called outside of a GameProvider
 */
export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────────────────────

/**
 * Provides global game state, AI DM interaction, and multiplayer party management
 * to all descendant components via React context.
 * Handles localStorage persistence, party WebSocket connections, and
 * debounced state broadcasting (host-only).
 */
export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(() => loadGameState() ?? createDefaultGameState());
  const [isLoading, setIsLoading] = useState(false);
  const [matchedCampaign, setMatchedCampaign] = useState<Campaign | null>(null);

  // Party state
  const [partyCode, setPartyCode] = useState<string | null>(null);
  const [partyPlayers, setPartyPlayers] = useState<PartyPlayer[]>([]);
  const [isPartyHost, setIsPartyHost] = useState(false);
  const [isPartyConnected, setIsPartyConnected] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const partySocketRef = useRef<PartySocket | null>(null);
  // Prevent re-broadcasting state that arrived from remote
  const lastSyncedStateRef = useRef<string | null>(null);
  // Ref to avoid stale closure in broadcast effect
  const isPartyHostRef = useRef(isPartyHost);
  isPartyHostRef.current = isPartyHost;
  // Task 15: Refs for isPartyConnected and partyCode to avoid stale closures
  const isPartyConnectedRef = useRef(isPartyConnected);
  isPartyConnectedRef.current = isPartyConnected;
  const partyCodeRef = useRef(partyCode);
  partyCodeRef.current = partyCode;
  // Task 16: Monotonically increasing version for state updates
  const stateVersionRef = useRef(0);
  // Task 11: Debounce timeout ref for broadcast
  const broadcastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Host secret token for secure host reconnection
  const hostSecretRef = useRef<string | null>(null);
  // Ref for latest state to avoid stale closure in debounced broadcast
  const latestStateRef = useRef(state);
  latestStateRef.current = state;

  // ── Persist to localStorage ────────────────────────────────────────────────
  useEffect(() => { saveGameState(state); }, [state]);

  // ── Broadcast state to party whenever it changes (host only) ───────────────
  // Task 11: 300ms debounce, Task 15: refs for stable values, Task 16: version
  useEffect(() => {
    const serialized = JSON.stringify(state);
    if (lastSyncedStateRef.current === serialized) {
      return;
    }
    if (!isPartyHostRef.current) return;

    // Task 11: Clear previous timeout and set new one for debounce
    if (broadcastTimeoutRef.current !== null) {
      clearTimeout(broadcastTimeoutRef.current);
    }

    broadcastTimeoutRef.current = setTimeout(() => {
      if (partySocketRef.current && isPartyConnectedRef.current && partyCodeRef.current && isPartyHostRef.current) {
        stateVersionRef.current += 1;
        partySocketRef.current.send(JSON.stringify({
          type: 'game_update',
          gameState: latestStateRef.current,
          version: stateVersionRef.current,
        }));
      }
      broadcastTimeoutRef.current = null;
    }, 300);

    return () => {
      if (broadcastTimeoutRef.current !== null) {
        clearTimeout(broadcastTimeoutRef.current);
        broadcastTimeoutRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // ── Game actions ───────────────────────────────────────────────────────────

  const addStoryEntry = useCallback((entry: StoryEntry) => {
    setState(prev => ({ ...prev, storyLog: [...prev.storyLog, entry] }));
  }, []);

  const updateCharacter = useCallback((id: string, updates: Partial<Character>) => {
    setState(prev => ({
      ...prev,
      party: prev.party.map(c => c.id === id ? { ...c, ...updates } : c),
    }));
  }, []);

  const performDiceRoll = useCallback((sides: number, modifier: number = 0) => {
    const roll = rollDice(sides, modifier);
    const label = roll.isCriticalSuccess ? '🎯 CRITICAL SUCCESS!' : roll.isCriticalFail ? '💀 CRITICAL FAIL!' : '';
    addStoryEntry(createStoryEntry('dice', `Rolled ${roll.type}: ${roll.result}${modifier !== 0 ? ` (${modifier >= 0 ? '+' : ''}${modifier}) = ${roll.total}` : ''} ${label}`));
    return roll;
  }, [addStoryEntry]);

  const startCampaign = useCallback((name: string, level: number, party: Character[], patron?: GroupPatron) => {
    const matched = PREBUILT_CAMPAIGNS.find(c => c.name.toLowerCase() === name.toLowerCase());
    setMatchedCampaign(matched ?? null);

    const opening = matched ? matched.opening : `Your adventure "${name}" begins...`;

    setState({
      campaignName: name,
      campaignLevel: level,
      party,
      storyLog: [createStoryEntry('narration', opening)],
      currentTurn: 0,
      isInCombat: false,
      gameStarted: true,
      groupPatron: patron,
    });

    setTimeout(() => {
      sendInitialScene(name, level, party, matched ?? null, patron);
    }, 500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendInitialScene = async (name: string, level: number, party: Character[], campaign: Campaign | null, patron?: GroupPatron) => {
    setIsLoading(true);
    try {
      const partyDesc = party.map(c => `${c.name} (Level ${c.level} ${c.race} ${c.class}, HP: ${c.hp}/${c.maxHp})`).join(', ');
      const campaignContext = campaign
        ? `Campaign: "${campaign.name}". Quest: ${campaign.questHook}. Tone: ${campaign.tone}. Key locations: ${campaign.locations.join(', ')}. Enemies: ${campaign.enemies.join(', ')}.`
        : `Original campaign: "${name}". Create a compelling opening scene.`;
      const patronCtx = patron ? ` The party is sponsored by "${patron.name}" (${patron.type}): ${patron.description}. Perks: ${patron.perks.join(', ')}.` : '';

      const response = await callAIDM([
        { role: 'user', content: `Begin the campaign. ${campaignContext}${patronCtx} Party: ${partyDesc}. Level: ${level}. Set the scene with vivid description, present the party with their first situation, and give them clear choices for what to do next. Keep it to 2-3 paragraphs.` }
      ]);

      setState(prev => ({
        ...prev,
        storyLog: [...prev.storyLog, createStoryEntry('narration', response)],
      }));
    } catch (e) {
      console.error('AI DM error:', e);
      setState(prev => ({
        ...prev,
        storyLog: [...prev.storyLog, createStoryEntry('system', 'The Dungeon Master is gathering their thoughts... (AI temporarily unavailable)')],
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const sendPlayerAction = useCallback(async (action: string) => {
    const activeChar = state.party[state.currentTurn % state.party.length];
    addStoryEntry(createStoryEntry('player', action, activeChar?.name));
    setIsLoading(true);

    try {
      const recentLog = state.storyLog.slice(-10).map(e => {
        if (e.type === 'narration') return `DM: ${e.content}`;
        if (e.type === 'player') return `${e.characterName ?? 'Player'}: ${e.content}`;
        if (e.type === 'dice') return `[${e.content}]`;
        return `[System: ${e.content}]`;
      }).join('\n');

      const partyDesc = state.party.map(c => `${c.name} (Lv${c.level} ${c.race} ${c.class}, HP:${c.hp}/${c.maxHp}, STR:${c.stats.STR} DEX:${c.stats.DEX} CON:${c.stats.CON} INT:${c.stats.INT} WIS:${c.stats.WIS} CHA:${c.stats.CHA})`).join('; ');

      const campaign = matchedCampaign;
      const campaignCtx = campaign ? `Campaign: "${campaign.name}". Tone: ${campaign.tone}.` : `Campaign: "${state.campaignName}".`;
      const patronCtx = state.groupPatron ? ` Party patron: "${state.groupPatron.name}" (${state.groupPatron.type}).` : '';

      const response = await callAIDM([
        { role: 'system', content: `You are a D&D Dungeon Master. ${campaignCtx}${patronCtx} Party: ${partyDesc}. Rules: 1) Request dice rolls for uncertain outcomes using [ROLL:d20+modifier] format. 2) Adapt difficulty to party level ${state.campaignLevel}. 3) Be descriptive and immersive. 4) Present clear choices. 5) If combat starts, describe enemy positions. 6) Track HP changes with [HP:characterName:-amount] or [HP:characterName:+amount]. 7) Never resolve uncertain outcomes without dice. 8) Occasionally introduce puzzles (riddles, logic challenges, ciphers) that players must solve. 9) Reference subclass abilities when characters use class features. 10) If the party has a patron, weave their influence into the story.` },
        { role: 'user', content: `Recent events:\n${recentLog}\n\nPlayer action: ${activeChar?.name ?? 'Player'} says: "${action}"\n\nRespond as the DM. Keep to 2-3 paragraphs.` }
      ]);

      const hpChanges = response.matchAll(/\[HP:([^:]+):([+-]\d+)\]/g);
      for (const match of hpChanges) {
        const charName = match[1];
        const amount = parseInt(match[2]);
        const char = state.party.find(c => c.name.toLowerCase() === charName.toLowerCase());
        if (char) {
          updateCharacter(char.id, { hp: Math.max(0, Math.min(char.maxHp, char.hp + amount)) });
        }
      }

      const cleanResponse = response.replace(/\[HP:[^\]]+\]/g, '').trim();

      setState(prev => ({
        ...prev,
        storyLog: [...prev.storyLog, createStoryEntry('narration', cleanResponse)],
        currentTurn: prev.currentTurn + 1,
      }));
    } catch (e) {
      console.error('AI DM error:', e);
      addStoryEntry(createStoryEntry('system', 'The Dungeon Master pauses... (AI temporarily unavailable, try again)'));
    } finally {
      setIsLoading(false);
    }
  }, [state, addStoryEntry, updateCharacter, matchedCampaign]);

  const resetGame = useCallback(() => {
    clearGameState();
    setState(createDefaultGameState());
    setMatchedCampaign(null);
  }, []);

  // ── Party / multiplayer ────────────────────────────────────────────────────

  const connectToRoom = useCallback((code: string, name: string, intent: 'create' | 'join') => {
    partySocketRef.current?.close();

    const host = import.meta.env.VITE_PARTYKIT_HOST ?? '127.0.0.1:1999';
    const socket = new PartySocket({ host, room: code.toLowerCase() });

    socket.addEventListener('open', () => {
      setIsPartyConnected(true);
      const helloMsg: Record<string, unknown> = { type: 'hello', playerName: name, intent };
      // Include host secret for reconnection (allows host to reclaim role after page refresh)
      if (hostSecretRef.current) {
        helloMsg.hostSecret = hostSecretRef.current;
      }
      socket.send(JSON.stringify(helloMsg));
    });

    socket.addEventListener('message', (event: MessageEvent<string>) => {
      let data: {
        type: string;
        players?: PartyPlayer[];
        player?: PartyPlayer;
        hostId?: string | null;
        gameState?: GameState;
        playerId?: string;
        version?: number;
        message?: string;
        hostSecret?: string;
      };
      try {
        data = JSON.parse(event.data) as {
          type: string;
          players?: PartyPlayer[];
          player?: PartyPlayer;
          hostId?: string | null;
          gameState?: GameState;
          playerId?: string;
          version?: number;
          message?: string;
          hostSecret?: string;
        };
      } catch {
        console.warn('Received invalid JSON from party server');
        return;
      }

      if (typeof data.type !== 'string') {
        console.warn('Received message with missing or invalid type');
        return;
      }

      if (data.type === 'error') {
        console.warn('Server error:', data.message);
        return;
      }

      if (data.type === 'sync') {
        setPartyPlayers(data.players ?? []);
        // Task 12: Validate game state before applying
        if (data.gameState && isValidGameState(data.gameState)) {
          lastSyncedStateRef.current = JSON.stringify(data.gameState);
          setState(data.gameState);
          // Task 16: Sync version from server
          if (typeof data.version === 'number') {
            stateVersionRef.current = data.version;
          }
        } else if (data.gameState) {
          console.warn('Received invalid game state from server, ignoring');
        }
        // Determine if we're host based on first player slot
        const me = data.players?.find(p => p.id === socket.id);
        if (me) setIsPartyHost(me.isHost);

      } else if (data.type === 'player_joined') {
        setPartyPlayers(data.players ?? []);
        if (data.player?.id === socket.id) {
          setIsPartyHost(data.player.isHost);
        }

      } else if (data.type === 'player_left') {
        setPartyPlayers(data.players ?? []);
        // Re-check if we became host after someone left
        const me = data.players?.find(p => p.id === socket.id);
        if (me) setIsPartyHost(me.isHost);

      } else if (data.type === 'host_secret') {
        // Store the host secret for reconnection
        if (typeof data.hostSecret === 'string') {
          hostSecretRef.current = data.hostSecret;
        }

      } else if (data.type === 'game_sync' && data.gameState) {
        // Task 12: Validate game state before applying
        if (isValidGameState(data.gameState)) {
          lastSyncedStateRef.current = JSON.stringify(data.gameState);
          setState(data.gameState);
          // Task 16: Sync version from server
          if (typeof data.version === 'number') {
            stateVersionRef.current = data.version;
          }
        } else {
          console.warn('Received invalid game state in game_sync, ignoring');
        }
      }
    });

    // Task 13: Handle WebSocket errors
    socket.addEventListener('error', (event: Event) => {
      console.error('WebSocket error:', event);
      setIsPartyConnected(false);
    });

    socket.addEventListener('close', () => {
      setIsPartyConnected(false);
    });

    partySocketRef.current = socket;
  }, []);

  const createParty = useCallback((name: string): string => {
    const code = generatePartyCode();
    setPartyCode(code);
    setPlayerName(name);
    setIsPartyHost(true);
    connectToRoom(code, name, 'create');
    return code;
  }, [connectToRoom]);

  const joinParty = useCallback((code: string, name: string): void => {
    const upperCode = code.toUpperCase();
    setPartyCode(upperCode);
    setPlayerName(name);
    setIsPartyHost(false);
    connectToRoom(upperCode, name, 'join');
  }, [connectToRoom]);

  const leaveParty = useCallback(() => {
    partySocketRef.current?.close();
    partySocketRef.current = null;
    setPartyCode(null);
    setIsPartyConnected(false);
    setIsPartyHost(false);
    setPartyPlayers([]);
    setPlayerName('');
    hostSecretRef.current = null;
  }, []);

  // Cleanup socket on unmount
  useEffect(() => {
    return () => { partySocketRef.current?.close(); };
  }, []);

  return (
    <GameContext.Provider value={{
      state, isLoading,
      startCampaign, addStoryEntry, updateCharacter, performDiceRoll, sendPlayerAction, resetGame,
      matchedCampaign,
      partyCode, partyPlayers, isPartyHost, isPartyConnected, playerName,
      createParty, joinParty, leaveParty,
    }}>
      {children}
    </GameContext.Provider>
  );
}

// ─── AI helper ───────────────────────────────────────────────────────────────

async function callAIDM(messages: { role: string; content: string }[]): Promise<string> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const resp = await fetch(`${supabaseUrl}/functions/v1/dm-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok) {
    if (resp.status === 429) throw new Error('Rate limited');
    if (resp.status === 402) throw new Error('Credits exhausted');
    throw new Error(`AI error: ${resp.status}`);
  }

  const data = await resp.json() as { content: string };
  return data.content;
}

// Keep createCharacter export for consumers that import it via use-game
export { createCharacter };
