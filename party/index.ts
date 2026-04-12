import type * as Party from "partykit/server";

interface PartyPlayer {
  id: string;
  name: string;
  isHost: boolean;
}

interface RoomState {
  players: PartyPlayer[];
  gameState: unknown;
  hostId: string | null;
}

export default class GameRoom implements Party.Server {
  constructor(readonly room: Party.Room) {}

  async onConnect(conn: Party.Connection) {
    const state = (await this.room.storage.get<RoomState>("state")) ?? {
      players: [],
      gameState: null,
      hostId: null,
    };

    conn.send(
      JSON.stringify({
        type: "sync",
        players: state.players,
        gameState: state.gameState,
        hostId: state.hostId,
      })
    );
  }

  async onMessage(message: string, sender: Party.Connection) {
    const data = JSON.parse(message) as {
      type: string;
      playerName?: string;
      gameState?: unknown;
    };

    const state = (await this.room.storage.get<RoomState>("state")) ?? {
      players: [],
      gameState: null,
      hostId: null,
    };

    if (data.type === "hello" && data.playerName) {
      const isFirstPlayer = state.players.length === 0;
      const player: PartyPlayer = {
        id: sender.id,
        name: data.playerName,
        isHost: isFirstPlayer,
      };

      if (isFirstPlayer) {
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
      state.gameState = data.gameState;
      await this.room.storage.put("state", state);

      // Broadcast to all except sender
      this.room.broadcast(
        JSON.stringify({
          type: "game_sync",
          gameState: data.gameState,
        }),
        [sender.id]
      );
    }
  }

  async onClose(conn: Party.Connection) {
    const state = (await this.room.storage.get<RoomState>("state")) ?? {
      players: [],
      gameState: null,
      hostId: null,
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
}

GameRoom satisfies Party.Worker;
