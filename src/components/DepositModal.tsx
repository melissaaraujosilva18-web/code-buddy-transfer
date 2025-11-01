import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import pixLogo from "@/assets/pix-logo.png";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DepositModal = ({ isOpen, onClose }: DepositModalProps) => {
  const [amount, setAmount] = useState("");
  const [showPixCode, setShowPixCode] = useState(false);

  const handleGeneratePixCode = () => {
    if (!amount || Number(amount) < 1) {
      toast.error("O valor mínimo é R$ 1,00");
      return;
    }

    if (Number(amount) > 10000) {
      toast.error("O valor máximo é R$ 10.000,00");
      return;
    }

    setShowPixCode(true);
    toast.success("Código PIX gerado! Efetue o pagamento para completar o depósito.");
  };

  const mockPixCode = "00020126580014BR.GOV.BCB.PIX0136a1b2c3d4-e5f6-7890-abcd-ef1234567890520400005303986540" + Number(amount).toFixed(2) + "5802BR5925VORTEXBET LTDA6009SAO PAULO62070503***6304ABCD";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <img src={pixLogo} alt="PIX" className="h-6" />
            Depositar via PIX
          </DialogTitle>
        </DialogHeader>

        {!showPixCode ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor do Depósito</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                max="10000"
                step="0.01"
              />
              <p className="text-xs text-muted-foreground">
                Mínimo: R$ 1,00 | Máximo: R$ 10.000,00
              </p>
            </div>

            <Button onClick={handleGeneratePixCode} className="w-full" size="lg">
              Gerar Código PIX
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-primary mb-2">
                R$ {Number(amount).toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">
                Escaneie o QR Code ou copie o código PIX abaixo
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg">
              <div className="aspect-square bg-muted flex items-center justify-center text-muted-foreground text-sm">
                QR Code PIX
              </div>
            </div>

            <div className="space-y-2">
              <Label>Código PIX Copia e Cola</Label>
              <div className="flex gap-2">
                <Input value={mockPixCode} readOnly className="text-xs" />
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(mockPixCode);
                    toast.success("Código copiado!");
                  }}
                  size="sm"
                >
                  Copiar
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>• O depósito será creditado automaticamente após confirmação</p>
              <p>• Tempo médio de confirmação: 1-5 minutos</p>
              <p>• Em caso de dúvidas, entre em contato com o suporte</p>
            </div>

            <Button onClick={onClose} variant="outline" className="w-full">
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
