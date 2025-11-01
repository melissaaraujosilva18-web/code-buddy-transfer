import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ValidCode {
  code: number;
  name: string;
  url: string;
}

export default function TestGameCodes() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ValidCode[]>([]);
  const [tested, setTested] = useState(0);

  const testCodes = async () => {
    setLoading(true);
    setResults([]);
    setTested(0);

    try {
      const { data, error } = await supabase.functions.invoke('test-game-codes', {
        body: { startCode: 1, endCode: 200 }
      });

      if (error) throw error;

      if (data?.validCodes) {
        setResults(data.validCodes);
        setTested(data.totalTested);
      }
    } catch (error) {
      console.error('Error testing codes:', error);
      alert('Erro ao testar códigos. Verifique o console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <Button
          onClick={() => navigate('/')}
          variant="ghost"
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Testar GameCodes da API</CardTitle>
            <CardDescription>
              Testa códigos de 1 a 200 para descobrir quais jogos estão disponíveis na API slotbetpix.io
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={testCodes}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testando códigos...
                </>
              ) : (
                'Iniciar Teste'
              )}
            </Button>

            {tested > 0 && (
              <div className="text-sm text-muted-foreground">
                Testados: {tested} códigos | Encontrados: {results.length} válidos
              </div>
            )}

            {results.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Códigos Válidos Encontrados:</h3>
                <div className="grid gap-2 max-h-[500px] overflow-y-auto">
                  {results.map((game) => (
                    <Card key={game.code} className="p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-mono text-sm font-bold">Code: {game.code}</p>
                          <p className="text-sm text-muted-foreground">{game.name}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => window.open(game.url, '_blank')}
                        >
                          Testar Jogo
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>

                <Card className="mt-4 p-4 bg-muted">
                  <h4 className="font-semibold mb-2">Códigos para copiar:</h4>
                  <code className="text-xs block whitespace-pre-wrap break-all">
                    {JSON.stringify(results.map(g => ({ code: g.code, name: g.name })), null, 2)}
                  </code>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
