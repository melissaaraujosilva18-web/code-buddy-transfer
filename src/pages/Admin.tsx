import { AdminRoute } from "@/components/AdminRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function AdminContent() {
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, balance, has_deposited");

      if (profilesError) throw profilesError;

      const { data: transactions, error: transactionsError } = await supabase
        .from("transactions")
        .select("type, amount");

      if (transactionsError) throw transactionsError;

      const totalUsers = profiles?.length || 0;
      const totalDeposits = transactions
        ?.filter((t) => t.type === "deposit")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const totalWithdrawals = transactions
        ?.filter((t) => t.type === "withdrawal")
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0;
      const totalBalance = profiles?.reduce((sum, p) => sum + Number(p.balance), 0) || 0;

      return {
        totalUsers,
        totalDeposits,
        totalWithdrawals,
        totalBalance,
      };
    },
  });

  const { data: pendingWithdrawals } = useQuery({
    queryKey: ["pending-withdrawals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, withdrawal_amount, withdrawal_status, pix_key")
        .eq("withdrawal_status", "pending")
        .gt("withdrawal_amount", 0);

      if (error) throw error;
      return data;
    },
  });

  const handleApproveWithdrawal = async (userId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({
        withdrawal_status: "approved",
      })
      .eq("id", userId);

    if (error) {
      console.error("Error approving withdrawal:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Painel Administrativo</h1>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Carregando...</div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Total de Usuários</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats?.totalUsers}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Total Depositado</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-500">
                    R$ {stats?.totalDeposits.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Total Sacado</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-red-500">
                    R$ {stats?.totalWithdrawals.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Saldo Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">
                    R$ {stats?.totalBalance.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Saques Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingWithdrawals && pendingWithdrawals.length > 0 ? (
                  <div className="space-y-4">
                    {pendingWithdrawals.map((withdrawal) => (
                      <div
                        key={withdrawal.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-semibold">{withdrawal.full_name}</p>
                          <p className="text-sm text-muted-foreground">{withdrawal.email}</p>
                          <p className="text-sm text-muted-foreground">PIX: {withdrawal.pix_key}</p>
                        </div>
                        <div className="text-right space-y-2">
                          <p className="text-xl font-bold">
                            R$ {Number(withdrawal.withdrawal_amount).toFixed(2)}
                          </p>
                          <Button
                            onClick={() => handleApproveWithdrawal(withdrawal.id)}
                            size="sm"
                          >
                            Aprovar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum saque pendente
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Admin() {
  return (
    <AdminRoute>
      <AdminContent />
    </AdminRoute>
  );
}
