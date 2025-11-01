import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import vortexLogo from "@/assets/vortexbet-logo.png";

interface GamePlayerProps {
  gameUrl: string;
  gameName: string;
}

export default function GamePlayer({ gameUrl, gameName }: GamePlayerProps) {
  const navigate = useNavigate();
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
    }, 2500);

    return () => clearTimeout(fallbackTimer);
  }, [iframeLoaded]);

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
            Não foi possível carregar {gameName} dentro do app. Abra o jogo em nova aba ou nesta janela.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => window.open(gameUrl, '_blank', 'noopener,noreferrer')}
              className="rounded-full"
              variant="secondary"
              aria-label={`Abrir ${gameName} em nova aba`}
            >
              Abrir em nova aba
            </Button>
            <Button
              onClick={() => { window.location.href = gameUrl; }}
              className="rounded-full"
              aria-label={`Abrir ${gameName} nesta janela`}
              variant="default"
            >
              Abrir aqui
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
        <Button
          onClick={() => window.open(gameUrl, '_blank', 'noopener,noreferrer')}
          className="rounded-full"
          aria-label={`Abrir ${gameName} em nova aba`}
          variant="secondary"
        >
          Abrir em nova aba
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