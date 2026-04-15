import type * as Party from "partykit/server";
import type { PartyPlayer } from "../src/lib/party-types";

interface RoomState {
  players: PartyPlayer[];
  gameState: unknown;
  hostId: string | null;
  stateVersion: number;
  /** Secret token issued to the host on creation, required for host reconnection. */
  hostSecret: string | null;
}

/**
 * PartyKit server room managing multiplayer game state.
 * Handles player connections, host assignment with intent validation,
 * game state synchronization with versioning, and host migration on disconnect.
 */
export default class GameRoom implements Party.Server {
  constructor(readonly room: Party.Room) {}

  /**
   * Sends the current room state (players, game state, version) to a newly connected client.
   */
  async onConnect(conn: Party.Connection) {
    const state = (await this.room.storage.get<RoomState>("state")) ?? {
      players: [],
      gameState: null,
      hostId: null,
      stateVersion: 0,
      hostSecret: null,
    };

    conn.send(
      JSON.stringify({
        type: "sync",
        players: state.players,
        gameState: state.gameState,
        hostId: state.hostId,
        version: state.stateVersion,
      })
    );
  }

  /**
   * Handles incoming messages from connected clients.
   * Supports:
   * - `hello`: Registers a player with intent validation (`create` or `join`).
   * - `game_update`: Updates game state (host-only, with stale version rejection).
   * - `player_action`: Relays a non-host player action to the host as `remote_action`.
   */
  async onMessage(message: string, sender: Party.Connection) {
    let data: { type: string; playerName?: string; intent?: 'create' | 'join'; gameState?: unknown; version?: number; hostSecret?: string; action?: string };
    try {
      data = JSON.parse(message) as {
        type: string;
        playerName?: string;
        intent?: 'create' | 'join';
        gameState?: unknown;
        version?: number;
        hostSecret?: string;
        action?: string;
      };
    } catch {
      sender.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
      return;
    }

    if (typeof data.type !== "string") {
      sender.send(JSON.stringify({ type: "error", message: "Missing or invalid message type" }));
      return;
    }

    const state = (await this.room.storage.get<RoomState>("state")) ?? {
      players: [],
      gameState: null,
      hostId: null,
      stateVersion: 0,
      hostSecret: null,
    };

    if (data.type === "hello" && data.playerName) {
      const intent = data.intent ?? 'join';

      // Recognize reconnecting host via host secret token.
      // The secret is issued when the host first creates the room and must be
      // presented on reconnection to reclaim host privileges.
      const isReconnectingHost = state.hostSecret !== null && data.hostSecret === state.hostSecret;

      // Validate intent against room state
      // Check reconnecting host BEFORE rejecting create intent — a host that
      // created the party will reconnect with intent='create' and should be
      // allowed back in even if other players are present.
      if (intent === 'create' && state.players.length > 0 && !isReconnectingHost) {
        sender.send(JSON.stringify({
          type: "error",
          message: "Room already exists. Use join instead.",
        }));
        return;
      }
      if (intent === 'join' && state.players.length === 0) {
        sender.send(JSON.stringify({
          type: "error",
          message: "Room does not exist yet. The host must create it first.",
        }));
        return;
      }

      const isHost = intent === 'create' || isReconnectingHost;
      const player: PartyPlayer = {
        id: sender.id,
        name: data.playerName,
        isHost: isHost,
      };

      if (isHost && !state.hostSecret) {
        // Generate a secret token for the host on first assignment
        state.hostSecret = crypto.randomUUID();
      }

      if (isHost) {
        state.hostId = sender.id;
      }

      // Update existing player or add new one
      state.players = state.players.filter((p) => p.id !== sender.id);
      state.players.push(player);
      await this.room.storage.put("state", state);

      // Send host secret only to the host player
      const broadcastMsg = JSON.stringify({
        type: "player_joined",
        player,
        players: state.players,
        hostId: state.hostId,
      });
      this.room.broadcast(broadcastMsg);

      // Send host secret privately to the host
      if (isHost && state.hostSecret) {
        sender.send(JSON.stringify({
          type: "host_secret",
          hostSecret: state.hostSecret,
        }));
      }
    } else if (data.type === "game_update" && data.gameState !== undefined) {
      // Only the host is authorized to update game state
      if (!state.hostId || sender.id !== state.hostId) {
        sender.send(
          JSON.stringify({
            type: "error",
            message: "Unauthorized: only the host can update game state",
          })
        );
        return;
      }

      // Task 16: Reject stale versions
      const incomingVersion = typeof data.version === "number" ? data.version : 0;
      if (incomingVersion <= state.stateVersion) {
        sender.send(
          JSON.stringify({
            type: "error",
            message: "Stale version: rejected",
          })
        );
        return;
      }

      state.gameState = data.gameState;
      state.stateVersion = incomingVersion;
      await this.room.storage.put("state", state);

      // Broadcast to all except sender
      this.room.broadcast(
        JSON.stringify({
          type: "game_sync",
          gameState: data.gameState,
          version: state.stateVersion,
        }),
        [sender.id]
      );
    } else if (data.type === 'player_action' && typeof data.action === 'string' && data.action.trim()) {
      // Non-host players send actions to the host for processing
      if (state.hostId && sender.id === state.hostId) {
        sender.send(JSON.stringify({
          type: 'error',
          message: 'host should use game_update directly',
        }));
        return;
      }

      const senderPlayer = state.players.find((p) => p.id === sender.id);
      if (!senderPlayer) {
        sender.send(JSON.stringify({
          type: 'error',
          message: 'Player not found in room',
        }));
        return;
      }

      if (!state.hostId) {
        sender.send(JSON.stringify({
          type: 'error',
          message: 'Host is not connected',
        }));
        return;
      }

      const hostConn = this.room.getConnection(state.hostId);
      if (!hostConn) {
        sender.send(JSON.stringify({
          type: 'error',
          message: 'Host is not connected',
        }));
        return;
      }

      hostConn.send(JSON.stringify({
        type: 'remote_action',
        action: data.action,
        playerName: senderPlayer.name,
        playerId: sender.id,
      }));
    } else if (data.type === 'player_action') {
      // Covers missing action field, empty string, or whitespace-only
      sender.send(JSON.stringify({
        type: 'error',
        message: 'Action cannot be empty',
      }));
    }
  }

