import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Profile() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [pixKey, setPixKey] = useState(profile?.pix_key || "");
  const [pixKeyType, setPixKeyType] = useState<string>(profile?.pix_key_type || "cpf");
  const [pixName, setPixName] = useState(profile?.pix_name || "");
  const [loading, setLoading] = useState(false);

  const handleSavePixData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          pix_key: pixKey,
          pix_key_type: pixKeyType,
          pix_name: pixName,
        })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Dados PIX atualizados com sucesso!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Meu Perfil</h1>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Conta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nome</Label>
                <p className="text-lg">{profile.full_name || "Não informado"}</p>
              </div>
              <div>
                <Label>Email</Label>
                <p className="text-lg">{profile.email}</p>
              </div>
              <div>
                <Label>Saldo</Label>
                <p className="text-2xl font-bold text-primary">
                  R$ {Number(profile.balance).toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dados PIX</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="pix-name">Nome do Titular</Label>
                <Input
                  id="pix-name"
                  value={pixName}
                  onChange={(e) => setPixName(e.target.value)}
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <Label htmlFor="pix-type">Tipo de Chave</Label>
                <select
                  id="pix-type"
                  value={pixKeyType}
                  onChange={(e) => setPixKeyType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                  <option value="email">Email</option>
                  <option value="phone">Telefone</option>
                  <option value="random">Chave Aleatória</option>
                </select>
              </div>
              <div>
                <Label htmlFor="pix-key">Chave PIX</Label>
                <Input
                  id="pix-key"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder="Sua chave PIX"
                />
              </div>
              <Button onClick={handleSavePixData} disabled={loading} className="w-full">
                Salvar Dados PIX
              </Button>
            </CardContent>
          </Card>

          <Button
            onClick={handleSignOut}
            variant="destructive"
            className="w-full"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair da Conta
          </Button>
        </div>
      </div>
    </div>
  );
}
