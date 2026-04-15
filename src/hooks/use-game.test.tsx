/**
 * Tests for use-game.tsx — Non-host action relay and host remote-action handling
 *
 * Tests the multiplayer action relay mechanism:
 * - Non-host sendPlayerAction relays through socket instead of calling AI DM
 * - Host receives remote_action and processes through sendPlayerAction
 * - Action queue on host processes remote actions sequentially
 * - isWaitingForHost state management
 * - Cleanup on sync, disconnect, and leave
 * - Solo play is unaffected (no regressions)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockPartySocketInstance = vi.hoisted(() => ({
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  id: 'mock-socket-id',
}));

vi.mock('partysocket', () => {
  const MockPartySocket = vi.fn(function(this: any) {
    this.send = mockPartySocketInstance.send;
    this.close = mockPartySocketInstance.close;
    this.addEventListener = mockPartySocketInstance.addEventListener;
    this.removeEventListener = mockPartySocketInstance.removeEventListener;
    this.id = mockPartySocketInstance.id;
    return this;
  });
  return { default: MockPartySocket };
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: () => `uuid-${Math.random().toString(36).slice(2, 9)}`,
});

// Mock fetch for AI DM calls
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock import.meta.env
vi.stubGlobal('import.meta', {
  env: {
    VITE_PARTYKIT_HOST: 'localhost:1999',
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_PUBLISHABLE_KEY: 'test-key',
  },
});

// ─── Import after mocks ──────────────────────────────────────────────────────

import { GameProvider, useGame } from '@/hooks/use-game';

// Helper to render the hook within GameProvider
function renderGameHook() {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <GameProvider>{children}</GameProvider>
  );
  return renderHook(() => useGame(), { wrapper });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('useGame — Non-host action relay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    mockPartySocketInstance.send.mockClear();
    mockPartySocketInstance.addEventListener.mockClear();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ content: 'The DM responds...' }),
    });
  });

  describe('solo play (no regression)', () => {
    it('sendPlayerAction should call AI DM directly when not in a party', async () => {
      const { result } = renderGameHook();

      await act(async () => {
        await result.current.sendPlayerAction('I attack the goblin!');
      });

      // Should have called fetch (AI DM)
      expect(mockFetch).toHaveBeenCalledTimes(1);
      // Should NOT have sent anything through party socket
      expect(mockPartySocketInstance.send).not.toHaveBeenCalled();
    });

    it('should add player story entry with character name in solo play', async () => {
      const { result } = renderGameHook();

      // Start a campaign first to have a character
      await act(async () => {
        result.current.startCampaign('Test Campaign', 1, [{
          id: 'char-1',
          name: 'Thorin',
          race: 'Dwarf',
          class: 'Fighter',
          subclass: 'Champion',
          level: 1,
          hp: 12,
          maxHp: 12,
          stats: { STR: 16, DEX: 12, CON: 14, INT: 10, WIS: 10, CHA: 8 },
          inventory: [],
          spells: [],
        }]);
      });

      // Wait for initial scene
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      mockFetch.mockClear();

      await act(async () => {
        await result.current.sendPlayerAction('I swing my axe!');
      });

      // Story log should have player entry
      const playerEntries = result.current.state.storyLog.filter(e => e.type === 'player');
      expect(playerEntries.length).toBeGreaterThan(0);
    });
  });

  describe('non-host player action relay', () => {
    it('should send player_action through socket when player is non-host', async () => {
      const { result } = renderGameHook();

      // Join a party as non-host
      act(() => {
        result.current.joinParty('ABCDE', 'NonHostPlayer');
      });

      // Simulate socket open and sync message
      act(() => {
        const openHandler = mockPartySocketInstance.addEventListener.mock.calls.find(
          (call: any[]) => call[0] === 'open'
        )?.[1];
        if (openHandler) openHandler();
      });

      // Simulate receiving sync with player list (non-host)
      act(() => {
        const msgHandler = mockPartySocketInstance.addEventListener.mock.calls.find(
          (call: any[]) => call[0] === 'message'
        )?.[1];
        if (msgHandler) {
          msgHandler({
            data: JSON.stringify({
              type: 'sync',
              players: [
                { id: 'host-1', name: 'HostPlayer', isHost: true },
                { id: 'mock-socket-id', name: 'NonHostPlayer', isHost: false },
              ],
              gameState: null,
              version: 1,
            }),
          });
        }
      });

      mockPartySocketInstance.send.mockClear();

      // Now send an action
      await act(async () => {
        await result.current.sendPlayerAction('I search for traps!');
      });

      // Should have sent player_action through socket, NOT called AI DM
      expect(mockPartySocketInstance.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'player_action', action: 'I search for traps!' })
      );
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should set isWaitingForHost to true when non-host sends action', async () => {
      const { result } = renderGameHook();

      // Join as non-host
      act(() => {
        result.current.joinParty('ABCDE', 'NonHostPlayer');
      });

      // Simulate socket open
      act(() => {
        const openHandler = mockPartySocketInstance.addEventListener.mock.calls.find(
          (call: any[]) => call[0] === 'open'
        )?.[1];
        if (openHandler) openHandler();
      });

      // Simulate sync
      act(() => {
        const msgHandler = mockPartySocketInstance.addEventListener.mock.calls.find(
          (call: any[]) => call[0] === 'message'
        )?.[1];
        if (msgHandler) {
          msgHandler({
            data: JSON.stringify({
              type: 'sync',
              players: [
                { id: 'host-1', name: 'HostPlayer', isHost: true },
                { id: 'mock-socket-id', name: 'NonHostPlayer', isHost: false },
              ],
              gameState: null,
              version: 1,
            }),
          });
        }
      });

      expect(result.current.isWaitingForHost).toBe(false);

      await act(async () => {
        await result.current.sendPlayerAction('I investigate.');
      });

      expect(result.current.isWaitingForHost).toBe(true);
    });
  });

  describe('host receives remote_action', () => {
    it('host should process remote_action through sendPlayerAction', async () => {
      const { result } = renderGameHook();

      // Create a party as host
      act(() => {
        result.current.createParty('HostPlayer');
      });

      // Simulate socket open
      act(() => {
        const openHandler = mockPartySocketInstance.addEventListener.mock.calls.find(
          (call: any[]) => call[0] === 'open'
        )?.[1];
        if (openHandler) openHandler();
      });

      // Simulate sync as host
      act(() => {
        const msgHandler = mockPartySocketInstance.addEventListener.mock.calls.find(
          (call: any[]) => call[0] === 'message'
        )?.[1];
        if (msgHandler) {
          msgHandler({
            data: JSON.stringify({
              type: 'sync',
              players: [
                { id: 'mock-socket-id', name: 'HostPlayer', isHost: true },
              ],
              gameState: {
                campaignName: 'Test',
                campaignLevel: 1,
                party: [{
                  id: 'char-1', name: 'Thorin', race: 'Dwarf', class: 'Fighter',
                  subclass: 'Champion', level: 1, hp: 12, maxHp: 12,
                  stats: { STR: 16, DEX: 12, CON: 14, INT: 10, WIS: 10, CHA: 8 },
                  inventory: [], spells: [],
                }],
                storyLog: [],
                currentTurn: 0,
                isInCombat: false,
                gameStarted: true,
                lootInventory: [],
              },
              version: 1,
            }),
          });
        }
      });

      mockFetch.mockClear();

      // Simulate receiving a remote_action from a non-host player
      act(() => {
        const msgHandler = mockPartySocketInstance.addEventListener.mock.calls.find(
          (call: any[]) => call[0] === 'message'
        )?.[1];
        if (msgHandler) {
          msgHandler({
            data: JSON.stringify({
              type: 'remote_action',
              action: 'I cast fireball!',
              playerName: 'NonHostPlayer',
              playerId: 'player-1',
            }),
          });
        }
      });

      // Host should have called AI DM (via sendPlayerAction)
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });

    it('host should queue remote_action when already processing', async () => {
      const { result } = renderGameHook();

      // Create party as host with game state
      act(() => {
        result.current.createParty('HostPlayer');
      });

      act(() => {
        const openHandler = mockPartySocketInstance.addEventListener.mock.calls.find(
          (call: any[]) => call[0] === 'open'
        )?.[1];
        if (openHandler) openHandler();
      });

      act(() => {
        const msgHandler = mockPartySocketInstance.addEventListener.mock.calls.find(
          (call: any[]) => call[0] === 'message'
        )?.[1];
        if (msgHandler) {
          msgHandler({
            data: JSON.stringify({
              type: 'sync',
              players: [
                { id: 'mock-socket-id', name: 'HostPlayer', isHost: true },
              ],
              gameState: {
                campaignName: 'Test',
                campaignLevel: 1,
                party: [{
                  id: 'char-1', name: 'Thorin', race: 'Dwarf', class: 'Fighter',
                  subclass: 'Champion', level: 1, hp: 12, maxHp: 12,
                  stats: { STR: 16, DEX: 12, CON: 14, INT: 10, WIS: 10, CHA: 8 },
                  inventory: [], spells: [],
                }],
                storyLog: [],
                currentTurn: 0,
                isInCombat: false,
                gameStarted: true,
                lootInventory: [],
              },
              version: 1,
            }),
          });
        }
      });

      // Make fetch slow (simulating AI DM processing)
      let resolveFirstFetch: (value: any) => void;
      mockFetch.mockReturnValue(new Promise(r => { resolveFirstFetch = r; }));
      mockFetch.mockClear();

      // Host sends own action (starts processing)
      act(() => {
        result.current.sendPlayerAction('I attack!');
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // Remote action arrives while host is processing
      act(() => {
        const msgHandler = mockPartySocketInstance.addEventListener.mock.calls.find(
          (call: any[]) => call[0] === 'message'
        )?.[1];
        if (msgHandler) {
          msgHandler({
            data: JSON.stringify({
              type: 'remote_action',
              action: 'I help!',
              playerName: 'NonHostPlayer',
              playerId: 'player-1',
            }),
          });
        }
      });

      // The remote action should be queued (not immediately processed)
      // Only 1 fetch call so far (the host's own action)
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Resolve the first fetch
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ content: 'The DM responds...' }),
      });
      await act(async () => {
        resolveFirstFetch!({
          ok: true,
          json: () => Promise.resolve({ content: 'The DM responds...' }),
        });
      });

      // After the first action completes, the queued remote action should be processed
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('isWaitingForHost cleanup', () => {
    it('should clear isWaitingForHost on game_sync', async () => {
      const { result } = renderGameHook();

      // Join as non-host
      act(() => {
        result.current.joinParty('ABCDE', 'NonHostPlayer');
      });

      act(() => {
        const openHandler = mockPartySocketInstance.addEventListener.mock.calls.find(
          (call: any[]) => call[0] === 'open'
        )?.[1];
        if (openHandler) openHandler();
      });

      // Set up initial state
      act(() => {
        const msgHandler = mockPartySocketInstance.addEventListener.mock.calls.find(
          (call: any[]) => call[0] === 'message'
        )?.[1];
        if (msgHandler) {
          msgHandler({
            data: JSON.stringify({
              type: 'sync',
              players: [
                { id: 'host-1', name: 'HostPlayer', isHost: true },
                { id: 'mock-socket-id', name: 'NonHostPlayer', isHost: false },
              ],
              gameState: null,
              version: 1,
            }),
          });
        }
      });

      // Send action (sets isWaitingForHost)
      await act(async () => {
        await result.current.sendPlayerAction('I do something!');
      });

      expect(result.current.isWaitingForHost).toBe(true);

      // Simulate game_sync from host
      act(() => {
        const msgHandler = mockPartySocketInstance.addEventListener.mock.calls.find(
          (call: any[]) => call[0] === 'message'
        )?.[1];
        if (msgHandler) {
          msgHandler({
            data: JSON.stringify({
              type: 'game_sync',
              gameState: {
                campaignName: 'Test',
                campaignLevel: 1,
                party: [],
                storyLog: [],
                currentTurn: 1,
                isInCombat: false,
                gameStarted: true,
                lootInventory: [],
              },
              version: 2,
            }),
          });
        }
      });

      expect(result.current.isWaitingForHost).toBe(false);
    });

    it('should clear isWaitingForHost on sync (initial reconnect)', async () => {
      const { result } = renderGameHook();

      act(() => {
        result.current.joinParty('ABCDE', 'NonHostPlayer');
      });

      act(() => {
        const openHandler = mockPartySocketInstance.addEventListener.mock.calls.find(
          (call: any[]) => call[0] === 'open'
        )?.[1];
        if (openHandler) openHandler();
      });

      // First sync
      act(() => {
        const msgHandler = mockPartySocketInstance.addEventListener.mock.calls.find(
          (call: any[]) => call[0] === 'message'
        )?.[1];
        if (msgHandler) {
          msgHandler({
            data: JSON.stringify({
              type: 'sync',
              players: [
                { id: 'host-1', name: 'HostPlayer', isHost: true },
                { id: 'mock-socket-id', name: 'NonHostPlayer', isHost: false },
              ],
              gameState: null,
              version: 1,
            }),
          });
        }
      });

      // Send action
      await act(async () => {
        await result.current.sendPlayerAction('Action!');
      });

      expect(result.current.isWaitingForHost).toBe(true);

      // Reconnect sync
      act(() => {
        const msgHandler = mockPartySocketInstance.addEventListener.mock.calls.find(
          (call: any[]) => call[0] === 'message'
        )?.[1];
        if (msgHandler) {
          msgHandler({
            data: JSON.stringify({
              type: 'sync',
              players: [
                { id: 'host-1', name: 'HostPlayer', isHost: true },
                { id: 'mock-socket-id', name: 'NonHostPlayer', isHost: false },
              ],
              gameState: {
                campaignName: 'Test',
                campaignLevel: 1,
                party: [],
                storyLog: [],
                currentTurn: 1,
                isInCombat: false,
                gameStarted: true,
                lootInventory: [],
              },
              version: 2,
            }),
          });
        }
      });

      expect(result.current.isWaitingForHost).toBe(false);
    });

    it('should clear isWaitingForHost on WebSocket close', async () => {
      const { result } = renderGameHook();

      act(() => {
        result.current.joinParty('ABCDE', 'NonHostPlayer');
      });

      act(() => {
        const openHandler = mockPartySocketInstance.addEventListener.mock.calls.find(
          (call: any[]) => call[0] === 'open'
        )?.[1];
        if (openHandler) openHandler();
      });

      act(() => {
        const msgHandler = mockPartySocketInstance.addEventListener.mock.calls.find(
          (call: any[]) => call[0] === 'message'
        )?.[1];
        if (msgHandler) {
          msgHandler({
            data: JSON.stringify({
              type: 'sync',
              players: [
                { id: 'host-1', name: 'HostPlayer', isHost: true },
                { id: 'mock-socket-id', name: 'NonHostPlayer', isHost: false },
              ],
              gameState: null,
              version: 1,
            }),
          });
        }
      });

      await act(async () => {
        await result.current.sendPlayerAction('Action!');
      });

      expect(result.current.isWaitingForHost).toBe(true);

      // Simulate WebSocket close
      act(() => {
        const closeHandler = mockPartySocketInstance.addEventListener.mock.calls.find(
          (call: any[]) => call[0] === 'close'
        )?.[1];
        if (closeHandler) closeHandler();
      });

      expect(result.current.isWaitingForHost).toBe(false);
    });

    it('should clear isWaitingForHost on WebSocket error', async () => {
      const { result } = renderGameHook();

      act(() => {
        result.current.joinParty('ABCDE', 'NonHostPlayer');
      });

      act(() => {
        const openHandler = mockPartySocketInstance.addEventListener.mock.calls.find(
          (call: any[]) => call[0] === 'open'
        )?.[1];
        if (openHandler) openHandler();
      });

      act(() => {
        const msgHandler = mockPartySocketInstance.addEventListener.mock.calls.find(
          (call: any[]) => call[0] === 'message'
        )?.[1];
        if (msgHandler) {
          msgHandler({
            data: JSON.stringify({
              type: 'sync',
              players: [
                { id: 'host-1', name: 'HostPlayer', isHost: true },
                { id: 'mock-socket-id', name: 'NonHostPlayer', isHost: false },
              ],
              gameState: null,
              version: 1,
            }),
          });
        }
      });

      await act(async () => {
        await result.current.sendPlayerAction('Action!');
      });

      expect(result.current.isWaitingForHost).toBe(true);

      // Simulate WebSocket error
      act(() => {
        const errorHandler = mockPartySocketInstance.addEventListener.mock.calls.find(
          (call: any[]) => call[0] === 'error'
        )?.[1];
        if (errorHandler) errorHandler(new Event('error'));
      });

      expect(result.current.isWaitingForHost).toBe(false);
    });

    it('should clear isWaitingForHost on leaveParty', async () => {
      const { result } = renderGameHook();

      act(() => {
        result.current.joinParty('ABCDE', 'NonHostPlayer');
      });

      act(() => {
        const openHandler = mockPartySocketInstance.addEventListener.mock.calls.find(
          (call: any[]) => call[0] === 'open'
        )?.[1];
        if (openHandler) openHandler();
      });

      act(() => {
        const msgHandler = mockPartySocketInstance.addEventListener.mock.calls.find(
          (call: any[]) => call[0] === 'message'
        )?.[1];
        if (msgHandler) {
          msgHandler({
            data: JSON.stringify({
              type: 'sync',
              players: [
                { id: 'host-1', name: 'HostPlayer', isHost: true },
                { id: 'mock-socket-id', name: 'NonHostPlayer', isHost: false },
              ],
              gameState: null,
              version: 1,
            }),
          });
        }
      });

      await act(async () => {
        await result.current.sendPlayerAction('Action!');
      });

      expect(result.current.isWaitingForHost).toBe(true);

      act(() => {
        result.current.leaveParty();
      });

      expect(result.current.isWaitingForHost).toBe(false);
    });
  });

  describe('host action with overrideCharacterName', () => {
    it('host sendPlayerAction should use overrideCharacterName for remote player entries', async () => {
      const { result } = renderGameHook();

      // Create party as host with game state
      act(() => {
        result.current.createParty('HostPlayer');
      });

      act(() => {
        const openHandler = mockPartySocketInstance.addEventListener.mock.calls.find(
          (call: any[]) => call[0] === 'open'
        )?.[1];
        if (openHandler) openHandler();
      });

      act(() => {
        const msgHandler = mockPartySocketInstance.addEventListener.mock.calls.find(
          (call: any[]) => call[0] === 'message'
        )?.[1];
        if (msgHandler) {
          msgHandler({
            data: JSON.stringify({
              type: 'sync',
              players: [
                { id: 'mock-socket-id', name: 'HostPlayer', isHost: true },
              ],
              gameState: {
                campaignName: 'Test',
                campaignLevel: 1,
                party: [{
                  id: 'char-1', name: 'Thorin', race: 'Dwarf', class: 'Fighter',
                  subclass: 'Champion', level: 1, hp: 12, maxHp: 12,
                  stats: { STR: 16, DEX: 12, CON: 14, INT: 10, WIS: 10, CHA: 8 },
                  inventory: [], spells: [],
                }],
                storyLog: [],
                currentTurn: 0,
                isInCombat: false,
                gameStarted: true,
                lootInventory: [],
              },
              version: 1,
            }),
          });
        }
      });

      mockFetch.mockClear();

      // Simulate remote_action with a specific player name
      act(() => {
        const msgHandler = mockPartySocketInstance.addEventListener.mock.calls.find(
          (call: any[]) => call[0] === 'message'
        )?.[1];
        if (msgHandler) {
          msgHandler({
            data: JSON.stringify({
              type: 'remote_action',
              action: 'I sneak ahead!',
              playerName: 'RoguePlayer',
              playerId: 'player-2',
            }),
          });
        }
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      // The story entry should use "RoguePlayer" as the character name, not the host's character name
      const playerEntries = result.current.state.storyLog.filter(
        e => e.type === 'player' && e.characterName === 'RoguePlayer'
      );
      expect(playerEntries.length).toBeGreaterThan(0);
    });
  });
});
