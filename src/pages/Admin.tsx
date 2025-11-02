import { AdminRoute } from "@/components/AdminRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, DollarSign, TrendingDown, Wallet, Trophy, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function AdminContent() {
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, balance, has_deposited");

      const { data: transactions } = await supabase
        .from("transactions")
        .select("type, amount");

      const { data: bets } = await supabase
        .from("game_bets")
        .select("bet_amount, win_amount, status");

      const totalUsers = profiles?.length || 0;
      const totalDeposits = transactions
        ?.filter((t) => t.type === "deposit")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const totalWithdrawals = transactions
        ?.filter((t) => t.type === "withdrawal")
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0;
      const totalBalance = profiles?.reduce((sum, p) => sum + Number(p.balance), 0) || 0;
      const totalBets = bets?.reduce((sum, b) => sum + Number(b.bet_amount), 0) || 0;
      const totalPaid = bets?.reduce((sum, b) => sum + Number(b.win_amount || 0), 0) || 0;

      return {
        totalUsers,
        totalDeposits,
        totalWithdrawals,
        totalBalance,
        totalBets,
        totalPaid,
        profit: totalBets - totalPaid,
      };
    },
  });

  const adminSections = [
    {
      title: "Gerenciar Usuários",
      description: "Ver, editar, bloquear usuários e gerenciar saldos",
      icon: Users,
      path: "/admin/users",
      color: "text-blue-500",
    },
    {
      title: "Gerenciar Apostas",
      description: "Ver todas as apostas, filtrar por status e buscar",
      icon: Trophy,
      path: "/admin/bets",
      color: "text-purple-500",
    },
    {
      title: "Transações",
      description: "Histórico completo de depósitos e saques",
      icon: DollarSign,
      path: "/admin/transactions",
      color: "text-green-500",
    },
    {
      title: "Gerenciar Provedores",
      description: "Cadastrar e gerenciar provedores de jogos",
      icon: Settings,
      path: "/admin/providers",
      color: "text-cyan-500",
    },
    {
      title: "Gerenciar Jogos",
      description: "Cadastrar e gerenciar catálogo de jogos",
      icon: Trophy,
      path: "/admin/games",
      color: "text-pink-500",
    },
    {
      title: "Configurações da API",
      description: "Configurar credenciais e RTP dos jogos",
      icon: Settings,
      path: "/admin/settings",
      color: "text-orange-500",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Painel Administrativo</h1>
            <p className="text-sm text-muted-foreground">Controle total da plataforma</p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Carregando...</div>
        ) : (
          <div className="space-y-6">
            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Total de Usuários
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats?.totalUsers}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Total Depositado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-500">
                    R$ {stats?.totalDeposits.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    Total Sacado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-red-500">
                    R$ {stats?.totalWithdrawals.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Saldo Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">
                    R$ {stats?.totalBalance.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Total Apostado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-500">
                    R$ {stats?.totalBets.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    Total Pago
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-orange-500">
                    R$ {stats?.totalPaid.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Lucro Líquido
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-3xl font-bold ${(stats?.profit || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    R$ {stats?.profit.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Seções de Admin */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adminSections.map((section) => (
                <Card key={section.path} className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate(section.path)}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg bg-muted flex items-center justify-center ${section.color}`}>
                        <section.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{section.title}</CardTitle>
                        <CardDescription className="text-xs">{section.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
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
