import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
  status: string;
  user_id: string;
}

export default function AdminTransactions() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error(error);
    } else {
      setTransactions(data || []);
    }
    setLoading(false);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("pt-BR");
  };

  const getTransactionIcon = (type: string) => {
    return type === 'deposit' || type === 'win' ? 
      <TrendingUp className="h-5 w-5 text-green-500" /> :
      <TrendingDown className="h-5 w-5 text-red-500" />;
  };

  const getTransactionColor = (type: string) => {
    return type === 'deposit' || type === 'win' ? 'text-green-500' : 'text-red-500';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Transações</h1>
          <p className="text-muted-foreground">Histórico completo de depósitos e saques</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <Card key={transaction.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <CardTitle>{transaction.description}</CardTitle>
                      <CardDescription>
                        ID: {transaction.user_id.slice(0, 8)}...
                      </CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${getTransactionColor(transaction.type)}`}>
                      {transaction.amount > 0 ? '+' : ''}R$ {Math.abs(transaction.amount).toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Saldo: R$ {Number(transaction.balance_after).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{formatDate(transaction.created_at)}</span>
                  <span className={`px-2 py-1 rounded ${
                    transaction.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                    transaction.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                    'bg-red-500/20 text-red-500'
                  }`}>
                    {transaction.status === 'completed' ? 'Concluído' :
                     transaction.status === 'pending' ? 'Pendente' :
                     'Falhou'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
