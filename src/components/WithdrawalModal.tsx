import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle2, Wallet, Edit2, Copy, XCircle, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import { formatCPF, validateCPF } from "@/utils/cpfValidation";

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WithdrawalModal = ({ isOpen, onClose }: WithdrawalModalProps) => {
  const { user, profile, refreshProfile } = useAuth();
  const [pixKeyType, setPixKeyType] = useState<'cpf' | 'email' | 'phone' | 'random'>(profile?.pix_key_type || 'cpf');
  const [pixName, setPixName] = useState(profile?.pix_name || "");
  const [pixKey, setPixKey] = useState(profile?.pix_key || "");
  const [cpf, setCpf] = useState((profile as any)?.cpf || "");
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditingPix, setIsEditingPix] = useState(false);
  const [feeQrCodeData, setFeeQrCodeData] = useState<{
    qrCode: string;
    qrCodeBase64: string;
    amount: number;
  } | null>(null);
  const [isLoadingFee, setIsLoadingFee] = useState(false);
  const [showFeeRejected, setShowFeeRejected] = useState(false);

  // Limpar QR code quando modal fecha
  useEffect(() => {
    if (!isOpen) {
      setFeeQrCodeData(null);
      setIsLoadingFee(false);
    }
  }, [isOpen]);

  // Estágio 1: Sem depósito
  const hasNotDeposited = !profile?.has_deposited;

  // Estágio 2: Depositou mas não resgatou bônus
  const needsToClaimBonus = profile?.has_deposited && !profile?.bonus_claimed;

  // Estágio 3: Resgatou bônus e pode sacar (mas precisa pagar taxa)
  const canWithdraw = profile?.bonus_claimed;

  // Verificar se já tem saque em processamento
  const hasWithdrawalProcessing = profile?.withdrawal_status === 'processing';
  const needsToPayFee = profile?.withdrawal_status === 'awaiting_fee';

  const hasPixKey = profile?.pix_key && profile?.pix_key_type && profile?.pix_name;

  // Ao abrir com status 'processing', forçar falha e reverter para 'awaiting_fee'
  useEffect(() => {
    const enforceFailureIfProcessing = async () => {
      if (isOpen && hasWithdrawalProcessing && user) {
        try {
          await supabase
            .from('profiles')
            .update({ withdrawal_status: 'awaiting_fee' })
            .eq('id', user.id);
          await refreshProfile();
          setFeeQrCodeData(null);
          setShowFeeRejected(true);
        } catch (e) {
          console.error('Erro ao reverter status para awaiting_fee:', e);
        }
      }
    };
    enforceFailureIfProcessing();
  }, [isOpen, hasWithdrawalProcessing, user]);

  // Mostrar tela de falha automaticamente se há taxa pendente e não tem QR code
  useEffect(() => {
    if (isOpen && needsToPayFee && !feeQrCodeData && !isLoadingFee) {
      // Se já tentou carregar QR code mas não conseguiu, mostrar falha
      const timer = setTimeout(() => {
        if (!feeQrCodeData && !isLoadingFee) {
          setShowFeeRejected(true);
        }
      }, 2000); // Aguarda 2 segundos para tentar carregar o QR code primeiro

      return () => clearTimeout(timer);
    }
  }, [isOpen, needsToPayFee, feeQrCodeData, isLoadingFee]);

  // Atualizar estados quando o perfil mudar
  useEffect(() => {
    if (profile) {
      setPixKeyType(profile.pix_key_type || 'cpf');
      setPixName(profile.pix_name || "");
      setPixKey(profile.pix_key || "");
      setCpf((profile as any).cpf || "");
    }
  }, [profile]);

  // Gerar QR Code da taxa quando necessário
  useEffect(() => {
    const loadAdminFeeQrCode = async () => {
      if (needsToPayFee && !feeQrCodeData && user && isOpen) {
        setIsLoadingFee(true);
        console.log('Iniciando carregamento do QR code...');

        try {
          const { data, error } = await supabase.functions.invoke('create-admin-fee-charge', {
            body: { userId: user.id },
          });

          if (error) {
            console.error('Erro na chamada:', error);
            throw error;
          }

          console.log('Resposta completa da API:', data);

          if (data && (data.qrCode || data.qrCodeBase64)) {
            const qrData = {
              qrCode: data.qrCode,
              qrCodeBase64: data.qrCodeBase64 ? `data:image/png;base64,${data.qrCodeBase64}` : "",
              amount: data.amount,
            };
            console.log('Setando QR code data:', qrData);
            setFeeQrCodeData(qrData);
            setIsLoadingFee(false);
          } else {
            console.error('Dados incompletos:', data);
            throw new Error('QR Code não retornado pela API');
          }
        } catch (error) {
          console.error('Error loading admin fee QR code:', error);
          toast({
            title: "Erro ao gerar QR Code",
            description: "Não foi possível gerar o QR Code da taxa",
            variant: "destructive",
          });
          setIsLoadingFee(false);
        }
      }
    };

    loadAdminFeeQrCode();
  }, [needsToPayFee, user, isOpen]);

  const handleUpdatePixKey = async () => {
    if (!pixKey || !pixName || !pixKeyType || !cpf || !user) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, preencha todos os campos incluindo o CPF",
        variant: "destructive",
      });
      return;
    }

    if (!validateCPF(cpf)) {
      toast({
        title: "CPF inválido",
        description: "Por favor, digite um CPF válido",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          pix_key: pixKey,
          pix_key_type: pixKeyType,
          pix_name: pixName,
          cpf: cpf
        })
        .eq("id", user.id);

      if (error) throw error;

      await refreshProfile();
      setIsEditingPix(false);
      toast({
        title: "Dados atualizados!",
        description: "Seus dados foram atualizados com sucesso",
      });
    } catch (error) {
      console.error("Error updating PIX key:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar seus dados",
        variant: "destructive",
      });
    }
  };

  const handleRequestWithdrawal = async () => {
    // Validar valor do saque
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor válido para saque",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(amount) > (profile?.balance || 0)) {
      toast({
        title: "Saldo insuficiente",
        description: "Você não tem saldo suficiente para este saque",
        variant: "destructive",
      });
      return;
    }

    // Validar dados da chave PIX e CPF
    if (!pixKey || !pixName || !pixKeyType || !cpf) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, preencha todos os campos incluindo o CPF",
        variant: "destructive",
      });
      return;
    }

    if (!validateCPF(cpf)) {
      toast({
        title: "CPF inválido",
        description: "Por favor, digite um CPF válido",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);

      const withdrawalAmount = parseFloat(amount);
      const newBalance = (profile?.balance || 0) - withdrawalAmount;

      // Salvar/atualizar chave PIX, CPF, solicitar saque e descontar saldo
      const { error } = await supabase
        .from("profiles")
        .update({
          pix_key: pixKey,
          pix_key_type: pixKeyType,
          pix_name: pixName,
          cpf: cpf,
          withdrawal_status: "awaiting_fee",
          withdrawal_amount: withdrawalAmount,
          balance: newBalance,
        })
        .eq("id", user!.id);

      if (error) throw error;

      await refreshProfile();
      setAmount("");

      toast({
        title: "Saque solicitado",
        description: "Pague a taxa administrativa para liberar o saque",
      });
    } catch (error) {
      console.error("Error requesting withdrawal:", error);
      toast({
        title: "Erro ao processar saque",
        description: "Não foi possível processar seu saque",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const adminFee = profile?.withdrawal_amount ? (profile.withdrawal_amount * 0.1) : 0;

  // Listener para detectar pagamento da taxa e sempre mostrar como recusado
  useEffect(() => {
    if (!user || !needsToPayFee || !isOpen) return;

    const channel = supabase
      .channel(`fee-payment-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        async (payload) => {
          // Se o status mudou para 'processing', significa que o pagamento foi confirmado
          if (payload.new.withdrawal_status === 'processing') {
            // Volta o status para 'awaiting_fee' sem adicionar ao saldo
            await supabase
              .from('profiles')
              .update({
                withdrawal_status: 'awaiting_fee'
              })
              .eq('id', user.id);

            // Mostra a tela de pagamento recusado
            setFeeQrCodeData(null);
            setShowFeeRejected(true);

            // Atualiza o perfil
            await refreshProfile();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, needsToPayFee, isOpen, adminFee, refreshProfile]);

  const pixKeyTypeLabels = {
    cpf: "CPF",
    email: "E-mail",
    phone: "Telefone",
    random: "Chave Aleatória"
  };

  const copyPixCode = () => {
    if (!feeQrCodeData) return;

    navigator.clipboard.writeText(feeQrCodeData.qrCode);
    toast({
      title: "Código copiado!",
      description: "Cole no seu app de pagamentos",
    });
  };

  const handleRetryFeePayment = async () => {
    setShowFeeRejected(false);
    setFeeQrCodeData(null);
    setIsLoadingFee(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-admin-fee-charge', {
        body: { userId: user!.id },
      });

      if (error) throw error;

      if (data && (data.qrCode || data.qrCodeBase64)) {
        setFeeQrCodeData({
          qrCode: data.qrCode,
          qrCodeBase64: data.qrCodeBase64 ? `data:image/png;base64,${data.qrCodeBase64}` : "",
          amount: data.amount,
        });
        setIsLoadingFee(false);
        toast({
          title: "Novo QR Code gerado!",
          description: "Tente novamente com este QR Code",
        });
      }
    } catch (error) {
      console.error('Error generating new QR code:', error);
      toast({
        title: "Erro ao gerar QR Code",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      });
      setIsLoadingFee(false);
    }
  };

  const renderWithdrawalForm = (showPixFields: boolean) => (
    <div className="space-y-4">
      {showPixFields && (
        <>
          <div className="space-y-2">
            <Label>CPF</Label>
            <Input
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => setCpf(formatCPF(e.target.value))}
              className="h-12"
              maxLength={14}
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de Chave PIX</Label>
            <Select value={pixKeyType} onValueChange={(value: any) => setPixKeyType(value)}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cpf">CPF</SelectItem>
                <SelectItem value="email">E-mail</SelectItem>
                <SelectItem value="phone">Telefone</SelectItem>
                <SelectItem value="random">Chave Aleatória</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nome Completo</Label>
            <Input
              placeholder="Seu nome completo"
              value={pixName}
              onChange={(e) => setPixName(e.target.value)}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label>Chave PIX</Label>
            <Input
              placeholder={`Digite sua chave PIX (${pixKeyTypeLabels[pixKeyType]})`}
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              className="h-12"
            />
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label>Valor do saque</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
            R$
          </span>
          <Input
            type="number"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-12 h-12 text-lg"
            max={profile?.balance}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Máximo: R$ {(profile?.balance || 0).toFixed(2)}
        </p>
      </div>

      <Button
        onClick={handleRequestWithdrawal}
        className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90"
        disabled={isProcessing}
      >
        {isProcessing ? "Processando..." : "Sacar"}
      </Button>
    </div>
  );

  const renderPixKeyDisplay = () => (
    <div className="space-y-3">
      <div className="flex items-start gap-2 p-4 rounded-lg bg-secondary/50">
        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-1">
          <p className="text-xs font-medium">Chave PIX cadastrada</p>
          <p className="text-sm font-medium">{profile?.pix_name}</p>
          <p className="text-xs text-muted-foreground">
            {pixKeyTypeLabels[profile?.pix_key_type!]}: {profile?.pix_key}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={hasPixKey ? () => setIsEditingPix(true) : handleUpdatePixKey}
          className="h-8 w-8 p-0"
        >
          <Edit2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Dialog open={isOpen && !showFeeRejected} onOpenChange={onClose}>
        <DialogContent className="w-[92vw] max-w-[420px] bg-background max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6 rounded-xl" aria-describedby="withdrawal-desc">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center flex items-center justify-center gap-2">
              <Wallet className="w-6 h-6" />
              Saque
            </DialogTitle>
          </DialogHeader>

          <p id="withdrawal-desc" className="sr-only">Gerencie seu saque, pague a taxa quando solicitado e acompanhe o status.</p>
          <div className="space-y-6 pt-4">
            {/* Mostrar saldo disponível */}
            <div className="bg-secondary/50 p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">Saldo disponível</p>
              <p className="text-3xl font-bold text-primary">
                R$ {(profile?.balance || 0).toFixed(2)}
              </p>
            </div>

            {/* ESTÁGIO 1: Sem depósito */}
            {hasNotDeposited && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-500 mb-1">
                      Você precisa fazer um depósito primeiro
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Faça seu primeiro depósito para poder realizar saques.
                    </p>
                  </div>
                </div>

                {/* Formulário com PIX e valor */}
                {renderWithdrawalForm(true)}
              </div>
            )}

            {/* ESTÁGIO 2: Depositou mas não resgatou bônus */}
            {needsToClaimBonus && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-500 mb-1">
                      Depósito mínimo necessário
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Você precisa realizar um depósito mínimo de 30 reais para realizar saques.
                    </p>
                  </div>
                </div>

                {/* Mostrar PIX se já tiver, senão mostrar formulário com campos de PIX */}
                {hasPixKey && !isEditingPix ? (
                  <>
                    {renderPixKeyDisplay()}
                    {renderWithdrawalForm(false)}
                  </>
                ) : (
                  renderWithdrawalForm(true)
                )}
              </div>
            )}

            {/* ESTÁGIO 3: Pode sacar mas precisa pagar taxa */}
            {canWithdraw && !hasWithdrawalProcessing && !needsToPayFee && (
              <div className="space-y-4">
                {/* Mostrar PIX se já tiver com botão editar, senão mostrar formulário com campos de PIX */}
                {hasPixKey && !isEditingPix ? (
                  <>
                    {renderPixKeyDisplay()}
                    {renderWithdrawalForm(false)}
                  </>
                ) : (
                  renderWithdrawalForm(true)
                )}
              </div>
            )}

            {/* Saque em processamento - aguardando taxa */}
            {(hasWithdrawalProcessing || needsToPayFee) && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-orange-500 mb-1">
                      Saque em processamento
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Seu saque de <strong>R$ {(profile?.withdrawal_amount || 0).toFixed(2)}</strong> está aguardando pagamento da taxa.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Para efetivar o saque, é necessário pagar uma taxa administrativa de <strong>10%</strong> do valor solicitado.
                    </p>
                  </div>
                </div>

                {/* Cálculo da taxa */}
                <div className="bg-secondary/50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Valor do saque:</span>
                    <span className="font-medium">R$ {(profile?.withdrawal_amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxa administrativa (10%):</span>
                    <span className="font-medium text-orange-500">R$ {adminFee.toFixed(2)}</span>
                  </div>
                  <div className="h-px bg-border my-2" />
                  <div className="flex justify-between text-base font-bold">
                    <span>Total a pagar agora:</span>
                    <span className="text-orange-500">R$ {adminFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Você receberá após aprovação:</span>
                    <span className="text-primary font-medium">
                      R$ {(profile?.withdrawal_amount || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* QR Code PIX */}
                <div className="bg-background p-3 sm:p-6 rounded-lg border-2 border-orange-500/20 space-y-4">
                  <p className="text-sm font-medium text-center">
                    Escaneie o QR Code para pagar a taxa
                  </p>

                  <div className="flex justify-center">
                    <div className="bg-white p-2 sm:p-4 rounded-lg">
                      {isLoadingFee ? (
                        <div className="w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] flex items-center justify-center">
                          <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
                        </div>
                      ) : feeQrCodeData?.qrCode ? (
                        <QRCodeSVG
                          value={(feeQrCodeData.qrCode || '').trim()}
                          size={180}
                          bgColor="#ffffff"
                          fgColor="#000000"
                          includeMargin
                        />
                      ) : feeQrCodeData?.qrCodeBase64 ? (
                        <img
                          src={feeQrCodeData.qrCodeBase64}
                          alt="QR Code Taxa"
                          className="w-[180px] h-[180px] sm:w-[220px] sm:h-[220px]"
                        />
                      ) : (
                        <div className="w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] flex items-center justify-center">
                          <p className="text-sm text-red-500">Erro ao gerar QR Code</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full h-12"
                    onClick={copyPixCode}
                    disabled={!feeQrCodeData || isLoadingFee}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar código PIX
                  </Button>

                  <div className="space-y-2 text-xs text-muted-foreground text-center">
                    <p>1. Abra o app do seu banco</p>
                    <p>2. Escaneie o QR Code ou cole o código PIX</p>
                    <p>3. Confirme o pagamento de R$ {adminFee.toFixed(2)}</p>
                    <p className="text-orange-500 font-medium pt-2">
                      Após o pagamento, seu saque será processado em até 10 minutos
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Fee Payment Rejected Modal */}
      <Dialog open={isOpen && showFeeRejected}>
        <DialogContent className="w-[92vw] max-w-[380px] bg-background p-6 rounded-xl" aria-describedby="fee-rejected-desc">
          
          <p id="fee-rejected-desc" className="sr-only">Pagamento da taxa administrativa foi recusado. Você pode tentar novamente ou cancelar o saque.</p>
          <div className="flex flex-col items-center justify-center space-y-6 py-4">
            {/* Error Icon */}
            <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full border-4 border-red-500 flex items-center justify-center">
                <XCircle className="w-12 h-12 text-red-500" strokeWidth={2.5} />
              </div>
            </div>

            {/* Error Message */}
            <div className="space-y-3 text-center">
              <h2 className="text-2xl font-bold text-foreground">
                Pagamento Recusado
              </h2>
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">
                  Não conseguimos processar o pagamento da taxa administrativa.
                </p>
                <p className="text-muted-foreground text-sm">
                  Você pode tentar novamente pelo mesmo banco ou outro de sua preferência.
                </p>
              </div>
            </div>

            {/* Refund Info */}
            <div className="w-full bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-500">
                    Não se preocupe!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    O valor de <strong>R$ {adminFee.toFixed(2)}</strong> será estornado para sua conta em até <strong>1 hora</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Retry Button */}
            <Button
              onClick={handleRetryFeePayment}
              className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 text-base font-medium"
            >
              Tentar Novamente
            </Button>

            {/* Cancel Button */}
            <Button
              onClick={async () => {
                if (!user) return;

                try {
                  // Restaurar o saldo e limpar o status de saque
                  const currentBalance = profile?.balance || 0;
                  const withdrawalAmount = profile?.withdrawal_amount || 0;

                  await supabase
                    .from('profiles')
                    .update({
                      withdrawal_status: null,
                      withdrawal_amount: null,
                      balance: currentBalance + withdrawalAmount // Devolve o valor do saque
                    })
                    .eq('id', user.id);

                  await refreshProfile();
                  setShowFeeRejected(false);
                  onClose();

                  toast({
                    title: "Saque cancelado",
                    description: "O valor foi devolvido ao seu saldo",
                  });
                } catch (error) {
                  console.error('Error canceling withdrawal:', error);
                  toast({
                    title: "Erro ao cancelar",
                    description: "Tente novamente",
                    variant: "destructive",
                  });
                }
              }}
              variant="ghost"
              className="w-full h-10 text-sm text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
