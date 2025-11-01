import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminSettings() {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState("");
  const [operatorToken, setOperatorToken] = useState("");
  const [providerCode, setProviderCode] = useState("PS");
  const [rtp, setRtp] = useState("96");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("game_api_settings")
      .select("*")
      .single();

    if (error) {
      console.error("Error loading settings:", error);
    } else if (data) {
      setSettingsId(data.id);
      setApiKey(data.api_key || "");
      setOperatorToken(data.operator_token || "");
      setProviderCode(data.provider_code || "PS");
      setRtp(data.rtp?.toString() || "96");
    }
    setLoading(false);
  };

  const handleSaveSettings = async () => {
    if (!settingsId) {
      toast.error("Configurações não encontradas");
      return;
    }

    const { error } = await supabase
      .from("game_api_settings")
      .update({
        api_key: apiKey,
        operator_token: operatorToken,
        provider_code: providerCode,
        rtp: parseInt(rtp),
        updated_at: new Date().toISOString()
      })
      .eq("id", settingsId);

    if (error) {
      toast.error("Erro ao salvar configurações");
      console.error(error);
    } else {
      toast.success("Configurações salvas com sucesso!");
    }
  };

  const rtpInstructions = `-- Como configurar o RTP dos jogos PGSoft

-- O RTP (Return to Player) é a porcentagem média que o jogo retorna aos jogadores.
-- Quanto maior o RTP, mais os jogadores ganham de volta ao longo do tempo.

-- Opções de RTP disponíveis:
-- 85% - Lucro máximo para a casa (15% de margem)
-- 90% - Lucro alto para a casa (10% de margem)
-- 92% - Lucro médio-alto (8% de margem)
-- 94% - Lucro médio (6% de margem)
-- 96% - RTP padrão recomendado (4% de margem) ✅ RECOMENDADO
-- 97% - RTP alto (3% de margem)
-- 98% - RTP muito alto (2% de margem)
-- 99% - RTP máximo (1% de margem)

-- IMPORTANTE: 
-- O RTP deve ser configurado diretamente na API da PGSoft
-- através do operador token e provider code.

-- Exemplo de como usar:
-- 1. Configure as credenciais da API acima
-- 2. Defina o RTP desejado (recomendado: 96%)
-- 3. Salve as configurações
-- 4. O RTP será aplicado automaticamente aos jogos

-- ⚠️ AVISO DE SEGURANÇA:
-- - Mantenha suas credenciais seguras
-- - Não compartilhe seu API Key e Operator Token
-- - Monitore as apostas regularmente
-- - Configure RLS (Row Level Security) adequadamente
-- - Faça backup das configurações regularmente`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(rtpInstructions);
    setCopied(true);
    toast.success("Instruções copiadas!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">Carregando configurações...</div>
      </div>
    );
  }

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

      <Alert className="border-yellow-500/50 bg-yellow-500/10">
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
        <AlertDescription>
          <strong>Atenção:</strong> As credenciais da API são sensíveis. Mantenha-as seguras e não compartilhe com terceiros.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Credenciais da API PGSOFT</CardTitle>
            <CardDescription>
              Configure as credenciais de acesso à API PGSOFT.
              <br />
              <a 
                href="https://github.com/mrdamaia/Api-PGSOFT" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm"
              >
                📖 Ver documentação da API no GitHub
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key *</Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Digite a API Key"
              />
              <p className="text-xs text-muted-foreground">
                Chave de autenticação fornecida pela PGSoft
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="operator-token">Operator Token *</Label>
              <Input
                id="operator-token"
                type="password"
                value={operatorToken}
                onChange={(e) => setOperatorToken(e.target.value)}
                placeholder="Digite o Operator Token"
              />
              <p className="text-xs text-muted-foreground">
                Token do operador para integração com a plataforma
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider-code">Provider Code</Label>
              <Input
                id="provider-code"
                value={providerCode}
                onChange={(e) => setProviderCode(e.target.value)}
                placeholder="PS"
              />
              <p className="text-xs text-muted-foreground">
                Código do provedor (padrão: PS para PGSoft)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuração de RTP (Return to Player)</CardTitle>
            <CardDescription>
              Ajuste a porcentagem de retorno aos jogadores. O RTP determina quanto do total apostado é devolvido aos jogadores ao longo do tempo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rtp">RTP (%) *</Label>
              <Input
                id="rtp"
                type="number"
                min="85"
                max="99"
                value={rtp}
                onChange={(e) => setRtp(e.target.value)}
                placeholder="96"
              />
              <div className="text-sm space-y-1 text-muted-foreground">
                <p>• <strong>85-92%</strong>: Lucro alto para a casa (mais margem)</p>
                <p>• <strong>96%</strong>: RTP padrão recomendado ✅ (4% de margem)</p>
                <p>• <strong>97-99%</strong>: RTP alto (menos margem, mais ganhos aos jogadores)</p>
              </div>
            </div>

            <Alert>
              <AlertDescription>
                <strong>Nota:</strong> Um RTP de 96% significa que, em média, para cada R$ 100 apostados, 
                R$ 96 são devolvidos aos jogadores e R$ 4 ficam como lucro da casa.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>URLs dos Webhooks</CardTitle>
            <CardDescription>
              Configure estas URLs na plataforma PGSoft para integração automática
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Webhook PGSoft (Apostas e Ganhos)</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value="https://ryuexvaocxzqpfcekejh.supabase.co/functions/v1/pgsoft-webhook"
                  className="font-mono text-xs"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText("https://ryuexvaocxzqpfcekejh.supabase.co/functions/v1/pgsoft-webhook");
                    toast.success("URL copiada!");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                URL para receber callbacks de apostas, ganhos e rollbacks
              </p>
            </div>

            <div className="space-y-2">
              <Label>Webhook Oasyfy (Depósitos PIX)</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value="https://ryuexvaocxzqpfcekejh.supabase.co/functions/v1/oasyfy-webhook"
                  className="font-mono text-xs"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText("https://ryuexvaocxzqpfcekejh.supabase.co/functions/v1/oasyfy-webhook");
                    toast.success("URL copiada!");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                URL para confirmação de depósitos via PIX
              </p>
            </div>

            <div className="space-y-2">
              <Label>Webhook Taxa Administrativa</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value="https://ryuexvaocxzqpfcekejh.supabase.co/functions/v1/admin-fee-webhook"
                  className="font-mono text-xs"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText("https://ryuexvaocxzqpfcekejh.supabase.co/functions/v1/admin-fee-webhook");
                    toast.success("URL copiada!");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                URL para confirmação de pagamento da taxa de saque (10%)
              </p>
            </div>

            <Alert>
              <AlertDescription>
                <strong>Como configurar na Oasyfy:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Acesse o painel da Oasyfy</li>
                  <li>Vá em Configurações → Webhooks</li>
                  <li>Cole as URLs acima nos campos correspondentes</li>
                  <li>Salve as configurações</li>
                </ol>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Instruções SQL Detalhadas</span>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </>
                )}
              </Button>
            </CardTitle>
            <CardDescription>
              Comandos e explicações sobre como funciona o RTP
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              readOnly
              value={rtpInstructions}
              className="font-mono text-xs min-h-[400px] bg-muted"
            />
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button 
            onClick={handleSaveSettings} 
            className="flex-1"
            disabled={!apiKey || !operatorToken}
          >
            Salvar Configurações
          </Button>
        </div>

        <Alert className="border-red-500/50 bg-red-500/10">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription>
            <strong>⚠️ Avisos de Segurança:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Nunca compartilhe suas credenciais da API</li>
              <li>Monitore as transações e apostas regularmente</li>
              <li>Configure alertas para atividades suspeitas</li>
              <li>Faça backup das configurações periodicamente</li>
              <li>Mantenha as políticas RLS (Row Level Security) ativas</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
