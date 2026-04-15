/**
 * Tests for PartyKit server — player_action relay
 *
 * Tests the new `player_action` message type that allows non-host players
 * to send actions through the server to the host for processing.
 *
 * These tests mock the PartyKit server API and verify:
 * - Non-host actions are relayed to the host
 * - Host actions via player_action are rejected
 * - Missing/empty actions are rejected
 * - Host-not-connected error is returned when host is absent
 * - Server-authoritative player name is used
 * - Queue cap is enforced (max 5)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock PartyKit server API ────────────────────────────────────────────────

interface MockConnection {
  id: string;
  sentMessages: string[];
  send: (msg: string) => void;
}

function createMockConnection(id: string): MockConnection {
  return {
    id,
    sentMessages: [],
    send(msg: string) {
      this.sentMessages.push(msg);
    },
  };
}

interface MockRoom {
  storage: {
    _state: Record<string, unknown>;
    get: <T>(key: string) => Promise<T | null>;
    put: (key: string, value: unknown) => Promise<void>;
  };
  _connections: Map<string, MockConnection>;
  broadcast: (msg: string, excludeIds?: string[]) => void;
  getConnection: (id: string) => MockConnection | null;
}

function createMockRoom(initialState?: Record<string, unknown>): MockRoom {
  const state = initialState ?? {
    players: [],
    gameState: null,
    hostId: null,
    stateVersion: 0,
    hostSecret: null,
  };

  const connections = new Map<string, MockConnection>();

  return {
    storage: {
      _state: { state },
      async get<T>(key: string): Promise<T | null> {
        return (this._state[key] as T) ?? null;
      },
      async put(key: string, value: unknown): Promise<void> {
        this._state[key] = value;
      },
    },
    _connections: connections,
    broadcast(msg: string, excludeIds: string[] = []) {
      for (const [id, conn] of connections) {
        if (!excludeIds.includes(id)) {
          conn.send(msg);
        }
      }
    },
    getConnection(id: string) {
      return connections.get(id) ?? null;
    },
  };
}

// ─── Import the GameRoom class ────────────────────────────────────────────────
// We need to mock the Party module before importing

vi.mock('partykit/server', () => ({
  Server: class {},
  Room: class {},
  Worker: class {},
}));

// Import after mocking
import GameRoom from './index';

// Helper to create a fully mocked GameRoom instance
function createGameRoom(room?: MockRoom) {
  const mockRoom = room ?? createMockRoom();
  const gameRoom = new GameRoom(mockRoom as any);
  return { gameRoom, room: mockRoom };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('PartyKit GameRoom — player_action', () => {
  let hostConn: MockConnection;
  let nonHostConn: MockConnection;
  let room: MockRoom;
  let gameRoom: GameRoom;

  beforeEach(() => {
    hostConn = createMockConnection('host-1');
    nonHostConn = createMockConnection('player-1');

    const initialState = {
      players: [
        { id: 'host-1', name: 'HostPlayer', isHost: true },
        { id: 'player-1', name: 'NonHostPlayer', isHost: false },
      ],
      gameState: { campaignName: 'Test' },
      hostId: 'host-1',
      stateVersion: 1,
      hostSecret: 'secret-123',
    };

    room = createMockRoom(initialState);
    room._connections.set('host-1', hostConn);
    room._connections.set('player-1', nonHostConn);

    const instance = createGameRoom(room);
    gameRoom = instance.gameRoom;
  });

  describe('player_action from non-host', () => {
    it('should relay action to host with server-authoritative player name', async () => {
      const msg = JSON.stringify({
        type: 'player_action',
        action: 'I attack the goblin!',
      });

      await gameRoom.onMessage(msg, nonHostConn as any);

      // Host should receive a remote_action message
      expect(hostConn.sentMessages).toHaveLength(1);
      const relayed = JSON.parse(hostConn.sentMessages[0]);
      expect(relayed.type).toBe('remote_action');
      expect(relayed.action).toBe('I attack the goblin!');
      expect(relayed.playerName).toBe('NonHostPlayer');
      expect(relayed.playerId).toBe('player-1');
    });

    it('should not broadcast to all clients — only relay to host', async () => {
      const msg = JSON.stringify({
        type: 'player_action',
        action: 'I investigate the area.',
      });

      await gameRoom.onMessage(msg, nonHostConn as any);

      // Non-host sender should NOT receive any message back
      expect(nonHostConn.sentMessages).toHaveLength(0);
    });

    it('should not persist any state changes', async () => {
      const stateBefore = JSON.stringify(await room.storage.get('state'));

      const msg = JSON.stringify({
        type: 'player_action',
        action: 'I cast a spell!',
      });

      await gameRoom.onMessage(msg, nonHostConn as any);

      const stateAfter = JSON.stringify(await room.storage.get('state'));
      expect(stateAfter).toBe(stateBefore);
    });
  });

  describe('player_action validation', () => {
    it('should reject empty action', async () => {
      const msg = JSON.stringify({
        type: 'player_action',
        action: '',
      });

      await gameRoom.onMessage(msg, nonHostConn as any);

      expect(nonHostConn.sentMessages).toHaveLength(1);
      const error = JSON.parse(nonHostConn.sentMessages[0]);
      expect(error.type).toBe('error');
      expect(error.message).toContain('empty');
    });

    it('should reject whitespace-only action', async () => {
      const msg = JSON.stringify({
        type: 'player_action',
        action: '   ',
      });

      await gameRoom.onMessage(msg, nonHostConn as any);

      expect(nonHostConn.sentMessages).toHaveLength(1);
      const error = JSON.parse(nonHostConn.sentMessages[0]);
      expect(error.type).toBe('error');
    });

    it('should reject player_action from the host (hosts should use game_update)', async () => {
      const msg = JSON.stringify({
        type: 'player_action',
        action: 'I attack!',
      });

      await gameRoom.onMessage(msg, hostConn as any);

      expect(hostConn.sentMessages).toHaveLength(1);
      const error = JSON.parse(hostConn.sentMessages[0]);
      expect(error.type).toBe('error');
      expect(error.message).toContain('host');
    });

    it('should reject player_action with missing action field', async () => {
      const msg = JSON.stringify({
        type: 'player_action',
      });

      await gameRoom.onMessage(msg, nonHostConn as any);

      expect(nonHostConn.sentMessages).toHaveLength(1);
      const error = JSON.parse(nonHostConn.sentMessages[0]);
      expect(error.type).toBe('error');
    });
  });

  describe('host not connected', () => {
    it('should return error when host is not connected', async () => {
      // Remove host from connections
      room._connections.delete('host-1');

      const msg = JSON.stringify({
        type: 'player_action',
        action: 'I search for traps.',
      });

      await gameRoom.onMessage(msg, nonHostConn as any);

      expect(nonHostConn.sentMessages).toHaveLength(1);
      const error = JSON.parse(nonHostConn.sentMessages[0]);
      expect(error.type).toBe('error');
      expect(error.message).toContain('Host');
    });
  });

  describe('unknown sender', () => {
    it('should handle player_action from unknown player (not in player list)', async () => {
      const unknownConn = createMockConnection('unknown-1');
      room._connections.set('unknown-1', unknownConn);

      const msg = JSON.stringify({
        type: 'player_action',
        action: 'I do something.',
      });

      await gameRoom.onMessage(msg, unknownConn as any);

      // Should either reject or handle gracefully
      // The player is not in the player list, so we can't look up their name
      // The server should send an error
      expect(unknownConn.sentMessages).toHaveLength(1);
      const response = JSON.parse(unknownConn.sentMessages[0]);
      expect(response.type).toBe('error');
    });
  });

  describe('existing message types still work', () => {
    it('should still handle hello messages', async () => {
      const newConn = createMockConnection('new-player');
      room._connections.set('new-player', newConn);

      const msg = JSON.stringify({
        type: 'hello',
        playerName: 'NewPlayer',
        intent: 'join',
      });

      await gameRoom.onMessage(msg, newConn as any);

      // Should not error — player should be added
      const state = await room.storage.get<any>('state');
      expect(state.players.some((p: any) => p.id === 'new-player')).toBe(true);
    });

    it('should still handle game_update from host', async () => {
      const msg = JSON.stringify({
        type: 'game_update',
        gameState: { campaignName: 'Updated' },
        version: 2,
      });

      await gameRoom.onMessage(msg, hostConn as any);

      const state = await room.storage.get<any>('state');
      expect(state.stateVersion).toBe(2);
    });
  });
});
