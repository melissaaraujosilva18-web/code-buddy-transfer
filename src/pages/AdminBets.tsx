import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, Trophy } from "lucide-react";

interface GameBet {
  id: string;
  game_name: string;
  bet_amount: number;
  win_amount: number;
  multiplier: number;
  status: string;
  started_at: string;
  finished_at: string | null;
  user_id: string;
}

export default function AdminBets() {
  const navigate = useNavigate();
  const [bets, setBets] = useState<GameBet[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBets: 0,
    totalBetAmount: 0,
    totalWinAmount: 0,
  });

  useEffect(() => {
    fetchBets();
  }, []);

  const fetchBets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("game_bets")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error(error);
    } else {
      setBets(data || []);
      calculateStats(data || []);
    }
    setLoading(false);
  };

  const calculateStats = (bets: GameBet[]) => {
    const totalBets = bets.length;
    const totalBetAmount = bets.reduce((sum, bet) => sum + Number(bet.bet_amount), 0);
    const totalWinAmount = bets.reduce((sum, bet) => sum + Number(bet.win_amount || 0), 0);

    setStats({
      totalBets,
      totalBetAmount,
      totalWinAmount,
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("pt-BR");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Apostas</h1>
          <p className="text-muted-foreground">Histórico e estatísticas de todas as apostas</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total de Apostas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalBets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Apostado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">R$ {stats.totalBetAmount.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Ganho</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">R$ {stats.totalWinAmount.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : (
        <div className="space-y-4">
          {bets.map((bet) => (
            <Card key={bet.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      {bet.game_name}
                    </CardTitle>
                    <CardDescription>
                      ID: {bet.user_id.slice(0, 8)}...
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className={`font-bold ${
                      bet.status === 'won' ? 'text-green-500' :
                      bet.status === 'lost' ? 'text-red-500' :
                      'text-yellow-500'
                    }`}>
                      {bet.status === 'won' ? 'Ganhou' :
                       bet.status === 'lost' ? 'Perdeu' :
                       'Jogando'}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Aposta</p>
                    <p className="font-bold">R$ {Number(bet.bet_amount).toFixed(2)}</p>
                  </div>
                  {bet.status === 'won' && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">Ganho</p>
                        <p className="font-bold text-green-500">R$ {Number(bet.win_amount).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Multiplicador</p>
                        <p className="font-bold">{Number(bet.multiplier).toFixed(2)}x</p>
                      </div>
                    </>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Data</p>
                    <p className="text-sm">{formatDate(bet.started_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
