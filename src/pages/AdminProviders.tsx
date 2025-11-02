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

interface Provider {
  id: string;
  code: string;
  name: string;
  rtp: number;
  distribution: string;
  status: boolean;
}

export default function AdminProviders() {
  const navigate = useNavigate();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);

  // Form states
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [rtp, setRtp] = useState("96");
  const [distribution, setDistribution] = useState("evergame");
  const [status, setStatus] = useState(true);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("providers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar provedores");
      console.error(error);
    } else {
      setProviders(data || []);
    }
    setLoading(false);
  };

  const openDialog = (provider?: Provider) => {
    if (provider) {
      setEditingProvider(provider);
      setCode(provider.code);
      setName(provider.name);
      setRtp(provider.rtp.toString());
      setDistribution(provider.distribution);
      setStatus(provider.status);
    } else {
      setEditingProvider(null);
      setCode("");
      setName("");
      setRtp("96");
      setDistribution("evergame");
      setStatus(true);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!code || !name) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const providerData = {
      code,
      name,
      rtp: parseInt(rtp),
      distribution,
      status
    };

    if (editingProvider) {
      const { error } = await supabase
        .from("providers")
        .update(providerData)
        .eq("id", editingProvider.id);

      if (error) {
        toast.error("Erro ao atualizar provedor");
        console.error(error);
      } else {
        toast.success("Provedor atualizado!");
        setDialogOpen(false);
        loadProviders();
      }
    } else {
      const { error } = await supabase
        .from("providers")
        .insert([providerData]);

      if (error) {
        toast.error("Erro ao criar provedor");
        console.error(error);
      } else {
        toast.success("Provedor criado!");
        setDialogOpen(false);
        loadProviders();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este provedor?")) return;

    const { error } = await supabase
      .from("providers")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Erro ao excluir provedor");
      console.error(error);
    } else {
      toast.success("Provedor excluído!");
      loadProviders();
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Provedores</h1>
            <p className="text-muted-foreground">Gerenciar provedores de jogos</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Provedor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingProvider ? "Editar" : "Novo"} Provedor</DialogTitle>
              <DialogDescription>
                Preencha os dados do provedor de jogos
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="PGSoft_Slot"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="PG Soft"
                />
              </div>
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
          <CardTitle>Lista de Provedores</CardTitle>
          <CardDescription>
            {providers.length} provedor(es) cadastrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : providers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum provedor cadastrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>RTP</TableHead>
                  <TableHead>Distribuição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell className="font-mono">{provider.code}</TableCell>
                    <TableCell>{provider.name}</TableCell>
                    <TableCell>{provider.rtp}%</TableCell>
                    <TableCell className="capitalize">{provider.distribution}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${provider.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {provider.status ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openDialog(provider)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(provider.id)}
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