import { useState } from "react";
import { Copy, Users, DollarSign, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { MobileMenu } from "@/components/MobileMenu";
import { DepositModal } from "@/components/DepositModal";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export default function Referral() {
  const { user, profile } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  const referralLink = `https://vortexbet.fun/?ref=${user?.id?.slice(0, 8) || '134'}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Link copiado!",
      description: "Cole e compartilhe com seus amigos"
    });
  };

  const stats = [
    { icon: Users, label: "Registros", value: "0" },
    { icon: Users, label: "Ativos", value: "0" },
    { icon: DollarSign, label: "Total CPA", value: "R$ 0" },
    { icon: DollarSign, label: "Total Revenue", value: "R$ 0,00" },
    { icon: TrendingUp, label: "Comissão (REV)", value: "30%" },
    { icon: DollarSign, label: "Comissão (CPA)", value: "R$ 30" },
  ];

  const steps = [
    {
      number: "1",
      title: "Compartilhe",
      subtitle: "com amigos",
      description: "Compartilhe seu link ou código de referência com seus amigos"
    },
    {
      number: "2",
      title: "Ganhe R$ 10",
      description: "Você recebe sobre o primeiro depósito na hora"
    },
    {
      number: "3",
      title: "Suba de nível e receba!",
      description: "Aumente seus ganhos a cada novo cadastro no seu link"
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-6 w-full overflow-x-hidden">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border w-full">
        <div className="px-3 py-4">
          <h1 className="text-xl font-bold">Indique e Ganhe</h1>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[420px]">
      {/* Stats Grid */}
      <div className="px-3 py-4 space-y-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border w-full"
            >
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-base font-semibold">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Balance Section */}
      <div className="px-3 py-5">
        <div className="text-center space-y-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-primary">R$ 0,00</h2>
            <p className="text-muted-foreground">Saldo Atual</p>
          </div>

          <Button
            className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90"
            disabled
          >
            Solicitar Saque
          </Button>

          <p className="text-sm text-muted-foreground">
            Valor mínimo para saque: R$ 100,00
          </p>
        </div>
      </div>

      {/* Referral Link Section */}
      <div className="px-3 py-5 space-y-3">
        <div>
          <h3 className="text-xl font-semibold mb-2">Meu link de referência</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Aproveite essa oportunidade para ganhar dinheiro extra enquanto compartilha a diversão da plataforma com seus amigos.
          </p>

          <div
            onClick={handleCopyLink}
            className="flex items-center gap-3 p-3 rounded-lg bg-secondary cursor-pointer hover:bg-secondary/80 transition-colors border border-border w-full overflow-hidden"
          >
            <span className="text-sm font-mono truncate flex-1 min-w-0">
              {referralLink}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0"
            >
              Copiar
            </Button>
          </div>
        </div>
      </div>

      {/* Steps Section */}
      <div className="px-3 py-5 space-y-3">
        {steps.map((step, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border w-full"
          >
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-white">{step.number}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold mb-1">
                {step.title} {step.subtitle && <span className="text-muted-foreground">{step.subtitle}</span>}
              </h4>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      </div>

      {/* Mobile Navigation */}
      <BottomNav
        onDepositClick={() => setIsDepositModalOpen(true)}
        onMenuClick={() => setIsMobileMenuOpen(true)}
      />

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Deposit Modal */}
      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
      />
    </div>
  );
}
