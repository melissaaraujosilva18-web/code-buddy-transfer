import { useEffect, useState } from "react";
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

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

      {/* Back Button */}
      <div className="fixed top-4 left-4 z-40">
        <Button
          onClick={() => navigate(-1)}
          size="icon"
          className="bg-primary hover:bg-primary/90 rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Game Iframe */}
      <iframe
        src={gameUrl}
        className="w-full h-full border-0"
        title={gameName}
        allow="autoplay; fullscreen; payment"
        allowFullScreen
      />
    </div>
  );
}