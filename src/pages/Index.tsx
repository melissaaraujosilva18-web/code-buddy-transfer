import { useState } from "react";
import { PromoCarousel } from "@/components/PromoCarousel";
import { WithdrawalNotifications } from "@/components/WithdrawalNotifications";
import { CategoryTabs } from "@/components/CategoryTabs";
import { GameGrid } from "@/components/GameGrid";
import { Button } from "@/components/ui/button";
import { User, LogOut, Globe, CreditCard, HandCoins, CheckCircle, History } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import pixLogo from "@/assets/pix-logo.png";
import vortexbetLogo from "@/assets/vortexbet-logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageModal } from "@/components/LanguageModal";
import { WelcomeBonusBanner } from "@/components/WelcomeBonusBanner";
import { DepositModal } from "@/components/DepositModal";
import { WithdrawalModal } from "@/components/WithdrawalModal";
import { BottomNav } from "@/components/BottomNav";
import { MobileMenu } from "@/components/MobileMenu";
import { Footer } from "@/components/Footer";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showBonusBanner, setShowBonusBanner] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [hasChangedLanguage, setHasChangedLanguage] = useState(false);
  const [showRescueAlert, setShowRescueAlert] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLanguageSelect = (language: 'pt-BR' | 'en-US') => {
    if (!hasChangedLanguage) {
      setHasChangedLanguage(true);
      setShowBonusBanner(true);
    }
  };

  const handleRescueBonus = async () => {
    if (!user || !profile) return;

    if (profile.has_deposited && !profile.bonus_claimed) {
      try {
        const bonusInUSD = 136.05;
        const usdRate = 5.58;
        const bonusInBRL = bonusInUSD * usdRate;
        const newBalance = profile.balance + bonusInBRL;

        const { error } = await supabase
          .from('profiles')
          .update({
            balance: newBalance,
            bonus_claimed: true
          })
          .eq('id', user.id);

        if (error) throw error;

        await refreshProfile();
        setShowBonusBanner(false);

        toast({
          title: "Bônus resgatado com sucesso!",
          description: `R$ ${bonusInBRL.toFixed(2)} foram adicionados ao seu saldo`,
        });
      } catch (error) {
        console.error('Error claiming bonus:', error);
        toast({
          title: "Erro ao resgatar bônus",
          description: "Tente novamente mais tarde",
          variant: "destructive",
        });
      }
    } else {
      setShowRescueAlert(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50 pt-[env(safe-area-inset-top)]">
        <div className="container mx-auto py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={vortexbetLogo} alt="Vortexbet" className="h-16 sm:h-20 md:h-24" />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {user && profile ? (
              <>
                <div className="flex items-center gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-slate-800/90 rounded-xl">
                  <span className="text-base sm:text-2xl font-bold text-white">
                    R$ {profile.balance.toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={() => setShowDepositModal(true)}
                  className="relative bg-[#00D632] hover:bg-[#00C02D] rounded-xl sm:rounded-2xl p-2 sm:p-3 transition-all shadow-lg hover:shadow-xl min-w-[44px] min-h-[44px]"
                >
                  <div className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-0.5 sm:gap-1">
                    <img src={pixLogo} alt="PIX" className="w-2.5 sm:w-3 h-2.5 sm:h-3" />
                    PIX
                  </div>
                  <svg className="w-5 sm:w-6 h-5 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                  </svg>
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="bg-[#00D632] hover:bg-[#00C02D] rounded-full w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center text-white font-bold text-xs sm:text-sm transition-all shadow-lg hover:shadow-xl min-w-[44px] min-h-[44px]">
                      <User className="w-5 h-5 sm:w-6 sm:h-6" />
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-0.5 sm:ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[260px] sm:w-[280px] bg-[#2C3E50]/98 backdrop-blur-md border border-white/10 p-0 z-[100] mr-2">
                    <div className="px-3 py-2.5 sm:px-4 sm:py-3 border-b border-white/10">
                      <p className="text-sm sm:text-base font-semibold text-white truncate">{profile.full_name || 'Usuário'}</p>
                      <p className="text-[11px] sm:text-xs text-white/60 mt-0.5 truncate">{profile.email}</p>
                    </div>
                    <div className="py-1 sm:py-1.5">
                      <DropdownMenuItem onClick={() => navigate("/profile")} className="px-2.5 py-2 sm:px-3 sm:py-2.5 text-white/90 hover:bg-white/5 cursor-pointer mx-1.5 sm:mx-2 rounded-lg">
                        <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 sm:mr-2.5 flex-shrink-0 text-white/70" strokeWidth={2} />
                       <span className="text-[13px] sm:text-sm">Minha Conta</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowDepositModal(true)} className="px-2.5 py-2 sm:px-3 sm:py-2.5 text-white/90 hover:bg-white/5 cursor-pointer mx-1.5 sm:mx-2 rounded-lg">
                        <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 sm:mr-2.5 flex-shrink-0 text-white/70" strokeWidth={2} />
                        <span className="text-[13px] sm:text-sm">Depósito</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowWithdrawalModal(true)} className="px-2.5 py-2 sm:px-3 sm:py-2.5 text-white/90 hover:bg-white/5 cursor-pointer mx-1.5 sm:mx-2 rounded-lg">
                        <HandCoins className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 sm:mr-2.5 flex-shrink-0 text-white/70" strokeWidth={2} />
                        <span className="text-[13px] sm:text-sm">Saque</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/transactions")} className="px-2.5 py-2 sm:px-3 sm:py-2.5 text-white/90 hover:bg-white/5 cursor-pointer mx-1.5 sm:mx-2 rounded-lg">
                        <History className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 sm:mr-2.5 flex-shrink-0 text-white/70" strokeWidth={2} />
                        <span className="text-[13px] sm:text-sm">Histórico</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowLanguageModal(true)} className="px-2.5 py-2 sm:px-3 sm:py-2.5 text-white/90 hover:bg-white/5 cursor-pointer mx-1.5 sm:mx-2 rounded-lg">
                        <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 sm:mr-2.5 flex-shrink-0 text-white/70" strokeWidth={2} />
                        <span className="text-[13px] sm:text-sm">Idioma</span>
                      </DropdownMenuItem>
                    </div>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator className="bg-white/10 my-0.5 sm:my-1" />
                        <div className="py-1 sm:py-1.5">
                          <DropdownMenuItem onClick={async () => {
                            try {
                              if (!user) return;
                              const currentBalance = profile?.balance || 0;
                              const { error } = await supabase
                                .from('profiles')
                                .update({
                                  balance: currentBalance + 30,
                                  has_deposited: true
                                })
                                .eq('id', user.id);
                              if (error) throw error;
                              await refreshProfile();
                              toast({
                                title: "Depósito simulado!",
                                description: "R$ 30,00 adicionados ao saldo",
                              });
                            } catch (error) {
                              toast({
                                title: "Erro ao depositar",
                                description: "Tente novamente",
                                variant: "destructive",
                              });
                            }
                          }} className="px-2.5 py-2 sm:px-3 sm:py-2.5 text-green-400 hover:bg-green-500/10 cursor-pointer mx-1.5 sm:mx-2 rounded-lg">
                            <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 sm:mr-2.5 flex-shrink-0" strokeWidth={2} />
                            <span className="text-[13px] sm:text-sm font-medium">Adicionar R$ 30 (Teste)</span>
                          </DropdownMenuItem>
                          {profile?.withdrawal_status === 'awaiting_fee' && (
                            <DropdownMenuItem onClick={async () => {
                              try {
                                if (!user) return;
                                const { error } = await supabase
                                  .from('profiles')
                                  .update({ withdrawal_status: 'processing' })
                                  .eq('id', user.id);
                                if (error) throw error;
                                await refreshProfile();
                              } catch (error) {
                                console.error('Erro ao simular pagamento:', error);
                              }
                            }} className="px-2.5 py-2 sm:px-3 sm:py-2.5 text-blue-400 hover:bg-blue-500/10 cursor-pointer mx-1.5 sm:mx-2 rounded-lg">
                              <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 sm:mr-2.5 flex-shrink-0" strokeWidth={2} />
                              <span className="text-[13px] sm:text-sm font-medium">Simular Pagamento Taxa</span>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={async () => {
                            try {
                              const { error } = await supabase.functions.invoke('reset-profile');
                              if (error) throw error;
                              await refreshProfile();
                              toast({ title: "Perfil resetado!", description: "Você pode testar a experiência do zero" });
                              window.location.reload();
                            } catch (error) {
                              toast({ title: "Erro ao resetar", description: "Tente novamente", variant: "destructive" });
                            }
                          }} className="px-2.5 py-2 sm:px-3 sm:py-2.5 text-yellow-400 hover:bg-yellow-500/10 cursor-pointer mx-1.5 sm:mx-2 rounded-lg">
                            <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 sm:mr-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span className="text-[13px] sm:text-sm font-medium">Resetar Perfil (Teste)</span>
                          </DropdownMenuItem>
                        </div>
                        <DropdownMenuSeparator className="bg-white/10 my-0.5 sm:my-1" />
                      </>
                    )}
                    <DropdownMenuSeparator className="bg-white/10 my-0.5 sm:my-1" />
                    <div className="py-1 sm:py-1.5">
                      <DropdownMenuItem onClick={() => signOut()} className="px-2.5 py-2 sm:px-3 sm:py-2.5 text-red-400 hover:bg-red-500/10 cursor-pointer mx-1.5 sm:mx-2 rounded-lg">
                        <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 sm:mr-2.5 flex-shrink-0" strokeWidth={2} />
                        <span className="text-[13px] sm:text-sm font-medium">Sair</span>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => navigate("/auth")}
                >
                  <User className="h-4 w-4 mr-2" />
                  Entrar
                </Button>
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_hsl(var(--neon-green-glow)/0.3)]"
                  onClick={() => navigate("/auth?tab=signup")}
                >
                  Cadastre-se
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {showBonusBanner && (
        <WelcomeBonusBanner
          onClose={() => setShowBonusBanner(false)}
          onRescue={handleRescueBonus}
        />
      )}

      <main className="container mx-auto py-2 sm:py-6 space-y-2 sm:space-y-6 md:space-y-8 pb-20">
        <section>
          <PromoCarousel />
        </section>

        <section>
          <WithdrawalNotifications />
        </section>

        <section>
          <CategoryTabs />
        </section>

        <section>
          <GameGrid />
        </section>
      </main>

      <Footer />

      <LanguageModal
        isOpen={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        onSelectLanguage={handleLanguageSelect}
      />

      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
      />

      <WithdrawalModal
        isOpen={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
      />

      <AlertDialog open={showRescueAlert} onOpenChange={setShowRescueAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você precisa fazer algum depósito</AlertDialogTitle>
            <AlertDialogDescription>
              Para resgatar o bônus em dólar, faça seu primeiro depósito.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowRescueAlert(false)}>Fechar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MobileMenu isOpen={showMobileMenu} onClose={() => setShowMobileMenu(false)} />

      {user && (
        <BottomNav
          onDepositClick={() => setShowDepositModal(true)}
          onMenuClick={() => setShowMobileMenu(true)}
        />
      )}
    </div>
  );
};

export default Index;
