import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WithdrawalModal = ({ isOpen, onClose }: WithdrawalModalProps) => {
  const { user, profile, refreshProfile } = useAuth();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestWithdrawal = async () => {
    if (!user || !profile) return;

    const withdrawalAmount = Number(amount);

    if (!withdrawalAmount || withdrawalAmount < 50) {
      toast.error("O valor mínimo para saque é R$ 50,00");
      return;
    }

    if (withdrawalAmount > Number(profile.balance)) {
      toast.error("Saldo insuficiente");
      return;
    }

    if (!profile.pix_key) {
      toast.error("Configure sua chave PIX no perfil antes de sacar");
      return;
    }

    setLoading(true);

    try {
      const newBalance = Number(profile.balance) - withdrawalAmount;

      const { error } = await supabase
        .from("profiles")
        .update({
          balance: newBalance,
          withdrawal_amount: withdrawalAmount,
          withdrawal_status: "pending",
        })
        .eq("id", user.id);

      if (error) throw error;

      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          type: "withdrawal",
          amount: -withdrawalAmount,
          balance_before: profile.balance,
          balance_after: newBalance,
          description: "Solicitação de saque via PIX",
          status: "pending",
        });

      if (transactionError) throw transactionError;

      await refreshProfile();
      toast.success("Saque solicitado com sucesso! Aguarde a análise.");
      onClose();
      setAmount("");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Solicitar Saque</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Saldo Disponível</p>
            <p className="text-2xl font-bold text-primary">
              R$ {Number(profile?.balance || 0).toFixed(2)}
            </p>
          </div>

          {profile?.pix_key ? (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Chave PIX cadastrada</p>
              <p className="font-medium">{profile.pix_key}</p>
            </div>
          ) : (
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg">
              <p className="text-sm text-yellow-600 dark:text-yellow-500">
                ⚠️ Configure sua chave PIX no perfil antes de solicitar saques
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="withdrawal-amount">Valor do Saque</Label>
            <Input
              id="withdrawal-amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="50"
              step="0.01"
              disabled={!profile?.pix_key}
            />
            <p className="text-xs text-muted-foreground">
              Valor mínimo: R$ 50,00
            </p>
          </div>

          <div className="text-xs text-muted-foreground space-y-1 bg-muted p-3 rounded-lg">
            <p className="font-semibold">Informações importantes:</p>
            <p>• Prazo de análise: até 24 horas úteis</p>
            <p>• O valor será enviado para a chave PIX cadastrada</p>
            <p>• Você receberá uma notificação quando o saque for processado</p>
          </div>

          <Button
            onClick={handleRequestWithdrawal}
            disabled={loading || !profile?.pix_key}
            className="w-full"
            size="lg"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Solicitar Saque
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
