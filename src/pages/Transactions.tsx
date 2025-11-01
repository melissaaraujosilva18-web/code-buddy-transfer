import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown, Coins, Trophy, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
  status: string;
}

interface GameBet {
  id: string;
  game_name: string;
  bet_amount: number;
  win_amount: number;
  multiplier: number;
  status: string;
  started_at: string;
  finished_at: string | null;
}

export default function Transactions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bets, setBets] = useState<GameBet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [transactionsResult, betsResult] = await Promise.all([
        supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('game_bets')
          .select('*')
          .order('started_at', { ascending: false })
          .limit(50)
      ]);

      if (transactionsResult.data) setTransactions(transactionsResult.data);
      if (betsResult.data) setBets(betsResult.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'withdrawal':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'bet':
        return <Coins className="h-4 w-4 text-orange-500" />;
      case 'win':
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      default:
        return <Coins className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      pending: "secondary",
      failed: "destructive",
      playing: "secondary",
      won: "default",
      lost: "destructive",
      cancelled: "outline"
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {status === 'completed' && 'Concluído'}
        {status === 'pending' && 'Pendente'}
        {status === 'failed' && 'Falhou'}
        {status === 'playing' && 'Jogando'}
        {status === 'won' && 'Ganhou'}
        {status === 'lost' && 'Perdeu'}
        {status === 'cancelled' && 'Cancelado'}
      </Badge>
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Histórico</h1>
          <p className="text-muted-foreground">Suas transações e apostas</p>
        </div>
      </div>

      <Tabs defaultValue="bets" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bets">Apostas</TabsTrigger>
          <TabsTrigger value="transactions">Transações</TabsTrigger>
        </TabsList>

        <TabsContent value="bets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Apostas</CardTitle>
              <CardDescription>Suas apostas nos jogos PG Soft</CardDescription>
            </CardHeader>
            <CardContent>
              {bets.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma aposta encontrada
                </p>
              ) : (
                <div className="space-y-3">
                  {bets.map((bet) => (
                    <div
                      key={bet.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{bet.game_name}</p>
                          {getStatusBadge(bet.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(bet.started_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          Aposta: R$ {bet.bet_amount.toFixed(2)}
                        </p>
                        {bet.status === 'won' && (
                          <p className="text-sm text-green-500">
                            Ganho: R$ {bet.win_amount.toFixed(2)} ({bet.multiplier}x)
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Transações</CardTitle>
              <CardDescription>Depósitos, saques e movimentações</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma transação encontrada
                </p>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <p className="font-semibold">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(transaction.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.amount > 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}R$ {Math.abs(transaction.amount).toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Saldo: R$ {transaction.balance_after.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
