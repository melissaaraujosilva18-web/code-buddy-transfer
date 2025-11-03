import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import vortexLogo from "@/assets/vortexbet-logo.png";

interface GamePlayerProps {
  gameUrl: string;
  gameName: string;
}

export default function GamePlayer({ gameUrl, gameName }: GamePlayerProps) {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // If the iframe doesn't load within the timeout, show fallback
    const fallbackTimer = setTimeout(() => {
      if (!iframeLoaded) {
        setBlocked(true);
        setLoading(false);
      }
    }, 12000);

    return () => clearTimeout(fallbackTimer);
  }, [iframeLoaded]);

  // Atualizar saldo quando o usuário retorna à página
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshProfile();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshProfile]);

  return (
    <div className="fixed inset-0 bg-black">
      {/* Preloader */}
      {loading && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center gap-4">
          <img
            src={vortexLogo}
            alt="Vortexbet"
            className="w-64 max-w-[80vw] animate-pulse"
          />
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-white text-sm">Carregando {gameName}...</p>
        </div>
      )}

      {/* Fallback overlay when iframe is blocked */}
      {!loading && blocked && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-background/90 p-6 text-center">
          <p className="text-foreground text-sm max-w-md">
            Conexão lenta ao carregar {gameName}. Deseja tentar novamente?
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (iframeRef.current) {
                  iframeRef.current.setAttribute('src', gameUrl);
                  setLoading(true);
                  setBlocked(false);
                }
              }}
              className="rounded-full"
              aria-label={`Recarregar ${gameName}`}
            >
              Tentar novamente
            </Button>
          </div>
        </div>
      )}

      {/* Back & Open in New Tab Buttons */}
      <div className="fixed top-4 left-4 z-40 flex gap-2">
        <Button
          onClick={() => navigate(-1)}
          size="icon"
          className="bg-primary hover:bg-primary/90 rounded-full"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Game Iframe */}
      <iframe
        ref={iframeRef}
        src={gameUrl}
        className="w-full h-full border-0"
        title={gameName}
        allow="autoplay; fullscreen; payment"
        allowFullScreen
        onLoad={() => { setIframeLoaded(true); setLoading(false); }}
        onError={() => { setBlocked(true); setLoading(false); }}
      />
    </div>
  );
}