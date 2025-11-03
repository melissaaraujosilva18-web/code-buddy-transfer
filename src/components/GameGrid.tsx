import { Card } from "@/components/ui/card";
import { Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import fortuneTiger from "@/assets/games/fortune-tiger.png";
import dragonTiger from "@/assets/games/dragon-tiger.jpg";
import doubleFortune from "@/assets/games/double-fortune.png";
import ganeshaGold from "@/assets/games/ganesha-gold.png";
import jungleDelight from "@/assets/games/jungle-delight.jpg";
import cashMania from "@/assets/games/cash-mania.jpg";
import bikiniParadise from "@/assets/games/bikini-paradise.jpg";
import fortuneRabbit from "@/assets/games/fortune-rabbit.jpg";
import fortuneOx from "@/assets/games/fortune-ox.jpg";
import fortuneMouse from "@/assets/games/fortune-mouse.jpg";
import fortuneDragon from "@/assets/games/fortune-dragon.jpg";

interface Game {
  id: number;
  title: string;
  image: string;
  provider: string;
  gameCode: string;
  hot?: boolean;
}

const pgSoftGames: Game[] = [
  { id: 1, title: "Fortune Tiger", image: fortuneTiger, provider: "PG Soft", gameCode: "fortune-tiger", hot: true },
  { id: 2, title: "Fortune Ox", image: fortuneOx, provider: "PG Soft", gameCode: "fortune-ox", hot: true },
  { id: 3, title: "Fortune Mouse", image: fortuneMouse, provider: "PG Soft", gameCode: "fortune-mouse", hot: true },
  { id: 4, title: "Fortune Dragon", image: fortuneDragon, provider: "PG Soft", gameCode: "fortune-dragon", hot: true },
  { id: 5, title: "Fortune Rabbit", image: fortuneRabbit, provider: "PG Soft", gameCode: "fortune-rabbit", hot: true },
  { id: 6, title: "Bikini Paradise", image: bikiniParadise, provider: "PG Soft", gameCode: "bikini-paradise" },
  { id: 7, title: "Double Fortune", image: doubleFortune, provider: "PG Soft", gameCode: "double-fortune", hot: true },
  { id: 8, title: "Ganesha Gold", image: ganeshaGold, provider: "PG Soft", gameCode: "ganesha-gold", hot: true },
  { id: 9, title: "Dragon Tiger Luck", image: dragonTiger, provider: "PG Soft", gameCode: "dragon-tiger-luck", hot: true },
  { id: 10, title: "Jungle Delight", image: jungleDelight, provider: "PG Soft", gameCode: "jungle-delight" },
];

export function GameGrid() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGameClick = (game: Game) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    navigate(`/jogo/${game.gameCode}`, {
      state: {
        gameName: game.title,
        gameImage: game.image
      }
    });
  };

  return (
    <div className="space-y-2 sm:space-y-4 md:space-y-6">
      <div className="flex items-center gap-2">
        <Flame className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Populares - PG Soft</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
        {pgSoftGames.map((game) => (
          <Card
            key={game.id}
            onClick={() => handleGameClick(game)}
            className="group relative overflow-hidden border-0 bg-card cursor-pointer transition-all md:hover:scale-105 hover:shadow-[0_0_20px_hsl(var(--neon-green-glow)/0.3)]"
          >
            {game.hot && (
              <div className="absolute top-2 right-2 z-10 bg-destructive text-destructive-foreground px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                <Flame className="h-3 w-3" />
                HOT
              </div>
            )}

            <div className="aspect-[4/3] overflow-hidden">
              <img
                src={game.image}
                alt={game.title}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform md:group-hover:scale-110"
              />
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 sm:p-3 md:p-4">
              <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-foreground">{game.title}</h3>
              <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">{game.provider}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}