import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Trophy, TrendingUp, DollarSign } from "lucide-react";
import { toast } from "sonner";

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
  profiles?: {
    email: string;
    full_name: string;
  };
}

export default function AdminBets() {
  const navigate = useNavigate();
  const [bets, setBets] = useState<GameBet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stats, setStats] = useState({
    totalBets: 0,
    totalBetAmount: 0,
    totalWinAmount: 0,
    profit: 0,
  });

  useEffect(() => {
    fetchBets();
  }, []);

  const fetchBets = async () => {
    setLoading(true);
    
    // Buscar apostas e usuários separadamente
    const { data: betsData, error: betsError } = await supabase
      .from("game_bets")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(200);

    if (betsError) {
      console.error(betsError);
      toast.error("Erro ao carregar apostas");
      setLoading(false);
      return;
    }

    // Buscar emails dos usuários
    const userIds = [...new Set(betsData.map(bet => bet.user_id))];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", userIds);

    // Fazer o join manual
    const betsWithProfiles = betsData.map(bet => ({
      ...bet,
      profiles: profilesData?.find(p => p.id === bet.user_id)
    }));

    setBets(betsWithProfiles);
    calculateStats(betsWithProfiles);
    setLoading(false);
  };

  const calculateStats = (bets: GameBet[]) => {
    const totalBets = bets.length;
    const totalBetAmount = bets.reduce((sum, bet) => sum + Number(bet.bet_amount), 0);
    const totalWinAmount = bets.reduce((sum, bet) => sum + Number(bet.win_amount || 0), 0);
    const profit = totalBetAmount - totalWinAmount;

    setStats({
      totalBets,
      totalBetAmount,
      totalWinAmount,
      profit,
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("pt-BR");
  };

  const filteredBets = bets.filter((bet) => {
    const matchesSearch = 
      bet.game_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bet.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bet.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || bet.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won': return 'text-green-500';
      case 'lost': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'won': return 'Ganhou';
      case 'lost': return 'Perdeu';
      default: return 'Jogando';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Apostas</h1>
          <p className="text-muted-foreground">Histórico completo e estatísticas de todas as apostas em tempo real</p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Total de Apostas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalBets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Apostado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">R$ {stats.totalBetAmount.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">R$ {stats.totalWinAmount.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Lucro Líquido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${stats.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              R$ {stats.profit.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por jogo, email ou nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="playing">Jogando</SelectItem>
            <SelectItem value="won">Ganhou</SelectItem>
            <SelectItem value="lost">Perdeu</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-8">Carregando apostas...</div>
      ) : (
        <div className="space-y-4">
          {filteredBets.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                Nenhuma aposta encontrada
              </CardContent>
            </Card>
          ) : (
            filteredBets.map((bet) => (
              <Card key={bet.id}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5" />
                        {bet.game_name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {bet.profiles?.full_name || "Usuário"} • {bet.profiles?.email}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className={`font-bold ${getStatusColor(bet.status)}`}>
                        {getStatusLabel(bet.status)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                      <p className="text-sm text-muted-foreground">Início</p>
                      <p className="text-sm">{formatDate(bet.started_at)}</p>
                    </div>
                    {bet.finished_at && (
                      <div>
                        <p className="text-sm text-muted-foreground">Fim</p>
                        <p className="text-sm">{formatDate(bet.finished_at)}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
