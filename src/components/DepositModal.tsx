import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Copy, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import pixLogo from "@/assets/pix-logo.png";
import { QRCodeSVG } from "qrcode.react";
import QRCode from "qrcode";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DepositModal = ({ isOpen, onClose }: DepositModalProps) => {
  const { user, refreshProfile } = useAuth();
  const [amount, setAmount] = useState('');
  const [showQRCode, setShowQRCode] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<{
    qrCode: string;
    qrCodeBase64: string;
    qrCodeImage: string;
    transactionId: string;
  } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [initialBalance, setInitialBalance] = useState<number>(0);

  useEffect(() => {
    if (isOpen && user) {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', user.id)
          .maybeSingle();

        if (data) {
          setInitialBalance(data.balance || 0);
        }
      };
      fetchProfile();
    }
  }, [isOpen, user]);

  // Salva o balance inicial ao abrir o modal
  useEffect(() => {
    if (isOpen && user) {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', user.id)
          .single();

        if (data) {
          setInitialBalance(data.balance || 0);
        }
      };
      fetchProfile();
    }
  }, [isOpen, user]);

  // Listener para detectar mudanças no balance (pagamento confirmado)
  useEffect(() => {
    if (!user || !showQRCode) return;

    const channel = supabase
      .channel(`profile-changes-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const newBalance = payload.new.balance;
          if (newBalance > initialBalance) {
            // Pagamento confirmado!
            setShowQRCode(false);
            setShowSuccess(true);
            refreshProfile();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, showQRCode, initialBalance, refreshProfile]);

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) < 30) {
      toast({
        title: "Valor inválido",
        description: "O valor mínimo de depósito é R$ 30,00",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar autenticado",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-pix-charge', {
        body: {
          amount: parseFloat(amount),
          userId: user.id,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setQrCodeData({
        qrCode: data.qrCode,
        qrCodeBase64: data.qrCodeBase64 ? `data:image/png;base64,${data.qrCodeBase64}` : '',
        qrCodeImage: data.qrCodeImage || '',
        transactionId: data.transactionId,
      });

      setShowQRCode(true);

      toast({
        title: "QR Code gerado!",
        description: "Escaneie o QR Code para efetuar o pagamento",
      });

    } catch (error) {
      console.error('Error creating PIX charge:', error);
      toast({
        title: "Erro ao gerar QR Code",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPixCode = () => {
    if (!qrCodeData) return;

    navigator.clipboard.writeText(qrCodeData.qrCode);
    setCopied(true);
    toast({
      title: "Código copiado!",
      description: "Cole no seu aplicativo de pagamento"
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCloseAll = () => {
    setShowQRCode(false);
    setShowSuccess(false);
    setAmount('');
    setQrCodeData(null);
    setQrDataUrl('');
    onClose();
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    setAmount('');
    setQrCodeData(null);
    setQrDataUrl('');
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen && !showQRCode && !showSuccess} onOpenChange={onClose}>
        <DialogContent className="w-[92vw] max-w-[420px] bg-background max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">
              Pronto para se divertir de verdade?
            </DialogTitle>
            <p className="text-sm text-muted-foreground text-center pt-2">
              Realize seu primeiro depósito e desbloqueie a emoção do jogo.
            </p>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 pb-2">
                <img src={pixLogo} alt="PIX" className="w-8 h-8" />
                <h3 className="text-xl font-medium">Depósito via Pix</h3>
              </div>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  R$
                </span>
                <Input
                  type="number"
                  placeholder="Insira um valor"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="pl-12 h-12 bg-secondary border-border text-lg"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleQuickAmount(30)}
                  className="flex-1 h-12 border-border hover:border-primary"
                >
                  R$ 30
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleQuickAmount(50)}
                  className="flex-1 h-12 border-border hover:border-primary"
                >
                  R$ 50
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleQuickAmount(80)}
                  className="flex-1 h-12 border-border hover:border-primary"
                >
                  R$ 80
                </Button>
              </div>

              <Button
                onClick={handleDeposit}
                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 text-lg font-medium"
                disabled={isLoading}
              >
                {isLoading ? "Gerando QR Code..." : "Depositar"}
              </Button>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/50">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Nossos servidores de pagamentos são altamente seguros e confiáveis.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showQRCode} onOpenChange={handleCloseAll}>
        <DialogContent className="w-[92vw] max-w-[360px] bg-background max-h-[85vh] overflow-y-auto overflow-x-hidden p-4 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-center">Depositar</DialogTitle>
            <p className="text-2xl font-bold text-center text-primary pt-2">
              Valor: R$ {parseFloat(amount || '0').toFixed(2)}
            </p>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            <div className="flex items-center justify-center">
              <div className="w-[min(82vw,320px)]">
                <AspectRatio ratio={1}>
                  {(qrCodeData?.qrCodeBase64 || qrCodeData?.qrCodeImage) ? (
                    <img
                      src={qrCodeData?.qrCodeBase64 || qrCodeData?.qrCodeImage}
                      alt="QR Code PIX"
                      className="w-full h-full object-contain rounded-md"
                    />
                  ) : qrCodeData?.qrCode ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <QRCodeSVG
                        value={(qrCodeData.qrCode || '').trim()}
                        size={280}
                        bgColor="#ffffff"
                        fgColor="#000000"
                        includeMargin
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full rounded-md border border-border flex items-center justify-center">
                      <p className="text-muted-foreground text-sm">Gerando QR Code...</p>
                    </div>
                  )}
                </AspectRatio>
              </div>
            </div>

            <p className="text-sm text-center text-muted-foreground">
              Aponte a câmera do seu celular para realizar o depósito ou copie e compartilhe o QR Code.
            </p>

            <div
              onClick={handleCopyPixCode}
              className="flex items-center gap-3 p-4 rounded-lg bg-secondary cursor-pointer hover:bg-secondary/80 transition-colors"
            >
              {copied ? (
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
              ) : (
                <Copy className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              )}
              <span className="text-[11px] sm:text-xs font-mono break-all leading-snug flex-1">
                {qrCodeData?.qrCode || 'Carregando...'}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccess} onOpenChange={handleSuccessClose}>
        <DialogContent className="w-[92vw] max-w-[380px] bg-background p-6 rounded-xl">
          <button
            onClick={handleSuccessClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex flex-col items-center justify-center space-y-6 py-4">
            <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full border-4 border-green-500 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-500" strokeWidth={2.5} />
              </div>
            </div>

            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold text-foreground">
                Depósito confirmado com sucesso!
              </h2>
              <p className="text-muted-foreground text-base">
                O valor já está disponível. Pode começar a jogar!
              </p>
            </div>

            <Button
              onClick={handleSuccessClose}
              className="w-full h-12 bg-green-500 hover:bg-green-600 text-white text-lg font-medium"
            >
              Começar a jogar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
