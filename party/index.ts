import type * as Party from "partykit/server";
import type { PartyPlayer } from "../src/lib/party-types";

interface RoomState {
  players: PartyPlayer[];
  gameState: unknown;
  hostId: string | null;
  stateVersion: number;
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
   */
  async onMessage(message: string, sender: Party.Connection) {
    let data: { type: string; playerName?: string; intent?: 'create' | 'join'; gameState?: unknown; version?: number };
    try {
      data = JSON.parse(message) as {
        type: string;
        playerName?: string;
        intent?: 'create' | 'join';
        gameState?: unknown;
        version?: number;
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
    };

    if (data.type === "hello" && data.playerName) {
      const intent = data.intent ?? 'join';

      // Validate intent against room state
      if (intent === 'create' && state.players.length > 0 && state.hostId !== sender.id) {
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

      const isHost = intent === 'create' || state.hostId === sender.id;
      const player: PartyPlayer = {
        id: sender.id,
        name: data.playerName,
        isHost: isHost,
      };

      if (isHost) {
        state.hostId = sender.id;
      }

      // Update existing player or add new one
      state.players = state.players.filter((p) => p.id !== sender.id);
      state.players.push(player);
      await this.room.storage.put("state", state);

      this.room.broadcast(
        JSON.stringify({
          type: "player_joined",
          player,
          players: state.players,
          hostId: state.hostId,
        })
      );
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
    };

    state.players = state.players.filter((p) => p.id !== conn.id);

    // Promote next player to host if host left
    if (state.hostId === conn.id) {
      if (state.players.length > 0) {
        state.hostId = state.players[0].id;
        state.players[0].isHost = true;
      } else {
        state.hostId = null;
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
