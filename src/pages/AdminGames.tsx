import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";

interface Game {
  id: string;
  provider_id: string;
  game_id: string;
  game_code: string;
  game_name: string;
  technology: string;
  distribution: string;
  rtp: number;
  cover: string | null;
  status: boolean;
  category: string;
}

interface Provider {
  id: string;
  code: string;
  name: string;
}

export default function AdminGames() {
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);

  // Form states
  const [providerId, setProviderId] = useState("");
  const [gameId, setGameId] = useState("");
  const [gameCode, setGameCode] = useState("");
  const [gameName, setGameName] = useState("");
  const [technology, setTechnology] = useState("html5");
  const [distribution, setDistribution] = useState("evergame");
  const [rtp, setRtp] = useState("96");
  const [cover, setCover] = useState("");
  const [status, setStatus] = useState(true);
  const [category, setCategory] = useState("slot");

  useEffect(() => {
    loadProviders();
    loadGames();
  }, []);

  const loadProviders = async () => {
    const { data, error } = await supabase
      .from("providers")
      .select("id, code, name")
      .eq("status", true)
      .order("name");

    if (error) {
      toast.error("Erro ao carregar provedores");
      console.error(error);
    } else {
      setProviders(data || []);
    }
  };

  const loadGames = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("games")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar jogos");
      console.error(error);
    } else {
      setGames(data || []);
    }
    setLoading(false);
  };

  const openDialog = (game?: Game) => {
    if (game) {
      setEditingGame(game);
      setProviderId(game.provider_id);
      setGameId(game.game_id);
      setGameCode(game.game_code);
      setGameName(game.game_name);
      setTechnology(game.technology);
      setDistribution(game.distribution);
      setRtp(game.rtp.toString());
      setCover(game.cover || "");
      setStatus(game.status);
      setCategory(game.category);
    } else {
      setEditingGame(null);
      setProviderId("");
      setGameId("");
      setGameCode("");
      setGameName("");
      setTechnology("html5");
      setDistribution("evergame");
      setRtp("96");
      setCover("");
      setStatus(true);
      setCategory("slot");
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!providerId || !gameId || !gameCode || !gameName) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const gameData = {
      provider_id: providerId,
      game_id: gameId,
      game_code: gameCode,
      game_name: gameName,
      technology,
      distribution,
      rtp: parseInt(rtp),
      cover: cover || null,
      status,
      category
    };

    if (editingGame) {
      const { error } = await supabase
        .from("games")
        .update(gameData)
        .eq("id", editingGame.id);

      if (error) {
        toast.error("Erro ao atualizar jogo");
        console.error(error);
      } else {
        toast.success("Jogo atualizado!");
        setDialogOpen(false);
        loadGames();
      }
    } else {
      const { error } = await supabase
        .from("games")
        .insert([gameData]);

      if (error) {
        toast.error("Erro ao criar jogo");
        console.error(error);
      } else {
        toast.success("Jogo criado!");
        setDialogOpen(false);
        loadGames();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este jogo?")) return;

    const { error } = await supabase
      .from("games")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Erro ao excluir jogo");
      console.error(error);
    } else {
      toast.success("Jogo excluído!");
      loadGames();
    }
  };

  const getProviderName = (provider_id: string) => {
    const provider = providers.find(p => p.id === provider_id);
    return provider?.name || "N/A";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Jogos</h1>
            <p className="text-muted-foreground">Gerenciar catálogo de jogos</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Jogo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingGame ? "Editar" : "Novo"} Jogo</DialogTitle>
              <DialogDescription>
                Preencha os dados do jogo
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provider">Provedor *</Label>
                  <Select value={providerId} onValueChange={setProviderId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gameId">ID do Jogo *</Label>
                  <Input
                    id="gameId"
                    value={gameId}
                    onChange={(e) => setGameId(e.target.value)}
                    placeholder="126 ou fortune-tiger"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gameCode">Código do Jogo *</Label>
                <Input
                  id="gameCode"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value)}
                  placeholder="fortune-tiger"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gameName">Nome do Jogo *</Label>
                <Input
                  id="gameName"
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  placeholder="Fortune Tiger"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="technology">Tecnologia</Label>
                  <Select value={technology} onValueChange={setTechnology}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="html5">HTML5</SelectItem>
                      <SelectItem value="flash">Flash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="distribution">Distribuição</Label>
                  <Select value={distribution} onValueChange={setDistribution}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="evergame">Evergame</SelectItem>
                      <SelectItem value="word">Word</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rtp">RTP (%)</Label>
                  <Input
                    id="rtp"
                    type="number"
                    value={rtp}
                    onChange={(e) => setRtp(e.target.value)}
                    min="85"
                    max="99"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slot">Slot</SelectItem>
                      <SelectItem value="cassino">Cassino</SelectItem>
                      <SelectItem value="crash">Crash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cover">URL da Capa</Label>
                <Input
                  id="cover"
                  value={cover}
                  onChange={(e) => setCover(e.target.value)}
                  placeholder="https://... ou /assets/games/..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="status"
                  checked={status}
                  onCheckedChange={setStatus}
                />
                <Label htmlFor="status">Ativo</Label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1">
                Salvar
              </Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catálogo de Jogos</CardTitle>
          <CardDescription>
            {games.length} jogo(s) cadastrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : games.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum jogo cadastrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Provedor</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {games.map((game) => (
                  <TableRow key={game.id}>
                    <TableCell className="font-medium">{game.game_name}</TableCell>
                    <TableCell className="font-mono text-sm">{game.game_code}</TableCell>
                    <TableCell>{getProviderName(game.provider_id)}</TableCell>
                    <TableCell className="capitalize">{game.category}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${game.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {game.status ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openDialog(game)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(game.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}