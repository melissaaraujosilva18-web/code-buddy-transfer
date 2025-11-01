import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettings() {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState("");
  const [operatorToken, setOperatorToken] = useState("");
  const [providerCode, setProviderCode] = useState("PS");
  const [rtp, setRtp] = useState("96");

  const handleSaveSettings = async () => {
    // Here you would save the settings to your database or configuration
    toast.success("Configurações salvas com sucesso");
  };

  const handleTestConnection = async () => {
    // Here you would test the connection to the PGSOFT API
    toast.info("Testando conexão com a API...");
    
    setTimeout(() => {
      toast.success("Conexão estabelecida com sucesso!");
    }, 2000);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Configurações da API</h1>
          <p className="text-muted-foreground">Gerenciar conexão e RTP da API PGSOFT</p>
        </div>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Credenciais da API</CardTitle>
            <CardDescription>Configure as credenciais de acesso à API PGSOFT</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Digite a API Key"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="operator-token">Operator Token</Label>
              <Input
                id="operator-token"
                type="password"
                value={operatorToken}
                onChange={(e) => setOperatorToken(e.target.value)}
                placeholder="Digite o Operator Token"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider-code">Provider Code</Label>
              <Input
                id="provider-code"
                value={providerCode}
                onChange={(e) => setProviderCode(e.target.value)}
                placeholder="PS"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configurações de RTP</CardTitle>
            <CardDescription>Ajuste o RTP (Return to Player) dos jogos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rtp">RTP (%)</Label>
              <Input
                id="rtp"
                type="number"
                min="85"
                max="99"
                value={rtp}
                onChange={(e) => setRtp(e.target.value)}
                placeholder="96"
              />
              <p className="text-sm text-muted-foreground">
                Valor entre 85% e 99%. RTP padrão recomendado: 96%
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button onClick={handleTestConnection} variant="outline" className="flex-1">
            Testar Conexão
          </Button>
          <Button onClick={handleSaveSettings} className="flex-1">
            Salvar Configurações
          </Button>
        </div>
      </div>
    </div>
  );
}
