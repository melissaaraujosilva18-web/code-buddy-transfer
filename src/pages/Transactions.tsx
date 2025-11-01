import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Transactions() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return "💰";
      case "withdrawal":
        return "💸";
      case "bet":
        return "🎰";
      case "win":
        return "🏆";
      default:
        return "📝";
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "deposit":
      case "win":
        return "text-green-500";
      case "withdrawal":
      case "bet":
        return "text-red-500";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Histórico de Transações</h1>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Carregando...</div>
        ) : transactions && transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <Card key={transaction.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getTransactionIcon(transaction.type)}</span>
                      <div>
                        <p className="font-semibold">{transaction.description || transaction.type}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(transaction.created_at), "dd 'de' MMMM 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${getTransactionColor(transaction.type)}`}>
                        {Number(transaction.amount) >= 0 ? "+" : ""}R$ {Math.abs(Number(transaction.amount)).toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Saldo: R$ {Number(transaction.balance_after).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Nenhuma transação encontrada</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
