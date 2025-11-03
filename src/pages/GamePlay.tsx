import { useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import GamePlayer from "@/components/GamePlayer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function GamePlay() {
  const { gameCode } = useParams<{ gameCode: string }>();
  const location = useLocation();
  const { user } = useAuth();
  const [gameUrl, setGameUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  
  const gameName = location.state?.gameName || gameCode?.replace(/-/g, " ").toUpperCase() || "Game";
  const gameImage = location.state?.gameImage;

  useEffect(() => {
    const loadGame = async () => {
      if (!user || !gameCode) {
        return;
      }

      try {
        setLoading(true);
        console.log('Carregando jogo:', { gameCode, userId: user.id });

        const { data, error } = await supabase.functions.invoke('pgsoft-get-game-url', {
          body: {
            gameCode,
            userId: user.id
          }
        });

        if (error) {
          console.error('Erro ao carregar jogo:', error);
          throw error;
        }

        if (data?.gameUrl) {
          console.log('URL do jogo obtida com sucesso');
          setGameUrl(data.gameUrl);
        } else {
          throw new Error('URL do jogo não encontrada');
        }
      } catch (error: any) {
        console.error('Erro ao carregar jogo:', error);
        toast.error(error.message || 'Erro ao carregar jogo. Verifique as configurações da API.');
      } finally {
        setLoading(false);
      }
    };

    loadGame();
  }, [gameCode, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-lg">Carregando {gameName}...</p>
        </div>
      </div>
    );
  }

  if (!gameUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-lg text-destructive">Erro ao carregar o jogo</p>
          <p className="text-sm text-muted-foreground">Verifique as configurações da API no painel Admin</p>
        </div>
      </div>
    );
  }

  return <GamePlayer gameUrl={gameUrl} gameName={gameName} />;
}
