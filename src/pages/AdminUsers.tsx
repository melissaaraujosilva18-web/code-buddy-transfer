import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, User, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  balance: number;
  blocked: boolean;
  created_at: string;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar usuários");
      console.error(error);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const handleToggleBlock = async (userId: string, currentBlocked: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ blocked: !currentBlocked })
      .eq("id", userId);

    if (error) {
      toast.error("Erro ao atualizar usuário");
    } else {
      toast.success(currentBlocked ? "Usuário desbloqueado" : "Usuário bloqueado");
      fetchUsers();
    }
  };

  const handleAddBalance = async (userId: string) => {
    const amount = prompt("Digite o valor a adicionar:");
    if (!amount || isNaN(Number(amount))) return;

    const user = users.find(u => u.id === userId);
    if (!user) return;

    const newBalance = Number(user.balance) + Number(amount);

    const { error } = await supabase
      .from("profiles")
      .update({ balance: newBalance })
      .eq("id", userId);

    if (error) {
      toast.error("Erro ao adicionar saldo");
    } else {
      toast.success("Saldo adicionado com sucesso");
      fetchUsers();
    }
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Usuários</h1>
          <p className="text-muted-foreground">Ver e gerenciar todos os usuários</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar por email ou nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : (
        <div className="grid gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{user.full_name || "Sem nome"}</CardTitle>
                      <CardDescription>{user.email}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-4">
                      <p className="text-sm text-muted-foreground">Saldo</p>
                      <p className="text-lg font-bold">R$ {Number(user.balance).toFixed(2)}</p>
                    </div>
                    {user.blocked && (
                      <span className="px-2 py-1 bg-destructive/20 text-destructive rounded text-xs">
                        Bloqueado
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddBalance(user.id)}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Adicionar Saldo
                  </Button>
                  <Button
                    variant={user.blocked ? "default" : "destructive"}
                    size="sm"
                    onClick={() => handleToggleBlock(user.id, user.blocked)}
                  >
                    {user.blocked ? "Desbloquear" : "Bloquear"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
