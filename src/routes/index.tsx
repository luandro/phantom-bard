import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { GameProvider, useGame } from "@/hooks/use-game";
import { GameSetup } from "@/components/GameSetup";
import { GameScreen } from "@/components/GameScreen";
import { MultiplayerLobby } from "@/components/MultiplayerLobby";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Realm of Fate — AI Dungeon Master" },
      { name: "description", content: "Play Dungeons & Dragons with an AI Dungeon Master. Create characters, roll dice, and embark on epic adventures." },
      { property: "og:title", content: "Realm of Fate — AI Dungeon Master" },
      { property: "og:description", content: "Play D&D with an AI Dungeon Master" },
    ],
  }),
});

/**
 * Root page component. Wraps the game in a {@link GameProvider} and
 * routes between the multiplayer lobby, game setup, and active game screen.
 */
function Index() {
  const [pastLobby, setPastLobby] = useState(false);
  return (
    <GameProvider>
      <GameRouter pastLobby={pastLobby} setPastLobby={setPastLobby} />
    </GameProvider>
  );
}

/**
 * Routing component that determines which screen to show based on game state:
 * - If the game has started, shows {@link GameScreen}.
 * - If the user hasn't passed the lobby or is a non-host in a party, shows {@link MultiplayerLobby}.
 * - Otherwise, shows {@link GameSetup}.
 */
function GameRouter({ pastLobby, setPastLobby }: { pastLobby: boolean; setPastLobby: (v: boolean) => void }) {
  const { state, isPartyHost, partyCode } = useGame();

  // Reset pastLobby when game is reset or party is left, so the lobby
  // is shown again on the next visit instead of skipping to GameSetup.
  const prevGameStarted = useRef(state.gameStarted);
  const prevPartyCode = useRef(partyCode);

  if (!state.gameStarted && prevGameStarted.current) {
    setPastLobby(false);
  }
  if (!partyCode && prevPartyCode.current) {
    setPastLobby(false);
  }
  prevGameStarted.current = state.gameStarted;
  prevPartyCode.current = partyCode;

  if (state.gameStarted) return <GameScreen />;

  // Non-host in a party (connected or disconnected) without a started game
  // should stay in the lobby, not be dropped into GameSetup.
  if (!pastLobby || (partyCode && !isPartyHost && !state.gameStarted)) {
    return <MultiplayerLobby onProceed={() => setPastLobby(true)} />;
  }

  return <GameSetup />;
}
