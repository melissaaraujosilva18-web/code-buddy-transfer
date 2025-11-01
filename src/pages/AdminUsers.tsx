import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, User, DollarSign, Mail, Lock, Shield } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

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
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [balanceAmount, setBalanceAmount] = useState("");

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

  const handleUpdateEmail = async () => {
    if (!editingUser || !newEmail) return;

    try {
      const { error } = await supabase.functions.invoke('admin-update-user', {
        body: {
          userId: editingUser.id,
          email: newEmail
        }
      });

      if (error) throw error;

      toast.success("Email atualizado com sucesso");
      setEditingUser(null);
      setNewEmail("");
      fetchUsers();
    } catch (error: any) {
      toast.error("Erro ao atualizar email: " + error.message);
    }
  };

  const handleUpdatePassword = async () => {
    if (!editingUser || !newPassword) return;

    try {
      const { error } = await supabase.functions.invoke('admin-update-user', {
        body: {
          userId: editingUser.id,
          password: newPassword
        }
      });

      if (error) throw error;

      toast.success("Senha atualizada com sucesso");
      setEditingUser(null);
      setNewPassword("");
    } catch (error: any) {
      toast.error("Erro ao atualizar senha: " + error.message);
    }
  };

  const handleAddBalance = async () => {
    if (!editingUser || !balanceAmount) return;

    const amount = Number(balanceAmount);
    if (isNaN(amount)) {
      toast.error("Digite um valor válido");
      return;
    }

    const newBalance = Number(editingUser.balance) + amount;

    const { error } = await supabase
      .from("profiles")
      .update({ balance: newBalance })
      .eq("id", editingUser.id);

    if (error) {
      toast.error("Erro ao adicionar saldo");
    } else {
      toast.success(`${amount >= 0 ? 'Saldo adicionado' : 'Saldo removido'} com sucesso`);
      setEditingUser(null);
      setBalanceAmount("");
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
          <p className="text-muted-foreground">Ver e gerenciar todos os usuários do sistema</p>
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
                      <CardTitle className="flex items-center gap-2">
                        {user.full_name || "Sem nome"}
                        {user.blocked ? (
                          <Badge variant="destructive">Bloqueado</Badge>
                        ) : (
                          <Badge variant="default">Ativo</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{user.email}</CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Saldo</p>
                    <p className="text-lg font-bold">R$ {Number(user.balance).toFixed(2)}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingUser(user);
                      setBalanceAmount("");
                    }}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Gerenciar Saldo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingUser(user);
                      setNewEmail(user.email);
                    }}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Trocar Email
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingUser(user);
                      setNewPassword("");
                    }}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Trocar Senha
                  </Button>
                  <Button
                    variant={user.blocked ? "default" : "destructive"}
                    size="sm"
                    onClick={() => handleToggleBlock(user.id, user.blocked)}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    {user.blocked ? "Desbloquear" : "Bloquear"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para gerenciar saldo */}
      <Dialog open={editingUser !== null && balanceAmount !== undefined} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerenciar Saldo</DialogTitle>
            <DialogDescription>
              Adicione ou remova saldo do usuário {editingUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Saldo Atual</Label>
              <p className="text-2xl font-bold">R$ {editingUser?.balance.toFixed(2)}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="balance">Valor (use - para remover)</Label>
              <Input
                id="balance"
                type="number"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
                placeholder="Ex: 100 ou -50"
              />
            </div>
            <Button onClick={handleAddBalance} className="w-full">
              Atualizar Saldo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para trocar email */}
      <Dialog open={editingUser !== null && newEmail !== undefined && balanceAmount === undefined} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trocar Email</DialogTitle>
            <DialogDescription>
              Alterar o email do usuário {editingUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Novo Email</Label>
              <Input
                id="email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="novo@email.com"
              />
            </div>
            <Button onClick={handleUpdateEmail} className="w-full">
              Atualizar Email
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para trocar senha */}
      <Dialog open={editingUser !== null && newPassword !== undefined && newEmail === undefined} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trocar Senha</DialogTitle>
            <DialogDescription>
              Definir uma nova senha para {editingUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <Input
                id="password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite a nova senha"
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres</p>
            </div>
            <Button onClick={handleUpdatePassword} className="w-full">
              Atualizar Senha
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
