import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
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

function Index() {
  return (
    <GameProvider>
      <GameRouter />
    </GameProvider>
  );
}

function GameRouter() {
  const { state, isPartyHost, partyCode, isPartyConnected } = useGame();
  const pastLobby = useRef(false);

  // A non-host player who has joined a party will wait here until the host
  // starts the campaign (at which point state.gameStarted becomes true via sync).
  const isNonHostWaiting = partyCode && !isPartyHost && isPartyConnected && !state.gameStarted;

  if (state.gameStarted) return <GameScreen />;

  if (!pastLobby.current || isNonHostWaiting || (partyCode && !isPartyHost && !state.gameStarted)) {
    return <MultiplayerLobby onProceed={() => { pastLobby.current = true; }} />;
  }

  return <GameSetup />;
}