  /**
   * Handles player disconnection. Removes the player from the room and
   * promotes the next player to host if the current host leaves.
   */
  async onClose(conn: Party.Connection) {
    const state = (await this.room.storage.get<RoomState>("state")) ?? {
      players: [],
      gameState: null,
      hostId: null,
      stateVersion: 0,
      hostSecret: null,
    };

    state.players = state.players.filter((p) => p.id !== conn.id);

    // Promote next player to host if host left
    if (state.hostId === conn.id) {
      if (state.players.length > 0) {
        state.hostId = state.players[0].id;
        state.players[0].isHost = true;
        // Reset hostSecret so the old host cannot reclaim after promotion
        state.hostSecret = crypto.randomUUID();
        // Send the new secret to the promoted host
        const newHost = this.room.getConnection(state.players[0].id);
        if (newHost) {
          newHost.send(JSON.stringify({
            type: "host_secret",
            hostSecret: state.hostSecret,
          }));
        }
      } else {
        state.hostId = null;
        state.hostSecret = null;
      }
    }

    await this.room.storage.put("state", state);

    this.room.broadcast(
      JSON.stringify({
        type: "player_left",
        playerId: conn.id,
        players: state.players,
        hostId: state.hostId,
      })
    );
  }

  /**
   * Logs connection errors and attempts to notify the affected client.
   */
  onError(conn: Party.Connection, error: Error) {
    console.error(`Party connection error (${conn.id}):`, error);
    try {
      conn.send(
        JSON.stringify({
          type: "error",
          message: "An internal server error occurred",
        })
      );
    } catch {
      // Connection may be in a failed state; ignore send errors
    }
  }
}

GameRoom satisfies Party.Worker;
