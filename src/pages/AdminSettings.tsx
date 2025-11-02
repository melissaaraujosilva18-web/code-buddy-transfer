import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Check, AlertTriangle, Database, Settings, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminSettings() {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState("");
  const [operatorToken, setOperatorToken] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [providerCode, setProviderCode] = useState("PS");
  const [rtp, setRtp] = useState("96");
  const [callbackUrl, setCallbackUrl] = useState("");
  const [winProbability, setWinProbability] = useState("2");
  const [bonusProbability, setBonusProbability] = useState("2");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [showGenerated, setShowGenerated] = useState(false);

  // Função para gerar valores aleatórios seguros
  const generateSecureToken = (length: number = 32) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleGenerateCredentials = () => {
    const newAgentToken = generateSecureToken(40);
    const newSecretKey = generateSecureToken(40);
    const newAgentCode = `VORTEX${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    
    setOperatorToken(newAgentToken);
    setSecretKey(newSecretKey);
    setProviderCode(newAgentCode);
    setShowGenerated(true);
    
    toast.success("Credenciais geradas! Agora configure a URL da API e salve.");
  };

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
      setSecretKey(data.secret_key || "");
      setProviderCode(data.provider_code || "PS");
      setRtp(data.rtp?.toString() || "96");
      setCallbackUrl(data.callback_url || "");
      setWinProbability(data.win_probability?.toString() || "2");
      setBonusProbability(data.bonus_probability?.toString() || "2");
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
        secret_key: secretKey,
        provider_code: providerCode,
        rtp: parseInt(rtp),
        callback_url: callbackUrl,
        win_probability: parseInt(winProbability),
        bonus_probability: parseInt(bonusProbability),
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

  const getCallbackUrl = () => {
    return "https://ryuexvaocxzqpfcekejh.supabase.co/functions/v1/game-api-callback";
  };

  const getMySQLUpdateSQL = () => {
    return `UPDATE agents 
SET 
  callbackurl = '${getCallbackUrl()}',
  probganho = '${winProbability}',
  probbonus = '${bonusProbability}'
WHERE id = 1;`;
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

      <Card className="border-2 border-green-500 bg-green-50 dark:bg-green-950">
        <CardHeader>
          <CardTitle className="text-green-700 dark:text-green-300 flex items-center gap-2">
            🎲 Gerar Credenciais Automaticamente
          </CardTitle>
          <CardDescription className="text-green-600 dark:text-green-400">
            Não tem os tokens e keys? Clique aqui para gerar automaticamente!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleGenerateCredentials}
            className="w-full h-14 text-lg font-bold"
            variant="default"
          >
            ✨ Gerar Tokens e Keys Agora
          </Button>

          {showGenerated && (
            <Alert className="bg-yellow-50 dark:bg-yellow-950 border-yellow-500">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <AlertDescription className="space-y-3">
                <p className="font-bold text-yellow-900 dark:text-yellow-100">
                  🎉 Credenciais geradas com sucesso!
                </p>
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-yellow-900 dark:text-yellow-100">📋 Próximos passos:</p>
                  <ol className="list-decimal list-inside space-y-1 text-yellow-800 dark:text-yellow-200">
                    <li>Preencha apenas a <strong>URL da API</strong> abaixo (ex: http://204.216.174.232:888)</li>
                    <li>Clique em <strong>"Salvar Configurações"</strong></li>
                    <li>Copie o <strong>SQL do card azul</strong> no topo e execute no MySQL</li>
                    <li>Pronto! Os jogos funcionarão 🎮</li>
                  </ol>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Instruções MySQL em Destaque */}
      <Card className="border-blue-500 bg-blue-50/50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <Database className="h-5 w-5" />
            📋 Passo a Passo: Configuração no MySQL (phpMyAdmin)
          </CardTitle>
          <CardDescription className="text-blue-600 dark:text-blue-300">
            Após salvar as configurações abaixo, atualize sua tabela <code className="bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded">agents</code> no MySQL
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
                <Label className="text-base font-semibold">Acesse o phpMyAdmin</Label>
              </div>
              <p className="text-sm text-muted-foreground ml-8">
                Navegue até: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">pgsoftvortex</code> → <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">agents</code>
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
                <Label className="text-base font-semibold">Edite o registro (ou execute SQL)</Label>
              </div>
              <div className="ml-8 space-y-2">
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-x-auto">
                  <pre>{getMySQLUpdateSQL()}</pre>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(getMySQLUpdateSQL());
                    toast.success("SQL copiado para área de transferência!");
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar SQL Completo
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
                <Label className="text-base font-semibold">Valores a configurar:</Label>
              </div>
              <div className="ml-8 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg space-y-2">
                <div className="grid gap-2 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-muted-foreground font-medium min-w-[120px]">callbackurl:</span>
                    <code className="bg-white dark:bg-gray-900 px-2 py-1 rounded text-xs flex-1 break-all">{getCallbackUrl()}</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-medium">probganho:</span>
                    <code className="bg-white dark:bg-gray-900 px-3 py-1 rounded font-bold">{winProbability}</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-medium">probbonus:</span>
                    <code className="bg-white dark:bg-gray-900 px-3 py-1 rounded font-bold">{bonusProbability}</code>
                  </div>
                </div>
              </div>
            </div>

            <Alert className="ml-8">
              <AlertDescription className="text-xs">
                <strong>💡 Dica:</strong> Copie o SQL acima e execute na aba "SQL" do phpMyAdmin, ou edite manualmente 
                clicando no ícone de lápis (✏️) na linha do registro na aba "Visualizar".
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Configurações da API de Jogos (VPS)</CardTitle>
            <CardDescription>
              Configure a conexão com sua API de jogos instalada no VPS.
              <br />
              <a 
                href="https://github.com/mrdamaia/Api-PGSOFT" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm"
              >
                📖 Ver documentação completa no GitHub
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                <strong>Importante:</strong> Primeiro instale a API no VPS, depois configure aqui.
              </AlertDescription>
            </Alert>

            <div className="bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-500 rounded-lg p-4 space-y-4">
              <h3 className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                🎯 4 Campos Principais (do seu MySQL)
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="api-key" className="text-base font-semibold">
                  1️⃣ URL da API no VPS *
                </Label>
                <Input
                  id="api-key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="http://204.216.174.232:888"
                  className="text-base h-12"
                />
                <p className="text-sm text-muted-foreground">
                  📌 URL do seu servidor VPS onde os jogos estão hospedados
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="operator-token" className="text-base font-semibold">
                  2️⃣ Agent Token * (agentToken do MySQL)
                </Label>
                <Input
                  id="operator-token"
                  value={operatorToken}
                  onChange={(e) => setOperatorToken(e.target.value)}
                  placeholder="Copie o agentToken da tabela agents"
                  className="text-base h-12 font-mono"
                />
                <p className="text-sm text-muted-foreground">
                  📌 Mesmo valor do campo <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">agentToken</code> no MySQL
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secret-key" className="text-base font-semibold">
                  3️⃣ Secret Key * (secretKey do MySQL)
                </Label>
                <Input
                  id="secret-key"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="Copie a secretKey da tabela agents"
                  className="text-base h-12 font-mono"
                />
                <p className="text-sm text-muted-foreground">
                  📌 Mesmo valor do campo <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">secretKey</code> no MySQL
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="provider-code" className="text-base font-semibold">
                  4️⃣ Agent Code (agentCode do MySQL)
                </Label>
                <Input
                  id="provider-code"
                  value={providerCode}
                  onChange={(e) => setProviderCode(e.target.value)}
                  placeholder="VORTEX ou código que está no MySQL"
                  className="text-base h-12"
                />
                <p className="text-sm text-muted-foreground">
                  📌 Mesmo valor do campo <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">agentCode</code> no MySQL
                </p>
              </div>
            </div>

            <Alert className="bg-green-50 dark:bg-green-950/30">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm">
                <strong>✅ Dica:</strong> Preencha os 4 campos acima com os mesmos valores do MySQL e clique em "Salvar". 
                Depois, atualize o MySQL conforme mostrado no card azul no topo.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={handleSaveSettings} 
              className="w-full h-12 text-base font-bold"
              size="lg"
            >
              💾 Salvar Configurações
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuração de RTP e Probabilidades</CardTitle>
            <CardDescription>
              Ajuste as configurações de retorno e probabilidades de ganho/bônus
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="win-probability">Probabilidade de Ganho</Label>
                <Input
                  id="win-probability"
                  type="number"
                  min="0"
                  max="100"
                  value={winProbability}
                  onChange={(e) => setWinProbability(e.target.value)}
                  placeholder="2"
                />
                <p className="text-xs text-muted-foreground">
                  Quanto maior, mais ganhos. 1 = 10%, 2 = 20%, 0.02 = 2%
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bonus-probability">Probabilidade de Bônus</Label>
                <Input
                  id="bonus-probability"
                  type="number"
                  min="0"
                  max="100"
                  value={bonusProbability}
                  onChange={(e) => setBonusProbability(e.target.value)}
                  placeholder="2"
                />
                <p className="text-xs text-muted-foreground">
                  Quanto maior, mais bônus. 1 = 10%, 2 = 20%, 0.02 = 2%
                </p>
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
              Configure estas URLs nos provedores externos e na API do VPS
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Callback da API de Jogos (VPS) 🎯</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value="https://ryuexvaocxzqpfcekejh.supabase.co/functions/v1/game-api-callback"
                  className="font-mono text-xs"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText("https://ryuexvaocxzqpfcekejh.supabase.co/functions/v1/game-api-callback");
                    toast.success("URL copiada!");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Configure na tabela 'agents' do MySQL (campo callbackurl)
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
                <strong>Configurações importantes:</strong>
                <br /><br />
                <strong>1. Na API do VPS (MySQL - tabela agents):</strong>
                <ol className="list-decimal list-inside mt-1 space-y-1">
                  <li>Adicione registro com agentToken e secretKey</li>
                  <li>Configure callbackurl com a URL do game-api-callback acima</li>
                </ol>
                <br />
                <strong>2. Na Oasyfy:</strong>
                <ol className="list-decimal list-inside mt-1 space-y-1">
                  <li>Configure webhooks de depósito e taxa</li>
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
            disabled={!apiKey || !operatorToken || !secretKey}
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
