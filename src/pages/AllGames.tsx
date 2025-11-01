import { GameGrid } from "@/components/GameGrid";
import { CategoryTabs } from "@/components/CategoryTabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AllGames() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">Todos os Jogos</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <CategoryTabs />
        <GameGrid />
      </main>
    </div>
  );
}
