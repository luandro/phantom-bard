import { createFileRoute } from "@tanstack/react-router";
import { GameProvider, useGame } from "@/hooks/use-game";
import { GameSetup } from "@/components/GameSetup";
import { GameScreen } from "@/components/GameScreen";

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
  const { state } = useGame();
  return state.gameStarted ? <GameScreen /> : <GameSetup />;
}
