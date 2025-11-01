import { useParams } from "react-router-dom";
import GamePlayer from "@/components/GamePlayer";

export default function GamePlay() {
  const { gameCode } = useParams<{ gameCode: string }>();

  // Mock game URL - replace with actual game provider integration
  const gameUrl = `https://demo.pragmaticplay.net/gs2c/openGame.do?gameSymbol=${gameCode}&websiteUrl=https://www.vortexbet.com&jurisdiction=99&lobby_url=https://www.vortexbet.com&lang=pt_BR`;
  const gameName = gameCode?.replace(/-/g, " ").toUpperCase() || "Game";

  return <GamePlayer gameUrl={gameUrl} gameName={gameName} />;
}
